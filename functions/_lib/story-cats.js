// 2026-11-14 (owner): story folders ("Klasörler"). Every story gets one main folder (chosen by the sender or
// found automatically) and extra folders found by rules, e.g. a price in the text -> also "angebote",
// a sponsor -> also "sponsoren", "Polizei/Sperrung/Brand" -> also "eil". Web and app show the same list
// (GET /api/stories?cats=1). Old stories without folders are sorted on the fly from their kind and text.

export const STORY_CATS = [
  { key: "berlin", icon: "🏘️", de: "Kiez & Berlin", tr: "Mahalleler & Berlin", en: "Kiez & Berlin" },
  { key: "info", icon: "ℹ️", de: "Info", tr: "Info", en: "Info" }, // 2026-11-14 (owner): own folder for "Info" stories
  { key: "eil", icon: "🚨", de: "Eilmeldungen", tr: "Acil / Son Dakika", en: "Breaking news" },
  { key: "verkehr", icon: "🚇", de: "Verkehr & BVG", tr: "Trafik & BVG", en: "Traffic & BVG" },
  { key: "deutschland", icon: "🇩🇪", de: "Deutschland", tr: "Almanya", en: "Germany" },
  { key: "welt", icon: "🌍", de: "Europa & Welt", tr: "Avrupa & Dünya", en: "Europe & World" },
  { key: "tuerkei", icon: "🇹🇷", de: "Türkei", tr: "Türkiye", en: "Turkey" },
  { key: "angebote", icon: "🏷️", de: "Angebote & Rabatte", tr: "İndirimler & Fırsatlar", en: "Deals & discounts" },
  { key: "sponsoren", icon: "🤝", de: "Sponsoren", tr: "Sponsorlar", en: "Sponsors" },
  { key: "neue", icon: "🆕", de: "Neu", tr: "Yeni", en: "New" },
  { key: "events", icon: "🎉", de: "Events", tr: "Etkinlik", en: "Events" },
  { key: "sport", icon: "⚽", de: "Sport", tr: "Spor", en: "Sport" },
  { key: "essen", icon: "🍽️", de: "Essen & Trinken", tr: "Yeme & İçme", en: "Food & drink" },
  { key: "wohnen", icon: "🏠", de: "Wohnen", tr: "Emlak & Kiralık", en: "Housing" },
  { key: "jobs", icon: "💼", de: "Jobs", tr: "İş İlanları", en: "Jobs" },
  { key: "aemter", icon: "🏛️", de: "Ämter & Info", tr: "Resmî İşler & Bilgi", en: "Offices & info" },
  { key: "fundsachen", icon: "🔎", de: "Verloren & Gefunden", tr: "Kayıp & Bulundu", en: "Lost & found" },
];
export const CAT_KEYS = STORY_CATS.map((c) => c.key);

// old story kinds (app chips, admin planner) -> folder
const KIND_MAP = {
  news: "berlin", neuigkeit: "berlin", info: "info", politics: "berlin", politik: "berlin",
  traffic: "verkehr", verkehr: "verkehr", event: "events", veranstaltung: "events",
  warn: "eil", warnung: "eil", eilmeldung: "eil", sport: "sport", jobs: "jobs", angebot: "angebote",
};

const RULES = [
  ["eil", /\b(eilmeldung|polizei|feuerwehr|sperrung|gesperrt|brand|unfall|evakuier|warnung|vermisst|acil|son dakika|kaza|yangın)\b/i],
  ["verkehr", /\b(bvg|s-bahn|u-bahn|ubahn|sbahn|tram|bus(se)?|ersatzverkehr|stau|baustelle|verkehr|trafik|[usm]\d{1,2}|ringbahn)\b/i],
  // 2026-11-14: "statt" alone is no offer ("findet … statt") – only "statt" next to a price counts
  ["angebote", /(\d+[.,]\d{2}\s*(€|eur)|\d+\s*(?:€|eur\b)|€\s*\d+|\d+\s*%\s*(rabatt|off|indirim)|\brabatt\b|\bangebot\b|\bindirim\b|\bkampanya\b|\bsale\b)/i],
  ["neue", /\b(neu(e|er|es)?|neueröffnung|eröffnung|eröffnet|yeni açılış|yeni|new opening)\b/i],
  ["events", /\b(event|konzert|festival|party|veranstaltung|markt|weihnachtsmarkt|etkinlik|konser|düğün|fest)\b/i],
  ["sport", /\b(hertha|union|alba|eisbären|fußball|fussball|bundesliga|spor|maç|turnier|marathon)\b/i],
  ["essen", /\b(restaurant|café|cafe|imbiss|döner|bäckerei|frühstück|kahvaltı|lokanta|pizza|burger|essen)\b/i],
  ["wohnen", /\b(wohnung|miete|zimmer|altbau|vermiet|wg|kiralık|daire|emlak|immobilie)\b/i],
  ["jobs", /\b(job|stelle|minijob|ausbildung|bewerbung|iş ilanı|eleman|personal gesucht|wir suchen)\b/i],
  ["aemter", /\b(bürgeramt|amt|jobcenter|ausländerbehörde|termin|antrag|formular|konsolosluk|konsulat|steuer)\b/i],
  ["fundsachen", /\b(verloren|gefunden|vermisst|entlaufen|kayıp|bulundu)\b/i],
  ["tuerkei", /\b(türkei|türkiye|istanbul|antalya|ankara|izmir|yalova|thy|turkish airlines)\b/i],
  ["welt", /\b(europa|eu-|weltweit|ukraine|usa|avrupa|dünya)\b/i],
  ["deutschland", /\b(deutschland|bundesregierung|bundestag|almanya|bundesweit)\b/i],
];

