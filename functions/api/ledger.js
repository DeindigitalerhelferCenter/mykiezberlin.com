// 2026-11-22 (owner): Buchhaltung / Bakiye (admin only), see functions/_lib/ledger.js
// GET  /api/ledger?month=2026-11      -> { report, saved: bool, savedAt, months: [...] }
// POST /api/ledger {action:"paid", id, paid (euro), method, note}       -> mark a line as paid (keeps a note of the change)
// POST /api/ledger {action:"add", sponsor, date (YYYY-MM-DD), list, due, paid, method, note}  -> manual line (cash, bank …)
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { berlinDay, buildReport, closeMonths, ensureLedger, monthKey, syncLedger } from "../_lib/ledger.js";

const cents = (v) => Math.max(0, Math.round(Number(String(v || "0").replace(",", ".")) * 100) || 0);

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensureLedger(database);
  await syncLedger(database);
  await closeMonths(database);
  const url = new URL(request.url);
  const now = Date.now();
  const month = /^\d{4}-\d{2}$/.test(url.searchParams.get("month") || "") ? url.searchParams.get("month") : monthKey(now);
  const saved = await database.prepare(`SELECT created_at, data FROM ledger_reports WHERE month = ?`).bind(month).first();
  let report;
  if (saved && url.searchParams.get("live") !== "1") {
    try { report = JSON.parse(saved.data); } catch (e) { report = null; }
  }
  if (!report) report = await buildReport(database, month);
  const { results } = await database.prepare(`SELECT month, created_at FROM ledger_reports ORDER BY month DESC`).all();
  const months = [monthKey(now), ...(results || []).map((r) => r.month)].filter((m, i, a) => a.indexOf(m) === i);
  return json({ report, saved: !!saved, savedAt: saved ? saved.created_at : 0, months, now }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensureLedger(database);
  const body = await request.json().catch(() => ({}));
  const now = Date.now();
  if (body.action === "paid") {
    const row = await database.prepare(`SELECT id, ts, paid_cents, note FROM ledger WHERE id = ?`).bind(cleanText(body.id, 120)).first();
    if (!row) return json({ error: "not_found" }, 404);
    if (monthKey(row.ts) < monthKey(now)) {
      const closed = await database.prepare(`SELECT month FROM ledger_reports WHERE month = ?`).bind(monthKey(row.ts)).first();
      if (closed) return json({ error: "month_closed", hint: "Neue Zeile anlegen (Korrektur) statt alte zu ändern." }, 409);
    }
    const paid = cents(body.paid);
    const stamp = new Date(now).toISOString().slice(0, 16).replace("T", " ");
    const note = [row.note, `${stamp}: bezahlt ${(paid / 100).toFixed(2)} € (vorher ${(row.paid_cents / 100).toFixed(2)} €)${body.note ? " – " + cleanText(body.note, 200) : ""}`].filter(Boolean).join(" | ").slice(0, 1000);
    await database.prepare(`UPDATE ledger SET paid_cents = ?, paid_at = ?, method = ?, note = ?, updated_at = ? WHERE id = ?`)
      .bind(paid, now, cleanText(body.method || "Überweisung", 40), note, now, row.id).run();
    return json({ ok: true });
  }
  if (body.action === "add") {
    const sponsor = cleanText(body.sponsor, 120);
    if (!sponsor) return json({ error: "sponsor_missing" }, 400);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(body.date || ""));
    const ts = m ? berlinDay(Number(m[1]), Number(m[2]), Number(m[3])) + 12 * 3600000 : now;
    const list = cents(body.list), due = cents(body.due), paid = cents(body.paid);
    const id = `man-${crypto.randomUUID()}`;
    await database.prepare(`INSERT INTO ledger (id, ts, ad_id, sponsor, address, plan, period_from, period_to, list_cents, discount_cents, due_cents, paid_cents, paid_at, method, campaign, note, created_at, updated_at) VALUES (?, ?, '', ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, ts, sponsor, cleanText(body.address, 160), cleanText(body.plan, 20), list, Math.max(0, list - due), due, paid, paid ? now : 0, cleanText(body.method || "Bar", 40), cleanText(body.campaign, 120), cleanText(body.note, 300), now, now).run();
    return json({ ok: true, id });
  }
  return json({ error: "unknown_action" }, 400);
}
