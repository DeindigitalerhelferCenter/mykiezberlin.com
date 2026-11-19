// 2026-11-19 (owner): every story that goes live (approved by the admin, "publish now", a planned story whose
// time has come, a trusted user's story) is posted once to the My Kiez Berlin Telegram channel – automatically.
// Needs two Pages secrets: TELEGRAM_BOT_TOKEN (from @BotFather) and TELEGRAM_CHAT_ID (e.g. "@mykiezberlin"
// or the numeric channel id). The bot must be an admin of the channel. Without them nothing happens.
// Runs at most once a minute, from GET /api/stories (web visitors and the app ask for stories every minute).
// Only stories that go live AFTER the first run are posted – the stories that are already online are not sent.

const SITE = "https://mykiezberlin.com";
const PER_RUN = 3;
const RUN_EVERY_MS = 60 * 1000;
const MAX_AGE_MS = 6 * 3600 * 1000; // a story that went live more than 6 h ago is not sent any more

export function telegramReady(env) {
  return Boolean(env && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
}

function esc(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cut(text, max) {
  const t = String(text || "").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

function caption(story) {
  const lines = [`<b>${esc(cut(story.headline, 200))}</b>`];
  if (story.subtext) lines.push("", esc(cut(story.subtext, 650)));
  if (story.kiez) lines.push("", `📍 ${esc(story.kiez)}`);
  lines.push(`👉 <a href="${SITE}/">mykiezberlin.com</a> · 📲 My Kiez Berlin App`);
  return lines.join("\n").slice(0, 1024);
}

async function call(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, parse_mode: "HTML", ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!(res.ok && data && data.ok)) return false;
  // 2026-11-19 (owner): remember the Telegram message id, so a story deleted on the site is deleted in the channel too
  return (data.result && data.result.message_id) || true;
}

/** Posts one story; picture / video with caption, otherwise text. Falls back to text when the media fails. */
export async function postStory(env, story) {
  const text = caption(story);
  const media = story.media_key ? `${SITE}/media/${story.media_key}` : "";
  let r = false;
  if (media && story.media_type === "video") r = await call(env, "sendVideo", { video: media, caption: text, supports_streaming: true });
  if (!r && media && story.media_type !== "video") r = await call(env, "sendPhoto", { photo: media, caption: text });
  if (!r) r = await call(env, "sendMessage", { text, disable_web_page_preview: false });
  return r; // false, true or the message id
}

async function ensureTables(database) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS telegram_state (key TEXT PRIMARY KEY, value TEXT)`),
    database.prepare(`CREATE TABLE IF NOT EXISTS telegram_sent (story_id TEXT PRIMARY KEY, sent_at INTEGER, ok INTEGER)`),
  ]);
  await database.prepare(`ALTER TABLE telegram_sent ADD COLUMN message_id INTEGER`).run().catch(() => {}); // 2026-11-19: exists already -> ignored
}

/** Called with waitUntil from GET /api/stories. Never throws. */
export async function telegramSweep(env, database) {
  try {
    if (!telegramReady(env) || !database) return;
    await ensureTables(database);
    const now = Date.now();
    // first run: remember the start, so the stories that are already online are not posted
    await database.prepare(`INSERT OR IGNORE INTO telegram_state (key, value) VALUES ('since', ?)`).bind(String(now)).run();
    await database.prepare(`INSERT OR IGNORE INTO telegram_state (key, value) VALUES ('last_run', '0')`).run();
    // one run per minute (the UPDATE only succeeds for the first caller)
    const lock = await database.prepare(`UPDATE telegram_state SET value = ? WHERE key = 'last_run' AND CAST(value AS INTEGER) < ?`).bind(String(now), now - RUN_EVERY_MS).run();
    if (!lock.meta || !lock.meta.changes) return;
    const since = Number((await database.prepare(`SELECT value FROM telegram_state WHERE key = 'since'`).first())?.value) || now;
    const { results } = await database
      .prepare(`SELECT s.id, s.headline, s.subtext, s.kiez, s.media_key, s.media_type FROM stories s
        LEFT JOIN telegram_sent t ON t.story_id = s.id
        WHERE t.story_id IS NULL AND s.status = 'approved' AND s.approved_at <= ? AND s.approved_at >= ? AND s.approved_at > ?
          AND s.approved_at + s.duration_hours * 3600000 > ?
        ORDER BY s.approved_at ASC LIMIT ?`)
      .bind(now, since, now - MAX_AGE_MS, now, PER_RUN)
      .all();
    for (const story of results || []) {
      // mark first, so a slow Telegram answer never leads to a double post
      await database.prepare(`INSERT OR IGNORE INTO telegram_sent (story_id, sent_at, ok) VALUES (?, ?, 0)`).bind(story.id, now).run();
      const ok = await postStory(env, story).catch(() => false);
      if (ok) await database.prepare(`UPDATE telegram_sent SET ok = 1, message_id = ? WHERE story_id = ?`).bind(typeof ok === "number" ? ok : null, story.id).run();
    }
  } catch (e) {
    // Telegram must never break the story list
  }
}

/**
 * 2026-11-19 (owner): a story the admin deletes or rejects on the site is deleted in the Telegram channel too.
 * Stories that simply run out stay in the channel (archive). A bot may delete its own channel posts
 * with the "Post Messages" right (Telegram allows this for 48 h after posting). Never throws.
 */
export async function telegramDeleteStory(env, database, storyId) {
  try {
    if (!telegramReady(env) || !database || !storyId) return false;
    await ensureTables(database);
    const row = await database.prepare(`SELECT message_id FROM telegram_sent WHERE story_id = ?`).bind(storyId).first();
    if (!row || !row.message_id) return false;
    const done = await call(env, "deleteMessage", { message_id: row.message_id });
    await database.prepare(`UPDATE telegram_sent SET ok = ? WHERE story_id = ?`).bind(done ? 2 : 3, storyId).run(); // 2 deleted, 3 delete failed
    return Boolean(done);
  } catch (e) {
    return false;
  }
}
