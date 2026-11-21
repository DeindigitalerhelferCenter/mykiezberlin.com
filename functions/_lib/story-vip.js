// 2026-11-21 (owner): trusted accounts ("Güvenilir hesaplar"). The admin manages the list in the admin panel.
//  - kind "key": a person (e.g. "Kiez26", a friend who shares stories). The admin creates a personal story key;
//    the person opens the link once (web) or types the key into the story form (app). Stories sent with this key:
//    no daily / hourly limit, up to 10 pictures/videos per story, long text, online at once – the AI check stays
//    (18+, insults, hate, gore are still refused).
//  - kind "ad": a sponsor (e.g. Terra Verde TEK, The Visit, Berlin Handel). Its sponsor-panel uploads have no
//    package limit any more.
// Only the hash of a key is stored.
import { randomHex, sha256 } from "./admin-auth.js";

export const VIP_MAX_FILES = 10;
let ready = false;

export async function ensureVip(database) {
  if (ready) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS story_vip (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, ad_id TEXT DEFAULT '', token_hash TEXT DEFAULT '', created_at INTEGER)`).run();
  ready = true;
  await seedVip(database).catch(() => {});
}

// 2026-11-21 (owner): Terra Verde TEK, The Visit Coffee Roastery and Berlin Handel are trusted from the start.
// Runs once (the admin can remove them later, they do not come back). "Kiez26" gets a key in the admin panel.
async function seedVip(database) {
  const mark = "fix:2026-11-21-vip";
  await database.prepare(`CREATE TABLE IF NOT EXISTS seeds (id TEXT PRIMARY KEY, created_at INTEGER)`).run();
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(mark).first()) return;
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT id, name FROM ads WHERE name LIKE 'Terra Verde%' OR name LIKE 'The Visit%' OR name LIKE 'Berlin Handel%'`)
    .all();
  const ops = results.map((ad) =>
    database.prepare(`INSERT OR IGNORE INTO story_vip (id, name, kind, ad_id, created_at) VALUES (?, ?, 'ad', ?, ?)`).bind("seed-" + ad.id, ad.name, ad.id, now));
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(mark, now));
  await database.batch(ops);
}

export function cleanKey(value) {
  const v = String(value ?? "").trim();
  return /^[a-f0-9]{32,64}$/.test(v) ? v : "";
}

/** Trusted person of this request (header x-story-key or form field story_key), or null. */
export async function vipFromRequest(database, request, form) {
  const key = cleanKey(request.headers.get("x-story-key") || (form && form.get("story_key")) || "");
  if (!key) return null;
  await ensureVip(database);
  return database.prepare(`SELECT id, name FROM story_vip WHERE kind = 'key' AND token_hash = ?`).bind(await sha256(key)).first();
}

export async function isVipAd(database, adId) {
  if (!adId) return false;
  await ensureVip(database);
  return !!(await database.prepare(`SELECT 1 FROM story_vip WHERE kind = 'ad' AND ad_id = ?`).bind(adId).first());
}

export async function listVip(database) {
  await ensureVip(database);
  const { results } = await database
    .prepare(`SELECT v.id, v.name, v.kind, v.ad_id, v.created_at, a.name AS ad_name FROM story_vip v LEFT JOIN ads a ON a.id = v.ad_id ORDER BY v.created_at ASC`)
    .all();
  return results;
}

/** New person with a story key. Returns the key ONCE (only its hash is stored). */
export async function addVipKey(database, name) {
  await ensureVip(database);
  const key = randomHex(16);
  const id = crypto.randomUUID();
  await database.prepare(`INSERT INTO story_vip (id, name, kind, token_hash, created_at) VALUES (?, ?, 'key', ?, ?)`).bind(id, name, await sha256(key), Date.now()).run();
  return { id, key };
}

export async function addVipAd(database, adId) {
  await ensureVip(database);
  const ad = await database.prepare(`SELECT id, name FROM ads WHERE id = ?`).bind(adId).first();
  if (!ad) return null;
  if (await isVipAd(database, adId)) return { id: "", name: ad.name };
  const id = crypto.randomUUID();
  await database.prepare(`INSERT INTO story_vip (id, name, kind, ad_id, created_at) VALUES (?, ?, 'ad', ?, ?)`).bind(id, ad.name, adId, Date.now()).run();
  return { id, name: ad.name };
}

export async function removeVip(database, id) {
  await ensureVip(database);
  await database.prepare(`DELETE FROM story_vip WHERE id = ?`).bind(id).run();
}
