// Sponsor ads managed in the admin panel. Web and app read the same list.
// GET  /api/ads?place=home|slider  -> active ads for that place
// POST /api/ads {kind: "imp"|"click", ids: [...]} -> anonymous daily counters (no cookies)
// GET  /api/ads?place=page -> every sponsor for the page-change rotation, with plan size and weight
import { cleanText, db, json, noDb } from "../_lib/util.js";
import { effectivePlaces, parseExtra, planRule , monthlyGoal } from "../_lib/plans.js";
import { seedSponsors } from "../_lib/sponsor-seed.js";
import { safeLink } from "../_lib/blocklist.js";

const MAX_ADS = 12;
const MAX_PAGE_ADS = 40;
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|playwright|puppeteer|phantom|curl|wget|python-requests/i;
let seeded = false;

// views of this calendar month per sponsor (only "really seen" views count since 2026-11-13)
async function thisMonthViews(database) {
  const map = new Map();
  try {
    const monthStart = new Date().toISOString().slice(0, 8) + "01";
    const { results } = await database.prepare(`SELECT ad_id, SUM(imp) AS views FROM ad_stats WHERE day >= ? GROUP BY ad_id`).bind(monthStart).all();
    results.forEach((r) => map.set(r.ad_id, Number(r.views) || 0));
  } catch (e) {
    // no statistics table yet: everybody starts at 0
  }
  return map;
}

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
  // 2026-11-13 (owner): fixed monthly service – Basic 1.000, Plus 3.000, Premium 8.000 really seen views per month.
  // Base share 1 : 3 : 8; a sponsor behind its goal for today gets up to 3× more turns, one ahead gets fewer.
  const monthViews = await thisMonthViews(database);
  const turns = (ad) => {
    const goal = monthlyGoal(ad.plan);
    const base = goal / 1000;
    const d = new Date();
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    const elapsed = (d.getUTCDate() - 1 + (d.getUTCHours() * 60 + d.getUTCMinutes()) / 1440) / daysInMonth;
    const due = Math.max(goal * elapsed, goal * 0.02);
    const ratio = (monthViews.get(ad.id) || 0) / due;
    const factor = ratio < 1 ? 1 + (1 - ratio) * 2 : Math.max(0.3, 1 / ratio);
    return Math.max(1, Math.round(base * factor));
  };
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
        kieze: ad.kieze || "", plan: ad.plan || "", size: rule.size, weight: turns(ad), goal: monthlyGoal(ad.plan),
        logo: extra.logo || "", category: extra.category || null, address: extra.address || "", hours: extra.hours || "", coupon: extra.coupon || null,
        // Contact sheet (2026-11-11): shown when the card is tapped; primary = "tel" | "wa" | "" (web/info)
        email: extra.email || "", contact: extra.contact || "", fax: extra.fax || "", primary: extra.primary || "",
        // 2026-11-13: long text from the sponsor panel
        description: extra.description || "",
      };
    });
  return json({ ads }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  // 2026-11-13: automated browsers and crawlers are not counted (honest sponsor numbers)
  if (BOT_UA.test(request.headers.get("user-agent") || "")) return json({ ok: true, counted: false });
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
