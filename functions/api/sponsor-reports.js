// 2026-11-25 (owner): monthly sponsor reports (admin only), see functions/_lib/sponsor-report.js
// GET  /api/sponsor-reports?month=2026-11 -> { month, months, reports: [...] }  (finished months are saved for ever)
// POST /api/sponsor-reports {action:"mark", token, via:"wa"|"mail"}   -> marks a report as sent
// POST /api/sponsor-reports {action:"mail", token, email?}            -> sends the report text by e-mail (Brevo)
// POST /api/sponsor-reports {action:"comp", token}                    -> option a: +1 free month (goal not reached)
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { campaignPeriods, CAMPAIGN_START, monthKey, syncLedger } from "../_lib/ledger.js";
import { parseExtra } from "../_lib/plans.js";
import { sendMail } from "../_lib/mail.js";
import { recipientsFor } from "../_lib/sponsor-welcome-send.js"; // 2026-11-27
import { ensureSponsorReports, FIRST_MONTH, listSponsorReports, nextMonth, reportMessage } from "../_lib/sponsor-report.js";

const SITE = "https://mykiezberlin.com";
const link = (token) => `${SITE}/bericht/${token}`;

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const now = Date.now();
  const cur = monthKey(now);
  const asked = new URL(request.url).searchParams.get("month") || "";
  const month = /^\d{4}-\d{2}$/.test(asked) && asked >= FIRST_MONTH && asked <= cur ? asked : cur;
  const reports = (await listSponsorReports(database, month, now)).map((r) => {
    const out = { ...r };
    if (r.token) { out.link = link(r.token); Object.assign(out, reportMessage(r, out.link)); }
    return out;
  });
  const months = [];
  for (let k = FIRST_MONTH; k <= cur; k = nextMonth(k)) months.unshift(k);
  return json({ month, months, current: cur, reports }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensureSponsorReports(database);
  const body = await request.json().catch(() => ({}));
  const row = await database.prepare(`SELECT * FROM sponsor_reports WHERE token = ?`).bind(cleanText(body.token, 80)).first();
  if (!row) return json({ error: "not_found" }, 404);
  let data = {};
  try { data = JSON.parse(row.data); } catch (e) { data = {}; }
  const now = Date.now();

  if (body.action === "mark") {
    const col = body.via === "mail" ? "sent_mail" : "sent_wa";
    await database.prepare(`UPDATE sponsor_reports SET ${col} = ? WHERE token = ?`).bind(now, row.token).run();
    return json({ ok: true, [col]: now });
  }

  if (body.action === "mail") {
    const ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(row.ad_id).first();
    const x = parseExtra(ad && ad.extra);
    // 2026-11-27 (owner "UYGULA c–f"): E-Mail 1 / E-Mail 2 / both, as chosen at the sponsor ("report");
    // an address typed in the admin box is used alone (as before)
    const typed = cleanText(body.email || "", 120);
    const list = typed ? [typed] : recipientsFor(x, "report");
    const valid = list.filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
    if (!valid.length) return json({ error: "email_invalid" }, 400);
    const m = reportMessage({ ...data, comp: row.comp }, link(row.token));
    let ok = false;
    for (const to of valid) { if (await sendMail(env, { to, subject: m.subject, text: m.text })) ok = true; }
    if (ok) await database.prepare(`UPDATE sponsor_reports SET sent_mail = ? WHERE token = ?`).bind(now, row.token).run();
    return json({ ok: !!ok, email: valid.join(", "), sent_mail: ok ? now : row.sent_mail });
  }

  if (body.action === "comp") {
    if (row.comp) return json({ error: "already_given" }, 409);
    if (!(row.month < monthKey(now))) return json({ error: "month_not_finished" }, 409);
    if ((data.pct || 0) >= 100) return json({ error: "goal_reached" }, 409);
    const ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(row.ad_id).first();
    if (!ad) return json({ error: "not_found" }, 404);
    const x = parseExtra(ad.extra);
    const bonus = Number(x.bonus_free) || 0;
    const plan = String(ad.plan || "m").toLowerCase();
    // the free month is put right after the free months – only possible while no paid month has started yet
    const firstPaid = campaignPeriods(Math.max(ad.start_at || 0, CAMPAIGN_START), plan, bonus).find((p) => p.due_cents > 0);
    if (firstPaid && firstPaid.from <= now) return json({ error: "paid_started", hint: "Bezahlte Monate laufen schon – Ausgleich bitte als Zeile in der Buchhaltung anlegen." }, 409);
    x.bonus_free = bonus + 1;
    x.bonus_log = [...(Array.isArray(x.bonus_log) ? x.bonus_log : []), { at: now, month: row.month, views: data.views || 0, goal: data.goal || 0 }].slice(-24);
    // a fixed end date moves back by one month as well
    let end = ad.end_at || 0;
    if (end) { const d = new Date(end); d.setUTCMonth(d.getUTCMonth() + 1); end = d.getTime(); }
    await database.batch([
      database.prepare(`UPDATE ads SET extra = ?, end_at = ?, updated_at = ? WHERE id = ?`).bind(JSON.stringify(x), end, now, ad.id),
      database.prepare(`UPDATE sponsor_reports SET comp = ? WHERE token = ?`).bind(now, row.token),
    ]);
    await syncLedger(database, now).catch(() => {});
    return json({ ok: true, comp: now, bonus_free: x.bonus_free, end_at: end });
  }
  return json({ error: "unknown_action" }, 400);
}
