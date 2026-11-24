// 2026-11-25 (owner "UYGULA"): D1 hit its daily limit (5 M rows read on the free plan, 282 k queries a day, DB only 1.2 MB):
// every open page asked /api/stories + /api/submissions every minute and every sponsor card its own /api/sponsor-media.
// Public GET answers are now kept in Cloudflare's edge cache for a short time, so 1000 visitors = about 1 database read
// per minute and place. Requests with a login (admin, sponsor, story key) are never cached.
// Besides, a copy is kept for 1 day: when the database fails (limit, outage) the page shows that copy instead of an error.
const TTL = {
  "/api/stories": 60,
  "/api/submissions": 60,
  "/api/ads": 60,
  "/api/sponsor-stories": 60,
  "/api/sponsor-media": 60,
  "/api/flags": 60,
  "/api/blackfriday": 120,
  "/api/reporter": 60,
  "/api/stars": 120,
  "/api/news-stories": 60,
};
const STALE_S = 86400;
const PRIVATE = ["x-admin-token", "x-sponsor-token", "x-story-key", "authorization"];

function keyFor(url, stale) {
  const u = new URL(url);
  u.searchParams.delete("nc"); // cache busters from the client do not make a new entry
  u.searchParams.sort();
  if (stale) u.searchParams.set("__mk_stale", "1");
  return new Request(u.toString(), { method: "GET" });
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const ttl = TTL[url.pathname];
  if (request.method !== "GET" || !ttl || PRIVATE.some((h) => request.headers.get(h)) || url.searchParams.has("quota") || typeof caches === "undefined") {
    return context.next();
  }
  const cache = caches.default;
  const key = keyFor(request.url, false);
  const hit = await cache.match(key).catch(() => null);
  if (hit) {
    const r = new Response(hit.body, hit);
    r.headers.set("x-mk-cache", "HIT");
    return r;
  }
  let res = null;
  try {
    res = await context.next();
  } catch (e) {
    res = null; // the function crashed (e.g. database limit) -> try the 1-day copy below
  }
  if (res && res.status === 200) {
    const body = await res.arrayBuffer();
    const fresh = new Response(body, res);
    fresh.headers.set("cache-control", `public, max-age=${ttl}`);
    const stale = new Response(body, res);
    stale.headers.set("cache-control", `public, max-age=${STALE_S}`);
    context.waitUntil(Promise.all([cache.put(key, fresh.clone()), cache.put(keyFor(request.url, true), stale)]).catch(() => {}));
    const out = new Response(body, res);
    out.headers.set("x-mk-cache", "MISS");
    return out;
  }
  if (!res || res.status >= 500) {
    const old = await cache.match(keyFor(request.url, true)).catch(() => null);
    if (old) {
      const r = new Response(old.body, old);
      r.headers.set("cache-control", "no-store");
      r.headers.set("x-mk-cache", "STALE");
      return r;
    }
  }
  return res || new Response(JSON.stringify({ error: "unavailable" }), { status: 503, headers: { "content-type": "application/json" } });
}
