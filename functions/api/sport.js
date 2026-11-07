// Real Bundesliga tables and matches from OpenLigaDB.
import { fetchJson, json } from "../_lib/util.js";

const TTL_SECONDS = 900;
const API = "https://api.openligadb.de";
const LEAGUES = [["bl1", "1. Bundesliga"], ["bl2", "2. Bundesliga"], ["del", "DEL Eishockey"]];
const BERLIN_TEAMS = /(Union Berlin|Hertha|Eisbären)/i;

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
  const [table, matches] = await Promise.all([fetchJson(`${API}/getbltable/${id}/${season}`), fetchJson(`${API}/getmatchdata/${id}`)]);
  return {
    id,
    name,
    leagueId: matches[0]?.leagueId,
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
  };
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
  return { updatedAt: Date.now(), season, leagues, berlin };
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
