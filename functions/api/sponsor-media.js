// Own pictures/videos of sponsors (2026-11-13).
// GET  /api/sponsor-media?ad=<id>  -> visible pictures/videos of one sponsor (contact sheet gallery)
// POST multipart (x-sponsor-token or x-admin-token + adId): file, caption
//      The sponsor's package decides how many per day or per week (see MEDIA_QUOTA in _lib/plans.js).
//      Uploads are online at once; the admin sees them in the admin panel and can hide or delete them.
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { mediaQuota, parseExtra } from "../_lib/plans.js";
import { ensureSponsorTables, sponsorFromToken } from "../_lib/sponsor-panel.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };

export async function onRequestGet({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  await ensureSponsorTables(database);
  const adId = cleanText(new URL(request.url).searchParams.get("ad"), 40);
  if (!adId) return json({ media: [] });
  const { results } = await database
    .prepare(`SELECT id, media_key, media_type, caption, created_at FROM sponsor_media WHERE ad_id = ? AND status = 'live' ORDER BY created_at DESC LIMIT 30`)
    .bind(adId)
    .all();
  return json({ media: results.map((m) => ({ ...m, url: m.media_key.startsWith("/") ? m.media_key : `/media/${m.media_key}` })) }, 200, { "cache-control": "public, max-age=60" });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
  await ensureSponsorTables(database);
  const form = await request.formData();

  let ad = await sponsorFromToken(database, request.headers.get("x-sponsor-token") || "");
  let byAdmin = 0;
  if (!ad && (await isAdmin(request, env))) {
    ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(cleanText(form.get("adId"), 40)).first();
    byAdmin = 1;
  }
  if (!ad) return json({ error: "unauthorized" }, 401);

  const file = form.get("file");
  if (!file || typeof file === "string" || !file.size) return json({ error: "missing_file" }, 400);
  const ext = TYPES[file.type];
  if (!ext) return json({ error: "unsupported_file" }, 415);
  const isVideo = file.type.startsWith("video/");
  if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) return json({ error: "file_too_large" }, 413);

  // Package limit for the chosen period (admin uploads do not count)
  if (!byAdmin) {
    const q = mediaQuota(ad.plan, parseExtra(ad.extra).media_period);
    const used = await database
      .prepare(`SELECT COUNT(*) AS n FROM sponsor_media WHERE ad_id = ? AND media_type = ? AND created_at > ? AND by_admin = 0`)
      .bind(ad.id, isVideo ? "video" : "image", Date.now() - q.windowMs)
      .first();
    const limit = isVideo ? q.videos : q.images;
    if ((used?.n || 0) >= limit) return json({ error: "quota_reached", period: q.period, limit }, 429);
  }

  const id = crypto.randomUUID();
  const key = `ads/media/${ad.id}/${id}.${ext}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await database
    .prepare(`INSERT INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, ?, ?, ?, ?, 'live', ?, ?, ?)`)
    .bind(id, ad.id, key, isVideo ? "video" : "image", cleanText(form.get("caption"), 300), file.size, Date.now(), byAdmin)
    .run();
  return json({ ok: true, id, url: `/media/${key}` }, 201);
}
