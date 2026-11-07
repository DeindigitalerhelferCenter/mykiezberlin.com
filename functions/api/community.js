// Community feed: stories and posts with reply chains and likes.
import { currentUser } from "../_lib/auth.js";
import { cleanText, db, ipHash, json, noDb, rateLimited } from "../_lib/util.js";

const MAX_REPLIES = 10;
const TARGET_TABLES = { story: "stories", post: "reporter_posts", comment: "reporter_comments" };

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  const read = (sql, ...args) => database.prepare(sql).bind(...args).all().then((r) => r.results);
  const [stories, posts, comments, likes] = await Promise.all([
    read(`SELECT id, headline AS title, subtext AS text, kiez, author, media_key, media_type, approved_at AS created_at FROM stories WHERE status = 'approved' AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT 30`, Date.now()),
    read(`SELECT id, title, description AS text, kiez, category, author, media_key, media_type, upvotes, created_at FROM reporter_posts WHERE status = 'approved' ORDER BY created_at DESC LIMIT 40`),
    read(`SELECT id, post_id, target, parent_id, kind, author, text, created_at FROM reporter_comments WHERE status = 'approved' ORDER BY created_at ASC LIMIT 600`),
    read(`SELECT target, target_id, COUNT(*) AS n FROM likes GROUP BY target, target_id`),
  ]);
  const likeCount = new Map(likes.map((l) => [`${l.target}:${l.target_id}`, l.n]));
  const withComments = (target) => (item) => ({
    ...item,
    target,
    likes: target === "post" ? item.upvotes : likeCount.get(`story:${item.id}`) || 0,
    comments: comments
      .filter((c) => c.target === target && c.post_id === item.id)
      .map((c) => ({ ...c, likes: likeCount.get(`comment:${c.id}`) || 0 })),
  });
  const feed = [...stories.map(withComments("story")), ...posts.map(withComments("post"))].sort((a, b) => b.created_at - a.created_at);
  return json({ feed });
}

async function exists(database, target, id) {
  return database.prepare(`SELECT 1 FROM ${TARGET_TABLES[target]} WHERE id = ? AND status = 'approved'`).bind(id).first();
}

async function like(request, env, database, body) {
  const target = body.like?.target;
  const id = cleanText(body.like?.id, 60);
  if (!TARGET_TABLES[target] || !id || !(await exists(database, target, id))) return json({ error: "not_found" }, 404);
  const user = await currentUser(request, database);
  const voter = user?.id || (await ipHash(request, env));
  const result = await database.prepare(`INSERT OR IGNORE INTO likes (target, target_id, voter, created_at) VALUES (?, ?, ?, ?)`).bind(target, id, voter, Date.now()).run();
  const isNew = result.meta.changes > 0;
  if (isNew && target === "post") await database.prepare(`UPDATE reporter_posts SET upvotes = upvotes + 1 WHERE id = ?`).bind(id).run();
  return json({ ok: true, counted: isNew });
}

async function comment(request, env, database, body) {
  const user = await currentUser(request, database);
  if (!user) return json({ error: "login_required" }, 401);

  const target = body.comment?.target === "story" ? "story" : "post";
  const targetId = cleanText(body.comment?.targetId, 60);
  const text = cleanText(body.comment?.text, 500);
  let parentId = cleanText(body.comment?.parentId, 60);
  if (!text || !targetId) return json({ error: "missing_fields" }, 400);
  if (!(await exists(database, target, targetId))) return json({ error: "not_found" }, 404);

  if (parentId) {
    const parent = await database.prepare(`SELECT id, parent_id FROM reporter_comments WHERE id = ? AND post_id = ? AND target = ? AND status = 'approved'`).bind(parentId, targetId, target).first();
    if (!parent) return json({ error: "not_found" }, 404);
    // Every reply belongs to the chain's first comment, so the limit covers the whole chain.
    parentId = parent.parent_id || parent.id;
    const replies = await database.prepare(`SELECT COUNT(*) AS n FROM reporter_comments WHERE parent_id = ? AND status != 'rejected'`).bind(parentId).first();
    if (replies.n >= MAX_REPLIES) return json({ error: "thread_full" }, 409);
  }

  const ip = await ipHash(request, env);
  if (!user.trusted && (await rateLimited(database, "reporter_comments", ip, 10))) return json({ error: "rate_limited" }, 429);
  const status = user.trusted ? "approved" : "pending";
  await database
    .prepare(`INSERT INTO reporter_comments (id, post_id, target, parent_id, user_id, author, text, status, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), targetId, target, parentId, user.id, user.display_name, text, status, ip, Date.now())
    .run();
  return json({ status }, 201);
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  if (body.like) return like(request, env, database, body);
  if (body.comment) return comment(request, env, database, body);
  return json({ error: "bad_request" }, 400);
}
