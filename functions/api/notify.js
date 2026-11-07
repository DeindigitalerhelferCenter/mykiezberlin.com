// Short list of events worth a phone notification. The app polls this list.
import { loadBerlinMatches } from "../_lib/matches.js";
import { fetchJson, fetchText, json, parseRss } from "../_lib/util.js";

const TTL_SECONDS = 120;
const ALERT_WINDOW_MS = 3 * 3600000;
const KICKOFF_NOTICE_MS = 30 * 60000;
const RESULT_WINDOW_MS = 4 * 3600000;
const URGENT = /großeinsatz|großbrand|evakuier|bombe|blindgänger|amok|terror|explosion|geiselnahme|öffentlichkeitsfahndung/i;
const NINA_BERLIN = "https://warnung.bund.de/api31/dashboard/110000000000.json";
const RSS = [
  ["Polizei Berlin", "https://www.berlin.de/polizei/polizeimeldungen/index.php/rss"],
  ["Berliner Feuerwehr", "https://www.berliner-feuerwehr.de/einsaetze.xml"],
];

async function officialWarnings() {
  const warnings = await fetchJson(NINA_BERLIN);
  return warnings
    .filter((w) => w.payload?.data?.severity !== "Minor")
    .map((w) => ({
      id: `nina-${w.id}`,
      kind: /Severe|Extreme/.test(w.payload?.data?.severity || "") ? "critical" : "alert",
      title: "Amtliche Warnung für Berlin",
      body: w.i18nTitle?.de || w.payload?.data?.headline || "Warnung",
      screen: "LIVE_BULLETIN",
    }));
}

async function urgentAlerts(now) {
  const lists = await Promise.allSettled(RSS.map(async ([source, url]) => parseRss(await fetchText(url), 12).map((item) => ({ ...item, source }))));
  return lists
    .flatMap((l) => (l.status === "fulfilled" ? l.value : []))
    .filter((item) => URGENT.test(item.title) && now - (item.publishedAt || 0) < ALERT_WINDOW_MS)
    .map((item) => ({ id: `rss-${item.link}`, kind: "alert", title: item.source, body: item.title, screen: "LIVE_BULLETIN" }));
}

function matchEvents(match, now) {
  const pairing = `${match.home} – ${match.away}`;
  const events = [];
  if (match.finished) {
    if (now - match.kickoff < RESULT_WINDOW_MS) events.push({ id: `final-${match.id}`, kind: "match", title: "Abpfiff", body: `${pairing} ${match.score}`, screen: "SPORTS_AND_MARKETS" });
    return events;
  }
  if (!match.focus) return events;
  if (match.kickoff > now && match.kickoff - now < KICKOFF_NOTICE_MS) {
    events.push({ id: `kickoff-${match.id}`, kind: "match", title: "Gleich geht's los", body: pairing, screen: "SPORTS_AND_MARKETS" });
  }
  if (match.live) {
    for (const goal of match.goals.filter((g) => g.forBerlin).slice(-1)) {
      events.push({ id: `goal-${goal.id}`, kind: "match", title: `Tor für ${goal.team}!`, body: `${goal.scorer} ${goal.minute}' · ${pairing} ${goal.score}`, screen: "SPORTS_AND_MARKETS" });
    }
  }
  return events;
}

async function build() {
  const now = Date.now();
  const [warnings, alerts, matches] = await Promise.allSettled([officialWarnings(), urgentAlerts(now), loadBerlinMatches()]);
  const value = (r) => (r.status === "fulfilled" ? r.value : []);
  return [...value(warnings), ...value(alerts), ...value(matches).flatMap((m) => matchEvents(m, now))];
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/notify", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const response = json({ updatedAt: Date.now(), items: await build() }, 200, { "cache-control": `public, max-age=${TTL_SECONDS}` });
  context.waitUntil(cache.put(key, response.clone()));
  return response;
}
