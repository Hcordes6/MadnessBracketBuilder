// Component for all bracket building UI

"use client";

import { useMemo, useState } from "react";

import { useRatings } from "@/lib/hooks/useRatings";
import type { TeamRating } from "@/lib/types/ratings";
import { buildField64 } from "@/lib/bracket/field";
import { buildAndSimulateBracket } from "@/lib/bracket/bracket";
import { DEFAULT_STATS, type StatKey, type Weights } from "@/lib/sim/scoring";

import type { ReactElement } from "react";
import type { Match as RTBMatch } from "@cm3tahkuh/react-tournament-brackets/dist/src/types";

import {
  SingleEliminationBracket,
  Match,
  SVGViewer,
} from "@cm3tahkuh/react-tournament-brackets";

export default function Builder() {
  const { status, data, errorText } = useRatings("/api/ratings");

  const [weightsPct, setWeightsPct] = useState<Record<StatKey, number>>({
    NetRtg: 0,
    ORtg: 100,
    DRtg: 0,
    Luck: 0,
  });
  const [randomnessPct, setRandomnessPct] = useState(0);
  const [simulationId, setSimulationId] = useState(1);

  const derived = useMemo(() => {
    if (!data || data.ok !== true) return { ok: false as const, error: "No data" };

    // We expect full TeamRating objects (not `fields` shaped results)
    const teams = data.teams as TeamRating[];
    if (!Array.isArray(teams) || teams.length === 0) {
      return { ok: false as const, error: "No teams returned" };
    }

    const fieldRes = buildField64(teams);
    if (!fieldRes.ok) return { ok: false as const, error: fieldRes.error };

    const weights: Weights = {
      NetRtg: (weightsPct.NetRtg ?? 0) / 100,
      ORtg: (weightsPct.ORtg ?? 0) / 100,
      DRtg: (weightsPct.DRtg ?? 0) / 100,
      Luck: (weightsPct.Luck ?? 0) / 100,
    };

    const matches = buildAndSimulateBracket({
      field: fieldRes.field,
      stats: DEFAULT_STATS,
      weights,
      randomness: Math.max(0, Math.min(1, randomnessPct / 100)),
      simulationId,
    });

    return { ok: true as const, matches, meta: data.meta };
  }, [data, weightsPct, randomnessPct, simulationId]);

  function SliderRow(props: { statKey: StatKey; label: string }) {
    const value = weightsPct[props.statKey] ?? 0;
    return (
      <div className="flex flex-col gap-1" key={props.statKey}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {props.label}
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">{value}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) =>
            setWeightsPct((prev) => ({
              ...prev,
              [props.statKey]: Number(e.target.value),
            }))
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Madness Bracket Builder
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Use sliders to weight stats. Randomness blends results toward a coin-flip.
          </p>
        </div>

        {errorText ? (
          <p className="text-sm text-red-700 dark:text-red-400">{errorText}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sliders</h2>
              <span className="text-xs text-gray-600 dark:text-gray-400">Status: {status}</span>
            </div>

            {DEFAULT_STATS.map((s) => (
              <SliderRow key={s.key} statKey={s.key} label={s.label} />
            ))}

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Randomness
                </label>
                <span className="text-sm text-gray-600 dark:text-gray-400">{randomnessPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={randomnessPct}
                onChange={(e) => setRandomnessPct(Number(e.target.value))}
              />
            </div>

            <button
              type="button"
              className="mt-1 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              onClick={() => setSimulationId((n) => n + 1)}
            >
              Resimulate
            </button>

            {derived.ok ? (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Using {derived.meta.totalTeams} rows from CSV.
              </p>
            ) : (
              <p className="text-xs text-red-700 dark:text-red-400">{derived.error}</p>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            {derived.ok ? (
              <SingleEliminationBracket
                matches={derived.matches as RTBMatch[]}
                matchComponent={Match}
                svgWrapper={({ children, bracketWidth, bracketHeight, startAt }: {
                  children: ReactElement;
                  bracketWidth: number;
                  bracketHeight: number;
                  startAt: number[];
                }) => (
                  <SVGViewer
                    width={1200}
                    height={800}
                    bracketWidth={bracketWidth}
                    bracketHeight={bracketHeight}
                    startAt={startAt}
                    scaleFactor={1}
                  >
                    {children}
                  </SVGViewer>
                )}
              />
            ) : (
              <div className="p-4 text-sm text-gray-700 dark:text-gray-300">Waiting for data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
