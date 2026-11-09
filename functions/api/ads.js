// Sponsor ads managed in the admin panel. Web and app read the same list.
// GET  /api/ads?place=home|slider  -> active ads for that place
// POST /api/ads {kind: "imp"|"click", ids: [...]} -> anonymous daily counters (no cookies)
import { cleanText, db, json, noDb } from "../_lib/util.js";

const MAX_ADS = 12;

export async function onRequestGet({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const place = cleanText(new URL(request.url).searchParams.get("place"), 20) || "slider";
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT id, name, image, headline_de, headline_tr, headline_en, cta_de, cta_tr, cta_en, link_web, link_wa, link_tel, link_ig, places, kieze, priority FROM ads WHERE active = 1 AND (start_at = 0 OR start_at <= ?) AND (end_at = 0 OR end_at > ?)`)
    .bind(now, now)
    .all();
  const ads = results
    .filter((ad) => String(ad.places || "").split(",").map((p) => p.trim()).includes(place))
    .map((ad) => ({ ...ad, score: (ad.priority || 0) + Math.random() * 3 })) // fair rotation
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ADS)
    .map(({ score, places, priority, ...ad }) => ad);
  return json({ ads }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  const ids = (Array.isArray(body.ids) ? body.ids : [body.id]).map((id) => cleanText(id, 40)).filter((id) => /^[\w-]{2,40}$/.test(id)).slice(0, 20);
  if (!ids.length) return json({ ok: true });
  const click = body.kind === "click";
  const day = new Date().toISOString().slice(0, 10);
  const column = click ? "clk" : "imp";
  await database.batch(ids.map((id) => database
    .prepare(`INSERT INTO ad_stats (ad_id, day, imp, clk) VALUES (?, ?, ?, ?) ON CONFLICT(ad_id, day) DO UPDATE SET ${column} = ${column} + 1`)
    .bind(id, day, click ? 0 : 1, click ? 1 : 0)));
  return json({ ok: true });
}
