// 2026-11-22 (owner): "Social-Planer" – every day at fixed times (default 08:00, 16:00, 23:00 Berlin time)
// the site does the social media work by itself:
//   1. Telegram: sends the live own + sponsor stories that are not in the channel yet (telegramBacklog).
//   2. Facebook + Instagram (only with META_PAGE_TOKEN + FB_PAGE_ID / IG_USER_ID): ONE collection post
//      (Instagram carousel / Facebook multi-photo post) with the new own + sponsor picture stories.
//      Stories that metaSweep already posted alone (meta_sent) are left out.
//   3. TikTok + WhatsApp channel have no usable API: the admin card shows a ready package
//      (pictures + text with max 5 hashtags); after sharing on the phone the admin taps "geteilt".
// Never twice: every story is written to social_items (channel + story id) BEFORE it is posted.
// Only stories approved after the first setup are used (the bulk post of 22.11.2026 was done by hand).
// Cloudflare Pages has no cron: the check runs from GET /api/stories (app + web ask every minute).
// So a slot runs at the first visit after its time (up to 3 h later). Never throws.
import { OWN_AUTHORS, telegramBacklog, telegramReady } from "./telegram.js";
import { metaReady, metaEnv } from "./meta-social.js";

const SITE = "https://mykiezberlin.com";
const GRAPH = "https://graph.facebook.com/v21.0";
const LATE_MS = 3 * 3600 * 1000;
const DEFAULTS = { times: ["08:00", "16:00", "23:00"], telegram: true, meta: true, pack: true };
export const PACK_CHANNELS = ["tiktok", "whatsapp"];
let lastCheck = 0;

