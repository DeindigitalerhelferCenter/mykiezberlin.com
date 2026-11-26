// 2026-11-27 (owner "UYGULA ilan 1-4"): classifieds must not get lost.
// 1. pending classifieds -> admin phone notice (via /api/admin-pending "support" list, no new app needed)
// 2. AI pre-check (same check as stories): a clean ad goes online at once, a doubtful one waits for the admin
// 3. owner mail: "your ad is online" + 1 day before the free week ends "extend now" (only when the contact is an e-mail)
import { aiReview, reviewVerdict } from "./story-guard.js";
import { sendMail } from "./mail.js";

const SITE = "https://mykiezberlin.com";
export const FREE_DAYS = 7;
const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i;

export function contactEmail(payload) {
  const m = String((payload && payload.contact) || "").match(EMAIL);
  return m ? m[0] : "";
}

/** AI check of a new classified. Returns "ok", "flag:…", "block:…" or "" (no AI / error -> admin decides). */
export async function classifiedAiVerdict(env, payload, file) {
  try {
    let bytes = null, mime = "";
    if (file && typeof file !== "string" && /^image\//.test(file.type || "")) { bytes = new Uint8Array(await file.arrayBuffer()); mime = file.type; }
    const text = [payload.description, payload.price ? `Preis: ${payload.price}` : "", payload.category ? `Kategorie: ${payload.category}` : ""].filter(Boolean).join("\n");
    const r = await aiReview(env, payload.title || "", text, bytes, mime);
    return reviewVerdict(r);
  } catch (e) {
    return "";
  }
}

async function ensureMailTable(database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS classified_mail (id TEXT NOT NULL, kind TEXT NOT NULL, at INTEGER, PRIMARY KEY (id, kind))`).run();
}

/** Sends one mail per ad and kind ("online" / "remind"), never twice. */
export async function mailClassifiedOwner(env, database, id, payload, kind) {
  const to = contactEmail(payload);
  if (!to) return false;
  try {
    await ensureMailTable(database);
    const ins = await database.prepare(`INSERT OR IGNORE INTO classified_mail (id, kind, at) VALUES (?, ?, ?)`).bind(id, kind, Date.now()).run();
    if (!ins.meta || !ins.meta.changes) return false;
    const title = payload.title || "Kleinanzeige";
    const link = `${SITE}/community/#ilan`;
    const text = kind === "online"
      ? `🇩🇪 Ihre Kleinanzeige „${title}“ ist jetzt online – ${FREE_DAYS} Tage kostenlos.\nAnsehen: ${link}\n\n🇹🇷 „${title}“ ilanınız yayında – ${FREE_DAYS} gün ücretsiz.\nGörüntüle: ${link}\n\nMy Kiez Berlin · mykiezberlin.com`
      : `🇩🇪 Ihre Kleinanzeige „${title}“ läuft morgen ab. Verlängern: 1 Woche 5 €, 1 Monat 10 € – auf ${link} (im selben Browser, mit dem Sie inseriert haben) oder antworten Sie einfach auf diese Mail.\n\n🇹🇷 „${title}“ ilanınızın süresi yarın doluyor. Uzatmak için: 1 hafta 5 €, 1 ay 10 € – ${link} (ilanı verdiğiniz tarayıcıda) ya da bu e-postaya cevap verin.\n\nMy Kiez Berlin · mykiezberlin.com`;
    const subject = kind === "online" ? `Ihre Anzeige ist online · İlanınız yayında – ${title}` : `Ihre Anzeige läuft morgen ab · İlanınızın süresi yarın doluyor – ${title}`;
    const ok = await sendMail(env, { to, subject, text });
    if (!ok) await database.prepare(`DELETE FROM classified_mail WHERE id = ? AND kind = ?`).bind(id, kind).run().catch(() => {});
    return !!ok;
  } catch (e) {
    return false;
  }
}

let lastSweep = 0;
/** Once an hour (per worker): ads whose free week ends within 24 h get the "extend" mail. */
export async function classifiedReminderSweep(env, database) {
  const now = Date.now();
  if (now - lastSweep < 3600000) return;
  lastSweep = now;
  try {
    const from = now - FREE_DAYS * 86400000, to = now - (FREE_DAYS - 1) * 86400000;
    const { results } = await database.prepare(`SELECT id, payload FROM submissions WHERE type = 'classified' AND status = 'approved' AND created_at > ? AND created_at <= ? AND (paid_until IS NULL OR paid_until < ?) LIMIT 30`).bind(from, to, now + 86400000).all();
    for (const r of results || []) {
      let p = {};
      try { p = JSON.parse(r.payload); } catch (e) { p = {}; }
      await mailClassifiedOwner(env, database, r.id, p, "remind");
    }
  } catch (e) { /* table may not exist yet */ }
}

/** Pending classifieds as notices for the admin phone (same format as support messages). */
export async function pendingClassifiedNotices(database) {
  try {
    const { results } = await database.prepare(`SELECT id, payload, created_at FROM submissions WHERE type = 'classified' AND status = 'pending' ORDER BY created_at DESC LIMIT 20`).all();
    return (results || []).map((r) => {
      let p = {};
      try { p = JSON.parse(r.payload); } catch (e) { p = {}; }
      return { id: `clf-${r.id}`, topic: "classified", sponsor: "📦 Neue Kleinanzeige · Yeni ilan", message: `${p.title || ""}${p.price ? " · " + p.price : ""}${p.kiezName ? " · " + p.kiezName : ""} – bitte prüfen · lütfen kontrol et (Admin → 📦 İlanlar)`, created_at: r.created_at };
    });
  } catch (e) {
    return [];
  }
}
