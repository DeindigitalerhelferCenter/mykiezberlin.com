// 2026-11-22 (owner): check a story BEFORE sending – the form shows the problem words in red with a better wording.
// POST multipart: headline, subtext, file (optional picture) -> { verdict: "ok"|"light"|"heavy", review }
// verdict "heavy" = would be refused; "light" = goes to the admin; "ok" = fine. Max 30 checks per hour per user.
import { cleanLongText, cleanText, db, ipHash, json, noDb } from "../_lib/util.js";
import { aiReview, reviewVerdict } from "../_lib/story-guard.js";

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  await database.prepare(`CREATE TABLE IF NOT EXISTS story_checks (ip TEXT, created_at INTEGER)`).run();
  const ip = await ipHash(request, env);
  const n = await database.prepare(`SELECT COUNT(*) AS n FROM story_checks WHERE ip = ? AND created_at > ?`).bind(ip, Date.now() - 3600000).first();
  if ((n?.n || 0) >= 30) return json({ verdict: "ok", skipped: "rate" }); // never block the form because of the check itself
  await database.prepare(`INSERT INTO story_checks (ip, created_at) VALUES (?, ?)`).bind(ip, Date.now()).run();
  await database.prepare(`DELETE FROM story_checks WHERE created_at < ?`).bind(Date.now() - 86400000).run();
  const form = await request.formData();
  const headline = cleanText(form.get("headline"), 300);
  const subtext = cleanLongText(form.get("subtext"), 10000);
  const file = form.get("file");
  let bytes = null;
  let mime = "";
  if (file && typeof file !== "string" && file.size > 0 && file.size <= 3 * 1024 * 1024 && /^image\//.test(file.type)) {
    bytes = await file.arrayBuffer();
    mime = file.type;
  }
  const review = await aiReview(env, headline, subtext, bytes, mime).catch(() => null);
  const v = reviewVerdict(review);
  return json({ verdict: v.startsWith("block:") ? "heavy" : v.startsWith("flag:") ? "light" : "ok", review }, 200, { "cache-control": "no-store" });
}
