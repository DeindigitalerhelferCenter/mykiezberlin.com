// Shared Kiez stories: public list and moderated submissions.
import { cleanText, db, ipHash, json, noDb, rateLimited } from "../_lib/util.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT id, headline, subtext, kiez, author, media_key, duration_hours, approved_at FROM stories WHERE status = 'approved' AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT 60`)
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
  if (!headline || !kiez) return json({ error: "missing_fields" }, 400);

  const ip = await ipHash(request, env);
  if (await rateLimited(database, "stories", ip)) return json({ error: "rate_limited" }, 429);

  const id = crypto.randomUUID();
  let mediaKey = "";
  const file = form.get("file");
  if (file && typeof file !== "string" && file.size > 0) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    if (file.size > MAX_IMAGE_BYTES) return json({ error: "file_too_large" }, 413);
    if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
    mediaKey = `stories/${id}.${ext}`;
    await env.BUCKET.put(mediaKey, file.stream(), { httpMetadata: { contentType: file.type } });
  }

  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, media_key, status, ip, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`)
    .bind(id, headline, subtext, kiez, mediaKey, ip, Date.now())
    .run();
  return json({ id, status: "pending" }, 201);
}