async function ensureTables(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS social_state (key TEXT PRIMARY KEY, value TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS social_runs (slot TEXT PRIMARY KEY, started INTEGER, result TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS social_items (channel TEXT, story_id TEXT, at INTEGER, slot TEXT, PRIMARY KEY (channel, story_id))`),
    database.prepare(`CREATE TABLE IF NOT EXISTS meta_sent (story_id TEXT PRIMARY KEY, sent_at INTEGER, fb_post TEXT, fb_story TEXT, ig_post TEXT, ig_story TEXT, ig_wait TEXT, log TEXT)`),
  ]);
  await database.prepare(`INSERT OR IGNORE INTO social_state (key, value) VALUES ('since', ?)`).bind(String(Date.now())).run();
}

function cleanTimes(list) {
  const out = [];
  for (const t of Array.isArray(list) ? list : []) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) continue;
    const v = `${m[1].padStart(2, "0")}:${m[2]}`;
    if (!out.includes(v)) out.push(v);
  }
  return out.sort().slice(0, 4);
}

export async function plannerSettings(database) {
  await ensureTables(database);
  const row = await database.prepare(`SELECT value FROM social_state WHERE key = 'settings'`).first();
  let s = {};
  try { s = JSON.parse((row && row.value) || "{}") || {}; } catch (e) { s = {}; }
  const times = cleanTimes(s.times);
  return { ...DEFAULTS, ...s, times: times.length ? times : DEFAULTS.times };
}

export async function saveSettings(database, body) {
  const old = await plannerSettings(database);
  const times = cleanTimes(body.times);
  const s = {
    times: times.length ? times : old.times,
    telegram: body.telegram === undefined ? old.telegram : Boolean(body.telegram),
    meta: body.meta === undefined ? old.meta : Boolean(body.meta),
    pack: body.pack === undefined ? old.pack : Boolean(body.pack),
  };
  await database.prepare(`INSERT INTO social_state (key, value) VALUES ('settings', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).bind(JSON.stringify(s)).run();
  return s;
}

/** Berlin wall clock -> epoch ms (works with summer/winter time). */
function berlinOffsetMs(now) {
  const p = {};
  for (const x of new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now))) p[x.type] = x.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(now / 1000) * 1000;
}
function berlinDate(ms) { return new Date(ms + berlinOffsetMs(ms)).toISOString().slice(0, 10); }
function slotEpoch(date, time, now) {
  const [y, m, d] = date.split("-").map(Number), [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - berlinOffsetMs(now);
}

/** The slot that is due now (time passed, less than 3 h ago), or null. */
export function dueSlot(times, now) {
  const today = berlinDate(now), yesterday = berlinDate(now - 24 * 3600 * 1000);
  let best = null;
  for (const date of [yesterday, today]) for (const t of times) {
    const at = slotEpoch(date, t, now);
    if (at <= now && now - at < LATE_MS && (!best || at > best.at)) best = { key: `${date} ${t}`, at };
  }
  return best;
}
export function nextSlot(times, now) {
  const today = berlinDate(now), tomorrow = berlinDate(now + 24 * 3600 * 1000);
  for (const date of [today, tomorrow]) for (const t of times) if (slotEpoch(date, t, now) > now) return `${date} ${t}`;
  return "";
}

async function sponsorNames(database) {
  try { return ((await database.prepare(`SELECT name FROM ads WHERE active = 1`).all()).results || []).map((r) => r.name).filter(Boolean); } catch (e) { return []; }
}

/** Live own + sponsor stories approved after the setup that are not done yet for `channel`. */
export async function openStories(database, channel, now = Date.now()) {
  await ensureTables(database);
  const since = Number((await database.prepare(`SELECT value FROM social_state WHERE key = 'since'`).first())?.value) || now;
  const authors = [...OWN_AUTHORS, ...(await sponsorNames(database))];
  const extra = channel === "meta" ? `AND s.id NOT IN (SELECT story_id FROM meta_sent)` : "";
  const { results } = await database
    .prepare(`SELECT s.id, s.headline, s.subtext, s.kiez, s.media_key, s.media_type, s.author, s.approved_at FROM stories s
      LEFT JOIN social_items i ON i.story_id = s.id AND i.channel = ?
      WHERE i.story_id IS NULL AND s.status = 'approved' AND s.approved_at >= ? AND s.approved_at <= ?
        AND s.approved_at + s.duration_hours * 3600000 > ? ${extra}
      ORDER BY s.approved_at ASC LIMIT 100`)
    .bind(channel, since, now, now)
    .all();
  return (results || []).filter((s) => authors.includes(s.author)).map((s) => ({ ...s, media: s.media_key ? `${SITE}/media/${s.media_key}` : "" }));
}

/** Text for a collection post – max 5 hashtags (Instagram + TikTok limit). */
export function collectionText(stories, now = Date.now()) {
  const h = Number(new Date(now + berlinOffsetMs(now)).toISOString().slice(11, 13));
  const part = h < 12 ? "am Morgen" : h < 19 ? "am Nachmittag" : "am Abend";
  const date = new Date(now + berlinOffsetMs(now)).toISOString().slice(0, 10).split("-").reverse().join(".");
  const lines = [`📰 My Kiez Berlin ${part} · ${date}`, ""];
  for (const s of stories.slice(0, 10)) lines.push(`• ${String(s.headline || "").trim().slice(0, 120)}${s.kiez && s.kiez !== "Ganz Berlin" ? ` (📍 ${s.kiez})` : ""}`);
  lines.push("", `👉 ${SITE} · 📲 App: My Kiez Berlin`, "", "#berlin #mykiezberlin #kiez #berlinnews #kiezleben");
  return lines.join("\n").slice(0, 2100);
}

async function graph(env, path, params) {
  const body = new URLSearchParams({ ...params, access_token: env.META_PAGE_TOKEN });
  const res = await fetch(`${GRAPH}/${path}`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  return res.ok && data && !data.error ? data : null;
}

/** Facebook multi-photo post + Instagram carousel (1 picture = normal post). */
async function postCollection(env, stories, text) {
  const out = { fb: "", ig: "" };
  const pics = stories.filter((s) => s.media && s.media_type !== "video").slice(0, 10);
  if (!pics.length) return out;
  const page = env.FB_PAGE_ID;
  const ids = [];
  for (const s of pics) {
    const p = await graph(env, `${page}/photos`, { url: s.media, published: "false" });
    if (p && p.id) ids.push(p.id);
  }
  if (ids.length) {
    const params = { message: text };
    ids.forEach((id, i) => { params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id }); });
    const f = await graph(env, `${page}/feed`, params);
    out.fb = (f && f.id) || "";
  }
  const ig = env.IG_USER_ID;
  if (ig) {
    let creation = "";
    if (pics.length === 1) {
      const c = await graph(env, `${ig}/media`, { image_url: pics[0].media, caption: text });
      creation = (c && c.id) || "";
    } else {
      const children = [];
      for (const s of pics) {
        const c = await graph(env, `${ig}/media`, { image_url: s.media, is_carousel_item: "true" });
        if (c && c.id) children.push(c.id);
      }
      if (children.length >= 2) {
        const c = await graph(env, `${ig}/media`, { media_type: "CAROUSEL", children: children.join(","), caption: text });
        creation = (c && c.id) || "";
      }
    }
    if (creation) {
      const p = await graph(env, `${ig}/media_publish`, { creation_id: creation });
      out.ig = (p && p.id) || "";
    }
  }
  return out;
}

