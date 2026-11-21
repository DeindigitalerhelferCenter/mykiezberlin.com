// 2026-11-14 (owner, "Soru 2": thousands of user stories later) – plan A + C:
//  A) a daily limit per user (IP or device), media of rejected / long-waiting stories is removed from R2
//     (expired stories were already removed by cleanupExpiredStories)
//  C) every user story is checked by Workers AI first (picture + text). Trusted devices (several stories approved by
//     the admin, none rejected) go online at once when the AI check is fine; everybody else waits for the admin.
import { storyMediaList } from "./util.js";

// 2026-11-22 (owner): back to the fast way. No AI before sending. Only clear swear words (DE/TR/EN) are refused
// at once (no AI, milliseconds). Everything else: trusted device / trusted account -> online, others -> admin.
// The AI review still runs in the background and is only a note for the admin (sure + heavy -> back to the admin).
const SWEAR_EXACT = [
  // DE
  "idiot", "idioten", "vollidiot", "fotze", "spast", "spasti", "schlampe", "penner", "kanake", "kanaken", "drecksau", "hure", "huren", "schwuchtel", "missgeburt",
  // TR
  "amk", "aq", "piç", "ibne", "kahpe", "salak", "yavsak", "serefsiz", "orospu", "pezevenk", "gerizekali", "gerizekalı",
  // EN
  "bitch", "asshole", "cunt", "whore", "slut", "retard", "bastard", "dickhead", "motherfucker", "faggot", "nigger", "nigga",
];
const SWEAR_START = [
  "arschloch", "arschlöcher", "arschgeige", "wichser", "hurensohn", "fick", "missgeburt", "vollidiot",
  "orospu", "siktir", "sikerim", "sikeyim", "siktiğim", "siktigim", "amına", "amcık", "amcik", "yavşak", "şerefsiz", "pezevenk", "gerizekalı", "götveren", "ananı",
  "fuck", "motherfuck", "bullshit", "asshole",
];
const fold = (s) => String(s || "").toLowerCase().normalize("NFC").replace(/i̇/g, "i");
const SW_EXACT = new Set(SWEAR_EXACT.map(fold));
const SW_START = SWEAR_START.map(fold);

/** The first clear swear word in the text (as written by the user) or "". */
export function swearHit(...texts) {
  for (const t of texts) {
    const words = String(t || "").split(/[^\p{L}]+/u).filter(Boolean);
    for (const w of words) {
      const f = fold(w);
      if (SW_EXACT.has(f) || SW_START.some((s) => f.startsWith(s))) return w;
    }
  }
  return "";
}

/** The answer for a refused story (same shape as the AI review, so web + app show the word). */
export function swearReview(word) {
  return {
    severity: "heavy", confidence: 1,
    reason_de: "Bitte ohne Schimpfwörter oder Beleidigungen.", reason_tr: "Lütfen küfür ve hakaret olmadan yaz.",
    image_problem: "", issues: [{ text: word, why_de: "Schimpfwort", why_tr: "Küfür / hakaret", suggestion: "" }],
  };
}

export const USER_DAILY_LIMIT = 5; // stories per user and 24 hours (admin not counted)
export const TRUST_APPROVED = 3; // approved stories needed before a device publishes directly
const PENDING_MAX_MS = 14 * 24 * 3600000; // waiting longer than 14 days -> rejected, media removed
const AI_MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
const AI_MAX_BYTES = 3 * 1024 * 1024;

