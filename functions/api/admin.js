// Server-side moderation for all shared content.
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";

const TABLES = { story: "stories", post: "reporter_posts", comment: "reporter_comments", submission: "submissions" };

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const read = (sql) => database.prepare(sql).all().then((r) => r.results);
  const [stories, posts, comments, submissions, users] = await Promise.all([
    read(`SELECT id, headline, subtext, kiez, kind, media_key, media_type, duration_hours, status, created_at, approved_at FROM stories ORDER BY created_at DESC LIMIT 100`),
    read(`SELECT id, title, description, kiez, category, author, media_key, user_id, status, created_at FROM reporter_posts ORDER BY created_at DESC LIMIT 100`),
    read(`SELECT id, post_id, target, kind, user_id, author, text, status, created_at FROM reporter_comments ORDER BY created_at DESC LIMIT 100`),
    read(`SELECT id, type, payload, status, created_at FROM submissions ORDER BY created_at DESC LIMIT 100`),
    read(`SELECT id, email, display_name, trusted, created_at FROM users ORDER BY created_at DESC LIMIT 200`),
  ]);
  const now = Date.now();
  const marked = stories.map((s) => (s.status === "approved" && s.approved_at + s.duration_hours * 3600000 < now ? { ...s, status: "expired" } : s));
  return json({ stories: marked, posts, comments, users, submissions: submissions.map((s) => ({ ...s, payload: JSON.parse(s.payload) })) });
}

async function createStory(database, body) {
  const headline = cleanText(body.headline, 120);
  if (!headline) return json({ error: "missing_fields" }, 400);
  const now = Date.now();
  const id = crypto.randomUUID();
  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, status, duration_hours, created_at, approved_at) VALUES (?, ?, ?, ?, ?, 'My Kiez Berlin', 'approved', ?, ?, ?)`)
    .bind(id, headline, cleanText(body.subtext, 500), cleanText(body.kiez, 60) || "Ganz Berlin", cleanText(body.kind, 20) || "news", Math.min(Number(body.durationHours) || 24, 720), now, now)
    .run();
  return json({ id }, 201);
}

// Editorial comments always carry the fixed, visible "Kiez-Redaktion" label.
async function createEditorialComment(database, body) {
  const text = cleanText(body.text, 500);
  const target = body.target === "story" ? "story" : "post";
  const targetId = cleanText(body.targetId, 60);
  if (!text || !targetId) return json({ error: "missing_fields" }, 400);
  await database
    .prepare(`INSERT INTO reporter_comments (id, post_id, target, kind, author, text, status, created_at) VALUES (?, ?, ?, 'editorial', 'Kiez-Redaktion', ?, 'approved', ?)`)
    .bind(crypto.randomUUID(), targetId, target, text, Date.now())
    .run();
  return json({ ok: true }, 201);
}

export async function onRequestPost({ request, env }) {
  if (!isAdmin(request, env)) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();

  const body = await request.json().catch(() => ({}));
  const { type, id, action } = body;
  if (action === "createStory") return createStory(database, body);
  if (action === "editorialComment") return createEditorialComment(database, body);
  if (action === "trustUser") {
    await database.prepare(`UPDATE users SET trusted = ? WHERE id = ?`).bind(body.trusted ? 1 : 0, cleanText(body.userId, 60)).run();
    return json({ ok: true });
  }

  const table = TABLES[type];
  if (!table || !id) return json({ error: "bad_request" }, 400);

  if (action === "approve") {
    const sql = type === "story"
      ? `UPDATE stories SET status = 'approved', approved_at = ? WHERE id = ?`
      : `UPDATE ${table} SET status = 'approved', created_at = ? WHERE id = ?`;
    await database.prepare(sql).bind(Date.now(), id).run();
  } else if (action === "reject") {
    await database.prepare(`UPDATE ${table} SET status = 'rejected' WHERE id = ?`).bind(id).run();
  } else if (action === "extend" && type === "story") {
    await database.prepare(`UPDATE stories SET duration_hours = duration_hours + ? WHERE id = ?`).bind(Math.min(Number(body.hours) || 48, 720), id).run();
  } else if (action === "edit" && type === "story") {
    await database.prepare(`UPDATE stories SET headline = ?, subtext = ? WHERE id = ?`).bind(cleanText(body.headline, 120), cleanText(body.subtext, 500), id).run();
  } else if (action === "delete") {
    if ((type === "story" || type === "post") && env.BUCKET) {
      const row = await database.prepare(`SELECT media_key FROM ${table} WHERE id = ?`).bind(id).first();
      if (row?.media_key) await env.BUCKET.delete(row.media_key);
    }
    await database.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  } else {
    return json({ error: "bad_action" }, 400);
  }
  return json({ ok: true });
}
