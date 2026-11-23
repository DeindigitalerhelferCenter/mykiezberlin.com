// 2026-11-22 (owner): news story picture – ALL text is inside the picture (title TR + DE, description, source, link).
// Drawn as SVG and turned into PNG with resvg (WASM) + Noto Sans (OFL, subset Latin + Turkish, see render/OFL.txt).
// Layout: round glowing logo top left ("like a rising sun"), no lines, "mykiezberlin.com" at the very bottom.
// The same picture is shown everywhere (old and new app versions, web, Telegram).
import { Resvg, initWasm } from "./render/resvg.mjs";
import wasmModule from "./render/resvg.wasm";
import fontBold from "./render/font-bold.bin";
import fontRegular from "./render/font-regular.bin";
import { BOLD_CHARS, BOLD_W, REGULAR_CHARS, REGULAR_W } from "./render/widths.js";

// 2026-11-22 (owner): titles ran out of the box -> exact widths from the font, titles max 3 lines,
// long words are broken (at "-" first), everything shrinks until it fits.
const WB = new Map([...BOLD_CHARS].map((c, i) => [c, BOLD_W[i]]));
const WR = new Map([...REGULAR_CHARS].map((c, i) => [c, REGULAR_W[i]]));
function textW(s, size, bold) {
  const m = bold ? WB : WR;
  let t = 0;
  for (const c of String(s)) t += m.has(c) ? m.get(c) : 700; // unknown sign (emoji …): wide
  return (t / 1000) * size;
}
/** Splits one too long word into parts that fit (breaks after "-" first, else with a "-" at the end). */
function splitWord(w, size, maxW, bold) {
  const out = [];
  let rest = w;
  while (textW(rest, size, bold) > maxW) {
    let cut = 0;
    for (let i = 1; i < rest.length; i++) { if (textW(rest.slice(0, i) + "-", size, bold) > maxW) break; cut = i; }
    if (cut < 1) cut = 1;
    const dash = rest.slice(0, cut).lastIndexOf("-");
    if (dash >= 2) { out.push(rest.slice(0, dash + 1)); rest = rest.slice(dash + 1); continue; }
    out.push(rest.slice(0, cut) + "-");
    rest = rest.slice(cut);
  }
  if (rest) out.push(rest);
  return out;
}

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
  // 2026-11-22: exact width (see textW); the old guess below is kept for reference
  if (WB.size) return wrapExact(text, size, maxW, bold);
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

