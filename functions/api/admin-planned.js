// GET /api/admin-planned – stories planned for later (story planner, admin token), sorted by start time.
import { db, isAdmin, json, noDb } from "../_lib/util.js";

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const { results } = await database
    .prepare(`SELECT id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, approved_at, link FROM stories WHERE status = 'approved' AND approved_at > ? ORDER BY approved_at ASC LIMIT 300`)
    .bind(Date.now())
    .all();
  return json({ stories: results });
}
