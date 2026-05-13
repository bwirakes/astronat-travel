/**
 * POST /api/house-matrix
 * Computes the 12-House scoring matrix and Generalized Event Scores for a destination.
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
 * Response: { ...HouseMatrixResult, eventScores: FinalEventScore[] }
 */
import { NextRequest, NextResponse } from "next/server";
import {
    computeHouseMatrix,
    mapTransitsToMatrix,
    computeGlobalPenalty,
    type MatrixNatalPlanet,
    type MatrixACGLine,
    type MatrixParan,
} from "@/app/lib/house-matrix";
import { houseFromLongitude } from "@/app/lib/geodetic";
import { computeEventScores, type OccupancyPlanet } from "@/app/lib/scoring-engine";
import { computeUniversalSky, type SkyStation } from "@/app/lib/universal-sky";
import { determineSect } from "@/app/lib/arabic-parts";
import { EPHEMERIS_DAILY_BODIES, getComputedSkyForDate } from "@/lib/astro/ephemeris-cache";

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
            refDate: refDateInput,
        } = body;

        if (!natalPlanets.length || !relocatedCusps.length) {
            return NextResponse.json(
                { error: "natalPlanets and relocatedCusps are required" },
                { status: 400 },
            );
        }

        // Universal sky state — optional refDate from body, defaults to now.
        // Reject malformed refDate inputs early before any ephemeris scan.
        let refDate: Date;
        if (refDateInput == null) {
            refDate = new Date();
        } else {
            const parsed = new Date(refDateInput);
            if (!Number.isFinite(parsed.getTime())) {
                return NextResponse.json(
                    { error: "refDate must be a valid ISO-8601 date string or omitted" },
                    { status: 400 },
                );
            }
            refDate = parsed;
        }
        const [universalSky, transitPositions] = await Promise.all([
            computeUniversalSky(refDate),
            getComputedSkyForDate(refDate, { bodies: EPHEMERIS_DAILY_BODIES }),
        ]);
        const stations = universalSky.stations.map((station: SkyStation) => ({
            planet: station.planet[0].toUpperCase() + station.planet.slice(1),
            type: station.direction,
            dateUtc: `${station.dateISO}T00:00:00Z`,
            longitude: station.longitude,
            sign: station.sign,
        }));

        // Map raw transit data into per-house scoring format
        const natalPlanetRows = natalPlanets as MatrixNatalPlanet[];
        const relocatedCuspRows = relocatedCusps as number[];
        const mappedTransits = mapTransitsToMatrix(transits, natalPlanetRows, relocatedCuspRows);
        const globalPenalty = computeGlobalPenalty(transits);

        // Compute sect from natal Sun position vs relocated ASC
        const sunEntry = natalPlanetRows.find(
            (p) => (p.planet || p.name || "").toLowerCase() === "sun"
        );
        const sect = sunEntry
            ? determineSect(sunEntry.longitude, relocatedCuspRows[0] ?? 0)
            : undefined;

        const matrixResult = computeHouseMatrix({
            natalPlanets: natalPlanetRows,
            relocatedCusps: relocatedCuspRows,
            acgLines: acgLines as MatrixACGLine[],
            transits: mappedTransits,
            parans: parans as MatrixParan[],
            destLat,
            destLon,
            globalPenalty,
            sect,
            refDate,
            transitPositions,
            stations,
        });

        // Compute Relocated Occupancy (P_occ) for scoring engine
        const ascLon = relocatedCuspRows[0] ?? 0;
        const relocatedPlanets: OccupancyPlanet[] = natalPlanetRows.map((p) => ({
            name: p.planet || p.name || "",
            house: houseFromLongitude(p.longitude, ascLon),
        }));

        // Execute Memo Part 2: Vectorizing Life Events
        const eventScores = computeEventScores(matrixResult, relocatedPlanets, universalSky);

        return NextResponse.json({ ...matrixResult, eventScores, universalSky });
    } catch (err) {
        console.error("[/api/house-matrix]", err);
        return NextResponse.json(
            { error: "House matrix computation failed", detail: String(err) },
            { status: 500 },
        );
    }
}
