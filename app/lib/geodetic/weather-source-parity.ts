import { BODY_STAR_MATRIX } from "./body-star-matrix";
import { GEODETIC_FINGERPRINTS } from "./weather-fingerprints";
import { FORECAST_WEATHER_EVENTS, GEODETIC_ZONES, HISTORICAL_WEATHER_EVENTS } from "./weather-predictions";
import { HARD_ASPECTS_2026, MOON_CALENDAR_2026, MOON_PHASES_2026 } from "./weather-triggers";
import { WEATHER_TECHNIQUES } from "./weather-techniques";

export const WEATHER_SOURCE_PARITY = {
    htmlSource: "docs/geodetic-research/geodetic_dashboard_simplified.html",
    checks: [
        { label: "EVENTS", expected: 17, actual: HISTORICAL_WEATHER_EVENTS.length },
        { label: "RISK_CALENDAR", expected: 23, actual: FORECAST_WEATHER_EVENTS.length },
        { label: "GEO_ZONES", expected: 23, actual: Object.keys(GEODETIC_ZONES).length },
        { label: "ASPECTS_2026", expected: 13, actual: HARD_ASPECTS_2026.length },
        { label: "MOON_PHASES", expected: 21, actual: MOON_PHASES_2026.length },
        { label: "MOON_CALENDAR_WITH_ECLIPSES", expected: 25, actual: MOON_CALENDAR_2026.length },
        { label: "FINGERPRINTS", expected: 6, actual: GEODETIC_FINGERPRINTS.length },
        { label: "STARS_LIST", expected: 7, actual: BODY_STAR_MATRIX.stars.length },
        { label: "BODIES_LIST", expected: 10, actual: BODY_STAR_MATRIX.bodies.length },
        { label: "BASE_WEIGHTS", expected: 10, actual: WEATHER_TECHNIQUES.baseWeights.length },
        { label: "NEW_TECHNIQUE_WEIGHTS", expected: 14, actual: WEATHER_TECHNIQUES.newTechniqueWeights.length },
        { label: "SENSITIZER_WEIGHTS", expected: 5, actual: WEATHER_TECHNIQUES.sensitizerWeights.length },
        { label: "KEY_INGRESSES", expected: 15, actual: WEATHER_TECHNIQUES.keyIngresses.length },
    ],
};

export function assertWeatherSourceParity(): void {
    const failed = WEATHER_SOURCE_PARITY.checks.filter((check) => check.actual !== check.expected);
    if (failed.length > 0) {
        throw new Error(`Geodetic weather source parity failed: ${failed.map((f) => `${f.label} expected ${f.expected}, got ${f.actual}`).join("; ")}`);
    }
}
