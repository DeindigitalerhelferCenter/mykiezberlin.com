// Shared Kiez stories: public list and moderated submissions.
import { safeLink } from "../_lib/blocklist.js";
import { telegramSweep } from "../_lib/telegram.js";
import { metaSweep } from "../_lib/meta-social.js";
import { aiReview, reviewVerdict, swearHit, swearReview, cleanDevice, cleanupStoryMedia, dailyLimited, dailyUsed, isTrusted, USER_DAILY_LIMIT } from "../_lib/story-guard.js";
import { STORY_CATS, aiStoryCats, catsOf, dealFromText, storyCats } from "../_lib/story-cats.js";
import { offerOf, polishHeadline, polishText } from "../_lib/story-offer.js"; // 2026-11-27 (owner)
import { vipFromRequest } from "../_lib/story-vip.js";
import { bigRef, formFiles } from "../_lib/big-upload.js";
import { newsSweep } from "../_lib/news-auto.js";
import { socialPlanerSweep } from "../_lib/social-planer.js";
import { inviteDailySweep } from "../_lib/invite-daily.js"; // 2026-11-26 (owner): daily invite card story
import { cleanLongText, cleanOverlay, cleanText, cleanupExpiredStories, db, ipHash, isAdmin, json, noDb, rateLimited, sha256Hex, parseDeal, storyDeal, storyMediaList, storyTextKey, validAuthor } from "../_lib/util.js";

const HOUR_MS = 3600000;
const MAX_HOURS = 720;

