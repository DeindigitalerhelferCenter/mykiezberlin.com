// Short list of events worth a phone notification. The app polls this list.
import { loadBerlinMatches } from "../_lib/matches.js";
import { weekStars } from "../_lib/stars.js";
import { db } from "../_lib/util.js";
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

// Hourly reminder 08:00–21:00 Berlin time: a current Berlin headline or an invitation to use the app.
// The app shows kind "hourly" with its own daily quota, so urgent alerts are never crowded out.
const HOURLY_FIRST = 8;
const HOURLY_LAST = 21;
const NEWS_FEEDS = [
  ["rbb24", "https://www.rbb24.de/aktuell/index.xml/feed=rss.xml"],
  ...RSS,
];
const PROMOS = [
  { screen: "ADD_STORY", de: ["📸 Was passiert in deinem Kiez?", "Teile deine Story – ganz Berlin sieht sie."], tr: ["📸 Mahallende neler oluyor?", "Hikâyeni paylaş, tüm Berlin görsün."], en: ["📸 What's happening in your Kiez?", "Share your story – all of Berlin will see it."] },
  { screen: "REPORTER", de: ["📰 Hast du Neuigkeiten aus Berlin?", "Werde Kiez-Reporter und schreib deine Meldung."], tr: ["📰 Berlin'den bir haberin mi var?", "Mahalle muhabiri ol, haberini yaz."], en: ["📰 Got news from Berlin?", "Become a Kiez reporter and post it."] },
  { screen: "COMMUNITY", de: ["🛋️ Etwas zu verkaufen?", "Gib kostenlos eine Kleinanzeige auf."], tr: ["🛋️ Satmak istediğin bir şey mi var?", "Ücretsiz ilan ver."], en: ["🛋️ Something to sell?", "Post a free classified ad."] },
  { screen: "JOBS", de: ["💼 Job oder Mitarbeiter gesucht?", "Aktuelle Stellen in Berlin – jetzt ansehen."], tr: ["💼 İş mi arıyorsun, eleman mı?", "Berlin'deki güncel iş ilanlarına göz at."], en: ["💼 Looking for a job or staff?", "See current jobs in Berlin."] },
  { screen: "WERBEN", de: ["🏪 Mach deinen Laden bekannt", "Zeig deinen Betrieb ganz Berlin – 3 Monate nur 19 €."], tr: ["🏪 Dükkânını Berlinlilere tanıt", "İşletmeni tüm Berlin'e göster – ilk 3 ay sadece 19 €."], en: ["🏪 Promote your shop", "Show your business to all of Berlin – 3 months only €19."] },
  { screen: "ADD_STORY", de: ["📲 News aus WhatsApp bekommen?", "„Teilen → My Kiez Berlin“ – mit einem Tipp wird daraus eine Story."], tr: ["📲 WhatsApp'tan bir haber mi geldi?", "„Paylaş → My Kiez Berlin“ ile tek dokunuşla hikâye yap."], en: ["📲 Got news on WhatsApp?", "“Share → My Kiez Berlin” turns it into a story in one tap."] },
  { screen: "EVENTS", de: ["🎟️ Was geht am Wochenende?", "Märkte, Feste und Events in Berlin."], tr: ["🎟️ Hafta sonu Berlin'de ne var?", "Pazarlar, festivaller ve etkinlikler."], en: ["🎟️ What's on this weekend?", "Markets, festivals and events in Berlin."] },
  { screen: "DEALS", de: ["🏷️ Gutscheine aus deinem Kiez", "Spar bei Läden und Cafés in deiner Nähe."], tr: ["🏷️ Mahallendeki kuponlar", "Yakınındaki dükkân ve kafelerde tasarruf et."], en: ["🏷️ Coupons from your Kiez", "Save at shops and cafés near you."] },
  { screen: "REPORTER", de: ["🗣️ Deine Meinung zählt", "Kommentiere die Meldungen aus deinem Kiez."], tr: ["🗣️ Senin fikrin önemli", "Mahallendeki haberlere yorum yaz."], en: ["🗣️ Your opinion counts", "Comment on news from your Kiez."] },
  { screen: "COMMUNITY", de: ["🤝 Nachbarn helfen Nachbarn", "Suchen, verschenken, tauschen – in der Kiez-Community."], tr: ["🤝 Komşu komşuya", "Ara, hediye et, takas et – mahalle topluluğunda."], en: ["🤝 Neighbours helping neighbours", "Search, give away, swap – in the Kiez community."] },
  { screen: "SPORTS_AND_MARKETS", de: ["⚽ Hertha, Union & Co.", "Ergebnisse, Tabelle und nächster Spieltag."], tr: ["⚽ Hertha, Union ve diğerleri", "Sonuçlar, puan durumu ve sıradaki maçlar."], en: ["⚽ Hertha, Union & co.", "Results, table and next matchday."] },
  { screen: "KIEZ_MATCH", de: ["🧭 Welcher Kiez passt zu dir?", "Mach das Quiz in 2 Minuten."], tr: ["🧭 Sana hangi Kiez uyuyor?", "2 dakikada testi çöz."], en: ["🧭 Which Kiez suits you?", "Take the 2-minute quiz."] },
  { screen: "NOTRUF", de: ["🆘 Wichtige Nummern griffbereit", "Notruf, Ärzte und Hilfe in Berlin – alles an einem Ort."], tr: ["🆘 Önemli numaralar elinin altında", "Acil, doktor ve yardım hatları tek yerde."], en: ["🆘 Important numbers at hand", "Emergency, doctors and help in Berlin – all in one place."] },
];

