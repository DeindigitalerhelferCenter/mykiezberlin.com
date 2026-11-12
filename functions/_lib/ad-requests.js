// Advertising requests (/werben) – admin tools added 2026-11-12:
// mail log per request, replies from info@ with ready templates (DE/TR/EN), edit, delete,
// and automatic cleanup: requests marked "Erledigt" or "Gekündigt" are deleted 90 days later.
import { INFO, mailReady, sendMail } from "./mail.js";
import * as mail from "./mail.js";
import { PACKAGE_NAMES, lang as pickLang, werbenReply } from "./mail-templates.js";
import { createCheckout } from "./werbung.js";

const DAY_MS = 86400000;
export const KEEP_DAYS = 90;
const MAX_LOG = 30;

export const REQUEST_COLUMNS = "id, company, person, email, phone, address, size, message, note, status, lang, mail_log, paid_until, done_at, created_at";

export function parseLog(value) {
  try {
    const list = JSON.parse(value || "[]");
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

/** Rows for admin lists: mail_log as an array. */
export function shapeRequest(row) {
  return { ...row, mail_log: parseLog(row.mail_log) };
}

/** Appends one entry ({ kind, to, subject, ok, error, text }) to the request's mail log. */
export async function logMail(database, id, entry) {
  const row = await database.prepare(`SELECT mail_log FROM ad_requests WHERE id = ?`).bind(id).first().catch(() => null);
  if (!row) return;
  const list = parseLog(row.mail_log);
  list.push({ at: Date.now(), ...entry, text: String(entry.text || "").slice(0, 2000) });
  await database.prepare(`UPDATE ad_requests SET mail_log = ? WHERE id = ?`).bind(JSON.stringify(list.slice(-MAX_LOG)), id).run().catch(() => {});
}

/** Sends a mail and writes the result into the log. Returns { ok, error }. */
export async function sendLogged(env, database, id, kind, msg) {
  const ok = await sendMail(env, msg);
  const error = ok ? "" : mailReady(env) ? mail.lastError || "unbekannt" : "kein Mail-Anbieter (BREVO_API_KEY fehlt)";
  await logMail(database, id, { kind, to: msg.to, subject: msg.subject, ok, error, text: msg.text });
  return { ok, error };
}

/** Deletes requests that were finished (done / canceled) more than 90 days ago. */
export async function cleanupOldRequests(database) {
  const limit = Date.now() - KEEP_DAYS * DAY_MS;
  await database
    .prepare(`DELETE FROM ad_requests WHERE status IN ('done', 'canceled') AND (CASE WHEN done_at > 0 THEN done_at ELSE created_at END) < ?`)
    .bind(limit)
    .run()
    .catch(() => {});
}

// Ready replies for the admin. {name} {company} {package} {paylink} are filled on the server.
const REPLIES = {
  callback: {
    de: ["Ihre Anfrage bei My Kiez Berlin – {company}", "Hallo {name},\n\nvielen Dank für Ihr Interesse an {package}.\nWir möchten kurz mit Ihnen sprechen, um Ihre Anzeige vorzubereiten. Wann sind Sie telefonisch gut erreichbar?\n\nViele Grüße\nIhr My Kiez Berlin Team"],
    tr: ["My Kiez Berlin talebiniz – {company}", "Merhaba {name},\n\n{package} paketine gösterdiğiniz ilgi için teşekkür ederiz.\nReklamınızı hazırlamak için sizinle kısaca görüşmek istiyoruz. Hangi saatlerde telefonla ulaşabiliriz?\n\nSaygılarımızla\nMy Kiez Berlin Ekibi"],
    en: ["Your request at My Kiez Berlin – {company}", "Hello {name},\n\nthank you for your interest in {package}.\nWe would like to talk to you briefly to prepare your ad. When can we reach you by phone?\n\nBest regards\nYour My Kiez Berlin team"],
  },
  paylink: {
    de: ["Ihr Zahlungslink – {package}", "Hallo {name},\n\nhier ist Ihr sicherer Zahlungslink (Stripe) für {package}:\n{paylink}\n\nDie ersten 3 Monate kosten 19 € pro Monat, danach gilt der normale Paketpreis. Monatlich kündbar.\nNach der Zahlung schalten wir Ihre Anzeige für {company} frei.\n\nViele Grüße\nIhr My Kiez Berlin Team"],
    tr: ["Ödeme linkiniz – {package}", "Merhaba {name},\n\n{package} için güvenli ödeme linkiniz (Stripe):\n{paylink}\n\nİlk 3 ay aylık 19 €, sonrasında normal paket fiyatı geçerlidir. Aylık iptal edilebilir.\nÖdemeden sonra {company} reklamınızı yayına alıyoruz.\n\nSaygılarımızla\nMy Kiez Berlin Ekibi"],
    en: ["Your payment link – {package}", "Hello {name},\n\nhere is your secure payment link (Stripe) for {package}:\n{paylink}\n\nThe first 3 months cost 19 € per month, then the normal package price applies. Cancel monthly.\nAfter payment we activate the ad for {company}.\n\nBest regards\nYour My Kiez Berlin team"],
  },
  online: {
    de: ["Ihre Anzeige ist online – {company}", "Hallo {name},\n\nIhre Anzeige für {company} ({package}) ist jetzt in der App und auf mykiezberlin.com zu sehen.\nWenn Sie Text, Bild oder Links ändern möchten, antworten Sie einfach auf diese E-Mail.\n\nViele Grüße\nIhr My Kiez Berlin Team"],
    tr: ["Reklamınız yayında – {company}", "Merhaba {name},\n\n{company} reklamınız ({package}) artık uygulamada ve mykiezberlin.com'da görünüyor.\nMetin, resim veya linkleri değiştirmek isterseniz bu e-postayı yanıtlamanız yeterli.\n\nSaygılarımızla\nMy Kiez Berlin Ekibi"],
    en: ["Your ad is online – {company}", "Hello {name},\n\nyour ad for {company} ({package}) is now visible in the app and on mykiezberlin.com.\nIf you want to change text, picture or links, simply reply to this e-mail.\n\nBest regards\nYour My Kiez Berlin team"],
  },
  free: {
    de: ["My Kiez Berlin – {company}", "Hallo {name},\n\n\n\nViele Grüße\nIhr My Kiez Berlin Team"],
    tr: ["My Kiez Berlin – {company}", "Merhaba {name},\n\n\n\nSaygılarımızla\nMy Kiez Berlin Ekibi"],
    en: ["My Kiez Berlin – {company}", "Hello {name},\n\n\n\nBest regards\nYour My Kiez Berlin team"],
  },
};
export const REPLY_KINDS = Object.keys(REPLIES);

function fill(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k] ?? "") : m));
}

