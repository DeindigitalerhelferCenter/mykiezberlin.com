// POST /api/story-ai (admin token) – reads a story picture (or a video frame) with Cloudflare Workers AI
// and suggests headline and text in German + Turkish, Kiez, category and a web link found on the picture.
// Form field "image": JPEG/PNG/WebP, max 4 MB (the clients send a reduced copy).
import { isAdmin, json } from "../_lib/util.js";
import kiezData from "../_lib/kieze.json";

const MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
const KINDS = ["news", "event", "info", "traffic", "warn", "politics", "sport", "kultur", "angebot"];
const KIEZ_NAMES = kiezData.kieze.map((k) => k.name);
// Postal code -> Kiez (addresses on flyers usually carry one)
const KIEZ_BY_PLZ = {};
kiezData.kieze.forEach((k) => String(k.postalCodes || "").split(/[^\d]+/).filter((c) => c.length === 5).forEach((c) => { if (!KIEZ_BY_PLZ[c]) KIEZ_BY_PLZ[c] = k.name; }));

const PROMPT = `Du bist Redakteur der Berliner Lokal-App "My Kiez Berlin". Lies ALLES, was auf dem Bild steht (Überschriften, Datum, Uhrzeit, Ort, Preise, Webadressen) und beschreibe, was zu sehen ist.
Antworte NUR mit JSON, ohne Erklärung, genau in dieser Form:
{"headline_de":"…","headline_tr":"…","text_de":"…","text_tr":"…","place":"…","kind":"…","link":"…"}
Regeln:
- headline_de / headline_tr: kurze Schlagzeile (max. 60 Zeichen), Deutsch bzw. Türkisch.
- text_de / text_tr: 2–3 Sätze mit den wichtigsten Fakten vom Bild (was, wann, wo). Nichts erfinden.
- place: Berliner Kiez oder Ort vom Bild, sonst "".
- kind: eines von ${KINDS.join(", ")}.
- link: Webadresse, die auf dem Bild steht (mit https://), sonst "".`;

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
  const p = place.toLowerCase();
  const byName = p ? KIEZ_NAMES.find((k) => p.includes(k.toLowerCase()) || k.toLowerCase().includes(p)) : "";
  if (byName) return byName;
  for (const code of String(fullText || "").match(/\b1[0-4]\d{3}\b/g) || []) if (KIEZ_BY_PLZ[code]) return KIEZ_BY_PLZ[code];
  const t = String(fullText || "").toLowerCase();
  return KIEZ_NAMES.find((k) => k.length > 4 && t.includes(k.toLowerCase())) || "";
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
  if (!isAdmin(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.AI) return json({ error: "ai_unbound" }, 503);
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
      if (parseJson(raw)) break;
    } catch (e) {
      lastError = String(e && e.message || e).slice(0, 200);
    }
  }
  const data = parseJson(raw);
  if (!data) return json({ error: "ai_failed", detail: lastError || String(raw || "").slice(0, 200) }, 502);

  const hDe = clean(data.headline_de, 70);
  let hTr = clean(data.headline_tr, 70);
  const tDe = clean(data.text_de, 400);
  let tTr = clean(data.text_tr, 400);
  if (!hTr || !tTr) {
    const [h, t] = await Promise.all([hTr ? hTr : toTurkish(env, hDe), tTr ? tTr : toTurkish(env, tDe)]);
    hTr = clean(h, 70);
    tTr = clean(t, 400);
  }
  // Story fields: headline max 120, text max 500 – German first, then Turkish
  const headline = fit([hDe, hTr].filter(Boolean).join(" · "), 120);
  const half = 245;
  const subtext = [tDe && fit(tDe, half), tTr && "🇹🇷 " + fit(tTr, half)].filter(Boolean).join("\n\n").slice(0, 500);
  const kind = KINDS.includes(String(data.kind || "").toLowerCase()) ? String(data.kind).toLowerCase() : "news";
  return json({
    headline, subtext, kiez: matchKiez(clean(data.place, 60), [data.place, data.text_de, data.headline_de, raw].join(" ")), place: clean(data.place, 60), kind, link: webLink(data.link),
    headline_de: hDe, headline_tr: hTr, text_de: tDe, text_tr: tTr, model: used,
  });
}
