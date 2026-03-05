// Fixes API issues with formatting and seeding. 
// Reshapes data for feeding into the bracket simulation and visualizer.

import type { TeamRating } from "@/lib/types/ratings";

export type RegionId = 0 | 1 | 2 | 3;

export type BracketTeam = {
  team: TeamRating;
  region: RegionId;
  seed: number; // 1..16
  // Stable id used for bracket participants
  participantId: string;
  displayName: string;
};

export type FieldBuildResult =
  | { ok: true; field: BracketTeam[] }
  | { ok: false; error: string };

function asRegionId(n: number): RegionId {
  if (n === 0 || n === 1 || n === 2 || n === 3) return n;
  return 0;
}

export function buildField64(allTeams: TeamRating[]): FieldBuildResult {
  if (!Array.isArray(allTeams) || allTeams.length === 0) {
    return { ok: false, error: "No teams available" };
  }

  const teamsSorted = [...allTeams].sort((a, b) => a.Rk - b.Rk);

  // Slot order: seed 1..16, region 0..3
  const slots: Array<{ region: RegionId; seed: number }> = [];
  for (let seed = 1; seed <= 16; seed++) {
    for (let region = 0; region < 4; region++) {
      slots.push({ seed, region: asRegionId(region) });
    }
  }

  // Partition by existing Seed
  const bySeed = new Map<number, TeamRating[]>();
  const unseeded: TeamRating[] = [];

  for (const t of teamsSorted) {
    const s = t.Seed;
    if (typeof s === "number" && Number.isInteger(s) && s >= 1 && s <= 16) {
      const arr = bySeed.get(s) ?? [];
      arr.push(t);
      bySeed.set(s, arr);
    } else {
      unseeded.push(t);
    }
  }

  // Track used teams by Rk (stable)
  const used = new Set<number>();
  const field: BracketTeam[] = [];

  // 1) Place pre-seeded teams into their seed slots (best ranks first)
  for (let seed = 1; seed <= 16; seed++) {
    const seededTeams = (bySeed.get(seed) ?? []).sort((a, b) => a.Rk - b.Rk);
    for (let region = 0; region < 4; region++) {
      const t = seededTeams.shift();
      if (!t) continue;
      used.add(t.Rk);
      const regionId = asRegionId(region);
      field.push({
        team: t,
        region: regionId,
        seed,
        participantId: String(t.Rk),
        displayName: `${seed} ${t.Team}`,
      });
    }
  }

  // 2) Fill remaining slots with best remaining teams by rank
  const remainingTeams = teamsSorted.filter((t) => !used.has(t.Rk));
  let idx = 0;

  for (const slot of slots) {
    const alreadyFilled = field.some((f) => f.seed === slot.seed && f.region === slot.region);
    if (alreadyFilled) continue;

    const next = remainingTeams[idx++];
    if (!next) {
      return { ok: false, error: "Not enough teams to fill a 64-team bracket" };
    }

    field.push({
      team: next,
      region: slot.region,
      seed: slot.seed,
      participantId: String(next.Rk),
      displayName: `${slot.seed} ${next.Team}`,
    });
  }

  if (field.length !== 64) {
    return { ok: false, error: `Expected 64 teams but built ${field.length}` };
  }

  // Sort field for stable downstream behavior
  field.sort((a, b) => a.region - b.region || a.seed - b.seed || a.team.Rk - b.team.Rk);

  return { ok: true, field };
}
