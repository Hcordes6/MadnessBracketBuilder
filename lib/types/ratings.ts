// Types related to api data schema used in builder.tsx and debug.tsx. Defined here to share between components without circular imports.


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
        teams: unknown[];
    }
    | {
        ok: false;
        error: string;
        details?: string;
    };