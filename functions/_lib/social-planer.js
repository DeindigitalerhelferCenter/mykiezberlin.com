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
import { shareAuthors } from "./social-authors.js"; // 2026-11-23

const SITE = "https://mykiezberlin.com";
const GRAPH = "https://graph.facebook.com/v21.0";
const LATE_MS = 3 * 3600 * 1000;
const DEFAULTS = { times: ["08:00", "12:00", "18:00", "22:00"], telegram: true, meta: true, pack: true }; // 2026-11-23 (owner): 8/12/18/22 (was 8/16/23)
export const PACK_CHANNELS = ["tiktok", "whatsapp"];
let lastCheck = 0;

async function ensureTables(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS social_state (key TEXT PRIMARY KEY, value TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS social_runs (slot TEXT PRIMARY KEY, started INTEGER, result TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS social_items (channel TEXT, story_id TEXT, at INTEGER, slot TEXT, PRIMARY KEY (channel, story_id))`),
    database.prepare(`CREATE TABLE IF NOT EXISTS meta_sent (story_id TEXT PRIMARY KEY, sent_at INTEGER, fb_post TEXT, fb_story TEXT, ig_post TEXT, ig_story TEXT, ig_wait TEXT, log TEXT)`),
    // 2026-11-23 (owner "UYGULA 4"): collection posts are sent step by step (see runJobStep)
    database.prepare(`CREATE TABLE IF NOT EXISTS social_jobs (id TEXT PRIMARY KEY, slot TEXT, title TEXT, ids TEXT, media TEXT, text TEXT, state TEXT, status TEXT, lock INTEGER, created INTEGER, result TEXT)`),
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
  let times = cleanTimes(s.times);
  // 2026-11-23 (owner): the old default 8/16/23 becomes 8/12/18/22 once; times saved later by the admin stay
  if (!s.timesV2 && times.join(",") === "08:00,16:00,23:00") times = DEFAULTS.times;
  return { ...DEFAULTS, ...s, times: times.length ? times : DEFAULTS.times };
}

export async function saveSettings(database, body) {
  const old = await plannerSettings(database);
  const times = cleanTimes(body.times);
  const s = {
    times: times.length ? times : old.times,
    timesV2: true,
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
  // 2026-11-23 (owner "UYGULA 2"): no capital/small difference, sponsor names that are written a bit differently,
  // trusted users and the admin's own choice count too (see social-authors.js); the exact old list still counts
  const ok = await shareAuthors(database).catch(() => null);
  return (results || []).filter((s) => authors.includes(s.author) || (ok && ok(s.author))).map((s) => ({ ...s, media: s.media_key ? `${SITE}/media/${s.media_key}` : "" }));
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
      // 2026-11-23 (owner "UYGULA 4"): the whole collection in ONE run took longer than 30 s -> the run was cut and the
      // stories were marked "done" without being posted (08:00 + 12:00). Now the run only makes JOBS (fast); the posting
      // is done step by step (runJobStep, one small step per minute) and a failed job gives its stories back.
      const jobs = [];
      if (todo.length) jobs.push({ title: "", ids: todo.map((x) => x.id), media: todo.map((x) => x.media), text: collectionText(todo, now) });
      for (const g of await sponsorMediaGroups(database, now).catch(() => [])) jobs.push(g); // 2026-11-23 (owner "UYGULA 5")
      if (!jobs.length) result.meta = "nichts neu";
      else {
        for (const j of jobs) {
          await markDone(database, "meta", j.ids, slot); // reserved (never twice); given back if the job fails
          await database.prepare(`INSERT INTO social_jobs (id, slot, title, ids, media, text, state, status, lock, created, result) VALUES (?, ?, ?, ?, ?, ?, '{}', 'open', 0, ?, '')`)
            .bind(crypto.randomUUID(), slot, j.title || "", JSON.stringify(j.ids), JSON.stringify(j.media), j.text, Date.now()).run();
        }
        const pics = jobs.reduce((n, j) => n + j.media.length, 0);
        result.meta = `${pics} Bilder in ${jobs.length} Paket(en) · wird gesendet …`;
      }
      if (false) await postCollection(await metaEnv(env, database), todo, collectionText(todo, now)); // old way (kept, not used)
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
    await fixCutRuns(database).catch(() => {}); // 2026-11-23: once – cut runs of 23.11 give their stories back
    if (await runJobStep(env, database).catch(() => false)) return; // 2026-11-23: one posting step per run
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

// ---- 2026-11-23 (owner "UYGULA 4-5"): collection posts step by step ----
// A job = one Facebook multi-photo post + one Instagram carousel (1 picture = normal post). Every call does ONE small
// step (max. 3 uploads), so a run is never cut by the 30 s limit; every result is saved at once. When Facebook AND
// Instagram both fail, the stories are given back (social_items row deleted) and come again in the next slot.
let jobErr = "";
async function jobGraph(env, path, params) {
  const body = new URLSearchParams({ ...params, access_token: env.META_PAGE_TOKEN });
  const res = await fetch(`${GRAPH}/${path}`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.error) jobErr = `${path.split("/").pop()}: ${String((data && data.error && data.error.message) || res.status).slice(0, 140)}`;
  return res.ok && data && !data.error ? data : null;
}
async function jobGraphGet(env, path, fields) {
  const res = await fetch(`${GRAPH}/${path}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(env.META_PAGE_TOKEN)}`);
  const data = await res.json().catch(() => ({}));
  return res.ok && data && !data.error ? data : null;
}

/** One step of the oldest open job. true = a step was done (the caller stops for this run). */
export async function runJobStep(env, database) {
  if (!metaReady(env)) return false;
  await ensureTables(database);
  const now = Date.now();
  const job = await database.prepare(`SELECT * FROM social_jobs WHERE status = 'open' ORDER BY created ASC LIMIT 1`).first();
  if (!job) return false;
  const lock = await database.prepare(`UPDATE social_jobs SET lock = ? WHERE id = ? AND lock < ?`).bind(now, job.id, now - 90000).run();
  if (!lock.meta || !lock.meta.changes) return true; // another run works on it
  const menv = await metaEnv(env, database);
  let st = {};
  try { st = JSON.parse(job.state || "{}") || {}; } catch (e) { st = {}; }
  const media = JSON.parse(job.media || "[]");
  const page = env.FB_PAGE_ID, ig = env.IG_USER_ID;
  jobErr = "";
  st.steps = (st.steps || 0) + 1;
  if (!st.fbDone) {
    st.fbIds = st.fbIds || [];
    if (st.fbIds.length < media.length) {
      for (const url of media.slice(st.fbIds.length, st.fbIds.length + 3)) {
        const p = await jobGraph(menv, `${page}/photos`, { url, published: "false" });
        st.fbIds.push((p && p.id) || "");
      }
    } else {
      const ok = st.fbIds.filter(Boolean);
      if (ok.length) {
        const params = { message: job.text };
        ok.forEach((id, i) => { params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id }); });
        const f = await jobGraph(menv, `${page}/feed`, params);
        st.fb = (f && f.id) || "failed";
      } else st.fb = "failed";
      st.fbDone = true;
    }
  } else if (!st.igDone && ig) {
    st.igKids = st.igKids || [];
    if (!st.igCreation && media.length === 1) {
      const c = await jobGraph(menv, `${ig}/media`, { image_url: media[0], caption: job.text });
      st.igCreation = (c && c.id) || "failed";
    } else if (!st.igCreation && st.igKids.length < media.length) {
      for (const url of media.slice(st.igKids.length, st.igKids.length + 3)) {
        const c = await jobGraph(menv, `${ig}/media`, { image_url: url, is_carousel_item: "true" });
        st.igKids.push((c && c.id) || "");
      }
    } else if (!st.igCreation) {
      const kids = st.igKids.filter(Boolean);
      if (kids.length >= 2) {
        const c = await jobGraph(menv, `${ig}/media`, { media_type: "CAROUSEL", children: kids.join(","), caption: job.text });
        st.igCreation = (c && c.id) || "failed";
      } else if (kids.length === 1) {
        const c = await jobGraph(menv, `${ig}/media`, { image_url: media[st.igKids.indexOf(kids[0])], caption: job.text });
        st.igCreation = (c && c.id) || "failed";
      } else st.igCreation = "failed";
    } else if (st.igCreation === "failed") {
      st.ig = "failed"; st.igDone = true;
    } else {
      const s = await jobGraphGet(menv, st.igCreation, "status_code");
      const code = s && s.status_code;
      if (code === "FINISHED" || !code) {
        const p = await jobGraph(menv, `${ig}/media_publish`, { creation_id: st.igCreation });
        st.ig = (p && p.id) || "";
        if (!st.ig) { const again = await jobGraphGet(menv, st.igCreation, "status_code"); st.ig = again && again.status_code === "PUBLISHED" ? "published" : "failed"; }
        st.igDone = true;
      } else if (code === "PUBLISHED") { st.ig = "published"; st.igDone = true; }
      else if (code === "ERROR" || st.steps > 40) { st.ig = "failed"; st.igDone = true; }
      // IN_PROGRESS: wait for the next run
    }
  } else {
    if (!ig) { st.ig = "kein IG_USER_ID"; st.igDone = true; }
  }
  if (jobErr) st.err = jobErr;
  const finished = st.fbDone && (st.igDone || !ig);
  if (finished) {
    const fbOk = st.fb && st.fb !== "failed", igOk = st.ig && st.ig !== "failed" && st.ig !== "kein IG_USER_ID";
    const ids = JSON.parse(job.ids || "[]");
    if (!fbOk && !igOk) for (const id of ids) await database.prepare(`DELETE FROM social_items WHERE channel = 'meta' AND story_id = ? AND slot = ?`).bind(String(id), job.slot).run(); // back in the queue
    const line = `${job.title ? job.title + ": " : ""}${media.length} Bilder · FB ${fbOk ? "ok" : "Fehler"} · IG ${igOk ? "ok" : ig ? "Fehler" : "kein IG_USER_ID"}${!fbOk && !igOk ? " (kommt im nächsten Lauf wieder)" : ""}`;
    await database.prepare(`UPDATE social_jobs SET state = ?, status = ?, result = ?, lock = 0 WHERE id = ?`).bind(JSON.stringify(st), fbOk || igOk ? "done" : "failed", line, job.id).run();
    // the slot line in "Letzte Läufe" shows all jobs of the slot
    const { results } = await database.prepare(`SELECT status, result FROM social_jobs WHERE slot = ? ORDER BY created ASC`).bind(job.slot).all();
    const run = await database.prepare(`SELECT result FROM social_runs WHERE slot = ?`).bind(job.slot).first();
    let r = {};
    try { r = JSON.parse((run && run.result) || "{}") || {}; } catch (e) { r = {}; }
    r.meta = (results || []).map((x) => (x.status === "open" ? "⏳ wird gesendet" : x.result)).join(" | ");
    await database.prepare(`UPDATE social_runs SET result = ? WHERE slot = ?`).bind(JSON.stringify(r), job.slot).run();
  } else {
    await database.prepare(`UPDATE social_jobs SET state = ?, lock = 0 WHERE id = ?`).bind(JSON.stringify(st), job.id).run();
  }
  return true;
}

/** Manual run ("Jetzt ausführen"): the steps run in the request itself (max. ~25 s), the rest in the background. */
export async function runJobsNow(env, database, maxMs = 25000) {
  const t0 = Date.now();
  let n = 0;
  while (Date.now() - t0 < maxMs && (await runJobStep(env, database).catch(() => false))) n++;
  return n;
}

/** New sponsor folder pictures (sponsor panel uploads), one job per sponsor (max. 10). Only uploads after this update. */
async function sponsorMediaGroups(database, now) {
  await database.prepare(`INSERT OR IGNORE INTO social_state (key, value) VALUES ('since_sm', ?)`).bind(String(now)).run();
  const since = Number((await database.prepare(`SELECT value FROM social_state WHERE key = 'since_sm'`).first())?.value) || now;
  const { results } = await database.prepare(`SELECT m.id, m.ad_id, m.media_key, m.caption, a.name FROM sponsor_media m JOIN ads a ON a.id = m.ad_id
      WHERE m.status = 'live' AND m.media_type = 'image' AND m.created_at >= ? AND m.created_at > ? AND a.active = 1
        AND ('sm-' || m.id) NOT IN (SELECT story_id FROM social_items WHERE channel = 'meta')
      ORDER BY m.created_at ASC LIMIT 60`).bind(since, now - 2 * 86400000).all().catch(() => ({ results: [] }));
  const map = new Map();
  for (const r of results || []) {
    const g = map.get(r.ad_id) || { title: r.name, ids: [], media: [], caps: [] };
    if (g.ids.length >= 10) continue;
    g.ids.push(`sm-${r.id}`);
    g.media.push(r.media_key.startsWith("https://") ? r.media_key : r.media_key.startsWith("/") ? `${SITE}${r.media_key}` : `${SITE}/media/${r.media_key}`);
    if (r.caption && g.caps.length < 3) g.caps.push(String(r.caption).trim().slice(0, 200));
    map.set(r.ad_id, g);
  }
  return [...map.values()].map((g) => ({
    title: g.title, ids: g.ids, media: g.media,
    text: [`📣 ${g.title} · Sponsor von My Kiez Berlin`, "", ...g.caps.map((c) => `• ${c}`), "", `👉 ${SITE} · 📲 App: My Kiez Berlin`, "", "#berlin #mykiezberlin #kiez #berlinshopping #kiezleben"].join("\n").slice(0, 2100),
  }));
}

/** Once: the runs of 23.11 08:00 + 12:00 were cut (empty result) -> their stories come back into the queue. */
async function fixCutRuns(database) {
  const flag = await database.prepare(`SELECT value FROM social_state WHERE key = 'fix_cut_2311'`).first().catch(() => null);
  if (flag) return;
  await ensureTables(database);
  const { results } = await database.prepare(`SELECT slot FROM social_runs WHERE (result = '' OR result IS NULL) AND started < ?`).bind(Date.now() - 10 * 60000).all();
  let n = 0;
  for (const r of results || []) {
    const d = await database.prepare(`DELETE FROM social_items WHERE channel = 'meta' AND slot = ?`).bind(r.slot).run();
    n += (d.meta && d.meta.changes) || 0;
    await database.prepare(`UPDATE social_runs SET result = ? WHERE slot = ?`).bind(JSON.stringify({ telegram: "-", meta: `abgebrochen (30 s) – ${(d.meta && d.meta.changes) || 0} Stories wieder in der Warteschlange`, pack: {} }), r.slot).run();
  }
  await database.prepare(`INSERT OR REPLACE INTO social_state (key, value) VALUES ('fix_cut_2311', ?)`).bind(`${(results || []).length} runs, ${n} stories`).run();
}

/** 2026-11-23 (owner "UYGULA 6"): Facebook/Instagram state of stories for the news card. */
export async function metaStateFor(database, ids) {
  const out = {};
  if (!ids.length) return out;
  await ensureTables(database);
  const q = ids.map(() => "?").join(",");
  const { results: items } = await database.prepare(`SELECT story_id, slot, channel FROM social_items WHERE story_id IN (${q})`).bind(...ids).all();
  const { results: sent } = await database.prepare(`SELECT story_id, fb_post, ig_post FROM meta_sent WHERE story_id IN (${q})`).bind(...ids).all();
  const { results: jobs } = await database.prepare(`SELECT slot, ids, status, result FROM social_jobs WHERE created > ?`).bind(Date.now() - 3 * 86400000).all();
  for (const r of items || []) {
    const o = (out[r.story_id] = out[r.story_id] || { channels: [] });
    o.channels.push(r.channel);
    if (r.channel !== "meta") continue;
    const j = (jobs || []).find((x) => x.slot === r.slot && JSON.parse(x.ids || "[]").includes(r.story_id));
    o.meta = { slot: r.slot, status: j ? j.status : /^(admin|manual-share)/.test(r.slot) ? "manual" : "done", result: j ? j.result : "" };
  }
  for (const r of sent || []) {
    const o = (out[r.story_id] = out[r.story_id] || { channels: [] });
    o.single = { fb: !!(r.fb_post && r.fb_post !== "failed"), ig: !!(r.ig_post && r.ig_post !== "failed") };
  }
  return out;
}
