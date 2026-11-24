// 2026-11-24 (owner): R2 multipart upload for big pictures/videos of trusted accounts (see _lib/big-upload.js).
//   POST ?action=init      JSON { target: "story"|"sponsor", adId?, type, size } -> { key, uploadId, partSize }
//   PUT  ?action=part&key=&uploadId=&part=N   body = the bytes of part N (1..10000) -> { part, etag }
//   POST ?action=complete  JSON { key, uploadId, parts: [{ part, etag }] } -> { ref: "r2big:<key>|<type>|<size>" }
//   POST ?action=abort     JSON { key, uploadId }
// Same headers as the normal upload: x-admin-token, x-story-key or x-sponsor-token. Others get 403.
import { json } from "../_lib/util.js";
import { BIG_TYPES, bigAllowed } from "../_lib/big-upload.js";

const PART_SIZE = 20 * 1024 * 1024; // every part except the last must be the same size (R2 rule), 5 MiB at least

function targetOfKey(key) {
  if (key.startsWith("stories/big/")) return { target: "story", adId: "" };
  const m = /^ads\/media\/([\w-]{2,40})\/big-/.exec(key);
  return m ? { target: "sponsor", adId: m[1] } : null;
}

async function check(request, env, key) {
  const t = targetOfKey(String(key || ""));
  if (!t || key.includes("..")) return null;
  const ok = await bigAllowed(request, env, t.target, t.adId);
  return ok && key.startsWith(ok.prefix) ? ok : null;
}

export async function onRequestPost({ request, env }) {
  if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
  const action = new URL(request.url).searchParams.get("action");
  const body = await request.json().catch(() => ({}));
  if (action === "init") {
    const ext = BIG_TYPES[body.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    const ok = await bigAllowed(request, env, body.target, body.adId);
    if (!ok) return json({ error: "forbidden" }, 403);
    const key = `${ok.prefix}${crypto.randomUUID()}.${ext}`;
    const up = await env.BUCKET.createMultipartUpload(key, { httpMetadata: { contentType: body.type } });
    return json({ key, uploadId: up.uploadId, partSize: PART_SIZE });
  }
  if (action === "complete" || action === "abort") {
    if (!(await check(request, env, body.key))) return json({ error: "forbidden" }, 403);
    const up = env.BUCKET.resumeMultipartUpload(body.key, String(body.uploadId || ""));
    if (action === "abort") { await up.abort().catch(() => {}); return json({ ok: true }); }
    const parts = (Array.isArray(body.parts) ? body.parts : [])
      .map((p) => ({ partNumber: Number(p.part), etag: String(p.etag || "") }))
      .filter((p) => p.partNumber >= 1 && p.etag)
      .sort((a, b) => a.partNumber - b.partNumber);
    if (!parts.length) return json({ error: "no_parts" }, 400);
    const obj = await up.complete(parts).catch((e) => ({ error: String(e && e.message || e) }));
    if (obj.error) return json({ error: "complete_failed", detail: obj.error.slice(0, 200) }, 400);
    const head = await env.BUCKET.head(body.key);
    const type = (head && head.httpMetadata && head.httpMetadata.contentType) || "application/octet-stream";
    return json({ ref: `r2big:${body.key}|${type}|${head ? head.size : 0}`, size: head ? head.size : 0 });
  }
  return json({ error: "unknown_action" }, 400);
}

export async function onRequestPut({ request, env }) {
  if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
  const q = new URL(request.url).searchParams;
  const key = q.get("key") || "";
  const part = Number(q.get("part"));
  if (!(part >= 1 && part <= 10000)) return json({ error: "bad_part" }, 400);
  if (!(await check(request, env, key))) return json({ error: "forbidden" }, 403);
  const len = Number(request.headers.get("content-length") || 0);
  if (!len || len > PART_SIZE + 1024 * 1024) return json({ error: "bad_size" }, 400);
  const up = env.BUCKET.resumeMultipartUpload(key, q.get("uploadId") || "");
  const done = await up.uploadPart(part, request.body).catch((e) => ({ error: String(e && e.message || e) }));
  if (done.error) return json({ error: "part_failed", detail: done.error.slice(0, 200) }, 400);
  return json({ part, etag: done.etag });
}
