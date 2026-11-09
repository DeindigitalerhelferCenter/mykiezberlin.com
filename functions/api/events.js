// Live Berlin events from the city's open data: street/folk festivals and Christmas markets (berlin.de).
import { fetchText, json } from "../_lib/util.js";

const TTL_SECONDS = 6 * 3600;
const MAX_EVENTS = 60;
const BASE = "https://www.berlin.de/sen/web/service/maerkte-feste";
const FESTIVALS_URL = `${BASE}/strassen-volksfeste/index.php/index/all.json?q=`;
const MARKETS_URL = `${BASE}/weihnachtsmaerkte/index.php/index/all.json?q=`;
const DAY_MS = 24 * 3600 * 1000;

// "24.12.2026" -> timestamp (midnight UTC), or null.
function germanDate(text) {
  const m = String(text || "").match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return m ? Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

function allGermanDates(text) {
  return [...String(text || "").matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{4})/g)].map((m) => Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
}

function clean(text, max = 600) {
  return String(text ?? "").replace(/<[^>]*>/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

async function loadJson(url) {
  const data = JSON.parse(await fetchText(url, 9000, { Accept: "application/json" }));
  return Array.isArray(data) ? data : data.index || [];
}

function festivals(rows, today) {
  return rows.map((r) => {
    const from = germanDate(r.von);
    const to = germanDate(r.bis) || from;
    return {
      id: `fest-${r.id}`,
      title: clean(r.bezeichnung, 120),
      category: "Volksfest",
      from, to,
      time: clean(r.zeit, 160),
      district: clean(r.bezirk, 60),
      address: clean([r.strasse, r.plz].filter(Boolean).join(", "), 160),
      organizer: clean(r.veranstalter, 120),
      url: /^https?:\/\//.test(r.www || "") ? r.www : "https://www.berlin.de/events/volksfeste/",
      description: clean(r.bemerkungen),
    };
  }).filter((e) => e.title && e.from && e.to >= today);
}

// The market list keeps old seasons; only markets with a date in the future are kept.
function christmasMarkets(rows, today) {
  return rows.map((r) => {
    const dates = [germanDate(r.von), germanDate(r.bis), ...allGermanDates(r.oeffnungszeiten)].filter(Boolean);
    if (!dates.length) return null;
    return {
      id: `xmas-${r.id}`,
      title: clean(r.name, 120),
      category: "Weihnachtsmarkt",
      from: Math.min(...dates),
      to: Math.max(...dates),
      time: clean(r.oeffnungszeiten, 160),
      district: clean(r.bezirk, 60),
      address: clean([r.strasse, r.plz_ort].filter(Boolean).join(", "), 160),
      organizer: clean(r.veranstalter, 120),
      url: /^https?:\/\//.test(r.www || "") ? r.www : "https://www.berlin.de/weihnachtsmarkt/",
      description: clean(r.bemerkungen),
    };
  }).filter((e) => e && e.title && e.to >= today);
}

async function build() {
  const today = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  const [fest, xmas] = await Promise.allSettled([loadJson(FESTIVALS_URL), loadJson(MARKETS_URL)]);
  if (fest.status === "rejected" && xmas.status === "rejected") throw new Error("events unavailable");
  const events = [
    ...(fest.status === "fulfilled" ? festivals(fest.value, today) : []),
    ...(xmas.status === "fulfilled" ? christmasMarkets(xmas.value, today) : []),
  ].sort((a, b) => a.from - b.from).slice(0, MAX_EVENTS);
  return { updatedAt: Date.now(), source: "berlin.de Open Data", events };
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/events", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const response = json(await build(), 200, { "cache-control": `public, max-age=${TTL_SECONDS}` });
    context.waitUntil(cache.put(key, response.clone()));
    return response;
  } catch (e) {
    return json({ error: "events_unavailable" }, 503);
  }
}
