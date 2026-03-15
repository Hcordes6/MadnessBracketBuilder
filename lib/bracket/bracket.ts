//essentially the "tournament simulator"
// Takes the 64 teams, simulates each matchup based on the slider weights.
// Outputs an array of matches that can be fed directly into the bracket visualizer in builder.tsx

import type { TeamRating } from "@/lib/types/ratings";
import type { BracketTeam, RegionId } from "@/lib/bracket/field";
import type { StatConfig, Weights } from "@/lib/sim/scoring";
import { computeRanges, weightedTeamScore, winProbability } from "@/lib/sim/scoring";
import { stableRandom01 } from "@/lib/sim/prng";

import type {
  Match as RTBMatch,
  Participant as RTBParticipant,
} from "@cm3tahkuh/react-tournament-brackets/dist/src/types";

export type BracketMatch = RTBMatch;

const REGION_PAIRINGS: Array<[number, number]> = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

function pickWinner(params: {
  matchId: number | string;
  teamA: TeamRating;
  teamB: TeamRating;
  stats: StatConfig[];
  weights: Weights;
  randomness: number; // 0..1
  simulationId: number;
  ranges: ReturnType<typeof computeRanges>;
}): { winner: TeamRating; pA: number } {
  const { matchId, teamA, teamB, stats, weights, randomness, simulationId, ranges } = params;

  const r = Math.max(0, Math.min(1, randomness));

  const pA = winProbability({
    teamA,
    teamB,
    stats,
    weights,
    ranges,
    randomness: r,
  });

  // If randomness is disabled, do NOT sample. Pick deterministically.
  if (r === 0) {
    const scoreA = weightedTeamScore({ team: teamA, stats, weights, ranges });
    const scoreB = weightedTeamScore({ team: teamB, stats, weights, ranges });

    if (scoreA === scoreB) {
      return { winner: teamA.Rk <= teamB.Rk ? teamA : teamB, pA };
    }

    return { winner: scoreA > scoreB ? teamA : teamB, pA };
  }

  const draw = stableRandom01(`${simulationId}:${String(matchId)}`);
  const winner = draw < pA ? teamA : teamB;
  return { winner, pA };
}

function toParticipant(team: BracketTeam, isWinner: boolean | undefined): RTBParticipant {
  return {
    id: team.participantId,
    name: team.displayName,
    isWinner,
  };
}

function regionName(region: RegionId): string {
  return ["Region A", "Region B", "Region C", "Region D"][region] ?? `Region ${region + 1}`;
}

function getTeamBySeed(regionTeams: BracketTeam[], seed: number): BracketTeam {
  const found = regionTeams.find((t) => t.seed === seed);
  if (!found) {
    throw new Error(`Missing seed ${seed} in region`);
  }
  return found;
}

