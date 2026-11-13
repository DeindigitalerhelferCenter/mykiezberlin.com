// 2026-11-14 (owner, "Soru 2": thousands of user stories later) – plan A + C:
//  A) a daily limit per user (IP or device), media of rejected / long-waiting stories is removed from R2
//     (expired stories were already removed by cleanupExpiredStories)
//  C) every user story is checked by Workers AI first (picture + text). Trusted devices (several stories approved by
//     the admin, none rejected) go online at once when the AI check is fine; everybody else waits for the admin.
import { storyMediaList } from "./util.js";

export const USER_DAILY_LIMIT = 3; // stories per user and 24 hours (admin not counted)
export const TRUST_APPROVED = 3; // approved stories needed before a device publishes directly
const PENDING_MAX_MS = 14 * 24 * 3600000; // waiting longer than 14 days -> rejected, media removed
const AI_MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
const AI_MAX_BYTES = 3 * 1024 * 1024;

let ready = false;
export async function ensureGuard(database) {
  if (ready) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS story_trust (device TEXT PRIMARY KEY, approved INTEGER DEFAULT 0, rejected INTEGER DEFAULT 0, updated_at INTEGER)`).run();
  ready = true;
}

export function cleanDevice(value) {
  const v = String(value ?? "").trim();
  return /^[A-Za-z0-9-]{16,64}$/.test(v) ? v : "";
}

export async function dailyLimited(database, ip, device) {
  const since = Date.now() - 24 * 3600000;
  const row = await database
    .prepare(`SELECT COUNT(*) AS n FROM stories WHERE by_admin = 0 AND created_at > ? AND (ip = ? OR (? != '' AND device = ?))`)
    .bind(since, ip, device, device)
    .first();
  return (row?.n ?? 0) >= USER_DAILY_LIMIT;
}

export async function isTrusted(database, device) {
  if (!device) return false;
  await ensureGuard(database);
  const row = await database.prepare(`SELECT approved, rejected FROM story_trust WHERE device = ?`).bind(device).first();
  return !!row && row.approved >= TRUST_APPROVED && row.rejected === 0;
}

/** Called when the admin approves or rejects a user story. */
export async function countTrust(database, storyId, field) {
  await ensureGuard(database);
  const s = await database.prepare(`SELECT device, by_admin FROM stories WHERE id = ?`).bind(storyId).first();
  if (!s || !s.device || s.by_admin) return;
  const col = field === "rejected" ? "rejected" : "approved";
  await database
    .prepare(`INSERT INTO story_trust (device, ${col}, updated_at) VALUES (?, 1, ?) ON CONFLICT(device) DO UPDATE SET ${col} = ${col} + 1, updated_at = excluded.updated_at`)
    .bind(s.device, Date.now())
    .run();
}

function toBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const PROMPT = `Du prüfst Beiträge für die öffentliche Berliner Nachbarschafts-App "My Kiez Berlin" (auch Kinder lesen mit).
NICHT erlaubt: Nacktheit oder Sexuelles, Gewalt oder Blut, Hass, Beleidigung oder Hetze, Drogen- oder Waffenverkauf, Glücksspiel,
private Daten anderer Menschen (Ausweis, Telefonnummer einer Privatperson, Autokennzeichen groß im Bild), Betrug oder Spam.
Normale Fotos aus dem Kiez, Werbung von Geschäften, Veranstaltungen und Nachrichten sind erlaubt.
Antworte NUR mit JSON: {"ok":true,"reason":""} oder {"ok":false,"reason":"kurzer Grund auf Deutsch"}`;

/** "ok", "flag:<reason>" or "" (AI not reachable / not sure -> the admin decides as before). */
export async function aiCheck(env, headline, subtext, bytes, mime) {
  if (!env.AI) return "";
  const content = [{ type: "text", text: `${PROMPT}\n\nTitel: ${headline}\nText: ${subtext}` }];
  if (bytes && /^image\/(jpeg|png|webp)$/.test(mime || "") && bytes.byteLength <= AI_MAX_BYTES) {
    content.push({ type: "image_url", image_url: { url: `data:${mime};base64,${toBase64(bytes)}` } });
  }
  for (const model of AI_MODELS) {
    try {
      const r = await env.AI.run(model, { messages: [{ role: "user", content }], max_tokens: 120, temperature: 0 });
      const raw = typeof r?.response === "string" ? r.response : JSON.stringify(r?.response ?? r);
      const m = String(raw).match(/\{[\s\S]*\}/);
      if (!m) continue;
      const d = JSON.parse(m[0]);
      if (d.ok === true) return "ok";
      if (d.ok === false) return "flag:" + String(d.reason || "").replace(/[<>]/g, "").slice(0, 120);
    } catch (e) {
      // next model
    }
  }
  return "";
}

/** Media of rejected stories and of stories waiting longer than 14 days is removed (rows stay for the history). */
export async function cleanupStoryMedia(env, database) {
  const old = Date.now() - PENDING_MAX_MS;
  await database.prepare(`UPDATE stories SET status = 'rejected' WHERE status = 'pending' AND created_at < ?`).bind(old).run();
  // rejected: media kept 3 days (the admin can still change the decision)
  const { results } = await database
    .prepare(`SELECT id, media_key, media_type, media_extra FROM stories WHERE status = 'rejected' AND media_key != '' AND by_admin = 0 AND created_at < ? LIMIT 20`)
    .bind(Date.now() - 3 * 24 * 3600000)
    .all();
  for (const row of results) {
    if (env.BUCKET) for (const m of storyMediaList(row)) await env.BUCKET.delete(m.key).catch(() => {});
    await database.prepare(`UPDATE stories SET media_key = '', media_type = '', media_extra = '[]' WHERE id = ?`).bind(row.id).run();
  }
}
