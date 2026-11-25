// 2026-11-21 (owner): admin stories go to Facebook + Instagram by themselves – like the Telegram channel.
// Only stories of the admin (by_admin = 1), only after the first run (stories already online are not sent).
// Each story is posted twice per network:
//   - as a STORY (Facebook page story / Instagram story, gone after 24 h)
//   - as a lasting POST (Facebook page photo/video, Instagram feed picture / Reel) – stays until it is deleted,
//     so the pages do not look empty. When the admin deletes the story on the site, the lasting posts are deleted
//     too (Facebook: yes; Instagram: the API cannot delete, the admin does it in the app).
// Needs Pages secrets: META_PAGE_TOKEN (long-lived page token) + FB_PAGE_ID, optional IG_USER_ID
// (Instagram business account linked to the page). Without them nothing happens.
// Runs at most once a minute from GET /api/stories (waitUntil). Never throws.

import { shareAuthors } from "./social-authors.js"; // 2026-11-23 (owner "UYGULA 2")

const SITE = "https://mykiezberlin.com";
const GRAPH = "https://graph.facebook.com/v21.0";
const PER_RUN = 1; // 2026-11-23: was 2 – one story per run, so a run is never cut
const RUN_EVERY_MS = 60 * 1000;
const MAX_AGE_MS = 6 * 3600 * 1000;

export function metaReady(env) {
  return Boolean(env && env.META_PAGE_TOKEN && env.FB_PAGE_ID);
}

