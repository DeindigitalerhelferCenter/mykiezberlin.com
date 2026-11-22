// 2026-11-22 (owner): admin news lists (see _lib/news-auto.js).
// GET  /api/news-stories (admin)  -> { slots: [ {slot, created_at, items} ] (newest first, today), auto, templates }
// POST /api/news-stories (admin)
//   JSON {action:"publish", slot, ids:[...], lang:"de"|"tr", template:1..6, gapMinutes}
//   multipart action=publish + slot + ids (comma list) + lang + background (own picture)
//   JSON {action:"edit", slot, id, title_de, text_de, title_tr, text_tr}
//   JSON {action:"refresh"} -> builds the current list again (only not yet published topics are lost)
import { cleanLongText, cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { addBlocked, berlinSlot, buildList, ensureCurrentSlot, ensureNews, getSlot, listBackgrounds, newsParts, pickList, publishItems, readBlocked, readSettings, saveItems, saveSettings, TEMPLATE_COUNT } from "../_lib/news-auto.js";
import { renderNewsImage } from "../_lib/news-image.js";
import { readFlags } from "./flags.js";

const BG_TYPES = { "image/jpeg": "jpg", "image/png": "png" }; // 2026-11-22: the picture renderer reads JPEG + PNG

export async function onRequestGet({ request, env, waitUntil }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  // 2026-11-22 (owner: panel "yüklenmiyor"): the slow work (sources, AI) runs in the background, the panel answers at once
  await ensureNews(database);
  if (waitUntil) waitUntil(ensureCurrentSlot(env, database, { write: 1 }).catch(() => {})); else await ensureCurrentSlot(env, database, { write: 1 });
  const day = (berlinSlot().slot || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const { results } = await database.prepare(`SELECT slot FROM news_slots WHERE slot LIKE ? ORDER BY slot DESC LIMIT 9`).bind(`${day}%`).all();
  const slots = [];
  for (const r of results) slots.push(await getSlot(database, r.slot));
  const flags = await readFlags(database);
  // 2026-11-22 (owner): settings stay (interval, language, backgrounds) + own background folder
  const settings = await readSettings(database);
  const backgrounds = await listBackgrounds(database);
  // 2026-11-22 (owner: "otomatik haber paylaşmıyor"): status line for the admin – why nothing was shared
  const sweepRow = await database.prepare(`SELECT value FROM news_state WHERE id = 'sweep'`).first().catch(() => null);
  const lastNews = await database.prepare(`SELECT MAX(approved_at) AS t FROM stories WHERE by_admin = 1 AND kind IN ('news','warn') AND media_key LIKE 'stories/news-%'`).first().catch(() => null);
  const cur = slots.find((x) => x && x.slot === berlinSlot().slot) || null;
  const status = {
    sweepAt: sweepRow ? Number(sweepRow.value) : 0,
    lastNewsAt: lastNews && lastNews.t ? Number(lastNews.t) : 0,
    slot: cur ? cur.slot : "",
    items: cur ? cur.items.length : 0,
    open: cur ? cur.items.filter((x) => x.written === false).length : 0,
    autoDone: cur ? !!cur.auto_done : false,
  };
  return json({ slots, auto: flags.newsAuto, templates: TEMPLATE_COUNT, now: berlinSlot(), settings, backgrounds, status }, 200, { "cache-control": "no-store" });
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

  // 2026-11-22 (owner): settings that stay – interval 0/15/30/60/90/120, language, background mode + picks
  if (body.action === "settings") {
    const s = await saveSettings(database, body);
    return json({ ok: true, settings: s });
  }

  // 2026-11-22 (owner): own background pictures – any number, kept in R2 (the panel sends a JPEG, also from HEIC/WEBP)
  if (body.action === "bgUpload") {
    const file = form && form.get("file");
    if (!file || typeof file === "string" || !file.size) return json({ error: "no_file" }, 400);
    const ext = BG_TYPES[file.type];
    if (!ext) return json({ error: "unsupported_file" }, 415);
    if (file.size > 6 * 1024 * 1024) return json({ error: "file_too_large" }, 413);
    if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
    const key = `stories/news-bglib-${crypto.randomUUID()}.${ext}`;
    await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    await database.prepare(`INSERT INTO news_bgs (key, name, created_at) VALUES (?, ?, ?)`).bind(key, cleanText(body.name || "", 80), Date.now()).run();
    return json({ ok: true, key });
  }
  if (body.action === "bgDelete") {
    const key = cleanText(body.key, 120);
    if (!/^stories\/news-bglib-[0-9a-f-]+\.(jpg|png)$/.test(key)) return json({ error: "bad_key" }, 400);
    await database.prepare(`DELETE FROM news_bgs WHERE key = ?`).bind(key).run();
    // the picture file stays in R2: stories already published with it still need it
    const s = await readSettings(database);
    if (s.bgPicks.includes(`b:${key}`)) await saveSettings(database, { bgPicks: s.bgPicks.filter((x) => x !== `b:${key}`) });
    return json({ ok: true });
  }

  // 2026-11-22 (owner): the admin decides – hide (not shared by the auto mode), show again, or delete for good
  if (body.action === "hide" || body.action === "unhide" || body.action === "delete") {
    const s = await getSlot(database, slot);
    const it = s && s.items.find((x) => x.id === body.id);
    if (!it) return json({ error: "not_found" }, 404);
    if (body.action === "delete") {
      await addBlocked(database, it.orig || it.title_de || "");
      await saveItems(database, slot, s.items.filter((x) => x.id !== body.id)); // published stories stay online
    } else {
      it.hidden = body.action === "hide";
      await saveItems(database, slot, s.items);
    }
    return json({ ok: true });
  }

  // 2026-11-22 (owner): "Şimdi analiz et" – a NEW list, fast (choice now, the long texts are written by the next calls)
  if (body.action === "refresh") {
    const { slot: cur } = berlinSlot();
    if (!cur) return json({ error: "outside_hours" }, 400);
    const old = await getSlot(database, cur);
    const keep = old ? old.items.filter((x) => x.published) : [];
    const seen = new Set();
    const day = cur.slice(0, 10);
    const { results: daySlots } = await database.prepare(`SELECT items FROM news_slots WHERE slot LIKE ?`).bind(`${day}%`).all();
    for (const r of daySlots || []) { try { for (const x of JSON.parse(r.items || "[]")) if (x.orig) seen.add(x.orig); } catch (e) { /* skip */ } }
    const blocked = new Set(await readBlocked(database));
    for (const b of blocked) seen.add(b);
    const fresh = (await pickList(env, { exclude: seen, blocked })).filter((x) => !keep.some((k) => k.orig === x.orig));
    if (body.auto === "1" || body.auto === true) await database.prepare(`UPDATE news_slots SET auto_done = 0 WHERE slot = ?`).bind(cur).run();
    const items = [...keep, ...fresh].map((x, i) => ({ ...x, id: x.published ? x.id : `r${Date.now() % 100000}-${i}` }));
    if (old) await saveItems(database, cur, items);
    else await database.prepare(`INSERT INTO news_slots (slot, created_at, items) VALUES (?, ?, ?)`).bind(cur, Date.now(), JSON.stringify(items)).run();
    return json({ ok: true, slot: cur, count: items.length });
  }

  // 2026-11-21 (owner): big preview – the real picture of one topic with the chosen colour / own background and language
  if (body.action === "preview") {
    const s = await getSlot(database, slot);
    const it = s && s.items.find((x) => x.id === body.id);
    if (!it) return json({ error: "not_found" }, 404);
    const lang = ["tr-de", "tr-en", "de", "tr"].includes(body.lang) ? body.lang : "tr-de";
    let background = null;
    const file = form && form.get("background");
    if (file && typeof file !== "string" && file.size > 0 && BG_TYPES[file.type] && file.size <= 5 * 1024 * 1024) {
      background = { bytes: new Uint8Array(await file.arrayBuffer()), mime: file.type };
    }
    const pick = String(body.bgPick || "");
    if (!background && env.BUCKET && /^b:stories\/news-bglib-[0-9a-f-]+\.(jpg|png)$/.test(pick)) {
      const obj = await env.BUCKET.get(pick.slice(2)).catch(() => null);
      if (obj) background = { bytes: new Uint8Array(await obj.arrayBuffer()), mime: (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg" };
    }
    const row = await database.prepare(`SELECT value FROM news_state WHERE id = 'theme'`).first().catch(() => null);
    const tpl = Number(body.template) || 0;
    const theme = tpl ? tpl - 1 : ((row ? Number(row.value) : -1) + 1) % TEMPLATE_COUNT; // rotating: the next colour
    let logo = null;
    try {
      const r = await fetch(`${origin}/assets/images/mykiez_logo.png`);
      if (r.ok) logo = { bytes: new Uint8Array(await r.arrayBuffer()), mime: "image/png" };
    } catch (e) { logo = null; }
    try {
      const png = await renderNewsImage(newsParts(it, lang), { theme, logo, background });
      return new Response(png, { headers: { "content-type": "image/png", "cache-control": "no-store" } });
    } catch (e) {
      return json({ error: "render_failed", detail: String((e && e.message) || e).slice(0, 120) }, 500);
    }
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
    // 2026-11-22 (owner): a picked background of the folder ("b:<key>") / template, else the settings decide
    const st = await readSettings(database);
    const pick = String(body.bgPick || "");
    if (!backgroundKey && /^b:stories\/news-bglib-[0-9a-f-]+\.(jpg|png)$/.test(pick)) backgroundKey = pick.slice(2);
    const res = await publishItems(env, database, slot, ids, {
      lang: body.lang || st.lang, template: Number(body.template) || 0, backgroundKey, origin, again: body.again === "1" || body.again === true,
      gapMinutes: body.gapMinutes != null && body.gapMinutes !== "" ? Math.min(120, Math.max(0, Number(body.gapMinutes) || 0)) : st.gap,
      useSettings: true,
    });
    return json({ ok: true, ...res });
  }
  return json({ error: "unknown_action" }, 400);
}
