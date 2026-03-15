// Component for all bracket building UI

"use client";

import { useMemo, useState } from "react";

import Bracket from "@/components/bracket";
import { useRatings } from "@/lib/hooks/useRatings";
import type { TeamRating } from "@/lib/types/ratings";
import { buildField64 } from "@/lib/bracket/field";
import { buildAndSimulateBracket } from "@/lib/bracket/bracket";
import { DEFAULT_STATS, type StatKey, type Weights } from "@/lib/sim/scoring";

export default function Builder() {
  const { status, data, errorText } = useRatings("/api/ratings");

  const [weightsPct, setWeightsPct] = useState<Record<StatKey, number>>({
    NetRtg: 0,
    ORtg: 100,
    DRtg: 0,
    AdjT: 0,
    Luck: 0,
    SOSNetRtg: 0,
    NCSOSNetRtg: 0,
    WLRatio: 0,
  });
  const [randomnessPct, setRandomnessPct] = useState(0);

  // Applied values only change when the user presses Resimulate.
  const [appliedWeightsPct, setAppliedWeightsPct] = useState<Record<StatKey, number>>({
    NetRtg: 0,
    ORtg: 100,
    DRtg: 0,
    AdjT: 0,
    Luck: 0,
    SOSNetRtg: 0,
    NCSOSNetRtg: 0,
    WLRatio: 0,
  });
  const [appliedRandomnessPct, setAppliedRandomnessPct] = useState(0);
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
      NetRtg: (appliedWeightsPct.NetRtg ?? 0) / 100,
      ORtg: (appliedWeightsPct.ORtg ?? 0) / 100,
      DRtg: (appliedWeightsPct.DRtg ?? 0) / 100,
      AdjT: (appliedWeightsPct.AdjT ?? 0) / 100,
      Luck: (appliedWeightsPct.Luck ?? 0) / 100,
      SOSNetRtg: (appliedWeightsPct.SOSNetRtg ?? 0) / 100,
      NCSOSNetRtg: (appliedWeightsPct.NCSOSNetRtg ?? 0) / 100,
      WLRatio: (appliedWeightsPct.WLRatio ?? 0) / 100,
    };

    const matches = buildAndSimulateBracket({
      field: fieldRes.field,
      stats: DEFAULT_STATS,
      weights,
      randomness: Math.max(0, Math.min(1, appliedRandomnessPct / 100)),
      simulationId,
    });

    return { ok: true as const, matches, meta: data.meta };
  }, [data, appliedWeightsPct, appliedRandomnessPct, simulationId]);

  function SliderRow(props: { statKey: StatKey; label: string }) {
    const value = weightsPct[props.statKey] ?? 0;
    return (
      <div className="relative flex flex-col gap-1" key={props.statKey}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-blue-900">
            {props.label}
          </label>
          <span className="text-sm text-blue-700">{value}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          defaultValue={value}
          className="relative z-10 w-full cursor-pointer accent-blue-600 pointer-events-auto"
          onInput={(e) => {
            const nextValue = e.currentTarget.valueAsNumber;
            setWeightsPct((prev) => ({
              ...prev,
              [props.statKey]: nextValue,
            }));
          }}
          onChange={() => {
            // no-op: keep for React consistency; onInput does the work
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-blue-900">
            Madness Bracket Builder
          </h1>
          <p className="text-sm text-blue-800">
            Use sliders to weight stats. Randomness blends results toward a coin-flip.
          </p>
        </div>

        {errorText ? <p className="text-sm text-red-700">{errorText}</p> : null}

        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-blue-900">Sliders</h2>
              <span className="text-xs text-blue-700">Status: {status}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DEFAULT_STATS.map((s) => (
                <SliderRow key={s.key} statKey={s.key} label={s.label} />
              ))}

              <div className="relative flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-blue-900">
                    Randomness
                  </label>
                  <span className="text-sm text-blue-700">{randomnessPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={randomnessPct}
                  className="relative z-10 w-full cursor-pointer accent-blue-600 pointer-events-auto"
                  onInput={(e) => setRandomnessPct(e.currentTarget.valueAsNumber)}
                  onChange={() => {
                    // no-op: onInput does the work
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  setAppliedWeightsPct(weightsPct);
                  setAppliedRandomnessPct(randomnessPct);
                  setSimulationId((n) => n + 1);
                }}
              >
                Resimulate
              </button>

              {derived.ok ? (
                <p className="text-xs text-blue-700">Using {derived.meta.totalTeams} rows from CSV.</p>
              ) : (
                <p className="text-xs text-red-700">{derived.error}</p>
              )}
            </div>
          </div>

          <div className="min-w-0 w-full rounded-lg border border-blue-100 bg-white p-3">
            {derived.ok ? (
              <Bracket matches={derived.matches} />
            ) : (
              <div className="p-4 text-sm text-blue-800">Waiting for data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