function wrapExact(text, size, maxW, bold) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const pieces = textW(word, size, bold) > maxW ? splitWord(word, size, maxW, bold) : [word];
    for (const w of pieces) {
      const next = cur ? cur + " " + w : w;
      if (cur && textW(next, size, bold) > maxW) { lines.push(cur); cur = w; } else cur = next;
    }
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
  // 2026-11-23 (owner "UYGULA 1-7"): own background -> clean layout (no box, no logo, no site name; see renderNewsClean)
  // 2026-11-23 evening (owner "UYGULA 3-4"): TR on top, DE below, spread over the picture (renderNewsSpread); renderNewsClean kept
  if (opts.background && opts.clean !== false) return opts.packed ? renderNewsClean(parts, opts) : renderNewsSpread(parts, opts);
  const th = THEMES[((Number(opts.theme) || 0) % THEMES.length + THEMES.length) % THEMES.length];
  const [c1, c2, acc] = th;
  const pad = 80;
  const maxW = W - pad * 2 - 60; // 2026-11-22: a bit more room to the box edge
  const b64 = (o) => `data:${o.mime};base64,${toBase64(o.bytes)}`;

  // 2026-11-22 (owner: "metinler çok küçük, sayfanın yarısı boş"): the text now FILLS the page – the biggest size that
  // still fits (binary search), titles grow less than the texts, the box sits in the middle of the free area.
  const AREA = 1300; // text height that fits between the logo row and "mykiezberlin.com"
  const layout = (k, cutOver) => {
    const kt = Math.min(k, (parts.text1 || parts.text2) ? 1.5 : 2.1); // titles: max 1.5x with texts (else 4+ lines), 2.1x when only titles
    const s1 = Math.round(66 * kt), s2 = Math.round(52 * kt), s3 = Math.round(38 * k), s4 = Math.round(36 * k), s5 = Math.round(32 * Math.min(k, 1.3)), s6 = Math.round(26 * Math.min(k, 1.2));
    const t1 = wrap(parts.title1, s1, maxW, true), t2 = parts.title2 ? wrap(parts.title2, s2, maxW, true) : [];
    let d1 = parts.text1 ? wrap(parts.text1, s3, maxW, false) : [], d2 = parts.text2 ? wrap(parts.text2, s4, maxW, false) : [];
    const src = wrap(`${parts.sourceLabel || "Kaynak / Quelle"}: ${parts.source || ""}`, s5, maxW, true);
    const link = wrap(String(parts.url || "").replace(/^https?:\/\//, ""), s6, maxW, false).slice(0, 2);
    const draw = () => {
      let y = 0;
      let out = "";
      const add = (lines, size, lh, fill, bold, gap) => { if (!lines.length) return; out += block(lines, pad + 20, y + size, size, lh, fill, bold); y += lines.length * lh + gap; };
      add(t1, s1, Math.round(s1 * 1.18), "#FFFFFF", true, Math.round(22 * k));
      add(t2, s2, Math.round(s2 * 1.2), acc, true, Math.round(38 * k));
      add(d1, s3, Math.round(s3 * 1.36), "#FFFFFF", false, Math.round(30 * k));
      add(d2, s4, Math.round(s4 * 1.36), "#E2E8F0", false, Math.round(36 * k));
      add(src, s5, Math.round(s5 * 1.3), acc, true, Math.round(10 * k));
      add(link, s6, Math.round(s6 * 1.3), "#93C5FD", false, 0);
      return { out, y };
    };
    let r = draw();
    if (cutOver && r.y > AREA && (d1.length || d2.length)) {
      // still too long at the smallest size: shorten the descriptions with "…" (never out of the box)
      const over = Math.ceil((r.y - AREA) / Math.round(s4 * 1.36));
      const cut = (arr, n) => { const a = arr.slice(0, Math.max(1, arr.length - n)); a[a.length - 1] = a[a.length - 1].replace(/\s*\S*$/, "") + " …"; return a; };
      const fromD2 = Math.min(over, Math.max(0, d2.length - 1));
      if (fromD2) d2 = cut(d2, fromD2);
      if (over - fromD2 > 0 && d1.length > 1) d1 = cut(d1, over - fromD2);
      r = draw();
    }
    const maxT = (parts.text1 || parts.text2) ? 3 : 5; // 2026-11-22: only titles -> they may use more lines
    return { ...r, ok: r.y <= AREA && t1.length <= maxT && t2.length <= maxT };
  };
  const K_MIN = 0.55, K_MAX = 2.3; // 2.3 = description ~87 px on a 1080 px wide picture
  let best = null;
  let lo = K_MIN, hi = K_MAX;
  const top0 = layout(K_MAX, false);
  if (top0.ok) best = top0;
  else {
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      const r = layout(mid, false);
      if (r.ok) { best = r; lo = mid; } else hi = mid;
    }
  }
  if (!best) best = layout(K_MIN, true);
  const body = best.out;
  const height = best.y;
  const top = 450 + Math.max(0, Math.round((AREA - height) / 2)); // 2026-11-22: box in the middle of the free area
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

// ---- 2026-11-23 (owner "UYGULA 1-7"): clean layout on the owner's own backgrounds ----
// The owner's pictures already have the logo (top left, ~27 % of the height) and "https://mykiezberlin.com/" at the bottom:
// no box, no round logo, no rays, no site name. Only the text, sitting between logo and address, colours taken from the
// picture (dark picture -> light text, light picture -> dark text; accent colour from the picture's own colour),
// a soft shadow so it stays readable on photos. Size follows the text length (binary search), with an upper limit,
// and more room between the lines.
const SAFE_TOP = 600, SAFE_BOTTOM = 1700; // under the logo, over the address (2026-11-23: 540 -> 600, some logos are bigger)
const AREA_CLEAN = SAFE_BOTTOM - SAFE_TOP;

function hsl2hex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

/** Looks at the text area of the picture (small render) -> text colours that fit. */
export async function bgColors(background) {
  await init();
  const w = 54, h = 96;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><image href="data:${background.mime};base64,${toBase64(background.bytes)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/></svg>`;
  const px = new Resvg(svg, { fitTo: { mode: "width", value: w } }).render().pixels;
  const y0 = Math.floor((SAFE_TOP / H) * h), y1 = Math.floor((SAFE_BOTTOM / H) * h);
  let lum = 0, n = 0, hx = 0, hy = 0, sw = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, r = px[i], g = px[i + 1], b = px[i + 2];
    lum += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; n++;
    const [hh, ss, ll] = rgb2hsl(r, g, b);
    const wt = ss * (1 - Math.abs(ll - 0.5) * 2); // colourful pixels count more
    hx += Math.cos((hh * Math.PI) / 180) * wt; hy += Math.sin((hh * Math.PI) / 180) * wt; sw += wt;
  }
  const L = n ? lum / n : 0.3;
  const hue = (Math.atan2(hy, hx) * 180) / Math.PI;
  const hueD = (hue + 360) % 360;
  const colourful = n ? sw / n > 0.08 : false;
  if (L > 0.58) {
    // light picture: dark text, light halo
    return { title: "#0B1220", accent: colourful ? hsl2hex(hueD, 0.85, 0.26) : "#7A1E00", text: "#111827", text2: "#1F2937", meta: "#1E3A8A", shadow: "#FFFFFF", shadowOp: 0.85, L };
  }
  // dark / middle picture: light text, dark soft shadow; accent = the picture's own colour, light and strong
  // gold fits green/red/blue/grey pictures; on warm (orange/yellow) pictures a light sky blue stands out better
  const warm = colourful && hueD >= 15 && hueD <= 75;
  const accent = warm ? "#CFE8FF" : "#FFD54F";
  return { title: "#FFFFFF", accent, text: "#FFFFFF", text2: "#F1F5F9", meta: "#E0F2FE", shadow: "#000000", shadowOp: L > 0.4 ? 0.95 : 0.8, L };
}

