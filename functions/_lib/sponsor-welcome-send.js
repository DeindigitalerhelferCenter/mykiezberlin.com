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

/** Sends the 3 mails, writes extra.welcome_log. Returns { mailed, count, log, pkg }. */
export async function sendWelcomePackage(env, database, ad, { email = "", contact = "" } = {}) {
  const extra = parseExtra(ad.extra);
  const to = String(email || extra.panel_email || extra.email || "").trim();
  if (!MAIL_RE.test(to)) return { mailed: false, count: 0, error: "no_email", log: extra.welcome_log || [] };
  const pkg = await welcomePackage(env, database, ad, { email: to, contact });
  let count = 0;
  for (const [s, t] of [[pkg.subject1, pkg.text1], [pkg.subject2, pkg.text2], [pkg.subject3, pkg.text3]]) {
    if (count) await new Promise((r) => setTimeout(r, 1200)); // keeps the order in the inbox
    if (await sendMail(env, { to, subject: s, text: t })) count++;
  }
  const log = Array.isArray(extra.welcome_log) ? extra.welcome_log : [];
  if (count) {
    log.push({ at: Date.now(), via: "mail", ok: count === 3, n: count });
    // read extra again – the token step or the admin may have changed it meanwhile
    const fresh = await database.prepare(`SELECT extra FROM ads WHERE id = ?`).bind(ad.id).first();
    const x = parseExtra(fresh && fresh.extra);
    x.welcome_log = log.slice(-10);
    x.panel_email = to;
    await database.prepare(`UPDATE ads SET extra = ? WHERE id = ?`).bind(JSON.stringify(x), ad.id).run();
  }
  return { mailed: count === 3, count, email: to, log: log.slice(-10), pkg };
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
