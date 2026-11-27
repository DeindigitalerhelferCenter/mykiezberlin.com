// 2026-11-26 (owner "UYGULA"): permanent invite link https://mykiezberlin.com/davet/<key>
// WhatsApp / Telegram / Facebook read the Open-Graph tags -> the card picture is shown in the chat.
// A person who taps it goes straight to the WhatsApp group / channel, the app download (Android) or /werben.
// Clicks are counted per day (table invite_clicks) – no cookies, nothing personal.
import { db } from "../_lib/util.js";
import { inviteCard, KIEZ_GROUP_KEYS, kiezGroupsOn, SITE, welcomeOf } from "../_lib/invite-cards.js";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BOT = /bot|crawl|spider|facebookexternalhit|whatsapp|telegram|preview|slack|discord|twitter/i;

export async function onRequestGet({ params, request, env, waitUntil }) {
  const key = String(params.key || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
  let c = inviteCard(key);
  if (!c) return Response.redirect(`${SITE}/davet/`, 302);
  // 2026-11-27 (owner "UYGULA grup 3"): Kiez groups not promoted now -> old links lead to "Ganz Berlin"
  if (KIEZ_GROUP_KEYS.includes(c.key)) {
    const database = await db(env).catch(() => null);
    if (!database || !(await kiezGroupsOn(database))) c = inviteCard("berlin");
  }
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
<meta http-equiv="refresh" content="8;url=${esc(target)}">
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:radial-gradient(800px 600px at 50% 0%,#1b2b22,#0d1117);color:#fff;padding:24px 18px;text-align:center}
.w{max-width:460px;width:100%}.w img.logo{width:84px;height:84px;border-radius:20px;background:#fff;padding:6px}
h1{font-size:24px;margin:14px 0 4px}h2{font-size:19px;margin:0 0 14px;color:#ffd166}
p{margin:8px 0;line-height:1.45;font-size:15.5px;color:#e6edf3}.hint{font-weight:800;color:#fff;background:#21262d;border-radius:14px;padding:12px;margin:14px 0}
a.go{display:block;margin-top:16px;padding:16px;border-radius:16px;background:${c.kind === "app" ? "#1f6feb" : c.kind === "business" ? "#d62828" : "#25D366"};color:${c.kind === "app" || c.kind === "business" ? "#fff" : "#05290f"};font-weight:900;font-size:19px;text-decoration:none}
.bar{height:6px;border-radius:6px;background:#30363d;overflow:hidden;margin-top:16px}.bar i{display:block;height:6px;width:0;background:#25D366;animation:f 3s linear forwards}@keyframes f{to{width:100%}}</style>
</head><body>
<div class="w" id="w">
<img class="logo" src="/assets/images/mykiez_logo.png" alt="My Kiez Berlin">
<h1>${esc(welcomeOf(c).title_tr)}</h1><h2>${esc(welcomeOf(c).title_de)}</h2>
<p>🇹🇷 ${esc(welcomeOf(c).line_tr)}</p><p>🇩🇪 ${esc(welcomeOf(c).line_de)}</p>
<p class="hint">👉 ${esc(welcomeOf(c).hint_tr)}<br>👉 ${esc(welcomeOf(c).hint_de)}</p>
<a class="go" href="${esc(target)}">${esc(c.cta_tr)} · ${esc(c.cta_de)} →</a>
<div class="bar"><i></i></div>
</div>
<script>
// 2026-11-26 (owner "UYGULA 4"): the welcome is shown ONCE per card on this phone, then the link goes straight on
(function () {
  var T = ${JSON.stringify(target)}, K = "mk_welcome_" + ${JSON.stringify(c.key)}, seen = false;
  try { seen = localStorage.getItem(K) === "1"; localStorage.setItem(K, "1"); } catch (e) {}
  if (seen) { document.getElementById("w").style.visibility = "hidden"; location.replace(T); return; }
  setTimeout(function () { location.href = T; }, 3200);
})();
</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
