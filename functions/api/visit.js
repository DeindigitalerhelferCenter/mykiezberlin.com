// Visitor counter (2026-11-13) – anonymous, no cookies, no Google.
// POST /api/visit {src: "web" | "app" | "app-web"}  -> +1 view; +1 visitor the first time this device is seen today
//      (device = hash of day + IP + browser; the hash is kept 2 days only, then deleted).
// GET  /api/visit (x-admin-token) -> visitors and views per day (30 days), split by web/app,
//      plus how often each sponsor was shown and clicked (30 days).
import { cleanText, db, isAdmin, json, noDb, sha256Hex } from "../_lib/util.js";
import { monthlyGoal } from "../_lib/plans.js";

const SOURCES = ["web", "app", "app-web"];

async function ensure(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS visit_days (day TEXT NOT NULL, src TEXT NOT NULL, views INTEGER DEFAULT 0, visitors INTEGER DEFAULT 0, PRIMARY KEY (day, src))`),
    database.prepare(`CREATE TABLE IF NOT EXISTS visit_seen (day TEXT NOT NULL, hash TEXT NOT NULL, PRIMARY KEY (day, hash))`),
  ]);
}

function berlinDay(ms = Date.now()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date(ms)); // YYYY-MM-DD
}

export async function onRequestPost({ request, env, waitUntil }) {
  const database = await db(env);
  if (!database) return noDb();
  await ensure(database);
  const body = await request.json().catch(() => ({}));
  const src = SOURCES.includes(body.src) ? body.src : "web";
  const day = berlinDay();
  const ip = request.headers.get("cf-connecting-ip") || "";
  const ua = cleanText(request.headers.get("user-agent"), 300);
  const hash = (await sha256Hex(`${day}|${src}|${ip}|${ua}|${env.ADMIN_TOKEN || "mykiez"}`)).slice(0, 32);
  const seen = await database.prepare(`INSERT OR IGNORE INTO visit_seen (day, hash) VALUES (?, ?)`).bind(day, hash).run();
  const isNew = seen.meta && seen.meta.changes > 0 ? 1 : 0;
  await database
    .prepare(`INSERT INTO visit_days (day, src, views, visitors) VALUES (?, ?, 1, ?) ON CONFLICT(day, src) DO UPDATE SET views = views + 1, visitors = visitors + ?`)
    .bind(day, src, isNew, isNew)
    .run();
  // Hashes older than 2 days are not needed any more
  waitUntil(database.prepare(`DELETE FROM visit_seen WHERE day < ?`).bind(berlinDay(Date.now() - 2 * 86400000)).run().catch(() => {}));
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensure(database);
  const from = berlinDay(Date.now() - 29 * 86400000);
  const { results: days } = await database.prepare(`SELECT day, src, views, visitors FROM visit_days WHERE day >= ? ORDER BY day DESC`).bind(from).all();
  const fromUtc = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const { results: sponsors } = await database
    .prepare(`SELECT s.ad_id, a.name, a.plan, SUM(s.imp) AS views, SUM(s.clk) AS clicks FROM ad_stats s LEFT JOIN ads a ON a.id = s.ad_id WHERE s.day >= ? GROUP BY s.ad_id ORDER BY views DESC LIMIT 60`)
    .bind(fromUtc)
    .all();
  // 2026-11-13: this calendar month (for the fixed monthly goals per package)
  const monthStart = new Date().toISOString().slice(0, 8) + "01";
  const { results: month } = await database
    .prepare(`SELECT a.id AS ad_id, a.name, a.plan, a.active, COALESCE(SUM(s.imp), 0) AS views, COALESCE(SUM(s.clk), 0) AS clicks FROM ads a LEFT JOIN ad_stats s ON s.ad_id = a.id AND s.day >= ? GROUP BY a.id ORDER BY views DESC LIMIT 200`)
    .bind(monthStart)
    .all();
  return json({ today: berlinDay(), days, sponsors, month: month.map((m) => ({ ...m, goal: monthlyGoal(m.plan) })), monthStart, honestSince: "2026-11-13" });
}