export async function renderNewsClean(parts, opts) {
  await init();
  const col = opts.colors || (await bgColors(opts.background));
  const x0 = 76;
  const maxW = W - x0 * 2;
  const hasText = !!(parts.text1 || parts.text2);
  const layout = (k, cutOver) => {
    // titles grow less than the texts; short news must not become huge (K_MAX below)
    const kt = Math.min(k, hasText ? 1.45 : 1.75);
    const s1 = Math.round(64 * kt), s2 = Math.round(50 * kt), s3 = Math.round(38 * k), s4 = Math.round(36 * k), s5 = Math.round(30 * Math.min(k, 1.25)), s6 = Math.round(25 * Math.min(k, 1.15));
    const t1 = wrap(parts.title1, s1, maxW, true), t2 = parts.title2 ? wrap(parts.title2, s2, maxW, true) : [];
    let d1 = parts.text1 ? wrap(parts.text1, s3, maxW, false) : [], d2 = parts.text2 ? wrap(parts.text2, s4, maxW, false) : [];
    const src = wrap(`${parts.sourceLabel || "Kaynak / Quelle"}: ${parts.source || ""}`, s5, maxW, true);
    const link = wrap(String(parts.url || "").replace(/^https?:\/\//, ""), s6, maxW, false).slice(0, 2);
    const badgeH = parts.urgent ? Math.round(64 * Math.min(k, 1.3)) : 0;
    const draw = () => {
      let y = 0;
      let out = "";
      if (badgeH) {
        const bs = Math.round(badgeH * 0.52);
        const bw = Math.round(textW("ACİL · EIL", bs, true) + bs * 1.6);
        out += `<rect x="${x0}" y="0" width="${bw}" height="${badgeH}" rx="${badgeH / 2}" fill="#E30A17"/><text x="${x0 + bw / 2}" y="${Math.round(badgeH * 0.69)}" text-anchor="middle" font-family="Noto Sans" font-weight="700" font-size="${bs}" fill="#FFFFFF">ACİL · EIL</text>`;
        y += badgeH + Math.round(30 * k);
      }
      const add = (lines, size, lh, fill, bold, gap) => { if (!lines.length) return; out += `<g filter="url(#sh)">${block(lines, x0, y + size, size, lh, fill, bold)}</g>`; y += lines.length * lh + gap; };
      // 2026-11-23 (owner: "çok sıkışık, biraz arala"): more line height and more room between the parts
      add(t1, s1, Math.round(s1 * 1.24), col.title, true, Math.round(26 * k));
      add(t2, s2, Math.round(s2 * 1.26), col.accent, true, Math.round(52 * k));
      add(d1, s3, Math.round(s3 * 1.5), col.text, false, Math.round(40 * k));
      add(d2, s4, Math.round(s4 * 1.5), col.text2, false, Math.round(48 * k));
      add(src, s5, Math.round(s5 * 1.35), col.accent, true, Math.round(12 * k));
      add(link, s6, Math.round(s6 * 1.35), col.meta, false, 0);
      return { out, y };
    };
    let r = draw();
    if (cutOver && r.y > AREA_CLEAN && (d1.length || d2.length)) {
      const over = Math.ceil((r.y - AREA_CLEAN) / Math.round(s4 * 1.5));
      const cut = (arr, n) => { const a = arr.slice(0, Math.max(1, arr.length - n)); a[a.length - 1] = a[a.length - 1].replace(/\s*\S*$/, "") + " …"; return a; };
      const fromD2 = Math.min(over, Math.max(0, d2.length - 1));
      if (fromD2) d2 = cut(d2, fromD2);
      if (over - fromD2 > 0 && d1.length > 1) d1 = cut(d1, over - fromD2);
      r = draw();
    }
    const maxT = hasText ? 3 : 5;
    return { ...r, ok: r.y <= AREA_CLEAN && t1.length <= maxT && t2.length <= maxT };
  };
  // 2026-11-23 (owner: "kısa metinlerde aşırı büyük olmamalı"): upper limit 1.85 (description ~70 px, title ~93 px)
  const K_MIN = 0.55, K_MAX = 1.85;
  let best = null;
  const top0 = layout(K_MAX, false);
  if (top0.ok) best = top0;
  else {
    let lo = K_MIN, hi = K_MAX;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      const r = layout(mid, false);
      if (r.ok) { best = r; lo = mid; } else hi = mid;
    }
  }
  if (!best) best = layout(K_MIN, true);
  const top = SAFE_TOP + Math.max(0, Math.round((AREA_CLEAN - best.y) / 2));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><filter id="sh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${col.shadow}" flood-opacity="1"/><feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="${col.shadow}" flood-opacity="${Math.min(1, col.shadowOp).toFixed(2)}"/></filter></defs>` +
    `<image href="data:${opts.background.mime};base64,${toBase64(opts.background.bytes)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` +
    `<g transform="translate(0 ${top})">${best.out}</g>` +
    `</svg>`;
  const r = new Resvg(svg, {
    fitTo: { mode: "original" },
    font: { fontBuffers: [new Uint8Array(fontBold), new Uint8Array(fontRegular)], defaultFontFamily: "Noto Sans", loadSystemFonts: false },
  });
  return r.render().asPng();
}

// ---- 2026-11-23 evening (owner "UYGULA 3-4"): spread layout on the owner's backgrounds ----
// Turkish on top (title + text), German below (title + text), source at the bottom. The three parts are spread over the
// whole text area (under the logo row, over the address) with even space between them – not one packed block in the
// middle. Nothing else is drawn on the picture: no box, no logo, no darkening; only the letters with a thin outline-like
// shadow so they stay readable on photos.
export async function renderNewsSpread(parts, opts) {
  await init();
  const col = opts.colors || (await bgColors(opts.background));
  const x0 = 76;
  const maxW = W - x0 * 2;
  const hasText = !!(parts.text1 || parts.text2);
  const MIN_GAP = 56, MAX_GAP = 190;
  const layout = (k, cutOver) => {
    const kt = Math.min(k, hasText ? 1.45 : 1.75);
    const s1 = Math.round(62 * kt), s2 = Math.round(56 * kt), s3 = Math.round(38 * k), s4 = Math.round(37 * k), s5 = Math.round(29 * Math.min(k, 1.25)), s6 = Math.round(24 * Math.min(k, 1.15));
    const t1 = wrap(parts.title1, s1, maxW, true), t2 = parts.title2 ? wrap(parts.title2, s2, maxW, true) : [];
    let d1 = parts.text1 ? wrap(parts.text1, s3, maxW, false) : [], d2 = parts.text2 ? wrap(parts.text2, s4, maxW, false) : [];
    const src = wrap(`${parts.sourceLabel || "Kaynak / Quelle"}: ${parts.source || ""}`, s5, maxW, true);
    const link = wrap(String(parts.url || "").replace(/^https?:\/\//, ""), s6, maxW, false).slice(0, 2);
    const badgeH = parts.urgent ? Math.round(60 * Math.min(k, 1.3)) : 0;
    const group = (items) => {
      let y = 0, out = "";
      for (const [lines, size, lh, fill, bold, gap] of items) {
        if (!lines.length) continue;
        out += `<g filter="url(#sh)">${block(lines, x0, y + size, size, lh, fill, bold)}</g>`;
        y += lines.length * lh + gap;
      }
      return { out, h: y };
    };
    const build = () => {
      let g1 = group([[t1, s1, Math.round(s1 * 1.24), col.title, true, Math.round(30 * k)], [d1, s3, Math.round(s3 * 1.55), col.text, false, 0]]);
      if (badgeH) {
        const bs = Math.round(badgeH * 0.52);
        const bw = Math.round(textW("ACİL · EIL", bs, true) + bs * 1.6);
        const badge = `<rect x="${x0}" y="0" width="${bw}" height="${badgeH}" rx="${badgeH / 2}" fill="#E30A17"/><text x="${x0 + bw / 2}" y="${Math.round(badgeH * 0.69)}" text-anchor="middle" font-family="Noto Sans" font-weight="700" font-size="${bs}" fill="#FFFFFF">ACİL · EIL</text>`;
        const off = badgeH + Math.round(26 * k);
        g1 = { out: badge + `<g transform="translate(0 ${off})">${g1.out}</g>`, h: g1.h + off };
      }
      const g2 = group([[t2, s2, Math.round(s2 * 1.24), col.accent, true, Math.round(30 * k)], [d2, s4, Math.round(s4 * 1.55), col.text2, false, 0]]);
      const g3 = group([[src, s5, Math.round(s5 * 1.35), col.accent, true, Math.round(10 * k)], [link, s6, Math.round(s6 * 1.35), col.meta, false, 0]]);
      const parts3 = [g1, g2, g3].filter((g) => g.h > 0);
      const sum = parts3.reduce((n, g) => n + g.h, 0);
      return { parts3, sum, need: sum + MIN_GAP * (parts3.length - 1) };
    };
    let r = build();
    if (cutOver && r.need > AREA_CLEAN && (d1.length || d2.length)) {
      const over = Math.ceil((r.need - AREA_CLEAN) / Math.round(s4 * 1.55));
      const cut = (arr, n) => { const a = arr.slice(0, Math.max(1, arr.length - n)); a[a.length - 1] = a[a.length - 1].replace(/\s*\S*$/, "") + " …"; return a; };
      const fromD2 = Math.min(over, Math.max(0, d2.length - 1));
      if (fromD2) d2 = cut(d2, fromD2);
      if (over - fromD2 > 0 && d1.length > 1) d1 = cut(d1, over - fromD2);
      r = build();
    }
    const maxT = hasText ? 3 : 5;
    return { ...r, ok: r.need <= AREA_CLEAN && t1.length <= maxT && t2.length <= maxT };
  };
  const K_MIN = 0.55, K_MAX = 1.85;
  let best = null;
  const top0 = layout(K_MAX, false);
  if (top0.ok) best = top0;
  else {
    let lo = K_MIN, hi = K_MAX;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      const r = layout(mid, false);
      if (r.ok) { best = r; lo = mid; } else hi = mid;
    }
  }
  if (!best) best = layout(K_MIN, true);
  // even space between the parts (not more than MAX_GAP; the rest stays above and below)
  const n = best.parts3.length;
  const free = Math.max(0, AREA_CLEAN - best.sum);
  const gap = n > 1 ? Math.min(MAX_GAP, Math.max(MIN_GAP, free / (n - 1))) : 0;
  const used = best.sum + gap * (n - 1);
  let y = SAFE_TOP + Math.max(0, Math.round((AREA_CLEAN - used) / 2));
  let body = "";
  for (const g of best.parts3) { body += `<g transform="translate(0 ${Math.round(y)})">${g.out}</g>`; y += g.h + gap; }
  // thin shadow only (no dark glow / no darkening of the picture)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><filter id="sh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="${col.shadow}" flood-opacity="0.95"/><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${col.shadow}" flood-opacity="${Math.min(0.75, col.shadowOp * 0.7).toFixed(2)}"/></filter></defs>` +
    `<image href="data:${opts.background.mime};base64,${toBase64(opts.background.bytes)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` +
    body +
    `</svg>`;
  const res = new Resvg(svg, {
    fitTo: { mode: "original" },
    font: { fontBuffers: [new Uint8Array(fontBold), new Uint8Array(fontRegular)], defaultFontFamily: "Noto Sans", loadSystemFonts: false },
  });
  return res.render().asPng();
}
