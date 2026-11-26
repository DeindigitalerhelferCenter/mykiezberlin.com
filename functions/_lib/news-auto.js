// 2026-11-22 (owner): news stories for the admin, every 2 hours from 06:00 to 22:00 (Berlin time).
// - Sources (only headline + teaser are read, never whole articles or photos): tagesschau Berlin + Inland,
//   rbb24, Polizei Berlin, Tagesspiegel Berlin, Berliner Zeitung.
// - The AI (Workers AI) picks the 5 best topics and writes its OWN short text in German and Turkish.
//   Urgent news ("Eilmeldung", tagesschau breakingNews, Polizei warnings) are on top and do not count to the 5.
// - The admin ticks topics and publishes them (picture = chosen/uploaded background or one of our templates,
//   text on top of the picture). Switch "newsAuto" (/api/flags): every new list publishes urgent + the first 3 itself.
// - No cron needed: a new list is made by the first request after each slot (admin panel, app, or any visitor
//   through GET /api/stories, at most one check every 5 minutes).
import { readFlags } from "../api/flags.js";
import { renderNewsImage } from "./news-image.js";
import { metaDeleteStory } from "./meta-social.js"; // 2026-11-23: edited story -> old Facebook post out
import { telegramDeleteStory } from "./telegram.js";
import { tidy } from "./text-polish.js";

export const NEWS_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20, 22];
export const NEWS_TOPICS = 10; // 2026-11-23 (owner): 10 topics per list (was 5)
export const AUTO_COUNT = 3;
export const TEMPLATE_COUNT = 6;
const AI_MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
const UA = { "user-agent": "MyKiezBerlin/1.0 (+https://mykiezberlin.com)" };

export async function ensureNews(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS news_slots (slot TEXT PRIMARY KEY, created_at INTEGER, items TEXT, auto_done INTEGER DEFAULT 0)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS news_state (id TEXT PRIMARY KEY, value INTEGER)`),
    // 2026-11-22 (owner): own background pictures of the admin (R2 key stories/news-bglib-<uuid>.jpg)
    database.prepare(`CREATE TABLE IF NOT EXISTS news_bgs (key TEXT PRIMARY KEY, name TEXT, created_at INTEGER)`),
  ]);
  // 2026-11-23 (owner "UYGULA 8"): a background has a topic tag (genel / spor / kultur / acil)
  if (!bgTagReady) { await database.prepare(`ALTER TABLE news_bgs ADD COLUMN tag TEXT DEFAULT ''`).run().catch(() => {}); bgTagReady = true; }
}
let bgTagReady = false;

// ---- 2026-11-22 (owner): admin settings that stay (interval, language, backgrounds) + blocked topics ----
export const GAP_CHOICES = [0, 15, 30, 60, 90, 120];
const DEFAULT_SETTINGS = { gap: 30, lang: "tr-de", bgMode: "rotate", bgPicks: [], autoOnlyVisible: true };

export async function readSettings(database) {
  await ensureNews(database);
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'settings'`).first().catch(() => null);
  let s = {};
  try { s = JSON.parse((row && row.value) || "{}") || {}; } catch (e) { s = {}; }
  const out = { ...DEFAULT_SETTINGS, ...s };
  if (!GAP_CHOICES.includes(Number(out.gap))) out.gap = 30;
  out.gap = Number(out.gap);
  if (!["tr-de", "tr-en", "de", "tr"].includes(out.lang)) out.lang = "tr-de";
  if (!["rotate", "pick"].includes(out.bgMode)) out.bgMode = "rotate";
  out.bgPicks = (Array.isArray(out.bgPicks) ? out.bgPicks : []).map(String).filter((x) => /^(t[1-9]|b:stories\/news-bglib-[0-9a-f-]+\.(jpg|png))$/.test(x)).slice(0, 12);
  return out;
}

export async function saveSettings(database, patchIn) {
  const cur = await readSettings(database);
  const next = { ...cur };
  if (patchIn.gap != null && GAP_CHOICES.includes(Number(patchIn.gap))) next.gap = Number(patchIn.gap);
  if (patchIn.lang != null && ["tr-de", "tr-en", "de", "tr"].includes(patchIn.lang)) next.lang = patchIn.lang;
  if (patchIn.bgMode != null && ["rotate", "pick"].includes(patchIn.bgMode)) next.bgMode = patchIn.bgMode;
  if (Array.isArray(patchIn.bgPicks)) next.bgPicks = patchIn.bgPicks.map(String);
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('settings', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(JSON.stringify(next)).run();
  return readSettings(database);
}

export async function listBackgrounds(database) {
  await ensureNews(database);
  const { results } = await database.prepare(`SELECT key, name, created_at, tag FROM news_bgs ORDER BY created_at ASC`).all();
  return results || [];
}

/** Topics the admin deleted – they never come back in a new analysis. */
export async function readBlocked(database) {
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'blocked'`).first().catch(() => null);
  try { return JSON.parse((row && row.value) || "[]") || []; } catch (e) { return []; }
}
export async function addBlocked(database, orig) {
  const list = (await readBlocked(database)).filter((x) => x !== orig);
  list.push(orig);
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('blocked', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(JSON.stringify(list.slice(-500))).run();
}

/** Next background by the admin settings: {theme, backgroundKey}. Template "tN" = colour N; own picture = picture + rotating colour. */
async function chooseBackground(database, settings, it) {
  // 2026-11-23 (owner "UYGULA 8"): the background fits the topic (see topicBackground); null = the old way below
  if (it) { const t = await topicBackground(database, settings, it).catch(() => null); if (t) return t; }
  const bgs = (await listBackgrounds(database)).map((b) => `b:${b.key}`);
  let cands = settings.bgMode === "pick" ? settings.bgPicks.filter((x) => x.startsWith("t") || bgs.includes(x)) : [];
  // 2026-11-23 (owner: "sadece yüklediğim arka planlar"): when own pictures exist, the old templates are not used (not deleted)
  if (bgs.length) cands = cands.filter((x) => bgs.includes(x));
  if (!cands.length) cands = bgs.length ? bgs : [...Array.from({ length: TEMPLATE_COUNT }, (_, i) => `t${i + 1}`), ...bgs];
  const n = await nextTheme(database); // counter 0..5 (also used for the colour)
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'bgturn'`).first().catch(() => null);
  const turn = ((row ? Number(row.value) : -1) + 1) % cands.length;
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('bgturn', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(turn).run();
  const c = cands[turn];
  if (c.startsWith("t")) return { theme: (Number(c.slice(1)) - 1) % TEMPLATE_COUNT, backgroundKey: "" };
  return { theme: n, backgroundKey: c.slice(2) };
}

/** Berlin date + hour now, and the current slot ("2026-11-22-14") or "" outside 06–22. */
export function berlinSlot(now = Date.now()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(now)).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour);
  const slotHour = [...NEWS_SLOTS].reverse().find((h) => h <= hour);
  if (slotHour == null) return { slot: "", hour };
  return { slot: `${parts.year}-${parts.month}-${parts.day}-${String(slotHour).padStart(2, "0")}`, hour };
}

function strip(s) {
  return String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim();
}

async function rss(url, source, limit = 12) {
  try {
    const res = await fetch(url, { headers: UA, cf: { cacheTtl: 300 }, signal: AbortSignal.timeout(6000) }); // 2026-11-22: max 6 s per source
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)].slice(0, limit).map((m) => {
      const it = m[0];
      const get = (tag) => strip((it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1]);
      return { title: get("title"), teaser: get("description").slice(0, 400), url: get("link"), date: Date.parse(get("pubDate")) || 0, source };
    }).filter((x) => x.title && x.url);
  } catch (e) {
    return [];
  }
}

