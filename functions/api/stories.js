// Shared Kiez stories: public list and moderated submissions.
import { cleanText, cleanupExpiredStories, db, ipHash, json, noDb, rateLimited } from "../_lib/util.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MEDIA_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };
const KINDS = ["news", "traffic", "event", "warn", "info", "politics"];
const USER_DURATIONS = [24, 48];

export async function onRequestGet({ env, waitUntil }) {
  const database = await db(env);
  if (!database) return noDb();
  waitUntil(cleanupExpiredStories(env));
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, approved_at, link FROM stories WHERE status = 'approved' AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT 60`)
    .bind(now)
    .all();
  return json({ stories: results });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();

  const form = await request.formData();
  const headline = cleanText(form.get("headline"), 120);
  const subtext = cleanText(form.get("subtext"), 500);
  const kiez = cleanText(form.get("kiez"), 60);
  const kind = KINDS.includes(form.get("kind")) ? form.get("kind") : "news";
  const durationHours = USER_DURATIONS.includes(Number(form.get("durationHours"))) ? Number(form.get("durationHours")) : 24;
  if (!headline || !kiez) return json({ error: "missing_fields" }, 400);

  const ip = await ipHash(request, env);
  if (await rateLimited(database, "stories", ip)) return json({ error: "rate_limited" }, 429);

  const id = crypto.randomUUID();
  let mediaKey = "";
  let mediaType = "";
  const file = form.get("file");
  if (file && typeof file !== "string" && file.size > 0) {
    const ext = MEDIA_TYPES[file.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    const isVideo = file.type.startsWith("video/");
    if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) return json({ error: "file_too_large" }, 413);
    mediaType = isVideo ? "video" : "image";
    if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
    mediaKey = `stories/${id}.${ext}`;
    await env.BUCKET.put(mediaKey, file.stream(), { httpMetadata: { contentType: file.type } });
  }

  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, media_key, media_type, duration_hours, status, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
    .bind(id, headline, subtext, kiez, kind, mediaKey, mediaType, durationHours, ip, Date.now())
    .run();
  return json({ id, status: "pending" }, 201);
}
