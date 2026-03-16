"use client";

import { useMemo } from "react";

import type { BracketMatch } from "@/lib/bracket/bracket";

type RoundKey =
	| "Round of 64"
	| "Round of 32"
	| "Sweet 16"
	| "Elite 8"
	| "Final Four"
	| "Championship";

const ROUND_ORDER: RoundKey[] = [
	"Round of 64",
	"Round of 32",
	"Sweet 16",
	"Elite 8",
	"Final Four",
	"Championship",
];

function isRoundKey(value: unknown): value is RoundKey {
	return (
		value === "Round of 64" ||
		value === "Round of 32" ||
		value === "Sweet 16" ||
		value === "Elite 8" ||
		value === "Final Four" ||
		value === "Championship"
	);
}

function splitSeedAndTeam(name: string): { seed?: string; team: string } {
	const trimmed = name.trim();
	const m = /^([0-9]{1,2})\s+(.+)$/.exec(trimmed);
	if (!m) return { team: trimmed };
	return { seed: m[1], team: m[2] };
}

function displayName(name: unknown): string {
	if (typeof name === "string" && name.trim().length > 0) return name;
	return "TBD";
}

function isWinnerFlag(value: unknown): boolean {
	return value === true;
}

export default function Bracket(props: { matches: BracketMatch[] }) {
	const byRound = useMemo(() => {
		const buckets = new Map<RoundKey, BracketMatch[]>();
		for (const round of ROUND_ORDER) buckets.set(round, []);

		for (const m of props.matches ?? []) {
			const key = isRoundKey(m.tournamentRoundText) ? m.tournamentRoundText : undefined;
			if (!key) continue;
			buckets.get(key)!.push(m);
		}

		// Stable ordering: id ascending if numeric; otherwise string compare.
		for (const round of ROUND_ORDER) {
			const arr = buckets.get(round)!;
			arr.sort((a, b) => {
				const aId = a.id;
				const bId = b.id;
				if (typeof aId === "number" && typeof bId === "number") return aId - bId;
				return String(aId).localeCompare(String(bId));
			});
		}

		return buckets;
	}, [props.matches]);

	return (
		<div className="min-w-0 w-full">
			<div
				className="flex min-w-0 w-full max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
				style={{ WebkitOverflowScrolling: "touch" }}
				aria-label="Bracket"
			>
				{ROUND_ORDER.map((round) => {
					const matches = byRound.get(round) ?? [];
					return (
						<section
							key={round}
							className="min-w-64 flex-1 snap-start rounded-lg border border-blue-100 bg-white p-3 sm:min-w-72"
							aria-label={round}
						>
							<div className="mb-2 flex items-center justify-between">
								<h3 className="text-sm font-semibold text-blue-900">{round}</h3>
							</div>

							<div className="flex flex-col gap-3">
								{matches.map((m) => {
									const p0 = m.participants?.[0];
									const p1 = m.participants?.[1];

									const n0 = displayName(p0?.name);
									const n1 = displayName(p1?.name);
									const a = splitSeedAndTeam(n0);
									const b = splitSeedAndTeam(n1);
									const aWin = isWinnerFlag(p0?.isWinner);
									const bWin = isWinnerFlag(p1?.isWinner);

									return (
										<div
											key={String(m.id)}
											className="rounded-md border border-blue-100 bg-white"
											aria-label={m.name ?? "Match"}
										>
											<div className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] font-medium text-blue-800">
												<span className="min-w-0 truncate">{m.name ?? "Match"}</span>
												{m.meta?.upset ? (
													<span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900">
														Upset
													</span>
												) : null}
											</div>
											<div className="border-t border-blue-100">
												<TeamRow seed={a.seed} team={a.team} isWinner={aWin} />
												<div className="h-px bg-blue-100" />
												<TeamRow seed={b.seed} team={b.team} isWinner={bWin} />
											</div>
										</div>
									);
								})}

								{matches.length === 0 ? (
									<div className="rounded-md border border-dashed border-blue-200 p-3 text-sm text-blue-700">
										No matches
									</div>
								) : null}
							</div>
						</section>
					);
				})}
			</div>
		</div>
	);
}

function TeamRow(props: { seed?: string; team: string; isWinner: boolean }) {
	return (
		<div
			className={
				"flex items-center gap-2 px-2 py-2 " +
				(props.isWinner ? "bg-blue-50" : "bg-white")
			}
		>
			<div className="w-7 shrink-0 text-center">
				{props.seed ? (
					<span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
						{props.seed}
					</span>
				) : (
					<span className="text-xs text-blue-500">—</span>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div
					className={
						"truncate text-sm " +
						(props.isWinner ? "font-semibold text-blue-950" : "text-blue-900")
					}
					title={props.team}
				>
					{props.team}
				</div>
			</div>

			{props.isWinner ? (
				<span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
					W
				</span>
			) : null}
		</div>
	);
}

