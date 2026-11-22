// 2026-11-22 (owner): sponsor book-keeping for the tax office ("Bakiye / Buchhaltung").
// Every sponsor period is one line in the table "ledger": date + time, sponsor, package, period, list price,
// discount (campaign), amount to pay and what was really paid (+ way of payment). Nothing is ever deleted;
// corrections are new lines (storno) or a changed "paid" with a note.
//
// Owner's campaign for all sponsors that are active on 20.11.2026 (not the owner's own pages):
//   20.11.2026 – 19.02.2027  Black-Friday-Angebot: 3 Monate gratis (0 €)
//   20.02.2027 – 19.05.2027  Aktionspreis 19 €/Monat (3 Monate)
//   from 20.05.2027          regular price (29 / 49 / 89 €) – lines are made only when the owner decides
// A sponsor that starts later gets the same 6 months from its own start date.
// Monthly report = all lines whose date is inside the calendar month (1st – last day, Berlin time).
// When a month is over, the report is saved for ever (table ledger_reports, with date + time) and the
// admin phone gets a notice (see /api/admin-pending).

export const CAMPAIGN_START = Date.UTC(2026, 10, 19, 23, 0, 0); // 20.11.2026 00:00 Berlin
export const LIST_PRICE = { s: 2900, m: 4900, gp: 4900, banner: 4900, l: 8900 };
export const PLAN_NAME = { s: "Kiez Basic", m: "Kiez Plus", gp: "Kiez Plus (Gründungspartner)", banner: "Banner-Sponsoring", l: "Kiez Premium" };
// sponsors that are the owner's own pages – never billed (owner 2026-11-22)
export const OWN_PAGES = ["dein-finanzen-helfer", "deindigitalerhelfer", "finanzen-helfer"];

export const BUSINESS = {
  name: "My Kiez Berlin",
  owner: "Ersen Bakıcı",
  street: "Behaimstraße 3",
  city: "10585 Berlin",
  mail: "info@mykiezberlin.com",
  web: "mykiezberlin.com",
  tax: "Einzelunternehmen (Kleinunternehmer) – gemäß § 19 UStG wird keine Umsatzsteuer berechnet und ausgewiesen.",
};

export async function ensureLedger(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS ledger (id TEXT PRIMARY KEY, ts INTEGER, ad_id TEXT, sponsor TEXT, address TEXT, plan TEXT, period_from INTEGER, period_to INTEGER, list_cents INTEGER, discount_cents INTEGER, due_cents INTEGER, paid_cents INTEGER, paid_at INTEGER, method TEXT, campaign TEXT, note TEXT, created_at INTEGER, updated_at INTEGER)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS ledger_reports (month TEXT PRIMARY KEY, created_at INTEGER, data TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS ledger_state (id TEXT PRIMARY KEY, value TEXT)`),
  ]);
}

// ---- Berlin calendar helpers (CET/CEST) ----
function berlinOffsetMs(ts) {
  const d = new Date(ts);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - d.getTime();
}
/** Berlin midnight of y-m-d as a timestamp. */
export function berlinDay(y, m, d) {
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  return guess - berlinOffsetMs(guess);
}
export function berlinParts(ts) {
  const s = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  return s; // "20.11.2026, 00:00"
}
export function monthKey(ts) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit" }).format(new Date(ts));
  return p.slice(0, 7); // "2026-11"
}
export function monthRange(key) {
  const [y, m] = key.split("-").map(Number);
  const from = berlinDay(y, m, 1);
  const to = m === 12 ? berlinDay(y + 1, 1, 1) : berlinDay(y, m + 1, 1);
  return { from, to };
}
function addMonths(y, m, d, n) {
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, Math.min(d, last)];
}
function ymdBerlin(ts) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts));
  return p.split("-").map(Number);
}

/** The 6 campaign periods of one sponsor from its start (not before 20.11.2026). */
export function campaignPeriods(startTs, plan) {
  const list = LIST_PRICE[plan] || LIST_PRICE.m;
  const [y, m, d] = ymdBerlin(Math.max(startTs || 0, CAMPAIGN_START));
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = addMonths(y, m, d, i);
    const b = addMonths(y, m, d, i + 1);
    const from = berlinDay(...a);
    const to = berlinDay(...b) - 1000; // until 23:59:59 the day before
    const free = i < 3;
    const due = free ? 0 : 1900;
    out.push({
      nr: i + 1, from, to, list_cents: list, due_cents: due, discount_cents: list - due,
      campaign: free ? `Black-Friday-Angebot: 3 Monate gratis (Monat ${i + 1}/3)` : `Aktionspreis 19 €/Monat (Monat ${i - 2}/3)`,
    });
  }
  return out;
}

/** Makes the lines of all active sponsors for every period that has started (idempotent). */
export async function syncLedger(database, now = Date.now()) {
  await ensureLedger(database);
  let ads = [];
  try {
    ads = (await database.prepare(`SELECT id, name, plan, active, start_at, end_at, created_at, extra FROM ads WHERE active = 1`).all()).results || [];
  } catch (e) { ads = []; }
  const ops = [];
  for (const ad of ads) {
    if (OWN_PAGES.some((x) => String(ad.id).includes(x)) || /finanzen\s*helfer/i.test(ad.name || "")) continue;
    if (ad.end_at && ad.end_at < CAMPAIGN_START) continue;
    let address = "";
    try { address = (JSON.parse(ad.extra || "{}") || {}).address || ""; } catch (e) { address = ""; }
    const plan = String(ad.plan || "m").toLowerCase();
    const start = Math.max(ad.start_at || 0, CAMPAIGN_START);
    for (const p of campaignPeriods(start, plan)) {
      if (p.from > now) break;
      const id = `camp-${ad.id}-${p.nr}`;
      ops.push(database.prepare(`INSERT OR IGNORE INTO ledger (id, ts, ad_id, sponsor, address, plan, period_from, period_to, list_cents, discount_cents, due_cents, paid_cents, paid_at, method, campaign, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, p.from, ad.id, ad.name || ad.id, address, plan, p.from, p.to, p.list_cents, p.discount_cents, p.due_cents, 0, p.due_cents === 0 ? p.from : 0, p.due_cents === 0 ? "keine Zahlung (Aktion)" : "offen", p.campaign, "", now, now));
    }
  }
  // Stripe payments (table payments) -> one line each
  try {
    const { results } = await database.prepare(`SELECT p.id, p.request_id, p.kind, p.amount, p.created_at, r.company FROM payments p LEFT JOIN ad_requests r ON r.id = p.request_id`).all();
    for (const p of results || []) {
      ops.push(database.prepare(`INSERT OR IGNORE INTO ledger (id, ts, ad_id, sponsor, address, plan, period_from, period_to, list_cents, discount_cents, due_cents, paid_cents, paid_at, method, campaign, note, created_at, updated_at) VALUES (?, ?, '', ?, '', ?, 0, 0, ?, 0, ?, ?, ?, 'Stripe (Karte)', '', ?, ?, ?)`)
        .bind(`stripe-${p.id}`, p.created_at, p.company || p.request_id || "Stripe", p.kind || "", p.amount || 0, p.amount || 0, p.amount || 0, p.created_at, `Anfrage ${p.request_id || ""}`, now, now));
    }
  } catch (e) { /* no payments yet */ }
  for (let i = 0; i < ops.length; i += 50) await database.batch(ops.slice(i, i + 50));
}

