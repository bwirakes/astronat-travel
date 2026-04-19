import { NextRequest, NextResponse } from "next/server";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { relocatedAngles } from "@/lib/astro/relocate";
import {
    geodeticMCLongitude,
    geodeticASCLongitude,
    geodeticMCSign,
    geodeticASCSign,
    signFromLongitude,
} from "@/app/lib/geodetic";

/**
 * DEV-ONLY eval endpoint. Given a natal instant + birthplace and a
 * destination, returns everything we need to reproduce the PDF's
 * Trump-in-Europe sanity check end-to-end:
 *   1. Natal planet longitudes (Swiss Ephemeris)
 *   2. Natal Ascendant + Midheaven (at birthplace)
 *   3. Relocated Ascendant + Midheaven (at destination, natal instant)
 *   4. Geodetic Ascendant + Midheaven (city-level, time-invariant)
 */
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "dev-only" }, { status: 404 });
    }
    try {
        const { natalUtc, birthLat, birthLon, destLat, destLon } = await req.json();
        if (!natalUtc || birthLat == null || birthLon == null || destLat == null || destLon == null) {
            return NextResponse.json(
                { error: "Required: natalUtc, birthLat, birthLon, destLat, destLon" },
                { status: 400 },
            );
        }
        const dt = new Date(natalUtc);
        if (Number.isNaN(dt.getTime())) {
            return NextResponse.json({ error: "Invalid natalUtc" }, { status: 400 });
        }

        const swe = await SwissEphSingleton.getInstance();
        const jd = swe.julday(
            dt.getUTCFullYear(),
            dt.getUTCMonth() + 1,
            dt.getUTCDate(),
            dt.getUTCHours() + dt.getUTCMinutes() / 60.0,
        );
        const sys = Math.abs(birthLat) >= 66 ? "W" : "P";
        const natalHouses = swe.houses(jd, Number(birthLat), Number(birthLon), sys) as any;
        const natalCusps: number[] = [];
        for (let i = 1; i <= 12; i++) natalCusps.push(natalHouses.cusps[i.toString()]);
        const natalAscLon = natalCusps[0];
        const natalMcLon = natalCusps[9];
        const natalAscSign = signFromLongitude(natalAscLon);
        const natalMcSign = signFromLongitude(natalMcLon);

        const planets = await computeRealtimePositions(dt, natalCusps);

        const relocation = await relocatedAngles(dt, Number(destLat), Number(destLon));

        const geodeticMc = geodeticMCLongitude(Number(destLon));
        const geodeticAsc = geodeticASCLongitude(Number(destLon), Number(destLat));

        return NextResponse.json({
            natal: {
                ascLon: natalAscLon,
                ascSign: natalAscSign,
                mcLon: natalMcLon,
                mcSign: natalMcSign,
                cusps: natalCusps,
                planets,
            },
            relocated: {
                ascLon: relocation.ascLon,
                ascSign: signFromLongitude(relocation.ascLon),
                mcLon: relocation.mcLon,
                mcSign: signFromLongitude(relocation.mcLon),
                icLon: relocation.icLon,
                dscLon: relocation.dscLon,
            },
            geodetic: {
                mcLon: geodeticMc,
                mcSign: geodeticMCSign(Number(destLon)),
                ascLon: geodeticAsc,
                ascSign: geodeticASCSign(Number(destLon), Number(destLat)),
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message, stack: err?.stack }, { status: 500 });
    }
}
