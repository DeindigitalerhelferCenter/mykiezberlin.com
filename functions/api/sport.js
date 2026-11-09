// Real league tables: Germany from OpenLigaDB, Süper Lig computed from football-data.co.uk results.
import { fetchJson, fetchText, json } from "../_lib/util.js";

const TTL_SECONDS = 900;
// Results stay visible for a few hours after the last match of a matchday.
const NEXT_MATCHDAY_AFTER_MS = 3 * 3600 * 1000;
const API = "https://api.openligadb.de";
const LEAGUES = [["bl1", "1. Bundesliga"], ["bl2", "2. Bundesliga"], ["del", "DEL Eishockey"]];
const BERLIN_TEAMS = /(Union Berlin|Hertha|Eisbären)/i;
const SUPER_LIG_SOURCE = "football-data.co.uk";
const SUPER_LIG_RECENT_MATCHES = 9;
const TURKISH_BIG_CLUBS = /^(Galatasaray|Fenerbahçe|Beşiktaş|Trabzonspor)$/;
const TURKISH_NAMES = {
  Fenerbahce: "Fenerbahçe", Besiktas: "Beşiktaş", Kasimpasa: "Kasımpaşa", Corum: "Çorum FK", Goztep: "Göztepe",
  Buyuksehyr: "Başakşehir", Erzurumspor: "Erzurumspor", Rizespor: "Çaykur Rizespor", Genclerbirligi: "Gençlerbirliği", Eyupspor: "Eyüpspor",
};

// The German football season starts in summer and is named after its first year.
function currentSeason() {
  const now = new Date();
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

function goals(match) {
  const final = (match.matchResults || []).find((r) => r.resultTypeID === 2) || match.matchResults?.[0];
  return final ? [final.pointsTeam1, final.pointsTeam2] : [null, null];
}

function matchRow(m) {
  const [homeGoals, awayGoals] = goals(m);
  return {
    kickoff: Date.parse(m.matchDateTimeUTC || m.matchDateTime) || null,
    home: m.team1?.shortName || m.team1?.teamName,
    away: m.team2?.shortName || m.team2?.teamName,
    homeGoals,
    awayGoals,
    finished: Boolean(m.matchIsFinished),
  };
}

function matchText(m) {
  if (!m?.team1) return "";
  const row = matchRow(m);
  const when = row.kickoff ? new Date(row.kickoff).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }) : "";
  const score = row.finished ? ` ${row.homeGoals}:${row.awayGoals}` : "";
  return `${row.home} – ${row.away}${score} (${when})`;
}

async function loadLeague([id, name], season) {
  const [table, current] = await Promise.all([fetchJson(`${API}/getbltable/${id}/${season}`), fetchJson(`${API}/getmatchdata/${id}`)]);
  // OpenLigaDB keeps a finished matchday as "current" until the next one starts,
  // so after the last final whistle the next matchday is shown instead.
  let matches = current;
  let previousMatches = [];
  const group = current[0]?.group;
  const lastKickoff = Math.max(0, ...current.map((m) => Date.parse(m.matchDateTimeUTC || m.matchDateTime) || 0));
  if (current.length && current.every((m) => m.matchIsFinished) && Date.now() - lastKickoff > NEXT_MATCHDAY_AFTER_MS && group?.groupOrderID) {
    const next = await fetchJson(`${API}/getmatchdata/${id}/${season}/${group.groupOrderID + 1}`).catch(() => []);
    if (Array.isArray(next) && next.length) {
      previousMatches = current;
      matches = next;
    }
  }
  return {
    id,
    name,
    leagueId: current[0]?.leagueId,
    matchday: matches[0]?.group?.groupName || "",
    previousMatchday: previousMatches[0]?.group?.groupName || "",
    table: table.map((t, i) => ({
      position: i + 1,
      teamId: t.teamInfoId,
      team: t.teamName,
      short: t.shortName,
      icon: t.teamIconUrl,
      played: t.matches,
      won: t.won,
      draw: t.draw,
      lost: t.lost,
      goals: t.goals,
      opponentGoals: t.opponentGoals,
      goalDiff: t.goalDiff,
      points: t.points,
      berlin: BERLIN_TEAMS.test(t.teamName),
    })),
    matches: matches.map(matchRow),
    previousMatches: previousMatches.map(matchRow),
  };
}