let ready = false;
export async function ensureGuard(database) {
  if (ready) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS story_trust (device TEXT PRIMARY KEY, approved INTEGER DEFAULT 0, rejected INTEGER DEFAULT 0, updated_at INTEGER)`).run();
  ready = true;
}

export function cleanDevice(value) {
  const v = String(value ?? "").trim();
  return /^[A-Za-z0-9-]{16,64}$/.test(v) ? v : "";
}

/** Stories of this user in the last 24 hours (for the "you have N left today" hint before sending). */
export async function dailyUsed(database, ip, device) {
  const since = Date.now() - 24 * 3600000;
  const row = await database
    .prepare(`SELECT COUNT(*) AS n FROM stories WHERE by_admin = 0 AND created_at > ? AND (ip = ? OR (? != '' AND device = ?))`)
    .bind(since, ip, device, device)
    .first();
  return row?.n ?? 0;
}

export async function dailyLimited(database, ip, device) {
  const since = Date.now() - 24 * 3600000;
  const row = await database
    .prepare(`SELECT COUNT(*) AS n FROM stories WHERE by_admin = 0 AND created_at > ? AND (ip = ? OR (? != '' AND device = ?))`)
    .bind(since, ip, device, device)
    .first();
  return (row?.n ?? 0) >= USER_DAILY_LIMIT;
}

export async function isTrusted(database, device) {
  if (!device) return false;
  await ensureGuard(database);
  const row = await database.prepare(`SELECT approved, rejected FROM story_trust WHERE device = ?`).bind(device).first();
  return !!row && row.approved >= TRUST_APPROVED && row.rejected === 0;
}

/** Called when the admin approves or rejects a user story. */
export async function countTrust(database, storyId, field) {
  await ensureGuard(database);
  const s = await database.prepare(`SELECT device, by_admin FROM stories WHERE id = ?`).bind(storyId).first();
  if (!s || !s.device || s.by_admin) return;
  const col = field === "rejected" ? "rejected" : "approved";
  await database
    .prepare(`INSERT INTO story_trust (device, ${col}, updated_at) VALUES (?, 1, ?) ON CONFLICT(device) DO UPDATE SET ${col} = ${col} + 1, updated_at = excluded.updated_at`)
    .bind(s.device, Date.now())
    .run();
}

function toBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const PROMPT = `Du prüfst Beiträge für die öffentliche Berliner Nachbarschafts-App "My Kiez Berlin" (auch Kinder lesen mit).
NICHT erlaubt: Nacktheit oder Sexuelles, Gewalt oder Blut, Hass, Beleidigung oder Hetze, Drogen- oder Waffenverkauf, Glücksspiel,
private Daten anderer Menschen (Ausweis, Telefonnummer einer Privatperson, Autokennzeichen groß im Bild), Betrug oder Spam.
Normale Fotos aus dem Kiez, Werbung von Geschäften, Veranstaltungen und Nachrichten sind erlaubt.
Antworte NUR mit JSON: {"ok":true,"reason":"","block":false} oder {"ok":false,"reason":"kurzer Grund auf Deutsch","block":true|false}
"block":true NUR bei eindeutig: Nacktheit/Sexuelles/Pornografie, Beleidigung/Schimpfwörter/Fluchen (auch Türkisch), Hass/Hetze, grausamer Gewalt oder Blut.
Bei allem anderen, was nicht erlaubt oder unklar ist (Politik, Spam, private Daten …): "block":false (dann entscheidet der Admin).`;

// 2026-11-22 (owner): the old check refused too much (politics, police news, accidents). New rules:
// - refused at once ONLY when clearly heavy AND the AI is sure: nudity/porn, swear words or insults against people,
//   hate speech, very bloody/cruel pictures
// - light problems (rude words, unclear) -> NOT refused, the admin decides
// - news, accidents, police, politics, criticism, opinions are allowed
// - the AI names the exact words/sentences, why, and a better wording (shown red in the form before sending)
const REVIEW_PROMPT = `Du prüfst Beiträge für die öffentliche Berliner Nachbarschafts-App "My Kiez Berlin". Sei GROSSZÜGIG – lieber durchlassen als ablehnen.
ERLAUBT (immer ok): Nachrichten, Polizei- und Unfallmeldungen, Feuer, Verkehr, Politik, Meinungen, Kritik an Politik/Behörden/Firmen, Werbung von Geschäften, Veranstaltungen, normale Fotos.
"heavy" NUR bei EINDEUTIG: Nacktheit/Sexuelles/Pornografie, Schimpfwörter oder Beleidigungen gegen Personen oder Gruppen (auch Türkisch), Hass/Hetze gegen Gruppen, sehr blutige/grausame Bilder.
"light" bei: unhöflichen/groben Wörtern ohne Beleidigung, Spam, privaten Daten fremder Menschen, wenn du unsicher bist.
Sonst "none".
Nenne bei "light"/"heavy" GENAU die betroffenen Stellen (wörtlich aus dem Text kopiert), den Grund kurz auf Deutsch UND Türkisch, und einen höflichen Ersatz in derselben Sprache wie der Text.
Antworte NUR mit JSON:
{"severity":"none|light|heavy","confidence":0.0-1.0,"reason_de":"","reason_tr":"","image_problem":"","issues":[{"text":"wörtlich","why_de":"","why_tr":"","suggestion":""}]}`;

/** Detailed check: { severity, confidence, reason_de, reason_tr, image_problem, issues[] } or null (AI not reachable). */
export async function aiReview(env, headline, subtext, bytes, mime) {
  if (!env.AI) return null;
  const content = [{ type: "text", text: `${REVIEW_PROMPT}\n\nTitel: ${headline}\nText: ${subtext}` }];
  if (bytes && /^image\/(jpeg|png|webp)$/.test(mime || "") && bytes.byteLength <= AI_MAX_BYTES) {
    content.push({ type: "image_url", image_url: { url: `data:${mime};base64,${toBase64(bytes)}` } });
  }
  for (const model of AI_MODELS) {
    try {
      const r = await env.AI.run(model, { messages: [{ role: "user", content }], max_tokens: 700, temperature: 0 });
      const raw = typeof r?.response === "string" ? r.response : JSON.stringify(r?.response ?? r);
      const m = String(raw).match(/\{[\s\S]*\}/);
      if (!m) continue;
      const d = JSON.parse(m[0]);
      const sev = ["none", "light", "heavy"].includes(d.severity) ? d.severity : "none";
      const clean = (s, n) => String(s || "").replace(/[<>]/g, "").slice(0, n);
      const full = `${headline}\n${subtext}`;
      const issues = (Array.isArray(d.issues) ? d.issues : []).slice(0, 8).map((x) => ({
        text: clean(x.text, 200), why_de: clean(x.why_de, 160), why_tr: clean(x.why_tr, 160), suggestion: clean(x.suggestion, 300),
      })).filter((x) => x.text && full.toLowerCase().includes(x.text.toLowerCase())); // only real places of the text
      return {
        severity: sev, confidence: Math.max(0, Math.min(1, Number(d.confidence) || 0)),
        reason_de: clean(d.reason_de, 200), reason_tr: clean(d.reason_tr, 200), image_problem: clean(d.image_problem, 200), issues,
      };
    } catch (e) {
      // next model
    }
  }
  return null;
}

/** heavy + sure (>= 0.8) -> "block:"; light or unsure -> "flag:" (admin decides); else "ok". */
export function reviewVerdict(r) {
  if (!r) return "";
  const why = r.reason_de || r.image_problem || (r.issues[0] && r.issues[0].why_de) || "";
  if (r.severity === "heavy" && r.confidence >= 0.8) return "block:" + why;
  if (r.severity === "heavy" || r.severity === "light") return "flag:" + why;
  return "ok";
}

/** "ok", "flag:<reason>", "block:<reason>" or "" (AI not reachable). 2026-11-22: uses the new, kinder review. */
export async function aiCheck(env, headline, subtext, bytes, mime) {
  return reviewVerdict(await aiReview(env, headline, subtext, bytes, mime));
}

/** The old strict check (before 2026-11-22) – kept for reference, not used any more. */
export async function aiCheckStrict(env, headline, subtext, bytes, mime) {
  if (!env.AI) return "";
  const content = [{ type: "text", text: `${PROMPT}\n\nTitel: ${headline}\nText: ${subtext}` }];
  if (bytes && /^image\/(jpeg|png|webp)$/.test(mime || "") && bytes.byteLength <= AI_MAX_BYTES) {
    content.push({ type: "image_url", image_url: { url: `data:${mime};base64,${toBase64(bytes)}` } });
  }
  for (const model of AI_MODELS) {
    try {
      const r = await env.AI.run(model, { messages: [{ role: "user", content }], max_tokens: 120, temperature: 0 });
      const raw = typeof r?.response === "string" ? r.response : JSON.stringify(r?.response ?? r);
      const m = String(raw).match(/\{[\s\S]*\}/);
      if (!m) continue;
      const d = JSON.parse(m[0]);
      if (d.ok === true) return "ok";
      if (d.ok === false) return (d.block === true ? "block:" : "flag:") + String(d.reason || "").replace(/[<>]/g, "").slice(0, 120);
    } catch (e) {
      // next model
    }
  }
  return "";
}

/** Media of rejected stories and of stories waiting longer than 14 days is removed (rows stay for the history). */
export async function cleanupStoryMedia(env, database) {
  const old = Date.now() - PENDING_MAX_MS;
  await database.prepare(`UPDATE stories SET status = 'rejected' WHERE status = 'pending' AND created_at < ?`).bind(old).run();
  // rejected: media kept 3 days (the admin can still change the decision)
  const { results } = await database
    .prepare(`SELECT id, media_key, media_type, media_extra FROM stories WHERE status = 'rejected' AND media_key != '' AND by_admin = 0 AND created_at < ? LIMIT 20`)
    .bind(Date.now() - 3 * 24 * 3600000)
    .all();
  for (const row of results) {
    if (env.BUCKET) for (const m of storyMediaList(row)) await env.BUCKET.delete(m.key).catch(() => {});
    await database.prepare(`UPDATE stories SET media_key = '', media_type = '', media_extra = '[]' WHERE id = ?`).bind(row.id).run();
  }
}
