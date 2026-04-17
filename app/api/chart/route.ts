/**
 * POST /api/chart
 * Legacy stub — the natal-registration pipeline now lives inside the reading
 * generation flow (see /api/readings). Kept only so old clients don't 404.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { name, date, time, city } = await req.json();

        if (!name || !date || !time || !city) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const userId = `${name.toLowerCase().replace(/\s+/g, "_")}_${date.replace(/-/g, "")}`;
        return NextResponse.json({
            user_id: userId,
            status: "mock",
            natal_planets: [],
            mock: true,
        });
    } catch (err) {
        console.error("[/api/chart]", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
