// 2026-11-21 (owner): sponsor stories on top of the page (web + app).
// GET /api/sponsor-stories ->
//   { sponsors: [{ id, name, logo, image, latest, media: [{ url, type, caption, created_at }] }],
//     deals:    [{ ad_id, name, what, price, old, url, type, created_at, ends }] }
// - sponsors: every active sponsor with own uploads (sponsor panel / admin) of the last 24 hours, ONE folder per
//   sponsor (e.g. Terra Verde TEK: 5 pictures + 1 video), newest sponsor first, pictures in upload order.
// - deals: uploads of the last 24 hours whose text has a price ("Ayran 1 L 0,99 €") -> shown under
//   "Exklusive Kiez-Vorteile / Mahalle hikâyelerindeki güncel indirimler" (owner: the text price is enough).
import { db, json, noDb } from "../_lib/util.js";
import { ensureSponsorTables } from "../_lib/sponsor-panel.js";
import { dealFromText } from "../_lib/story-cats.js";
import { parseExtra } from "../_lib/plans.js";

const WINDOW_MS = 24 * 3600000;
const MAX_PER_SPONSOR = 15;

function mediaUrl(key) {
  return key.startsWith("/") || key.startsWith("https://") ? key : `/media/${key}`;
}

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  await ensureSponsorTables(database);
  const now = Date.now();
  const since = now - WINDOW_MS;
  // 2026-11-23 (owner "UYGULA 11"): every upload stays its own number of days (1, 2, 3 or 7; default 1 = 24 h as before)
  const { results } = await database
    .prepare(
      `SELECT m.id, m.ad_id, m.media_key, m.media_type, m.caption, m.created_at, COALESCE(m.days, 1) AS days, a.name, a.image, a.extra
       FROM sponsor_media m JOIN ads a ON a.id = m.ad_id
       WHERE m.status = 'live' AND m.created_at > ? AND m.created_at + COALESCE(m.days, 1) * 86400000 > ? AND m.media_type IN ('image', 'video')
         AND a.active = 1 AND (a.start_at = 0 OR a.start_at <= ?) AND (a.end_at = 0 OR a.end_at > ?)
       ORDER BY m.created_at ASC LIMIT 400`
    )
    .bind(now - 7 * 86400000, now, now, now)
    .all();

  const map = new Map();
  const deals = [];
  for (const r of results) {
    let s = map.get(r.ad_id);
    if (!s) {
      const extra = parseExtra(r.extra);
      s = { id: r.ad_id, name: r.name, logo: extra.logo || "", image: r.image || "", latest: 0, media: [] };
      map.set(r.ad_id, s);
    }
    const url = mediaUrl(r.media_key);
    // 2026-11-23: with 2–7 days more uploads are live -> the NEWEST 15 stay (was: the first 15)
    s.media.push({ url, type: r.media_type, caption: r.caption || "", created_at: r.created_at });
    if (s.media.length > MAX_PER_SPONSOR) s.media.shift();
    s.latest = Math.max(s.latest, r.created_at);
    const d = r.caption ? dealFromText(r.caption, "") : "";
    if (d) {
      try {
        const deal = JSON.parse(d);
        deals.push({ ad_id: r.ad_id, name: r.name, what: deal.what, price: deal.price, old: deal.old || "", url, type: r.media_type, created_at: r.created_at, ends: r.created_at + (Number(r.days) || 1) * 86400000 }); // 2026-11-23: own days
      } catch (e) {
        // no offer
      }
    }
  }
  const sponsors = [...map.values()].sort((a, b) => b.latest - a.latest);
  deals.sort((a, b) => b.created_at - a.created_at);
  return json({ sponsors, deals }, 200, { "cache-control": "public, max-age=60" });
}
