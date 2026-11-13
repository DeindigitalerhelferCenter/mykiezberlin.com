// Shared Kiez stories: public list and moderated submissions.
import { safeLink } from "../_lib/blocklist.js";
import { cleanText, cleanupExpiredStories, db, ipHash, isAdmin, json, noDb, rateLimited, sha256Hex, parseDeal, storyDeal, storyMediaList, storyTextKey, validAuthor } from "../_lib/util.js";

const HOUR_MS = 3600000;
const MAX_HOURS = 720;

function webLink(value) {
  try {
    const url = new URL(cleanText(value, 500));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

// Admin story planner: start (publishAt) and end (endAt) in ms. Without end: durationHours, default 24.
// Start in the past or missing = now. The duration is rounded up to whole hours after the start.
function plannedWindow(form, now) {
  const start = Math.max(Number(form.get("publishAt")) || 0, now);
  const end = Number(form.get("endAt")) || 0;
  const hours = end > start ? Math.ceil((end - start) / HOUR_MS) : Number(form.get("durationHours")) || 24;
  return { start, hours: Math.min(Math.max(hours, 1), MAX_HOURS) };
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MEDIA_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };
const KINDS = ["news", "traffic", "event", "warn", "info", "politics"];
// 2026-11-13 (owner): the admin may add as many pictures/videos to one story as needed (e.g. a sponsor ad
// with 4 pictures + 2 videos). Users still send one file. Hard cap only against mistakes.
const ADMIN_MAX_FILES = 30;
const USER_DURATIONS = [24, 48];
// Duplicates are checked against stories of the last 30 days that were not rejected.
const DUPLICATE_WINDOW_MS = 30 * 24 * HOUR_MS;

export async function onRequestGet({ env, waitUntil }) {
  const database = await db(env);
  if (!database) return noDb();
  waitUntil(cleanupExpiredStories(env));
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT id, headline, subtext, kiez, kind, author, media_key, media_type, media_extra, deal, duration_hours, approved_at, link FROM stories WHERE status = 'approved' AND approved_at <= ? AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT 60`)
    .bind(now, now)
    .all();
  // 2026-11-13: "media" = every picture/video of the story in order (old clients keep using media_key)
  return json({ stories: results.map(({ media_extra, deal, ...r }) => ({ ...r, link: safeLink(r.link), media: storyMediaList({ ...r, media_extra }), deal: parseDeal(deal) })) });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();

  const form = await request.formData();
  const headline = cleanText(form.get("headline"), 120);
  const subtext = cleanText(form.get("subtext"), 500);
  const kiez = cleanText(form.get("kiez"), 60);
  const kind = KINDS.includes(form.get("kind")) ? form.get("kind") : "news";
  // Name of the person who shares (needed for the weekly Kiez-Stars)
  const author = cleanText(form.get("author"), 40) || "Kiez Community";
  const deal = storyDeal(form, cleanText); // 2026-11-14: optional offer (users, sponsors, admin)
  const durationHours = USER_DURATIONS.includes(Number(form.get("durationHours"))) ? Number(form.get("durationHours")) : 24;
  if (!headline || !kiez) return json({ error: "missing_fields" }, 400);

  // Admin (story planner): no hourly limit, published directly at the planned time
  const admin = await isAdmin(request, env);
  const ip = await ipHash(request, env);
  // 2026-11-13: real name or nickname required (not only emoji), see validAuthor
  if (!admin && !validAuthor(form.get("author"))) return json({ error: "author_required" }, 400);
  if (!admin && (await rateLimited(database, "stories", ip))) return json({ error: "rate_limited" }, 429);

  const id = crypto.randomUUID();
  let mediaKey = "";
  let mediaType = "";
  let mediaBytes = null;
  let mediaHash = "";
  const file = form.get("file");
  if (file && typeof file !== "string" && file.size > 0) {
    const ext = MEDIA_TYPES[file.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    const isVideo = file.type.startsWith("video/");
    if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) return json({ error: "file_too_large" }, 413);
    mediaType = isVideo ? "video" : "image";
    if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
    mediaKey = `stories/${id}.${ext}`;
    mediaBytes = await file.arrayBuffer();
    mediaHash = await sha256Hex(mediaBytes);
  }

  // 2026-11-13: the same picture/video or the same text cannot be uploaded twice (users only;
  // the admin planner may reuse material on purpose).
  const textHash = await sha256Hex(storyTextKey(headline, subtext));
  if (!admin) {
    const since = Date.now() - DUPLICATE_WINDOW_MS;
    const dup = await database
      .prepare(`SELECT id FROM stories WHERE status != 'rejected' AND created_at > ? AND (text_hash = ? OR (? != '' AND media_hash = ?)) LIMIT 1`)
      .bind(since, textHash, mediaHash, mediaHash)
      .first();
    if (dup) return json({ error: "duplicate_story" }, 409);
  }
  if (mediaBytes) await env.BUCKET.put(mediaKey, mediaBytes, { httpMetadata: { contentType: file.type } });

  if (admin && form.get("planned") === "1") {
    const now = Date.now();
    const { start, hours } = plannedWindow(form, now);
    const adminKind = cleanText(form.get("kind"), 30) || "news";
    // further pictures/videos (admin only): every file after the first one, with an optional text per file
    const extra = [];
    const files = form.getAll("file").filter((x) => x && typeof x !== "string" && x.size > 0).slice(1, ADMIN_MAX_FILES);
    for (let i = 0; i < files.length; i++) {
      const x = files[i];
      const ext = MEDIA_TYPES[x.type];
      if (!ext) continue; // unknown type: skipped, the story is still saved
      const video = x.type.startsWith("video/");
      if (x.size > (video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) continue;
      const key = `stories/${id}-${i + 2}.${ext}`;
      await env.BUCKET.put(key, await x.arrayBuffer(), { httpMetadata: { contentType: x.type } });
      extra.push({ key, type: video ? "video" : "image", caption: cleanText(form.get(`caption_${i + 2}`), 300) });
    }
    await database
      .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, approved_at, link, by_admin, media_hash, text_hash, media_extra, deal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, 1, ?, ?, ?, ?)`)
      .bind(id, headline, subtext, kiez, adminKind, cleanText(form.get("author"), 40) || "My Kiez Berlin", mediaKey, mediaType, hours, ip, now, start, webLink(form.get("link")), mediaHash, textHash, JSON.stringify(extra), deal)
      .run();
    return json({ id, status: start > now ? "scheduled" : "approved", publishAt: start, durationHours: hours }, 201);
  }

  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, media_hash, text_hash, deal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`)
    .bind(id, headline, subtext, kiez, kind, author, mediaKey, mediaType, durationHours, ip, Date.now(), mediaHash, textHash, deal)
    .run();
  return json({ id, status: "pending" }, 201);
}
