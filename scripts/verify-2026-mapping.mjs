import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function splitTeamAndSeed(teamRaw) {
  const trimmed = String(teamRaw ?? "").trim();
  const match = /^(.*)\s+(\d{1,2})$/.exec(trimmed);
  if (!match) return { team: trimmed };

  const team = (match[1] ?? "").trim();
  const seed = Number(match[2]);
  if (!team || !Number.isInteger(seed) || seed < 1 || seed > 16) return { team: trimmed };
  return { team, seed };
}

function parseCsvSimple(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headerLine = lines[0] ?? "";
  const headers = headerLine.split(",").map((h) => h.trim());

  const rows = [];
  for (const line of lines.slice(1)) {
    const values = line.split(",");
    const row = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i] ?? `col_${i}`;
      row[key] = values[i]?.trim?.() ?? "";
    }
    rows.push(row);
  }

  return { headers, rows };
}

function normalizeTeamKey(input) {
  let s = String(input ?? "").toLowerCase();

  s = s.replace(/&/g, " and ");
  s = s.replace(/\ba\s*&\s*m\b/g, "am");
  s = s.replace(/[.'’]/g, "");
  s = s.replace(/\(([^)]+)\)/g, " $1 ");

  s = s.replace(/\buniversity\b/g, " ");
  s = s.replace(/\bsaint\b/g, "st");
  s = s.replace(/\bstate\b/g, "st");
  s = s.replace(/\bohio\b/g, "oh");

  s = s.replace(/\s+/g, " ").trim();

  if (s.startsWith("uconn ") || s === "uconn") s = s.replace(/^uconn\b/, "connecticut");
  if (s.startsWith("long island university") || s.startsWith("long island")) s = "liu";

  if (s.startsWith("miami ") || s === "miami") {
    if (s.includes("hurricanes")) return "miami fl";
    if (s.includes("redhawks") || s.includes("oh")) return "miami oh";
  }

  return s;
}

function espnCandidateTeamNames(espnDisplayName) {
  const raw = String(espnDisplayName ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return [];

  if (/^UConn\b/i.test(raw)) return ["Connecticut", raw.replace(/^UConn\b/i, "Connecticut")];
  if (/^Miami\b/i.test(raw) && /Hurricanes/i.test(raw)) return ["Miami FL"];
  if (/^Miami\b/i.test(raw) && (/\(Ohio\)/i.test(raw) || /RedHawks/i.test(raw))) return ["Miami OH"];
  if (/^Long Island University\b/i.test(raw)) return ["LIU"];
  if (/^California Baptist\b/i.test(raw)) return ["Cal Baptist"];

  const parts = raw.split(" ").filter(Boolean);
  const maxDrop = Math.min(6, Math.max(0, parts.length - 1));

  const out = [];
  for (let drop = 0; drop <= maxDrop; drop++) {
    const candidate = parts.slice(0, parts.length - drop).join(" ").trim();
    if (candidate) out.push(candidate);
  }

  return Array.from(new Set(out));
}

function extractEspnTeamsFromTournamentTs(fileText) {
  // Pulls entries of the form: { seed: 1, team: "Duke Blue Devils", region: "East" },
  const entries = [];

  const re = /\{\s*seed:\s*(\d+)\s*,\s*team:\s*"([^"]+)"\s*,\s*region:\s*"(East|West|South|Midwest)"\s*\}/g;
  let m;
  while ((m = re.exec(fileText))) {
    entries.push({ seed: Number(m[1]), team: m[2], region: m[3] });
  }

  return entries;
}

function buildSlots(entries) {
  const bySlot = new Map();
  const duplicates = [];

  for (const e of entries) {
    const key = `${e.region}:${e.seed}`;
    const slot = { region: e.region, seed: e.seed, team: e.team };
    if (!bySlot.has(key)) bySlot.set(key, slot);
    else duplicates.push(slot);
  }

  const slots = Array.from(bySlot.values());
  slots.sort((a, b) => a.region.localeCompare(b.region) || a.seed - b.seed);

  return { slots, duplicates };
}

function main() {
  const tournamentText = readText("lib/bracket/tournament2026.ts");
  const espnEntries = extractEspnTeamsFromTournamentTs(tournamentText);
  if (espnEntries.length === 0) {
    console.error("No ESPN entries found in lib/bracket/tournament2026.ts (regex parse failed)");
    process.exitCode = 1;
    return;
  }

  const { slots, duplicates } = buildSlots(espnEntries);

  const csvText = readText("api/data/KenpomStatsFinal.csv");
  const { rows } = parseCsvSimple(csvText);

  const teams = rows
    .map((row) => {
      const rk = Number(row["Rk"]);
      if (!Number.isFinite(rk)) return null;
      const teamRaw = row["Team"];
      const conf = row["Conf"];
      const wl = row["W-L"];
      if (!teamRaw || !conf || !wl) return null;
      const { team, seed } = splitTeamAndSeed(teamRaw);
      return { Rk: rk, Team: team, Seed: seed, Conf: conf, WL: wl };
    })
    .filter(Boolean);

  const byKey = new Map();
  for (const t of teams) {
    const key = normalizeTeamKey(t.Team);
    if (!key) continue;
    const arr = byKey.get(key) ?? [];
    arr.push(t);
    byKey.set(key, arr);
  }
  for (const [k, arr] of byKey.entries()) {
    arr.sort((a, b) => a.Rk - b.Rk);
    byKey.set(k, arr);
  }

  function resolve(espnName, desiredSeed) {
    for (const cand of espnCandidateTeamNames(espnName)) {
      const key = normalizeTeamKey(cand);
      const hits = byKey.get(key);
      if (hits && hits.length) {
        const seedHit = hits.find((h) => h.Seed === desiredSeed);
        return { team: seedHit ?? hits[0], key, hits };
      }
    }

    const key = normalizeTeamKey(espnName);
    const hits = byKey.get(key);
    if (hits && hits.length) {
      const seedHit = hits.find((h) => h.Seed === desiredSeed);
      return { team: seedHit ?? hits[0], key, hits };
    }

    return null;
  }

  const usedRk = new Set();
  const missing = [];
  const seedMismatch = [];
  const ambiguous = [];
  const duplicatesUsed = [];

  for (const slot of slots) {
    const hit = resolve(slot.team, slot.seed);
    if (!hit) {
      missing.push(slot);
      continue;
    }

    const team = hit.team;

    if (team.Seed != null && team.Seed !== slot.seed) {
      seedMismatch.push({ slot, team });
    }

    if (hit.hits.length > 1) {
      ambiguous.push({ slot, key: hit.key, hits: hit.hits.map((h) => ({ Rk: h.Rk, Team: h.Team, Seed: h.Seed })) });
    }

    if (usedRk.has(team.Rk)) {
      duplicatesUsed.push({ slot, team });
    } else {
      usedRk.add(team.Rk);
    }
  }

  const okCount = slots.length - missing.length - seedMismatch.length - duplicatesUsed.length;

  console.log("=== 2026 Mapping Verification ===");
  console.log(`ESPN entries (68): ${espnEntries.length}`);
  console.log(`Play-in duplicates dropped: ${duplicates.length}`);
  console.log(`Slots (64): ${slots.length}`);
  console.log(`Resolved without hard errors: ${okCount}/${slots.length}`);

  if (duplicates.length) {
    console.log("\nPlay-in duplicates (kept first occurrence per region+seed):");
    for (const d of duplicates) console.log(`- ${d.region} ${d.seed}: ${d.team}`);
  }

  if (missing.length) {
    console.log("\nMISSING (no KenPom match):");
    for (const m of missing) console.log(`- ${m.region} ${m.seed}: ${m.team}`);
  }

  if (seedMismatch.length) {
    console.log("\nSEED MISMATCH:");
    for (const sm of seedMismatch) {
      console.log(`- ${sm.slot.region} ${sm.slot.seed}: ${sm.slot.team} => KenPom ${sm.team.Team} (Seed ${sm.team.Seed ?? "?"}, Rk ${sm.team.Rk})`);
    }
  }

  if (duplicatesUsed.length) {
    console.log("\nDUPLICATE KENPOM ROW USED MULTIPLE TIMES:");
    for (const du of duplicatesUsed) {
      console.log(`- ${du.slot.region} ${du.slot.seed}: ${du.slot.team} => KenPom ${du.team.Team} (Rk ${du.team.Rk})`);
    }
  }

  if (ambiguous.length) {
    console.log("\nAMBIGUOUS NAME KEYS (multiple KenPom rows share normalized key; resolver picks lowest Rk, or seed match):");
    for (const a of ambiguous) {
      console.log(`- ${a.slot.region} ${a.slot.seed}: ${a.slot.team} (key: ${a.key})`);
      for (const h of a.hits) console.log(`    - Rk ${h.Rk}: ${h.Team} (Seed ${h.Seed ?? "?"})`);
    }
  }

  if (!missing.length && !seedMismatch.length && !duplicatesUsed.length) {
    console.log("\nOK: All 64 slots map cleanly (and seeded rows match the slot seed)." );
  } else {
    process.exitCode = 1;
  }
}

main();
