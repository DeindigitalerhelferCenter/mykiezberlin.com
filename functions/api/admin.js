// Server-side moderation for all shared content.
import { isBlockedUrl } from "../_lib/blocklist.js";
import { cleanText, db, instagramUrl, isAdmin, json, noDb } from "../_lib/util.js";
import { AD_PLACE_KEYS, planRule } from "../_lib/plans.js";

const TABLES = { story: "stories", post: "reporter_posts", comment: "reporter_comments", submission: "submissions" };

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const read = (sql) => database.prepare(sql).all().then((r) => r.results);
  const statsFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [stories, posts, comments, submissions, users, ads, adRequests, adStats] = await Promise.all([
    read(`SELECT id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, created_at, approved_at, link FROM stories ORDER BY created_at DESC LIMIT 200`),
    read(`SELECT id, title, description, kiez, category, author, media_key, user_id, status, created_at FROM reporter_posts ORDER BY created_at DESC LIMIT 100`),
    read(`SELECT id, post_id, target, kind, user_id, author, text, status, created_at FROM reporter_comments ORDER BY created_at DESC LIMIT 100`),
    read(`SELECT id, type, payload, status, created_at FROM submissions ORDER BY created_at DESC LIMIT 100`),
    read(`SELECT id, email, display_name, trusted, created_at FROM users ORDER BY created_at DESC LIMIT 200`),
    read(`SELECT * FROM ads ORDER BY active DESC, priority DESC, created_at DESC LIMIT 200`),
    read(`SELECT id, company, person, email, phone, size, message, status, paid_until, created_at FROM ad_requests ORDER BY created_at DESC LIMIT 100`),
    database.prepare(`SELECT ad_id, SUM(imp) AS imp, SUM(clk) AS clk FROM ad_stats WHERE day >= ? GROUP BY ad_id`).bind(statsFrom).all().then((r) => r.results),
  ]);
  const statsById = Object.fromEntries(adStats.map((s) => [s.ad_id, s]));
  const now = Date.now();
  const marked = stories.map((s) => (s.status === "approved" && s.approved_at > now ? { ...s, status: "scheduled" } : s.status === "approved" && s.approved_at + s.duration_hours * 3600000 < now ? { ...s, status: "expired" } : s));
  return json({
    stories: marked, posts, comments, users,
    submissions: submissions.map((s) => ({ ...s, payload: JSON.parse(s.payload) })),
    ads: ads.map((a) => ({ ...a, imp30: statsById[a.id]?.imp || 0, clk30: statsById[a.id]?.clk || 0 })),
    adRequests,
    stripe: Boolean(env.STRIPE_SECRET_KEY), stripeWebhook: Boolean(env.STRIPE_WEBHOOK_SECRET),
  });
}

// http(s) link for a story ("Mehr erfahren"), empty when invalid.
function storyLink(value) {
  const text = cleanText(value, 500);
  try {
    const url = new URL(text);
    if (isBlockedUrl(url.toString())) return "";
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

async function createStory(database, body) {
  const headline = cleanText(body.headline, 120);
  if (!headline) return json({ error: "missing_fields" }, 400);
  const now = Date.now();
  const id = crypto.randomUUID();
  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, status, duration_hours, created_at, approved_at, link) VALUES (?, ?, ?, ?, ?, 'My Kiez Berlin', 'approved', ?, ?, ?, ?)`)
    .bind(id, headline, cleanText(body.subtext, 500), cleanText(body.kiez, 60) || "Ganz Berlin", cleanText(body.kind, 30) || "news", Math.min(Number(body.durationHours) || 24, 720), now, now, storyLink(body.link))
    .run();
  return json({ id }, 201);
}

// Instagram videos of partner accounts: shown as a story with the post embedded, at least 48 hours.
const INSTAGRAM_MIN_HOURS = 48;
async function createInstagramStory(database, body) {
  const link = instagramUrl(body.link);
  if (!link) return json({ error: "bad_instagram_link" }, 400);
  const account = cleanText(body.account, 40).replace(/^@/, "");
  const headline = cleanText(body.headline, 120) || (account ? `Neues Video von @${account}` : "Neues Instagram-Video");
  const hours = Math.min(Math.max(Number(body.durationHours) || INSTAGRAM_MIN_HOURS, INSTAGRAM_MIN_HOURS), 720);
  const now = Date.now();
  const id = crypto.randomUUID();
  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, status, duration_hours, created_at, approved_at, link) VALUES (?, ?, ?, ?, 'instagram', ?, 'approved', ?, ?, ?, ?)`)
    .bind(id, headline, cleanText(body.subtext, 500), cleanText(body.kiez, 60) || "Ganz Berlin", account ? `@${account}` : "Instagram", hours, now, now, link)
    .run();
  return json({ id, link, durationHours: hours }, 201);
}

