// Real Berlin data: official alerts, press headlines, weather and rates.
import { fetchJson, fetchText, json, parseRss, stripTags } from "../_lib/util.js";

const TTL_SECONDS = 180;
const STALE_SECONDS = 3600;

const STYLE = {
  polizei: { tag: "POLIZEI BERLIN", color: "#003399", bgLight: "#E8EEFB" },
  feuerwehr: { tag: "FEUERWEHR", color: "#D32F2F", bgLight: "#FDECEA" },
  bvg: { tag: "BVG", color: "#B58900", bgLight: "#FFF8DC" },
  sbahn: { tag: "S-BAHN BERLIN", color: "#008754", bgLight: "#E6F4EA" },
};

const PRESS = [
  ["Tagesspiegel", "https://www.tagesspiegel.de/contentexport/feed/berlin"],
  ["Berliner Kurier", "https://www.berliner-kurier.de/feed.xml"],
];

const SPORT_FEED = "https://www.tagesspiegel.de/contentexport/feed/sport";
const BUSINESS_FEED = "https://www.tagesspiegel.de/contentexport/feed/wirtschaft";

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

// Press items keep only the headline and a link to the publisher: no photo, no teaser.
function headline(item, source) {
  return { title: item.title, link: item.link, publishedAt: item.publishedAt, summary: "", image: "", source };
}

async function press() {
  const lists = await Promise.allSettled(PRESS.map(async ([name, url]) => parseRss(await fetchText(url), 10).map((i) => headline(i, name))));
  const items = lists.flatMap((l) => (l.status === "fulfilled" ? l.value : []));
  if (!items.length) throw new Error("press unavailable");
  return items.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)).slice(0, 18);
}

async function sport() {
  return parseRss(await fetchText(SPORT_FEED), 8).map((i) => headline(i, "Tagesspiegel Sport"));
}

async function business() {
  return parseRss(await fetchText(BUSINESS_FEED), 8).map((i) => headline(i, "Tagesspiegel Wirtschaft"));
}

async function weather() {
  const d = await fetchJson("https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.405&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBerlin&forecast_days=7");
  return {
    temperature: d.current?.temperature_2m,
    feelsLike: d.current?.apparent_temperature,
    code: d.current?.weather_code,
    wind: d.current?.wind_speed_10m,
    humidity: d.current?.relative_humidity_2m,
    observedAt: d.current?.time,
    days: (d.daily?.time || []).map((date, i) => ({
      date,
      code: d.daily.weather_code[i],
      max: d.daily.temperature_2m_max[i],
      min: d.daily.temperature_2m_min[i],
      rainChance: d.daily.precipitation_probability_max[i],
    })),
  };
}

const INDICES = [
  ["DAX40", "DAX 40", "%5EGDAXI", "EUR"],
  ["BIST100", "BIST 100", "XU100.IS", "TRY"],
  ["SP500", "S&P 500", "%5EGSPC", "USD"],
];

async function indexQuote([code, name, symbol, currency]) {
  const d = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
  const meta = d.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error("no price");
  const previous = meta.chartPreviousClose || meta.previousClose;
  return {
    code, name, currency, source: "Yahoo Finance",
    value: meta.regularMarketPrice,
    changePercent: previous ? ((meta.regularMarketPrice - previous) / previous) * 100 : null,
    updatedAt: meta.regularMarketTime ? meta.regularMarketTime * 1000 : null,
  };
}

