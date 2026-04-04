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
    type MatrixTransit,
    type MatrixParan,
} from "@/app/lib/house-matrix";
import { houseFromLongitude } from "@/app/lib/geodetic";
import { computeEventScores, type OccupancyPlanet } from "@/app/lib/scoring-engine";

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
        const mappedTransits = mapTransitsToMatrix(transits, natalPlanets, relocatedCusps);
        const globalPenalty = computeGlobalPenalty(transits);

        const matrixResult = computeHouseMatrix({
            natalPlanets: natalPlanets as MatrixNatalPlanet[],
            relocatedCusps: relocatedCusps as number[],
            acgLines: acgLines as MatrixACGLine[],
            transits: mappedTransits,
            parans: parans as MatrixParan[],
            destLat,
            destLon,
            globalPenalty,
        });

        // Compute Relocated Occupancy (P_occ) for scoring engine
        const ascLon = relocatedCusps[0] ?? 0;
        const relocatedPlanets: OccupancyPlanet[] = natalPlanets.map((p: any) => ({
            name: p.planet,
            house: houseFromLongitude(p.longitude, ascLon),
        }));

        // Execute Memo Part 2: Vectorizing Life Events
        const eventScores = computeEventScores(matrixResult, relocatedPlanets);

        return NextResponse.json({ ...matrixResult, eventScores });
    } catch (err) {
        console.error("[/api/house-matrix]", err);
        return NextResponse.json(
            { error: "House matrix computation failed", detail: String(err) },
            { status: 500 },
        );
    }
}
