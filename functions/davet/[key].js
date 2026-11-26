// 2026-11-26 (owner "UYGULA"): permanent invite link https://mykiezberlin.com/davet/<key>
// WhatsApp / Telegram / Facebook read the Open-Graph tags -> the card picture is shown in the chat.
// A person who taps it goes straight to the WhatsApp group / channel, the app download (Android) or /werben.
// Clicks are counted per day (table invite_clicks) – no cookies, nothing personal.
import { db } from "../_lib/util.js";
import { inviteCard, SITE } from "../_lib/invite-cards.js";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BOT = /bot|crawl|spider|facebookexternalhit|whatsapp|telegram|preview|slack|discord|twitter/i;

export async function onRequestGet({ params, request, env, waitUntil }) {
  const key = String(params.key || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
  const c = inviteCard(key);
  if (!c) return Response.redirect(`${SITE}/davet/`, 302);
  const ua = request.headers.get("user-agent") || "";
  // the app download only works on Android – iPhone / computer get the web page
  const target = c.kind === "app" && !/android/i.test(ua) ? c.targetOther : c.target;
  if (!BOT.test(ua)) {
    const day = new Date().toISOString().slice(0, 10);
    const count = (async () => {
      const database = await db(env);
      if (!database) return;
      await database.prepare(`CREATE TABLE IF NOT EXISTS invite_clicks (day TEXT NOT NULL, key TEXT NOT NULL, n INTEGER DEFAULT 0, PRIMARY KEY (day, key))`).run();
      await database.prepare(`INSERT INTO invite_clicks (day, key, n) VALUES (?, ?, 1) ON CONFLICT(day, key) DO UPDATE SET n = n + 1`).bind(day, key).run();
    })().catch(() => {});
    if (waitUntil) waitUntil(count);
  }
  const title = `${c.title_de} · ${c.title_tr}`;
  const text = `${c.sub_de} · ${c.sub_tr}`;
  const pic = `${SITE}/assets/davet/${c.key}-wide.jpg`;
  const url = `${SITE}/davet/${c.key}`;
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} – My Kiez Berlin</title>
<meta name="description" content="${esc(text)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="My Kiez Berlin">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(text)}">
<meta property="og:image" content="${esc(pic)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${esc(url)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
</head><body style="font-family:system-ui,sans-serif;text-align:center;padding:40px 16px;background:#0d1117;color:#fff">
<p style="font-size:18px;font-weight:700">${esc(c.title_de)}<br>${esc(c.title_tr)}</p>
<p><a style="color:#25D366;font-weight:800;font-size:18px" href="${esc(target)}">${esc(c.cta_de)} · ${esc(c.cta_tr)} →</a></p>
<script>location.replace(${JSON.stringify(target)});</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
