This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



Plan: Weighted March Madness Bracket Builder
Build a client-side bracket simulator driven by sliders that weight CSV-derived team stats, plus a separate Randomness slider that smoothly blends results toward a coin-flip. Keep domain logic in pure utility modules (easy to test/tune) and keep the API focused on serving raw team data. Render the bracket using @cm3tahkuh/react-tournament-brackets by generating a proper single-elimination match graph.

Steps

Data contract and API behavior

Decide API default: return all parsed teams with Seed?: number (do not hard-filter unseeded by default). Add an opt-in query param (e.g. requireSeed=1) to keep current “seeded-only” behavior when desired.
Keep seed parsing in the API (already implemented) as normalization of a raw data quirk.
Ensure the API exposes the fields needed for simulation (Rk, Team, Seed?, and the stat fields you want sliders for).
Tournament field selection (64 teams) and region assignment (no CSV changes)

In client logic, build a “tournament field” of exactly 64 teams:
Start from the API dataset.
Sort by Rk ascending.
Select a pool (recommended: top 80–100 by Rk to allow filling) and then fill 64 bracket slots.
Assign seeds for bracket slots without editing the CSV:
Define 64 slots: 4 regions × seeds 1–16.
Place teams that already have Seed into the next available slot for that seed.
Fill remaining slots using best remaining teams by Rk, assigning them into remaining seed slots in seed order (all remaining 1-seed slots, then 2-seed slots, …, then 16-seed slots).
If you cannot fill all slots (insufficient teams), surface a single error message in the UI.
Auto-assign regions by slot index (Region A/B/C/D). This is a placeholder until you later provide region mapping.
Stat weighting model (sliders)

Create a stat configuration list for supported sliders (initially minimal): ORtg, DRtg, NetRtg, AdjT, Luck.
For each stat, define direction:
Higher-is-better for ORtg, NetRtg, Luck.
Lower-is-better for DRtg (invert during scoring).
AdjT typically higher pace; decide direction explicitly (recommended for now: treat higher as better only if you believe it correlates; otherwise omit initially).
Normalize stat values across the selected 64-team field before weighting (min-max to 0..1). For inverted stats, use 1 - normalized.
Compute a weighted score per team: sum over stats of weight(stat) * normalizedValue(team, stat) where weight is slider value in 0..1.
Matchup win probability + Randomness slider

Convert two-team score difference into win probability using a sigmoid:
diff = scoreA - scoreB
pStats = sigmoid(k * diff); choose a tunable constant k (start around 6–10; tune by feel).
Blend toward pure randomness with the Randomness slider r (0..1):
pFinal = (1 - r) * pStats + r * 0.5
At r=0, outcome is fully driven by stats; at r=1, it’s a coin flip.
Winner selection:
Recommended UX: produce stable results for a given “simulation run” to avoid flicker while dragging sliders.
Implement a deterministic seeded PRNG (or store per-match random draws) keyed by a simulationId that only changes when the user clicks “Resimulate”.
Bracket generation (matches graph) for UI library

Build 4 regional sub-brackets (16 teams each):
Use standard seed pairings for round-of-64 within each region: (1v16), (8v9), (5v12), (4v13), (6v11), (3v14), (7v10), (2v15).
Generate match objects for each round with correct id and nextMatchId pointers:
Round of 64: 32 matches
Round of 32: 16 matches
Sweet 16: 8 matches
Elite 8: 4 matches
Final Four: 2 matches
Championship: 1 match
After building the match graph with initial participants, run a simulation pass that fills winners forward round-by-round using the win-probability model.
UI implementation

Make page.tsx render the real builder instead of debug (keep debug component available for troubleshooting).
Implement slider panel in builder.tsx:
One slider per stat in your stat config.
One Randomness slider.
A “Resimulate” button (increments simulationId).
Use useRatings to fetch teams; show loading/error states.
Memoize derived structures:
Field selection + seed/region assignment
Normalization ranges
Generated matches array
Render the bracket using SingleEliminationBracket with SVGViewer wrapper.
Relevant files

route.ts — keep seed parsing; adjust filtering to be opt-in (query param) rather than hard-coded, so the client can still build a full 64.
ratings.ts — ensure TeamRating includes stats you’ll slider-weight (and matches API).
useRatings.ts — data fetching stays as-is.
builder.tsx — main UI: sliders + bracket render + simulation triggers.
debug.tsx — optionally switch to shared RatingsResponse type later; not required for MVP.
page.tsx — swap Debug → Builder for the main page.
Verification

API: request /api/ratings?minRk=1&maxRk=100&fields=Rk,Team,Seed,ORtg,DRtg,NetRtg and confirm seed parsing + presence of stat fields.
Field building: assert exactly 64 teams assigned a seed+region in the client (log once in dev).
Determinism: with Randomness=0, repeated renders yield identical bracket.
Randomness: with Randomness=100, repeated “Resimulate” calls change outcomes and approximate 50/50 for close matchups.
UI: sliders update bracket results; no continuous flicker while dragging.
Decisions

Region assignment is temporary and auto-generated (no CSV edits).
Full 64-team bracket is enforced; missing seeds are backfilled from rank.
Randomness uses probability blending toward 0.5 (coin flip) and is controlled with a stable simulation seed.
One important callout: your CSV currently only has explicit seeds for ~46 teams, so to guarantee a full 64 without changing the CSV, the plan intentionally backfills seeds for the remaining slots from Rk. If you approve this plan, you can hand off and I’ll implement it.

GPT-5.2 • 1x