export async function markDone(database, channel, ids, slot) {
  let n = 0;
  for (const id of ids || []) {
    const r = await database.prepare(`INSERT OR IGNORE INTO social_items (channel, story_id, at, slot) VALUES (?, ?, ?, ?)`).bind(channel, String(id), Date.now(), slot || "").run();
    n += (r.meta && r.meta.changes) || 0;
  }
  return n;
}

/** Runs one slot. The slot row is the lock: a slot never runs twice. */
export async function runSlot(env, database, slot) {
  await ensureTables(database);
  const now = Date.now();
  const lock = await database.prepare(`INSERT OR IGNORE INTO social_runs (slot, started, result) VALUES (?, ?, '')`).bind(slot, now).run();
  if (!lock.meta || !lock.meta.changes) return { skipped: "already_ran" };
  const s = await plannerSettings(database);
  const result = { telegram: "off", meta: "off", pack: {} };
  if (s.telegram) {
    if (!telegramReady(env)) result.telegram = "not_set";
    else { const t = await telegramBacklog(env, database, { mode: "send", limit: 10 }).catch(() => ({ error: "failed" })); result.telegram = t.error || `${t.sent || 0} gesendet`; }
  }
  if (s.meta) {
    if (!metaReady(env)) result.meta = "not_set";
    else {
      const todo = (await openStories(database, "meta", now)).filter((x) => x.media && x.media_type !== "video").slice(0, 10);
      if (!todo.length) result.meta = "nichts neu";
      else {
        await markDone(database, "meta", todo.map((x) => x.id), slot); // never twice, even if the post fails
        const r = await postCollection(await metaEnv(env, database), todo, collectionText(todo, now)) // 2026-11-23: user token -> page token.catch(() => ({ fb: "", ig: "" }));
        result.meta = `${todo.length} Bilder · FB ${r.fb ? "ok" : "Fehler"} · IG ${r.ig ? "ok" : env.IG_USER_ID ? "Fehler" : "kein IG_USER_ID"}`;
      }
    }
  }
  if (s.pack) for (const c of PACK_CHANNELS) result.pack[c] = (await openStories(database, c, now)).length;
  await database.prepare(`UPDATE social_runs SET result = ? WHERE slot = ?`).bind(JSON.stringify(result), slot).run();
  return result;
}