async function tagesschau(query, source) {
  try {
    const res = await fetch(`https://www.tagesschau.de/api2u/news/?${query}`, { headers: UA, cf: { cacheTtl: 300 }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const d = await res.json();
    return (d.news || []).filter((n) => n.title && n.shareURL).slice(0, 12)
      .map((n) => ({ title: n.title, teaser: String(n.firstSentence || "").slice(0, 400), url: n.shareURL, date: Date.parse(n.date) || 0, source, breaking: !!n.breakingNews }));
  } catch (e) {
    return [];
  }
}

export async function collectNews() {
  const lists = await Promise.all([
    tagesschau("regions=3", "tagesschau Berlin"),
    tagesschau("ressort=inland", "tagesschau"),
    rss("https://www.rbb24.de/aktuell/index.xml/feed=rss.xml", "rbb24"),
    rss("https://www.berlin.de/polizei/polizeimeldungen/index.php/rss", "Polizei Berlin", 8),
    rss("https://www.tagesspiegel.de/contentexport/feed/berlin", "Tagesspiegel"),
    rss("https://www.berliner-zeitung.de/feed.xml", "Berliner Zeitung"),
    // 2026-11-21 (owner): more Berlin sources (checked: RSS works)
    rss("https://www.morgenpost.de/berlin/rss", "Berliner Morgenpost"),
    rss("https://taz.de/!p4649;rss/", "taz Berlin"),
    rss("https://www.berliner-kurier.de/feed.xml", "Berliner Kurier"),
    // 2026-11-23 (owner: "spor veya diğer dallarda Berlin ve Almanya'daki önemli haberler"): sport, culture, economy (checked: work)
    tagesschau("ressort=sport", "tagesschau Sport"),
    rss("https://www.rbb24.de/sport/index.xml/feed=rss.xml", "rbb24 Sport", 8),
    rss("https://www.rbb24.de/kultur/index.xml/feed=rss.xml", "rbb24 Kultur", 6),
    tagesschau("ressort=wirtschaft", "tagesschau Wirtschaft"),
  ]);
  const since = Date.now() - 12 * 3600000;
  const seen = new Set();
  return lists.flat().filter((n) => {
    const k = n.title.toLowerCase().replace(/[^a-z0-9äöüß]/g, "").slice(0, 40);
    if (seen.has(k) || (n.date && n.date < since)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => b.date - a.date).filter((n, i, arr) => !arr.slice(0, i).some((m) => sameTopic(m.title, n.title))) // 2026-11-23: same event from two sources = once
    .slice(0, 70);
}

// 2026-11-22 (owner): the text must stay close to the real source -> read the first paragraphs of the article
async function articleText(url) {
  try {
    const res = await fetch(url, { headers: UA, cf: { cacheTtl: 900 }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return "";
    const html = (await res.text()).slice(0, 400000);
    const meta = (html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i) || [])[1] || "";
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => strip(m[1])).filter((t) => t.length > 60 && !/cookie|javascript|abonn|newsletter|©/i.test(t));
    return strip(meta + " " + paras.slice(0, 6).join(" ")).slice(0, 1800);
  } catch (e) {
    return "";
  }
}

async function aiWrite(env, items) {
  if (!env.AI || !items.length) return null;
  const list = items.map((n, i) => `### ${i}\nQuelle: ${n.source}\nTitel: ${n.title}\nText: ${(n.article || n.teaser).slice(0, 1500)}`).join("\n\n");
  const prompt = `Du schreibst Kurz-Nachrichten für die Berliner Nachbarschafts-App "My Kiez Berlin". Für jede Meldung unten:\n` +
    `- Nutze NUR Fakten aus dem Quelltext, erfinde nichts, keine Vermutungen. Bleib inhaltlich sehr nah an der Quelle, aber schreib es mit eigenen Worten (nicht wörtlich abschreiben).\n` +
    `- "tr_title"/"de_title"/"en_title": kurze Schlagzeile (max. 60 Zeichen) auf Türkisch / Deutsch / Englisch.\n` +
    `- "tr_text"/"de_text"/"en_text": mittellange Beschreibung, 3–4 Sätze (max. 380 Zeichen): was, wo, wann, Folgen. Die drei Texte haben denselben Inhalt (genaue Übersetzung).\n` +
    `Antworte NUR mit JSON: [{"i":0,"tr_title":"","tr_text":"","de_title":"","de_text":"","en_title":"","en_text":""}]\n\n${list}`;
  for (const model of AI_MODELS) {
    try {
      const out = await env.AI.run(model, { messages: [{ role: "user", content: prompt }], max_tokens: 4000, temperature: 0.2 });
      const text = typeof out === "string" ? out : out?.response ?? JSON.stringify(out);
      const m = String(typeof text === "string" ? text : JSON.stringify(text)).match(/\[[\s\S]*\]/);
      if (!m) continue;
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (e) {
      // next model
    }
  }
  return null;
}

function isUrgent(n) {
  return !!n.breaking || /eilmeldung|\+\+\+|breaking|unwetter|evakuier|großeinsatz|großbrand|warnung|amok|terror/i.test(n.title + " " + n.teaser);
}

async function aiPick(env, news) {
  if (!env.AI || !news.length) return null;
  const list = news.map((n, i) => `${i}. [${n.source}] ${n.title} – ${n.teaser.slice(0, 200)}`).join("\n");
  const prompt = `Du bist Redakteur der Berliner Nachbarschafts-App "My Kiez Berlin". Hier sind aktuelle Meldungen:\n${list}\n\n` +
    `Wähle die ${NEWS_TOPICS + 3} wichtigsten und interessantesten Themen für Menschen in Berlin (Berlin zuerst, dann Deutschland). ` +
    `Markiere echte Eil-/Warnmeldungen mit "urgent": true. Schreibe zu jedem Thema mit EIGENEN Worten (nicht abschreiben): ` +
    `"de_title" (max. 70 Zeichen), "de_text" (2 kurze Sätze, max. 240 Zeichen), "tr_title" (Türkisch, max. 70), "tr_text" (Türkisch, max. 240). ` +
    `Antworte NUR mit JSON: [{"i": Nummer, "urgent": false, "de_title": "", "de_text": "", "tr_title": "", "tr_text": ""}]`;
  for (const model of AI_MODELS) {
    try {
      const out = await env.AI.run(model, { messages: [{ role: "user", content: prompt }], max_tokens: 2200 });
      const text = typeof out === "string" ? out : out?.response ?? JSON.stringify(out);
      const m = String(typeof text === "string" ? text : JSON.stringify(text)).match(/\[[\s\S]*\]/);
      if (!m) continue;
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (e) {
      // next model
    }
  }
  return null;
}

// 2026-11-22 (owner: "otomatik haber çalışmıyor"): the background work is cut after ~30 s -> every slow step has its own time limit
export function withTimeout(promise, ms, fallback = null) {
  let t;
  return Promise.race([Promise.resolve(promise).catch(() => fallback), new Promise((r) => { t = setTimeout(() => r(fallback), ms); })]).finally(() => clearTimeout(t));
}

// 2026-11-22: fast choice – only numbers (no texts), the texts are written later topic by topic (writeSome)
async function aiPickFast(env, news) {
  if (!env.AI || !news.length) return null;
  const list = news.map((n, i) => `${i}. [${n.source}] ${n.title}`).join("\n");
  const prompt = `Du bist Redakteur der Berliner Nachbarschafts-App "My Kiez Berlin". Aktuelle Meldungen:\n${list}\n\n` +
    `Wähle die ${NEWS_TOPICS + 3} wichtigsten Themen für Menschen in Berlin (Berlin zuerst). Echte Eil-/Warnmeldungen: "u": true. ` +
    `Jedes Thema nur EINMAL: keine zwei Meldungen über dasselbe Ereignis. Mische die Bereiche: Berlin, Deutschland, Sport, Kultur, Wirtschaft. ` + // 2026-11-23 (owner)
    `Antworte NUR mit JSON: [{"i": Nummer, "u": false}]`;
  for (const model of AI_MODELS) {
    try {
      const out = await withTimeout(env.AI.run(model, { messages: [{ role: "user", content: prompt }], max_tokens: 300 }), 9000);
      if (!out) continue;
      const text = typeof out === "string" ? out : out?.response ?? JSON.stringify(out);
      const m = String(typeof text === "string" ? text : JSON.stringify(text)).match(/\[[\s\S]*\]/);
      if (!m) continue;
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr) && arr.length) return arr.map((x) => ({ i: x.i, urgent: !!(x.u || x.urgent) }));
    } catch (e) {
      // next model
    }
  }
  return null;
}

const cut = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// 2026-11-21 (owner): the list was never made – the background work (waitUntil, max. 30 s) was cut while it
// read 6 sources, asked the AI and wrote all texts; the slot stayed claimed with an EMPTY list for ever.
// Now in steps: 1) pickList (sources + AI choice, short texts), saved at once; 2) writeSome writes the long
// texts of 2 topics per step; an empty or half list is taken up again by the next request.
export async function pickList(env, opts = {}) {
  const skip = opts.exclude instanceof Set ? opts.exclude : new Set();
  const all = await collectNews();
  // 2026-11-22 (owner): "Şimdi analiz et" must bring NEW topics – shown / deleted ones are left out (if enough are left)
  const skipList = [...skip];
  // 2026-11-23 (owner: "aynı veya çok yakın haberler kesinlikle gelmemeli"): also near topics are left out, and the
  // old fallback (all news again when few were new) is gone – better fewer topics than the same ones again
  const fresh = all.filter((n) => !skip.has(cut(n.title, 160)) && !skipList.some((x) => sameTopic(x, n.title)));
  const news = fresh;
  // 2026-11-22: fast choice first (numbers only, max 9 s per model); the old full pick only with opts.fullPick
  const fast = opts.fullPick ? null : await aiPickFast(env, news);
  if (fast) {
    const out = fast.map((p) => {
      const n = news[Number(p.i)];
      if (!n) return null;
      return { urgent: !!p.urgent || isUrgent(n), source: n.source, url: n.url, teaser: cut(n.teaser, 400), title_de: cut(n.title, 90), text_de: cut(n.teaser, 420), title_tr: "", text_tr: "", title_en: "", text_en: "", orig: cut(n.title, 160), written: false };
    }).filter(Boolean).slice(0, NEWS_TOPICS + 3);
    const outU = dropSameTopics(out, (x) => x.orig); // 2026-11-23: the AI may pick one event twice
    out.length = 0; out.push(...outU);
    if (out.length) {
      const u = out.filter((x) => x.urgent).slice(0, 3);
      const r = out.filter((x) => !x.urgent).slice(0, NEWS_TOPICS);
      return [...u, ...r].map((x, i) => ({ ...x, id: `n${i + 1}`, published: "" }));
    }
  }
  const picked = opts.fullPick ? await aiPick(env, news) : null;
  let items;
  if (picked) {
    items = picked.map((p) => {
      const n = news[Number(p.i)];
      if (!n) return null;
      return {
        urgent: !!p.urgent || isUrgent(n), source: n.source, url: n.url, teaser: cut(n.teaser, 400),
        title_de: cut(p.de_title || n.title, 90), text_de: cut(p.de_text, 420), title_tr: cut(p.tr_title, 90), text_tr: cut(p.tr_text, 420), title_en: "", text_en: "", orig: cut(n.title, 160), written: false,
      };
    }).filter(Boolean).slice(0, NEWS_TOPICS + 3);
  } else {
    items = news.slice(0, NEWS_TOPICS + 3).map((n) => ({ urgent: isUrgent(n), source: n.source, url: n.url, teaser: cut(n.teaser, 400), title_de: cut(n.title, 90), text_de: cut(n.teaser, 420), title_tr: "", text_tr: "", orig: cut(n.title, 160), noAi: !env.AI, written: !env.AI })); // 2026-11-22: AI writes the texts later
  }
  const urgent = items.filter((x) => x.urgent).slice(0, 3);
  const normal = items.filter((x) => !x.urgent).slice(0, NEWS_TOPICS);
  return [...urgent, ...normal].map((x, i) => ({ ...x, id: `n${i + 1}`, published: "" }));
}

/** Writes the long TR/DE/EN texts of up to `max` topics that are not written yet. Returns how many are still open. */
export async function writeSome(env, items, max = 2) {
  const todo = items.filter((x) => x.written === false).slice(0, max);
  for (const it of todo) {
    const article = await withTimeout(articleText(it.url), 6000, "");
    // 2026-11-23 (owner "UYGULA 1-4"): the 3rd try does not ask the AI again (30 s limit) – it takes the article text
    const lastTry = (it.tries || 0) >= 2;
    const w = lastTry ? null : await withTimeout(aiWrite(env, [{ source: it.source, title: it.orig, teaser: it.teaser || "", article }]), 16000, null); // 2026-11-22: max 16 s, else the short text stays
    const x = w && w[0];
    if (x) {
      if (x.tr_title) it.title_tr = cut(x.tr_title, 90);
      if (x.tr_text) it.text_tr = cut(x.tr_text, 420);
      if (x.de_title) it.title_de = cut(x.de_title, 90);
      if (x.de_text) it.text_de = cut(x.de_text, 420);
      if (x.en_title) it.title_en = cut(x.en_title, 90);
      if (x.en_text) it.text_en = cut(x.en_text, 420);
    }
    // 2026-11-23 (owner: "metin boş yayınlandı"): no text (AI failed, source without short text) -> not "done":
    // the AI tries again (up to 3 times); then the first sentences of the article itself (not too short), translated
    if (!hasText(it) && !lastTry) { it.tries = (it.tries || 0) + 1; continue; }
    if (!hasText(it)) {
      const t = firstSentences(article || it.teaser || "");
      if (t) { it.text_de = t; it.text_tr = ""; it.textFromArticle = true; }
    }
    // 2026-11-23: Turkish missing / German -> translate; try the whole step up to 3 times before giving up
    const trOk = await withTimeout(ensureTr(env, it), 12000, false);
    it.tries = (it.tries || 0) + 1;
    if (!trOk && it.tries < 3) continue;
    if (!hasText(it)) it.noText = true; else delete it.noText; // 2026-11-23: not shared by the auto mode, shown in the panel
    it.written = true; // also when the AI failed: the short texts from step 1 stay
    delete it.teaser;
  }
  return items.filter((x) => x.written === false).length;
}

/** Builds one list: urgent items first (not counted), then NEWS_TOPICS items. */
export async function buildList(env) {
  const news = await collectNews();
  const picked = await aiPick(env, news);
  let items = [];
  if (picked) {
    items = picked.map((p) => {
      const n = news[Number(p.i)];
      if (!n) return null;
      return {
        urgent: !!p.urgent || isUrgent(n), source: n.source, url: n.url, teaser: n.teaser, title: n.title,
        title_de: cut(p.de_title || n.title, 90), text_de: cut(p.de_text, 420), title_tr: cut(p.tr_title, 90), text_tr: cut(p.tr_text, 420), title_en: "", text_en: "", orig: cut(n.title, 160),
      };
    }).filter(Boolean).slice(0, NEWS_TOPICS + 3);
    // 2026-11-22 (owner): medium text close to the real source, TR + DE + EN
    await Promise.all(items.map(async (it) => { it.article = await articleText(it.url); }));
    const written = await aiWrite(env, items).catch(() => null);
    if (written) written.forEach((w) => {
      const it = items[Number(w.i)];
      if (!it) return;
      if (w.tr_title) it.title_tr = cut(w.tr_title, 90);
      if (w.tr_text) it.text_tr = cut(w.tr_text, 420);
      if (w.de_title) it.title_de = cut(w.de_title, 90);
      if (w.de_text) it.text_de = cut(w.de_text, 420);
      if (w.en_title) it.title_en = cut(w.en_title, 90);
      if (w.en_text) it.text_en = cut(w.en_text, 420);
    });
    items.forEach((it) => { delete it.article; delete it.teaser; delete it.title; });
  } else {
    // no AI: headlines only (the admin writes the text before publishing)
    items = news.slice(0, NEWS_TOPICS + 3).map((n) => ({ urgent: isUrgent(n), source: n.source, url: n.url, title_de: cut(n.title, 90), text_de: "", title_tr: "", text_tr: "", orig: cut(n.title, 160), noAi: true }));
  }
  const urgent = items.filter((x) => x.urgent).slice(0, 3);
  const normal = items.filter((x) => !x.urgent).slice(0, NEWS_TOPICS);
  return [...urgent, ...normal].map((x, i) => ({ ...x, id: `n${i + 1}`, published: "" }));
}

export async function getSlot(database, slot) {
  const row = await database.prepare(`SELECT slot, created_at, items, auto_done FROM news_slots WHERE slot = ?`).bind(slot).first();
  if (!row) return null;
  let items = [];
  try { items = JSON.parse(row.items || "[]"); } catch (e) { items = []; }
  return { slot: row.slot, created_at: row.created_at, items, auto_done: row.auto_done };
}

export async function saveItems(database, slot, items) {
  await applyAdminChoices(database, items); // 2026-11-23: hidden / deleted by the admin stay so
  await database.prepare(`UPDATE news_slots SET items = ? WHERE slot = ?`).bind(JSON.stringify(items), slot).run();
}

/** Makes the list of the current slot if it does not exist yet. Returns the slot or null outside 06–22. */
export async function ensureCurrentSlot(env, database, opts = {}) {
  await ensureNews(database);
  const { slot } = berlinSlot();
  if (!slot) return null;
  const now = Date.now();
  let have = await getSlot(database, slot);
  if (!have) {
    // claim the slot first, so two requests do not build it twice
    const claim = await database.prepare(`INSERT OR IGNORE INTO news_slots (slot, created_at, items) VALUES (?, ?, '[]')`).bind(slot, now).run();
    if (!claim.meta || !claim.meta.changes) return getSlot(database, slot);
    have = { slot, created_at: now, items: [], auto_done: 0 };
  } else if (!have.items.length) {
    // 2026-11-21: empty list (the work before was cut) -> try again after 2 minutes, one request at a time
    if (now - have.created_at < 2 * 60000) return have;
    const again = await database.prepare(`UPDATE news_slots SET created_at = ? WHERE slot = ? AND created_at = ? AND items = '[]'`).bind(now, slot, have.created_at).run();
    if (!again.meta || !again.meta.changes) return have;
  } else {
    // list is there: write the long texts step by step
    if (have.items.some((x) => x.written === false)) {
      await writeSome(env, have.items, opts.write || 2);
      await saveItems(database, slot, have.items);
    }
    return have;
  }
  const blocked = new Set(await readBlocked(database).catch(() => []));
  const seen = await seenTopics(database).catch(() => blocked); // 2026-11-23 (owner): no topic of the last 24 h again
  const items = await pickList(env, { exclude: seen, blocked }).catch(() => []);
  await saveItems(database, slot, items);
  if (items.length && opts.write) { await writeSome(env, items, opts.write); await saveItems(database, slot, items); }
  return getSlot(database, slot);
}

/** 2026-11-22 (owner): colours change by themselves – the next of the 6 themes, kept on the server (never the same twice). */
export async function nextTheme(database) {
  await ensureNews(database);
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'theme'`).first().catch(() => null);
  const next = ((row ? Number(row.value) : -1) + 1) % TEMPLATE_COUNT;
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('theme', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(next).run();
  return next;
}

/** Publishes items of a slot as admin stories. Picture: background key (R2) or a template; text on top (overlay). */
export async function publishItems(env, database, slot, ids, opts = {}) {
  const s = await getSlot(database, slot);
  if (!s) return { published: 0 };
  // 2026-11-22 (owner): language pairs – "tr-de" (default), "tr-en", "de" (DE + TR), "tr" (only TR)
  const lang = ["tr-de", "tr-en", "de", "tr"].includes(opts.lang) ? opts.lang : "tr-de";
  let n = 0;
  const now = Date.now();
  const gapMs = (opts.gapMinutes || 0) * 60000;
  const logo = await assetBytes(opts.origin, "/assets/images/mykiez_logo.png", "image/png");
  let background = null;
  const bgCache = new Map();
  const loadBg = async (key) => {
    if (!key || !env.BUCKET) return null;
    if (bgCache.has(key)) return bgCache.get(key);
    const obj = await env.BUCKET.get(key).catch(() => null);
    const v = obj ? { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" } : null;
    bgCache.set(key, v);
    return v;
  };
  if (opts.backgroundKey) background = await loadBg(opts.backgroundKey);
  const settings = opts.useSettings ? await readSettings(database) : null;
  for (const it of s.items) {
    if (!ids.includes(it.id) || (it.published && !opts.again)) continue; // 2026-11-21: opts.again = share once more
    if (opts.skipHidden && it.hidden) continue; // 2026-11-22: hidden topics are never shared by the auto mode
    await withTimeout(ensureTr(env, it), 12000, false); // 2026-11-23: Turkish must be Turkish
    const p = newsParts(it, lang);
    // 2026-11-22 (owner): auto mode gives a fixed story id per topic -> if the step was cut after saving the story,
    // the next step sees it and only marks it (no second copy of the same news)
    const fixedId = opts.storyIds && opts.storyIds[it.id];
    if (fixedId) {
      const there = await database.prepare(`SELECT id FROM stories WHERE id = ?`).bind(fixedId).first().catch(() => null);
      if (there) {
        it.shares = [...(it.shares || []), fixedId];
        it.published = fixedId;
        await saveItems(database, slot, s.items);
        n++;
        continue;
      }
    }
    const id = fixedId || crypto.randomUUID();
    // 2026-11-22 (owner): own choice of the admin, otherwise the next colour (server counter, not "n" – was always red)
    let theme;
    let itemBgKey = opts.backgroundKey || "";
    if (opts.template) theme = (Number(opts.template) - 1) % TEMPLATE_COUNT;
    else if (settings && !opts.backgroundKey) {
      // 2026-11-22 (owner): background folder – rotating (templates + own pictures) or the 1–2 the admin picked
      const c = await chooseBackground(database, settings, it); // 2026-11-23: + topic
      theme = c.theme;
      if (c.backgroundKey) { itemBgKey = c.backgroundKey; background = await loadBg(c.backgroundKey); } else background = null;
      if (c.backgroundKey && !background) {
        // 2026-11-23 (owner "UYGULA 3"): the picture could not be loaded -> once more, then another own background
        // (before: the old box template was used without a word)
        bgCache.delete(c.backgroundKey);
        background = await loadBg(c.backgroundKey);
        if (!background) {
          for (const b of await listBackgrounds(database).catch(() => [])) {
            if (b.key === c.backgroundKey) continue;
            background = await loadBg(b.key);
            if (background) { itemBgKey = b.key; break; }
          }
        }
        it.bgNote = background ? (itemBgKey === c.backgroundKey ? "bg loaded on 2nd try" : `bg ${c.backgroundKey.slice(-12)} failed, other used`) : "no own background could be loaded";
      }
    } else theme = await nextTheme(database);
    if (!background) {
      // 2026-11-23 evening (owner "UYGULA 1"): never the old colour templates (box, logo) – always an own background
      const own = await anyOwnBackground(env, database, it).catch(() => null);
      if (own) { background = own.bg; itemBgKey = own.key; }
    }
    it.theme = theme; it.lang = lang; if (itemBgKey) it.bg = itemBgKey; else delete it.bg; // for a later redraw
    // the picture with all text inside; if drawing fails: template + text layer (older way)
    let mediaKey = "";
    let overlay = null;
    try {
      const png = await renderNewsImage(p, { theme, logo, background });
      mediaKey = `stories/news-${id}-v6.png`; // 2026-11-23 evening: "-v6" = TR on top, DE below, spread (was -v5)
      await env.BUCKET.put(mediaKey, png, { httpMetadata: { contentType: "image/png" } });
    } catch (e) {
      it.renderError = String((e && e.message) || e).slice(0, 120);
      // 2026-11-23 evening (owner "UYGULA 1"): no template + text box any more – once more; if it fails again the topic
      // is not shared now (the next step tries again)
      try {
        const png2 = await renderNewsImage(p, { theme, logo, background });
        mediaKey = `stories/news-${id}-v6.png`;
        await env.BUCKET.put(mediaKey, png2, { httpMetadata: { contentType: "image/png" } });
        delete it.renderError;
      } catch (e2) {
        mediaKey = "";
        if (false) overlay = { t: p.title1, b: "box" }; // old way (template + box), not used
      }
    }
    if (!mediaKey) continue;
    const subtext = [p.text1, p.text2, `${p.sourceLabel}: ${it.source}`].filter(Boolean).join("\n\n");
    const start = (opts.startAt != null ? Number(opts.startAt) : now) + n * gapMs; // 2026-11-22: auto mode publishes one per step, times from the first
    await database
      .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, approved_at, link, by_admin, media_hash, text_hash, media_extra, deal, cats, overlay) VALUES (?, ?, ?, ?, ?, ?, ?, 'image', 24, 'approved', '', ?, ?, ?, 1, '', '', '[]', '', ?, ?)`)
      .bind(id, p.title1, subtext.slice(0, 2000), "Ganz Berlin", it.urgent ? "warn" : "news", "My Kiez Berlin", mediaKey, now, start, it.url || "", it.urgent ? "eil,berlin" : /tagesschau$/.test(it.source) ? "deutschland" : "berlin", overlay ? JSON.stringify(overlay) : null)
      .run();
    it.shares = [...(it.shares || (it.published ? [it.published] : [])), id];
    it.published = id;
    if (fixedId) await saveItems(database, slot, s.items); // 2026-11-22: mark at once, not only at the end
    n++;
  }
  await saveItems(database, slot, s.items);
  return { published: n };
}

/** Title/description pair for the chosen language mode. */
export function newsParts(it, lang) {
  const tr = { t: it.title_tr || it.title_de, x: it.text_tr || it.text_de };
  // 2026-11-23 (owner: "ikisi de Almanca"): no Turkish -> German only once (not twice)
  if (trMissing(it) && lang !== "tr") {
    const one = lang === "tr-en" ? { t: it.title_en || it.title_de, x: it.text_en || it.text_de } : { t: it.title_de, x: it.text_de };
    return { title1: one.t, text1: one.x, title2: "", text2: "", sourceLabel: lang === "tr-en" ? "Source" : "Quelle", source: it.source, url: it.url, urgent: !!it.urgent };
  }
  const de = { t: it.title_de, x: it.text_de };
  const en = { t: it.title_en || it.title_de, x: it.text_en || it.text_de };
  const pair = lang === "tr-en" ? [tr, en] : lang === "de" ? [de, tr] : lang === "tr" ? [tr, null] : [tr, de];
  return {
    title1: pair[0].t, text1: pair[0].x, title2: pair[1] ? pair[1].t : "", text2: pair[1] ? pair[1].x : "",
    sourceLabel: lang === "tr-en" ? "Kaynak / Source" : lang === "tr" ? "Kaynak" : "Kaynak / Quelle", source: it.source, url: it.url, urgent: !!it.urgent,
  };
}

async function assetBytes(origin, path, mime) {
  try {
    const res = await fetch(`${origin || "https://mykiezberlin.com"}${path}`);
    if (!res.ok) return null;
    return { bytes: new Uint8Array(await res.arrayBuffer()), mime };
  } catch (e) {
    return null;
  }
}

/** 2026-11-22 (owner): news stories made the old way (template + text layer) get the new picture once. */
export async function upgradeOldNews(env, database, origin) {
  const { results } = await database
    .prepare(`SELECT id, headline, subtext, link, kind FROM stories WHERE status = 'approved' AND media_key LIKE 'stories/news-tpl-%' AND approved_at + duration_hours * 3600000 > ? LIMIT 3`)
    .bind(Date.now())
    .all();
  if (!results.length) return;
  const logo = await assetBytes(origin, "/assets/images/mykiez_logo.png", "image/png");
  for (const r of results) {
    const parts = String(r.subtext || "").split("\n\n");
    const src = (parts.find((x) => /^Quelle: /.test(x)) || "").replace(/^Quelle: /, "");
    const texts = parts.filter((x) => x && !/^Quelle: /.test(x));
    try {
      const png = await renderNewsImage({ title1: r.headline, title2: "", text1: texts[1] || "", text2: texts[0] || "", sourceLabel: "Kaynak / Quelle", source: src, url: r.link, urgent: r.kind === "warn" }, { theme: await nextTheme(database), logo }); // 2026-11-22: was always 1 (red)
      const key = `stories/news-${r.id}-v2.png`;
      await env.BUCKET.put(key, png, { httpMetadata: { contentType: "image/png" } });
      await database.prepare(`UPDATE stories SET media_key = ?, overlay = NULL WHERE id = ?`).bind(key, r.id).run();
    } catch (e) {
      return; // drawing not possible here – keep the old picture
    }
  }
}

/** 2026-11-22 (owner): live news pictures from before get the new colours + text fitting once (a few per sweep). */
export async function redrawNews(env, database, origin, limit = 2) {
  if (!env.BUCKET) return 0;
  const { results } = await database
    .prepare(`SELECT id, headline, subtext, link, kind, media_key FROM stories WHERE status = 'approved' AND media_key LIKE 'stories/news-%.png' AND media_key NOT LIKE '%-v6.png' AND media_key NOT LIKE '%-v6k.png' AND media_key NOT LIKE 'stories/news-render-check%' AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT ?`)
    .bind(Date.now(), limit)
    .all();
  if (!results.length) return 0;
  // the full texts (both languages) are in the slot lists
  const { results: slots } = await database.prepare(`SELECT items FROM news_slots WHERE created_at > ?`).bind(Date.now() - 4 * 86400000).all();
  const byStory = new Map();
  for (const s of slots) { try { for (const it of JSON.parse(s.items || "[]")) if (it.published) byStory.set(it.published, it); } catch (e) { /* skip */ } }
  const logo = await assetBytes(origin, "/assets/images/mykiez_logo.png", "image/png");
  let done = 0;
  for (const r of results) {
    const it = byStory.get(r.id);
    if (!it && r.media_key) {
      // 2026-11-23 (owner "UYGULA 2"): the topic is no longer in a list (e.g. deleted after sharing) -> the full texts are
      // unknown; drawing again from the story row lost the 2nd (German) title. Now the old picture stays as it is
      // (copied to "-v5k", so it is not taken again and the next ones are drawn).
      const old = await env.BUCKET.get(r.media_key).catch(() => null);
      if (old) {
        const keepKey = `stories/news-${r.id}-v6k.png`; // 2026-11-23 evening: v6
        await env.BUCKET.put(keepKey, await old.arrayBuffer(), { httpMetadata: { contentType: "image/png" } });
        await database.prepare(`UPDATE stories SET media_key = ? WHERE id = ?`).bind(keepKey, r.id).run();
        done++;
        continue;
      }
    }
    let p;
    let background = null;
    if (it) {
      await withTimeout(ensureTr(env, it), 10000, false); // 2026-11-23
      p = newsParts(it, it.lang || "tr-de");
      if (it.bg) {
        const obj = await env.BUCKET.get(it.bg).catch(() => null);
        if (obj) background = { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" };
      }
    } else {
      const parts = String(r.subtext || "").split("\n\n");
      const srcLine = parts.find((x) => /^(Kaynak|Quelle)[^:]*: /.test(x)) || "";
      const texts = parts.filter((x) => x && x !== srcLine);
      p = { title1: r.headline, title2: "", text1: texts[0] || "", text2: texts[1] || "", sourceLabel: "Kaynak / Quelle", source: srcLine.replace(/^[^:]*: /, ""), url: r.link, urgent: r.kind === "warn" };
    }
    if (!background) {
      // 2026-11-23 (owner): only the owner's own backgrounds -> the next one of them (if there are any)
      const c = await chooseBackground(database, await readSettings(database), it || { urgent: r.kind === "warn", orig: r.headline, url: r.link }).catch(() => null); // 2026-11-23: + topic
      if (c && c.backgroundKey) { const obj = await env.BUCKET.get(c.backgroundKey).catch(() => null); if (obj) background = { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" }; }
    }
    try {
      const png = await renderNewsImage(p, { theme: it && it.theme != null ? it.theme : await nextTheme(database), logo, background }); // 2026-11-22: same colour as before
      const key = `stories/news-${r.id}-v6.png`; // 2026-11-23 evening: TR on top, DE below, spread (was -v5)
      await env.BUCKET.put(key, png, { httpMetadata: { contentType: "image/png" } });
      await database.prepare(`UPDATE stories SET media_key = ?, overlay = NULL WHERE id = ?`).bind(key, r.id).run();
      done++;
    } catch (e) {
      await sweepLog(database, `redraw ${r.id}`, e); // 2026-11-22: show why
      return done; // drawing not possible here – keep the old picture
    }
  }
  return done;
}

/** R2 key of a template picture (copied once from /assets/news/tpl-N.webp into R2). */
async function templateKey(env, nr, origin) {
  if (!env.BUCKET) return "";
  const n = Math.min(TEMPLATE_COUNT, Math.max(1, Number(nr) || 1));
  const key = `stories/news-tpl2-${n}.webp`; // 2026-11-22: new design (tpl2), the old copies stay unused
  const head = await env.BUCKET.head(key).catch(() => null);
  if (head) return key;
  try {
    const res = await fetch(`${origin || "https://mykiezberlin.com"}/assets/news/tpl-${n}.webp`);
    if (!res.ok) return "";
    await env.BUCKET.put(key, await res.arrayBuffer(), { httpMetadata: { contentType: "image/webp" } });
    return key;
  } catch (e) {
    return "";
  }
}

/** Called from GET /api/stories (waitUntil): at most every 5 minutes make the slot list and, if "newsAuto" is on, publish. */
// 2026-11-22 (owner: "otomatik haber çalışmıyor"): every step + the last error are written to news_state 'sweep_log'
// so /api/news-status shows where the auto mode stops.
export async function sweepLog(database, step, err) {
  try {
    const v = JSON.stringify({ at: Date.now(), step, err: err ? String((err && err.message) || err).slice(0, 300) : "" });
    await database.prepare(`INSERT INTO news_state (id, value) VALUES ('sweep_log', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(v).run();
    if (err) await database.prepare(`INSERT INTO news_state (id, value) VALUES ('sweep_err', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(v).run();
  } catch (e) { /* never break */ }
}

export async function newsSweep(env, database, origin) {
  let step = "start";
  try {
    await ensureNews(database);
    const last = await database.prepare(`SELECT value FROM news_state WHERE id = 'sweep'`).first();
    // 2026-11-21: every minute while the current list is not complete, else every 5 minutes
    const cur = berlinSlot().slot ? await getSlot(database, berlinSlot().slot) : null;
    const busy = !cur || !cur.items.length || cur.items.some((x) => x.written === false);
    if (last && Date.now() - last.value < (busy ? 60000 : 5 * 60000)) return;
    await database.prepare(`INSERT INTO news_state (id, value) VALUES ('sweep', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(Date.now()).run();
    step = "list";
    await sweepLog(database, step);
    const s = await ensureCurrentSlot(env, database, { write: 1 });
    step = s ? `list ${s.items.length} open ${s.items.filter((x) => x.written === false).length} done ${s.auto_done ? 1 : 0}` : "no slot (22-06)";
    await sweepLog(database, step);
    if (!busy) {
      await upgradeOldNews(env, database, origin).catch(() => {});
      await fixNews2311(env, database).catch(() => {}); // 2026-11-23: once
      const rd = await redrawNews(env, database, origin, 1).catch((e) => { sweepLog(database, "redraw", e); return -1; }); // 2026-11-22: once for the older pictures (1 per step: 30 s limit)
      if (rd) await sweepLog(database, `redraw ${rd}`);
    }
    // 2026-11-23 (owner "UYGULA 2"): ticked topics of earlier lists (last 24 h) are shared too – one per step
    if (await publishPickedElsewhere(env, database, origin, s ? s.slot : "").catch((e) => { sweepLog(database, "picked", e); return false; })) return;
    if (!s || s.items.some((x) => x.written === false)) return;
    const pickedHere = s.items.filter((x) => x.picked && !x.hidden && !x.published && pickReady(x));
    if (s.auto_done && !pickedHere.length) return; // 2026-11-23: after "all published" only new ticks count
    const flags = await readFlags(database);
    if (!pickedHere.length && (!flags.newsAuto || !s.items.length)) { await sweepLog(database, flags.newsAuto ? "empty list" : "auto off"); return; }
    const vis = s.items.filter((x) => !x.hidden && !x.noText); // 2026-11-22: hidden ("kapalı") topics are not shared; 2026-11-23: nor topics without text
    const autoIds = s.auto_done || !flags.newsAuto ? [] : [...vis.filter((x) => x.urgent).map((x) => x.id), ...vis.filter((x) => !x.urgent).slice(0, AUTO_COUNT).map((x) => x.id)];
    const ids = [...new Set([...autoIds, ...pickedHere.map((x) => x.id)])]; // 2026-11-23: urgent + first 3 + every ticked topic
    // 2026-11-22 (owner: "otomatik haber çalışmıyor"): ONE picture per step (3–4 at once were cut after 30 s);
    // times stay: first one now, the next ones + interval; auto_done only when all are out.
    const st = await readSettings(database);
    const todo = ids.filter((id) => { const x = s.items.find((y) => y.id === id); return x && !x.published; });
    if (!todo.length) { await database.prepare(`UPDATE news_slots SET auto_done = 1 WHERE slot = ?`).bind(s.slot).run(); await sweepLog(database, `all published (${s.slot})`); return; }
    const autoStart = (s.items.find((x) => x.autoStart) || {}).autoStart || Date.now();
    s.items.forEach((x) => { x.autoStart = autoStart; });
    await saveItems(database, s.slot, s.items);
    const pos = ids.length - todo.length;
    step = `publish ${pos + 1}/${ids.length}`;
    await sweepLog(database, step);
    const storyIds = { [todo[0]]: `news-auto-${s.slot}-${todo[0]}` }; // 2026-11-22: fixed id = never twice
    const r = await publishItems(env, database, s.slot, [todo[0]], { origin, gapMinutes: 0, startAt: autoStart + pos * st.gap * 60000, lang: st.lang, useSettings: true, skipHidden: true, storyIds });
    if (todo.length === 1 && r.published) await database.prepare(`UPDATE news_slots SET auto_done = 1 WHERE slot = ?`).bind(s.slot).run();
    await sweepLog(database, `published ${pos + r.published}/${ids.length} (${s.slot})`);
  } catch (e) {
    // never break the story list
    await sweepLog(database, step, e);
  }
}

// ---- 2026-11-23 (owner: "bazen ikisi de Almanca") ----
// Cause: when the AI text step failed or ran out of time (16 s), the topic was marked "written" with an empty Turkish
// title, and newsParts() used the German text for the Turkish line too -> both lines German.
// Now: 1) a missing or German-looking Turkish text is translated from German (fast translation model, then a short AI
// prompt); 2) the text step is tried up to 3 times before it gives up; 3) if Turkish is still missing, the picture shows
// German only once (never the same German text twice).
const TR_ONLY = /[ğışçĞİŞÇ]/;
const DE_WORDS = /\b(der|die|das|und|ist|nicht|mit|für|auf|wird|werden|eine?|im|den|dem|von|zum|zur|nach|bei|aus|sich)\b/gi;
const TR_WORDS = /\b(ve|bir|bu|için|ile|olarak|değil|da|de|en|çok|sonra|daha)\b/i;
export function trMissing(it) {
  const t = String(it.title_tr || "").trim(), x = String(it.text_tr || "").trim();
  if (!t) return true;
  if (t === String(it.title_de || "").trim() || (x && x === String(it.text_de || "").trim())) return true;
  if (!x && String(it.text_de || "").trim()) return true; // 2026-11-23: German text there, Turkish text missing
  const s = `${t} ${x}`;
  if (/[äÄß]/.test(s)) return true;
  if (badTr(t, it.title_de)) return true; // 2026-11-23: menu path / doubled word / German in the title
  if (TR_ONLY.test(s)) return (s.match(DE_WORDS) || []).length >= 3;
  return (s.match(DE_WORDS) || []).length > 0 && !TR_WORDS.test(s);
}

async function translateDeTr(env, text) {
  const src = String(text || "").trim();
  if (!src || !env.AI) return "";
  // 2026-11-23 (owner: çeviri kötü): the AI model first (better Turkish), checked; the fast model only as a reserve
  for (const model of AI_MODELS) {
    try {
      const out = await withTimeout(env.AI.run(model, { messages: [
        { role: "system", content: "Du bist ein professioneller Übersetzer Deutsch -> Türkisch für eine Nachrichten-App. Natürliches, korrektes Türkisch. Eigennamen, Orte und Zahlen bleiben gleich. Nichts hinzufügen, nichts weglassen." },
        { role: "user", content: `Übersetze ins Türkische. Antworte NUR mit der Übersetzung:\n\n${src}` }], max_tokens: 400, temperature: 0.1 }), 8000, null);
      const t = String((out && (out.response || out)) || "").trim().replace(/^["„“]+|["“”]+$/g, "").trim();
      if (t && t !== src && typeof t === "string" && !badTr(t, src)) return t;
    } catch (e) { /* next */ }
  }
  for (const args of [{ text: src, source_lang: "de", target_lang: "tr" }, { text: src, source_lang: "german", target_lang: "turkish" }]) {
    try {
      const out = await withTimeout(env.AI.run("@cf/meta/m2m100-1.2b", args), 7000, null);
      const t = out && (out.translated_text || out.response);
      if (t && String(t).trim() && String(t).trim() !== src && !badTr(String(t).trim(), src)) return String(t).trim(); // 2026-11-23: checked
    } catch (e) { /* next */ }
  }
  for (const model of AI_MODELS) {
    try {
      const out = await withTimeout(env.AI.run(model, { messages: [{ role: "user", content: `Übersetze ins Türkische. Antworte NUR mit der Übersetzung, ohne Erklärung:\n\n${src}` }], max_tokens: 400, temperature: 0.1 }), 8000, null);
      const t = String((out && (out.response || out)) || "").trim().replace(/^["„]|["“]$/g, "");
      if (t && t !== src && typeof t === "string") return t;
    } catch (e) { /* next */ }
  }
  return "";
}

/** Makes sure the Turkish title/text exist and are Turkish. Returns true when it is fine now. */
export async function ensureTr(env, it) {
  if (!trMissing(it)) return true;
  const [t, x] = await Promise.all([translateDeTr(env, it.title_de), it.text_de ? translateDeTr(env, it.text_de) : Promise.resolve("")]);
  // 2026-11-24 (owner): fixed writing rules (capital letters, spaces, full stop) – see _lib/text-polish.js
  if (t) it.title_tr = cut(tidy(t, "tr", "headline"), 90);
  if (x) it.text_tr = cut(tidy(x, "tr", "text"), 420);
  const ok = !trMissing(it);
  if (!ok) it.trFail = (it.trFail || 0) + 1; else delete it.trFail;
  return ok;
}

// ---- 2026-11-23 (owner: "aynı haberler tekrar gelmemeli", "silinen haber bir daha çıkmamalı") ----
// Same event from two sources, or a topic close to a deleted / already shown one, is recognised by the important
// words of the title (word starts, 7 letters): 2 of the words and half of the shorter title, or 3 words -> same topic.
const TOPIC_STOP = new Set(["berlin", "berliner", "berlins", "brandenburg", "nach", "über", "uber", "wird", "werden", "wurde", "haben", "sind", "nicht", "einem", "einer", "eines", "diese", "dieser", "dieses", "mehr", "auch", "noch", "sich", "beim", "gegen", "unter", "zwischen", "wegen", "seit", "heute", "jetzt", "neue", "neuen", "neuer", "neues", "ersten", "erste", "zwei", "drei", "sagt", "soll", "sollen", "will", "kann", "alle", "viele", "sein", "seine", "ihre", "dass", "ohne", "aber", "oder", "wenn", "doch", "schon", "immer", "liveblog", "live", "news", "aktuell", "video", "fotos", "bilder", "deutschland", "deutsche", "deutschen", "polizei", "polizeimeldung", "sucht", "zeugen", "mann", "frau", "jahre", "jähriger", "jährige", "prozent", "euro", "uhr"]);
export function topicWords(s) {
  return new Set(String(s || "").toLowerCase().replace(/[^a-z0-9äöüßğışçé]+/g, " ").split(" ")
    .filter((w) => w.length >= 4 && !TOPIC_STOP.has(w)).map((w) => w.slice(0, 7)));
}
export function sameTopic(a, b) {
  const A = topicWords(a), B = topicWords(b);
  if (!A.size || !B.size) return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n >= 3 || (n >= 2 && n / Math.min(A.size, B.size) >= 0.5);
}
function dropSameTopics(list, getTitle) {
  const out = [];
  for (const x of list) if (!out.some((y) => sameTopic(getTitle(y), getTitle(x)))) out.push(x);
  return out;
}

/** Topics of the last 24 h (all lists) + deleted topics: a new analysis must not bring them again. */
export async function seenTopics(database) {
  const seen = new Set(await readBlocked(database).catch(() => []));
  const { results } = await database.prepare(`SELECT items FROM news_slots WHERE created_at > ?`).bind(Date.now() - 24 * 3600000).all().catch(() => ({ results: [] }));
  for (const r of results || []) { try { for (const x of JSON.parse(r.items || "[]")) { if (x.orig) seen.add(x.orig); if (x.title_de) seen.add(x.title_de); } } catch (e) { /* skip */ } }
  return seen;
}

// ---- 2026-11-23 (owner: "kapat butonuna basıyorum, sonra tekrar açılıyor") ----
// Cause: the background work read the list, wrote texts for ~30 s and then saved ITS old copy of the list – the
// "hidden" mark (and a deletion) the admin made in between was overwritten. Now the admin's choice is kept apart
// (news_state 'hidden' = {topic: true/false}, deleted = 'blocked') and laid over the list at every save.
export async function readHidden(database) {
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'hidden'`).first().catch(() => null);
  try { return JSON.parse((row && row.value) || "{}") || {}; } catch (e) { return {}; }
}
export async function setHidden(database, key, on) {
  if (!key) return;
  const map = await readHidden(database);
  map[key] = !!on;
  const keys = Object.keys(map);
  for (const k of keys.slice(0, Math.max(0, keys.length - 600))) delete map[k];
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('hidden', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(JSON.stringify(map)).run();
}
async function applyAdminChoices(database, items) {
  try {
    const blocked = new Set(await readBlocked(database));
    const hidden = await readHidden(database);
    const key = (x) => x.orig || x.title_de || "";
    for (let i = items.length - 1; i >= 0; i--) if (blocked.has(key(items[i]))) items.splice(i, 1);
    for (const x of items) if (Object.prototype.hasOwnProperty.call(hidden, key(x))) { if (hidden[key(x)]) x.hidden = true; else delete x.hidden; }
    // 2026-11-23 (owner "işaretler kayboluyor"): the admin's ticks are kept apart too and laid over the list
    const picked = await readPicked(database);
    for (const x of items) if (Object.prototype.hasOwnProperty.call(picked, key(x))) { if (picked[key(x)]) x.picked = true; else delete x.picked; }
  } catch (e) { /* keep the list as it is */ }
  return items;
}

// ---- 2026-11-23 (owner: çeviri kalitesi) ----
// The fast translation model made "Haberler > Günaydın Haberleri > …" and "inşaat ve inşaat tehlikesi".
// Now the AI model translates first; a result with a menu path (">"), a doubled word or German words is not taken.
export function badTr(t, src) {
  const s = String(t || "").trim();
  if (!s) return true;
  if (/[>»|]/.test(s) && !/[>»|]/.test(String(src || ""))) return true;
  if (s.length < 120 /* titles only */ && /\b([a-zçğıöşü]{4,})\b[^.!?]{0,40}\b\1\b/i.test(s) && !/\b([a-zäöüß]{4,})\b[^.!?]{0,40}\b\1\b/i.test(String(src || ""))) return true;
  if (/[äÄß]/.test(s)) return true;
  if ((s.match(DE_WORDS) || []).length >= 2) return true;
  if (src && s.length > String(src).length * 2.6 + 20) return true;
  return false;
}

// ---- 2026-11-23 (owner "UYGULA 1-4", "çok kısa da olmasın") ----
function hasText(it) {
  return String(it.text_de || "").trim().length >= 120 || String(it.text_tr || "").trim().length >= 120;
}
/** First sentences of the article: at least ~260 characters when the article has them, at most 420 (whole sentences). */
export function firstSentences(text) {
  const src = String(text || "").replace(/\s+/g, " ").trim();
  if (!src) return "";
  const parts = src.split(/(?<=[.!?…])\s+(?=[A-ZÄÖÜ0-9„"])/).map((x) => x.trim()).filter((x) => x.length > 20 && !/cookie|javascript|abonn|newsletter|©|zum artikel|weiterlesen|mehr zum thema/i.test(x));
  let out = "";
  for (const p of parts) {
    if (out && (out + " " + p).length > 420) break;
    out = out ? `${out} ${p}` : p;
    if (out.length >= 260) break;
  }
  if (out.length < 120 && src.length > out.length) out = src.length <= 420 ? src : cut(src, 418).replace(/\s+\S*$/, "") + " …";
  return cut(out, 420);
}

/** One time (owner "UYGULA 4"): the hospital fire story of 23.11 08:00 gets its first picture back (with the German title). */
export async function fixNews2311(env, database) {
  const flag = await database.prepare(`SELECT value FROM news_state WHERE id = 'fix2311'`).first().catch(() => null);
  if (flag || !env.BUCKET) return;
  const id = "news-auto-2026-11-23-08-r77303-0";
  const old = await env.BUCKET.get(`stories/news-${id}-v4.png`).catch(() => null);
  if (old) {
    const key = `stories/news-${id}-v5k.png`;
    await env.BUCKET.put(key, await old.arrayBuffer(), { httpMetadata: { contentType: "image/png" } });
    await database.prepare(`UPDATE stories SET media_key = ? WHERE id = ?`).bind(key, id).run();
  }
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('fix2311', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(old ? "done" : "no v4").run();
}


// ---- 2026-11-23 (owner "UYGULA 1-2": "işaretliyorum, sonra işaretsiz oluyor") ----
// Cause: the ticks lived only in the browser; the list is drawn again every 20 s (and after every button) -> all empty.
// Now a tick is saved on the server at once (news_state 'picked' = {topic: true/false}, like 'hidden') and the
// auto step shares urgent + first 3 + every ticked topic (also ticked later, also in an earlier list of the last 24 h).
export async function readPicked(database) {
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'picked'`).first().catch(() => null);
  try { return JSON.parse((row && row.value) || "{}") || {}; } catch (e) { return {}; }
}
export async function setPicked(database, key, on) {
  if (!key) return;
  const map = await readPicked(database);
  map[key] = !!on;
  const keys = Object.keys(map);
  for (const k of keys.slice(0, Math.max(0, keys.length - 600))) delete map[k];
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('picked', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(JSON.stringify(map)).run();
}
/** A ticked topic is shared when it has a text (written by the AI or by the admin). */
function pickReady(x) {
  return x.written !== false && (hasText(x) || String(x.text_tr || x.text_de || "").trim().length >= 40);
}
/** One ticked, not yet shared topic of an earlier list (last 24 h) -> shared now. true = one step used. */
async function publishPickedElsewhere(env, database, origin, current) {
  const { results } = await database.prepare(`SELECT slot FROM news_slots WHERE created_at > ? ORDER BY slot DESC LIMIT 12`).bind(Date.now() - 24 * 3600000).all();
  for (const r of results || []) {
    if (r.slot === current) continue;
    const s = await getSlot(database, r.slot);
    const it = s && s.items.find((x) => x.picked && !x.hidden && !x.published && pickReady(x));
    if (!it) continue;
    const st = await readSettings(database);
    await sweepLog(database, `publish picked ${r.slot} ${it.id}`);
    await publishItems(env, database, r.slot, [it.id], { origin, gapMinutes: 0, startAt: Date.now(), lang: st.lang, useSettings: true, skipHidden: true, storyIds: { [it.id]: `news-auto-${r.slot}-${it.id}` } });
    return true;
  }
  return false;
}

// ---- 2026-11-23 (owner "UYGULA 8"): the background fits the topic ----
// Tags of own backgrounds: "genel" (or none) = all topics, "spor", "kultur", "acil" (police / fire / accident / warning).
// Urgent news without an "acil" background get the own red EIL design (no photo). Sport/culture/acil backgrounds are
// not used for other topics. Returns null when nothing special applies (then the old rotation decides).
export const BG_TAGS_OLD = ["genel", "spor", "kultur", "acil"];
// 2026-11-26 (owner "UYGULA arka plan önerisi 1-4"): many topics, each topic has its own pictures and its own
// rotation counter (news_state 'bgturn:<tag>') -> a picture comes again only after all pictures of that topic were used.
// "yazili" (big text in the middle: EILMELDUNG / INFO / ANGEBOT), "reklam" and "duz" (plain colour) are never used
// automatically for news (the admin can still pick them by hand).
export const BG_TAGS = ["genel", "berlin", "acil", "ariza", "ariza-ulasim", "ariza-enerji", "ariza-dijital", "trafik", "hava",
  "politika", "adalet", "spor", "kultur", "ekonomi", "insaat", "egitim", "saglik", "cevre", "sosyal", "teknik", "turkiye",
  "yazili", "reklam", "duz",
  // 2026-11-26 (owner "UYGULA acil öneri 1-4"): urgent pictures by kind + green plain pictures (not for urgent news)
  "acil-polis", "acil-itfaiye", "acil-ambulans", "duz-yesil"];
// 2026-11-26 (owner "UYGULA acil öneri 1-4"): "duz" / "duz-yesil" are no longer only for the admin – they are the
// choice when the topic is not clear (see topicBackground), but never matched as a topic themselves.
export const BG_NO_AUTO = ["yazili", "reklam"];
const BG_PLAIN = ["duz", "duz-yesil"];
// a topic without own pictures uses these topics next, then the plain + general pictures
// ("acil-belirsiz" = urgent, but police / fire / ambulance not clear -> plain pictures without green)
const BG_FALLBACK = {
  "ariza-ulasim": ["ariza", "trafik"], "ariza-enerji": ["ariza"], "ariza-dijital": ["ariza", "teknik"],
  ariza: ["ariza-ulasim", "ariza-enerji", "ariza-dijital"], trafik: ["ariza-ulasim"], insaat: ["ekonomi"],
  adalet: ["politika"], sosyal: ["politika"], cevre: ["hava"], teknik: ["ariza-dijital"],
  "acil-polis": ["acil-belirsiz", "acil"], "acil-itfaiye": ["acil-belirsiz", "acil"], "acil-ambulans": ["acil-belirsiz", "acil"],
  acil: ["acil-belirsiz"], "acil-belirsiz": ["acil"],
};
/** Kind of an urgent news: police, fire brigade, ambulance, general warning – or not clear (2026-11-26). */
export function acilKind(t) {
  const kinds = [];
  if (/polizei|festnahme|festgenommen|messer|schüsse|schuss\b|razzia|überfall|täter|tatverdächtig|einbruch|raub\b|angriff|attackiert|ermittl/.test(t)) kinds.push("acil-polis");
  if (/feuerwehr|brand\b|brände|brannte|feuer\b|explosion|rauch|lösch|flammen/.test(t)) kinds.push("acil-itfaiye");
  if (/rettungswagen|notarzt|rettungsdienst|ins krankenhaus|reanim|rettungshubschrauber/.test(t)) kinds.push("acil-ambulans");
  if (kinds.length === 1) return kinds[0];
  if (!kinds.length && /warnung|warnt\b|alarm|evakuier|bombe|entschärf|sirene/.test(t)) return "acil";
  return "acil-belirsiz"; // none or more than one kind -> plain picture (owner: "karar veremiyorsa düz resim")
}
export function newsTopic(it) {
  const t = `${it.url || ""} ${it.source || ""} ${it.orig || ""} ${it.title_de || ""} ${it.text_de || ""}`.toLowerCase();
  const has = (re) => re.test(t);
  if (it.urgent) return acilKind(t);
  if (has(/polizei|feuerwehr|brand\b|brände|feuer\b|unfall|messer|schüsse|schuss\b|festnahme|razzia|bombe|evakuier|verletzt|tot\b|getötet|leiche|überfall|explosion|attackiert|angriff|angegriffen|notarzt|reanim|rettungswagen|tatverdächtig/)) return acilKind(t);
  if (has(/\.com\.tr|türkei|türkiye|turkiye|istanbul|ankara|izmir|antalya|erdoğan|erdogan|deprem/)) return "turkiye";
  if (has(/unwetter|wetter|sturm|orkan|glätte|glatteis|schnee|gewitter|hitze|frost|regen\b|dwd|hochwasser/)) return "hava";
  if (has(/cyber|hacker|datenleck|it-störung|it-ausfall/)) return "ariza-dijital";
  if (has(/störung|ausfall|ausgefallen|defekt|kaputt|unterbrochen|lahmgelegt/)) {
    if (has(/strom|gas\b|gasleitung|wasser|heizung|fernwärme|blackout|netz\b/)) return "ariza-enerji";
    if (has(/internet|mobilfunk|telefon|wlan|online|app\b|bank|zahlung|karte|server|website|bürgeramt digital/)) return "ariza-dijital";
    if (has(/s-bahn|u-bahn|bahn|bvg|tram|bus\b|aufzug|rolltreppe|ampel|signal|weiche|bahnübergang|zug/)) return "ariza-ulasim";
    return "ariza";
  }
  if (has(/\/sport|sport\b|fußball|fussball|hertha|union berlin|alba\b|eisbären|füchse|bundesliga|olymp|marathon|spiel\b|trainer/)) return "spor";
  if (has(/verkehr|stau\b|baustelle|sperrung|gesperrt|bvg|s-bahn|u-bahn|tram\b|autobahn|a100|radweg|mobilität|parkplatz|schlagloch|straßenbahn|bus-linie|buslinie|linie [msu]?\d/)) return "trafik";
  if (has(/gericht|urteil|prozess|anklage|staatsanwalt|justiz|haftstrafe|verurteilt|richter/)) return "adalet";
  if (has(/schule|kita|lehrer|schüler|universität|hochschule|bildung|abitur|studier/)) return "egitim";
  if (has(/krankenhaus|klinik|arzt|ärzt|gesundheit|charité|pflege|virus|grippe|impf|apotheke/)) return "saglik";
  if (has(/kultur|theater|museum|konzert|festival|ausstellung|kino|oper\b|weihnachtsmarkt|lesung|musik/)) return "kultur";
  if (has(/neubau|bauprojekt|richtfest|bauarbeiten|abriss|hochhaus/)) return "insaat";
  if (has(/klima|umwelt|energie|windkraft|solar|co2|natur|bäume|tierschutz|müll|recycling/)) return "cevre";
  if (has(/bürgergeld|obdachlos|armut|tafel|flüchtling|geflüchtete|integration|sozial|rente\b/)) return "sosyal";
  if (has(/miete|mieten|wohnung|immobil|wirtschaft|preise|inflation|unternehmen|firma|insolvenz|arbeitsmarkt|steuer|haushalt|euro\b|kosten/)) return "ekonomi";
  if (has(/senat|abgeordnetenhaus|bundestag|regierung|wahl\b|wahlen|partei|cdu|spd|grüne|afd|linke|bsw|fdp|minister|bürgermeister|wegner|merz|politik|koalition/)) return "politika";
  if (has(/künstliche intelligenz|\bki\b|digital|software|smartphone|technik|technologie/)) return "teknik";
  if (has(/bezirk|kiez|neukölln|kreuzberg|wedding|moabit|spandau|pankow|charlottenburg|schöneberg|friedrichshain|mitte\b|marzahn|lichtenberg|tempelhof|steglitz|reinickendorf|treptow|köpenick/)) return "berlin";
  return "genel";
}
async function turnTag(database, tag, list) {
  const id = `bgturn:${tag}`;
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = ?`).bind(id).first().catch(() => null);
  const n = ((row ? Number(row.value) : -1) + 1) % list.length;
  await database.prepare(`INSERT INTO news_state (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(id, n).run();
  return { theme: await nextTheme(database), backgroundKey: list[n].key };
}
function bgTagOf(b) { return BG_TAGS.includes(b.tag) ? b.tag : "genel"; }
async function topicBackground(database, settings, it) {
  const topic = newsTopic(it);
  const usable = (await listBackgrounds(database)).filter((b) => !BG_NO_AUTO.includes(bgTagOf(b)));
  if (!usable.length) return null;
  for (const t of [topic, ...(BG_FALLBACK[topic] || [])]) {
    if (t === "genel") break;
    // 2026-11-26: urgent but not clear -> plain pictures, no green ones (green = "all clear")
    const same = t === "acil-belirsiz" ? usable.filter((b) => bgTagOf(b) === "duz") : usable.filter((b) => bgTagOf(b) === t);
    if (same.length) return turnTag(database, t, same);
  }
  // 2026-11-26 (owner "UYGULA acil öneri 3"): no clear topic -> plain pictures + the general news pictures;
  // the Berlin photos only for Berlin / Kiez news (picked ones first, if the admin picked some)
  const general = usable.filter((b) => bgTagOf(b) === "genel" || BG_PLAIN.includes(bgTagOf(b)));
  const picks = settings && settings.bgMode === "pick" ? general.filter((b) => settings.bgPicks.includes(`b:${b.key}`)) : [];
  if (picks.length) return turnTag(database, "pick", picks);
  const noPlain = usable.filter((b) => !BG_PLAIN.includes(bgTagOf(b)));
  return turnTag(database, "genel", general.length ? general : noPlain.length ? noPlain : usable);
}
export async function setBackgroundTag(database, key, tag) {
  await ensureNews(database);
  await database.prepare(`UPDATE news_bgs SET tag = ? WHERE key = ?`).bind(BG_TAGS.includes(tag) ? tag : "genel", key).run();
}

// ---- 2026-11-23 (owner "UYGULA 10"): the admin corrects the text of a shared news story -> new picture ----
// The text is drawn INTO the picture, so a correction of the text alone was not seen. Now the picture is drawn again
// with the new text (same background + colour), the story keeps its place (new file name: /media is cached).
// Facebook: the old single post is deleted and the story is sent again (next run / next collection);
// Instagram cannot delete by API -> the answer says so. Telegram: old message deleted, sent again.
// from = "story" (headline/subtext of the story row changed) or "item" (texts in the news list changed).
export async function redrawEditedStory(env, database, storyId, origin, from = "story") {
  const out = { redrawn: false, fbDeleted: false, igManual: false, social: "" };
  if (!env.BUCKET || !storyId) return out;
  const r = await database.prepare(`SELECT id, headline, subtext, link, kind, media_key FROM stories WHERE id = ?`).bind(storyId).first();
  if (!r || !/^stories\/news-/.test(r.media_key || "") || /news-(bglib|tpl|bg-)/.test(r.media_key)) return out; // only pictures we drew
  await ensureNews(database);
  let it = null, itSlot = "", slotItems = null;
  const { results: slots } = await database.prepare(`SELECT slot, items FROM news_slots WHERE created_at > ?`).bind(Date.now() - 4 * 86400000).all();
  for (const s of slots || []) {
    let items = [];
    try { items = JSON.parse(s.items || "[]"); } catch (e) { items = []; }
    const x = items.find((y) => y.published === storyId || (y.shares || []).includes(storyId));
    if (x) { it = x; itSlot = s.slot; slotItems = items; break; }
  }
  const parts = String(r.subtext || "").split("\n\n");
  const srcLine = parts.find((x) => /^(Kaynak|Quelle|Source)[^:]*: /.test(x)) || "";
  const texts = parts.filter((x) => x && x !== srcLine);
  const lang = (it && it.lang) || "tr-de";
  let p;
  if (it && from === "item") {
    p = newsParts(it, lang);
    const subtext = [p.text1, p.text2, `${p.sourceLabel}: ${it.source}`].filter(Boolean).join("\n\n");
    await database.prepare(`UPDATE stories SET headline = ?, subtext = ? WHERE id = ?`).bind(p.title1, subtext.slice(0, 2000), storyId).run();
  } else if (it) {
    // the story row was changed -> the list gets the same texts (so a later drawing keeps them)
    const f = lang === "de" ? ["title_de", "text_de", "text_tr"] : lang === "tr-en" ? ["title_tr", "text_tr", "text_en"] : lang === "tr" ? ["title_tr", "text_tr", ""] : ["title_tr", "text_tr", "text_de"];
    it[f[0]] = r.headline; if (texts[0] != null) it[f[1]] = texts[0]; if (f[2] && texts[1] != null) it[f[2]] = texts[1];
    p = newsParts(it, lang);
    p.title1 = r.headline; p.text1 = texts[0] || p.text1; if (texts.length > 1) p.text2 = texts[1];
    await saveItems(database, itSlot, slotItems);
  } else {
    p = { title1: r.headline, title2: "", text1: texts[0] || "", text2: texts[1] || "", sourceLabel: "Kaynak / Quelle", source: srcLine.replace(/^[^:]*: /, ""), url: r.link, urgent: r.kind === "warn" };
  }
  let background = null;
  const bgKey = it && it.bg;
  if (bgKey) {
    const obj = await env.BUCKET.get(bgKey).catch(() => null);
    if (obj) background = { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" };
  }
  if (!background) {
    // 2026-11-23 evening (owner "UYGULA 1"): never a template – an own background (kept in the list for later drawings)
    const own = await anyOwnBackground(env, database, it || { urgent: r.kind === "warn", orig: r.headline, url: r.link }).catch(() => null);
    if (own) { background = own.bg; if (it) { it.bg = own.key; if (slotItems) await saveItems(database, itSlot, slotItems); } }
  }
  const logo = await assetBytes(origin, "/assets/images/mykiez_logo.png", "image/png");
  const png = await renderNewsImage(p, { theme: it && it.theme != null ? it.theme : await nextTheme(database), logo, background });
  const mediaKey = `stories/news-${storyId}-e${Date.now() % 100000000}-v6.png`; // "-v6.png" at the end: redrawNews leaves it alone
  await env.BUCKET.put(mediaKey, png, { httpMetadata: { contentType: "image/png" } });
  await database.prepare(`UPDATE stories SET media_key = ?, overlay = NULL WHERE id = ?`).bind(mediaKey, storyId).run();
  out.redrawn = true;
  out.mediaKey = mediaKey;
  // social media: the corrected story is sent again
  try {
    const m = await database.prepare(`SELECT fb_post, ig_post, ig_story FROM meta_sent WHERE story_id = ?`).bind(storyId).first().catch(() => null);
    if (m && m.fb_post) out.fbDeleted = await metaDeleteStory(env, database, storyId);
    if (m && ((m.ig_post && m.ig_post !== "failed") || (m.ig_story && m.ig_story !== "failed"))) out.igManual = true;
    const inCollection = await database.prepare(`SELECT slot FROM social_items WHERE channel = 'meta' AND story_id = ?`).bind(storyId).first().catch(() => null);
    if (inCollection) { out.igManual = true; out.inCollection = inCollection.slot; } // the collection post stays (one of many pictures)
    await database.prepare(`DELETE FROM meta_sent WHERE story_id = ?`).bind(storyId).run().catch(() => {});
    await database.prepare(`DELETE FROM social_items WHERE story_id = ? AND channel = 'meta'`).bind(storyId).run().catch(() => {});
    const tg = await telegramDeleteStory(env, database, storyId).catch(() => false);
    await database.prepare(`DELETE FROM telegram_sent WHERE story_id = ?`).bind(storyId).run().catch(() => {});
    out.social = `fb ${out.fbDeleted ? "deleted, sent again" : "sent again"} · telegram ${tg ? "deleted, sent again" : "sent again"}`;
  } catch (e) { out.social = "error"; }
  return out;
}


// ---- 2026-11-23 evening (owner "UYGULA 1"): an own background for every news picture (never the colour templates) ----
/** Topic background first (tags), else the next own background. null only when the folder is empty. */
export async function anyOwnBackground(env, database, it) {
  if (!env.BUCKET) return null;
  const all = await listBackgrounds(database);
  if (!all.length) return null;
  const t = it ? await topicBackground(database, null, it).catch(() => null) : null;
  const keys = [];
  if (t && t.backgroundKey) keys.push(t.backgroundKey);
  const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'bgturn'`).first().catch(() => null);
  const start = ((row ? Number(row.value) : 0) + 1) % all.length;
  // 2026-11-26: "yazili/reklam/duz" pictures only as the very last choice
  const order = [...all.filter((b) => !BG_NO_AUTO.includes(bgTagOf(b))), ...all.filter((b) => BG_NO_AUTO.includes(bgTagOf(b)))];
  for (let i = 0; i < order.length; i++) keys.push(order[(start + i) % order.length].key);
  for (const key of keys) {
    const obj = await env.BUCKET.get(key).catch(() => null);
    if (obj) return { key, bg: { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" } };
  }
  return null;
}
/** Preview without side effects: the first own background that fits the topic (no rotation counter). */
export async function previewBackground(env, database, it) {
  if (!env.BUCKET) return null;
  const all = await listBackgrounds(database);
  if (!all.length) return null;
  const topic = newsTopic(it || {});
  const tagOf = bgTagOf;
  const ok = all.filter((b) => !BG_NO_AUTO.includes(tagOf(b))); // 2026-11-26: no "yazili/reklam/duz" pictures
  const pick = ok.find((b) => tagOf(b) === topic) || (topic === "acil-belirsiz" && ok.find((b) => tagOf(b) === "duz")) || ok.find((b) => (BG_FALLBACK[topic] || []).includes(tagOf(b))) || ok.find((b) => tagOf(b) === "genel") || ok[0] || all[0];
  const obj = await env.BUCKET.get(pick.key).catch(() => null);
  return obj ? { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" } : null;
}
