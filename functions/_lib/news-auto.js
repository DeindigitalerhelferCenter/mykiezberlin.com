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
  // 2026-11-22 (owner): language pairs – "tr-de" (default), "tr-en", "de" (DE + TR), "tr" (only TR)
  const lang = ["tr-de", "tr-en", "de", "tr"].includes(opts.lang) ? opts.lang : "tr-de";
  let n = 0;
  const now = Date.now();
  const gapMs = (opts.gapMinutes || 0) * 60000;
  const logo = await assetBytes(opts.origin, "/assets/images/mykiez_logo.png", "image/png");
  let background = null;
  if (opts.backgroundKey && env.BUCKET) {
    const obj = await env.BUCKET.get(opts.backgroundKey).catch(() => null);
    if (obj) background = { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" };
  }
  for (const it of s.items) {
    if (!ids.includes(it.id) || it.published) continue;
    const p = newsParts(it, lang);
    const id = crypto.randomUUID();
    const theme = (opts.template ? Number(opts.template) - 1 : n) % TEMPLATE_COUNT;
    // the picture with all text inside; if drawing fails: template + text layer (older way)
    let mediaKey = "";
    let overlay = null;
    try {
      const png = await renderNewsImage(p, { theme, logo, background });
      mediaKey = `stories/news-${id}.png`;
      await env.BUCKET.put(mediaKey, png, { httpMetadata: { contentType: "image/png" } });
    } catch (e) {
      it.renderError = String((e && e.message) || e).slice(0, 120);
      mediaKey = opts.backgroundKey || (await templateKey(env, theme + 1, opts.origin));
      overlay = { t: (it.urgent ? "🚨 " : "") + p.title1, x: 0.5, y: 0.5, s: 0.07, c: "#ffffff", b: "box" };
    }
    if (!mediaKey) continue;
    const subtext = [p.text1, p.text2, `${p.sourceLabel}: ${it.source}`].filter(Boolean).join("\n\n");
    const start = now + n * gapMs;
    await database
      .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, approved_at, link, by_admin, media_hash, text_hash, media_extra, deal, cats, overlay) VALUES (?, ?, ?, ?, ?, ?, ?, 'image', 24, 'approved', '', ?, ?, ?, 1, '', '', '[]', '', ?, ?)`)
      .bind(id, p.title1, subtext.slice(0, 2000), "Ganz Berlin", it.urgent ? "warn" : "news", "My Kiez Berlin", mediaKey, now, start, it.url || "", it.urgent ? "eil,berlin" : /tagesschau$/.test(it.source) ? "deutschland" : "berlin", overlay ? JSON.stringify(overlay) : null)
      .run();
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
      const png = await renderNewsImage({ title1: r.headline, title2: "", text1: texts[1] || "", text2: texts[0] || "", sourceLabel: "Kaynak / Quelle", source: src, url: r.link, urgent: r.kind === "warn" }, { theme: 1, logo });
      const key = `stories/news-${r.id}.png`;
      await env.BUCKET.put(key, png, { httpMetadata: { contentType: "image/png" } });
      await database.prepare(`UPDATE stories SET media_key = ?, overlay = NULL WHERE id = ?`).bind(key, r.id).run();
    } catch (e) {
      return; // drawing not possible here – keep the old picture
    }
  }
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
export async function newsSweep(env, database, origin) {
  try {
    await ensureNews(database);
    const last = await database.prepare(`SELECT value FROM news_state WHERE id = 'sweep'`).first();
    if (last && Date.now() - last.value < 5 * 60000) return;
    await database.prepare(`INSERT INTO news_state (id, value) VALUES ('sweep', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(Date.now()).run();
    await upgradeOldNews(env, database, origin).catch(() => {});
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
