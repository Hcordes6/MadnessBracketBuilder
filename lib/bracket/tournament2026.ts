export type RegionKey = "East" | "West" | "South" | "Midwest";

export const REGION_ID_BY_KEY = {
  East: 0,
  West: 1,
  South: 2,
  Midwest: 3,
} as const;

export const REGION_LABEL_BY_ID = ["East", "West", "South", "Midwest"] as const;

export type EspnSeedRegionEntry = {
  seed: number;
  team: string;
  region: RegionKey;
};

// Source: ESPN "Men's March Madness 2026 bracket: Get to know all 68 teams"
// https://www.espn.com/mens-college-basketball/story/_/id/48156563/march-madness-2026-every-team-mens-ncaa-tournament-bracket-explained
// Extracted as: (seed section number) + (team heading) + (Region: ...)
export const ESPN_2026_TEAMS: EspnSeedRegionEntry[] = [
  { seed: 1, team: "Duke Blue Devils", region: "East" },
  { seed: 1, team: "Arizona Wildcats", region: "West" },
  { seed: 1, team: "Michigan Wolverines", region: "Midwest" },
  { seed: 1, team: "Florida Gators", region: "South" },

  { seed: 2, team: "UConn Huskies", region: "East" },
  { seed: 2, team: "Purdue Boilermakers", region: "West" },
  { seed: 2, team: "Iowa State Cyclones", region: "Midwest" },
  { seed: 2, team: "Houston Cougars", region: "South" },

  { seed: 3, team: "Michigan State Spartans", region: "East" },
  { seed: 3, team: "Gonzaga Bulldogs", region: "West" },
  { seed: 3, team: "Virginia Cavaliers", region: "Midwest" },
  { seed: 3, team: "Illinois Fighting Illini", region: "South" },

  { seed: 4, team: "Kansas Jayhawks", region: "East" },
  { seed: 4, team: "Arkansas Razorbacks", region: "West" },
  { seed: 4, team: "Alabama Crimson Tide", region: "Midwest" },
  { seed: 4, team: "Nebraska Cornhuskers", region: "South" },

  { seed: 5, team: "St. John's Red Storm", region: "East" },
  { seed: 5, team: "Wisconsin Badgers", region: "West" },
  { seed: 5, team: "Texas Tech Red Raiders", region: "Midwest" },
  { seed: 5, team: "Vanderbilt Commodores", region: "South" },

  { seed: 6, team: "Louisville Cardinals", region: "East" },
  { seed: 6, team: "BYU Cougars", region: "West" },
  { seed: 6, team: "Tennessee Volunteers", region: "Midwest" },
  { seed: 6, team: "North Carolina Tar Heels", region: "South" },

  { seed: 7, team: "UCLA Bruins", region: "East" },
  { seed: 7, team: "Miami Hurricanes", region: "West" },
  { seed: 7, team: "Kentucky Wildcats", region: "Midwest" },
  { seed: 7, team: "Saint Mary's Gaels", region: "South" },

  { seed: 8, team: "Ohio State Buckeyes", region: "East" },
  { seed: 8, team: "Villanova Wildcats", region: "West" },
  { seed: 8, team: "Georgia Bulldogs", region: "Midwest" },
  { seed: 8, team: "Clemson Tigers", region: "South" },

  { seed: 9, team: "TCU Horned Frogs", region: "East" },
  { seed: 9, team: "Utah State Aggies", region: "West" },
  { seed: 9, team: "Saint Louis Billikens", region: "Midwest" },
  { seed: 9, team: "Iowa Hawkeyes", region: "South" },

  { seed: 10, team: "UCF Knights", region: "East" },
  { seed: 10, team: "Missouri Tigers", region: "West" },
  { seed: 10, team: "Santa Clara Broncos", region: "Midwest" },
  { seed: 10, team: "Texas A&M Aggies", region: "South" },

  // 11-seeds include two play-in games (West + Midwest)
  { seed: 11, team: "South Florida Bulls", region: "East" },
  { seed: 11, team: "Texas Longhorns", region: "West" },
  { seed: 11, team: "NC State Wolfpack", region: "West" },
  { seed: 11, team: "Miami (Ohio) RedHawks", region: "Midwest" },
  { seed: 11, team: "SMU Mustangs", region: "Midwest" },
  { seed: 11, team: "VCU Rams", region: "South" },

  { seed: 12, team: "Northern Iowa Panthers", region: "East" },
  { seed: 12, team: "High Point Panthers", region: "West" },
  { seed: 12, team: "Akron Zips", region: "Midwest" },
  { seed: 12, team: "McNeese Cowboys", region: "South" },

  { seed: 13, team: "California Baptist Lancers", region: "East" },
  { seed: 13, team: "Hawai'i Rainbow Warriors", region: "West" },
  { seed: 13, team: "Hofstra Pride", region: "Midwest" },
  { seed: 13, team: "Troy Trojans", region: "South" },

  { seed: 14, team: "North Dakota State Bison", region: "East" },
  { seed: 14, team: "Kennesaw State Owls", region: "West" },
  { seed: 14, team: "Wright State Raiders", region: "Midwest" },
  { seed: 14, team: "Penn Quakers", region: "South" },

  { seed: 15, team: "Furman Paladins", region: "East" },
  { seed: 15, team: "Queens University Royals", region: "West" },
  { seed: 15, team: "Tennessee State Tigers", region: "Midwest" },
  { seed: 15, team: "Idaho Vandals", region: "South" },

  // 16-seeds include two play-in games (Midwest + South)
  { seed: 16, team: "Siena Saints", region: "East" },
  { seed: 16, team: "Long Island University Sharks", region: "West" },
  { seed: 16, team: "UMBC Retrievers", region: "Midwest" },
  { seed: 16, team: "Howard Bison", region: "Midwest" },
  { seed: 16, team: "Prairie View A&M Panthers", region: "South" },
  { seed: 16, team: "Lehigh Mountain Hawks", region: "South" },
];

export type TournamentSlot2026 = {
  region: RegionKey;
  seed: number; // 1..16
  // ESPN team display name (includes mascot). We match this to KenPom team names.
  team: string;
};

export function build2026Slots(entries: EspnSeedRegionEntry[]): TournamentSlot2026[] {
  const bySlot = new Map<string, TournamentSlot2026>();
  const duplicates: TournamentSlot2026[] = [];

  for (const e of entries) {
    const key = `${e.region}:${e.seed}`;
    const slot: TournamentSlot2026 = { region: e.region, seed: e.seed, team: e.team };
    if (!bySlot.has(key)) bySlot.set(key, slot);
    else duplicates.push(slot);
  }

  // We intentionally keep the first-seen team for play-in slots.
  // The UI/simulation only needs one team per slot to fill a 64-team bracket.

  const slots = Array.from(bySlot.values());
  slots.sort((a, b) => a.region.localeCompare(b.region) || a.seed - b.seed);

  return slots;
}

export const TOURNAMENT_2026_SLOTS: TournamentSlot2026[] = build2026Slots(ESPN_2026_TEAMS);
