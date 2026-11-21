// 2026-11-22 (owner): classifieds ("Kleinanzeigen / İlanlar")
// - up to 5 pictures + 1 video per ad (R2 classifieds/<id>-<n>.<ext>)
// - free for 3 days; then the owner can extend: 1 week 5 €, 1 month 10 € (Stripe, one-time payment)
// - the owner is known by a secret key (only its hash is stored), kept in the browser that created the ad
import { randomHex, sha256 } from "./admin-auth.js";

export const CLASSIFIED_PLANS = { week: { amount: 500, days: 7, label: "1 Woche" }, month: { amount: 1000, days: 30, label: "1 Monat" } };
export const MAX_IMAGES = 5;
export const MAX_VIDEOS = 1;
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const FREE_MS = 3 * 86400000;

// visible: created in the last 3 days OR paid until later than now (2 bind values: since, now)
export const classifiedVisibleSql = "(created_at > ? OR paid_until > ?)";

let ready = false;
export async function ensureClassifieds(database) {
  if (ready) return;
  await database.prepare(`ALTER TABLE submissions ADD COLUMN owner_hash TEXT DEFAULT ''`).run().catch(() => {});
  await database.prepare(`ALTER TABLE submissions ADD COLUMN paid_until INTEGER DEFAULT 0`).run().catch(() => {});
  ready = true;
}

export async function newOwnerKey() {
  const key = randomHex(16);
  return { key, hash: await sha256(key) };
}

export async function saveClassifiedMedia(env, id, files) {
  const list = [];
  const real = (files || []).filter((f) => f && typeof f !== "string" && f.size > 0);
  if (!real.length) return { list };
  if (!env.BUCKET) return { error: "r2_unbound", status: 503 };
  let img = 0;
  let vid = 0;
  for (const f of real) {
    const ext = TYPES[f.type];
    if (!ext) return { error: "unsupported_file", status: 415 };
    const video = f.type.startsWith("video/");
    if (f.size > (video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) return { error: "file_too_large", status: 413 };
    if (video) vid++; else img++;
    if (vid > MAX_VIDEOS || img > MAX_IMAGES) return { error: "too_many_files", status: 400 };
  }
  let n = 0;
  for (const f of real) {
    n++;
    const key = `classifieds/${id}-${n}.${TYPES[f.type]}`;
    await env.BUCKET.put(key, await f.arrayBuffer(), { httpMetadata: { contentType: f.type } });
    list.push({ url: `/media/${key}`, type: f.type.startsWith("video/") ? "video" : "image" });
  }
  return { list };
}

export async function ownerRow(database, id, key) {
  if (!/^[a-f0-9]{32}$/.test(String(key || ""))) return null;
  await ensureClassifieds(database);
  return database.prepare(`SELECT id, payload, status, created_at, paid_until FROM submissions WHERE id = ? AND type = 'classified' AND owner_hash = ?`).bind(id, await sha256(key)).first();
}

/** Extends an ad by the plan's days, from its current end (or from now when it already ended). */
export async function extendClassified(database, id, plan) {
  const p = CLASSIFIED_PLANS[plan];
  if (!p) return 0;
  await ensureClassifieds(database);
  const row = await database.prepare(`SELECT created_at, paid_until FROM submissions WHERE id = ? AND type = 'classified'`).bind(id).first();
  if (!row) return 0;
  const end = Math.max(row.created_at + FREE_MS, row.paid_until || 0, Date.now());
  const until = end + p.days * 86400000;
  await database.prepare(`UPDATE submissions SET paid_until = ? WHERE id = ?`).bind(until, id).run();
  return until;
}

export async function classifiedCheckout(env, origin, id, plan, title) {
  const p = CLASSIFIED_PLANS[plan];
  if (!env.STRIPE_SECRET_KEY || !p) return null;
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": String(p.amount),
      "line_items[0][price_data][product_data][name]": `My Kiez Berlin Kleinanzeige ${p.label}: ${String(title || "").slice(0, 60)}`,
      "metadata[classified_id]": id,
      "metadata[plan]": plan,
      success_url: `${origin}/community/?paid=1&ad=${id}#ilan`,
      cancel_url: `${origin}/community/?canceled=1&ad=${id}#ilan`,
    }),
  });
  const s = await res.json();
  return s.url ? { url: s.url, id: s.id } : { error: (s.error && s.error.message) || "stripe" };
}
