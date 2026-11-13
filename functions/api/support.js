// "Fehler melden / Support" (2026-11-11): reports about the app or a sponsor (wrong phone, dead link …).
// POST /api/support { topic: "app"|"sponsor"|"other", sponsor?, name?, email?, message, page?, hp }
//   -> saved in D1 (support_messages), admin phone is notified (/api/admin-pending), copy to support@mykiezberlin.com
//      (sender support@, Reply-To = the user – the private forwarding address is never shown).
// GET  /api/support (admin) -> newest messages;  PATCH /api/support { id, status: "done"|"new" } (admin)
// 2026-11-13 (owner: the admin must be able to answer, edit and delete):
//   PATCH  { id, status?: "new"|"progress"|"done", note?, message? }  -> edit status, admin note, message text
//   POST   { action: "reply", id, text } (admin)                      -> e-mail answer from support@ to the user, kept with the message
//   DELETE { id } (admin)                                              -> remove the message
//   Finished messages ("done") are deleted automatically 30 days after they were finished.
import { cleanText, db, ipHash, isAdmin, json, noDb, rateLimited } from "../_lib/util.js";
import { SUPPORT, lastError, sendMail } from "../_lib/mail.js";
import { supportReply } from "../_lib/mail-templates.js";

const TOPICS = ["app", "sponsor", "other"];
let ready = false;

async function table(database) {
  if (ready) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS support_messages (id TEXT PRIMARY KEY, topic TEXT, sponsor TEXT, name TEXT, email TEXT, message TEXT, page TEXT, status TEXT, ip TEXT, created_at INTEGER)`).run();
  // 2026-11-13: admin note, answers (JSON list), time of the last change and of "done"
  for (const col of ["note TEXT DEFAULT ''", "replies TEXT DEFAULT '[]'", "updated_at INTEGER DEFAULT 0", "done_at INTEGER DEFAULT 0"]) {
    await database.prepare(`ALTER TABLE support_messages ADD COLUMN ${col}`).run().catch(() => {}); // already there
  }
  ready = true;
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  await table(database);
  const body = await request.json().catch(() => ({}));
  if (body.hp) return json({ ok: true }); // honeypot
  if (body.action === "reply") return adminReply(request, env, database, body);
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
  // Automatic thank-you reply (only when the user gave an e-mail), sender support@ (2026-11-11)
  let mailed = false;
  if (row.email) {
    const reply = supportReply(body.lang, row.topic, { message: row.message, sponsor: row.sponsor || "-" });
    mailed = await sendMail(env, { to: row.email, from: SUPPORT, subject: reply.subject, text: reply.text });
  }
  // "mailed" only tells whether the reply was accepted for sending (no addresses are returned)
  return json({ ok: true, id: row.id, mailed, mailError: mailed || !row.email ? "" : lastError.replace(/[\w.+-]+@[\w.-]+/g, "…") });
}

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await table(database);
  const now = Date.now();
  // finished messages from before 2026-11-13 have no done_at yet: their 30 days start now
  await database.prepare(`UPDATE support_messages SET done_at = ? WHERE status = 'done' AND (done_at IS NULL OR done_at = 0)`).bind(now).run();
  await database.prepare(`DELETE FROM support_messages WHERE status = 'done' AND done_at > 0 AND done_at < ?`).bind(now - DONE_KEEP_MS).run();
  const { results } = await database.prepare(`SELECT id, topic, sponsor, name, email, message, page, status, created_at, note, replies, updated_at, done_at FROM support_messages ORDER BY created_at DESC LIMIT 200`).all();
  return json({ messages: results.map((m) => ({ ...m, replies: parseReplies(m.replies) })), keepDays: DONE_KEEP_MS / 86400000 });
}

const DONE_KEEP_MS = 30 * 86400000;
const STATUSES = ["new", "progress", "done"];

function parseReplies(value) {
  try {
    const list = JSON.parse(value || "[]");
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);
// long admin/user text: keeps line breaks, no markup
function cleanLong(value) {
  return String(value ?? "").replace(/[<>]/g, "").split(CR).join("");
}

async function adminReply(request, env, database, body) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const row = await database.prepare(`SELECT * FROM support_messages WHERE id = ?`).bind(cleanText(body.id, 40)).first();
  if (!row) return json({ error: "not_found" }, 404);
  if (!row.email) return json({ error: "no_email" }, 400);
  const text = String(body.text ?? "").replace(/[<>]/g, "").split(CR).join("").trim().slice(0, 5000);
  if (!text) return json({ error: "empty" }, 400);
  const topicName = { app: "App / Webseite", sponsor: "Sponsor", other: "Sonstiges" }[row.topic] || "Support";
  const mailed = await sendMail(env, {
    to: row.email,
    from: SUPPORT,
    subject: `Re: My Kiez Berlin Support – ${topicName}`,
    text: [text, "", "—", "My Kiez Berlin Support", "https://mykiezberlin.com", "", ...String(row.message || "").split(NL).map((l) => "> " + l)].join(NL),
  });
  if (!mailed) return json({ error: "mail_failed", detail: lastError.replace(/[\w.+-]+@[\w.-]+/g, "…") }, 502);
  const replies = parseReplies(row.replies);
  replies.push({ at: Date.now(), text });
  await database.prepare(`UPDATE support_messages SET replies = ?, status = CASE WHEN status = 'new' THEN 'progress' ELSE status END, updated_at = ? WHERE id = ?`)
    .bind(JSON.stringify(replies), Date.now(), row.id).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await table(database);
  const body = await request.json().catch(() => ({}));
  await database.prepare(`DELETE FROM support_messages WHERE id = ?`).bind(cleanText(body.id, 40)).run();
  return json({ ok: true });
}

export async function onRequestPatch({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await table(database);
  const body = await request.json().catch(() => ({}));
  const id = cleanText(body.id, 40);
  const row = await database.prepare(`SELECT status, note, message FROM support_messages WHERE id = ?`).bind(id).first();
  if (!row) return json({ error: "not_found" }, 404);
  const status = body.status === undefined ? row.status : STATUSES.includes(body.status) ? body.status : "new";
  const note = body.note === undefined ? row.note || "" : String(body.note).replace(/[<>]/g, "").split(CR).join("").slice(0, 3000);
  const message = body.message === undefined ? row.message : String(body.message).replace(/[<>]/g, "").split(CR).join("").trim().slice(0, 5000) || row.message;
  const now = Date.now();
  await database.prepare(`UPDATE support_messages SET status = ?, note = ?, message = ?, updated_at = ?, done_at = CASE WHEN ? = 'done' THEN CASE WHEN status = 'done' AND done_at > 0 THEN done_at ELSE ? END ELSE 0 END WHERE id = ?`)
    .bind(status, note, message, now, status, now, id).run();
  return json({ ok: true });
}
