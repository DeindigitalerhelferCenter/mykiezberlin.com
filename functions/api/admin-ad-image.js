// Admin uploads a sponsor image; it is stored in R2 under ads/ and served via /media/ads/...
import { isAdmin, json } from "../_lib/util.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 3 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return json({ error: "missing_file" }, 400);
  const ext = TYPES[file.type];
  if (!ext) return json({ error: "unsupported_file" }, 415);
  if (file.size > MAX_BYTES) return json({ error: "file_too_large" }, 413);
  const key = `ads/${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ ok: true, url: `/media/${key}` }, 201);
}
