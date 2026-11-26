// 2026-11-22 (owner): extend a classified after its 3 free days – 1 week 5 € / 1 month 10 €.
// GET  /api/classified-extend?id=&key=           -> { status, expiresAt, expired, title }
// GET  /api/classified-extend?admin=1 (admin)    -> { requests: [...] } classifieds waiting for a manual extension
// POST /api/classified-extend {id, key, plan}     -> { url } (Stripe checkout) | { error: "payment_unavailable" }
// POST /api/classified-extend {id, plan, admin}   (x-admin-token) -> extends without card payment (cash, transfer …)
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { CLASSIFIED_PLANS, classifiedCheckout, extendClassified, ownerRow } from "../_lib/classifieds.js";
import { INFO, sendMail } from "../_lib/mail.js";

const FREE_MS = 7 * 86400000; // 2026-11-27 (owner): 7 days free (was 3)

async function ensureRequests(database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS classified_requests (id TEXT PRIMARY KEY, classified_id TEXT, title TEXT, plan TEXT, created_at INTEGER, done INTEGER DEFAULT 0)`).run();
}

export async function onRequestGet({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const q = new URL(request.url).searchParams;
  if (q.get("admin")) {
    if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
    await ensureRequests(database);
    const { results } = await database.prepare(`SELECT * FROM classified_requests WHERE done = 0 ORDER BY created_at DESC LIMIT 50`).all();
    return json({ requests: results }, 200, { "cache-control": "no-store" });
  }
  const row = await ownerRow(database, cleanText(q.get("id"), 60), q.get("key"));
  if (!row) return json({ error: "not_found" }, 404);
  const expiresAt = Math.max(row.created_at + FREE_MS, row.paid_until || 0);
  let title = "";
  try { title = JSON.parse(row.payload).title || ""; } catch (e) { title = ""; }
  return json({ status: row.status, expiresAt, expired: Date.now() > expiresAt, title, plans: { week: 5, month: 10 } }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  const id = cleanText(body.id, 60);
  const plan = CLASSIFIED_PLANS[body.plan] ? body.plan : "";
  if (!plan) return json({ error: "bad_plan" }, 400);
  if (body.admin) {
    if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
    const until = await extendClassified(database, id, plan);
    await ensureRequests(database);
    await database.prepare(`UPDATE classified_requests SET done = 1 WHERE classified_id = ?`).bind(id).run();
    return until ? json({ ok: true, until }) : json({ error: "not_found" }, 404);
  }
  const row = await ownerRow(database, id, body.key);
  if (!row) return json({ error: "not_found" }, 404);
  let title = "";
  try { title = JSON.parse(row.payload).title || ""; } catch (e) { title = ""; }
  const checkout = await classifiedCheckout(env, new URL(request.url).origin, id, plan, title).catch(() => null);
  if (checkout && checkout.url) return json({ url: checkout.url });
  // no card payment set up yet: the wish is saved for the admin (admin panel + mail), the admin extends after payment
  await ensureRequests(database);
  await database.prepare(`INSERT INTO classified_requests (id, classified_id, title, plan, created_at) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), id, title, plan, Date.now()).run();
  const p = CLASSIFIED_PLANS[plan];
  await sendMail(env, { to: INFO, subject: `Kleinanzeige verlängern: ${title} (${p.label}, ${p.amount / 100} €)`, text: `Anzeige-ID: ${id}\nTitel: ${title}\nWunsch: ${p.label} für ${p.amount / 100} €\n\nIm Admin-Panel unter „Kleinanzeigen verlängern“ freischalten, sobald bezahlt ist.` }).catch(() => false);
  return json({ error: "payment_unavailable", requested: true }, 202);
}
