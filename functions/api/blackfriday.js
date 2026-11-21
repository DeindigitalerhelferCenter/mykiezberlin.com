// GET /api/blackfriday -> { active, end, total, taken, left, freeMonths, prices } (see _lib/blackfriday.js)
import { db, json, noDb } from "../_lib/util.js";
import { bfStatus } from "../_lib/blackfriday.js";

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  return json(await bfStatus(database), 200, { "cache-control": "public, max-age=60" });
}
