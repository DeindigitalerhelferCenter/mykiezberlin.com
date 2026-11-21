// 2026-11-22 (owner): news story picture – ALL text is inside the picture (title TR + DE, description, source, link).
// Drawn as SVG and turned into PNG with resvg (WASM) + Noto Sans (OFL, subset Latin + Turkish, see render/OFL.txt).
// Layout: round glowing logo top left ("like a rising sun"), no lines, "mykiezberlin.com" at the very bottom.
// The same picture is shown everywhere (old and new app versions, web, Telegram).
import { Resvg, initWasm } from "./render/resvg.mjs";
import wasmModule from "./render/resvg.wasm";
import fontBold from "./render/font-bold.bin";
import fontRegular from "./render/font-regular.bin";

export const W = 1080;
export const H = 1920;
let ready = null;
function init() {
  if (!ready) ready = initWasm(wasmModule).catch((e) => { ready = null; throw e; });
  return ready;
}

// 6 colour themes (background top, background bottom, accent)
export const THEMES = [
  ["#0F172A", "#1E3A8A", "#FFC107"], ["#7F000A", "#E30A17", "#FFE082"], ["#064E3B", "#10B981", "#FFC107"],
  ["#310A65", "#7C3AED", "#FFC107"], ["#000000", "#3A2C00", "#FFC107"], ["#082F49", "#0EA5E9", "#FFFFFF"],
];

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Rough text width: Noto Sans ~0.56 em (bold) / 0.52 em (regular) per character
function wrap(text, size, maxW, bold) {
  const per = size * (bold ? 0.53 : 0.49);
  const max = Math.max(8, Math.floor(maxW / per));
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let cur = "";
  for (let w of words) {
    while (w.length > max) { if (cur) { lines.push(cur); cur = ""; } lines.push(w.slice(0, max)); w = w.slice(max); }
    const next = cur ? cur + " " + w : w;
    if (next.length > max) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function block(lines, x, y, size, lineH, fill, bold) {
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lineH}" font-family="Noto Sans" font-weight="${bold ? 700 : 400}" font-size="${size}" fill="${fill}">${esc(l)}</text>`).join("");
}

/**
 * parts: { title1, title2, text1, text2, sourceLabel, source, url, urgent }
 * opts:  { theme (0..5), background: {bytes, mime} (own picture), logo: {bytes, mime} }
 */
export async function renderNewsImage(parts, opts = {}) {
  await init();
  const th = THEMES[((Number(opts.theme) || 0) % THEMES.length + THEMES.length) % THEMES.length];
  const [c1, c2, acc] = th;
  const pad = 80;
  const maxW = W - pad * 2 - 40;
  const b64 = (o) => `data:${o.mime};base64,${toBase64(o.bytes)}`;

  // fit the text: start big, shrink until it fits between y=430 and y=1760
  let k = 1.3; // start big, shrink until it fits
  let body = "";
  let height = 0;
  for (let step = 0; step < 8; step++) {
    const s1 = Math.round(66 * k), s2 = Math.round(52 * k), s3 = Math.round(38 * k), s4 = Math.round(34 * k), s5 = Math.round(32 * k), s6 = Math.round(26 * k);
    const t1 = wrap(parts.title1, s1, maxW, true), t2 = parts.title2 ? wrap(parts.title2, s2, maxW, true) : [];
    const d1 = parts.text1 ? wrap(parts.text1, s3, maxW, false) : [], d2 = parts.text2 ? wrap(parts.text2, s4, maxW, false) : [];
    const src = wrap(`${parts.sourceLabel || "Kaynak / Quelle"}: ${parts.source || ""}`, s5, maxW, true);
    const link = wrap(String(parts.url || "").replace(/^https?:\/\//, ""), s6, maxW, false).slice(0, 3);
    let y = 0;
    let out = "";
    const add = (lines, size, lh, fill, bold, gap) => { if (!lines.length) return; out += block(lines, pad + 20, y + size, size, lh, fill, bold); y += lines.length * lh + gap; };
    add(t1, s1, Math.round(s1 * 1.18), "#FFFFFF", true, Math.round(18 * k));
    add(t2, s2, Math.round(s2 * 1.2), acc, true, Math.round(34 * k));
    add(d1, s3, Math.round(s3 * 1.38), "#FFFFFF", false, Math.round(26 * k));
    add(d2, s4, Math.round(s4 * 1.38), "#E2E8F0", false, Math.round(34 * k));
    add(src, s5, Math.round(s5 * 1.3), acc, true, Math.round(10 * k));
    add(link, s6, Math.round(s6 * 1.3), "#93C5FD", false, 0);
    body = out;
    height = y;
    if (y <= 1240) break;
    k *= 0.9;
  }
  const top = 450;
  const boxH = height + 60;

  const bg = opts.background
    ? `<image href="${b64(opts.background)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/><rect width="${W}" height="${H}" fill="#000" opacity="0.45"/>`
    : `<rect width="${W}" height="${H}" fill="url(#g)"/>` +
      `<circle cx="930" cy="560" r="420" fill="url(#soft)"/><circle cx="120" cy="1520" r="520" fill="url(#soft)"/><circle cx="1000" cy="1780" r="300" fill="url(#soft)"/>`;
  // rising sun behind the logo: soft glow + rays
  let rays = "";
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x1 = 190 + Math.cos(a) * 150, y1 = 190 + Math.sin(a) * 150, x2 = 190 + Math.cos(a - 0.09) * 330, y2 = 190 + Math.sin(a - 0.09) * 330, x3 = 190 + Math.cos(a + 0.09) * 330, y3 = 190 + Math.sin(a + 0.09) * 330;
    rays += `<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}" fill="${acc}" opacity="0.18"/>`;
  }
  const logo = opts.logo
    ? `<clipPath id="lc"><circle cx="190" cy="190" r="112"/></clipPath><circle cx="190" cy="190" r="122" fill="#FFFFFF"/><image href="${b64(opts.logo)}" x="106" y="106" width="168" height="168" clip-path="url(#lc)" preserveAspectRatio="xMidYMid meet"/>`
    : `<circle cx="190" cy="190" r="122" fill="#FFFFFF"/><text x="190" y="205" text-anchor="middle" font-family="Noto Sans" font-weight="700" font-size="40" fill="#0F172A">My Kiez</text>`;
  const badge = parts.urgent
    ? `<rect x="360" y="150" width="330" height="76" rx="38" fill="#E30A17"/><text x="525" y="201" text-anchor="middle" font-family="Noto Sans" font-weight="700" font-size="36" fill="#FFFFFF">ACİL · EIL</text>`
    : `<text x="360" y="178" font-family="Noto Sans" font-weight="700" font-size="40" fill="#FFFFFF">My Kiez Berlin</text><text x="360" y="226" font-family="Noto Sans" font-weight="400" font-size="30" fill="${acc}">Haber · Nachrichten</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
    `<radialGradient id="soft"><stop offset="0" stop-color="${acc}" stop-opacity="0.22"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="sun"><stop offset="0" stop-color="${acc}" stop-opacity="0.85"/><stop offset="0.45" stop-color="${acc}" stop-opacity="0.35"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient></defs>` +
    bg +
    `<circle cx="190" cy="190" r="340" fill="url(#sun)"/>` + rays + logo + badge +
    `<rect x="${pad - 10}" y="${top - 30}" width="${W - (pad - 10) * 2}" height="${boxH}" rx="36" fill="#000000" opacity="0.38"/>` +
    `<g transform="translate(0 ${top})">${body}</g>` +
    `<text x="${W / 2}" y="${H - 48}" text-anchor="middle" font-family="Noto Sans" font-weight="700" font-size="40" fill="#FFFFFF" opacity="0.92">mykiezberlin.com</text>` +
    `</svg>`;

  const r = new Resvg(svg, {
    fitTo: { mode: "original" },
    font: { fontBuffers: [new Uint8Array(fontBold), new Uint8Array(fontRegular)], defaultFontFamily: "Noto Sans", loadSystemFonts: false },
  });
  const png = r.render().asPng();
  return png;
}

function toBase64(buffer) {
  let binary = "";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
