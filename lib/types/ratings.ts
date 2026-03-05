// Types related to api data schema used in builder.tsx and debug.tsx. Defined here to share between components without circular imports.


export type TeamRating = {
    Rk: number;
    Team: string;
    Seed?: number;
    Conf: string;
    "W-L": string;
    NetRtg?: number;
    ORtg?: number;
    DRtg?: number;
    AdjT?: number;
    Luck?: number;
    raw: Record<string, string>;
};

// schema for expected JSON response from /api/ratings
export type RatingsResponse =
    | {
        ok: true;
        meta: {
            csvPath: string;
            headers: string[];
            warnings: string[];
            totalTeams: number;
            returnedTeams: number;
        };
        // When `fields` is provided, the API returns a shaped object per row.
        teams: TeamRating[] | Record<string, unknown>[];
    }
    | {
        ok: false;
        error: string;
        details?: string;
    };