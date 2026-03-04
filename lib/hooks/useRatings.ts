// Custom hook for fetching ratings from /api/ratings with built-in loading and error handling.
// Abstracts logic away from builder component

import { useCallback, useEffect, useState } from "react";
import type { RatingsResponse } from "@/lib/types/ratings";


export function useRatings(query: string) {
    //status tracking for API call: idle, loading, success, error
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
        "idle"
    );
    const [data, setData] = useState<RatingsResponse | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);



    // loading data from /api/ratings with error handling
    // useCallback to memo load function and avoid unnecessary re-renders
    const load = useCallback(async () => {
        setStatus("loading");
        setErrorText(null);
        setData(null);
        try {
            const res = await fetch(query, {cache: "no-store" });
            const json = (await res.json()) as RatingsResponse; // RatingsResponse ensures correct schema
            setData(json); // store json in state
            setStatus(res.ok && json.ok ? "success" : "error"); // success if HTTP and API indicate success
            console.log("Loaded data:", json);

            // Detailed error handling for both HTTP and API errors -- debug
            if (!res.ok) {
                setErrorText(`HTTP ${res.status} ${res.statusText}`);
            } else if (!json.ok) {
                setErrorText(`API error: ${json.error}`);
            }
        } catch (e) {
            setErrorText(e instanceof Error ? e.message : String(e));
            setStatus("error");
        }
    }, [query]);

    // load data on component mount (load)
    // Comment prevents warnings from lint
    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]); // dependency on load ensures it runs when query changes

    return { status, data, errorText, reload: load }; // load function masked as reload for external use
}
