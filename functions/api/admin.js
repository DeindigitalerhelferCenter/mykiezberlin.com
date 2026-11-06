// Server-side moderation for stories and Kiez-Reporter posts.
import { db, isAdmin, json, noDb } from "../_lib/util.js";

const TABLES = { story: "stories", post: "reporter_posts" };

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const stories = await database.prepare(`SELECT id, headline, subtext, kiez, media_key, status, created_at FROM stories ORDER BY created_at DESC LIMIT 100`).all();
  const posts = await database.prepare(`SELECT id, title, description, kiez, category, status, created_at FROM reporter_posts ORDER BY created_at DESC LIMIT 100`).all();
  return json({ stories: stories.results, posts: posts.results });
}

export async function onRequestPost({ request, env }) {
  if (!isAdmin(request, env)) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();

  const { type, id, action } = await request.json().catch(() => ({}));
  const table = TABLES[type];
  if (!table || !id) return json({ error: "bad_request" }, 400);

  if (action === "approve") {
    const sql = type === "story"
      ? `UPDATE stories SET status = 'approved', approved_at = ? WHERE id = ?`
      : `UPDATE reporter_posts SET status = 'approved', created_at = ? WHERE id = ?`;
    await database.prepare(sql).bind(Date.now(), id).run();
  } else if (action === "reject") {
    await database.prepare(`UPDATE ${table} SET status = 'rejected' WHERE id = ?`).bind(id).run();
  } else if (action === "delete") {
    if (type === "story" && env.BUCKET) {
      const row = await database.prepare(`SELECT media_key FROM stories WHERE id = ?`).bind(id).first();
      if (row?.media_key) await env.BUCKET.delete(row.media_key);
    }
    await database.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  } else {
    return json({ error: "bad_action" }, 400);
  }
  return json({ ok: true });
}