// Sponsor ads (web + app). Links must be http(s), tel: or WhatsApp numbers.
const AD_TEXT_FIELDS = ["name", "headline_de", "headline_tr", "headline_en", "cta_de", "cta_tr", "cta_en", "kieze", "plan", "request_id"];
function adUrl(value) {
  const v = String(value ?? "").trim();
  if (isBlockedUrl(v)) return ""; // never store hijacked / adult domains (blocklist.js)
  return /^(https:\/\/|http:\/\/|\/media\/ads\/|assets\/)/.test(v) ? v.slice(0, 400) : "";
}
async function saveAd(database, ad) {
  const now = Date.now();
  const id = /^[\w-]{2,40}$/.test(ad.id || "") ? ad.id : `ad_${crypto.randomUUID().slice(0, 8)}`;
  const row = Object.fromEntries(AD_TEXT_FIELDS.map((k) => [k, cleanText(ad[k], k.startsWith("headline") ? 200 : 120)]));
  if (!row.name) return json({ error: "missing_fields" }, 400);
  const places = String(ad.places || "slider,home").split(",").map((p) => p.trim()).filter((p) => AD_PLACE_KEYS.includes(p)).join(",") || (planRule(ad.plan) ? "" : "slider,home");
  const values = [
    row.name, adUrl(ad.image), row.headline_de, row.headline_tr, row.headline_en, row.cta_de, row.cta_tr, row.cta_en,
    adUrl(ad.link_web), cleanText(ad.link_wa, 40).replace(/[^\d+]/g, ""), cleanText(ad.link_tel, 40).replace(/[^\d+ ]/g, ""), adUrl(ad.link_ig),
    places, row.kieze, Math.max(0, Math.min(Number(ad.priority) || 0, 100)), row.plan, row.request_id,
    Number(ad.start_at) || 0, Number(ad.end_at) || 0, ad.active === false || ad.active === 0 ? 0 : 1, now,
  ];
  const exists = await database.prepare(`SELECT id FROM ads WHERE id = ?`).bind(id).first();
  if (exists) {
    await database.prepare(`UPDATE ads SET name=?, image=?, headline_de=?, headline_tr=?, headline_en=?, cta_de=?, cta_tr=?, cta_en=?, link_web=?, link_wa=?, link_tel=?, link_ig=?, places=?, kieze=?, priority=?, plan=?, request_id=?, start_at=?, end_at=?, active=?, updated_at=? WHERE id=?`)
      .bind(...values, id).run();
  } else {
    await database.prepare(`INSERT INTO ads (name, image, headline_de, headline_tr, headline_en, cta_de, cta_tr, cta_en, link_web, link_wa, link_tel, link_ig, places, kieze, priority, plan, request_id, start_at, end_at, active, updated_at, id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(...values, id, now).run();
  }
  // Extra details (logo, category, address, hours, coupon) – only changed when sent
  if (ad.extra && typeof ad.extra === "object") {
    const e = ad.extra;
    const pick = (o) => (o && typeof o === "object" ? { de: cleanText(o.de, 120), tr: cleanText(o.tr, 120), en: cleanText(o.en, 120) } : undefined);
    const extra = {
      logo: adUrl(e.logo), category: pick(e.category), address: cleanText(e.address, 120), hours: cleanText(e.hours, 80),
      coupon: e.coupon && cleanText(e.coupon.code, 30) ? { code: cleanText(e.coupon.code, 30), ...pick(e.coupon) } : undefined,
    };
    await database.prepare(`UPDATE ads SET extra = ? WHERE id = ?`).bind(JSON.stringify(extra), id).run();
  }
  return json({ ok: true, id });
}

// Editorial comments always carry the fixed, visible "Kiez-Redaktion" label.
async function createEditorialComment(database, body) {
  const text = cleanText(body.text, 500);
  const target = body.target === "story" ? "story" : "post";
  const targetId = cleanText(body.targetId, 60);
  if (!text || !targetId) return json({ error: "missing_fields" }, 400);
  await database
    .prepare(`INSERT INTO reporter_comments (id, post_id, target, kind, author, text, status, created_at) VALUES (?, ?, ?, 'editorial', 'Kiez-Redaktion', ?, 'approved', ?)`)
    .bind(crypto.randomUUID(), targetId, target, text, Date.now())
    .run();
  return json({ ok: true }, 201);
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();

  const body = await request.json().catch(() => ({}));
  const { type, id, action } = body;
  if (action === "createStory") return createStory(database, body);
  if (action === "createInstagramStory") return createInstagramStory(database, body);
  if (action === "adSave") return saveAd(database, body.ad || {});
  if (action === "adDelete") {
    await database.prepare(`DELETE FROM ads WHERE id = ?`).bind(cleanText(body.id, 40)).run();
    return json({ ok: true });
  }
  if (action === "requestStatus") {
    const status = ["new", "contacted", "done", "paid", "canceled"].includes(body.status) ? body.status : "done";
    await database.prepare(`UPDATE ad_requests SET status = ? WHERE id = ?`).bind(status, cleanText(body.id, 40)).run();
    return json({ ok: true });
  }
  if (action === "editorialComment") return createEditorialComment(database, body);
  if (action === "trustUser") {
    await database.prepare(`UPDATE users SET trusted = ? WHERE id = ?`).bind(body.trusted ? 1 : 0, cleanText(body.userId, 60)).run();
    return json({ ok: true });
  }

  const table = TABLES[type];
  if (!table || !id) return json({ error: "bad_request" }, 400);

  if (action === "approve") {
    const sql = type === "story"
      ? `UPDATE stories SET status = 'approved', approved_at = ? WHERE id = ?`
      : `UPDATE ${table} SET status = 'approved', created_at = ? WHERE id = ?`;
    await database.prepare(sql).bind(Date.now(), id).run();
  } else if (action === "reject") {
    await database.prepare(`UPDATE ${table} SET status = 'rejected' WHERE id = ?`).bind(id).run();
  } else if (action === "extend" && type === "story") {
    await database.prepare(`UPDATE stories SET duration_hours = duration_hours + ? WHERE id = ?`).bind(Math.min(Number(body.hours) || 48, 720), id).run();
  } else if (action === "edit" && type === "story") {
    await database.prepare(`UPDATE stories SET headline = ?, subtext = ? WHERE id = ?`).bind(cleanText(body.headline, 120), cleanText(body.subtext, 500), id).run();
  } else if (action === "storyMeta" && type === "story") {
    const kind = cleanText(body.kind, 30);
    const kiez = cleanText(body.kiez, 60);
    if (kind) await database.prepare(`UPDATE stories SET kind = ? WHERE id = ?`).bind(kind, id).run();
    if (kiez) await database.prepare(`UPDATE stories SET kiez = ? WHERE id = ?`).bind(kiez, id).run();
    if (body.link !== undefined) await database.prepare(`UPDATE stories SET link = ? WHERE id = ?`).bind(storyLink(body.link), id).run();
    // Admin posts are not part of the weekly Kiez-Stars ranking
    if (body.byAdmin) await database.prepare(`UPDATE stories SET by_admin = 1 WHERE id = ?`).bind(id).run();
    const author = cleanText(body.author, 40);
    if (author) await database.prepare(`UPDATE stories SET author = ? WHERE id = ?`).bind(author, id).run();
  } else if (action === "reschedule" && type === "story") {
    // Story planner: new start / end (ms). Start in the past = now.
    const now = Date.now();
    const start = Math.max(Number(body.publishAt) || now, now);
    const end = Number(body.endAt) || 0;
    const hours = end > start ? Math.ceil((end - start) / 3600000) : Math.min(Math.max(Number(body.durationHours) || 24, 1), 720);
    await database.prepare(`UPDATE stories SET status = 'approved', approved_at = ?, duration_hours = ? WHERE id = ?`).bind(start, Math.min(hours, 720), id).run();
  } else if (action === "publishNow" && type === "story") {
    await database.prepare(`UPDATE stories SET status = 'approved', approved_at = ? WHERE id = ?`).bind(Date.now(), id).run();
  } else if (action === "delete") {
    if ((type === "story" || type === "post") && env.BUCKET) {
      const row = await database.prepare(`SELECT media_key FROM ${table} WHERE id = ?`).bind(id).first();
      if (row?.media_key) await env.BUCKET.delete(row.media_key);
    }
    await database.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  } else {
    return json({ error: "bad_action" }, 400);
  }
  return json({ ok: true });
}
