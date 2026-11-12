// Sponsor self-service panel (2026-11-13).
// A sponsor logs in with a link (token) – sent by e-mail to the address stored for the sponsor,
// or created by the admin and sent by hand (WhatsApp). Only the hash of the token is stored.
import { randomHex, sha256 } from "./admin-auth.js";
import { parseExtra } from "./plans.js";

export const TOKEN_DAYS = 30;

export async function ensureSponsorTables(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS sponsor_tokens (token_hash TEXT PRIMARY KEY, ad_id TEXT NOT NULL, email TEXT DEFAULT '', created_at INTEGER, expires_at INTEGER)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS sponsor_media (id TEXT PRIMARY KEY, ad_id TEXT NOT NULL, media_key TEXT NOT NULL, media_type TEXT NOT NULL, caption TEXT DEFAULT '', status TEXT DEFAULT 'live', bytes INTEGER DEFAULT 0, created_at INTEGER, by_admin INTEGER DEFAULT 0)`),
    database.prepare(`CREATE INDEX IF NOT EXISTS idx_sponsor_media_ad ON sponsor_media(ad_id, created_at)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS sponsor_login_requests (ip TEXT, created_at INTEGER)`),
  ]);
}

export async function createSponsorToken(database, adId, email) {
  const token = randomHex(24);
  const now = Date.now();
  await database
    .prepare(`INSERT INTO sponsor_tokens (token_hash, ad_id, email, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(await sha256(token), adId, email || "", now, now + TOKEN_DAYS * 86400000)
    .run();
  return token;
}

/** Returns the ad row of a valid sponsor token, or null. */
export async function sponsorFromToken(database, token) {
  if (!token || token.length < 32) return null;
  const row = await database.prepare(`SELECT ad_id FROM sponsor_tokens WHERE token_hash = ? AND expires_at > ?`).bind(await sha256(token), Date.now()).first();
  if (!row) return null;
  return database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(row.ad_id).first();
}

/** All sponsor ads whose stored e-mail (ad extra or the original advertising request) matches. */
export async function adsForEmail(database, email) {
  const mail = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return [];
  const { results } = await database.prepare(`SELECT a.*, r.email AS request_email FROM ads a LEFT JOIN ad_requests r ON r.id = a.request_id`).all();
  return results.filter((ad) => {
    const extra = parseExtra(ad.extra);
    return [extra.email, extra.panel_email, ad.request_email].some((m) => String(m || "").trim().toLowerCase() === mail);
  });
}

export function panelUrl(token) {
  return `https://mykiezberlin.com/sponsor?t=${token}`;
}
