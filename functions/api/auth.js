// Member registration, login, logout and self-service account deletion.
import { createSession, currentUser, endSession, hashPassword, randomHex } from "../_lib/auth.js";
import { cleanText, db, ipHash, json, noDb, rateLimited } from "../_lib/util.js";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Members must not pass as the editors or an official source.
const RESERVED_NAMES = /redaktion|my\s*kiez|admin|polizei|feuerwehr|moderator/i;

const publicUser = (u) => ({ id: u.id, displayName: u.display_name, trusted: Boolean(u.trusted) });

export async function onRequestGet({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const user = await currentUser(request, database);
  return user ? json({ user: publicUser(user) }) : json({ user: null });
}

async function register(database, body, ip) {
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 160);
  const displayName = cleanText(body.displayName, 40);
  const password = String(body.password ?? "");
  if (!EMAIL.test(email) || displayName.length < 2) return json({ error: "missing_fields" }, 400);
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) return json({ error: "weak_password" }, 400);
  if (RESERVED_NAMES.test(displayName)) return json({ error: "reserved_name" }, 400);
  if (body.accept !== true) return json({ error: "terms_required" }, 400);
  if (await rateLimited(database, "users", ip)) return json({ error: "rate_limited" }, 429);
  if (await database.prepare(`SELECT 1 FROM users WHERE email = ?`).bind(email).first()) return json({ error: "email_taken" }, 409);

  const salt = randomHex(16);
  const user = { id: crypto.randomUUID(), display_name: displayName, trusted: 0 };
  await database
    .prepare(`INSERT INTO users (id, email, display_name, password_hash, salt, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(user.id, email, displayName, await hashPassword(password, salt), salt, ip, Date.now())
    .run();
  return json({ token: await createSession(database, user.id), user: publicUser(user) }, 201);
}

async function verifiedUser(database, email, password) {
  const user = await database.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
  if (!user) return null;
  return (await hashPassword(password, user.salt)) === user.password_hash ? user : null;
}

async function login(database, body, ip) {
  if (await rateLimited(database, "login_attempts", ip, 10)) return json({ error: "rate_limited" }, 429);
  const email = String(body.email ?? "").trim().toLowerCase();
  const user = await verifiedUser(database, email, String(body.password ?? "").slice(0, MAX_PASSWORD));
  if (!user) {
    await database.prepare(`INSERT INTO login_attempts (ip, created_at) VALUES (?, ?)`).bind(ip, Date.now()).run();
    return json({ error: "bad_login" }, 401);
  }
  return json({ token: await createSession(database, user.id), user: publicUser(user) });
}

// Comments stay readable after deletion, but lose every link to the person.
async function deleteAccount(request, database, body) {
  const user = await currentUser(request, database);
  if (!user) return json({ error: "login_required" }, 401);
  if (!(await verifiedUser(database, user.email, String(body.password ?? "").slice(0, MAX_PASSWORD)))) return json({ error: "bad_login" }, 401);
  await database.batch([
    database.prepare(`UPDATE reporter_comments SET user_id = '', author = 'Ehemaliges Mitglied' WHERE user_id = ?`).bind(user.id),
    database.prepare(`UPDATE reporter_posts SET user_id = '', author = 'Ehemaliges Mitglied' WHERE user_id = ?`).bind(user.id),
    database.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(user.id),
    database.prepare(`DELETE FROM users WHERE id = ?`).bind(user.id),
  ]);
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  const ip = await ipHash(request, env);
  if (body.action === "register") return register(database, body, ip);
  if (body.action === "login") return login(database, body, ip);
  if (body.action === "logout") {
    await endSession(request, database);
    return json({ ok: true });
  }
  if (body.action === "delete") return deleteAccount(request, database, body);
  return json({ error: "bad_action" }, 400);
}
