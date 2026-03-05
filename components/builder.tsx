// Component for all bracket building logic and UI


"use client";

import { useEffect, useMemo, useState } from "react";

// schema for expected JSON response from /api/ratings
import { RatingsResponse } from "@/lib/types/ratings";
import { useRatings } from "@/lib/hooks/useRatings";
import { SingleEliminationBracket, Match, SVGViewer } from "@cm3tahkuh/react-tournament-brackets";



export default function Builder() {

    const [query, setQuery] = useState("/api/ratings?minRk=1&maxRk=68");
    const { status, data, errorText, reload } = useRatings(query);


    // Stats manipulation and memoization for rendering
    const stats = useMemo(() => {
        if (!data) return null;
        // Perform any necessary data transformations or calculations here
        return data;
    }, [data]);

    // Bracket data for rendering


    return (
        <div>
            <h1>Madness Bracket Builder</h1>
            <p>This is where the main app will go. For now, it's just a placeholder.</p>
            {errorText && <p className="error">{errorText}</p>}
            


            




        </div>
    );
}