function parseCsv(text) {
  const [header, ...lines] = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const columns = header.split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(columns.map((name, i) => [name, cells[i]]));
  });
}

function superLigKickoff(date, time) {
  const [day, month, year] = date.split("/").map(Number);
  const [hour, minute] = (time || "0:0").split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute);
}

// The source lists results only, so the table is added up here: 3 points per win, then goal difference.
async function loadSuperLig(season) {
  const code = `${String(season).slice(2)}${String(season + 1).slice(2)}`;
  const results = parseCsv(await fetchText(`https://www.football-data.co.uk/mmz4281/${code}/T1.csv`))
    .filter((r) => r.HomeTeam && r.FTHG !== "" && r.FTHG !== undefined)
    .map((r) => ({
      kickoff: superLigKickoff(r.Date, r.Time),
      home: TURKISH_NAMES[r.HomeTeam] || r.HomeTeam,
      away: TURKISH_NAMES[r.AwayTeam] || r.AwayTeam,
      homeGoals: Number(r.FTHG),
      awayGoals: Number(r.FTAG),
      finished: true,
    }));
  if (!results.length) throw new Error("no results");

  const teams = new Map();
  const add = (team, scored, conceded) => {
    const row = teams.get(team) || { team, short: team, played: 0, won: 0, draw: 0, lost: 0, goals: 0, opponentGoals: 0 };
    row.played += 1;
    row.goals += scored;
    row.opponentGoals += conceded;
    if (scored > conceded) row.won += 1;
    else if (scored === conceded) row.draw += 1;
    else row.lost += 1;
    teams.set(team, row);
  };
  for (const m of results) {
    add(m.home, m.homeGoals, m.awayGoals);
    add(m.away, m.awayGoals, m.homeGoals);
  }
  const table = [...teams.values()]
    .map((t) => ({ ...t, points: t.won * 3 + t.draw, goalDiff: t.goals - t.opponentGoals, berlin: TURKISH_BIG_CLUBS.test(t.team) }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goals - a.goals)
    .map((t, i) => ({ ...t, position: i + 1 }));
  return { id: "tsl", name: "Süper Lig", source: SUPER_LIG_SOURCE, table, matches: results.slice(-SUPER_LIG_RECENT_MATCHES).reverse() };
}

async function berlinClub(team, league) {
  const [last, next] = await Promise.allSettled([
    fetchJson(`${API}/getlastmatchbyleagueteam/${league.leagueId}/${team.teamId}`),
    fetchJson(`${API}/getnextmatchbyleagueteam/${league.leagueId}/${team.teamId}`),
  ]);
  return {
    team: team.team,
    league: league.name,
    position: team.position,
    points: team.points,
    lastMatch: last.status === "fulfilled" ? matchText(last.value) : "",
    nextMatch: next.status === "fulfilled" ? matchText(next.value) : "",
  };
}

async function build() {
  const season = currentSeason();
  const leagues = await Promise.all(LEAGUES.map((l) => loadLeague(l, season)));
  const berlin = await Promise.all(leagues.flatMap((l) => l.table.filter((t) => t.berlin).map((t) => berlinClub(t, l))));
  // A problem with this extra source must never take the German tables down.
  const superLig = await loadSuperLig(season).catch(() => null);
  return { updatedAt: Date.now(), season, leagues: superLig ? [...leagues, superLig] : leagues, berlin };
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/sport", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const response = json(await build(), 200, { "cache-control": `public, max-age=${TTL_SECONDS}` });
    context.waitUntil(cache.put(key, response.clone()));
    return response;
  } catch (e) {
    return json({ error: "sport_unavailable" }, 503);
  }
}
