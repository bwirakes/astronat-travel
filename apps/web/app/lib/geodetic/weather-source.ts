import { BODY_STAR_MATRIX } from "./body-star-matrix";
import { GEODETIC_FINGERPRINTS } from "./weather-fingerprints";
import {
    FORECAST_WEATHER_EVENTS,
    GEODETIC_ZONES,
    HISTORICAL_WEATHER_EVENTS,
} from "./weather-predictions";
import { HARD_ASPECTS_2026, MOON_CALENDAR_2026, MOON_PHASES_2026 } from "./weather-triggers";
import { WEATHER_TECHNIQUES } from "./weather-techniques";
import type { ComputedStatistics, GeodeticWeatherEvent, GeodeticWeatherSourceCatalog } from "./weather-types";

function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function safeDiv(numerator: number, denominator: number): number {
    return denominator === 0 ? 0 : numerator / denominator;
}

export function computeHistoricalStatistics(): ComputedStatistics {
    const events = HISTORICAL_WEATHER_EVENTS;
    const highCutoff = 0.45;
    let A = 0;
    let B = 0;
    let C = 0;
    let D = 0;
    let pssTotal = 0;
    let highPssCount = 0;
    let totalDamageBillions = 0;
    let eclipsePairCount = 0;
    let geostressCount = 0;

    const severityFive: GeodeticWeatherEvent[] = [];

    for (const event of events) {
        const severity = event.severity ?? 0;
        const isHighPss = event.pss >= highCutoff;
        const isSevere = severity >= 4;

        pssTotal += event.pss;
        totalDamageBillions += event.damageBillions ?? 0;
        if (event.pss >= 0.55) highPssCount += 1;
        if (event.pair) eclipsePairCount += 1;
        if (event.geostress) geostressCount += 1;
        if (severity === 5) severityFive.push(event);

        if (isHighPss && isSevere) A += 1;
        if (isHighPss && !isSevere) B += 1;
        if (!isHighPss && isSevere) C += 1;
        if (!isHighPss && !isSevere) D += 1;
    }

    const phiDen = Math.sqrt((A + B) * (C + D) * (A + C) * (B + D));
    const pHigh = safeDiv(A, A + B);
    const pLow = safeDiv(C, C + D);
    const h = 2 * Math.asin(Math.sqrt(pHigh)) - 2 * Math.asin(Math.sqrt(pLow));

    return {
        totalEvents: events.length,
        severityFiveCount: severityFive.length,
        highPssCount,
        meanPss: round3(pssTotal / Math.max(1, events.length)),
        eclipsePairCount,
        totalDamageBillions: round3(totalDamageBillions),
        contingency: { A, B, C, D },
        phi: phiDen === 0 ? 0 : round3((A * D - B * C) / phiDen),
        relativeRisk: pLow === 0 ? null : round3(pHigh / pLow),
        cohensH: round3(h),
        severityFiveHighPssPercent: Math.round(safeDiv(severityFive.filter((event) => event.pss >= highCutoff).length, severityFive.length) * 100),
        geostressCount,
    };
}

export const GEODETIC_WEATHER_SOURCE_CATALOG: GeodeticWeatherSourceCatalog = {
    historicalEvents: HISTORICAL_WEATHER_EVENTS,
    forecastEvents: FORECAST_WEATHER_EVENTS,
    geodeticZonesByDate: GEODETIC_ZONES,
    hardAspects2026: HARD_ASPECTS_2026,
    moonPhases2026: MOON_PHASES_2026,
    moonCalendar2026: MOON_CALENDAR_2026,
    fingerprints: GEODETIC_FINGERPRINTS,
    bodyStarMatrix: BODY_STAR_MATRIX,
    techniques: WEATHER_TECHNIQUES,
    statistics: computeHistoricalStatistics(),
};