function varsOf(row) {
  return { name: row.person || row.company, company: row.company, package: PACKAGE_NAMES[row.size] || row.size };
}

/** Ready text for the reply form; {paylink} stays as a placeholder until sending. */
export function replyTemplate(row, kind, l) {
  const t = (REPLIES[kind] || REPLIES.free)[pickLang(l || row.lang)];
  return { subject: fill(t[0], varsOf(row)), text: fill(t[1], varsOf(row)) };
}

/** Sends the admin's reply. A {paylink} in the text is replaced by a fresh Stripe checkout link. */
export async function sendReply(env, database, origin, row, subject, text) {
  let body = String(text || "").replace(/\r/g, "").slice(0, 5000);
  if (body.includes("{paylink}")) {
    const checkout = await createCheckout(env, origin, row).catch(() => null);
    if (!checkout?.url) return { ok: false, error: env.STRIPE_SECRET_KEY ? `Stripe: ${checkout?.error || "kein Link"}` : "STRIPE_SECRET_KEY fehlt – kein Zahlungslink möglich" };
    body = body.replaceAll("{paylink}", checkout.url);
    await database.prepare(`UPDATE ad_requests SET stripe_session = ? WHERE id = ?`).bind(checkout.id, row.id).run().catch(() => {});
  }
  const result = await sendLogged(env, database, row.id, "reply", { to: row.email, from: INFO, replyTo: INFO, subject: String(subject || "").slice(0, 200), text: body });
  if (result.ok && row.status === "new") await database.prepare(`UPDATE ad_requests SET status = 'contacted' WHERE id = ?`).bind(row.id).run();
  return result;
}

/** Sends the automatic welcome mail again (e.g. when the first one failed). */
export async function resendWelcome(env, database, row) {
  const reply = werbenReply(row.lang, { ...varsOf(row), payable: Boolean(env.STRIPE_SECRET_KEY) && ["s", "m", "l"].includes(row.size) });
  return sendLogged(env, database, row.id, "welcome", { to: row.email, from: INFO, subject: reply.subject, text: reply.text });
}
