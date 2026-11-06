// Real Berlin data: official alerts, press headlines, weather and rates.
import { fetchJson, fetchText, json, parseRss, stripTags } from "../_lib/util.js";

const TTL_SECONDS = 180;

const STYLE = {
  polizei: { tag: "POLIZEI BERLIN", color: "#003399", bgLight: "#E8EEFB" },
  feuerwehr: { tag: "FEUERWEHR", color: "#D32F2F", bgLight: "#FDECEA" },
  bvg: { tag: "BVG", color: "#B58900", bgLight: "#FFF8DC" },
  sbahn: { tag: "S-BAHN BERLIN", color: "#008754", bgLight: "#E6F4EA" },
};

const PRESS = [
  ["rbb24", "https://www.rbb24.de/aktuell/index.xml/feed=rss.xml"],
  ["Tagesspiegel", "https://www.tagesspiegel.de/contentexport/feed/berlin"],
  ["Berliner Kurier", "https://www.berliner-kurier.de/feed.xml"],
];

const SPORT_FEED = "https://www.rbb24.de/sport/index.xml/feed=rss.xml";

// S-Bahn has no public feed; these hubs expose its live HAFAS remarks.
const SBAHN_HUBS = ["900100003", "900120003", "900023201", "900058101"];

async function rssAlerts(url, key, limit) {
  const items = parseRss(await fetchText(url), limit);
  return items.map((item) => ({
    id: `${key}-${item.link}`,
    source: key,
    ...STYLE[key],
    title: item.title,
    body: item.summary && !/^Ereignisort|^Polizeimeldung$/i.test(item.summary) ? item.summary : item.title,
    url: item.link,
    publishedAt: item.publishedAt,
  }));
}

async function bvgAlerts() {
  const data = await fetchJson("https://www.bvg.de/disruption-reports-service/disruptions/v1/de");
  const now = Date.now();
  return (data.elements || [])
    .filter((e) => !e.endDate || Date.parse(e.endDate) > now)
    .slice(0, 12)
    .map((e) => ({
      id: `bvg-${e.id}`,
      source: "bvg",
      ...STYLE.bvg,
      title: stripTags(e.content?.[0]?.headline || e.disruptionTypes?.[0]?.displayName || "BVG-Meldung"),
      body: stripTags(e.content?.[0]?.content || "").slice(0, 280),
      url: "https://www.bvg.de/de/verbindungen/stoerungsmeldungen",
      publishedAt: Date.parse(e.startDate || e.lastModified || "") || null,
    }));
}

async function sbahnAlerts() {
  const seen = new Map();
  const results = await Promise.allSettled(
    SBAHN_HUBS.map((id) => fetchJson(`https://v6.vbb.transport.rest/stops/${id}/departures?duration=60&results=40&remarks=true&language=de`)),
  );
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const dep of result.value.departures || []) {
      if (dep.line?.product !== "suburban") continue;
      for (const remark of dep.remarks || []) {
        if (remark.type !== "warning" && remark.type !== "status") continue;
        const text = stripTags(remark.text || "");
        if (text && !seen.has(text)) {
          seen.set(text, {
            id: `sbahn-${seen.size}-${text.slice(0, 24)}`,
            source: "sbahn",
            ...STYLE.sbahn,
            title: `${dep.line.name}: ${stripTags(remark.summary || "Betriebsmeldung")}`,
            body: text.slice(0, 280),
            url: "https://sbahn.berlin/fahren/bauen-stoerung/",
            publishedAt: Date.parse(remark.modified || "") || null,
          });
        }
      }
    }
  }
  if (results.every((r) => r.status === "rejected")) throw new Error("VBB unavailable");
  return [...seen.values()].slice(0, 8);
}

async function press() {
  const lists = await Promise.allSettled(PRESS.map(async ([name, url]) => parseRss(await fetchText(url), 8).map((i) => ({ ...i, source: name }))));
  const items = lists.flatMap((l) => (l.status === "fulfilled" ? l.value : []));
  if (!items.length) throw new Error("press unavailable");
  return items.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)).slice(0, 18);
}

async function sport() {
  return parseRss(await fetchText(SPORT_FEED), 8).map((i) => ({ ...i, source: "rbb24 Sport" }));
}

async function weather() {
  const d = await fetchJson("https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.405&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin&forecast_days=5");
  return {
    temperature: d.current?.temperature_2m,
    code: d.current?.weather_code,
    wind: d.current?.wind_speed_10m,
    days: (d.daily?.time || []).map((date, i) => ({ date, code: d.daily.weather_code[i], max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i] })),
  };
}

async function quotes() {
  const [fx, crypto] = await Promise.allSettled([
    fetchJson("https://open.er-api.com/v6/latest/EUR"),
    fetchJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur"),
  ]);
  const list = [];
  if (fx.status === "fulfilled") {
    for (const code of ["USD", "TRY", "GBP", "CHF"]) {
      if (fx.value.rates?.[code]) list.push({ name: `EUR/${code}`, value: fx.value.rates[code] });
    }
  }
  if (crypto.status === "fulfilled") {
    if (crypto.value.bitcoin?.eur) list.push({ name: "Bitcoin (EUR)", value: crypto.value.bitcoin.eur });
    if (crypto.value.ethereum?.eur) list.push({ name: "Ethereum (EUR)", value: crypto.value.ethereum.eur });
  }
  if (!list.length) throw new Error("rates unavailable");
  return list;
}

async function build() {
  const jobs = {
    polizei: rssAlerts("https://www.berlin.de/polizei/polizeimeldungen/index.php/rss", "polizei", 10),
    feuerwehr: rssAlerts("https://www.berliner-feuerwehr.de/einsaetze.xml", "feuerwehr", 8),
    bvg: bvgAlerts(),
    sbahn: sbahnAlerts(),
    news: press(),
    sport: sport(),
    weather: weather(),
    quotes: quotes(),
  };
  const keys = Object.keys(jobs);
  const settled = await Promise.allSettled(Object.values(jobs));
  const value = {};
  const sources = {};
  settled.forEach((r, i) => {
    sources[keys[i]] = r.status === "fulfilled";
    value[keys[i]] = r.status === "fulfilled" ? r.value : null;
  });
  const alerts = ["polizei", "feuerwehr", "bvg", "sbahn"].flatMap((k) => value[k] || []);
  alerts.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
  return { updatedAt: Date.now(), alerts, news: value.news || [], sport: value.sport || [], weather: value.weather, quotes: value.quotes || [], sources };
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/live", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const body = await build();
  const response = json(body, 200, { "cache-control": `public, max-age=${TTL_SECONDS}` });
  if (Object.values(body.sources).some(Boolean)) context.waitUntil(cache.put(key, response.clone()));
  return response;
}
