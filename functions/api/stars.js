// GET /api/stars[?name=Ali] – Kiez-Stars of the week, last week's winners and (optionally) one person's count.
import { weekStars } from "../_lib/stars.js";
import { cleanText, db, json, noDb } from "../_lib/util.js";

export async function onRequestGet({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const name = cleanText(new URL(request.url).searchParams.get("name"), 40).toLowerCase();
  const stars = await weekStars(database);
  const mine = name ? stars.all.find((r) => r.name.toLowerCase() === name) : null;
  const { all, ...rest } = stars;
  return json({ ...rest, me: name ? { count: mine?.count || 0, rank: mine ? all.indexOf(mine) + 1 : 0 } : null }, 200, { "cache-control": "public, max-age=60" });
}