/** Report data of one calendar month (live). */
export async function buildReport(database, key) {
  await ensureLedger(database);
  const { from, to } = monthRange(key);
  const { results } = await database.prepare(`SELECT * FROM ledger WHERE ts >= ? AND ts < ? ORDER BY ts ASC, sponsor ASC`).bind(from, to).all();
  const lines = results || [];
  const sum = (k) => lines.reduce((a, x) => a + (Number(x[k]) || 0), 0);
  const effectiveFrom = key === monthKey(CAMPAIGN_START) ? CAMPAIGN_START : from;
  return {
    month: key, from: effectiveFrom, to: to - 1000, business: BUSINESS, lines,
    totals: { list: sum("list_cents"), discount: sum("discount_cents"), due: sum("due_cents"), paid: sum("paid_cents"), open: sum("due_cents") - sum("paid_cents") },
  };
}

/** Months that are over and not saved yet get saved now (for ever). Returns the newly saved month keys. */
export async function closeMonths(database, now = Date.now()) {
  await ensureLedger(database);
  const done = [];
  let key = monthKey(CAMPAIGN_START);
  const cur = monthKey(now);
  while (key < cur) {
    const have = await database.prepare(`SELECT month FROM ledger_reports WHERE month = ?`).bind(key).first();
    if (!have) {
      await syncLedger(database, monthRange(key).to - 1000);
      const data = await buildReport(database, key);
      await database.prepare(`INSERT OR IGNORE INTO ledger_reports (month, created_at, data) VALUES (?, ?, ?)`).bind(key, now, JSON.stringify(data)).run();
      done.push(key);
    }
    const [y, m] = key.split("-").map(Number);
    key = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  return done;
}

/** Notices for the admin phone: saved reports of the last 7 days. */
export async function reportNotices(database, now = Date.now()) {
  try {
    await ensureLedger(database);
    await closeMonths(database, now);
    const { results } = await database.prepare(`SELECT month, created_at FROM ledger_reports WHERE created_at > ?`).bind(now - 7 * 86400000).all();
    return (results || []).map((r) => ({ id: `ledger-${r.month}`, topic: "report", sponsor: "📒 Buchhaltung", message: `Monatsbericht ${r.month} ist fertig (Admin → Bakiye / Buchhaltung → Drucken). · ${r.month} aylık raporu hazır.`, created_at: r.created_at }));
  } catch (e) {
    return [];
  }
}
