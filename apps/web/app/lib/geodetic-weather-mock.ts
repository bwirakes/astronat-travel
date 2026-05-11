/**
 * Deterministic mock forecast generator. Used by /api/readings/generate
 * when the real engine (computeGeodeticWeather) is not yet available on
 * this branch — the engine lives on feat/geodetic-weather.
 *
 * Replace the call site with a direct import once the engine merges:
 *
 *   import { computeGeodeticWeather } from "@/app/lib/geodetic-weather";
 */

import type {
    GeodeticWeatherResult,
    GWEvent,
    GWFixedAngles,
    Tier,
} from "./geodetic-weather-types";

/** Deterministic PRNG keyed on seed — gives stable forecasts for demos. */
function mulberry32(seed: number) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length) % arr.length];
}

function scoreToTier(score: number): Tier {
    if (score >= 78) return "Calm";
    if (score >= 62) return "Unsettled";
    if (score >= 44) return "Turbulent";
    if (score >= 26) return "Severe";
    return "Extreme";
}

/**
 * Deterministically compute the four fixed angles of a city from its
 * longitude — placeholder until the real geodetic formulas run.
 */
export function mockFixedAngles(lat: number, lon: number): GWFixedAngles {
    const mc = ((lon % 360) + 360) % 360;
    const ic = (mc + 180) % 360;
    const asc = (mc + 90) % 360;
    const dsc = (asc + 180) % 360;
    return { mc, ic, asc, dsc };
}

const EVENT_TEMPLATES: Array<(rng: () => number) => GWEvent> = [
    (r) => ({
        layer: "angle-transit",
        label: `${pick(r, ["Neptune", "Saturn", "Pluto", "Mars"])} on fixed MC (orb ${(r() * 2 + 0.4).toFixed(1)}°)`,
        planets: [pick(r, ["Neptune", "Saturn", "Pluto", "Mars"])],
        orb: +(r() * 2 + 0.4).toFixed(2),
        severity: -Math.round(8 + r() * 14),
        direction: "malefic",
    }),
    (r) => ({
        layer: "station",
        label: `${pick(r, ["Mars", "Mercury", "Jupiter"])} station direct in ${Math.floor(r() * 18 + 6)}d near ${pick(r, ["IC", "ASC", "MC"])} (orb ${(r() * 1.3 + 0.5).toFixed(1)}°)`,
        planets: [pick(r, ["Mars", "Mercury", "Jupiter"])],
        severity: -Math.round(10 + r() * 12),
        direction: "malefic",
    }),
    (r) => ({
        layer: "late-degree",
        label: `Pluto at ${(26 + r() * 3.9).toFixed(1)}° ${pick(r, ["Capricorn", "Scorpio", "Aquarius"])} [Earth]`,
        planets: ["Pluto"],
        severity: -Math.round(12 + r() * 12),
        direction: "malefic",
    }),
    (r) => ({
        layer: "eclipse",
        label: `Solar eclipse aftershock @ ${Math.floor(r() * 180 + 180)}° longitude band`,
        planets: ["Sun", "Moon"],
        severity: -Math.round(14 + r() * 10),
        direction: "malefic",
    }),
    (r) => ({
        layer: "paran",
        label: `${pick(r, ["Jupiter", "Venus"])}/${pick(r, ["Sun", "Moon"])} paran at this latitude`,
        planets: [pick(r, ["Jupiter", "Venus"]), pick(r, ["Sun", "Moon"])],
        severity: Math.round(6 + r() * 10),
        direction: "benefic",
    }),
    (r) => ({
        layer: "world-point",
        label: `${pick(r, ["Uranus", "Pluto"])} at 0° ${pick(r, ["Aries", "Cancer", "Libra", "Capricorn"])}`,
        planets: [pick(r, ["Uranus", "Pluto"])],
        severity: -Math.round(9 + r() * 9),
        direction: "malefic",
    }),
    (r) => ({
        layer: "configuration",
        label: `T-square: ${pick(r, ["Mars", "Saturn"])} / ${pick(r, ["Uranus", "Pluto"])} / ${pick(r, ["Node", "Sun"])}`,
        planets: [pick(r, ["Mars", "Saturn"]), pick(r, ["Uranus", "Pluto"])],
        severity: -Math.round(7 + r() * 8),
        direction: "malefic",
    }),
    (r) => ({
        layer: "severity-modifier",
        label: "OOB Mars + OOB Moon combo",
        planets: ["Mars", "Moon"],
        severity: -Math.round(10 + r() * 6),
        direction: "malefic",
        note: "Research-cited amplifier",
    }),
];

