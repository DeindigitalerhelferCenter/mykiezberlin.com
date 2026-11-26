// 2026-11-26 (owner: "her gün story olarak da görünsün ve tüm sosyal medyalarda"): every day ONE invite card as an
// own story (author "My Kiez Berlin", by_admin = 1) – the cards take turns (groups, channel, app, partner, reporter,
// volunteer). Because it is an own admin story, the existing sweeps send it on: Telegram, Facebook + Instagram
// (metaSweep) and the TikTok / WhatsApp packages of the Social-Planer. Runs from GET /api/stories (no cron on Pages),
// from 10:00 Berlin time, at most once a day (table invite_daily). Never throws.
import { INVITE_CARDS, inviteText, SITE } from "./invite-cards.js";

const CARD_VER = "1"; // raise when the card pictures are drawn again (new R2 copy)
const FROM_HOUR = 10;
const TO_HOUR = 21;
let lastCheck = 0;
let FMT = null;

function berlinNow(ts) {
  if (!FMT) FMT = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(FMT.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

export async function inviteDailySweep(env, database, { force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastCheck < 10 * 60000) return { skipped: "recent" };
  lastCheck = now;
  try {
    if (!database || !env.BUCKET) return { skipped: "no_storage" };
    const { day, hour } = berlinNow(now);
    if (!force && (hour < FROM_HOUR || hour > TO_HOUR)) return { skipped: "hour" };
    await database.prepare(`CREATE TABLE IF NOT EXISTS invite_daily (day TEXT PRIMARY KEY, card TEXT, story_id TEXT, created_at INTEGER)`).run();
    if (await database.prepare(`SELECT day FROM invite_daily WHERE day = ?`).bind(day).first()) return { skipped: "done_today" };
    const last = await database.prepare(`SELECT card FROM invite_daily ORDER BY day DESC LIMIT 1`).first();
    const i = last ? (INVITE_CARDS.findIndex((c) => c.key === last.card) + 1) % INVITE_CARDS.length : 0;
    const c = INVITE_CARDS[i];
    const id = `invite-${day}`;
    // claim the day first – a second request at the same moment does nothing
    const claim = await database.prepare(`INSERT OR IGNORE INTO invite_daily (day, card, story_id, created_at) VALUES (?, ?, ?, ?)`).bind(day, c.key, id, now).run();
    if (!claim.meta || !claim.meta.changes) return { skipped: "claimed" };
    try {
      const mediaKey = `stories/invite-${c.key}-v${CARD_VER}.jpg`;
      if (!(await env.BUCKET.head(mediaKey))) {
        const res = env.ASSETS ? await env.ASSETS.fetch(new Request(`${SITE}/assets/davet/${c.key}-story.jpg`)) : await fetch(`${SITE}/assets/davet/${c.key}-story.jpg`);
        if (!res.ok || !/image\/jpeg/.test(res.headers.get("content-type") || "")) throw new Error("card picture missing");
        await env.BUCKET.put(mediaKey, await res.arrayBuffer(), { httpMetadata: { contentType: "image/jpeg" } });
      }
      await database
        .prepare(`INSERT INTO stories (id, headline, subtext, kiez, kind, author, media_key, media_type, duration_hours, status, ip, created_at, approved_at, link, by_admin, media_hash, text_hash, media_extra, deal, cats, overlay) VALUES (?, ?, ?, ?, ?, ?, ?, 'image', 24, 'approved', '', ?, ?, ?, 1, '', '', '[]', '', ?, NULL)`)
        .bind(id, `${c.title_de} · ${c.title_tr}`, inviteText(c).slice(0, 2000), "Ganz Berlin", "news", "My Kiez Berlin", mediaKey, now, now, `${SITE}/davet/${c.key}`, "berlin")
        .run();
      return { ok: true, day, card: c.key, id };
    } catch (e) {
      await database.prepare(`DELETE FROM invite_daily WHERE day = ?`).bind(day).run().catch(() => {}); // try again later
      return { error: String(e && e.message || e) };
    }
  } catch (e) {
    return { error: String(e && e.message || e) };
  }
}
