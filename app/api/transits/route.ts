/**
 * POST /api/transits
 * Get 12-month transit windows for a registered user.
 */
import { NextRequest, NextResponse } from "next/server";
import { get12MonthTransits } from "@/app/lib/astro-client";
import { generateTravelWindows, TravelWindow } from "@/app/lib/planet-data";

export async function POST(req: NextRequest) {
    let start_date = "";
    try {
        const body = await req.json();
        const { user_id } = body;
        start_date = body.start_date || "";

        if (!user_id || !start_date) {
            return NextResponse.json({ error: "Missing user_id or start_date" }, { status: 400 });
        }

        const result = await get12MonthTransits(user_id, start_date);

        if (!result) {
            // Generate windows starting from the actual travel date
            return NextResponse.json({ windows: generateTravelWindows(start_date), mock: true });
        }

        // Convert raw aspect hits to TravelWindow format
        const windows: TravelWindow[] = (result.major_aspects || [])
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
                    score,
                    personalScore: pScore,
                    collectiveScore: cScore,
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
        console.error("[/api/transits]", err);
        return NextResponse.json({ windows: generateTravelWindows(start_date), mock: true });
    }
}
