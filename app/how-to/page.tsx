import Link from "next/link";
import posthog from 'posthog-js'

export default function HowToPage() {
    return (
        <div className="min-h-screen bg-white font-sans">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-blue-900">How to use</h1>
                    <Link
                        href="/"
                        className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                    >
                        Back to builder
                    </Link>
                </div>

                <section className="rounded-lg border border-blue-100 bg-white p-4">
                    <h2 className="text-sm font-semibold text-blue-900">Building your bracket</h2>
                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-blue-900">
                        <li>
                            Adjust the stat sliders to set how much each stat matters in this simulation. If a team has a better stat value in the given matchup, it will be favored in the simulation. Get creative with which stats you weight more heavily.

                            <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                                <div className="text-xs font-semibold text-blue-900">Example matchup</div>
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div className="rounded-md border border-blue-100 bg-white p-2">
                                        <div className="text-[11px] font-semibold text-blue-900">Sliders</div>
                                        <div className="mt-1 text-[11px] text-blue-800">
                                            ORtg: <span className="font-semibold">100%</span> • All others: <span className="font-semibold">0%</span>
                                        </div>
                                        <div className="mt-1 text-[11px] text-blue-800">
                                            Randomness: <span className="font-semibold">0%</span>
                                        </div>
                                    </div>

                                    <div className="rounded-md border border-blue-100 bg-white p-2">
                                        <div className="text-[11px] font-semibold text-blue-900">How the pick is made</div>
                                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-blue-800">
                                            <span className="font-semibold text-blue-900">Duke</span>
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5">higher ORtg</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-blue-800">
                                            <span className="font-semibold text-blue-900">McNeese St</span>
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5">lower ORtg</span>
                                        </div>
                                        <div className="mt-2 text-[11px] text-blue-900">
                                            Result: <span className="font-semibold">Duke wins</span> (higher weighted score)
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 text-[11px] text-blue-800">
                                    This is a simplified illustration: with Randomness at 0%, the same weights produce the same winner for a given matchup.
                                </div>
                            </div>
                        </li>
                        <li>
                            Set <span className="font-semibold">Randomness / Upset Factor</span> to blend results toward a
                            coin-flip. This will allow for more upsets and variability in the bracket. At 0% randomness, the same weights will always produce the same bracket.

                            <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                                <div className="text-xs font-semibold text-blue-900">Example upset (Randomness enabled)</div>
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div className="rounded-md border border-blue-100 bg-white p-2">
                                        <div className="text-[11px] font-semibold text-blue-900">Sliders</div>
                                        <div className="mt-1 text-[11px] text-blue-800">
                                            ORtg: <span className="font-semibold">100%</span> • All others: <span className="font-semibold">0%</span>
                                        </div>
                                        <div className="mt-1 text-[11px] text-blue-800">
                                            Randomness: <span className="font-semibold">35%</span>
                                        </div>
                                    </div>

                                    <div className="rounded-md border border-blue-100 bg-white p-2">
                                        <div className="text-[11px] font-semibold text-blue-900">What can happen</div>
                                        <div className="mt-1 text-[11px] text-blue-800">
                                            Even if <span className="font-semibold text-blue-900">Duke</span> has the higher ORtg, Randomness nudges the probability toward 50/50.
                                        </div>
                                        <div className="mt-2 text-[11px] text-blue-900">
                                            Result (one run): <span className="font-semibold">McNeese St wins</span> (an upset draw)
                                        </div>
                                        <div className="mt-1 text-[11px] text-blue-800">
                                            Re-running can produce different outcomes when Randomness is above 0%.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li>
                            Press <span className="font-semibold">Resimulate</span> to apply your changes and
                            re-run the bracket.
                        </li>
                        <li>The bracket scrolls horizontally if it doesn’t fit on screen.</li>
                    </ol>
                    <p className="mt-3 text-sm text-blue-800">
                        Note: when Randomness is 0%, results are deterministic for a given set of weights.
                    </p>
                </section>

                <section className="rounded-lg border border-blue-100 bg-white p-4">
                    <h2 className="text-sm font-semibold text-blue-900">Stats explained</h2>
                    <p className="mt-2 text-sm text-blue-800">
                        These are KenPom-style efficiency/tempo metrics. For deeper definitions,
                        see{" "}
                        <a
                            href="https://kenpom.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-900 underline"
                        >
                            kenpom.com
                        </a>
                        .
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Stat
                            title="Net Rating (NetRtg)"
                            body="Overall efficiency margin; higher generally indicates a stronger team."
                        />
                        <Stat
                            title="Offense (ORtg)"
                            body="Offensive efficiency; Points scored per 100 possessions (adjusted for opponent)."
                        />
                        <Stat
                            title="Defense (DRtg)"
                            body="Defensive efficiency; Points allowed per 100 possessions (adjusted for opponent)."
                        />
                        <Stat
                            title="Tempo (AdjT)"
                            body="Adjusted tempo / pace; Possessions per 40 minutes (adjusted for opponent)."
                        />
                        <Stat title="Luck" body="Variation around expected performance; Note the Pomeroy calculation on his website." />
                        <Stat
                            title="Strength of Schedule (SOSNetRtg)"
                            body="Schedule strength; higher indicates a tougher schedule."
                        />
                        <Stat
                            title="Non-Conf SOS (NCSOSNetRtg)"
                            body="Non-conference schedule strength; higher indicates a tougher non-conference slate."
                        />
                        <Stat
                            title="Win % (W/L)"
                            body="Derived from the W-L record as wins / (wins + losses); higher is better."
                        />
                    </div>

                    <p className="mt-4 text-xs text-blue-700">
                        This project is not affiliated with KenPom.
                    </p>
                </section>
            </div>
        </div>
    );
}

function Stat(props: { title: string; body: string }) {
    return (
        <div className="rounded-md border border-blue-100 bg-white p-3">
            <div className="text-sm font-semibold text-blue-900">{props.title}</div>
            <div className="mt-1 text-sm text-blue-800">{props.body}</div>
        </div>
    );
}
