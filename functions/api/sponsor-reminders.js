// 2026-11-22 (owner): weekly reminder to the sponsors – as a thank-you they share My Kiez Berlin once on Instagram or
// hang up the QR poster. NOTHING is sent automatically: the admin sees the list + text and presses "Senden".
// GET  /api/sponsor-reminders (admin)              -> { due: [{ id, name, email, last }], text: { de, tr } }
// POST /api/sponsor-reminders {ids: [...]} (admin) -> { sent, failed }
import { db, isAdmin, json, noDb } from "../_lib/util.js";
import { INFO, mailReady, sendMail } from "../_lib/mail.js";
import { parseExtra } from "../_lib/plans.js";

const WEEK = 7 * 86400000;

function text(name, adId) {
  const poster = `https://mykiezberlin.com/qr-plakat.html?s=${encodeURIComponent(adId)}`;
  return {
    subject: "My Kiez Berlin – kleine Bitte / küçük bir rica 🙏",
    body: [
      `Hallo ${name},`,
      "",
      "danke, dass du Kiez-Partner von My Kiez Berlin bist! Als kleines Dankeschön für deinen Platz bitten wir dich diese Woche um eins von beiden:",
      "• teile uns einmal auf Instagram (Story oder Beitrag, @mykiezberlin markieren) oder",
      `• häng unser QR-Plakat in deinem Laden auf: ${poster}`,
      "So finden noch mehr Nachbarn deinen Betrieb. Vielen Dank!",
      "",
      "—",
      "",
      `Merhaba ${name},`,
      "",
      "My Kiez Berlin Kiez partnerimiz olduğun için teşekkürler! Yerin için küçük bir teşekkür olarak bu hafta şu ikisinden birini rica ediyoruz:",
      "• bizi bir kez Instagram'da paylaş (hikâye veya gönderi, @mykiezberlin etiketle) veya",
      `• QR afişimizi dükkanına as: ${poster}`,
      "Böylece daha çok komşu işletmeni bulur. Çok teşekkürler!",
      "",
      "My Kiez Berlin · info@mykiezberlin.com",
    ].join("\n"),
  };
}

async function ensure(database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS sponsor_reminders (ad_id TEXT NOT NULL, sent_at INTEGER, ok INTEGER)`).run();
}

async function sponsors(database) {
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT a.id, a.name, a.extra, r.email AS req_email, (SELECT MAX(sent_at) FROM sponsor_reminders s WHERE s.ad_id = a.id AND s.ok = 1) AS last
              FROM ads a LEFT JOIN ad_requests r ON r.id = a.request_id
              WHERE a.active = 1 AND (a.end_at = 0 OR a.end_at > ?)`)
    .bind(now)
    .all();
  return results
    .map((a) => { const x = parseExtra(a.extra); return { id: a.id, name: a.name, email: String(x.email || a.req_email || "").trim(), own: !!x.own, last: a.last || 0 }; })
    .filter((a) => a.email && !a.own);
}

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensure(database);
  const list = await sponsors(database);
  const now = Date.now();
  const sample = text("Name", "beispiel");
  return json({ due: list.filter((a) => now - a.last >= WEEK), done: list.filter((a) => now - a.last < WEEK), text: sample, mail: mailReady(env) }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensure(database);
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 100) : [];
  const list = (await sponsors(database)).filter((a) => ids.includes(a.id));
  let sent = 0, failed = 0;
  for (const a of list) {
    const t = text(a.name, a.id);
    const ok = await sendMail(env, { to: a.email, from: INFO, subject: t.subject, text: t.body });
    await database.prepare(`INSERT INTO sponsor_reminders (ad_id, sent_at, ok) VALUES (?, ?, ?)`).bind(a.id, Date.now(), ok ? 1 : 0).run();
    if (ok) sent++; else failed++;
  }
  return json({ sent, failed });
}
