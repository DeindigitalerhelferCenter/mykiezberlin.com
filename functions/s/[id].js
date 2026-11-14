// 2026-11-14 (owner): share link of a sponsor – https://mykiezberlin.com/s/<sponsor-id>
// WhatsApp, Telegram, Facebook … read the Open-Graph tags (name, text, banner picture) for the preview.
// A person who taps the link is sent straight to the sponsor: the web page opens with ?sponsor=<id>
// (contact sheet opens by itself). With the Android app installed, the app opens the link (App Links).
import { db } from "../_lib/util.js";
import { parseExtra } from "../_lib/plans.js";

const SITE = "https://mykiezberlin.com";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function onRequestGet({ params, env }) {
  const id = String(params.id || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
  const target = id ? `/?sponsor=${encodeURIComponent(id)}` : "/";
  let ad = null;
  try {
    const database = id ? await db(env) : null;
    if (database) ad = await database.prepare(`SELECT id, name, image, headline_de, headline_tr, extra, active FROM ads WHERE id = ?`).bind(id).first();
  } catch (e) {
    ad = null;
  }
  if (!ad || !ad.active) return Response.redirect(SITE + "/", 302);
  const extra = parseExtra(ad.extra);
  let pic = /^https?:\/\//.test(ad.image || "") ? ad.image : SITE + (ad.image || extra.logo || "/assets/images/mykiez_logo.png");
  // WhatsApp shows JPG previews more reliably than WebP: /assets/sponsors/og/<name>.jpg, if that copy exists
  const m = String(ad.image || "").match(/^\/assets\/sponsors\/([\w-]+)\.webp$/);
  if (m && env.ASSETS) {
    try {
      const r = await env.ASSETS.fetch(new Request(`${SITE}/assets/sponsors/og/${m[1]}.jpg`, { method: "HEAD" }));
      if (r.ok && /image\/jpeg/.test(r.headers.get("content-type") || "")) pic = `${SITE}/assets/sponsors/og/${m[1]}.jpg`;
    } catch (e) {
      // keep the WebP banner
    }
  }
  const title = `${ad.name} · My Kiez Berlin`;
  const text = [ad.headline_de, ad.headline_tr].filter(Boolean).join(" · ");
  const url = `${SITE}/s/${id}`;
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
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
</head><body style="font-family:system-ui,sans-serif;text-align:center;padding:40px 16px">
<p><a href="${esc(target)}">${esc(ad.name)} – My Kiez Berlin</a></p>
<script>location.replace(${JSON.stringify(target)});</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}