/** Called with waitUntil from GET /api/stories. Never throws. */
export async function socialPlanerSweep(env, database) {
  try {
    const now = Date.now();
    if (!database || now - lastCheck < 60 * 1000) return;
    lastCheck = now;
    const s = await plannerSettings(database);
    const due = dueSlot(s.times, now);
    if (!due) return;
    const done = await database.prepare(`SELECT 1 FROM social_runs WHERE slot = ?`).bind(due.key).first();
    if (done) return;
    await runSlot(env, database, due.key);
  } catch (e) {
    // the planner must never break the story list
  }
}

// ---- 2026-11-22 (owner: "1 – Kiez başına WhatsApp paketi"): one ready package per WhatsApp Kiez group ----
// WhatsApp has no API for groups: the admin copies the text, opens the group, sends, taps "geteilt".
// Each group is its own channel in social_items ("wa-<key>") -> a story is never offered twice to the same group.
// Kiez groups get their own Kiez stories + the 3 newest Berlin-wide ones; "Ganz Berlin" gets everything (max 10).
export const WA_KIEZ_GROUPS = [
  { key: "neukoelln", name: "Neukölln", url: "https://chat.whatsapp.com/EiCUYfwfQYr9eve4WT5STZ", match: /neuk[öo]lln|britz|rudow|buckow/i },
  { key: "kreuzberg", name: "Kreuzberg", url: "https://chat.whatsapp.com/JDUKCyyyyY6HsxclTEhdDP", match: /kreuzberg/i },
  { key: "wedding", name: "Wedding", url: "https://chat.whatsapp.com/G0yav64xcdyFd5rLztmsiV", match: /wedding|gesundbrunnen/i },
  { key: "moabit", name: "Moabit", url: "https://chat.whatsapp.com/Be6LDHBHC6K5YqM8acT3Cs", match: /moabit|tiergarten/i },
  { key: "spandau", name: "Spandau", url: "https://chat.whatsapp.com/IO6E8If42yWKPgoPsPdV8z", match: /spandau/i },
  { key: "berlin", name: "Ganz Berlin", url: "https://chat.whatsapp.com/GCPuN7MEzEVLjutfKIYRqb", match: null },
];
const WA_GENERAL = /^(ganz berlin|berlin|berlin & umgebung)$/i;
export const isWaKiezChannel = (c) => typeof c === "string" && WA_KIEZ_GROUPS.some((g) => `wa-${g.key}` === c);

function kiezText(group, stories, now) {
  const h = Number(new Date(now + berlinOffsetMs(now)).toISOString().slice(11, 13));
  const part = h < 12 ? "Guten Morgen" : h < 19 ? "Neu am Nachmittag" : "Neu am Abend";
  const lines = [`📍 My Kiez ${group.name} · ${part}`, ""];
  for (const s of stories) lines.push(`• ${String(s.headline || "").trim().slice(0, 120)}${s.kiez && !WA_GENERAL.test(s.kiez) && group.key === "berlin" ? ` (📍 ${s.kiez})` : ""}`);
  lines.push("", `👉 Alles mit Bildern: ${SITE}`, "📲 App: My Kiez Berlin · Tümü resimli: mykiezberlin.com");
  return lines.join("\n").slice(0, 2000);
}

export async function kiezPacks(database, now = Date.now()) {
  const out = [];
  for (const g of WA_KIEZ_GROUPS) {
    const open = await openStories(database, `wa-${g.key}`, now);
    let list;
    if (!g.match) list = open.slice(-10);
    else {
      const own = open.filter((s) => g.match.test(String(s.kiez || "")));
      const general = open.filter((s) => WA_GENERAL.test(String(s.kiez || ""))).slice(-3);
      list = [...own, ...general].sort((a, b) => a.approved_at - b.approved_at).slice(-10);
    }
    out.push({ key: g.key, channel: `wa-${g.key}`, name: g.name, url: g.url, text: list.length ? kiezText(g, list, now) : "", stories: list.map((s) => ({ id: s.id, headline: s.headline, kiez: s.kiez, media: s.media, video: s.media_type === "video" })) });
  }
  return out;
}
