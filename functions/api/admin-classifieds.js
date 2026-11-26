// 2026-11-27 (owner "UYGULA ilan 1"): light list of classifieds for the admin – waiting ones first, with pictures.
// GET /api/admin-classifieds -> { pending: [...], live: [...], expired: [...] }
// Approve / reject: POST /api/admin {type:"submission", id, action:"approve"|"reject"} (existing).
import { db, isAdmin, json, noDb } from "../_lib/util.js";
import { ensureClassifieds } from "../_lib/classifieds.js";
import { FREE_DAYS } from "../_lib/classified-flow.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensureClassifieds(database);
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT id, payload, status, created_at, paid_until FROM submissions WHERE type = 'classified' AND (status = 'pending' OR created_at > ?) ORDER BY created_at DESC LIMIT 60`)
    .bind(now - 30 * 86400000)
    .all();
  const out = { pending: [], live: [], expired: [], rejected: [] };
  for (const r of results || []) {
    let p = {};
    try { p = JSON.parse(r.payload); } catch (e) { p = {}; }
    const ends = Math.max(r.created_at + FREE_DAYS * 86400000, r.paid_until || 0);
    const row = { id: r.id, status: r.status, created_at: r.created_at, ends, ...p };
    if (r.status === "pending") out.pending.push(row);
    else if (r.status === "approved") (ends > now ? out.live : out.expired).push(row);
    else out.rejected.push(row);
  }
  return json(out, 200, { "cache-control": "no-store" });
}
