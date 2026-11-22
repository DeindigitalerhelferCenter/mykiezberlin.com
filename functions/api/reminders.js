// 2026-11-22 (owner): admin reminders (see functions/_lib/reminders.js)
// GET  /api/reminders                                   -> { reminders: [...] }
// POST /api/reminders {action:"save", id, due:"YYYY-MM-DDTHH:MM" (Berlin), lead_days}  -> new due date (after renewing)
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { ensureReminders, listReminders } from "../_lib/reminders.js";
import { berlinDay } from "../_lib/ledger.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  return json({ reminders: await listReminders(database), now: Date.now() }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensureReminders(database);
  const body = await request.json().catch(() => ({}));
  if (body.action === "save") {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(String(body.due || ""));
    if (!m) return json({ error: "bad_date" }, 400);
    const due = berlinDay(Number(m[1]), Number(m[2]), Number(m[3])) + (Number(m[4] || 23) * 60 + Number(m[5] || 0)) * 60000;
    const lead = Math.min(14, Math.max(0, Number(body.lead_days) || 2));
    const r = await database.prepare(`UPDATE admin_reminders SET due_at = ?, lead_days = ?, updated_at = ? WHERE id = ?`).bind(due, lead, Date.now(), cleanText(body.id, 40)).run();
    if (!r.meta || !r.meta.changes) return json({ error: "not_found" }, 404);
    return json({ ok: true, due });
  }
  return json({ error: "unknown_action" }, 400);
}
