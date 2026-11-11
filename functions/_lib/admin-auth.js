// Admin accounts (2026-11-11). Replaces the shared test password.
// - Passwords are stored only as PBKDF2-SHA256 hashes (table admin_accounts).
// - Login returns a random session token; app and web send it as x-admin-token (table admin_sessions, only its hash is stored).
// - Every admin gets a one-time recovery code (shown once) for "password forgotten".
// - Optional e-mail reset: works when an e-mail binding (env.EMAIL, send_email) is configured in Cloudflare.
// - The secret ADMIN_TOKEN (Cloudflare) always works as master key.
// - The old test password "admin123" only works while no admin account exists yet (first setup).

const ITER = 100000;
const SESSION_DAYS = 365;
const enc = new TextEncoder();

export const DEFAULT_ADMIN_NAME = "Ersen Bakıcı";
export const DEFAULT_ADMIN_EMAIL = "bakiciersen@gmail.com";

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function randomHex(bytes = 32) {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)));
}
export async function sha256(text) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(String(text))));
}
export async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", enc.encode(String(password)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: ITER }, key, 256);
  return hex(bits);
}
function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function ensureAdminTables(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_accounts (id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, pw_salt TEXT, pw_hash TEXT, recovery_hash TEXT, created_at INTEGER, updated_at INTEGER)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, admin_id TEXT, created_at INTEGER, expires_at INTEGER)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_resets (token_hash TEXT PRIMARY KEY, admin_id TEXT, expires_at INTEGER)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (ip TEXT, created_at INTEGER)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`),
    // Security questions (2026-11-11): 3 questions per admin, answers only as salted hashes
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_questions (admin_id TEXT, pos INTEGER, question TEXT, salt TEXT, answer_hash TEXT, PRIMARY KEY (admin_id, pos))`),
  ]);
}

let tablesReady = false;
async function ready(database) {
  if (!tablesReady) { await ensureAdminTables(database); tablesReady = true; }
}

export async function adminCount(database) {
  await ready(database);
  const row = await database.prepare(`SELECT COUNT(*) AS n FROM admin_accounts`).first();
  return row?.n || 0;
}

