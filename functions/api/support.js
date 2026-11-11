// "Fehler melden / Support" (2026-11-11): reports about the app or a sponsor (wrong phone, dead link …).
// POST /api/support { topic: "app"|"sponsor"|"other", sponsor?, name?, email?, message, page?, hp }
//   -> saved in D1 (support_messages), admin phone is notified (/api/admin-pending), copy to support@mykiezberlin.com
//      (sender support@, Reply-To = the user – the private forwarding address is never shown).
// GET  /api/support (admin) -> newest messages;  PATCH /api/support { id, status: "done"|"new" } (admin)
import { cleanText, db, ipHash, isAdmin, json, noDb, rateLimited } from "../_lib/util.js";
import { SUPPORT, sendMail } from "../_lib/mail.js";

const TOPICS = ["app", "sponsor", "other"];
let ready = false;

async function table(database) {
  if (ready) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS support_messages (id TEXT PRIMARY KEY, topic TEXT, sponsor TEXT, name TEXT, email TEXT, message TEXT, page TEXT, status TEXT, ip TEXT, created_at INTEGER)`).run();
  ready = true;
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  await table(database);
  const body = await request.json().catch(() => ({}));
  if (body.hp) return json({ ok: true }); // honeypot
  const row = {
    id: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
    topic: TOPICS.includes(body.topic) ? body.topic : "other",
    sponsor: cleanText(body.sponsor, 120),
    name: cleanText(body.name, 80),
    email: cleanText(body.email, 120).toLowerCase(),
    message: String(body.message ?? "").replace(/[<>]/g, "").trim().slice(0, 2000),
    page: cleanText(body.page, 200),
  };
  if (row.message.length < 5) return json({ error: "field", field: "message" }, 400);
  if (row.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) return json({ error: "field", field: "email" }, 400);
  const ip = await ipHash(request, env);
  if (await rateLimited(database, "support_messages", ip, 5)) return json({ error: "rate" }, 429);
  await database
    .prepare(`INSERT INTO support_messages (id, topic, sponsor, name, email, message, page, status, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`)
    .bind(row.id, row.topic, row.sponsor, row.name, row.email, row.message, row.page, ip, Date.now())
    .run();
  const topicName = { app: "App / Webseite", sponsor: "Sponsor", other: "Sonstiges" }[row.topic];
  await sendMail(env, {
    to: SUPPORT,
    from: SUPPORT,
    replyTo: row.email,
    subject: `Support: ${topicName}${row.sponsor ? " – " + row.sponsor : ""}`,
    text: [
      `Thema: ${topicName}`, row.sponsor ? `Sponsor: ${row.sponsor}` : "", `Name: ${row.name || "-"}`, `E-Mail: ${row.email || "-"}`,
      row.page ? `Seite: ${row.page}` : "", "", row.message, "", `Meldungs-ID: ${row.id}`,
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n"),
  });
  return json({ ok: true, id: row.id });
}

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await table(database);
  const { results } = await database.prepare(`SELECT id, topic, sponsor, name, email, message, page, status, created_at FROM support_messages ORDER BY created_at DESC LIMIT 100`).all();
  return json({ messages: results });
}

export async function onRequestPatch({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await table(database);
  const body = await request.json().catch(() => ({}));
  const status = body.status === "done" ? "done" : "new";
  await database.prepare(`UPDATE support_messages SET status = ? WHERE id = ?`).bind(status, cleanText(body.id, 40)).run();
  return json({ ok: true });
}
