// 2026-11-26 (owner "UYGULA"): list of the permanent invite cards for the share page /davet/ (web + app)
// GET /api/davet          -> { cards: [{ key, title_de, …, link, text, story, post, wide }] }
// GET /api/davet?stats=1  -> + clicks of the last 30 days per card (admin only)
import { isAdmin, json, db } from "../_lib/util.js";
import { INVITE_CARDS, publicCard } from "../_lib/invite-cards.js";
import { inviteDailySweep } from "../_lib/invite-daily.js";

export async function onRequestGet({ request, env }) {
  const out = { cards: INVITE_CARDS.map(publicCard) };
  if (new URL(request.url).searchParams.get("stats") && (await isAdmin(request, env))) {
    try {
      const database = await db(env);
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const { results } = await database.prepare(`SELECT key, SUM(n) AS n FROM invite_clicks WHERE day >= ? GROUP BY key`).bind(since).all();
      out.clicks = Object.fromEntries((results || []).map((r) => [r.key, Number(r.n) || 0]));
    } catch (e) {
      out.clicks = {};
    }
  }
  return json(out, 200, { "cache-control": out.clicks ? "no-store" : "public, max-age=300" });
}

// 2026-11-26: POST {action:"daily"} (admin) -> today's invite story now (if not made yet), with the result
export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (body.action !== "daily") return json({ error: "unknown_action" }, 400);
  const database = await db(env);
  return json(await inviteDailySweep(env, database, { force: true }), 200, { "cache-control": "no-store" });
}
