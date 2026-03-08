/**
 * POST /api/transits
 * Get 12-month transit windows for a registered user.
 */
import { NextRequest, NextResponse } from "next/server";
import { get12MonthTransits } from "@/app/lib/astro-client";
import { MOCK_12_MONTH_WINDOWS, TravelWindow } from "@/app/lib/planet-data";

export async function POST(req: NextRequest) {
    try {
        const { user_id, start_date } = await req.json();

        if (!user_id || !start_date) {
            return NextResponse.json({ error: "Missing user_id or start_date" }, { status: 400 });
        }

        const result = await get12MonthTransits(user_id, start_date);

        if (!result) {
            return NextResponse.json({ windows: MOCK_12_MONTH_WINDOWS, mock: true });
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

                return {
                    month,
                    quality: isChallenging ? "caution" : isBenefic ? "excellent" : "good",
                    reason: `${a.transit_planet} ${a.aspect} natal ${a.natal_planet}`,
                    house: "9th House (Travel)",
                } satisfies TravelWindow;
            });

        // Pad with mock data if fewer than 12 real windows
        const padded = windows.length >= 12
            ? windows.slice(0, 12)
            : [...windows, ...MOCK_12_MONTH_WINDOWS.slice(windows.length)];

        return NextResponse.json({ windows: padded, raw: result });
    } catch (err) {
        console.error("[/api/transits]", err);
        return NextResponse.json({ windows: MOCK_12_MONTH_WINDOWS, mock: true });
    }
}
