// Current matchday of the Berlin football clubs, with goals from OpenLigaDB.
import { fetchJson } from "./util.js";

const API = "https://api.openligadb.de";
const LEAGUES = [["bl1", "1. Bundesliga"], ["bl2", "2. Bundesliga"]];
const BERLIN_CLUBS = /(Hertha|Union Berlin)/i;
const FOCUS_CLUB = /Hertha/i;
const MATCH_LENGTH_MS = 150 * 60000;

// The goal list holds running scores, so each step shows who actually scored.
function goalEvents(match, homeIsBerlin, awayIsBerlin) {
  let home = 0;
  let away = 0;
  const events = [];
  for (const g of match.goals || []) {
    if (g.scoreTeam1 == null || g.scoreTeam2 == null) continue;
    const homeScored = g.scoreTeam1 > home;
    home = g.scoreTeam1;
    away = g.scoreTeam2;
    events.push({
      id: String(g.goalID),
      minute: g.matchMinute,
      scorer: g.goalGetterName || "",
      score: `${home}:${away}`,
      team: homeScored ? match.team1.teamName : match.team2.teamName,
      forBerlin: homeScored ? homeIsBerlin : awayIsBerlin,
      ownGoal: Boolean(g.isOwnGoal),
      penalty: Boolean(g.isPenalty),
    });
  }
  return events;
}

function toMatch(m, leagueName, now) {
  const homeIsBerlin = BERLIN_CLUBS.test(m.team1.teamName);
  const awayIsBerlin = BERLIN_CLUBS.test(m.team2.teamName);
  const kickoff = Date.parse(m.matchDateTimeUTC || m.matchDateTime) || 0;
  const goals = goalEvents(m, homeIsBerlin, awayIsBerlin);
  return {
    id: String(m.matchID),
    league: leagueName,
    home: m.team1.teamName,
    away: m.team2.teamName,
    kickoff,
    score: goals.at(-1)?.score || "0:0",
    finished: Boolean(m.matchIsFinished),
    live: !m.matchIsFinished && kickoff <= now && now < kickoff + MATCH_LENGTH_MS,
    focus: FOCUS_CLUB.test(m.team1.teamName) || FOCUS_CLUB.test(m.team2.teamName),
    goals,
  };
}

export async function loadBerlinMatches() {
  const now = Date.now();
  const leagues = await Promise.allSettled(LEAGUES.map(async ([id, name]) => {
    const matches = await fetchJson(`${API}/getmatchdata/${id}`);
    return matches.filter((m) => BERLIN_CLUBS.test(`${m.team1?.teamName} ${m.team2?.teamName}`)).map((m) => toMatch(m, name, now));
  }));
  if (leagues.every((l) => l.status === "rejected")) throw new Error("matches unavailable");
  return leagues.flatMap((l) => (l.status === "fulfilled" ? l.value : []));
}
