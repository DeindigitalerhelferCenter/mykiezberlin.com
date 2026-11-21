// 2026-11-22: does drawing the news picture work on this server (CPU limit)? Draws ONE sample picture the first
// time and keeps it in R2 (stories/news-render-check.png); later calls only report the stored result.
// GET /api/news-render-check -> { ok, ms, bytes, url } | { ok: false, error }
import { db, json, noDb } from "../_lib/util.js";
import { renderNewsImage } from "../_lib/news-image.js";

const KEY = "stories/news-render-check.png";

export async function onRequestGet({ request, env }) {
  const database = await db(env);
  if (!database || !env.BUCKET) return noDb();
  await database.prepare(`CREATE TABLE IF NOT EXISTS news_state (id TEXT PRIMARY KEY, value INTEGER)`).run();
  const done = await database.prepare(`SELECT value FROM news_state WHERE id = 'render_check'`).first();
  if (done) return json({ ok: done.value >= 0, ms: done.value, url: `/media/${KEY}`, cached: true });
  await database.prepare(`INSERT OR IGNORE INTO news_state (id, value) VALUES ('render_check', -1)`).run();
  const origin = new URL(request.url).origin;
  try {
    const logoRes = await fetch(`${origin}/assets/images/mykiez_logo.png`);
    const logo = logoRes.ok ? { bytes: new Uint8Array(await logoRes.arrayBuffer()), mime: "image/png" } : null;
    const t0 = Date.now();
    const png = await renderNewsImage({ title1: "Test: Haber resmi", title2: "Test: Nachrichtenbild", text1: "Bu resim sunucuda çizildi.", text2: "Dieses Bild wurde auf dem Server gezeichnet.", sourceLabel: "Kaynak / Quelle", source: "My Kiez Berlin", url: "https://mykiezberlin.com" }, { theme: 0, logo });
    const ms = Date.now() - t0;
    await env.BUCKET.put(KEY, png, { httpMetadata: { contentType: "image/png" } });
    await database.prepare(`UPDATE news_state SET value = ? WHERE id = 'render_check'`).bind(ms).run();
    return json({ ok: true, ms, bytes: png.length, url: `/media/${KEY}` });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e).slice(0, 200) }, 500);
  }
}
