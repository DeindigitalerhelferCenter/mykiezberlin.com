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
    // 2026-11-22 (owner): own background pictures of the admin (R2 key stories/news-bglib-<uuid>.jpg)
    database.prepare(`CREATE TABLE IF NOT EXISTS news_bgs (key TEXT PRIMARY KEY, name TEXT, created_at INTEGER)`),
  ]);
}

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
  const { results } = await database.prepare(`SELECT key, name, created_at FROM news_bgs ORDER BY created_at ASC`).all();
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
async function chooseBackground(database, settings) {
  const bgs = (await listBackgrounds(database)).map((b) => `b:${b.key}`);
  let cands = settings.bgMode === "pick" ? settings.bgPicks.filter((x) => x.startsWith("t") || bgs.includes(x)) : [];
  if (!cands.length) cands = [...Array.from({ length: TEMPLATE_COUNT }, (_, i) => `t${i + 1}`), ...bgs];
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
    // 2026-11-21 (owner): more Berlin sources (checked: RSS works)
    rss("https://www.morgenpost.de/berlin/rss", "Berliner Morgenpost"),
    rss("https://taz.de/!p4649;rss/", "taz Berlin"),
    rss("https://www.berliner-kurier.de/feed.xml", "Berliner Kurier"),
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

// 2026-11-22 (owner): the text must stay close to the real source -> read the first paragraphs of the article
async function articleText(url) {
  try {
    const res = await fetch(url, { headers: UA, cf: { cacheTtl: 900 } });
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

const cut = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// 2026-11-21 (owner): the list was never made – the background work (waitUntil, max. 30 s) was cut while it
// read 6 sources, asked the AI and wrote all texts; the slot stayed claimed with an EMPTY list for ever.
// Now in steps: 1) pickList (sources + AI choice, short texts), saved at once; 2) writeSome writes the long
// texts of 2 topics per step; an empty or half list is taken up again by the next request.
export async function pickList(env, opts = {}) {
  const skip = opts.exclude instanceof Set ? opts.exclude : new Set();
  const all = await collectNews();
  // 2026-11-22 (owner): "Şimdi analiz et" must bring NEW topics – shown / deleted ones are left out (if enough are left)
  const fresh = all.filter((n) => !skip.has(cut(n.title, 160)));
  const news = fresh.length >= 4 ? fresh : all.filter((n) => !opts.blocked || !opts.blocked.has(cut(n.title, 160)));
  const picked = await aiPick(env, news);
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
    items = news.slice(0, NEWS_TOPICS + 3).map((n) => ({ urgent: isUrgent(n), source: n.source, url: n.url, title_de: cut(n.title, 90), text_de: "", title_tr: "", text_tr: "", orig: cut(n.title, 160), noAi: true, written: true }));
  }
  const urgent = items.filter((x) => x.urgent).slice(0, 3);
  const normal = items.filter((x) => !x.urgent).slice(0, NEWS_TOPICS);
  return [...urgent, ...normal].map((x, i) => ({ ...x, id: `n${i + 1}`, published: "" }));
}

/** Writes the long TR/DE/EN texts of up to `max` topics that are not written yet. Returns how many are still open. */
export async function writeSome(env, items, max = 2) {
  const todo = items.filter((x) => x.written === false).slice(0, max);
  for (const it of todo) {
    const article = await articleText(it.url).catch(() => "");
    const w = await aiWrite(env, [{ source: it.source, title: it.orig, teaser: it.teaser || "", article }]).catch(() => null);
    const x = w && w[0];
    if (x) {
      if (x.tr_title) it.title_tr = cut(x.tr_title, 90);
      if (x.tr_text) it.text_tr = cut(x.tr_text, 420);
      if (x.de_title) it.title_de = cut(x.de_title, 90);
      if (x.de_text) it.text_de = cut(x.de_text, 420);
      if (x.en_title) it.title_en = cut(x.en_title, 90);
      if (x.en_text) it.text_en = cut(x.en_text, 420);
    }
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
  const items = await pickList(env, { exclude: blocked, blocked }).catch(() => []);
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
    const p = newsParts(it, lang);
    const id = crypto.randomUUID();
    // 2026-11-22 (owner): own choice of the admin, otherwise the next colour (server counter, not "n" – was always red)
    let theme;
    let itemBgKey = opts.backgroundKey || "";
    if (opts.template) theme = (Number(opts.template) - 1) % TEMPLATE_COUNT;
    else if (settings && !opts.backgroundKey) {
      // 2026-11-22 (owner): background folder – rotating (templates + own pictures) or the 1–2 the admin picked
      const c = await chooseBackground(database, settings);
      theme = c.theme;
      if (c.backgroundKey) { itemBgKey = c.backgroundKey; background = await loadBg(c.backgroundKey); } else background = null;
    } else theme = await nextTheme(database);
    it.theme = theme; it.lang = lang; if (itemBgKey) it.bg = itemBgKey; else delete it.bg; // for a later redraw
    // the picture with all text inside; if drawing fails: template + text layer (older way)
    let mediaKey = "";
    let overlay = null;
    try {
      const png = await renderNewsImage(p, { theme, logo, background });
      mediaKey = `stories/news-${id}-v2.png`; // 2026-11-22: "-v2" = new text fitting
      await env.BUCKET.put(mediaKey, png, { httpMetadata: { contentType: "image/png" } });
    } catch (e) {
      it.renderError = String((e && e.message) || e).slice(0, 120);
      mediaKey = itemBgKey || (await templateKey(env, theme + 1, opts.origin));
      overlay = { t: (it.urgent ? "🚨 " : "") + p.title1, x: 0.5, y: 0.5, s: 0.07, c: "#ffffff", b: "box" };
    }
    if (!mediaKey) continue;
    const subtext = [p.text1, p.text2, `${p.sourceLabel}: ${it.source}`].filter(Boolean).join("\n\n");
    const start = now + n * gapMs;
    await database
      .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, approved_at, link, by_admin, media_hash, text_hash, media_extra, deal, cats, overlay) VALUES (?, ?, ?, ?, ?, ?, ?, 'image', 24, 'approved', '', ?, ?, ?, 1, '', '', '[]', '', ?, ?)`)
      .bind(id, p.title1, subtext.slice(0, 2000), "Ganz Berlin", it.urgent ? "warn" : "news", "My Kiez Berlin", mediaKey, now, start, it.url || "", it.urgent ? "eil,berlin" : /tagesschau$/.test(it.source) ? "deutschland" : "berlin", overlay ? JSON.stringify(overlay) : null)
      .run();
    it.shares = [...(it.shares || (it.published ? [it.published] : [])), id];
    it.published = id;
    n++;
  }
  await saveItems(database, slot, s.items);
  return { published: n };
}

/** Title/description pair for the chosen language mode. */
export function newsParts(it, lang) {
  const tr = { t: it.title_tr || it.title_de, x: it.text_tr || it.text_de };
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
    .prepare(`SELECT id, headline, subtext, link, kind, media_key FROM stories WHERE status = 'approved' AND media_key LIKE 'stories/news-%.png' AND media_key NOT LIKE '%-v2.png' AND media_key NOT LIKE 'stories/news-render-check%' AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT ?`)
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
    let p;
    let background = null;
    if (it) {
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
    try {
      const png = await renderNewsImage(p, { theme: await nextTheme(database), logo, background });
      const key = `stories/news-${r.id}-v2.png`;
      await env.BUCKET.put(key, png, { httpMetadata: { contentType: "image/png" } });
      await database.prepare(`UPDATE stories SET media_key = ?, overlay = NULL WHERE id = ?`).bind(key, r.id).run();
      done++;
    } catch (e) {
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
    const s = await ensureCurrentSlot(env, database);
    step = s ? `list ${s.items.length} open ${s.items.filter((x) => x.written === false).length} done ${s.auto_done ? 1 : 0}` : "no slot (22-06)";
    await sweepLog(database, step);
    if (!busy) {
      await upgradeOldNews(env, database, origin).catch(() => {});
      await redrawNews(env, database, origin).catch(() => {}); // 2026-11-22: once for the older pictures
    }
    if (!s || s.auto_done || s.items.some((x) => x.written === false)) return;
    const flags = await readFlags(database);
    if (!flags.newsAuto || !s.items.length) { await sweepLog(database, flags.newsAuto ? "empty list" : "auto off"); return; }
    const vis = s.items.filter((x) => !x.hidden); // 2026-11-22: hidden ("kapalı") topics are not shared
    const ids = [...vis.filter((x) => x.urgent).map((x) => x.id), ...vis.filter((x) => !x.urgent).slice(0, AUTO_COUNT).map((x) => x.id)];
    await database.prepare(`UPDATE news_slots SET auto_done = 1 WHERE slot = ?`).bind(s.slot).run();
    const st = await readSettings(database);
    step = `publish ${ids.length}`;
    await sweepLog(database, step);
    const r = await publishItems(env, database, s.slot, ids, { origin, gapMinutes: st.gap, lang: st.lang, useSettings: true, skipHidden: true });
    await sweepLog(database, `published ${r.published} of ${ids.length} (${s.slot})`);
  } catch (e) {
    // never break the story list
    await sweepLog(database, step, e);
  }
}
