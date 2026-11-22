// 2026-11-22 (owner): admin button "📤 Telegram: send stories that are not there yet" (see _lib/telegram.js telegramBacklog)
// GET  /api/telegram-backlog            -> { open, ready, list }
// POST /api/telegram-backlog {limit}    -> { sent, failed, open }   (call again while open > 0)
import { db, isAdmin, json, noDb } from "../_lib/util.js";
import { telegramBacklog } from "../_lib/telegram.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  return json(await telegramBacklog(env, database, { mode: "count" }), 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  return json(await telegramBacklog(env, database, { mode: "send", limit: body.limit }), 200, { "cache-control": "no-store" });
}
