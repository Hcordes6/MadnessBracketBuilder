// This is a Next.js API route that reads a local CSV file containing team ratings and exposes it as JSON to the frontend.
// The route supports query parameters for filtering and field selection, and can also return the raw CSV data.

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Ensures this route runs in the Node.js runtime (required for fs access).
export const runtime = "nodejs";

// While you're iterating, keep this route fully dynamic.
// TODO: Once stable, consider `revalidate` or `unstable_cache` for performance.
export const dynamic = "force-dynamic";

// This route reads a local CSV file and exposes it to the frontend.
// TODO: Needs caching for performance

type TeamRating = {
  // NOTE: Keep this minimal for now. Expand as you start relying on more fields.
  Rk: number;
  Team: string;
  Conf: string;
  "W-L": string;
  NetRtg?: number;
  ORtg?: number;
  DRtg?: number;
  AdjT?: number;
  Luck?: number;
  // Raw row data can be useful while you iterate.
  raw: Record<string, string>;
};

// Helpers
function toNumber(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function parseCsvSimple(csvText: string): {
  headers: string[];
  rows: Record<string, string>[];
  warnings: string[];
} {
  // TODO (robustness): This is a *simple* CSV splitter (comma-delimited).
  // It will NOT handle quoted commas correctly.
  // If you hit edge cases, switch to a CSV library (e.g. `csv-parse`).

  const warnings: string[] = [];
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headerLine = lines[0] ?? "";
  const headers = headerLine.split(",").map((h) => h.trim());

  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    const values = line.split(",");
    if (values.length !== headers.length) {
      warnings.push(
        `Row has ${values.length} values but expected ${headers.length}: ${line.slice(0, 80)}`
      );
    }

    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i] ?? `col_${i}`;
      row[key] = values[i]?.trim() ?? "";
    }
    rows.push(row);
  }

  return { headers, rows, warnings };
}

function mapRowToTeamRating(row: Record<string, string>): TeamRating | null {
  const rk = toNumber(row["Rk"]);
  const team = row["Team"];
  const conf = row["Conf"];
  const wl = row["W-L"];

  // Skip malformed rows.
  if (!rk || !team || !conf || !wl) return null;

  return {
    Rk: rk,
    Team: team,
    Conf: conf,
    "W-L": wl,
    NetRtg: toNumber(row["NetRtg"]),
    ORtg: toNumber(row["ORtg"]),
    DRtg: toNumber(row["DRtg"]),
    AdjT: toNumber(row["AdjT"]),
    Luck: toNumber(row["Luck"]),
    raw: row,
  };
}

function resolveCsvPath(): string {
  // TODO: If you want the CSV path configurable per environment, set:
  // KENPOM_CSV_PATH=c:/dev/Personal/MadnessBracketBuilder/api/data(2-28).csv
  const fromEnv = process.env.KENPOM_CSV_PATH;
  if (fromEnv) return fromEnv;

  // Default: points at your current repo file.
  // TODO: Consider renaming the file to something stable like `api/kenpom.csv`.
  return path.join(process.cwd(), "api", "data", "data(2-28).csv");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  let csvText: string;
  try {
    csvText = await readFile(resolveCsvPath(), "utf8");
  } catch (error) {
    // If you see this in production, your deploy likely doesn't include the CSV.
    // Options:
    // - Move the CSV into the deployed artifact
    // - Store it in S3/Blob storage and fetch server-side
    // - Load it from a database
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to read CSV file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }

  if (format === "raw") {
    return new Response(csvText, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        // TODO: For production, consider caching headers once the file is stable.
        "Cache-Control": "no-store",
      },
    });
  }

  // Parsing + shaping (minimal, to help you iterate)
  const parsed = parseCsvSimple(csvText);
  const allTeams = parsed.rows
    .map(mapRowToTeamRating)
    .filter((t): t is TeamRating => t !== null);

  // Filters (keep these simple while you build)
  const teamQuery = url.searchParams.get("team");
  const confQuery = url.searchParams.get("conf");
  const minRk = Number(url.searchParams.get("minRk") ?? "1");
  const maxRk = Number(url.searchParams.get("maxRk") ?? String(Number.MAX_SAFE_INTEGER));
  const fieldsParam = url.searchParams.get("fields");
  const fields = fieldsParam
    ? fieldsParam
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : null;

  // TODO (normalization): Consider normalizing team names here (case, punctuation).
  // For example, you might want "Iowa St." and "Iowa State" to match.
  let teams = allTeams;
  if (teamQuery) {
    const q = teamQuery.toLowerCase();
    teams = teams.filter((t) => t.Team.toLowerCase().includes(q));
  }
  if (confQuery) {
    const q = confQuery.toLowerCase();
    teams = teams.filter((t) => t.Conf.toLowerCase() === q);
  }
  if (Number.isFinite(minRk) || Number.isFinite(maxRk)) {
    teams = teams.filter((t) => t.Rk >= minRk && t.Rk <= maxRk);
  }

  // Fields selection (useful for debugging payload size)
  // Example: ?fields=Rk,Team,Conf,NetRtg
  const payloadTeams = fields
    ? teams.map((t) => {
        const out: Record<string, unknown> = {};
        for (const f of fields) {
          if (f in t) out[f] = (t as unknown as Record<string, unknown>)[f];
          else if (f in t.raw) out[f] = t.raw[f];
        }
        return out;
      })
    : teams;

  return NextResponse.json({
    ok: true,
    meta: {
      csvPath: resolveCsvPath(),
      headers: parsed.headers,
      warnings: parsed.warnings.slice(0, 10),
      totalTeams: allTeams.length,
      returnedTeams: teams.length,
    },
    teams: payloadTeams,
  });
}
