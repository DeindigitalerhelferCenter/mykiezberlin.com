// Member accounts: PBKDF2 password hashes and opaque session tokens.

const PBKDF2_ITERATIONS = 100000;
const SESSION_MS = 60 * 86400000;

const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

export function randomHex(size) {
  return hex(crypto.getRandomValues(new Uint8Array(size)));
}

export async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: PBKDF2_ITERATIONS }, key, 256);
  return hex(bits);
}

const hashToken = async (token) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));

export async function createSession(database, userId) {
  const token = randomHex(32);
  await database.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).bind(await hashToken(token), userId, Date.now() + SESSION_MS).run();
  return token;
}

function bearer(request) {
  const match = (request.headers.get("authorization") || "").match(/^Bearer ([0-9a-f]{64})$/);
  return match ? match[1] : "";
}

export async function currentUser(request, database) {
  const token = bearer(request);
  if (!token) return null;
  return database
    .prepare(`SELECT u.id, u.email, u.display_name, u.trusted FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(await hashToken(token), Date.now())
    .first();
}

export async function endSession(request, database) {
  const token = bearer(request);
  if (token) await database.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(await hashToken(token)).run();
}
