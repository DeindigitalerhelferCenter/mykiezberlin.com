// 2026-11-22 (owner): switches the admin can turn on/off without a new app version.
// GET  /api/flags                               -> { ui2: bool, newsAuto: bool }
// POST /api/flags {name, on} (x-admin-token)    -> { ok }
//  - ui2: "Startseite" in the bottom bar, no Live-Ticker button in the header, no clock/weather under the stories.
//         Admin sees it at once, everybody else only when the admin switches it on (owner: "otomatiğe alınca direkt açılsın").
//  - newsAuto: news stories every 2 hours are published automatically (see /api/news-stories).
import { db, isAdmin, json, noDb } from "../_lib/util.js";

export const FLAG_NAMES = ["ui2", "newsAuto"];

export async function readFlags(database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS flags (name TEXT PRIMARY KEY, value INTEGER DEFAULT 0, updated_at INTEGER)`).run();
  const { results } = await database.prepare(`SELECT name, value FROM flags`).all();
  const out = {};
  FLAG_NAMES.forEach((n) => { out[n] = false; });
  results.forEach((r) => { if (FLAG_NAMES.includes(r.name)) out[r.name] = !!r.value; });
  return out;
}

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  return json(await readFlags(database), 200, { "cache-control": "public, max-age=30" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  if (!FLAG_NAMES.includes(body.name)) return json({ error: "unknown_flag" }, 400);
  await readFlags(database);
  await database.prepare(`INSERT INTO flags (name, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .bind(body.name, body.on ? 1 : 0, Date.now()).run();
  return json({ ok: true, ...(await readFlags(database)) });
}
