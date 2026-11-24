// 2026-11-24 (owner): picture stories / news in German + Turkish must be 100 % translated and written correctly:
// capital letters, full stops, commas, grammar; no Turkish words left in the German text and no German words in the
// Turkish text (names, places, numbers, web addresses stay). Three steps:
//   1. translateText – good AI model (Mistral / Llama) first, the small m2m100 model only as a reserve
//   2. polishPair    – one AI pass checks both languages together (grammar, spelling, punctuation, missing words)
//   3. tidy          – fixed rules without AI (spaces, capital letter at the start, end mark, ALL-CAPS flyer text)
// Every AI answer is checked; when it looks wrong, the previous text stays (nothing gets worse).
const MODELS = ["@cf/mistralai/mistral-small-3.1-24b-instruct", "@cf/meta/llama-4-scout-17b-16e-instruct"];
const NAME = { de: "Deutsch", tr: "Türkisch" };
const DE_HINT = /(?<![\p{L}])(und|der|die|das|mit|für|über|von|ist|sind|nicht|eine?n?|auf|in|im|zum|zur|bei|wir|ihr|sie|uhr|jetzt|heute|morgen|neue?n?|frei|alle|eintritt|ab|bis)(?![\p{L}])/gu;
const TR_HINT = /(?<![\p{L}])(ve|bir|bu|için|ile|olan|olarak|çok|daha|gibi|kadar|sonra|önce|bugün|yarın|saat|yeni|var|yok|değil|indirim|büyük|ücretsiz|herkes)(?![\p{L}])/gu;
const URLS = /(https?:\/\/\S+|www\.\S+|\S+@\S+|\S+\.(de|com|net|org|tr|berlin|io)\b\S*)/gi;
const IS_URL = /(https?:\/\/|www\.|@|\.(de|com|net|org|tr|berlin|io)\b)/i;

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
}
function answer(out) {
  return String((out && (out.response ?? out.translated_text ?? out)) || "").trim().replace(/^["„“”']+|["“”']+$/g, "").trim();
}
function count(re, s) {
  return (String(s || "").toLowerCase().match(re) || []).length;
}

/** true when a text written in `lang` clearly carries the other language. */
export function mixedLang(text, lang) {
  const s = String(text || "").replace(URLS, " ");
  if (s.trim().length < 12) return false;
  const words = Math.max(1, s.trim().split(/\s+/).length);
  if (lang === "tr") return /[äÄß]/.test(s) || count(DE_HINT, s) / words > 0.12;
  // names written with a capital letter (Gümüş, Kızılay …) may carry Turkish letters in German text
  if (lang === "de") return /[şŞğĞı]/.test(s.replace(/(^|\s)[A-ZÇĞİÖŞÜ]\S*/g, " ")) || count(TR_HINT, s) / words > 0.12;
  return false;
}

function upperFirst(s, lang) {
  const i = s.search(/\p{L}/u);
  if (i < 0) return s;
  return s.slice(0, i) + s.charAt(i).toLocaleUpperCase(lang === "tr" ? "tr-TR" : "de-DE") + s.slice(i + 1);
}

/** Fixed rules (no AI). kind = "headline" (no end mark) or "text". */
export function tidy(text, lang, kind) {
  let s = String(text || "").replace(/\r/g, "");
  if (!s.trim()) return "";
  const loc = lang === "tr" ? "tr-TR" : "de-DE";
  // ALL-CAPS flyer text -> normal writing (short words like "BVG", "U8" stay)
  const letters = s.replace(/[^\p{L}]/gu, "");
  // (only Turkish: German nouns must stay capital – the AI step writes German ALL-CAPS text correctly)
  if (lang === "tr" && letters.length > 12 && letters === letters.toLocaleUpperCase(loc)) {
    s = s.toLocaleLowerCase(loc).replace(/(^|[.!?…]\s+|\n\s*)(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase(loc));
  }
  s = s
    .replace(/[ \t]+/g, " ")
    .replace(/ +([,.;:!?…)])/g, "$1")
    .replace(/([(„]) +/g, "$1")
    .replace(/([,;:])(?=[\p{L}])/gu, "$1 ")
    .replace(/([.!?])(?=[A-ZÄÖÜÇĞİŞ])/g, "$1 ")
    // "indirimli.yeni" -> "indirimli. yeni" (not in web addresses / e-mails)
    .split(" ").map((w) => (IS_URL.test(w) ? w : w.replace(/(\p{Ll}{2,})\.(\p{L}{2,})/gu, "$1. $2"))).join(" ")
    .replace(/\.{4,}/g, "…")
    .replace(/([!?])\1{2,}/g, "$1$1")
    .replace(/ *\n */g, "\n")
    .trim();
  // capital letter at the start of every sentence and line
  s = s.split("\n").map((line) => upperFirst(line, lang).replace(/([.!?…]\s+)(\p{Ll})/gu, (m, a, b) => a + b.toLocaleUpperCase(loc))).join("\n");
  if (kind === "text" && /[\p{L}\d)"“]$/u.test(s) && !/https?:\/\/\S+$/.test(s)) s += ".";
  if (kind === "headline") s = s.replace(/[.]+$/, "");
  return s;
}

/** Translation with the good model, checked; m2m100 only as a reserve. "" when nothing usable came back. */
export async function translateText(env, text, from, to) {
  const src = String(text || "").trim();
  if (!src || !env.AI || from === to) return "";
  const sys = `Du bist ein professioneller Übersetzer ${NAME[from]} -> ${NAME[to]} für eine Berliner Nachrichten-App. ` +
    `Übersetze VOLLSTÄNDIG – jedes Wort, kein Wort in der Ausgangssprache stehen lassen (außer Eigennamen, Orte, Marken, Zahlen, Preise, Webadressen). ` +
    `Korrekte Grammatik, Rechtschreibung, Groß- und Kleinschreibung und Zeichensetzung (Punkt, Komma) der Zielsprache. ` +
    (to === "tr" ? "Türkisch: korrekte Buchstaben ç ğ ı İ ö ş ü, natürliche Wortstellung. " : "Deutsch: Nomen groß, korrekte Umlaute ä ö ü ß. ") +
    "Nichts hinzufügen, nichts weglassen, keine Erklärung.";
  for (const model of MODELS) {
    try {
      const out = await withTimeout(env.AI.run(model, { messages: [{ role: "system", content: sys }, { role: "user", content: `Übersetze ins ${NAME[to]}e. Antworte NUR mit der Übersetzung:\n\n${src}` }], max_tokens: 600, temperature: 0.1 }), 9000);
      const t = answer(out);
      if (t && t !== src && !mixedLang(t, to) && t.length < src.length * 3 + 40) return t;
    } catch (e) { /* next model */ }
  }
  try {
    const out = await withTimeout(env.AI.run("@cf/meta/m2m100-1.2b", { text: src, source_lang: from === "de" ? "german" : "turkish", target_lang: to === "de" ? "german" : "turkish" }), 7000);
    const t = answer(out);
    if (t && t !== src) return t;
  } catch (e) { /* nothing */ }
  return "";
}

function parseJson(raw) {
  const m = String(raw || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

/** One AI pass over both languages. Input/Output: { hDe, hTr, tDe, tTr }. Keeps a field when the answer looks wrong. */
export async function polishPair(env, p) {
  const src = { headline_de: p.hDe || "", headline_tr: p.hTr || "", text_de: p.tDe || "", text_tr: p.tTr || "" };
  if (!env.AI || !Object.values(src).some(Boolean)) return { ...p };
  const sys = "Du bist Korrektor (Deutsch + Türkisch) einer Berliner Nachrichten-App. Du bekommst JSON mit Überschrift und Text auf Deutsch und Türkisch. " +
    "Korrigiere NUR: Grammatik, Rechtschreibung, Groß- und Kleinschreibung (Deutsch: Nomen groß; Satzanfang groß; keine GROSSBUCHSTABEN-Sätze), Zeichensetzung (Punkt am Satzende, Kommas), " +
    "Umlaute/türkische Buchstaben (ä ö ü ß / ç ğ ı İ ö ş ü). Steht im deutschen Feld ein türkisches Wort oder im türkischen Feld ein deutsches Wort, übersetze es " +
    "(Eigennamen, Orte, Marken, Zahlen, Preise, Webadressen bleiben). Deutsch und Türkisch müssen inhaltlich gleich sein – fehlt in einer Sprache ein Fakt, ergänze ihn aus der anderen. " +
    "Nichts erfinden, keine Erklärung. Antworte NUR mit JSON in derselben Form.";
  for (const model of MODELS) {
    try {
      const out = await withTimeout(env.AI.run(model, { messages: [{ role: "system", content: sys }, { role: "user", content: JSON.stringify(src) }], max_tokens: 900, temperature: 0.1 }), 12000);
      const j = parseJson(typeof out?.response === "string" ? out.response : JSON.stringify(out?.response ?? out ?? ""));
      if (!j) continue;
      const pick = (key, old, lang) => {
        const v = String(j[key] || "").trim();
        if (!old) return v && !mixedLang(v, lang) ? v : old;
        if (!v || mixedLang(v, lang)) return old;
        if (v.length < old.length * 0.6 || v.length > old.length * 1.8 + 30) return old; // shortened / invented -> keep
        return v;
      };
      return { hDe: pick("headline_de", src.headline_de, "de"), hTr: pick("headline_tr", src.headline_tr, "tr"), tDe: pick("text_de", src.text_de, "de"), tTr: pick("text_tr", src.text_tr, "tr") };
    } catch (e) { /* next model */ }
  }
  return { ...p };
}

/** Full chain for a German/Turkish pair: fill missing side, re-translate mixed text, AI check, fixed rules. */
export async function finishPair(env, p) {
  let { hDe = "", hTr = "", tDe = "", tTr = "" } = p;
  // a side that is missing or clearly in the wrong language is translated from the other side
  if ((!hTr || mixedLang(hTr, "tr")) && hDe) hTr = (await translateText(env, hDe, "de", "tr")) || hTr;
  if ((!tTr || mixedLang(tTr, "tr")) && tDe) tTr = (await translateText(env, tDe, "de", "tr")) || tTr;
  if ((!hDe || mixedLang(hDe, "de")) && hTr) hDe = (await translateText(env, hTr, "tr", "de")) || hDe;
  if ((!tDe || mixedLang(tDe, "de")) && tTr) tDe = (await translateText(env, tTr, "tr", "de")) || tDe;
  const q = await polishPair(env, { hDe, hTr, tDe, tTr }).catch(() => ({ hDe, hTr, tDe, tTr }));
  return {
    hDe: tidy(q.hDe, "de", "headline"), hTr: tidy(q.hTr, "tr", "headline"),
    tDe: tidy(q.tDe, "de", "text"), tTr: tidy(q.tTr, "tr", "text"),
  };
}
