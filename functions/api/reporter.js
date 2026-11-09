// Kiez-Reporter: public posts, moderated submissions and upvotes.
import { currentUser } from "../_lib/auth.js";
import { cleanText, db, ipHash, json, noDb, rateLimited } from "../_lib/util.js";

const CATEGORIES = ["Verkehr", "Baustelle", "Neueröffnung", "Kultur", "Fundbüro"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  const { results } = await database
    .prepare(`SELECT id, title, description, kiez, category, author, upvotes, media_key, media_type, created_at FROM reporter_posts WHERE status = 'approved' ORDER BY created_at DESC LIMIT 60`)
    .all();
  const { results: comments } = await database
    .prepare(`SELECT id, post_id, parent_id, kind, author, text, created_at FROM reporter_comments WHERE status = 'approved' AND target = 'post' ORDER BY created_at ASC LIMIT 300`)
    .all();
  return json({ posts: results.map((post) => ({ ...post, comments: comments.filter((c) => c.post_id === post.id) })) });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();

  const isForm = (request.headers.get("content-type") || "").startsWith("multipart/form-data");
  const body = isForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => ({}));
  if (body.upvote) {
    await database.prepare(`UPDATE reporter_posts SET upvotes = upvotes + 1 WHERE id = ? AND status = 'approved'`).bind(String(body.upvote)).run();
    return json({ ok: true });
  }

  if (body.comment) {
    const text = cleanText(body.comment.text, 500);
    const postId = cleanText(body.comment.postId, 60);
    if (!text || !postId) return json({ error: "missing_fields" }, 400);
    const commentIp = await ipHash(request, env);
    if (await rateLimited(database, "reporter_comments", commentIp, 10)) return json({ error: "rate_limited" }, 429);
    // One comment per person and post; replies are left to the other neighbours.
    const already = await database.prepare(`SELECT 1 FROM reporter_comments WHERE post_id = ? AND ip = ? LIMIT 1`).bind(postId, commentIp).first();
    if (already) return json({ error: "already_commented" }, 409);
    await database
      .prepare(`INSERT INTO reporter_comments (id, post_id, author, text, status, ip, created_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)`)
      .bind(crypto.randomUUID(), postId, cleanText(body.comment.author, 40) || "Kiez Community", text, commentIp, Date.now())
      .run();
    return json({ status: "pending" }, 201);
  }

  const title = cleanText(body.title, 120);
  const description = cleanText(body.description, 1000);
  const kiez = cleanText(body.kiez, 60);
  const category = CATEGORIES.includes(body.category) ? body.category : "Kultur";
  if (!title || !description || !kiez) return json({ error: "missing_fields" }, 400);

  const ip = await ipHash(request, env);
  if (await rateLimited(database, "reporter_posts", ip)) return json({ error: "rate_limited" }, 429);

  const id = crypto.randomUUID();
  let mediaKey = "";
  const file = body.file;
  if (file && typeof file !== "string" && file.size > 0) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    if (file.size > MAX_IMAGE_BYTES) return json({ error: "file_too_large" }, 413);
    if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
    mediaKey = `posts/${id}.${ext}`;
    await env.BUCKET.put(mediaKey, file.stream(), { httpMetadata: { contentType: file.type } });
  }

  // Trusted members publish directly; everyone else waits for the admin.
  const user = await currentUser(request, database);
  const status = user?.trusted ? "approved" : "pending";
  await database
    .prepare(`INSERT INTO reporter_posts (id, title, description, kiez, category, author, media_key, media_type, user_id, status, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, title, description, kiez, category, user?.display_name || "Kiez Community", mediaKey, mediaKey ? "image" : "", user?.id || "", status, ip, Date.now())
    .run();
  return json({ id, status }, 201);
}
