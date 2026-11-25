// 2026-11-25 (owner): monthly report page of one sponsor – https://mykiezberlin.com/bericht/<secret token>
// German + Turkish, numbers per day, "Als PDF speichern" (browser print). Only saved (finished) months have a link.
// The page is not indexed by search engines; without the exact token nothing is shown.
import { db } from "../_lib/util.js";
import { monthName } from "../_lib/sponsor-report.js";

// 2026-11-25: the package goal is shown in the report (owner chose option a = free month if not reached).
// Set to false to hide goal + percent in every report.
const SHOW_GOAL = true;

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = (n) => Number(n || 0).toLocaleString("de-DE");
const fd = (ymd) => String(ymd || "").split("-").reverse().join(".");

function chart(r) {
  // every day of the period, also days without views
  const map = new Map((r.days || []).map((d) => [d.day, d]));
  const list = [];
  for (let t = Date.parse(r.from + "T00:00:00Z"); t <= Date.parse(r.to + "T00:00:00Z"); t += 86400000) {
    const k = new Date(t).toISOString().slice(0, 10);
    list.push(map.get(k) || { day: k, imp: 0, clk: 0 });
  }
  const max = Math.max(1, ...list.map((d) => d.imp));
  const w = 640, h = 180, gap = 2, bw = Math.max(3, (w - gap * list.length) / Math.max(1, list.length));
  const bars = list.map((d, i) => {
    const bh = Math.round((d.imp / max) * (h - 24));
    return `<rect x="${(i * (bw + gap)).toFixed(1)}" y="${h - 18 - bh}" width="${bw.toFixed(1)}" height="${bh}" rx="2" fill="#d62828"><title>${fd(d.day)}: ${d.imp}</title></rect>`;
  }).join("");
  const labels = list.map((d, i) => (i === 0 || i === list.length - 1 || i % 7 === 0) ? `<text x="${(i * (bw + gap) + bw / 2).toFixed(1)}" y="${h - 4}" font-size="10" text-anchor="middle" fill="#57606a">${fd(d.day).slice(0, 5)}</text>` : "").join("");
  return { svg: `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Gesehen pro Tag · günlük görüntülenme">${bars}${labels}</svg>`, list };
}

export async function onRequestGet({ params, env }) {
  const token = String(params.token || "").replace(/[^a-f0-9]/g, "").slice(0, 64);
  let row = null;
  try {
    const database = token.length >= 20 ? await db(env) : null;
    if (database) row = await database.prepare(`SELECT * FROM sponsor_reports WHERE token = ?`).bind(token).first();
  } catch (e) {
    row = null;
  }
  if (!row) return new Response("Bericht nicht gefunden · Rapor bulunamadı", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" } });
  let r = {};
  try { r = JSON.parse(row.data); } catch (e) { r = {}; }
  const { svg, list } = chart(r);
  const goalHtml = SHOW_GOAL ? `<div class="tile"><small>Monatsziel · Aylık hedef</small><b>${nf(r.goal)}</b><span>${r.pct || 0} % erreicht · ulaşıldı</span>${r.goal !== r.goal_full ? `<span>anteilig ${fd(r.from)}–${fd(r.to)} · orantılı (Paket ${nf(r.goal_full)})</span>` : ""}</div>` : "";
  const compHtml = row.comp ? `<p class="gift">🎁 Ausgleich: 1 zusätzlicher Gratis-Monat · Telafi: 1 ay ek ücretsiz</p>` : "";
  const rows = list.filter((d) => d.imp || d.clk).map((d) => `<tr><td>${fd(d.day)}</td><td>${nf(d.imp)}</td><td>${nf(d.clk)}</td></tr>`).join("") || `<tr><td colspan="3">–</td></tr>`;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Monatsbericht ${esc(r.name)} · ${esc(monthName(r.month, "de"))}</title>
<style>
:root{--bg:#f6f8fa;--card:#fff;--ink:#1f2328;--mute:#57606a;--red:#d62828;--line:#d0d7de}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:20px 16px 40px}
header{display:flex;align-items:center;gap:12px;margin-bottom:14px}header img{width:48px;height:48px;border-radius:12px}
h1{font-size:20px;margin:0}h1 small{display:block;font-size:13px;color:var(--mute);font-weight:500}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.tile{background:var(--bg);border-radius:12px;padding:12px;display:flex;flex-direction:column}
.tile small{color:var(--mute)}.tile b{font-size:26px}.tile span{font-size:12px;color:var(--mute)}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:6px 4px;border-bottom:1px solid var(--line);text-align:right}td:first-child,th:first-child{text-align:left}
.gift{background:#fff4d6;border-radius:10px;padding:10px 12px;font-weight:700}
.note{font-size:12.5px;color:var(--mute)}button{background:var(--red);color:#fff;border:0;border-radius:10px;padding:10px 16px;font-weight:700;font-size:14px;cursor:pointer}
@media print{button{display:none}body{background:#fff}.card{break-inside:avoid}}
</style></head><body><main>
<header><img src="/assets/images/mykiez_logo.png" alt=""><h1>My Kiez Berlin · Monatsbericht / Aylık rapor<small>${esc(monthName(r.month, "de"))} · ${esc(monthName(r.month, "tr"))}</small></h1></header>
<div class="card"><h2 style="margin:0 0 4px;font-size:18px">${esc(r.name)}</h2>
<div class="note">${esc(r.plan_name)} · ${fd(r.from)} – ${fd(r.to)}</div></div>
<div class="card"><div class="tiles">
<div class="tile"><small>Wirklich gesehen · Gerçekten görüldü</small><b>${nf(r.views)}</b></div>
<div class="tile"><small>Klicks · Tıklama</small><b>${nf(r.clicks)}</b><span>${r.ctr || 0} % Klickrate · tıklama oranı</span></div>
${goalHtml}
<div class="tile"><small>Besucher My Kiez · Ziyaretçi</small><b>${nf(r.site && r.site.visitors)}</b><span>${nf(r.site && r.site.views)} Aufrufe · görüntüleme</span></div>
</div>${compHtml}</div>
<div class="card"><b>Gesehen pro Tag · Günlük görüntülenme</b>${svg}</div>
<div class="card"><table><thead><tr><th>Tag · Gün</th><th>Gesehen · Görüldü</th><th>Klicks · Tık</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="card note">
🇩🇪 „Gesehen“ zählt nur, wenn mindestens die Hälfte Ihrer Karte 1 Sekunde auf dem Bildschirm war (Web + App). Wir zählen anonym, ohne Cookies; Admin, Tests und Bots zählen nicht; ein Gerät zählt höchstens 3× pro Tag.${r.from === r.honest_since ? " Gezählt ab " + fd(r.honest_since) + " (seitdem mit dieser ehrlichen Methode)." : ""}<br>
🇹🇷 „Görüldü“ sadece kartınızın en az yarısı 1 saniye ekranda kaldığında sayılır (web + uygulama). Anonim, çerezsiz sayıyoruz; admin, testler ve botlar sayılmaz; bir cihaz günde en fazla 3 kez sayılır.${r.from === r.honest_since ? " " + fd(r.honest_since) + " tarihinden itibaren sayıldı (bu dürüst yöntemle)." : ""}<br>
Erstellt · Oluşturuldu: ${new Date(row.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} · support@mykiezberlin.com</div>
<p style="text-align:center"><button type="button" onclick="window.print()">📄 Als PDF speichern · PDF olarak kaydet</button></p>
</main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