/** Folders of one story: [main, ...extra] (no duplicates, main first). */
export function storyCats({ chosen = "", kind = "", headline = "", subtext = "", deal = "", sponsor = false } = {}) {
  const text = `${headline} ${subtext}`;
  const out = [];
  const add = (k) => { if (k && CAT_KEYS.includes(k) && !out.includes(k)) out.push(k); };
  add(CAT_KEYS.includes(chosen) ? chosen : "");
  add(KIND_MAP[String(kind || "").toLowerCase()] || (CAT_KEYS.includes(kind) ? kind : ""));
  RULES.forEach(([k, re]) => { if (re.test(text)) add(k); });
  if (deal) add("angebote");
  if (sponsor) add("sponsoren");
  if (!out.length) add("berlin");
  return out.slice(0, 5);
}

// 2026-11-14 (owner: "read the story and put it into the right folder"): Workers AI reads title + text and picks
// 1–3 folders. Used when the sender chose "automatic"; the word rules stay as fallback (AI not reachable / unsure).
const AI_FOLDER_MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
export async function aiStoryCats(env, headline, subtext) {
  if (!env || !env.AI) return [];
  const list = STORY_CATS.map((c) => `${c.key} = ${c.de}`).join("; ");
  const prompt = `Ordne diesen Beitrag der Berliner Nachbarschafts-App "My Kiez Berlin" 1 bis 3 Ordnern zu, wichtigster zuerst.
Ordner: ${list}.
Regeln: "angebote" nur bei einem echten Preis oder Rabatt. "sponsoren" nur bei Werbung eines Geschäfts. "eil" nur bei akuten Warnungen/Störungen.
Antworte NUR mit JSON: {"cats":["key1","key2"]}

Titel: ${String(headline).slice(0, 300)}
Text: ${String(subtext).slice(0, 1500)}`;
  for (const model of AI_FOLDER_MODELS) {
    try {
      const r = await env.AI.run(model, { messages: [{ role: "user", content: prompt }], max_tokens: 60, temperature: 0 });
      const raw = typeof r?.response === "string" ? r.response : JSON.stringify(r?.response ?? r);
      const m = String(raw).match(/\{[\s\S]*\}/);
      if (!m) continue;
      const cats = (JSON.parse(m[0]).cats || []).map((k) => String(k).trim()).filter((k) => CAT_KEYS.includes(k));
      if (cats.length) return [...new Set(cats)].slice(0, 3);
    } catch (e) {
      // next model
    }
  }
  return [];
}

/** Stored text "a,b,c" -> list; empty -> computed from the story. */
export function catsOf(row) {
  const list = String(row?.cats || "").split(",").map((s) => s.trim()).filter((k) => CAT_KEYS.includes(k));
  return list.length ? list : storyCats({ kind: row?.kind, headline: row?.headline, subtext: row?.subtext, deal: row?.deal });
}

/** 2026-11-14 (owner: "a price in the text -> also in the discounts"): offer read from the text when the sender
 *  filled no offer fields. "Ayran 1 L 0,99 € statt 1,50 €" -> { what: headline, price: "0,99 €", old: "1,50 €" } */
export function dealFromText(headline, subtext) {
  const text = `${headline} ${subtext}`;
  const prices = [...text.matchAll(/(?<![\d.,])(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:[.,]\d{1,2})?)\s*(?:€|eur\b)/gi)].map((m) => m[1]);
  if (!prices.length) return "";
  const num = (p) => Number(String(p).replace(/\.(?=\d{3})/g, "").replace(",", "."));
  const sorted = [...prices].sort((a, b) => num(a) - num(b));
  const price = sorted[0] + " €";
  const old = prices.length > 1 && num(sorted[sorted.length - 1]) > num(sorted[0]) ? sorted[sorted.length - 1] + " €" : "";
  const what = String(headline || "").replace(/\s+/g, " ").trim().slice(0, 80);
  return what ? JSON.stringify({ what, price, old }) : "";
}
