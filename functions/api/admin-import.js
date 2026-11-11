// Imports a story with its media into the moderation queue.
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";

const MEDIA_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();

  const form = await request.formData();
  const sourceId = cleanText(form.get("sourceId"), 60);
  const headline = cleanText(form.get("headline"), 120);
  if (!sourceId || !headline) return json({ error: "missing_fields" }, 400);

  const id = `import-${sourceId}`;
  const existing = await database.prepare(`SELECT id FROM stories WHERE id = ?`).bind(id).first();
  if (existing) return json({ id, status: "exists" });

  let mediaKey = "";
  let mediaType = "";
  const file = form.get("file");
  if (file && typeof file !== "string" && file.size > 0) {
    const ext = MEDIA_TYPES[file.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
    mediaKey = `stories/${id}.${ext}`;
    mediaType = file.type.startsWith("video/") ? "video" : "image";
    await env.BUCKET.put(mediaKey, file.stream(), { httpMetadata: { contentType: file.type } });
  }

  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`)
    .bind(id, headline, cleanText(form.get("subtext"), 500), cleanText(form.get("kiez"), 60) || "Ganz Berlin", cleanText(form.get("kind"), 20) || "news", cleanText(form.get("author"), 60) || "Kiez Community", mediaKey, mediaType, Math.min(Number(form.get("durationHours")) || 24, 720), Date.now())
    .run();
  return json({ id, status: "pending" }, 201);
}
