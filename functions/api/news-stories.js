// 2026-11-22 (owner): admin news lists (see _lib/news-auto.js).
// GET  /api/news-stories (admin)  -> { slots: [ {slot, created_at, items} ] (newest first, today), auto, templates }
// POST /api/news-stories (admin)
//   JSON {action:"publish", slot, ids:[...], lang:"de"|"tr", template:1..6, gapMinutes}
//   multipart action=publish + slot + ids (comma list) + lang + background (own picture)
//   JSON {action:"edit", slot, id, title_de, text_de, title_tr, text_tr}
//   JSON {action:"refresh"} -> builds the current list again (only not yet published topics are lost)
import { cleanLongText, cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { berlinSlot, buildList, ensureCurrentSlot, ensureNews, getSlot, publishItems, saveItems, TEMPLATE_COUNT } from "../_lib/news-auto.js";
import { readFlags } from "./flags.js";

const BG_TYPES = { "image/jpeg": "jpg", "image/png": "png" }; // 2026-11-22: the picture renderer reads JPEG + PNG

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensureCurrentSlot(env, database);
  const day = (berlinSlot().slot || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const { results } = await database.prepare(`SELECT slot FROM news_slots WHERE slot LIKE ? ORDER BY slot DESC LIMIT 9`).bind(`${day}%`).all();
  const slots = [];
  for (const r of results) slots.push(await getSlot(database, r.slot));
  const flags = await readFlags(database);
  return json({ slots, auto: flags.newsAuto, templates: TEMPLATE_COUNT, now: berlinSlot() }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await ensureNews(database);
  const origin = new URL(request.url).origin;
  const multipart = (request.headers.get("content-type") || "").includes("multipart/form-data");
  const form = multipart ? await request.formData() : null;
  const body = form ? Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")) : await request.json().catch(() => ({}));
  const slot = cleanText(body.slot, 20);

  if (body.action === "refresh") {
    const { slot: cur } = berlinSlot();
    if (!cur) return json({ error: "outside_hours" }, 400);
    const old = await getSlot(database, cur);
    const keep = old ? old.items.filter((x) => x.published) : [];
    const fresh = (await buildList(env)).filter((x) => !keep.some((k) => k.orig === x.orig));
    const items = [...keep, ...fresh].map((x, i) => ({ ...x, id: x.published ? x.id : `r${Date.now() % 100000}-${i}` }));
    if (old) await saveItems(database, cur, items);
    else await database.prepare(`INSERT INTO news_slots (slot, created_at, items) VALUES (?, ?, ?)`).bind(cur, Date.now(), JSON.stringify(items)).run();
    return json({ ok: true, slot: cur, count: items.length });
  }

  if (body.action === "edit") {
    const s = await getSlot(database, slot);
    const it = s && s.items.find((x) => x.id === body.id);
    if (!it) return json({ error: "not_found" }, 404);
    if (body.title_de != null) it.title_de = cleanText(body.title_de, 90);
    if (body.text_de != null) it.text_de = cleanLongText(body.text_de, 600);
    if (body.title_tr != null) it.title_tr = cleanText(body.title_tr, 90);
    if (body.text_tr != null) it.text_tr = cleanLongText(body.text_tr, 600);
    if (body.title_en != null) it.title_en = cleanText(body.title_en, 90);
    if (body.text_en != null) it.text_en = cleanLongText(body.text_en, 600);
    await saveItems(database, slot, s.items);
    return json({ ok: true });
  }

  if (body.action === "publish") {
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : String(body.ids || "").split(",").filter(Boolean);
    if (!ids.length) return json({ error: "nothing_selected" }, 400);
    let backgroundKey = "";
    const file = form && form.get("background");
    if (file && typeof file !== "string" && file.size > 0) {
      const ext = BG_TYPES[file.type];
      if (!ext) return json({ error: "unsupported_file" }, 415);
      if (file.size > 5 * 1024 * 1024) return json({ error: "file_too_large" }, 413);
      if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
      backgroundKey = `stories/news-bg-${crypto.randomUUID()}.${ext}`;
      await env.BUCKET.put(backgroundKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    }
    const res = await publishItems(env, database, slot, ids, {
      lang: body.lang, template: Number(body.template) || 0, backgroundKey, origin,
      gapMinutes: Math.min(120, Math.max(0, Number(body.gapMinutes) || 0)),
    });
    return json({ ok: true, ...res });
  }
  return json({ error: "unknown_action" }, 400);
}
