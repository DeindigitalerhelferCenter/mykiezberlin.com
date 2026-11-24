// POST /api/story-ai (admin token) – reads a story picture (or a video frame) with Cloudflare Workers AI
// and suggests headline and text in German + Turkish, Kiez, category and a web link found on the picture.
// Form field "image": JPEG/PNG/WebP, max 4 MB (the clients send a reduced copy).
import { isAdmin, json } from "../_lib/util.js";
import kiezData from "../_lib/kieze.json";
import { finishPair, mixedLang, tidy } from "../_lib/text-polish.js";

// 2026-11-24: planner text "TR · DE" + "🇹🇷 …\n\n🇩🇪 …" -> both languages checked and corrected, same layout back.
// Text without flags (only one language) is corrected as it is and the other language is added.
async function polishStoryText(env, headline, subtext) {
  const hp = headline.split(" · ");
  let hTr = hp.length > 1 ? hp[0] : "", hDe = hp.length > 1 ? hp.slice(1).join(" · ") : "";
  if (hp.length === 1) { if (mixedLang(headline, "de") || /[şğıİ]/.test(headline)) hTr = headline; else hDe = headline; }
  const tr = subtext.match(/🇹🇷\s*([\s\S]*?)(?=\n*🇩🇪|$)/), de = subtext.match(/🇩🇪\s*([\s\S]*?)(?=\n*🇹🇷|$)/);
  let tTr = tr ? tr[1].trim() : "", tDe = de ? de[1].trim() : "";
  if (!tr && !de && subtext.trim()) { if (/[şğıİ]/.test(subtext)) tTr = subtext.trim(); else tDe = subtext.trim(); }
  const d = await finishPair(env, { hDe, hTr, tDe, tTr }).catch(() => ({ hDe: tidy(hDe, "de", "headline"), hTr: tidy(hTr, "tr", "headline"), tDe: tidy(tDe, "de", "text"), tTr: tidy(tTr, "tr", "text") }));
  return {
    headline: [d.hTr, d.hDe].filter(Boolean).join(" · ").slice(0, 1000),
    subtext: [d.tTr && "🇹🇷 " + d.tTr, d.tDe && "🇩🇪 " + d.tDe].filter(Boolean).join("\n\n"),
  };
}

const MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
const KINDS = ["news", "event", "info", "traffic", "warn", "politics", "sport", "kultur", "angebot"];
const KIEZ_NAMES = kiezData.kieze.map((k) => k.name);
// Postal code -> Kiez (addresses on flyers usually carry one)
const KIEZ_BY_PLZ = {};
kiezData.kieze.forEach((k) => String(k.postalCodes || "").split(/[^\d]+/).filter((c) => c.length === 5).forEach((c) => { if (!KIEZ_BY_PLZ[c]) KIEZ_BY_PLZ[c] = k.name; }));

const PROMPT = `Du bist Redakteur der Berliner Lokal-App "My Kiez Berlin". Lies ALLES, was auf dem Bild steht (Überschriften, Datum, Uhrzeit, Ort, Preise, Webadressen) und beschreibe, was zu sehen ist.
Antworte NUR mit JSON, ohne Erklärung, genau in dieser Form:
{"headline_de":"…","headline_tr":"…","text_de":"…","text_tr":"…","place":"…","kind":"…","link":"…","date":"…"}
Regeln:
- date: das Datum der Veranstaltung / des Angebots, das auf dem Bild steht, als JJJJ-MM-TT (fehlt das Jahr, nimm ${new Date().getFullYear()}). Steht kein Datum auf dem Bild: "".
- headline_de / headline_tr: kurze Schlagzeile (max. 60 Zeichen), Deutsch bzw. Türkisch.
- text_de / text_tr: 2–3 Sätze mit den wichtigsten Fakten vom Bild (was, wann, wo). Nichts erfinden.
- place: Berliner Kiez oder Ort vom Bild, sonst "".
- kind: eines von ${KINDS.join(", ")}.
- link: Webadresse, die auf dem Bild steht (mit https://), sonst "".
- 2026-11-17: headline_de, headline_tr, text_de und text_tr dürfen NIE leer sein – egal welches Bild.
  Steht kaum oder kein Text auf dem Bild (Foto, Screenshot, Produkt, Person, Ort), beschreibe sachlich und kurz,
  was zu sehen ist. Steht der Text auf Türkisch oder einer anderen Sprache, übersetze ihn ins Deutsche und Türkische.`;

function toBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function parseJson(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    return null;
  }
}

function clean(value, max) {
  return String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

// Cuts at the last sentence end that still fits.
function fit(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : cut.slice(0, max - 1) + "…";
}

function matchKiez(place, fullText) {
  const p = place.toLowerCase().trim();
  // "Berlin" alone is no Kiez; "Berlin & Umgebung" only when the picture says Umgebung / Brandenburg
  const names = KIEZ_NAMES.filter((k) => k !== "Berlin & Umgebung");
  const byName = p && p !== "berlin" ? names.find((k) => p.includes(k.toLowerCase()) || (p.length > 4 && k.toLowerCase().includes(p))) : "";
  if (byName) return byName;
  for (const code of String(fullText || "").match(/\b1[0-4]\d{3}\b/g) || []) if (KIEZ_BY_PLZ[code]) return KIEZ_BY_PLZ[code];
  const t = String(fullText || "").toLowerCase();
  const named = names.find((k) => k.length > 4 && t.includes(k.toLowerCase()));
  if (named) return named;
  return /umgebung|brandenburg/.test(t) ? "Berlin & Umgebung" : "";
}

// Turkish text when the vision model left it out (translation model, German -> Turkish)
async function toTurkish(env, text) {
  if (!text) return "";
  try {
    const r = await env.AI.run("@cf/meta/m2m100-1.2b", { text, source_lang: "german", target_lang: "turkish" });
    return clean(r && r.translated_text, 400);
  } catch (e) {
    return "";
  }
}

// 2026-11-17 (owner: always translated): German text when the model only gave Turkish
async function toGerman(env, text) {
  if (!text) return "";
  try {
    const r = await env.AI.run("@cf/meta/m2m100-1.2b", { text, source_lang: "turkish", target_lang: "german" });
    return clean(r && r.translated_text, 400);
  } catch (e) {
    return "";
  }
}

// true when the model gave at least a headline or a text in one language
function hasText(d) {
  return !!(d && [d.headline_de, d.headline_tr, d.text_de, d.text_tr].some((v) => clean(v, 400)));
}

function webLink(value) {
  let v = clean(value, 300);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v.replace(/^\/+/, "");
  try {
    const url = new URL(v);
    return url.hostname.includes(".") ? url.toString() : "";
  } catch (e) {
    return "";
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  if (!env.AI) return json({ error: "ai_unbound" }, 503);
  // 2026-11-24 (owner): "🔤 Düzelt" in the story planner – checks the text that is already in the form
  // JSON { action: "polish", headline, subtext } -> { headline, subtext } (same layout: "TR · DE", "🇹🇷 …\n\n🇩🇪 …")
  if ((request.headers.get("content-type") || "").includes("application/json")) {
    const b = await request.json().catch(() => ({}));
    if (b.action !== "polish") return json({ error: "unknown_action" }, 400);
    return json(await polishStoryText(env, String(b.headline || ""), String(b.subtext || "")));
  }
  const form = await request.formData().catch(() => null);
  const file = form && form.get("image");
  if (!file || typeof file === "string" || !file.size) return json({ error: "missing_image" }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: "file_too_large" }, 413);
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return json({ error: "unsupported_file" }, 415);

  const dataUrl = `data:${file.type};base64,${toBase64(await file.arrayBuffer())}`;
  const messages = [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] }];
  let raw = null;
  let used = "";
  let lastError = "";
  for (const model of MODELS) {
    try {
      const result = await env.AI.run(model, { messages, max_tokens: 700, temperature: 0.2 });
      raw = typeof result?.response === "string" ? result.response : JSON.stringify(result?.response ?? result);
      used = model;
      if (hasText(parseJson(raw))) break; // 2026-11-17: empty answer -> try the next model
    } catch (e) {
      lastError = String(e && e.message || e).slice(0, 200);
    }
  }
  const data = parseJson(raw);
  if (!data) return json({ error: "ai_failed", detail: lastError || String(raw || "").slice(0, 200) }, 502);
  // 2026-11-17: never "ok" with empty fields – the admin sees a clear message instead
  if (!hasText(data)) return json({ error: "ai_empty" }, 422);

  let hDe = clean(data.headline_de, 70);
  let hTr = clean(data.headline_tr, 70);
  let tDe = clean(data.text_de, 400);
  let tTr = clean(data.text_tr, 400);
  // 2026-11-24 (owner): 100 % translated + correct writing – good model for missing / mixed parts, AI check, fixed rules
  // (see _lib/text-polish.js). The old m2m100 helpers below stay as the last reserve.
  const done = await finishPair(env, { hDe, hTr, tDe, tTr }).catch(() => null);
  if (done) {
    hDe = clean(done.hDe, 70) || hDe; hTr = clean(done.hTr, 70) || hTr;
    tDe = clean(done.tDe, 400) || tDe; tTr = clean(done.tTr, 400) || tTr;
  }
  if (!hDe || !tDe) {
    const [h, t] = await Promise.all([hDe ? hDe : toGerman(env, hTr), tDe ? tDe : toGerman(env, tTr)]);
    hDe = clean(h, 70) || hDe;
    tDe = clean(t, 400) || tDe;
  }
  if (!hTr || !tTr) {
    const [h, t] = await Promise.all([hTr ? hTr : toTurkish(env, hDe), tTr ? tTr : toTurkish(env, tDe)]);
    hTr = clean(h, 70);
    tTr = clean(t, 400);
  }
  // Story fields: headline max 120, text max 500.
  // 2026-11-19 (owner, "very important"): Turkish FIRST, German after it (was German first).
  // The German part is marked with 🇩🇪 so _lib/story-cats.js still finds it for the folder choice.
  const headline = fit([hTr, hDe].filter(Boolean).join(" · "), 120);
  const half = 240;
  const subtext = [tTr && "🇹🇷 " + fit(tTr, half), tDe && "🇩🇪 " + fit(tDe, half)].filter(Boolean).join("\n\n").slice(0, 500);
  const kind = KINDS.includes(String(data.kind || "").toLowerCase()) ? String(data.kind).toLowerCase() : "news";
  return json({
    headline, subtext, kiez: matchKiez(clean(data.place, 60), [data.place, data.text_de, data.headline_de, raw].join(" ")), place: clean(data.place, 60), kind, link: webLink(data.link),
    headline_de: hDe, headline_tr: hTr, text_de: tDe, text_tr: tTr, model: used,
    date: pictureDate(data.date),
  });
}

// 2026-11-19 (owner): date printed on the picture -> the planner moves the story to that day.
// Only today or later counts (a past date keeps today), and not more than one year ahead.
function pictureDate(value) {
  const m = String(value || "").match(/(\d{4})-(\d{1,2})-(\d{1,2})/) || String(value || "").match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return "";
  const [y, mo, d] = m[1].length === 4 ? [+m[1], +m[2], +m[3]] : [+m[3], +m[2], +m[1]];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return "";
  const berlinToday = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }); // YYYY-MM-DD
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const oneYearLater = `${+berlinToday.slice(0, 4) + 1}${berlinToday.slice(4)}`;
  if (iso < berlinToday || iso > oneYearLater) return "";
  return iso;
}