// Truncgil numbers use Turkish formatting such as "6.435,96" or "%-0,14".
function turkishNumber(text) {
  const n = Number(String(text ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function turkishRates() {
  const d = await fetchJson("https://finans.truncgil.com/today.json");
  const updatedAt = Date.parse(String(d.Update_Date || "").replace(" ", "T") + "+03:00") || null;
  const rows = [["USD", "USD/TRY", "Dolar / TL", "TRY"], ["EUR", "EUR/TRY", "Euro / TL", "TRY"], ["gram-altin", "GOLD_GRAM", "Gram Altın", "TRY"], ["ons", "GOLD_OUNCE", "Ons Altın", "USD"]];
  return rows.filter(([key]) => d[key]).map(([key, code, name, currency]) => ({
    code, name, currency, source: "Truncgil",
    value: turkishNumber(d[key]["Satış"]),
    changePercent: turkishNumber(d[key]["Değişim"]),
    updatedAt,
  }));
}

async function exchangeRates() {
  const d = await fetchJson("https://open.er-api.com/v6/latest/EUR");
  const updatedAt = (d.time_last_update_unix || 0) * 1000 || null;
  return ["USD", "GBP", "CHF"].filter((c) => d.rates?.[c]).map((c) => ({
    code: `EUR/${c}`, name: `EUR/${c}`, currency: c, source: "ExchangeRate-API", value: d.rates[c], changePercent: null, updatedAt,
  }));
}

async function cryptoRates() {
  const d = await fetchJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true&include_last_updated_at=true");
  return [["bitcoin", "BTC", "Bitcoin"], ["ethereum", "ETH", "Ethereum"]].filter(([id]) => d[id]?.eur).map(([id, code, name]) => ({
    code, name, currency: "EUR", source: "CoinGecko",
    value: d[id].eur,
    changePercent: d[id].eur_24h_change ?? null,
    updatedAt: (d[id].last_updated_at || 0) * 1000 || null,
  }));
}

// Yahoo answers Cloudflare Workers reliably and updates every minute; Truncgil and
// CoinGecko often refuse Worker requests, and open.er-api only changes once a day.
const YAHOO_RATES = [
  ["USD/TRY", "Dolar / TL", "TRY=X", "TRY"],
  ["EUR/TRY", "Euro / TL", "EURTRY=X", "TRY"],
  ["EUR/USD", "EUR/USD", "EURUSD=X", "USD"],
  ["EUR/GBP", "EUR/GBP", "EURGBP=X", "GBP"],
  ["EUR/CHF", "EUR/CHF", "EURCHF=X", "CHF"],
  ["BTC", "Bitcoin", "BTC-EUR", "EUR"],
  ["ETH", "Ethereum", "ETH-EUR", "EUR"],
];
const TROY_OUNCE_GRAMS = 31.1034768;

async function yahooRates() {
  const [rates, gold] = await Promise.all([
    Promise.allSettled(YAHOO_RATES.map((r) => indexQuote(r).then((q) => ({ ...q, source: "Yahoo Finance" })))),
    indexQuote(["GOLD_OUNCE", "Ons Altın", "GC%3DF", "USD"]).catch(() => null),
  ]);
  const list = rates.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const usdTry = list.find((q) => q.code === "USD/TRY");
  if (gold) {
    list.push(gold);
    if (usdTry) {
      list.push({
        code: "GOLD_GRAM", name: "Gram Altın", currency: "TRY", source: "Yahoo Finance (berechnet)",
        value: Math.round((gold.value * usdTry.value) / TROY_OUNCE_GRAMS * 100) / 100,
        changePercent: gold.changePercent != null && usdTry.changePercent != null ? gold.changePercent + usdTry.changePercent : gold.changePercent,
        updatedAt: Math.max(gold.updatedAt || 0, usdTry.updatedAt || 0) || null,
      });
    }
  }
  return list;
}

const RATE_ORDER = ["USD/TRY", "EUR/TRY", "GOLD_GRAM", "GOLD_OUNCE", "EUR/USD", "EUR/GBP", "EUR/CHF", "BTC", "ETH"];

async function quotes() {
  const groups = await Promise.allSettled([...INDICES.map(indexQuote), turkishRates(), exchangeRates(), cryptoRates(), yahooRates()]);
  const [yahoo] = groups.splice(groups.length - 1, 1);
  const list = groups.flatMap((g) => (g.status === "fulfilled" ? g.value : []));
  const live = yahoo.status === "fulfilled" ? yahoo.value : [];
  // Fill missing rates from Yahoo; replace the once-a-day EUR/x rates with live ones.
  for (const q of live) {
    const i = list.findIndex((x) => x.code === q.code);
    if (i < 0) list.push(q);
    else if (q.code.startsWith("EUR/") && list[i].source === "ExchangeRate-API") list[i] = q;
  }
  const rank = (q) => {
    const i = RATE_ORDER.indexOf(q.code);
    return INDICES.some(([c]) => c === q.code) ? -1 : i < 0 ? RATE_ORDER.length : i;
  };
  list.sort((a, b) => rank(a) - rank(b));
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
    business: business(),
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
  return { updatedAt: Date.now(), alerts, news: value.news || [], sport: value.sport || [], business: value.business || [], weather: value.weather, quotes: value.quotes || [], sources };
}

async function refresh(cache, key) {
  const body = await build();
  if (Object.values(body.sources).some(Boolean)) {
    await cache.put(key, json(body, 200, { "cache-control": `public, max-age=${STALE_SECONDS}`, "x-built-at": String(Date.now()) }));
  }
  return body;
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/live", context.request.url).toString());
  const hit = await cache.match(key);
  if (!hit) return json(await refresh(cache, key));
  const age = Date.now() - Number(hit.headers.get("x-built-at") || 0);
  if (age > TTL_SECONDS * 1000) context.waitUntil(refresh(cache, key));
  return json(await hit.json());
}
