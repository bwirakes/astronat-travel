/**
 * POST /api/transits
 * Get 12-month transit windows for a registered user.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNatalChart } from "@/lib/db";
import { solve12MonthTransits } from "@/lib/astro/transit-solver";
import { generateTravelWindows, TravelWindow } from "@/app/lib/planet-data";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureServerError } from "@/lib/monitoring/sentry";

export async function POST(req: NextRequest) {
    let start_date = "";
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const limited = await enforceRateLimit(req, "astroCompute", user.id);
        if (limited) return limited;

        const body = await req.json();
        start_date = body.start_date || "";

        if (!start_date) {
            return NextResponse.json({ error: "Missing start_date" }, { status: 400 });
        }

        const chart = await getNatalChart(user.id);
        if (!chart?.ephemeris_data?.planets) {
            return NextResponse.json({ windows: generateTravelWindows(start_date), mock: true });
        }

        const natalPlanets = chart.ephemeris_data.planets;
        const refDate = new Date(start_date);
        const result = await solve12MonthTransits(natalPlanets, refDate);

        if (!result || result.length === 0) {
            // Generate windows starting from the actual travel date
            return NextResponse.json({ windows: generateTravelWindows(start_date), mock: true });
        }

        // Convert raw aspect hits to TravelWindow format
        const windows: TravelWindow[] = result
            .slice(0, 12)
            .map((a) => {
                const isChallenging = ["square", "opposition"].includes(a.aspect.toLowerCase());
                const isBenefic = ["trine", "sextile", "conjunction"].includes(a.aspect.toLowerCase())
                    && ["Venus", "Jupiter", "Sun"].includes(a.transit_planet);

                const date = new Date(a.date);
                const month = date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
                const quality = isChallenging ? "caution" : isBenefic ? "excellent" : "good";
                
                let score = 70;
                if (quality === "excellent") score = 85;
                if (quality === "caution") score = 45;
                
                const pScore = Math.round(score * 0.7);
                const cScore = score - pScore;

                return {
                    month,
                    quality,
                    score: pScore + cScore,
                    reason: `${a.transit_planet} ${a.aspect} natal ${a.natal_planet}`,
                    house: "9th House (Travel)",
                } satisfies TravelWindow;
            });

        // Pad with date-anchored mock if fewer than 12 real windows
        const mock = generateTravelWindows(start_date);
        const padded = windows.length >= 12
            ? windows.slice(0, 12)
            : [...windows, ...mock.slice(windows.length)];

        return NextResponse.json({ windows: padded, raw: result });
    } catch (err) {
        captureServerError(err, { route: "/api/transits", method: "POST" });
        console.error("[/api/transits]", err);
        return NextResponse.json({ windows: generateTravelWindows(start_date), mock: true });
    }
}
