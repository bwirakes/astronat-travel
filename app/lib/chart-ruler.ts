/**
 * Chart ruler relocation logic.
 * Determines how the chart ruler shifts houses when relocating.
 */
import { SIGN_RULERS } from "./astro-constants";
import { computeRelocatedAscLon, signFromLongitude, houseFromLongitude } from "./geodetic";

export interface ChartRulerContext {
    natalAscSign: string;
    relocatedAscSign: string;
    relocatedSign: string;  // alias for relocatedAscSign
    rulerPlanet: string;    // alias for chartRuler
    chartRuler: string;
    natalRulerHouse: number;
    relocatedRulerHouse: number;
    relocatedHouse: number; // alias for relocatedRulerHouse
}

export function computeChartRulerContext(
    natalPlanets: { planet: string; longitude?: number }[],
    destLat: number,
    destLon: number,
    birthLat: number,
    birthLon: number,
    relocatedCusps?: number[] | null,
    natalCusps?: number[] | null,
): ChartRulerContext | null {
    // Use actual Placidus cusps when available, fall back to geodetic
    let ascNatalLon: number;
    if (natalCusps && natalCusps.length >= 1) {
        ascNatalLon = natalCusps[0]; // cusp 1 = Ascendant
    } else {
        ascNatalLon = computeRelocatedAscLon(birthLat, birthLon);
    }
    const natalAscSign = signFromLongitude(ascNatalLon);

    let ascDestLon: number;
    if (relocatedCusps && relocatedCusps.length >= 1) {
        ascDestLon = relocatedCusps[0]; // cusp 1 = Ascendant
    } else {
        ascDestLon = computeRelocatedAscLon(destLat, destLon);
    }
    const relocatedAscSign = signFromLongitude(ascDestLon);

    const chartRuler = SIGN_RULERS[relocatedAscSign] || SIGN_RULERS[natalAscSign] || "Sun";

    // Find the chart ruler planet in the natal array
    const rulerPlanet = natalPlanets.find(
        (p) => p.planet.toLowerCase() === chartRuler.toLowerCase(),
    );
    if (!rulerPlanet || rulerPlanet.longitude === undefined) return null;

    const natalRulerHouse = houseFromLongitude(rulerPlanet.longitude, ascNatalLon);
    const relocatedRulerHouse = houseFromLongitude(rulerPlanet.longitude, ascDestLon);

    return {
        natalAscSign,
        relocatedAscSign,
        relocatedSign: relocatedAscSign,
        rulerPlanet: chartRuler,
        chartRuler,
        natalRulerHouse,
        relocatedRulerHouse,
        relocatedHouse: relocatedRulerHouse,
    };
}

