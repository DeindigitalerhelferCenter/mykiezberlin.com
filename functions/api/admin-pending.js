// GET /api/admin-pending – small list of stories waiting for approval (admin token), polled by the admin's phone.
import { db, isAdmin, json, noDb } from "../_lib/util.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const since = Date.now() - 3 * 86400000;
  const { results } = await database
    .prepare(`SELECT id, headline, author, kiez, created_at FROM stories WHERE status = 'pending' AND created_at > ? ORDER BY created_at DESC LIMIT 20`)
    .bind(since)
    .all();
  // New support messages (2026-11-11) – the admin phone reports them too.
  let support = [];
  try {
    support = (await database.prepare(`SELECT id, topic, sponsor, message, created_at FROM support_messages WHERE status = 'new' AND created_at > ? ORDER BY created_at DESC LIMIT 20`).bind(since).all()).results;
  } catch (e) {
    support = []; // table is created with the first message
  }
  return json({ stories: results, support });
}