function cut(text, max) {
  const t = String(text || "").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

function caption(story) {
  const lines = [cut(story.headline, 200)];
  if (story.subtext) lines.push("", cut(story.subtext, 1500));
  if (story.kiez && story.kiez !== "Ganz Berlin") lines.push("", `📍 ${story.kiez}`);
  lines.push("", `👉 ${SITE} · 📲 My Kiez Berlin App`, "#berlin #mykiezberlin #kiez");
  return lines.join("\n").slice(0, 2100);
}

async function graph(env, path, params) {
  const body = new URLSearchParams({ ...params, access_token: env.META_PAGE_TOKEN });
  const res = await fetch(`${GRAPH}/${path}`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.error) lastGraphError = `${path.split("/").pop()}: ${String((data && data.error && data.error.message) || res.status).slice(0, 140)}`; // 2026-11-23
  return res.ok && data && !data.error ? data : null;
}
let lastGraphError = "";

async function graphGet(env, path, fields) {
  const res = await fetch(`${GRAPH}/${path}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(env.META_PAGE_TOKEN)}`);
  const data = await res.json().catch(() => ({}));
  return res.ok && data && !data.error ? data : null;
}

async function ensureTables(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS meta_state (key TEXT PRIMARY KEY, value TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS meta_sent (story_id TEXT PRIMARY KEY, sent_at INTEGER, fb_post TEXT, fb_story TEXT, ig_post TEXT, ig_story TEXT, ig_wait TEXT, log TEXT)`),
    // 2026-11-23: same table as the Social-Planer – stories shared by hand / in a collection are skipped here
    database.prepare(`CREATE TABLE IF NOT EXISTS social_items (channel TEXT, story_id TEXT, at INTEGER, slot TEXT, PRIMARY KEY (channel, story_id))`),
  ]);
}

/** Facebook: lasting post + page story. */
async function postFacebook(env, story, media, isVideo, storyNow = false) {
  const page = env.FB_PAGE_ID;
  const out = { post: "", story: "" };
  if (isVideo) {
    const v = await graph(env, `${page}/videos`, { file_url: media, description: caption(story) });
    out.post = (v && v.id) || "";
    // video story: needs an upload session – skipped, the lasting video post is enough
  } else if (media) {
    const p = await graph(env, `${page}/photos`, { url: media, caption: caption(story) });
    out.post = (p && (p.post_id || p.id)) || "";
    // 2026-11-23 (owner): post + story at once took longer than 30 s (the run was cut, nothing was saved, no story).
    // Now: only the post here; the story is made in the next run (fb_story = "todo", finishFacebookStories).
    if (!storyNow) { out.story = out.post ? "todo" : ""; return out; }
    const up = await graph(env, `${page}/photos`, { url: media, published: "false" });
    if (up && up.id) {
      const s = await graph(env, `${page}/photo_stories`, { photo_id: up.id });
      out.story = (s && (s.post_id || s.id || "ok")) || "";
    }
  } else {
    const f = await graph(env, `${page}/feed`, { message: caption(story), link: SITE });
    out.post = (f && f.id) || "";
  }
  return out;
}

/** Instagram: story + feed picture now; a video becomes a Reel (published in a later run when it is ready). */
async function postInstagram(env, story, media, isVideo) {
  const ig = env.IG_USER_ID;
  const out = { post: "", story: "", wait: "" };
  if (!ig || !media) return out;
  const publish = async (creation) => {
    const r = await graph(env, `${ig}/media_publish`, { creation_id: creation });
    return (r && r.id) || "";
  };
  if (isVideo) {
    const reel = await graph(env, `${ig}/media`, { media_type: "REELS", video_url: media, caption: caption(story).slice(0, 2100), share_to_feed: "true" });
    const st = await graph(env, `${ig}/media`, { media_type: "STORIES", video_url: media });
    out.wait = JSON.stringify({ reel: (reel && reel.id) || "", story: (st && st.id) || "" });
    return out;
  }
  // 2026-11-23: the background work is cut after ~30 s -> pictures: only make the containers now, they are
  // published in the next run (finishInstagramVideos) when Instagram says FINISHED
  const st = await graph(env, `${ig}/media`, { media_type: "STORIES", image_url: media });
  const feed = await graph(env, `${ig}/media`, { image_url: media, caption: caption(story).slice(0, 2100) });
  out.wait = JSON.stringify({ story: (st && st.id) || "", feed: (feed && feed.id) || "" });
  if (!st && !feed) out.wait = "";
  return out;
}

/** Videos on Instagram need processing: publish the containers when Instagram says FINISHED. */
async function finishInstagramVideos(env, database) {
  if (!env.IG_USER_ID) return;
  const { results } = await database.prepare(`SELECT story_id, ig_wait FROM meta_sent WHERE ig_wait IS NOT NULL AND ig_wait != '' LIMIT 3`).all();
  for (const r of results || []) {
    let w = {};
    try { w = JSON.parse(r.ig_wait) || {}; } catch (e) { w = {}; }
    const done = {};
    for (const k of ["reel", "story", "feed"]) { // 2026-11-23: + "feed" (picture post)
      if (!w[k]) continue;
      const s = await graphGet(env, w[k], "status_code");
      if (s && s.status_code === "FINISHED") {
        const p = await graph(env, `${env.IG_USER_ID}/media_publish`, { creation_id: w[k] });
        done[k] = (p && p.id) || "failed";
        if (!(p && p.id)) {
          // 2026-11-23: the post was online although "failed" was written -> ask Instagram again
          const again = await graphGet(env, w[k], "status_code");
          if (again && again.status_code === "PUBLISHED") done[k] = "published";
        }
      } else if (s && s.status_code === "PUBLISHED") done[k] = "published"; // 2026-11-23: published in a run that was cut
      else if (s && s.status_code === "ERROR") done[k] = "failed";
      if (done[k]) {
        // 2026-11-23: saved at once (a cut run does not publish twice)
        const col = k === "story" ? "ig_story" : "ig_post";
        const rest = { ...w }; for (const d of Object.keys(done)) delete rest[d];
        await database.prepare(`UPDATE meta_sent SET ${col} = ?, ig_wait = ? WHERE story_id = ?`).bind(done[k], Object.keys(rest).some((x) => rest[x]) ? JSON.stringify(rest) : "", r.story_id).run();
      }
    }
    if (done.reel) { await database.prepare(`UPDATE meta_sent SET ig_post = ? WHERE story_id = ?`).bind(done.reel, r.story_id).run(); delete w.reel; }
    if (done.story) { await database.prepare(`UPDATE meta_sent SET ig_story = ? WHERE story_id = ?`).bind(done.story, r.story_id).run(); delete w.story; }
    if (done.feed) { await database.prepare(`UPDATE meta_sent SET ig_post = ? WHERE story_id = ?`).bind(done.feed, r.story_id).run(); delete w.feed; }
    await database.prepare(`UPDATE meta_sent SET ig_wait = ? WHERE story_id = ?`).bind(w.reel || w.story || w.feed ? JSON.stringify(w) : "", r.story_id).run();
  }
}

/** Called with waitUntil from GET /api/stories. Never throws. */
export async function metaSweep(env, database) {
  try {
    if (!metaReady(env) || !database) return;
    await ensureTables(database);
    const now = Date.now();
    await database.prepare(`INSERT OR IGNORE INTO meta_state (key, value) VALUES ('since', ?)`).bind(String(now)).run();
    await database.prepare(`INSERT OR IGNORE INTO meta_state (key, value) VALUES ('last_run', '0')`).run();
    const lock = await database.prepare(`UPDATE meta_state SET value = ? WHERE key = 'last_run' AND CAST(value AS INTEGER) < ?`).bind(String(now), now - RUN_EVERY_MS).run();
    if (!lock.meta || !lock.meta.changes) return;
    env = await metaEnv(env, database); // 2026-11-23: user token -> page token
    await finishInstagramVideos(env, database).catch(() => {});
    if (await finishFacebookStories(env, database).catch(() => false)) return; // 2026-11-23: one heavy step per run
    // 2026-11-23: a run that was cut after Facebook (all result fields empty, older than 2 min) -> only Instagram now,
    // Facebook is NOT sent again (no double post)
    const cutRow = await database.prepare(`SELECT m.story_id, s.headline, s.subtext, s.kiez, s.media_key, s.media_type FROM meta_sent m JOIN stories s ON s.id = m.story_id
      WHERE m.fb_post IS NULL AND m.ig_post IS NULL AND m.ig_story IS NULL AND m.ig_wait IS NULL AND m.log IS NULL AND m.sent_at < ? AND m.sent_at > ? LIMIT 1`).bind(now - 120000, now - MAX_AGE_MS).first().catch(() => null);
    await fixRangeRover2311(database).catch(() => {}); // 2026-11-23 (owner "UYGULA 1"): once
    if (cutRow) {
      // 2026-11-23: the Facebook post may be online although its id was not saved (run cut) -> look for a page post
      // made within 90 s of the send time and keep its id (so the report shows it and nothing is sent twice)
      const fbFound = await findPagePostNear(env, Number((await database.prepare(`SELECT sent_at FROM meta_sent WHERE story_id = ?`).bind(cutRow.story_id).first())?.sent_at) || 0).catch(() => "");
      if (fbFound) await database.prepare(`UPDATE meta_sent SET fb_post = ? WHERE story_id = ?`).bind(fbFound, cutRow.story_id).run();
      lastGraphError = "";
      const media = cutRow.media_key ? `${SITE}/media/${cutRow.media_key}` : "";
      const ig = await postInstagram(env, cutRow, media, cutRow.media_type === "video").catch(() => ({ post: "", story: "", wait: "" }));
      await database.prepare(`UPDATE meta_sent SET ig_post = ?, ig_story = ?, ig_wait = ?, log = ? WHERE story_id = ?`).bind(ig.post, ig.story, ig.wait, `resumed (fb not resent)${lastGraphError ? " | " + lastGraphError : ""}`, cutRow.story_id).run();
      return;
    }
    const since = Number((await database.prepare(`SELECT value FROM meta_state WHERE key = 'since'`).first())?.value) || now;
    // 2026-11-23 (owner "UYGULA 2"): who may go out is decided by shareAuthors (own, sponsors also when written a bit
    // differently, trusted users, the admin's choice); admin stories (by_admin = 1) always
    const okAuthor = await shareAuthors(database).catch(() => null);
    const { results: cands } = await database
      .prepare(`SELECT s.id, s.headline, s.subtext, s.kiez, s.media_key, s.media_type, s.author, s.by_admin FROM stories s
        LEFT JOIN meta_sent m ON m.story_id = s.id
        WHERE m.story_id IS NULL AND s.status = 'approved' AND s.media_key NOT LIKE 'stories/news-%' /* 2026-11-23 (owner "öneri"): news only in the collections */ AND s.approved_at <= ? AND s.approved_at >= ? AND s.approved_at > ?
          AND s.approved_at + s.duration_hours * 3600000 > ?
          AND s.id NOT IN (SELECT story_id FROM social_items WHERE channel = 'meta') /* 2026-11-23: shared by hand / in a collection */
        ORDER BY s.approved_at ASC LIMIT 40`)
      .bind(now, since, now - MAX_AGE_MS, now)
      .all();
    const results = (cands || []).filter((s) => s.by_admin === 1 || (okAuthor && okAuthor(s.author))).slice(0, PER_RUN);
    // 2026-11-23 (owner "UYGULA 5"): no story waiting -> one new sponsor folder VIDEO alone (Facebook video + Instagram Reel);
    // sponsor folder pictures go in the Social-Planer collections (one carousel per sponsor)
    if (!(results || []).length) {
      const v = await database.prepare(`SELECT m.id, m.media_key, m.caption, a.name FROM sponsor_media m JOIN ads a ON a.id = m.ad_id
          WHERE m.status = 'live' AND m.media_type = 'video' AND a.active = 1 AND m.created_at >= ? AND m.created_at > ? AND m.media_key NOT LIKE 'http%' AND m.media_key NOT LIKE '/%'
            AND ('sm-' || m.id) NOT IN (SELECT story_id FROM meta_sent) AND ('sm-' || m.id) NOT IN (SELECT story_id FROM social_items WHERE channel = 'meta')
          ORDER BY m.created_at ASC LIMIT 1`).bind(since, now - MAX_AGE_MS).first().catch(() => null);
      if (v) results.push({ id: `sm-${v.id}`, headline: `📣 ${v.name} · Sponsor`, subtext: v.caption || "", kiez: "", media_key: v.media_key, media_type: "video" });
    }
    for (const story of results || []) {
      await database.prepare(`INSERT OR IGNORE INTO meta_sent (story_id, sent_at) VALUES (?, ?)`).bind(story.id, now).run(); // never twice
      lastGraphError = "";
      const media = story.media_key ? `${SITE}/media/${story.media_key}` : "";
      const isVideo = story.media_type === "video";
      const fb = await postFacebook(env, story, media, isVideo).catch((e) => ({ post: "", story: "", err: String((e && e.message) || e).slice(0, 150) }));
      await database.prepare(`UPDATE meta_sent SET fb_post = ?, fb_story = ?, log = ? WHERE story_id = ?`).bind(fb.post, fb.story, fb.err || lastGraphError || "", story.id).run(); // 2026-11-23: saved at once
      const ig = await postInstagram(env, story, media, isVideo).catch(() => ({ post: "", story: "", wait: "" }));
      await database.prepare(`UPDATE meta_sent SET fb_post = ?, fb_story = ?, ig_post = ?, ig_story = ?, ig_wait = ?, log = ? WHERE story_id = ?`)
        .bind(fb.post, fb.story, ig.post, ig.story, ig.wait, (fb.err || "") + (lastGraphError ? ` | ${lastGraphError}` : ""), story.id).run();
    }
  } catch (e) {
    // Facebook / Instagram must never break the story list
  }
}

/** The admin deleted a story on the site: delete the lasting Facebook post too. Never throws. */
export async function metaDeleteStory(env, database, storyId) {
  try {
    if (!metaReady(env) || !database || !storyId) return false;
    await ensureTables(database);
    env = await metaEnv(env, database); // 2026-11-23: user token -> page token
    const row = await database.prepare(`SELECT fb_post FROM meta_sent WHERE story_id = ?`).bind(storyId).first();
    if (!row || !row.fb_post) return false;
    const res = await fetch(`${GRAPH}/${row.fb_post}?access_token=${encodeURIComponent(env.META_PAGE_TOKEN)}`, { method: "DELETE" });
    const ok = res.ok;
    await database.prepare(`UPDATE meta_sent SET log = ? WHERE story_id = ?`).bind(ok ? "fb_deleted" : "fb_delete_failed", storyId).run();
    return ok;
  } catch (e) {
    return false;
  }
}

// ---- 2026-11-23 (owner "UYGULA B"): META_PAGE_TOKEN may also be a long-lived USER token ----
// The page token is fetched once from Facebook (GET /{FB_PAGE_ID}?fields=access_token) and kept in meta_state.
// A page token made from a long-lived user token does not expire, so posting keeps working after the user token ends.
// When the secret changes (other last 10 chars), the page token is fetched again. If nothing works, the secret is used as it is.
let pageTokenCache = null;
export async function metaEnv(env, database) {
  if (!metaReady(env)) return env;
  const src = String(env.META_PAGE_TOKEN);
  const fp = src.slice(-10);
  if (pageTokenCache && pageTokenCache.fp === fp) return { ...env, META_PAGE_TOKEN: pageTokenCache.token };
  try {
    if (database) {
      await ensureTables(database);
      const row = await database.prepare(`SELECT value FROM meta_state WHERE key = 'page_token'`).first();
      let saved = null;
      try { saved = row ? JSON.parse(row.value) : null; } catch (e) { saved = null; }
      if (saved && saved.fp === fp && saved.token) { pageTokenCache = saved; return { ...env, META_PAGE_TOKEN: saved.token }; }
    }
    const res = await fetch(`${GRAPH}/${env.FB_PAGE_ID}?fields=access_token&access_token=${encodeURIComponent(src)}`);
    const data = await res.json().catch(() => ({}));
    if (data && data.access_token) {
      const v = { fp, token: data.access_token, at: Date.now() };
      pageTokenCache = v;
      if (database) {
        await database.prepare(`INSERT OR REPLACE INTO meta_state (key, value) VALUES ('page_token', ?)`).bind(JSON.stringify(v)).run();
        await database.prepare(`INSERT OR REPLACE INTO meta_state (key, value) VALUES ('page_token_err', '')`).run();
      }
      return { ...env, META_PAGE_TOKEN: v.token };
    }
    if (database) {
      const err = JSON.stringify({ at: Date.now(), err: String((data && data.error && data.error.message) || `http ${res.status}`).slice(0, 200) });
      await database.prepare(`INSERT OR REPLACE INTO meta_state (key, value) VALUES ('page_token_err', ?)`).bind(err).run();
    }
  } catch (e) {
    // never break anything
  }
  return env;
}

let checkCache = null;
/** Status without secrets: is a page token saved, when, last error. */
export async function metaStatus(env, database) {
  const out = { ready: metaReady(env), instagram: Boolean(env && env.IG_USER_ID), pageTokenAt: 0, error: null };
  try {
    if (!database) return out;
    await ensureTables(database);
    const row = await database.prepare(`SELECT value FROM meta_state WHERE key = 'page_token'`).first();
    const v = row ? JSON.parse(row.value) : null;
    if (v && v.at && env && env.META_PAGE_TOKEN && v.fp === String(env.META_PAGE_TOKEN).slice(-10)) out.pageTokenAt = v.at;
    const e = await database.prepare(`SELECT value FROM meta_state WHERE key = 'page_token_err'`).first();
    out.error = e && e.value ? JSON.parse(e.value) : null;
    // 2026-11-23: read-only check that the token really works (page name, Instagram name, token type); kept 10 min
    if (out.ready && (!checkCache || Date.now() - checkCache.at > 600000)) {
      const menv = await metaEnv(env, database);
      const pg = await graphGet(menv, env.FB_PAGE_ID, "name");
      const ig = env.IG_USER_ID ? await graphGet(menv, env.IG_USER_ID, "username") : null;
      const dbg = await graphGet(menv, "me", "id,name");
      checkCache = { at: Date.now(), page: (pg && pg.name) || null, instagram: (ig && ig.username) || null, tokenIsPage: !!(dbg && dbg.id === String(env.FB_PAGE_ID)) };
      const fp = await graphGet(menv, `${env.FB_PAGE_ID}/posts`, "id,created_time"); // 2026-11-23: last posts (ids + time only)
      const im = env.IG_USER_ID ? await graphGet(menv, `${env.IG_USER_ID}/media`, "id,timestamp,media_type") : null;
      checkCache.fbPosts = ((fp && fp.data) || []).slice(0, 3);
      checkCache.igMedia = ((im && im.data) || []).slice(0, 3);
    }
    if (checkCache) out.check = checkCache;
    // 2026-11-23: last sends (ids only, no texts) to check a test
    const { results: sent } = await database.prepare(`SELECT story_id, sent_at, fb_post, fb_story, ig_post, ig_story, ig_wait, log FROM meta_sent ORDER BY sent_at DESC LIMIT 5`).all();
    out.sent = sent || [];
    const since = await database.prepare(`SELECT value FROM meta_state WHERE key = 'since'`).first();
    out.since = since ? Number(since.value) : 0;
  } catch (e) { /* ignore */ }
  return out;
}

// ---- 2026-11-23 (owner): Facebook story one run after the post (a post + story in one run was cut at 30 s) ----
async function finishFacebookStories(env, database) {
  const row = await database.prepare(`SELECT m.story_id, s.media_key FROM meta_sent m JOIN stories s ON s.id = m.story_id WHERE m.fb_story = 'todo' LIMIT 1`).first();
  if (!row) return false;
  // mark first: a cut run never makes two stories
  await database.prepare(`UPDATE meta_sent SET fb_story = 'working' WHERE story_id = ? AND fb_story = 'todo'`).bind(row.story_id).run();
  lastGraphError = "";
  let id = "";
  if (row.media_key) {
    const up = await graph(env, `${env.FB_PAGE_ID}/photos`, { url: `${SITE}/media/${row.media_key}`, published: "false" });
    if (up && up.id) {
      const st = await graph(env, `${env.FB_PAGE_ID}/photo_stories`, { photo_id: up.id });
      id = (st && (st.post_id || st.id || "ok")) || "";
    }
  }
  await database.prepare(`UPDATE meta_sent SET fb_story = ?, log = COALESCE(log, '') || ? WHERE story_id = ?`).bind(id || "failed", lastGraphError ? ` | fb_story: ${lastGraphError}` : "", row.story_id).run();
  return true;
}

// ---- 2026-11-23 (owner "UYGULA 1"): Range Rover story – the Facebook post is online (15:35:03 Berlin, same second as
// the send), only its id was not saved because the run was cut. The id is written once; nothing is sent again.
async function fixRangeRover2311(database) {
  const flag = await database.prepare(`SELECT value FROM meta_state WHERE key = 'fix_rr_2311'`).first();
  if (flag) return;
  const r = await database.prepare(`UPDATE meta_sent SET fb_post = ?, log = COALESCE(log, '') || ' | fb id restored 23.11' WHERE story_id = ? AND (fb_post IS NULL OR fb_post = '')`)
    .bind("1405322516004566_122110445211545605", "678b6ed6-8209-40a3-af6c-8bc56b455c75").run();
  await database.prepare(`INSERT OR REPLACE INTO meta_state (key, value) VALUES ('fix_rr_2311', ?)`).bind(String((r.meta && r.meta.changes) || 0)).run();
}

/** A page post made within 90 s of `at` (ms) -> its id, else "". Read only. */
async function findPagePostNear(env, at) {
  if (!at) return "";
  const list = await graphGet(env, `${env.FB_PAGE_ID}/posts`, "id,created_time");
  for (const p of (list && list.data) || []) {
    const t = Date.parse(p.created_time || "");
    if (t && Math.abs(t - at) <= 90000) return p.id;
  }
  return "";
}

// ---- 2026-11-23 (owner "UYGULA 3"): share report – every live story and where it went ----
export async function shareReport(database) {
  await ensureTables(database);
  const now = Date.now();
  const ok = await shareAuthors(database).catch(() => null);
  const { results: stories } = await database.prepare(`SELECT id, headline, author, by_admin, media_key, media_type, approved_at FROM stories
      WHERE status = 'approved' AND approved_at <= ? AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT 120`).bind(now, now).all();
  const ids = (stories || []).map((s) => s.id);
  if (!ids.length) return { stories: [] };
  const q = ids.map(() => "?").join(",");
  const rows = async (sql) => ((await database.prepare(sql).bind(...ids).all().catch(() => ({ results: [] }))).results || []);
  const sent = new Map((await rows(`SELECT story_id, fb_post, fb_story, ig_post, ig_story, ig_wait, log FROM meta_sent WHERE story_id IN (${q})`)).map((r) => [r.story_id, r]));
  const tg = new Map((await rows(`SELECT story_id, ok FROM telegram_sent WHERE story_id IN (${q})`)).map((r) => [r.story_id, r.ok]));
  const items = new Map();
  for (const r of await rows(`SELECT story_id, channel, slot FROM social_items WHERE story_id IN (${q})`)) {
    const l = items.get(r.story_id) || [];
    l.push({ c: r.channel, slot: r.slot });
    items.set(r.story_id, l);
  }
  let jobs = [];
  try { jobs = (await database.prepare(`SELECT slot, ids, status FROM social_jobs WHERE created > ?`).bind(now - 3 * 86400000).all()).results || []; } catch (e) { jobs = []; }
  const good = (v) => !!v && v !== "failed" && v !== "todo" && v !== "working";
  return {
    stories: (stories || []).map((s) => {
      const who = s.by_admin === 1 ? { kind: "own" } : ok ? ok(s.author) : null;
      const m = sent.get(s.id) || null;
      const its = items.get(s.id) || [];
      const coll = its.find((x) => x.c === "meta");
      const job = coll ? jobs.find((j) => j.slot === coll.slot && JSON.parse(j.ids || "[]").includes(s.id)) : null;
      const news = /^stories\/news-/.test(s.media_key || "");
      let meta = "-";
      if (m && (good(m.fb_post) || good(m.ig_post))) meta = `FB ${good(m.fb_post) ? "✓" : "✕"} · IG ${good(m.ig_post) || good(m.ig_story) ? "✓" : m.ig_wait ? "⏳" : "✕"}`;
      else if (coll && /^(manual-share|admin)$/.test(coll.slot)) meta = "elle ✓";
      else if (coll) meta = job ? (job.status === "done" ? `toplu ✓ ${coll.slot.slice(11)}` : job.status === "open" ? "toplu ⏳" : "toplu ✕") : `toplu ✓ ${coll.slot.slice(11)}`;
      else if (m) meta = "✕ " + String(m.log || "").slice(0, 60);
      else if (!who) meta = "kural: paylaşılmaz";
      else meta = news ? "sıradaki toplu" : "sırada";
      return {
        id: s.id, headline: String(s.headline || "").slice(0, 90), author: s.author, who: who ? who.kind + (who.guess ? "?" : "") + (who.name && who.kind === "sponsor" ? ` (${who.name})` : "") : "",
        news, video: s.media_type === "video", approved_at: s.approved_at,
        telegram: tg.has(s.id) ? (tg.get(s.id) === 1 ? "✓" : tg.get(s.id) === 2 ? "silindi" : "✕") : "-",
        meta, tiktok: its.some((x) => x.c === "tiktok") ? "✓" : "-", whatsapp: its.some((x) => x.c === "whatsapp") ? "✓" : "-", wastatus: its.some((x) => x.c === "wastatus") ? "✓" : "-", // 2026-11-25
        waKiez: its.filter((x) => /^wa-/.test(x.c)).map((x) => x.c.slice(3)),
      };
    }),
  };
}

/** Admin "Sıraya al": the story is offered again for Facebook/Instagram (and Telegram). May make a second copy. */
export async function requeueStory(database, id, channel) {
  await ensureTables(database);
  if (channel === "telegram") { await database.prepare(`DELETE FROM telegram_sent WHERE story_id = ?`).bind(id).run().catch(() => {}); return true; }
  await database.prepare(`DELETE FROM meta_sent WHERE story_id = ?`).bind(id).run();
  await database.prepare(`DELETE FROM social_items WHERE story_id = ? AND channel = 'meta'`).bind(id).run();
  return true;
}
