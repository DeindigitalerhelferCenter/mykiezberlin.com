// 2026-11-21 (owner): trusted accounts, admin only (see _lib/story-vip.js).
// GET  /api/admin-vip                         -> { vip: [...], ads: [{id, name}] }
// POST /api/admin-vip {action:"key", name}    -> { id, key, link }   (the key is shown only once)
// POST /api/admin-vip {action:"ad", adId}     -> { ok }
// POST /api/admin-vip {action:"remove", id}   -> { ok }
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { addVipAd, addVipKey, listVip, removeVip } from "../_lib/story-vip.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const vip = await listVip(database);
  const { results } = await database.prepare(`SELECT id, name FROM ads ORDER BY name ASC LIMIT 300`).all();
  return json({ vip, ads: results }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  if (body.action === "key") {
    const name = cleanText(body.name, 40);
    if (!name) return json({ error: "missing_name" }, 400);
    const { id, key } = await addVipKey(database, name);
    return json({ id, key, link: `https://mykiezberlin.com/?storykey=${key}` }, 201);
  }
  if (body.action === "ad") {
    const res = await addVipAd(database, cleanText(body.adId, 40));
    return res ? json({ ok: true, name: res.name }) : json({ error: "not_found" }, 404);
  }
  if (body.action === "remove") {
    await removeVip(database, cleanText(body.id, 60));
    return json({ ok: true });
  }
  return json({ error: "unknown_action" }, 400);
}
