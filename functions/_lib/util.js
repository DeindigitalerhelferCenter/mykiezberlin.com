// Shared helpers for My Kiez Berlin Pages Functions.

export const UA = "MyKiezBerlin/1.0 (+https://mykiezberlin.com)";

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", ndash: "–", mdash: "—", bdquo: "„", ldquo: "“", rdquo: "”", euro: "€" };

export function decode(text = "") {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENTITIES[n] ?? m);
}

export function stripTags(html = "") {
  return decode(decode(html).replace(/<[^>]*>/g, " ")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : "";
}

export function parseRss(xml, limit = 12) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const block = m[0];
    const title = stripTags(tag(block, "title"));
    const link = stripTags(tag(block, "link")) || stripTags(tag(block, "guid"));
    if (!title || !/^https:\/\//.test(link)) continue;
    const raw = tag(block, "description") || tag(block, "content:encoded");
    const image = (block.match(/<(?:enclosure|media:content|media:thumbnail)[^>]+url="(https:[^"]+)"/i) || decode(raw).match(/<img[^>]+src="(https:[^"]+)"/i) || [])[1] || "";
    const time = Date.parse(stripTags(tag(block, "pubDate")) || stripTags(tag(block, "dc:date")));
    items.push({ title, link, summary: stripTags(raw).slice(0, 280), image, publishedAt: Number.isNaN(time) ? null : time });
    if (items.length >= limit) break;
  }
  return items;
}

export async function fetchText(url, ms = 7000, extraHeaders = {}) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*", ...extraHeaders }, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function fetchJson(url, ms = 7000) {
  return JSON.parse(await fetchText(url, ms));
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS stories (id TEXT PRIMARY KEY, headline TEXT NOT NULL, subtext TEXT DEFAULT '', kiez TEXT NOT NULL, author TEXT DEFAULT 'Kiez Community', media_key TEXT DEFAULT '', media_type TEXT DEFAULT '', kind TEXT DEFAULT 'news', status TEXT DEFAULT 'pending', duration_hours INTEGER DEFAULT 24, ip TEXT DEFAULT '', created_at INTEGER, approved_at INTEGER DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status, created_at)`,
  `CREATE TABLE IF NOT EXISTS reporter_posts (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, kiez TEXT NOT NULL, category TEXT DEFAULT 'Kultur', author TEXT DEFAULT 'Kiez Community', upvotes INTEGER DEFAULT 1, status TEXT DEFAULT 'pending', ip TEXT DEFAULT '', created_at INTEGER)`,
  `CREATE INDEX IF NOT EXISTS idx_reporter_status ON reporter_posts(status, created_at)`,
  `CREATE TABLE IF NOT EXISTS reporter_comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, author TEXT DEFAULT 'Kiez Community', text TEXT NOT NULL, status TEXT DEFAULT 'pending', ip TEXT DEFAULT '', created_at INTEGER)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post ON reporter_comments(post_id, status)`,
  `CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, type TEXT NOT NULL, payload TEXT NOT NULL, status TEXT DEFAULT 'pending', ip TEXT DEFAULT '', created_at INTEGER)`,
  `CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(type, status)`,
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, trusted INTEGER DEFAULT 0, ip TEXT DEFAULT '', created_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT, created_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS likes (target TEXT NOT NULL, target_id TEXT NOT NULL, voter TEXT NOT NULL, created_at INTEGER, PRIMARY KEY (target, target_id, voter))`,
  // Advertising: requests from /werben, paid subscriptions (Stripe), sponsor ads and their daily counters.
  `CREATE TABLE IF NOT EXISTS ad_requests (id TEXT PRIMARY KEY, company TEXT NOT NULL, person TEXT DEFAULT '', email TEXT NOT NULL, phone TEXT DEFAULT '', size TEXT DEFAULT 's', message TEXT DEFAULT '', status TEXT DEFAULT 'new', stripe_session TEXT DEFAULT '', stripe_sub TEXT DEFAULT '', paid_until INTEGER DEFAULT 0, created_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS ads (id TEXT PRIMARY KEY, name TEXT NOT NULL, image TEXT DEFAULT '', headline_de TEXT DEFAULT '', headline_tr TEXT DEFAULT '', headline_en TEXT DEFAULT '', cta_de TEXT DEFAULT '', cta_tr TEXT DEFAULT '', cta_en TEXT DEFAULT '', link_web TEXT DEFAULT '', link_wa TEXT DEFAULT '', link_tel TEXT DEFAULT '', link_ig TEXT DEFAULT '', places TEXT DEFAULT 'slider,home', kieze TEXT DEFAULT '', priority INTEGER DEFAULT 0, plan TEXT DEFAULT '', request_id TEXT DEFAULT '', start_at INTEGER DEFAULT 0, end_at INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at INTEGER, updated_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS ad_stats (ad_id TEXT NOT NULL, day TEXT NOT NULL, imp INTEGER DEFAULT 0, clk INTEGER DEFAULT 0, PRIMARY KEY (ad_id, day))`,
  `CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, request_id TEXT, kind TEXT, amount INTEGER, created_at INTEGER)`,
];