function webLink(value) {
  try {
    const url = new URL(cleanText(value, 500));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

// Admin story planner: start (publishAt) and end (endAt) in ms. Without end: durationHours, default 24.
// Start in the past or missing = now. The duration is rounded up to whole hours after the start.
function plannedWindow(form, now) {
  const start = Math.max(Number(form.get("publishAt")) || 0, now);
  const end = Number(form.get("endAt")) || 0;
  const hours = end > start ? Math.ceil((end - start) / HOUR_MS) : Number(form.get("durationHours")) || 24;
  return { start, hours: Math.min(Math.max(hours, 1), MAX_HOURS) };
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MEDIA_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };
const KINDS = ["news", "traffic", "event", "warn", "info", "politics"];
// 2026-11-13 (owner): the admin may add as many pictures/videos to one story as needed (e.g. a sponsor ad
// with 4 pictures + 2 videos). Users still send one file. Hard cap only against mistakes.
const ADMIN_MAX_FILES = 30; // (2026-11-24: not used any more – admin + trusted accounts have no file limit)
// 2026-11-24 (owner): admin + trusted accounts (story key) – no limit for files, file size or text. Big files come in
// parts through /api/big-upload (form field "r2big:<key>|<type>|<size>"); only a safety cap against broken forms.
const BIG_MAX_FILES = 500;
const BIG_HEADLINE = 1000;
const BIG_TEXT = 100000;
const USER_DURATIONS = [24, 48];
// Duplicates are checked against stories of the last 30 days that were not rejected.
const DUPLICATE_WINDOW_MS = 30 * 24 * HOUR_MS;

let lastCleanup = 0;
export async function onRequestGet({ request, env, waitUntil }) {
  const database = await db(env);
  if (!database) return noDb();
  // 2026-11-14 (owner: warn BEFORE the server refuses): GET /api/stories?quota=1&device=… -> stories left today
  const params = new URL(request.url).searchParams;
  if (params.get("quota")) {
    // 2026-11-21 (owner): trusted person (story key) – no daily limit
    const vipQ = await vipFromRequest(database, request, null).catch(() => null);
    if (vipQ) return json({ used: 0, limit: 0, left: 999, vip: true, name: vipQ.name }, 200, { "cache-control": "no-store" });
    const used = await dailyUsed(database, await ipHash(request, env), cleanDevice(params.get("device")));
    return json({ used, limit: USER_DAILY_LIMIT, left: Math.max(0, USER_DAILY_LIMIT - used) }, 200, { "cache-control": "no-store" });
  }
  // 2026-11-14 (owner): list of the story folders for web and app
  if (params.get("cats")) return json({ cats: STORY_CATS }, 200, { "cache-control": "public, max-age=3600" });
  // 2026-11-25 (owner): these scans ran on EVERY story request (every open page, every minute) and used up the daily
  // D1 read limit -> now at most once in 10 minutes per server instance
  if (Date.now() - lastCleanup > 10 * 60000) {
    lastCleanup = Date.now();
    waitUntil(cleanupExpiredStories(env));
    waitUntil(cleanupStoryMedia(env, database).catch(() => {})); // 2026-11-14: rejected / long-waiting media
  }
  waitUntil(telegramSweep(env, database)); // 2026-11-19 (owner): new live stories -> Telegram channel
  waitUntil(metaSweep(env, database)); // 2026-11-21 (owner): admin stories -> Facebook + Instagram (needs META_PAGE_TOKEN)
  waitUntil(newsSweep(env, database, new URL(request.url).origin)); // 2026-11-22 (owner): news lists every 2 h (+ auto mode)
  waitUntil(socialPlanerSweep(env, database)); // 2026-11-22 (owner): Social-Planer 08:00 / 16:00 / 23:00
  waitUntil(inviteDailySweep(env, database)); // 2026-11-26 (owner): one invite card per day as own story (10–21 h)
  const now = Date.now();
  const { results } = await database
    .prepare(`SELECT id, headline, subtext, kiez, kind, author, media_key, media_type, media_extra, overlay, deal, duration_hours, approved_at, link, cats FROM stories WHERE status = 'approved' AND approved_at <= ? AND approved_at + duration_hours * 3600000 > ? ORDER BY approved_at DESC LIMIT 60`)
    .bind(now, now)
    .all();
  // 2026-11-13: "media" = every picture/video of the story in order (old clients keep using media_key)
  // 2026-11-27 (owner): every offer story (also without a price) is in "Güncel indirimler" with its picture;
  // the admin can change or remove the offer (deal "none")
  return json({ stories: results.map(({ media_extra, overlay, deal, cats, ...r }) => {
    const list = catsOf({ ...r, cats, deal });
    const offer = offerOf({ ...r, deal }, list);
    return { ...r, link: safeLink(r.link), media: storyMediaList({ ...r, media_extra, overlay }), deal: offer, cats: offer && !list.includes("angebote") ? [...list, "angebote"].slice(0, 6) : list };
  }) });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const database = await db(env);
  if (!database) return noDb();

  const form = await request.formData();
  // Admin (story planner): no hourly limit, published directly at the planned time.
  // 2026-11-14 (owner): the admin may write (almost) without limit – title 300, text 10.000 characters, line breaks stay.
  const admin = await isAdmin(request, env);
  // 2026-11-21 (owner): trusted person ("Kiez26" …) – like the admin: no limits, several files, long text, online at once
  const vip = admin ? null : await vipFromRequest(database, request, form).catch(() => null);
  const big = admin || !!vip;
  // 2026-11-27 (owner): fixed writing rules for everybody (capital letters, spaces, commas, full stop) – no AI
  const headline = polishHeadline(cleanText(form.get("headline"), big ? BIG_HEADLINE : 120));
  // 2026-11-20 (owner): users may write 3x more (1500 instead of 500) and everybody reads the full text.
  const subtext = polishText(cleanLongText(form.get("subtext"), big ? BIG_TEXT : 1500));
  const kiez = cleanText(form.get("kiez"), 60);
  const kind = KINDS.includes(form.get("kind")) ? form.get("kind") : "news";
  // Name of the person who shares (needed for the weekly Kiez-Stars)
  const author = cleanText(form.get("author"), 40) || (vip ? cleanText(vip.name, 40) : "") || "Kiez Community";
  // 2026-11-22 (owner): clear swear words are refused at once, before anything slow (no AI, nothing saved)
  const swear = admin ? "" : swearHit(headline, subtext, author);
  if (swear) return json({ error: "content_blocked", word: swear, review: swearReview(swear) }, 422);
  let deal = storyDeal(form, cleanText); // 2026-11-14: optional offer (users, sponsors, admin)
  // 2026-11-14 (owner): folders – chosen folder + rules (price -> "angebote", Polizei/Sperrung -> "eil" …)
  const chosenCat = cleanText(form.get("category"), 20);
  // 2026-11-14 (owner): "automatic" -> the AI reads the story and picks the folders; word rules only as fallback
  // 2026-11-22 (owner): users do not wait for the AI any more (took up to 45 s) – word rules now, AI folders afterwards
  const catsLater = !admin && !chosenCat;
  const aiCats = chosenCat || catsLater ? [] : await aiStoryCats(env, headline, subtext, kiez).catch(() => []);
  const cats = aiCats.length
    ? [...aiCats, ...(deal ? ["angebote"] : []), ...(form.get("sponsor") === "1" ? ["sponsoren"] : [])].filter((k, i, a) => a.indexOf(k) === i).slice(0, 5)
    : storyCats({ chosen: chosenCat, kind: form.get("kind"), headline, subtext, deal, sponsor: form.get("sponsor") === "1" });
  if (!deal && cats.includes("angebote") && !cats.includes("wohnen") && !cats.includes("jobs")) deal = dealFromText(headline, subtext);
  const catsText = cats.join(",");
  const durationHours = USER_DURATIONS.includes(Number(form.get("durationHours"))) ? Number(form.get("durationHours")) : 24;
  if (!headline || !kiez) return json({ error: "missing_fields" }, 400);

  // (admin: see above)
  const ip = await ipHash(request, env);
  // 2026-11-13: real name or nickname required (not only emoji), see validAuthor
  if (!admin && !vip && !validAuthor(form.get("author"))) return json({ error: "author_required" }, 400);
  if (!big && (await rateLimited(database, "stories", ip))) return json({ error: "rate_limited" }, 429);
  // 2026-11-14: at most USER_DAILY_LIMIT stories per user (IP or device) in 24 hours
  const device = cleanDevice(form.get("device"));
  if (!big && (await dailyLimited(database, ip, device))) return json({ error: "daily_limit", limit: USER_DAILY_LIMIT }, 429);
  // (swear words: checked above, before the folders)

  const id = crypto.randomUUID();
  let mediaKey = "";
  let mediaType = "";
  let mediaBytes = null;
  let mediaHash = "";
  const file = form.get("file");
  // 2026-11-24: big file already in R2 (admin / trusted account, sent in parts) – taken as it is, no size limit
  const bigFirst = big && typeof file === "string" ? await bigRef(env, file, "stories/big/") : null;
  if (bigFirst) {
    mediaType = bigFirst.type.startsWith("video/") ? "video" : "image";
    mediaKey = bigFirst.key;
  } else if (file && typeof file !== "string" && file.size > 0) {
    const ext = MEDIA_TYPES[file.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    const isVideo = file.type.startsWith("video/");
    if (!big && file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) return json({ error: "file_too_large" }, 413);
    mediaType = isVideo ? "video" : "image";
    if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
    mediaKey = `stories/${id}.${ext}`;
    mediaBytes = await file.arrayBuffer();
    mediaHash = await sha256Hex(mediaBytes);
  }

  // 2026-11-13: the same picture/video or the same text cannot be uploaded twice (users only;
  // the admin planner may reuse material on purpose).
  const textHash = await sha256Hex(storyTextKey(headline, subtext));
  if (!big) { // 2026-11-21: trusted person like the admin (may reuse material)
    const since = Date.now() - DUPLICATE_WINDOW_MS;
    const dup = await database
      .prepare(`SELECT id FROM stories WHERE status != 'rejected' AND created_at > ? AND (text_hash = ? OR (? != '' AND media_hash = ?)) LIMIT 1`)
      .bind(since, textHash, mediaHash, mediaHash)
      .first();
    if (dup) return json({ error: "duplicate_story" }, 409);
  }
  if (mediaBytes) await env.BUCKET.put(mediaKey, mediaBytes, { httpMetadata: { contentType: file.type } });

  if (admin && form.get("planned") === "1") {
    const now = Date.now();
    const { start, hours } = plannedWindow(form, now);
    const adminKind = cleanText(form.get("kind"), 30) || "news";
    // further pictures/videos (admin only): every file after the first one, with an optional text per file
    const extra = [];
    const files = (await formFiles(env, form, "file", "stories/big/")).slice(1, BIG_MAX_FILES);
    for (let i = 0; i < files.length; i++) {
      const x = files[i];
      const video = x.type.startsWith("video/");
      let key = x.key || "";
      if (!key) {
        const ext = MEDIA_TYPES[x.type];
        if (!ext) continue; // unknown type: skipped, the story is still saved
        key = `stories/${id}-${i + 2}.${ext}`;
        await env.BUCKET.put(key, x.stream(), { httpMetadata: { contentType: x.type } });
      }
      const ov = video ? cleanOverlay(form.get(`overlay_${i + 2}`)) : null; // 2026-11-17: text on top of a video
      extra.push({ key, type: video ? "video" : "image", caption: cleanText(form.get(`caption_${i + 2}`), 300), ...(ov ? { overlay: ov } : {}) });
    }
    await database
      .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, approved_at, link, by_admin, media_hash, text_hash, media_extra, deal, cats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`)
      .bind(id, headline, subtext, kiez, adminKind, cleanText(form.get("author"), 40) || "My Kiez Berlin", mediaKey, mediaType, hours, ip, now, start, webLink(form.get("link")), mediaHash, textHash, JSON.stringify(extra), deal, catsText)
      .run();
    // 2026-11-17 (owner): text on top of the first video (pictures already carry the text inside the picture)
    const mainOverlay = mediaType === "video" ? cleanOverlay(form.get("overlay_1")) : null;
    if (mainOverlay) await database.prepare(`UPDATE stories SET overlay = ? WHERE id = ?`).bind(JSON.stringify(mainOverlay), id).run().catch(() => {});
    return json({ id, status: start > now ? "scheduled" : "approved", publishAt: start, durationHours: hours }, 201);
  }

  // 2026-11-14: AI check first (users only). Trusted device + AI "ok" -> online at once, otherwise the admin decides.
  // 2026-11-22 (owner): kinder check – only clear heavy cases are refused, light ones go to the admin
  // 2026-11-22 (owner, later): no AI wait any more – it was too slow. The AI runs afterwards (see below).
  const review = null;
  const check = "";
  // 2026-11-17 (owner): 18+, insults, hate, gore are never published – saved as "rejected" (admin can still see it)
  const blocked = !admin && String(check).startsWith("block:");
  // 2026-11-21: trusted person -> online at once when the AI does not block it (owner: the AI check stays)
  const direct = !admin && !blocked && (vip ? true : await isTrusted(database, device));
  const created = Date.now();
  await database
    .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, media_hash, text_hash, deal, device, ai_check, approved_at, cats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, headline, subtext, kiez, kind, author, mediaKey, mediaType, durationHours, blocked ? "rejected" : direct ? "approved" : "pending", ip, created, mediaHash, textHash, deal, device, check, direct ? created : 0, catsText)
    .run();
  if (blocked) return json({ error: "content_blocked", id, review }, 422);
  // 2026-11-22 (owner): AI folders in the background (the story already has the word-rule folders)
  if (catsLater && typeof waitUntil === "function") {
    waitUntil((async () => {
      const ai = await aiStoryCats(env, headline, subtext, kiez).catch(() => []);
      if (!ai.length) return;
      const sponsor = form.get("sponsor") === "1";
      const c2 = [...ai, ...(deal ? ["angebote"] : []), ...(sponsor ? ["sponsoren"] : [])].filter((k, i, a) => a.indexOf(k) === i).slice(0, 5);
      const d2 = !deal && c2.includes("angebote") && !c2.includes("wohnen") && !c2.includes("jobs") ? dealFromText(headline, subtext) : deal;
      await database.prepare(`UPDATE stories SET cats = ?, deal = ? WHERE id = ?`).bind(c2.join(","), d2 || "", id).run();
    })().catch(() => {}));
  }
  // 2026-11-22 (owner): AI review in the background – only a note for the admin; a story that went online at once
  // (trusted device) goes back to the admin when the AI is sure it is heavy. Trusted accounts (vip) are not checked.
  if (!admin && !vip && typeof waitUntil === "function") {
    const mime = file && typeof file !== "string" ? file.type : "";
    waitUntil((async () => {
      const r = await aiReview(env, headline, subtext, mediaBytes, mime).catch(() => null);
      const v = reviewVerdict(r);
      if (!v) return;
      await database.prepare(`UPDATE stories SET ai_check = ? WHERE id = ?`).bind(v, id).run();
      if (direct && v.startsWith("block:")) {
        await database.prepare(`UPDATE stories SET status = 'pending', approved_at = 0 WHERE id = ? AND status = 'approved'`).bind(id).run();
      }
    })().catch(() => {}));
  }
  // 2026-11-21: trusted person – further pictures/videos (like the admin, max VIP_MAX_FILES per story)
  if (vip) {
    const extra = [];
    // 2026-11-24 (owner): no file limit any more (was 10), big files from /api/big-upload
    const more = (await formFiles(env, form, "file", "stories/big/")).slice(1, BIG_MAX_FILES);
    for (let i = 0; i < more.length; i++) {
      const x = more[i];
      if (!env.BUCKET) continue;
      const video = x.type.startsWith("video/");
      let key = x.key || "";
      if (!key) {
        const ext = MEDIA_TYPES[x.type];
        if (!ext) continue;
        key = `stories/${id}-${i + 2}.${ext}`;
        await env.BUCKET.put(key, x.stream(), { httpMetadata: { contentType: x.type } });
      }
      extra.push({ key, type: video ? "video" : "image", caption: cleanText(form.get(`caption_${i + 2}`), 300) });
    }
    if (extra.length) await database.prepare(`UPDATE stories SET media_extra = ? WHERE id = ?`).bind(JSON.stringify(extra), id).run();
  }
  return json({ id, status: direct ? "approved" : "pending", ...(vip ? { vip: true } : {}) }, 201);
}