/** Returns the admin for a session token, or null. */
export async function sessionAdmin(database, token) {
  if (!token || token.length < 32) return null;
  await ready(database);
  const row = await database
    .prepare(`SELECT a.id, a.name, a.email FROM admin_sessions s JOIN admin_accounts a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(await sha256(token), Date.now())
    .first();
  return row || null;
}

/** True for the master secret, a valid session, or (only before the first account exists) the old test password. */
export async function checkAdminToken(env, database, token) {
  if (!token) return false;
  if (env.ADMIN_TOKEN && same(token, env.ADMIN_TOKEN)) return true;
  if (!database) return !env.ADMIN_TOKEN && token === "admin123";
  await ready(database);
  if (await sessionAdmin(database, token)) return true;
  // Bootstrap sessions (created before any account exists) have admin_id "bootstrap".
  const boot = await database.prepare(`SELECT 1 FROM admin_sessions WHERE token_hash = ? AND admin_id = 'bootstrap' AND expires_at > ?`).bind(await sha256(token), Date.now()).first();
  if (boot && (await adminCount(database)) === 0) return true;
  return !env.ADMIN_TOKEN && token === "admin123" && (await adminCount(database)) === 0;
}

export async function createSession(database, adminId) {
  await ready(database);
  const token = randomHex(32);
  const now = Date.now();
  await database.prepare(`INSERT INTO admin_sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)`)
    .bind(await sha256(token), adminId, now, now + SESSION_DAYS * 86400000).run();
  return token;
}

/** Too many wrong logins from one client: 10 per hour. */
export async function tooManyAttempts(database, ip) {
  await ready(database);
  const row = await database.prepare(`SELECT COUNT(*) AS n FROM admin_login_attempts WHERE ip = ? AND created_at > ?`).bind(ip, Date.now() - 3600000).first();
  return (row?.n || 0) >= 10;
}
export async function noteFailedAttempt(database, ip) {
  await database.prepare(`INSERT INTO admin_login_attempts (ip, created_at) VALUES (?, ?)`).bind(ip, Date.now()).run();
  await database.prepare(`DELETE FROM admin_login_attempts WHERE created_at < ?`).bind(Date.now() - 86400000).run();
}

/** Finds the admin whose password matches (email optional: with one admin the password alone is enough). */
export async function findByPassword(database, email, password) {
  await ready(database);
  const rows = email
    ? (await database.prepare(`SELECT * FROM admin_accounts WHERE lower(email) = lower(?)`).bind(email).all()).results
    : (await database.prepare(`SELECT * FROM admin_accounts`).all()).results;
  for (const a of rows) {
    if (same(await hashPassword(password, a.pw_salt), a.pw_hash)) return a;
  }
  return null;
}

export function newRecoveryCode() {
  // 4 blocks of 4, easy to write down: e.g. K7QM-2XWD-9PLT-4HNA
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = [...bytes].map((b) => abc[b % abc.length]).join("");
  return chars.match(/.{4}/g).join("-");
}
export function normRecovery(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function saveAccount(database, { id, name, email, password }) {
  await ready(database);
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const code = newRecoveryCode();
  const recovery = await sha256(normRecovery(code));
  const now = Date.now();
  await database.prepare(`INSERT INTO admin_accounts (id, name, email, pw_salt, pw_hash, recovery_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email, pw_salt = excluded.pw_salt, pw_hash = excluded.pw_hash, recovery_hash = excluded.recovery_hash, updated_at = excluded.updated_at`)
    .bind(id, name, email, salt, hash, recovery, now, now).run();
  return code;
}

export async function setPassword(database, adminId, password) {
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  await database.prepare(`UPDATE admin_accounts SET pw_salt = ?, pw_hash = ?, updated_at = ? WHERE id = ?`).bind(salt, hash, Date.now(), adminId).run();
}

export async function getSetting(database, key, fallback) {
  await ready(database);
  const row = await database.prepare(`SELECT value FROM admin_settings WHERE key = ?`).bind(key).first();
  return row ? row.value : fallback;
}
export async function setSetting(database, key, value) {
  await ready(database);
  await database.prepare(`INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .bind(key, String(value), Date.now()).run();
}

// ---------- security questions (2026-11-11) ----------
// Choice offered in app and web; the admin may also type an own question.
export const QUESTION_CHOICES = [
  "Geburtsort deiner Mutter? · Annenin doğum yeri?",
  "Name deines ersten Haustiers? · İlk evcil hayvanının adı?",
  "Name deines Lieblingslehrers? · En sevdiğin öğretmenin adı?",
  "Straße deiner ersten Wohnung? · İlk evinin sokağı?",
  "Lieblingsessen als Kind? · Çocukken en sevdiğin yemek?",
  "Stadt, in der du geboren bist? · Doğduğun şehir?",
];

/** Answers are compared without case, spaces and punctuation (ı/i, ä/a … are kept as typed). */
export function normAnswer(a) {
  return String(a || "").toLocaleLowerCase("tr").replace(/[\s.,;:!?'"()-]+/g, "");
}

export async function saveQuestions(database, adminId, items) {
  await ready(database);
  const list = (items || []).slice(0, 3);
  const stmts = [database.prepare(`DELETE FROM admin_questions WHERE admin_id = ?`).bind(adminId)];
  for (let i = 0; i < list.length; i++) {
    const salt = randomHex(16);
    stmts.push(database.prepare(`INSERT INTO admin_questions (admin_id, pos, question, salt, answer_hash) VALUES (?, ?, ?, ?, ?)`)
      .bind(adminId, i, String(list[i].question).slice(0, 160), salt, await hashPassword(normAnswer(list[i].answer), salt)));
  }
  await database.batch(stmts);
}

export async function questionsFor(database, adminId) {
  await ready(database);
  const { results } = await database.prepare(`SELECT pos, question FROM admin_questions WHERE admin_id = ? ORDER BY pos`).bind(adminId).all();
  return results;
}

/** True when all stored answers match. */
export async function checkAnswers(database, adminId, answers) {
  await ready(database);
  const { results } = await database.prepare(`SELECT pos, salt, answer_hash FROM admin_questions WHERE admin_id = ? ORDER BY pos`).bind(adminId).all();
  if (results.length < 3) return false;
  for (const r of results) {
    const given = (answers || [])[r.pos];
    if (!given || !same(await hashPassword(normAnswer(given), r.salt), r.answer_hash)) return false;
  }
  return true;
}
