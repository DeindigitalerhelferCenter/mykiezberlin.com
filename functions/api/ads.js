// Sponsor ads managed in the admin panel. Web and app read the same list.
// GET  /api/ads?place=home|slider  -> active ads for that place
// POST /api/ads {kind: "imp"|"click", ids: [...]} -> anonymous daily counters (no cookies)
// GET  /api/ads?place=page -> every sponsor for the page-change rotation, with plan size and weight
import { cleanText, db, json, noDb } from "../_lib/util.js";
import { effectivePlaces, parseExtra, planRule } from "../_lib/plans.js";
import { seedSponsors } from "../_lib/sponsor-seed.js";
import { safeLink } from "../_lib/blocklist.js";

const MAX_ADS = 12;
const MAX_PAGE_ADS = 40;
let seeded = false;

export async function onRequestGet({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const place = cleanText(new URL(request.url).searchParams.get("place"), 20) || "slider";
  const now = Date.now();
  if (!seeded) {
    await seedSponsors(database).catch(() => {});
    seeded = true;
  }
  const { results } = await database
    .prepare(`SELECT * FROM ads WHERE active = 1 AND (start_at = 0 OR start_at <= ?) AND (end_at = 0 OR end_at > ?)`)
    .bind(now, now)
    .all();
  // The booked plan decides where an ad appears (see _lib/plans.js); admin-chosen places are added.
  const ads = results
    .filter((ad) => effectivePlaces(ad).includes(place))
    .map((ad) => ({ ...ad, score: (ad.priority || 0) + Math.random() * 3 })) // fair rotation
    .sort((a, b) => b.score - a.score)
    .slice(0, place === "page" || place === "list" || place === "kiez" ? MAX_PAGE_ADS : MAX_ADS)
    .map((ad) => {
      const rule = planRule(ad.plan) || { size: "medium", weight: 1 };
      const extra = parseExtra(ad.extra);
      return {
        id: ad.id, name: ad.name, image: ad.image,
        headline_de: ad.headline_de, headline_tr: ad.headline_tr, headline_en: ad.headline_en,
        cta_de: ad.cta_de, cta_tr: ad.cta_tr, cta_en: ad.cta_en,
        link_web: safeLink(ad.link_web), link_wa: ad.link_wa, link_tel: ad.link_tel, link_ig: safeLink(ad.link_ig),
        kieze: ad.kieze || "", plan: ad.plan || "", size: rule.size, weight: rule.weight,
        logo: extra.logo || "", category: extra.category || null, address: extra.address || "", hours: extra.hours || "", coupon: extra.coupon || null,
        // Contact sheet (2026-11-11): shown when the card is tapped; primary = "tel" | "wa" | "" (web/info)
        email: extra.email || "", contact: extra.contact || "", fax: extra.fax || "", primary: extra.primary || "",
      };
    });
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
