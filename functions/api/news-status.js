// 2026-11-22 (owner: "otomatik haber çalışmıyor"): public status of the auto news (only counts and times, no texts, no secrets).
// GET /api/news-status -> { auto, now, sweepAt, log, lastError, slot:{slot,items,open,autoDone,published}, lastAutoNewsAt }
import { db, json, noDb } from "../_lib/util.js";
import { berlinSlot, ensureNews, getSlot } from "../_lib/news-auto.js";
import { readFlags } from "./flags.js";
import { metaEnv, metaStatus } from "../_lib/meta-social.js";

const parse = (row) => { try { return row ? JSON.parse(row.value) : null; } catch (e) { return null; } };

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  await ensureNews(database);
  const flags = await readFlags(database);
  const get = (id) => database.prepare(`SELECT value FROM news_state WHERE id = ?`).bind(id).first().catch(() => null);
  const sweep = await get("sweep");
  const now = berlinSlot();
  const cur = now.slot ? await getSlot(database, now.slot) : null;
  const last = await database.prepare(`SELECT MAX(approved_at) AS t FROM stories WHERE by_admin = 1 AND media_key LIKE 'stories/news-%' AND media_key NOT LIKE 'stories/news-bglib-%'`).first().catch(() => null);
  // 2026-11-22 (owner: "8:00/16:00/23:00 yüklendi mi?"): last Social-Planer runs (slot, time, short result)
  const { results: runs } = await database.prepare(`SELECT slot, started, result FROM social_runs ORDER BY started DESC LIMIT 4`).all().catch(() => ({ results: [] }));
  return json({
    socialPlaner: (runs || []).map((r) => ({ slot: r.slot, started: r.started, result: String(r.result || "").slice(0, 200) })),
    auto: flags.newsAuto,
    now,
    sweepAt: sweep ? Number(sweep.value) : 0,
    log: parse(await get("sweep_log")),
    lastError: parse(await get("sweep_err")),
    slot: cur ? { slot: cur.slot, items: cur.items.length, open: cur.items.filter((x) => x.written === false).length, autoDone: !!cur.auto_done, published: cur.items.filter((x) => x.published).length, noAi: cur.items.filter((x) => x.noAi).length, renderErrors: cur.items.filter((x) => x.renderError).map((x) => x.renderError) } : null,
    lastAutoNewsAt: last && last.t ? Number(last.t) : 0,
    meta: await metaEnv(env, database).then(() => metaStatus(env, database)), // 2026-11-23 (fetches the page token once): Facebook/Instagram ready? (no secrets)
  }, 200, { "cache-control": "no-store" });
}
