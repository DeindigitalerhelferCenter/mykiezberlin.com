// 2026-11-24 (owner): big files for trusted accounts (admin, story key "Kiez26" …, trusted sponsors TEK / The Visit /
// Berlin Handel …). Cloudflare takes at most ~100 MB per request and a Worker has 128 MB memory, so a big file is sent
// in parts straight into R2 (multipart upload, see /api/big-upload). The form then sends the text "r2big:<key>|<type>|<size>"
// in place of the file; the story / sponsor-media API takes that object as if the file had been uploaded with the form.
import { cleanText, db, isAdmin } from "./util.js";
import { vipFromRequest, isVipAd } from "./story-vip.js";
import { sponsorFromToken } from "./sponsor-panel.js";

export const BIG_TYPES = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};

/** Who may send big files for this target. Returns { prefix } or null. */
export async function bigAllowed(request, env, target, adId) {
  const database = await db(env).catch(() => null);
  if (!database) return null;
  const admin = await isAdmin(request, env).catch(() => false);
  if (target === "story") {
    if (admin || (await vipFromRequest(database, request, null).catch(() => null))) return { prefix: "stories/big/" };
    return null;
  }
  if (target === "sponsor") {
    let ad = await sponsorFromToken(database, request.headers.get("x-sponsor-token") || "").catch(() => null);
    if (ad && !(await isVipAd(database, ad.id).catch(() => false))) ad = null;
    if (!ad && admin) ad = await database.prepare(`SELECT id FROM ads WHERE id = ?`).bind(cleanText(adId, 40)).first();
    if (ad) return { prefix: `ads/media/${ad.id}/big-` };
    return null;
  }
  return null;
}

/** "r2big:<key>|<type>|<size>" from a form field -> { key, type, size } if the object exists under the prefix. */
export async function bigRef(env, value, prefix) {
  const m = /^r2big:([\w./-]{8,200})\|([\w/.+-]{3,60})\|(\d{1,13})$/.exec(String(value || ""));
  if (!m || !env.BUCKET) return null;
  const [, key, type, size] = m;
  if (!key.startsWith(prefix) || key.includes("..") || !BIG_TYPES[type]) return null;
  const head = await env.BUCKET.head(key).catch(() => null);
  if (!head) return null;
  return { key, type, size: head.size || Number(size), big: true };
}

/** Every "file" entry of a form in order: real files and big references (only when allowed). */
export async function formFiles(env, form, name, prefix) {
  const out = [];
  for (const x of form.getAll(name)) {
    if (x && typeof x !== "string" && x.size > 0) out.push(x);
    else if (prefix && typeof x === "string" && x.startsWith("r2big:")) {
      const ref = await bigRef(env, x, prefix);
      if (ref) out.push(ref);
    }
  }
  return out;
}
