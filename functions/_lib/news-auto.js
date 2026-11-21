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

export const NEWS_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20, 22];
export const NEWS_TOPICS = 5;
export const AUTO_COUNT = 3;
export const TEMPLATE_COUNT = 6;
const AI_MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
const UA = { "user-agent": "MyKiezBerlin/1.0 (+https://mykiezberlin.com)" };

export async function ensureNews(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS news_slots (slot TEXT PRIMARY KEY, created_at INTEGER, items TEXT, auto_done INTEGER DEFAULT 0)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS news_state (id TEXT PRIMARY KEY, value INTEGER)`),
  ]);
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
    const res = await fetch(url, { headers: UA, cf: { cacheTtl: 300 } });
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
    const res = await fetch(`https://www.tagesschau.de/api2u/news/?${query}`, { headers: UA, cf: { cacheTtl: 300 } });
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
  ]);
  const since = Date.now() - 12 * 3600000;
  const seen = new Set();
  return lists.flat().filter((n) => {
    const k = n.title.toLowerCase().replace(/[^a-z0-9äöüß]/g, "").slice(0, 40);
    if (seen.has(k) || (n.date && n.date < since)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => b.date - a.date).slice(0, 40);
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

const cut = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

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
        urgent: !!p.urgent || isUrgent(n), source: n.source, url: n.url,
        title_de: cut(p.de_title || n.title, 90), text_de: cut(p.de_text, 300), title_tr: cut(p.tr_title, 90), text_tr: cut(p.tr_text, 300), orig: cut(n.title, 160),
      };
    }).filter(Boolean);
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
  await database.prepare(`UPDATE news_slots SET items = ? WHERE slot = ?`).bind(JSON.stringify(items), slot).run();
}

/** Makes the list of the current slot if it does not exist yet. Returns the slot or null outside 06–22. */
export async function ensureCurrentSlot(env, database) {
  await ensureNews(database);
  const { slot } = berlinSlot();
  if (!slot) return null;
  const have = await getSlot(database, slot);
  if (have) return have;
  // claim the slot first, so two requests do not build it twice
  const claim = await database.prepare(`INSERT OR IGNORE INTO news_slots (slot, created_at, items) VALUES (?, ?, '[]')`).bind(slot, Date.now()).run();
  if (!claim.meta || !claim.meta.changes) return getSlot(database, slot);
  const items = await buildList(env).catch(() => []);
  await saveItems(database, slot, items);
  return getSlot(database, slot);
}

/** Publishes items of a slot as admin stories. Picture: background key (R2) or a template; text on top (overlay). */
export async function publishItems(env, database, slot, ids, opts = {}) {
  const s = await getSlot(database, slot);
  if (!s) return { published: 0 };
  const lang = opts.lang === "tr" ? "tr" : "de";
  let n = 0;
  const now = Date.now();
  const gapMs = (opts.gapMinutes || 0) * 60000;
  for (const it of s.items) {
    if (!ids.includes(it.id) || it.published) continue;
    const title = (lang === "tr" && it.title_tr) ? it.title_tr : it.title_de;
    const text = (lang === "tr" && it.text_tr) ? it.text_tr : it.text_de;
    const bg = opts.backgroundKey || (await templateKey(env, opts.template || (n % TEMPLATE_COUNT) + 1, opts.origin));
    if (!bg) continue;
    const id = crypto.randomUUID();
    const overlay = { t: (it.urgent ? "🚨 " : "") + title, x: 0.5, y: 0.5, s: 0.07, c: "#ffffff", b: "box" };
    const subtext = [text, lang === "tr" && it.text_de ? "" : it.text_tr, `Quelle: ${it.source}`].filter(Boolean).join("\n\n");
    const start = now + n * gapMs;
    await database
      .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, approved_at, link, by_admin, media_hash, text_hash, media_extra, deal, cats, overlay) VALUES (?, ?, ?, ?, ?, ?, ?, 'image', 24, 'approved', '', ?, ?, ?, 1, '', '', '[]', '', ?, ?)`)
      .bind(id, title, subtext.slice(0, 2000), "Ganz Berlin", it.urgent ? "warn" : "news", "My Kiez Berlin", bg, now, start, it.url || "", it.urgent ? "eil,berlin" : /tagesschau$/.test(it.source) ? "deutschland" : "berlin", JSON.stringify(overlay))
      .run();
    it.published = id;
    n++;
  }
  await saveItems(database, slot, s.items);
  return { published: n };
}

/** R2 key of a template picture (copied once from /assets/news/tpl-N.webp into R2). */
async function templateKey(env, nr, origin) {
  if (!env.BUCKET) return "";
  const n = Math.min(TEMPLATE_COUNT, Math.max(1, Number(nr) || 1));
  const key = `stories/news-tpl-${n}.webp`;
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
export async function newsSweep(env, database, origin) {
  try {
    await ensureNews(database);
    const last = await database.prepare(`SELECT value FROM news_state WHERE id = 'sweep'`).first();
    if (last && Date.now() - last.value < 5 * 60000) return;
    await database.prepare(`INSERT INTO news_state (id, value) VALUES ('sweep', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(Date.now()).run();
    const s = await ensureCurrentSlot(env, database);
    if (!s || s.auto_done) return;
    const flags = await readFlags(database);
    if (!flags.newsAuto || !s.items.length) return;
    const ids = [...s.items.filter((x) => x.urgent).map((x) => x.id), ...s.items.filter((x) => !x.urgent).slice(0, AUTO_COUNT).map((x) => x.id)];
    await database.prepare(`UPDATE news_slots SET auto_done = 1 WHERE slot = ?`).bind(s.slot).run();
    await publishItems(env, database, s.slot, ids, { origin, gapMinutes: 20 });
  } catch (e) {
    // never break the story list
  }
}
