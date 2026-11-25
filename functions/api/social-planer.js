// 2026-11-22 (owner): admin "🗓️ Social-Planer" (see _lib/social-planer.js)
// GET  /api/social-planer                                  -> settings, ready, last runs, next slot, TikTok/WhatsApp package
// POST {action:"settings", times:["08:00",…], telegram, meta, pack}
// POST {action:"run"}                                       -> runs now (own slot key "manual …")
// POST {action:"mark", channel:"tiktok"|"whatsapp", ids:[…]} -> "geteilt": these stories are never offered again
import { db, isAdmin, json, noDb } from "../_lib/util.js";
import { telegramReady } from "../_lib/telegram.js";
import { metaReady } from "../_lib/meta-social.js";
import { PACK_CHANNELS, collectionText, isWaKiezChannel, kiezPacks, markDone, nextSlot, openStories, plannerSettings, runSlot, saveSettings } from "../_lib/social-planer.js";
import { runJobsNow } from "../_lib/social-planer.js"; // 2026-11-23
import { requeueStory, shareReport } from "../_lib/meta-social.js"; // 2026-11-23 (owner "UYGULA 3")
import { readAuthorMap, setAuthorMap } from "../_lib/social-authors.js";

const NO_STORE = { "cache-control": "no-store" };

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  // 2026-11-23 (owner "UYGULA 3"): ?report=1 -> every live story and where it went (Site, Telegram, FB/IG, packages)
  if (new URL(request.url).searchParams.get("report") === "1") {
    await plannerSettings(database); // tables
    const rep = await shareReport(database);
    const ads = ((await database.prepare(`SELECT id, name FROM ads WHERE active = 1 ORDER BY name`).all().catch(() => ({ results: [] }))).results || []);
    return json({ ...rep, ads, authorMap: await readAuthorMap(database) }, 200, NO_STORE);
  }
  const settings = await plannerSettings(database);
  const now = Date.now();
  const runs = ((await database.prepare(`SELECT slot, started, result FROM social_runs ORDER BY started DESC LIMIT 10`).all()).results || [])
    .map((r) => { let x = {}; try { x = JSON.parse(r.result || "{}"); } catch (e) { x = {}; } return { slot: r.slot, started: r.started, result: x }; });
  const pack = {};
  for (const c of PACK_CHANNELS) {
    const list = (await openStories(database, c, now)).slice(0, 35);
    pack[c] = { text: list.length ? collectionText(list, now) : "", stories: list.map((s) => ({ id: s.id, headline: s.headline, author: s.author, media: s.media, video: s.media_type === "video" })) };
  }
  const kiez = await kiezPacks(database, now).catch(() => []); // 2026-11-22 (owner): one package per WhatsApp Kiez group
  return json({ settings, ready: { telegram: telegramReady(env), meta: metaReady(env), instagram: Boolean(env.IG_USER_ID) }, next: nextSlot(settings.times, now), runs, pack, kiez }, 200, NO_STORE);
}

export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  if (body.action === "settings") return json({ ok: true, settings: await saveSettings(database, body) }, 200, NO_STORE);
  if (body.action === "run") {
    // 2026-11-23 (owner "UYGULA 4"): the run makes jobs; the posting steps run here (~25 s), the rest in the background
    const slotKey = `manual ${new Date().toISOString().slice(0, 16)}`;
    const result = await runSlot(env, database, slotKey);
    const steps = await runJobsNow(env, database, 25000);
    const run = await database.prepare(`SELECT result FROM social_runs WHERE slot = ?`).bind(slotKey).first().catch(() => null);
    let now = result;
    try { now = JSON.parse((run && run.result) || "null") || result; } catch (e) { now = result; }
    return json({ ok: true, result: now, steps }, 200, NO_STORE);
  }
  // 2026-11-23 (owner "UYGULA 3"): report buttons – send again / who is this author
  if (body.action === "requeue") {
    if (!body.id || !["meta", "telegram"].includes(body.channel)) return json({ error: "bad_request" }, 400);
    await requeueStory(database, String(body.id).slice(0, 80), body.channel);
    return json({ ok: true }, 200, NO_STORE);
  }
  if (body.action === "authorMap") {
    const t = String(body.target || "");
    if (!body.author || !(t === "" || t === "no" || t === "trusted" || /^ad:[\w-]{1,60}$/.test(t))) return json({ error: "bad_request" }, 400);
    return json({ ok: true, map: await setAuthorMap(database, String(body.author).slice(0, 80), t) }, 200, NO_STORE);
  }
  // 2026-11-23 (owner "UYGULA 7"): the admin shared a story by hand (story viewer) -> this channel never offers it again
  if (body.action === "manualShared") {
    const map = { whatsapp: "whatsapp", tiktok: "tiktok", instagram: "meta", facebook: "meta", status: "wastatus", wastatus: "wastatus" }; // 2026-11-25: + WhatsApp Status
    const channel = map[body.target];
    if (!channel || !body.id) return json({ error: "bad_request" }, 400);
    return json({ ok: true, channel, marked: await markDone(database, channel, [String(body.id).slice(0, 80)], "manual-share") }, 200, NO_STORE);
  }
  if (body.action === "mark") {
    if (!(PACK_CHANNELS.includes(body.channel) || isWaKiezChannel(body.channel)) || !Array.isArray(body.ids)) return json({ error: "bad_request" }, 400); // 2026-11-22: + "wa-<kiez>"
    return json({ ok: true, marked: await markDone(database, body.channel, body.ids.slice(0, 100), "admin") }, 200, NO_STORE);
  }
  return json({ error: "bad_request" }, 400);
}
