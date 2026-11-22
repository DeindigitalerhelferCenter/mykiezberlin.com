// 2026-11-22 (owner): admin reminders with a due date, e.g. the WhatsApp Business "Info" line (WhatsApp keeps it
// at most ~30 days, there is no "never"). From `lead_days` before the due date until the admin enters a new date,
// the admin phone gets one notice every day (through /api/admin-pending, the phone already polls it every minute),
// the web admin shows a red banner, and – when Brevo mail is set up – info@ gets one mail a day.
import { mailReady, sendMail, INFO } from "./mail.js";

const DAY = 86400000;

export async function ensureReminders(database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS admin_reminders (id TEXT PRIMARY KEY, title TEXT, text TEXT, due_at INTEGER, lead_days INTEGER DEFAULT 2, repeat_days INTEGER DEFAULT 0, updated_at INTEGER)`).run();
  // first entry (owner 2026-11-22): WhatsApp "Info" ends 20.12.2026 23:07 Berlin
  await database.prepare(`INSERT OR IGNORE INTO admin_reminders (id, title, text, due_at, lead_days, repeat_days, updated_at) VALUES ('wa-info', ?, ?, ?, 2, 30, ?)`)
    .bind("WhatsApp-Info erneuern · WhatsApp Info yenile",
      "WhatsApp Business → Tools → Profil → Info → „Selbstdefiniert“ → letztes Datum → speichern. Danach hier das neue Ende eintragen. · Info'yu yenile ve yeni bitiş tarihini buraya gir.",
      Date.UTC(2026, 11, 20, 22, 7), Date.now()).run();
}

export async function listReminders(database) {
  await ensureReminders(database);
  const { results } = await database.prepare(`SELECT * FROM admin_reminders WHERE title != 'mail-log' ORDER BY due_at ASC`).all();
  const now = Date.now();
  return (results || []).map((r) => ({ ...r, active: now >= r.due_at - r.lead_days * DAY, overdue: now > r.due_at }));
}

const dayKey = (ts) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(ts));

/** Notices in the shape of support items (the app shows them without a new version); id changes every day. */
export async function reminderNotices(env, database) {
  try {
    const now = Date.now();
    const list = (await listReminders(database)).filter((r) => r.active);
    const out = list.map((r) => ({
      id: `rem-${r.id}-${dayKey(now)}`, topic: "reminder", sponsor: "⏰ " + r.title,
      message: (r.overdue ? "ABGELAUFEN · SÜRESİ DOLDU! " : "Fällig · Son gün: " + new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium", timeStyle: "short" }).format(new Date(r.due_at)) + ". ") + r.text,
      created_at: now,
    }));
    // one mail a day (only when Brevo is set up)
    if (out.length && mailReady(env)) {
      const key = `mail-${dayKey(now)}`;
      const sent = await database.prepare(`SELECT id FROM admin_reminders WHERE id = ?`).bind(key).first().catch(() => null);
      if (!sent) {
        await database.prepare(`INSERT OR IGNORE INTO admin_reminders (id, title, text, due_at, lead_days, updated_at) VALUES (?, 'mail-log', '', 0, -99999, ?)`).bind(key, now).run();
        await sendMail(env, { to: INFO, subject: "⏰ My Kiez Berlin – Erinnerung", text: out.map((o) => `${o.sponsor}\n${o.message}`).join("\n\n") }).catch(() => {});
      }
    }
    return out;
  } catch (e) {
    return [];
  }
}
