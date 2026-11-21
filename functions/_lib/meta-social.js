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

const SITE = "https://mykiezberlin.com";
const GRAPH = "https://graph.facebook.com/v21.0";
const PER_RUN = 2;
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
  return res.ok && data && !data.error ? data : null;
}

async function graphGet(env, path, fields) {
  const res = await fetch(`${GRAPH}/${path}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(env.META_PAGE_TOKEN)}`);
  const data = await res.json().catch(() => ({}));
  return res.ok && data && !data.error ? data : null;
}

async function ensureTables(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS meta_state (key TEXT PRIMARY KEY, value TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS meta_sent (story_id TEXT PRIMARY KEY, sent_at INTEGER, fb_post TEXT, fb_story TEXT, ig_post TEXT, ig_story TEXT, ig_wait TEXT, log TEXT)`),
  ]);
}

/** Facebook: lasting post + page story. */
async function postFacebook(env, story, media, isVideo) {
  const page = env.FB_PAGE_ID;
  const out = { post: "", story: "" };
  if (isVideo) {
    const v = await graph(env, `${page}/videos`, { file_url: media, description: caption(story) });
    out.post = (v && v.id) || "";
    // video story: needs an upload session – skipped, the lasting video post is enough
  } else if (media) {
    const p = await graph(env, `${page}/photos`, { url: media, caption: caption(story) });
    out.post = (p && (p.post_id || p.id)) || "";
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
  const st = await graph(env, `${ig}/media`, { media_type: "STORIES", image_url: media });
  if (st && st.id) out.story = await publish(st.id);
  const feed = await graph(env, `${ig}/media`, { image_url: media, caption: caption(story).slice(0, 2100) });
  if (feed && feed.id) out.post = await publish(feed.id);
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
    for (const k of ["reel", "story"]) {
      if (!w[k]) continue;
      const s = await graphGet(env, w[k], "status_code");
      if (s && s.status_code === "FINISHED") {
        const p = await graph(env, `${env.IG_USER_ID}/media_publish`, { creation_id: w[k] });
        done[k] = (p && p.id) || "failed";
      } else if (s && s.status_code === "ERROR") done[k] = "failed";
    }
    if (done.reel) { await database.prepare(`UPDATE meta_sent SET ig_post = ? WHERE story_id = ?`).bind(done.reel, r.story_id).run(); delete w.reel; }
    if (done.story) { await database.prepare(`UPDATE meta_sent SET ig_story = ? WHERE story_id = ?`).bind(done.story, r.story_id).run(); delete w.story; }
    await database.prepare(`UPDATE meta_sent SET ig_wait = ? WHERE story_id = ?`).bind(w.reel || w.story ? JSON.stringify(w) : "", r.story_id).run();
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
    await finishInstagramVideos(env, database).catch(() => {});
    const since = Number((await database.prepare(`SELECT value FROM meta_state WHERE key = 'since'`).first())?.value) || now;
    const { results } = await database
      .prepare(`SELECT s.id, s.headline, s.subtext, s.kiez, s.media_key, s.media_type FROM stories s
        LEFT JOIN meta_sent m ON m.story_id = s.id
        WHERE m.story_id IS NULL AND s.by_admin = 1 AND s.status = 'approved' AND s.approved_at <= ? AND s.approved_at >= ? AND s.approved_at > ?
          AND s.approved_at + s.duration_hours * 3600000 > ?
        ORDER BY s.approved_at ASC LIMIT ?`)
      .bind(now, since, now - MAX_AGE_MS, now, PER_RUN)
      .all();
    for (const story of results || []) {
      await database.prepare(`INSERT OR IGNORE INTO meta_sent (story_id, sent_at) VALUES (?, ?)`).bind(story.id, now).run(); // never twice
      const media = story.media_key ? `${SITE}/media/${story.media_key}` : "";
      const isVideo = story.media_type === "video";
      const fb = await postFacebook(env, story, media, isVideo).catch(() => ({ post: "", story: "" }));
      const ig = await postInstagram(env, story, media, isVideo).catch(() => ({ post: "", story: "", wait: "" }));
      await database.prepare(`UPDATE meta_sent SET fb_post = ?, fb_story = ?, ig_post = ?, ig_story = ?, ig_wait = ? WHERE story_id = ?`)
        .bind(fb.post, fb.story, ig.post, ig.story, ig.wait, story.id).run();
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
