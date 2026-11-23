// 2026-11-23 (owner "UYGULA 2"): who may go to the own social media pages (Facebook, Instagram, collections, packages).
// Before: only the exact names "My Kiez Berlin" / "Kiez26" and the exact sponsor name. So "kiez26" (small letters) or a
// sponsor that writes "TEK HANDELS GMBH" (sponsor name "Terra Verde TEK Handels Getränke") were never shared.
// Now (no capital/small difference):
//   own      – "My Kiez Berlin", "Kiez26"
//   sponsor  – active sponsor name, a trusted sponsor (story_vip kind "ad"), or a name that shares a clear word with a
//              sponsor name ("TEK HANDELS GMBH" ~ "Terra Verde TEK Handels Getränke")
//   trusted  – owner choice: normal users ONLY when trusted (story_vip kind "key" or users.trusted = 1)
//   map      – the admin's own choice in the report card (social_state 'author_map': {author: "ad:<id>" | "trusted" | "no"})
// Everybody else (normal users) is not shared on the own pages (rights of the people, owner choice 23.11).
const OWN = ["my kiez berlin", "kiez26"];
const STOP = new Set(["gmbh", "ug", "ag", "kg", "ohg", "berlin", "kiez", "und", "the", "der", "die", "das", "von", "shop", "store", "team", "service", "co", "mbh", "e.k", "ek"]);

const low = (s) => String(s || "").trim().toLowerCase();
function words(s) {
  return low(s).replace(/[^a-z0-9äöüßçğışé ]+/gi, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w));
}

export async function readAuthorMap(database) {
  try {
    const row = await database.prepare(`SELECT value FROM social_state WHERE key = 'author_map'`).first();
    return JSON.parse((row && row.value) || "{}") || {};
  } catch (e) { return {}; }
}
export async function setAuthorMap(database, author, target) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS social_state (key TEXT PRIMARY KEY, value TEXT)`).run();
  const map = await readAuthorMap(database);
  const k = low(author);
  if (!k) return map;
  if (!target) delete map[k]; else map[k] = String(target).slice(0, 80);
  await database.prepare(`INSERT INTO social_state (key, value) VALUES ('author_map', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).bind(JSON.stringify(map)).run();
  return map;
}

/** Returns a function author -> {kind, name?} | null. Built once per call (a few small queries). */
export async function shareAuthors(database) {
  let ads = [], vip = [], trustedUsers = [];
  try { ads = (await database.prepare(`SELECT id, name FROM ads WHERE active = 1`).all()).results || []; } catch (e) { ads = []; }
  try { vip = (await database.prepare(`SELECT name, kind, ad_id FROM story_vip`).all()).results || []; } catch (e) { vip = []; }
  try { trustedUsers = (await database.prepare(`SELECT display_name FROM users WHERE trusted = 1`).all()).results || []; } catch (e) { trustedUsers = []; }
  const map = await readAuthorMap(database);
  const adByName = new Map(ads.map((a) => [low(a.name), a]));
  const vipKeys = new Set(vip.filter((v) => v.kind !== "ad").map((v) => low(v.name)));
  const vipAds = new Set(vip.filter((v) => v.kind === "ad").map((v) => low(v.name)));
  const users = new Set(trustedUsers.map((u) => low(u.display_name)));
  const adWords = ads.map((a) => ({ a, w: new Set(words(a.name)) }));
  return function (author) {
    const k = low(author);
    if (!k) return null;
    const m = map[k];
    if (m === "no") return null;
    if (m === "trusted") return { kind: "trusted" };
    if (m && m.startsWith("ad:")) { const a = ads.find((x) => x.id === m.slice(3)); return { kind: "sponsor", name: a ? a.name : m.slice(3) }; }
    if (OWN.includes(k)) return { kind: "own" };
    if (adByName.has(k) || vipAds.has(k)) return { kind: "sponsor", name: author };
    if (vipKeys.has(k) || users.has(k)) return { kind: "trusted" };
    const w = words(author);
    for (const x of adWords) {
      const same = w.filter((y) => x.w.has(y));
      if (same.length >= 2 || same.some((y) => y.length >= 5)) return { kind: "sponsor", name: x.a.name, guess: true };
    }
    return null;
  };
}
