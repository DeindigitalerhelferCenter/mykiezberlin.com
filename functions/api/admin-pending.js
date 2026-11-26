// GET /api/admin-pending – small list of stories waiting for approval (admin token), polled by the admin's phone.
import { db, isAdmin, json, noDb } from "../_lib/util.js";
import { reminderNotices } from "../_lib/reminders.js";
import { reportNotices } from "../_lib/ledger.js";
import { pendingClassifiedNotices } from "../_lib/classified-flow.js"; // 2026-11-27 (owner "UYGULA ilan 1")

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
  // New sponsor pictures/videos (2026-11-13) – online at once, the admin checks them afterwards.
  let sponsorMedia = [];
  try {
    sponsorMedia = (await database.prepare(`SELECT m.id, m.ad_id, m.media_type, m.created_at, a.name FROM sponsor_media m LEFT JOIN ads a ON a.id = m.ad_id WHERE m.by_admin = 0 AND m.created_at > ? ORDER BY m.created_at DESC LIMIT 20`).bind(since).all()).results;
  } catch (e) {
    sponsorMedia = []; // table is created with the first sponsor panel call
  }
  // 2026-11-22 (owner): reminders (WhatsApp Info …) and finished monthly reports – shown by the phone like support
  // notices (one per day / per report), so no new app version is needed
  const extra = [...(await reminderNotices(env, database)), ...(await reportNotices(database)), ...(await pendingClassifiedNotices(database))];
  return json({ stories: results, support: [...extra, ...(support || [])], sponsorMedia, reminders: extra });
}