export function buildAndSimulateBracket(params: {
  field: BracketTeam[]; // 64 teams
  stats: StatConfig[];
  weights: Weights;
  randomness: number; // 0..1
  simulationId: number;
}): BracketMatch[] {
  const { field, stats, weights, randomness, simulationId } = params;

  const ranges = computeRanges(field.map((f) => f.team), stats);

  let nextId = 1;
  const matches: BracketMatch[] = [];
  const startTime = new Date(0).toISOString();

  const regionChamps: Array<{ region: RegionId; champ: BracketTeam }> = [];

  for (let region = 0 as RegionId; region <= 3; region = (region + 1) as RegionId) {
    const regionTeams = field.filter((t) => t.region === region);
    const rName = regionName(region);

    // Round of 64 (8 matches)
    const r64: Array<{
      match: BracketMatch;
      a: BracketTeam;
      b: BracketTeam;
      winner?: BracketTeam;
    }> = [];
    for (let i = 0; i < REGION_PAIRINGS.length; i++) {
      const [sa, sb] = REGION_PAIRINGS[i];
      const a = getTeamBySeed(regionTeams, sa);
      const b = getTeamBySeed(regionTeams, sb);

      const id = nextId++;
      r64.push({
        match: {
          id,
          name: `${rName} R64 M${i + 1}`,
          nextMatchId: null, // filled later
          tournamentRoundText: "Round of 64",
          startTime,
          state: "PLAYED",
          participants: [],
        },
        a,
        b,
      });
    }

    // Round of 32 (4), Sweet 16 (2), Elite 8 (1)
    const r32: BracketMatch[] = [];
    for (let i = 0; i < 4; i++) {
      r32.push({
        id: nextId++,
        name: `${rName} R32 M${i + 1}`,
        nextMatchId: null,
        tournamentRoundText: "Round of 32",
        startTime,
        state: "PLAYED",
        participants: [],
      });
    }

    const s16: BracketMatch[] = [];
    for (let i = 0; i < 2; i++) {
      s16.push({
        id: nextId++,
        name: `${rName} S16 M${i + 1}`,
        nextMatchId: null,
        tournamentRoundText: "Sweet 16",
        startTime,
        state: "PLAYED",
        participants: [],
      });
    }

    const e8: BracketMatch = {
      id: nextId++,
      name: `${rName} E8`,
      nextMatchId: null,
      tournamentRoundText: "Elite 8",
      startTime,
      state: "PLAYED",
      participants: [],
    };

    // Wire nextMatchId pointers
    for (let i = 0; i < r64.length; i++) {
      r64[i].match.nextMatchId = r32[Math.floor(i / 2)]!.id;
    }
    for (let i = 0; i < r32.length; i++) {
      r32[i]!.nextMatchId = s16[Math.floor(i / 2)]!.id;
    }
    for (let i = 0; i < s16.length; i++) {
      s16[i]!.nextMatchId = e8.id;
    }

    // Simulate round of 64
    for (const item of r64) {
      const { winner } = pickWinner({
        matchId: item.match.id,
        teamA: item.a.team,
        teamB: item.b.team,
        stats,
        weights,
        randomness,
        simulationId,
        ranges,
      });

      const aIsWinner = winner.Rk === item.a.team.Rk;
      item.winner = aIsWinner ? item.a : item.b;
      item.match.participants = [toParticipant(item.a, aIsWinner), toParticipant(item.b, !aIsWinner)];
      matches.push(item.match);
    }

    // Simulate round of 32
    const r32Winners: BracketTeam[] = [];
    for (let i = 0; i < r32.length; i++) {
      const left = r64[i * 2]!.winner!;
      const right = r64[i * 2 + 1]!.winner!;

      const { winner } = pickWinner({
        matchId: r32[i]!.id,
        teamA: left.team,
        teamB: right.team,
        stats,
        weights,
        randomness,
        simulationId,
        ranges,
      });

      const leftIsWinner = winner.Rk === left.team.Rk;
      const w = leftIsWinner ? left : right;
      r32Winners.push(w);
      r32[i]!.participants = [toParticipant(left, leftIsWinner), toParticipant(right, !leftIsWinner)];
      matches.push(r32[i]!);
    }

    // Sweet 16
    const s16Winners: BracketTeam[] = [];
    for (let i = 0; i < s16.length; i++) {
      const left = r32Winners[i * 2]!;
      const right = r32Winners[i * 2 + 1]!;

      const { winner } = pickWinner({
        matchId: s16[i]!.id,
        teamA: left.team,
        teamB: right.team,
        stats,
        weights,
        randomness,
        simulationId,
        ranges,
      });

      const leftIsWinner = winner.Rk === left.team.Rk;
      const w = leftIsWinner ? left : right;
      s16Winners.push(w);
      s16[i]!.participants = [toParticipant(left, leftIsWinner), toParticipant(right, !leftIsWinner)];
      matches.push(s16[i]!);
    }

    // Elite 8
    {
      const left = s16Winners[0]!;
      const right = s16Winners[1]!;

      const { winner } = pickWinner({
        matchId: e8.id,
        teamA: left.team,
        teamB: right.team,
        stats,
        weights,
        randomness,
        simulationId,
        ranges,
      });

      const leftIsWinner = winner.Rk === left.team.Rk;
      const champ = leftIsWinner ? left : right;
      e8.participants = [toParticipant(left, leftIsWinner), toParticipant(right, !leftIsWinner)];
      matches.push(e8);

      regionChamps.push({ region, champ });
    }
  }

  // Final Four + Championship
  const semi1: BracketMatch = {
    id: nextId++,
    name: "Final Four - Semifinal 1",
    nextMatchId: null,
    tournamentRoundText: "Final Four",
    startTime,
    state: "PLAYED",
    participants: [],
  };
  const semi2: BracketMatch = {
    id: nextId++,
    name: "Final Four - Semifinal 2",
    nextMatchId: null,
    tournamentRoundText: "Final Four",
    startTime,
    state: "PLAYED",
    participants: [],
  };
  const final: BracketMatch = {
    id: nextId++,
    name: "Championship",
    nextMatchId: null,
    tournamentRoundText: "Championship",
    startTime,
    state: "PLAYED",
    participants: [],
  };

  semi1.nextMatchId = final.id;
  semi2.nextMatchId = final.id;

  // Region champs are in order region 0..3
  const champ0 = regionChamps.find((c) => c.region === 0)!.champ;
  const champ1 = regionChamps.find((c) => c.region === 1)!.champ;
  const champ2 = regionChamps.find((c) => c.region === 2)!.champ;
  const champ3 = regionChamps.find((c) => c.region === 3)!.champ;

  const semiWinnerA = (() => {
    const { winner } = pickWinner({
      matchId: semi1.id,
      teamA: champ0.team,
      teamB: champ1.team,
      stats,
      weights,
      randomness,
      simulationId,
      ranges,
    });
    const aIsWinner = winner.Rk === champ0.team.Rk;
    semi1.participants = [toParticipant(champ0, aIsWinner), toParticipant(champ1, !aIsWinner)];
    matches.push(semi1);
    return aIsWinner ? champ0 : champ1;
  })();

  const semiWinnerB = (() => {
    const { winner } = pickWinner({
      matchId: semi2.id,
      teamA: champ2.team,
      teamB: champ3.team,
      stats,
      weights,
      randomness,
      simulationId,
      ranges,
    });
    const aIsWinner = winner.Rk === champ2.team.Rk;
    semi2.participants = [toParticipant(champ2, aIsWinner), toParticipant(champ3, !aIsWinner)];
    matches.push(semi2);
    return aIsWinner ? champ2 : champ3;
  })();

  {
    const { winner } = pickWinner({
      matchId: final.id,
      teamA: semiWinnerA.team,
      teamB: semiWinnerB.team,
      stats,
      weights,
      randomness,
      simulationId,
      ranges,
    });
    const aIsWinner = winner.Rk === semiWinnerA.team.Rk;
    final.participants = [toParticipant(semiWinnerA, aIsWinner), toParticipant(semiWinnerB, !aIsWinner)];
    matches.push(final);
  }

  return matches;
}
