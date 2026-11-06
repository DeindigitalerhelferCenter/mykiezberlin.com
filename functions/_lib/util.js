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

export async function fetchText(url, ms = 7000) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*" }, signal: AbortSignal.timeout(ms) });
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
];

let schemaReady = false;

export async function db(env) {
  if (!env.DB) return null;
  if (!schemaReady) {
    await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
    schemaReady = true;
  }
  return env.DB;
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
