// GET /api/admin-pending – small list of stories waiting for approval (admin token), polled by the admin's phone.
import { db, isAdmin, json, noDb } from "../_lib/util.js";

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const since = Date.now() - 3 * 86400000;
  const { results } = await database
    .prepare(`SELECT id, headline, author, kiez, created_at FROM stories WHERE status = 'pending' AND created_at > ? ORDER BY created_at DESC LIMIT 20`)
    .bind(since)
    .all();
  return json({ stories: results });
}
