// Live score feed for the goal celebration on the website and in the app.
import { loadBerlinMatches } from "../_lib/matches.js";
import { json } from "../_lib/util.js";

const TTL_SECONDS = 45;

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/goals", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const response = json({ updatedAt: Date.now(), matches: await loadBerlinMatches() }, 200, { "cache-control": `public, max-age=${TTL_SECONDS}` });
    context.waitUntil(cache.put(key, response.clone()));
    return response;
  } catch (e) {
    return json({ error: "goals_unavailable" }, 503);
  }
}
