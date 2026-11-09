// "Kiez-Stars der Woche": approved stories per name, Monday 00:00 – Sunday 24:00 Berlin time.
// Admin posts and the editorial / Instagram accounts are not ranked.

const WEEK_MS = 7 * 86400000;
const NOT_RANKED = new Set(["", "kiez community", "kiez-user", "admin", "my kiez berlin", "kiez-redaktion", "berliner nachbar"]);

// Badges per week
export const BADGES = [
  { min: 12, id: "gold", de: "Gold-Kiez-Reporter", tr: "Altın Kiez Muhabiri", en: "Gold Kiez Reporter", icon: "🥇" },
  { min: 7, id: "silver", de: "Silber-Kiez-Reporter", tr: "Gümüş Kiez Muhabiri", en: "Silver Kiez Reporter", icon: "🥈" },
  { min: 3, id: "bronze", de: "Bronze-Kiez-Reporter", tr: "Bronz Kiez Muhabiri", en: "Bronze Kiez Reporter", icon: "🥉" },
];

export function badgeFor(count) {
  return BADGES.find((b) => count >= b.min) || null;
}

// Start of the current Berlin week (Monday 00:00) in ms.
export function berlinWeekStart(now) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", weekday: "short" })
      .formatToParts(new Date(now)).map((p) => [p.type, p.value]),
  );
  const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offset = wall - Math.floor(now / 1000) * 1000;
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday);
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day - weekday) - offset;
}

export function weekKey(weekStart) {
  return new Date(weekStart + 3 * 3600000).toISOString().slice(0, 10);
}

async function ranking(database, from, to) {
  const { results } = await database
    .prepare(`SELECT author, COUNT(*) AS count, MAX(approved_at) AS last FROM stories WHERE status IN ('approved', 'expired') AND approved_at >= ? AND approved_at < ? AND COALESCE(by_admin, 0) = 0 AND kind != 'instagram' GROUP BY LOWER(TRIM(author)) ORDER BY count DESC, last ASC LIMIT 50`)
    .bind(from, to)
    .all();
  return results
    .map((r) => ({ name: String(r.author || "").trim(), count: Number(r.count) || 0 }))
    .filter((r) => r.name && !NOT_RANKED.has(r.name.toLowerCase()) && !r.name.startsWith("@"));
}

export async function weekStars(database, now = Date.now()) {
  const start = berlinWeekStart(now);
  const [current, last] = await Promise.all([ranking(database, start, start + WEEK_MS), ranking(database, start - WEEK_MS, start)]);
  const withBadge = (list) => list.map((r, i) => ({ ...r, rank: i + 1, badge: badgeFor(r.count) }));
  return {
    week: weekKey(start),
    weekStart: start,
    weekEnd: start + WEEK_MS,
    top: withBadge(current).slice(0, 10),
    lastWeek: { week: weekKey(start - WEEK_MS), top: withBadge(last).slice(0, 3) },
    badges: BADGES,
    all: current,
  };
}
