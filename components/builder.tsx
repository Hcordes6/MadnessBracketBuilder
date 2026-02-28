
"use client";

import { useEffect, useMemo, useState } from "react";

type RatingsResponse =
  | {
      ok: true;
      meta: {
        csvPath: string;
        headers: string[];
        warnings: string[];
        totalTeams: number;
        returnedTeams: number;
      };
      teams: unknown[];
    }
  | {
      ok: false;
      error: string;
      details?: string;
    };

export default function Builder() {
  const [query, setQuery] = useState("/api/ratings?minRk=1&maxRk=25");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [data, setData] = useState<RatingsResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const pretty = useMemo(() => {
    if (!data) return "";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  async function load() {
    setStatus("loading");
    setErrorText(null);
    setData(null);

    try {
      const res = await fetch(query, { cache: "no-store" });
      const json = (await res.json()) as RatingsResponse;
      setData(json);
      setStatus(res.ok && json.ok ? "success" : "error");
      if (!res.ok) {
        setErrorText(`HTTP ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      setStatus("error");
      setErrorText(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Bracket Builder (Debug)
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This panel is only for debugging the API response from
            <span className="font-medium"> /api/ratings</span>.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Query URL
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-zinc-700 dark:bg-black dark:text-gray-100"
            placeholder="/api/ratings?minRk=1&maxRk=25"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void load()}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              type="button"
            >
              Reload
            </button>
            <a
              className="text-sm text-blue-600 underline underline-offset-2 dark:text-blue-400"
              href="/api/ratings?format=raw"
              target="_blank"
              rel="noreferrer"
            >
              Open raw CSV
            </a>
            <a
              className="text-sm text-blue-600 underline underline-offset-2 dark:text-blue-400"
              href="/api/ratings?minRk=1&maxRk=10&fields=Rk,Team,Conf,NetRtg,ORtg,DRtg"
              target="_blank"
              rel="noreferrer"
            >
              Open sample filtered JSON
            </a>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status: {status}
            </span>
          </div>
          {errorText ? (
            <p className="text-sm text-red-700 dark:text-red-400">{errorText}</p>
          ) : null}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Response JSON
          </h2>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap wrap-break-word rounded-md bg-zinc-100 p-3 text-xs text-zinc-900 dark:bg-black dark:text-zinc-100">
            {pretty || "(no data yet)"}
          </pre>
        </div>
      </div>
    </div>
  );
}