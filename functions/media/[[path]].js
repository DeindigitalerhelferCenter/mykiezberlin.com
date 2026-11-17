// Serves story and community post images from R2.
// 2026-11-17 (owner: sponsor pictures load slowly): files with a unique id in the name never change, so they are
// kept 30 days in the browser and in the Cloudflare edge cache (before: 1 hour, every request read R2).
const UNIQUE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export async function onRequestGet({ request, params, env, waitUntil }) {
  if (!env.BUCKET) return new Response("Not found", { status: 404 });
  const key = (params.path || []).join("/");
  if (!key.startsWith("stories/") && !key.startsWith("posts/") && !key.startsWith("ads/")) return new Response("Not found", { status: 404 });
  const unique = UNIQUE.test(key) && !request.headers.get("range");
  const edge = unique && typeof caches !== "undefined" ? caches.default : null;
  if (edge) {
    const hit = await edge.match(request).catch(() => null);
    if (hit) return hit;
  }
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", unique ? "public, max-age=2592000, immutable" : "public, max-age=3600");
  headers.set("x-content-type-options", "nosniff");
  if (object.size) headers.set("content-length", String(object.size));
  const response = new Response(object.body, { headers });
  if (edge && object.size && object.size < 25 * 1024 * 1024) {
    try { waitUntil(edge.put(request, response.clone()).catch(() => {})); } catch (e) {}
  }
  return response;
}
