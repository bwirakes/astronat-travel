/**
 * POST /api/house-matrix
 * Computes the 12-House scoring matrix for a destination.
 *
 * Request body:
 *   {
 *     natalPlanets: NatalPlanet[],
 *     relocatedCusps: number[],
 *     acgLines: { planet, angle, distance_km }[],
 *     transits: TransitAspect[],
 *     parans: { p1, p2, lat }[],
 *     destLat: number,
 *     destLon: number,
 *   }
 *
 * Response: HouseMatrixResult
 */
import { NextRequest, NextResponse } from "next/server";
import {
    computeHouseMatrix,
    type MatrixNatalPlanet,
    type MatrixACGLine,
    type MatrixTransit,
    type MatrixParan,
} from "@/app/lib/house-matrix";
import { SIGN_RULERS, BENEFIC_PLANETS } from "@/app/lib/astro-constants";
import { signFromLongitude, houseFromLongitude } from "@/app/lib/geodetic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            natalPlanets = [],
            relocatedCusps = [],
            acgLines = [],
            transits = [],
            parans = [],
            destLat = 0,
            destLon = 0,
        } = body;

        if (!natalPlanets.length || !relocatedCusps.length) {
            return NextResponse.json(
                { error: "natalPlanets and relocatedCusps are required" },
                { status: 400 },
            );
        }

        // Map raw transit data into per-house scoring format
        const ascLon = relocatedCusps[0] ?? 0;
        const mappedTransits: MatrixTransit[] = (transits as any[]).map((t) => {
            const transitPlanetName = (
                t.transit_planet ||
                (t.planets ? t.planets.split(" ")[0] : "")
            ).toLowerCase();
            const natalPlanetName = (
                t.natal_planet ||
                (t.planets && t.planets.includes("natal")
                    ? t.planets.split("natal ")[1]
                    : "")
            ).toLowerCase();

            // Find which relocated house the natal planet aspect targets
            const natalP = natalPlanets.find(
                (p: MatrixNatalPlanet) =>
                    p.planet.toLowerCase() === natalPlanetName,
            );
            const targetHouse = natalP
                ? houseFromLongitude(natalP.longitude, ascLon)
                : undefined;

            const aspectStr = (t.aspect || t.type || "").toLowerCase();
            const isHard = ["square", "opposition", "□", "☍"].some((a) =>
                aspectStr.includes(a),
            );
            const isSoft = ["trine", "sextile", "△", "⚹"].some((a) =>
                aspectStr.includes(a),
            );
            const isConj = ["conjunction", "☌"].some((a) =>
                aspectStr.includes(a),
            );

            const isBeneficPlanet = BENEFIC_PLANETS.includes(transitPlanetName);
            let benefic = false;
            if (isSoft && isBeneficPlanet) benefic = true;
            else if (isConj && isBeneficPlanet) benefic = true;
            else if (isSoft) benefic = true;
            // Hard aspects or malefic conjunctions → benefic = false (malefic)

            // Determine if the transit planet rules any relocated house
            let rulerOf: number | undefined;
            for (let h = 0; h < 12; h++) {
                const cSign = signFromLongitude(relocatedCusps[h] ?? 0);
                const cRuler = SIGN_RULERS[cSign] || "";
                if (cRuler.toLowerCase() === transitPlanetName) {
                    rulerOf = h + 1;
                    break;
                }
            }

            return {
                targetHouse,
                transitPlanet: transitPlanetName,
                natalPlanet: natalPlanetName,
                aspect: aspectStr,
                orb: t.orb,
                applying: t.applying ?? true,
                benefic,
                transitRx: t.retrograde ?? false,
                rulerOf,
            } satisfies MatrixTransit;
        });

        // ── Compute global timing penalty from tense applying hard transits
        const MALEFIC_NAMES = ["mars", "saturn", "pluto", "uranus"];
        let globalPenalty = 0;
        for (const t of (transits as any[])) {
            const aspectStr = (t.aspect || t.type || "").toLowerCase();
            const isHardTransit = ["square", "opposition"].some(a => aspectStr.includes(a));
            if (!isHardTransit) continue;
            const applying = t.applying ?? true;
            if (!applying) continue; // Only applying hard transits affect base timing
            const tPlanet = (
                t.transit_planet ||
                (t.planets ? t.planets.split(" ")[0] : "")
            ).toLowerCase();
            const isMalefic = MALEFIC_NAMES.some(m => tPlanet.includes(m));
            const orb = t.orb ?? 5;
            if (orb <= 1 && isMalefic)      globalPenalty += 14;
            else if (orb <= 2 && isMalefic) globalPenalty += 10;
            else if (orb <= 3 && isMalefic) globalPenalty += 6;
            else if (orb <= 1)              globalPenalty += 8;
            else if (orb <= 3)              globalPenalty += 4;
        }
        globalPenalty = Math.min(25, globalPenalty); // cap at -25 pts

        const result = computeHouseMatrix({
            natalPlanets: natalPlanets as MatrixNatalPlanet[],
            relocatedCusps: relocatedCusps as number[],
            acgLines: acgLines as MatrixACGLine[],
            transits: mappedTransits,
            parans: parans as MatrixParan[],
            destLat,
            destLon,
            globalPenalty,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[/api/house-matrix]", err);
        return NextResponse.json(
            { error: "House matrix computation failed", detail: String(err) },
            { status: 500 },
        );
    }
}