export function mockDayForecast(opts: {
    dateUtc: Date;
    lat: number;
    lon: number;
    seed: number;
    fixedAngles: GWFixedAngles;
}): GeodeticWeatherResult {
    const { dateUtc, lat, lon, seed, fixedAngles } = opts;
    const rng = mulberry32(seed);

    // Base score oscillates around 60 with slow drift + day-level noise.
    const dayIdx = Math.floor(dateUtc.getTime() / 86400000);
    const drift = Math.sin(dayIdx * 0.21 + seed * 0.003) * 18;
    const noise = (rng() - 0.5) * 22;
    const baseScore = Math.round(62 + drift + noise);

    // Number of events roughly correlates with how unsettled the day is.
    const intensity = Math.max(0, (70 - baseScore) / 12);
    const eventCount = Math.min(6, Math.max(1, Math.round(intensity + rng() * 2)));

    const events: GWEvent[] = [];
    const pool = [...EVENT_TEMPLATES];
    for (let i = 0; i < eventCount; i++) {
        const idx = Math.floor(rng() * pool.length) % pool.length;
        events.push(pool[idx](rng));
    }
    events.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));

    const score = Math.min(100, Math.max(0, baseScore));
    const severity = scoreToTier(score);
    const severityPreShift: Tier = severity;

    const hasOob = rng() > 0.7;
    const oobPlanets = hasOob
        ? [{ name: pick(rng, ["Mars", "Moon", "Mercury"]), declination: +(23 + rng() * 3).toFixed(2), longitude: +(rng() * 360).toFixed(2) }]
        : [];

    const severityModifiers =
        hasOob && rng() > 0.5
            ? [{ label: "OOB Mars + OOB Moon combo", tierShift: 1, direction: "malefic" as const }]
            : [];

    return {
        dateUtc: dateUtc.toISOString(),
        location: { lat, lon },
        fixedAngles,
        score,
        severity,
        severityPreShift,
        events,
        breakdown: {
            bucketAngle: Math.round(score * 0.8 + rng() * 10),
            bucketParan: Math.round(score * 0.9 + rng() * 8),
            bucketStation: Math.round(score * 0.7 + rng() * 14),
            bucketIngress: Math.round(score * 0.6 + rng() * 16),
            bucketEclipse: Math.round(score * 1.1 + rng() * 6),
            bucketLate: Math.round(score * 0.4 + rng() * 20),
            bucketConfig: Math.round(score * 0.8 + rng() * 10),
            tierShift: severityModifiers.length,
        },
        severityModifiers,
        oobPlanets,
        phasesActive: [1, 2, 3, 4, 6, 7, 8, 9].filter(() => rng() > 0.25),
    };
}

export function mockWindowForecast(opts: {
    lat: number;
    lon: number;
    label: string;
    startDate: Date;
    windowDays: number;
}) {
    const { lat, lon, label, startDate, windowDays } = opts;
    const fixedAngles = mockFixedAngles(lat, lon);
    // Seed by location + start day so the same query returns the same forecast.
    const baseSeed = Math.floor(lat * 1000 + lon * 37 + startDate.getTime() / 86400000);
    const days: GeodeticWeatherResult[] = [];
    for (let i = 0; i < windowDays; i++) {
        const d = new Date(startDate);
        d.setUTCDate(d.getUTCDate() + i);
        d.setUTCHours(12, 0, 0, 0);
        days.push(
            mockDayForecast({
                dateUtc: d,
                lat,
                lon,
                seed: baseSeed + i * 911,
                fixedAngles,
            }),
        );
    }
    return { label, lat, lon, fixedAngles, days };
}
