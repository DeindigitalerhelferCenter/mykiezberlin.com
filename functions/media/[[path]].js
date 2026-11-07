// Serves story and community post images from R2.
export async function onRequestGet({ params, env }) {
  if (!env.BUCKET) return new Response("Not found", { status: 404 });
  const key = (params.path || []).join("/");
  if (!key.startsWith("stories/") && !key.startsWith("posts/")) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
