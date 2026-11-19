// Reports which Cloudflare bindings are active, without exposing any values.
import { json } from "../_lib/util.js";

export function onRequestGet({ env }) {
  return json({ ok: true, db: Boolean(env.DB), r2: Boolean(env.BUCKET), adminTokenSet: Boolean(env.ADMIN_TOKEN), ai: Boolean(env.AI), telegram: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) }); // 2026-11-19: Telegram channel
}
