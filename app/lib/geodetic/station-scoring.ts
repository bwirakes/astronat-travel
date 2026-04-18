/**
 * Layer 3 — Retrograde Station Proximity to Fixed Angles.
 *
 * When a planet stations near a location's fixed geodetic angle, its ACG
 * line "dwells" over that longitude for weeks or months. Station DIRECT >
 * Station RETROGRADE: compressed energy releases outward at direct.
 */
import { stationsInWindow, type StationEvent } from "./geodetic-events";
import type { AngleName } from "./angle-transits";

const TIME_WINDOW_DAYS = 30;
const ORB_MAX = 3;
const ORB_SIGMA_SQ_2 = 4.5;

const TIME_SIGMA_DAYS: Record<string, number> = {
    mars: 10, mercury: 5, venus: 8, jupiter: 15,
    saturn: 20, uranus: 25, neptune: 25, pluto: 25,
};

const STATION_BASE: Record<string, number> = {
    mars: -30, saturn: -25, uranus: -30, pluto: -28, neptune: -22,
    mercury: -10, venus: +6, jupiter: +12,
};

const ANGLE_STRENGTH: Record<AngleName, number> = {
    ASC: 1.20, MC: 1.10, DSC: 0.95, IC: 0.90,
};

const DIRECT_MULT = 1.4;

export interface StationContribution {
    planet: string;
    type: "retrograde" | "direct";
    stationDateUtc: string;
    daysFromTarget: number;
    closestAngle: AngleName;
    angleOrb: number;
    severity: number;
    direction: "malefic" | "benefic" | "neutral";
}

export interface StationsResult {
    raw: number;
    contributions: StationContribution[];
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

export function scoreStations(params: {
    dateUtc: Date;
    geoMC: number;
    geoASC: number;
    stations?: StationEvent[];
}): StationsResult {
    const { dateUtc, geoMC, geoASC, stations } = params;
    const geoIC  = (geoMC  + 180) % 360;
    const geoDSC = (geoASC + 180) % 360;
    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC }, { name: "MC",  lon: geoMC  },
        { name: "DSC", lon: geoDSC }, { name: "IC",  lon: geoIC  },
    ];

    const candidates = stations
        ? stations.map(s => ({
              ...s,
              daysFromTarget: (new Date(s.dateUtc).getTime() - dateUtc.getTime()) / 86400000,
          }))
        : stationsInWindow(dateUtc, TIME_WINDOW_DAYS);

    const contribs: StationContribution[] = [];
    let raw = 0;

    for (const s of candidates) {
        const plLower = s.planet.toLowerCase();
        const base = STATION_BASE[plLower];
        if (base === undefined) continue;

        let closest: AngleName = "MC";
        let closestOrb = 999;
        for (const a of angles) {
            const d = angularDiff(s.longitude, a.lon);
            if (d < closestOrb) { closestOrb = d; closest = a.name; }
        }
        if (closestOrb > ORB_MAX) continue;

        const sigmaDays = TIME_SIGMA_DAYS[plLower] ?? 15;
        const timeFactor = Math.exp(-(s.daysFromTarget * s.daysFromTarget) / (2 * sigmaDays * sigmaDays));
        const orbFactor  = Math.exp(-(closestOrb * closestOrb) / ORB_SIGMA_SQ_2);
        const directMult = s.type === "direct" ? DIRECT_MULT : 1.0;
        const angleWt    = ANGLE_STRENGTH[closest];

        const severity = Math.round(base * directMult * timeFactor * orbFactor * angleWt);
        if (severity === 0) continue;

        raw += severity;
        contribs.push({
            planet: s.planet, type: s.type,
            stationDateUtc: s.dateUtc,
            daysFromTarget: Math.round(s.daysFromTarget * 10) / 10,
            closestAngle: closest,
            angleOrb: Math.round(closestOrb * 100) / 100,
            severity,
            direction: base < 0 ? "malefic" : base > 0 ? "benefic" : "neutral",
        });
    }

    contribs.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    return { raw, contributions: contribs };
}
