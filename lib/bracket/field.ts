// Fixes API issues with formatting and seeding. 
// Reshapes data for feeding into the bracket simulation and visualizer.

import type { TeamRating } from "@/lib/types/ratings";
import { REGION_ID_BY_KEY, TOURNAMENT_2026_SLOTS } from "@/lib/bracket/tournament2026";

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

function normalizeTeamKey(input: string): string {
  let s = (input ?? "").toLowerCase();

  // Normalize punctuation and common formatting differences.
  s = s.replace(/&/g, " and ");
  s = s.replace(/\ba\s*&\s*m\b/g, "am");
  s = s.replace(/[.'’]/g, "");

  // Parenthetical qualifiers (e.g. "(Ohio)")
  s = s.replace(/\(([^)]+)\)/g, " $1 ");

  // Common word-level normalizations.
  s = s.replace(/\buniversity\b/g, " ");
  s = s.replace(/\bsaint\b/g, "st");
  s = s.replace(/\bstate\b/g, "st");
  s = s.replace(/\bohio\b/g, "oh");

  // Collapse whitespace.
  s = s.replace(/\s+/g, " ").trim();

  // ESPN naming quirks / known aliases.
  if (s.startsWith("uconn ") || s === "uconn") s = s.replace(/^uconn\b/, "connecticut");
  if (s.startsWith("long island university") || s.startsWith("long island")) s = "liu";

  // Miami disambiguation: ESPN uses mascot/qualifier, KenPom uses FL/OH.
  if (s.startsWith("miami ") || s === "miami") {
    if (s.includes("hurricanes")) return "miami fl";
    if (s.includes("redhawks") || s.includes("oh")) return "miami oh";
  }

  return s;
}

function espnCandidateTeamNames(espnDisplayName: string): string[] {
  const raw = (espnDisplayName ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return [];

  // High-value explicit aliases.
  if (/^UConn\b/i.test(raw)) return ["Connecticut", raw.replace(/^UConn\b/i, "Connecticut")];
  if (/^Miami\b/i.test(raw) && /Hurricanes/i.test(raw)) return ["Miami FL"];
  if (/^Miami\b/i.test(raw) && (/\(Ohio\)/i.test(raw) || /RedHawks/i.test(raw))) return ["Miami OH"];
  if (/^Long Island University\b/i.test(raw)) return ["LIU"];
  if (/^California Baptist\b/i.test(raw)) return ["Cal Baptist"];

  // Strip mascot words from the end (works for "Tar Heels", "Red Storm", etc.).
  const parts = raw.split(" ").filter(Boolean);
  const maxDrop = Math.min(6, Math.max(0, parts.length - 1));

  const out: string[] = [];
  for (let drop = 0; drop <= maxDrop; drop++) {
    const candidate = parts.slice(0, parts.length - drop).join(" ").trim();
    if (candidate) out.push(candidate);
  }

  // De-dupe preserving order
  return Array.from(new Set(out));
}

export function buildField64(allTeams: TeamRating[]): FieldBuildResult {
  if (!Array.isArray(allTeams) || allTeams.length === 0) {
    return { ok: false, error: "No teams available" };
  }

  // Index teams by a normalized name key for robust matching.
  const byKey = new Map<string, TeamRating[]>();
  for (const t of allTeams) {
    const key = normalizeTeamKey(t.Team);
    if (!key) continue;
    const arr = byKey.get(key) ?? [];
    arr.push(t);
    byKey.set(key, arr);
  }

  // Prefer best-ranked team when a key maps to multiple rows.
  for (const [k, arr] of byKey.entries()) {
    arr.sort((a, b) => a.Rk - b.Rk);
    byKey.set(k, arr);
  }

  function resolveTeamFromEspnName(espnTeam: string, desiredSeed: number): TeamRating | null {
    for (const cand of espnCandidateTeamNames(espnTeam)) {
      const key = normalizeTeamKey(cand);
      const hits = byKey.get(key);
      if (hits && hits.length > 0) {
        const seedHit = hits.find((h) => h.Seed === desiredSeed);
        return seedHit ?? hits[0]!;
      }
    }
    // As a last resort, try the raw ESPN string.
    const fallback = byKey.get(normalizeTeamKey(espnTeam));
    if (fallback && fallback.length > 0) {
      const seedHit = fallback.find((h) => h.Seed === desiredSeed);
      return seedHit ?? fallback[0]!;
    }
    return null;
  }

  const usedRk = new Set<number>();
  const field: BracketTeam[] = [];

  for (const slot of TOURNAMENT_2026_SLOTS) {
    const regionNum = REGION_ID_BY_KEY[slot.region];
    const region = asRegionId(regionNum);
    const seed = slot.seed;

    const team = resolveTeamFromEspnName(slot.team, seed);
    if (!team) {
      return {
        ok: false,
        error: `Failed to match ESPN team "${slot.team}" to a KenPom team name`,
      };
    }
    if (team.Seed != null && team.Seed !== seed) {
      return {
        ok: false,
        error: `Seed mismatch for slot ${slot.region} ${seed}: ESPN team "${slot.team}" matched KenPom "${team.Team}" with seed ${team.Seed}`,
      };
    }
    if (usedRk.has(team.Rk)) {
      return {
        ok: false,
        error: `Duplicate team matched for multiple slots: ${team.Team} (Rk ${team.Rk})`,
      };
    }
    usedRk.add(team.Rk);

    field.push({
      team,
      region,
      seed,
      participantId: String(team.Rk),
      displayName: `${seed} ${team.Team}`,
    });
  }

  if (field.length !== 64) {
    return { ok: false, error: `Expected 64 teams but built ${field.length}` };
  }

  // Sort field for stable downstream behavior
  field.sort((a, b) => a.region - b.region || a.seed - b.seed || a.team.Rk - b.team.Rk);

  return { ok: true, field };
}