// Columns added after launch. SQLite has no ADD COLUMN IF NOT EXISTS, so a repeat simply fails.
const MIGRATIONS = [
  `ALTER TABLE reporter_comments ADD COLUMN target TEXT DEFAULT 'post'`,
  `ALTER TABLE reporter_comments ADD COLUMN parent_id TEXT DEFAULT ''`,
  `ALTER TABLE reporter_comments ADD COLUMN user_id TEXT DEFAULT ''`,
  `ALTER TABLE reporter_comments ADD COLUMN kind TEXT DEFAULT 'user'`,
  `ALTER TABLE reporter_posts ADD COLUMN media_key TEXT DEFAULT ''`,
  `ALTER TABLE reporter_posts ADD COLUMN media_type TEXT DEFAULT ''`,
  `ALTER TABLE reporter_posts ADD COLUMN user_id TEXT DEFAULT ''`,
  `ALTER TABLE stories ADD COLUMN link TEXT DEFAULT ''`,
  `ALTER TABLE stories ADD COLUMN by_admin INTEGER DEFAULT 0`,
  `ALTER TABLE ads ADD COLUMN extra TEXT DEFAULT ''`,
];

// Accepts only Instagram post/reel links and returns them in one canonical form.
export function instagramUrl(value) {
  const m = String(value ?? "").trim().match(/^https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]{5,40})/i);
  if (!m) return "";
  const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  return `https://www.instagram.com/${kind}/${m[2]}/`;
}

let schemaReady = false;

export async function db(env) {
  if (!env.DB) return null;
  if (!schemaReady) {
    await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
    for (const sql of MIGRATIONS) await env.DB.prepare(sql).run().catch(() => {});
    schemaReady = true;
  }
  return env.DB;
}

const HOUR_MS = 3600000;
const ADMIN_GRACE_MS = 24 * HOUR_MS;

// Expired stories stay visible to the admin for 24 hours, then disappear with their media.
export async function cleanupExpiredStories(env) {
  const database = await db(env);
  if (!database) return;
  const { results } = await database
    .prepare(`SELECT id, media_key FROM stories WHERE status = 'approved' AND approved_at + duration_hours * ${HOUR_MS} + ${ADMIN_GRACE_MS} < ? LIMIT 20`)
    .bind(Date.now())
    .all();
  for (const row of results) {
    if (row.media_key && env.BUCKET) await env.BUCKET.delete(row.media_key);
    await database.prepare(`DELETE FROM stories WHERE id = ?`).bind(row.id).run();
  }
}

export const noDb = () => json({ error: "db_unbound" }, 503);

// Plain text only: user content is stored without markup.
export function cleanText(value, max) {
  return String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function ipHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const data = new TextEncoder().encode(ip + (env.ADMIN_TOKEN || "mykiez"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Allows at most `limit` submissions per hour and client across a table.
export async function rateLimited(database, table, ip, limit = 5) {
  const since = Date.now() - 3600000;
  const row = await database.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ip = ? AND created_at > ?`).bind(ip, since).first();
  return (row?.n ?? 0) >= limit;
}

export function isAdmin(request, env) {
  // Default stays open during testing; set the ADMIN_TOKEN secret before real users start.
  return request.headers.get("x-admin-token") === (env.ADMIN_TOKEN || "admin123");
}
