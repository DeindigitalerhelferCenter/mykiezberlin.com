// 2026-11-25 (owner "UYGULA 1-7, seçenek a, takvim ayı"): monthly report for every sponsor.
// One report per sponsor and calendar month: really seen views + clicks per day, the monthly goal of the package
// (Basic 1.000 · Plus 3.000 · Premium 8.000, pro rata for the days the sponsor was with us in that month)
// and the visitors of My Kiez Berlin. A finished month is saved for ever (table sponsor_reports), so the numbers
// never change after sending. Every report has a secret link /bericht/<token> (DE + TR, print / save as PDF).
// Option a (owner): goal not reached -> admin can give "+1 Monat gratis" (one more free month, see ledger.js).
// November 2026 counts from 13.11.2026 only – before that every loaded card was counted (too high, not honest).
import { monthlyGoal, parseExtra } from "./plans.js";
import { OWN_PAGES, PLAN_NAME, monthKey } from "./ledger.js";

export const HONEST_SINCE = "2026-11-13";
export const FIRST_MONTH = "2026-11";

export async function ensureSponsorReports(database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS sponsor_reports (token TEXT PRIMARY KEY, ad_id TEXT NOT NULL, month TEXT NOT NULL, created_at INTEGER, data TEXT, sent_wa INTEGER DEFAULT 0, sent_mail INTEGER DEFAULT 0, comp INTEGER DEFAULT 0, UNIQUE (ad_id, month))`).run();
}

function berlinYmd(ts) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date(ts)); // YYYY-MM-DD
}
function lastDayOf(key) {
  const [y, m] = key.split("-").map(Number);
  return `${key}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
}
function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000) + 1;
}
export function isOwn(ad) {
  const x = parseExtra(ad.extra);
  return !!x.own || OWN_PAGES.some((p) => String(ad.id).includes(p)) || /finanzen\s*helfer/i.test(ad.name || "");
}
export function nextMonth(key) {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Report data of one sponsor for one calendar month (live numbers). Returns null when the sponsor was not with us. */
export async function buildSponsorReport(database, ad, key, now = Date.now()) {
  const monthFirst = `${key}-01`;
  const monthLast = lastDayOf(key);
  const today = berlinYmd(now);
  let from = monthFirst;
  if (from < HONEST_SINCE) from = HONEST_SINCE;
  const start = ad.start_at ? berlinYmd(ad.start_at) : (ad.created_at ? berlinYmd(ad.created_at) : "");
  if (start && start > from) from = start;
  let to = monthLast < today ? monthLast : today;
  if (ad.end_at && berlinYmd(ad.end_at) < to) to = berlinYmd(ad.end_at);
  if (from > to) return null;
  const { results } = await database.prepare(`SELECT day, imp, clk FROM ad_stats WHERE ad_id = ? AND day >= ? AND day <= ? ORDER BY day`).bind(ad.id, from, to).all();
  const days = (results || []).map((r) => ({ day: r.day, imp: Number(r.imp) || 0, clk: Number(r.clk) || 0 }));
  const views = days.reduce((a, d) => a + d.imp, 0);
  const clicks = days.reduce((a, d) => a + d.clk, 0);
  const goalFull = monthlyGoal(ad.plan);
  const monthDays = daysBetween(monthFirst, monthLast);
  // pro rata: only the days the sponsor was really with us (and counted honestly) in this month
  const endLimit = ad.end_at && berlinYmd(ad.end_at) < monthLast ? berlinYmd(ad.end_at) : monthLast;
  const activeDays = daysBetween(from, endLimit);
  const goal = Math.max(1, Math.round((goalFull * Math.min(activeDays, monthDays)) / monthDays));
  let site = { visitors: 0, views: 0 };
  try {
    const v = await database.prepare(`SELECT COALESCE(SUM(visitors), 0) AS visitors, COALESCE(SUM(views), 0) AS views FROM visit_days WHERE day >= ? AND day <= ?`).bind(from, to).first();
    site = { visitors: Number(v.visitors) || 0, views: Number(v.views) || 0 };
  } catch (e) { /* no visitor table yet */ }
  return {
    ad_id: ad.id, name: ad.name || ad.id, plan: ad.plan || "", plan_name: PLAN_NAME[ad.plan] || ad.plan || "",
    month: key, from, to, final: monthLast < today, days, views, clicks,
    ctr: views ? Math.round((clicks / views) * 1000) / 10 : 0,
    goal_full: goalFull, goal, pct: Math.round((views / goal) * 100), site, honest_since: HONEST_SINCE, built_at: now,
  };
}

async function sponsorsOfMonth(database, key) {
  const { results } = await database.prepare(`SELECT * FROM ads`).all();
  const first = `${key}-01`;
  return (results || []).filter((ad) => {
    if (isOwn(ad)) return false;
    if (ad.end_at && berlinYmd(ad.end_at) < first) return false;
    if (ad.start_at && berlinYmd(ad.start_at) > lastDayOf(key)) return false;
    return !!ad.active || !!ad.end_at; // paused sponsors without end date are left out
  });
}

function newToken() {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

/** Finished months that are not saved yet are saved now (one row per sponsor, never changed again). */
export async function closeSponsorMonths(database, now = Date.now()) {
  await ensureSponsorReports(database);
  const cur = monthKey(now);
  const saved = [];
  for (let key = FIRST_MONTH; key < cur; key = nextMonth(key)) {
    const done = await database.prepare(`SELECT COUNT(*) AS n FROM sponsor_reports WHERE month = ?`).bind(key).first();
    if (done && done.n > 0) continue;
    for (const ad of await sponsorsOfMonth(database, key)) {
      const data = await buildSponsorReport(database, ad, key, now);
      if (!data) continue;
      await database.prepare(`INSERT OR IGNORE INTO sponsor_reports (token, ad_id, month, created_at, data) VALUES (?, ?, ?, ?, ?)`)
        .bind(newToken(), ad.id, key, now, JSON.stringify(data)).run();
    }
    saved.push(key);
  }
  return saved;
}

/** List for the admin: saved reports of a finished month, or live numbers of the current month (not saved). */
export async function listSponsorReports(database, key, now = Date.now()) {
  await closeSponsorMonths(database, now);
  const ads = new Map(((await database.prepare(`SELECT * FROM ads`).all()).results || []).map((a) => [a.id, a]));
  const contact = (ad) => {
    const x = parseExtra(ad && ad.extra);
    return { wa: (ad && ad.link_wa) || "", email: x.panel_email || x.email || "" };
  };
  if (key < monthKey(now)) {
    const { results } = await database.prepare(`SELECT token, ad_id, month, created_at, data, sent_wa, sent_mail, comp FROM sponsor_reports WHERE month = ? ORDER BY ad_id`).bind(key).all();
    return (results || []).map((r) => {
      let data = {};
      try { data = JSON.parse(r.data); } catch (e) { data = {}; }
      return { ...data, token: r.token, saved: true, created_at: r.created_at, sent_wa: r.sent_wa, sent_mail: r.sent_mail, comp: r.comp, ...contact(ads.get(r.ad_id)) };
    });
  }
  const out = [];
  for (const ad of await sponsorsOfMonth(database, key)) {
    const data = await buildSponsorReport(database, ad, key, now);
    if (data) out.push({ ...data, token: "", saved: false, ...contact(ad) });
  }
  return out;
}

const fmtDay = (ymd) => ymd.split("-").reverse().join(".");
const nf = (n) => Number(n || 0).toLocaleString("de-DE");
export const MONTH_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
export const MONTH_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export function monthName(key, lang) {
  const [y, m] = key.split("-").map(Number);
  return `${(lang === "tr" ? MONTH_TR : MONTH_DE)[m - 1]} ${y}`;
}

/** Short WhatsApp / e-mail text (DE + TR) with the report link. */
export function reportMessage(r, link) {
  const compDe = r.comp ? "\n🎁 Als Ausgleich schenken wir Ihnen 1 zusätzlichen Gratis-Monat." : "";
  const compTr = r.comp ? "\n🎁 Telafi olarak size 1 ay daha ücretsiz hediye ediyoruz." : "";
  return {
    subject: `Ihr Monatsbericht ${monthName(r.month, "de")} · Aylık raporunuz – ${r.name}`,
    text:
`🇩🇪 Ihr My Kiez Berlin Monatsbericht – ${monthName(r.month, "de")}

${r.name} (${r.plan_name}), ${fmtDay(r.from)} – ${fmtDay(r.to)}:
👀 ${nf(r.views)} mal wirklich gesehen
👆 ${nf(r.clicks)} Klicks${compDe}

Alle Zahlen Tag für Tag (auch als PDF speichern):
${link}

————————————

🇹🇷 My Kiez Berlin aylık raporunuz – ${monthName(r.month, "tr")}

${r.name} (${r.plan_name}), ${fmtDay(r.from)} – ${fmtDay(r.to)}:
👀 ${nf(r.views)} kez gerçekten görüldü
👆 ${nf(r.clicks)} tıklama${compTr}

Günlük tüm sayılar (PDF olarak da kaydedebilirsiniz):
${link}

My Kiez Berlin · support@mykiezberlin.com`,
  };
}