function berlinClock(now) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(now)).map((p) => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

async function latestHeadline() {
  const lists = await Promise.allSettled(NEWS_FEEDS.map(async ([source, url]) => parseRss(await fetchText(url), 5).map((item) => ({ ...item, source }))));
  const items = lists.flatMap((l) => (l.status === "fulfilled" ? l.value : [])).filter((i) => i.title);
  items.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
  return items[0] || null;
}

async function hourlyItem(now) {
  const { day, hour } = berlinClock(now);
  if (hour < HOURLY_FIRST || hour > HOURLY_LAST) return [];
  const id = `hourly-${day}-${hour}`;
  const dayNumber = Math.floor(now / 86400000);
  // Even hours: Berlin news (if a feed answers), odd hours: invitation. Order shifts every day.
  if (hour % 2 === 0) {
    const news = await latestHeadline().catch(() => null);
    if (news) {
      const title = `📰 ${news.source}`;
      return [{ id, kind: "hourly", title, body: news.title, screen: "LIVE_BULLETIN", title_tr: title, body_tr: news.title, title_en: title, body_en: news.title }];
    }
  }
  const promo = PROMOS[(hour + dayNumber * 5) % PROMOS.length];
  return [{
    id, kind: "hourly", screen: promo.screen,
    title: promo.de[0], body: promo.de[1],
    title_tr: promo.tr[0], body_tr: promo.tr[1],
    title_en: promo.en[0], body_en: promo.en[1],
  }];
}

// One-off test on the evening of 9 Nov 2026 (user request): 23:10, 23:30, 00:00, 00:30 Berlin time.
// Each slot stays in the list 25 minutes so the app (polls every 15 min) catches it. Ends by itself after 01:00.
const TEST_SLOTS = ["2026-11-09T23:10:00+01:00", "2026-11-09T23:30:00+01:00", "2026-11-10T00:00:00+01:00", "2026-11-10T00:30:00+01:00"];
function eveningTest(now) {
  return TEST_SLOTS.map((iso, i) => [Date.parse(iso), i])
    .filter(([start]) => now >= start && now < start + 25 * 60000)
    .map(([start, i]) => ({
      id: `test-${start}`, kind: "test", screen: "ADD_STORY",
      title: `🔔 Test ${i + 1}/4 – My Kiez Berlin`, body: "Testbenachrichtigung: Wenn du das siehst, funktionieren die Meldungen.",
      title_tr: `🔔 Test ${i + 1}/4 – My Kiez Berlin`, body_tr: "Test bildirimi: Bunu görüyorsan bildirimler çalışıyor.",
      title_en: `🔔 Test ${i + 1}/4 – My Kiez Berlin`, body_en: "Test notification: if you see this, notifications work.",
    }));
}

// Monday 09:00–12:00 Berlin: last week's Kiez-Star (only when someone shared stories).
async function weeklyStar(env, now) {
  const { day, hour } = berlinClock(now);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", weekday: "short" }).format(new Date(now));
  if (weekday !== "Mon" || hour < 9 || hour > 11) return [];
  const database = await db(env);
  if (!database) return [];
  const stars = await weekStars(database, now);
  const winner = stars.lastWeek.top[0];
  if (!winner) return [];
  return [{
    id: `star-${day}`, kind: "star", screen: "HOME",
    title: "🏆 Kiez-Star der Woche", body: `${winner.name} hat letzte Woche ${winner.count} Stories geteilt – Glückwunsch!`,
    title_tr: "🏆 Haftanın Kiez Yıldızı", body_tr: `${winner.name} geçen hafta ${winner.count} hikâye paylaştı – tebrikler!`,
    title_en: "🏆 Kiez Star of the week", body_en: `${winner.name} shared ${winner.count} stories last week – congratulations!`,
  }];
}

// Story planner: every planned story gets a notification when it goes live (window 40 minutes).
async function plannedStories(env, now) {
  const database = await db(env);
  if (!database) return [];
  const { results } = await database
    .prepare(`SELECT id, headline, kiez FROM stories WHERE status = 'approved' AND by_admin = 1 AND approved_at <= ? AND approved_at > ? AND approved_at > created_at + 300000 ORDER BY approved_at DESC LIMIT 5`)
    .bind(now, now - 40 * 60000)
    .all();
  return results.map((s) => ({
    id: `story-${s.id}`, kind: "story", screen: "HOME",
    title: "🆕 Neue Kiez-Story", body: `${s.headline} (${s.kiez})`,
    title_tr: "🆕 Yeni Kiez hikâyesi", body_tr: `${s.headline} (${s.kiez})`,
    title_en: "🆕 New Kiez story", body_en: `${s.headline} (${s.kiez})`,
  }));
}

async function build(env) {
  const now = Date.now();
  const [warnings, alerts, matches, hourly, star, planned] = await Promise.allSettled([officialWarnings(), urgentAlerts(now), loadBerlinMatches(), hourlyItem(now), weeklyStar(env, now), plannedStories(env, now)]);
  const value = (r) => (r.status === "fulfilled" ? r.value : []);
  return [...value(warnings), ...value(alerts), ...value(matches).flatMap((m) => matchEvents(m, now)), ...value(hourly), ...eveningTest(now), ...value(star), ...value(planned)];
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/notify", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const response = json({ updatedAt: Date.now(), items: await build(context.env) }, 200, { "cache-control": `public, max-age=${TTL_SECONDS}` });
  context.waitUntil(cache.put(key, response.clone()));
  return response;
}
