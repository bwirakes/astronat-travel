import { NextRequest, NextResponse } from "next/server";
import { relocatedAngles } from "@/lib/astro/relocate";

/**
 * DEV-ONLY utility: compute relocated ASC/MC for evaluation purposes.
 * Guarded behind NODE_ENV === "development".
 *
 * Request: { natalUtc: ISO string, destLat: number, destLon: number }
 */
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "dev-only" }, { status: 404 });
    }
    try {
        const body = await req.json();
        const { natalUtc, destLat, destLon } = body;
        if (!natalUtc || destLat == null || destLon == null) {
            return NextResponse.json({ error: "Required: natalUtc, destLat, destLon" }, { status: 400 });
        }
        const dt = new Date(natalUtc);
        if (Number.isNaN(dt.getTime())) {
            return NextResponse.json({ error: "Invalid natalUtc" }, { status: 400 });
        }
        const angles = await relocatedAngles(dt, Number(destLat), Number(destLon));
        return NextResponse.json(angles);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 });
    }
}
