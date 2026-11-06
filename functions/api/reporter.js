// Kiez-Reporter: public posts, moderated submissions and upvotes.
import { cleanText, db, ipHash, json, noDb, rateLimited } from "../_lib/util.js";

const CATEGORIES = ["Verkehr", "Baustelle", "Neueröffnung", "Kultur", "Fundbüro"];

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  const { results } = await database
    .prepare(`SELECT id, title, description, kiez, category, author, upvotes, created_at FROM reporter_posts WHERE status = 'approved' ORDER BY created_at DESC LIMIT 60`)
    .all();
  const { results: comments } = await database
    .prepare(`SELECT id, post_id, author, text, created_at FROM reporter_comments WHERE status = 'approved' ORDER BY created_at ASC LIMIT 300`)
    .all();
  return json({ posts: results.map((post) => ({ ...post, comments: comments.filter((c) => c.post_id === post.id) })) });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();

  const body = await request.json().catch(() => ({}));
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
  await database
    .prepare(`INSERT INTO reporter_posts (id, title, description, kiez, category, status, ip, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`)
    .bind(id, title, description, kiez, category, ip, Date.now())
    .run();
  return json({ id, status: "pending" }, 201);
}
