// 2026-11-27 (owner "UYGULA 1-7"): the whole welcome package for a sponsor in ONE step –
// message 1 welcome, message 2 panel link + guide + video, message 3 share kit (WhatsApp & social media).
// Used by the admin buttons (/api/sponsor-panel adminWelcome) and – when the admin switch is on – automatically
// for a new sponsor with an e-mail address (news_state 'sponsor_welcome_auto', OFF until the owner switches it on).
import { sendMail } from "./mail.js";
import { parseExtra } from "./plans.js";
import { createSponsorToken, panelUrl } from "./sponsor-panel.js";
import { shareKitText, welcomeTexts } from "./sponsor-welcome.js";

const SITE = "https://mykiezberlin.com";
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Kiez-Tipp card of the sponsor (public/assets/kiez-tipp) when it exists, else "". */
export async function sharePicOf(env, ad) {
  const url = `${SITE}/assets/kiez-tipp/kiez-tipp-${ad.id}.jpg`;
  try {
    const res = env && env.ASSETS ? await env.ASSETS.fetch(new Request(url, { method: "HEAD" })) : await fetch(url, { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/") ? url : "";
  } catch (e) {
    return "";
  }
}

/** All 3 texts + a new panel link. Does not send anything. */
export async function welcomePackage(env, database, ad, { email = "", contact = "" } = {}) {
  const token = await createSponsorToken(database, ad.id, email);
  const link = panelUrl(token);
  const t = welcomeTexts(ad, link, contact);
  const k = shareKitText(ad, await sharePicOf(env, ad));
  return { link, ...t, subject3: k.subject3, text3: k.text3, share: k.share };
}

// ---- 2026-11-27 (owner "UYGULA c–f"): two e-mail addresses per sponsor (E-Mail 1 = email / panel_email, E-Mail 2 =
// email2) and for every kind of message who gets it: "1", "2" or "both" (default both). welcome = message 1,
// panel = message 2 (panel link + guide), share = message 3 (share kit), report = monthly report.
export const MAIL_KINDS = ["welcome", "panel", "share", "report"];
export function mailToOf(extra) {
  const m = (extra && extra.mail_to && typeof extra.mail_to === "object") ? extra.mail_to : {};
  const out = {};
  for (const k of MAIL_KINDS) out[k] = ["1", "2", "both"].includes(m[k]) ? m[k] : "both";
  return out;
}
/** Addresses for one kind of message (no doubles, only valid ones). */
export function recipientsFor(extra, kind, email1 = "") {
  const a = String(email1 || extra.panel_email || extra.email || "").trim().toLowerCase();
  const b = String(extra.email2 || "").trim().toLowerCase();
  const w = mailToOf(extra)[kind] || "both";
  const list = w === "1" ? [a] : w === "2" ? [b || a] : [a, b];
  return list.filter((x, i) => MAIL_RE.test(x) && list.indexOf(x) === i);
}
/** Saves E-Mail 1 / E-Mail 2 / who gets what. {email?, email2?, to?: {welcome, panel, share, report}} */
export async function saveMailPrefs(database, adId, p = {}) {
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = ?`).bind(adId).first();
  const x = parseExtra(row && row.extra);
  const clean = (v) => String(v || "").trim().slice(0, 120);
  if (p.email !== undefined && MAIL_RE.test(clean(p.email))) { x.email = clean(p.email); x.panel_email = clean(p.email); }
  if (p.email2 !== undefined) x.email2 = MAIL_RE.test(clean(p.email2)) ? clean(p.email2) : "";
  if (p.to && typeof p.to === "object") {
    const cur = mailToOf(x);
    for (const k of MAIL_KINDS) if (["1", "2", "both"].includes(p.to[k])) cur[k] = p.to[k];
    x.mail_to = cur;
  }
  await database.prepare(`UPDATE ads SET extra = ? WHERE id = ?`).bind(JSON.stringify(x), adId).run();
  return { email: x.email || "", email2: x.email2 || "", mail_to: mailToOf(x) };
}

/** Sends the 3 mails, writes extra.welcome_log (with the addresses). Returns { mailed, count, log, pkg }.
 *  An address that already got the package is not mailed again unless force = true (error "already_sent"). */
export async function sendWelcomePackage(env, database, ad, { email = "", contact = "", force = false } = {}) {
  const extra = parseExtra(ad.extra);
  const plan = [["welcome", 1], ["panel", 2], ["share", 3]].map(([kind, n]) => ({ n, to: recipientsFor(extra, kind, email) }));
  const all = [...new Set(plan.flatMap((p) => p.to))];
  if (!all.length) return { mailed: false, count: 0, error: "no_email", log: extra.welcome_log || [] };
  const before = (Array.isArray(extra.welcome_log) ? extra.welcome_log : []).filter((l) => l.via === "mail").flatMap((l) => Array.isArray(l.to) ? l.to : []);
  const already = all.filter((a) => before.includes(a));
  if (already.length && !force) return { mailed: false, count: 0, error: "already_sent", already, log: extra.welcome_log || [] };
  const pkg = await welcomePackage(env, database, ad, { email: all[0], contact });
  const msgs = { 1: [pkg.subject1, pkg.text1], 2: [pkg.subject2, pkg.text2], 3: [pkg.subject3, pkg.text3] };
  let count = 0, tried = 0;
  const got = [];
  for (const p of plan) {
    for (const to of p.to) {
      if (tried) await new Promise((r) => setTimeout(r, 1200)); // keeps the order in the inbox
      tried++;
      if (await sendMail(env, { to, subject: msgs[p.n][0], text: msgs[p.n][1] })) { count++; if (!got.includes(to)) got.push(to); }
    }
  }
  const log = Array.isArray(extra.welcome_log) ? extra.welcome_log : [];
  if (count) {
    log.push({ at: Date.now(), via: "mail", ok: count === tried, n: count, to: got });
    // read extra again – the token step or the admin may have changed it meanwhile
    const fresh = await database.prepare(`SELECT extra FROM ads WHERE id = ?`).bind(ad.id).first();
    const x = parseExtra(fresh && fresh.extra);
    x.welcome_log = log.slice(-10);
    if (!x.panel_email) x.panel_email = all[0];
    await database.prepare(`UPDATE ads SET extra = ? WHERE id = ?`).bind(JSON.stringify(x), ad.id).run();
  }
  return { mailed: count > 0 && count === tried, count, email: got.join(", "), log: log.slice(-10), pkg };
}

// ---- admin switch: automatic welcome for NEW sponsors (default OFF – owner sends by hand for now) ----
export async function welcomeAutoOn(database) {
  try {
    const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'sponsor_welcome_auto'`).first();
    return !!row && String(row.value) === "1"; // value column is INTEGER
  } catch (e) {
    return false;
  }
}
export async function setWelcomeAuto(database, on) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS news_state (id TEXT PRIMARY KEY, value INTEGER)`).run();
  await database.prepare(`INSERT INTO news_state (id, value) VALUES ('sponsor_welcome_auto', ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value`).bind(on ? "1" : "0").run();
}

/** Called after a NEW sponsor was saved in the admin: sends the package when the switch is on and an e-mail exists. */
export async function autoWelcomeNewAd(env, database, adId) {
  if (!(await welcomeAutoOn(database))) return null;
  const ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(adId).first();
  if (!ad) return null;
  const x = parseExtra(ad.extra);
  if (Array.isArray(x.welcome_log) && x.welcome_log.length) return null; // never twice
  return sendWelcomePackage(env, database, ad, {});
}
