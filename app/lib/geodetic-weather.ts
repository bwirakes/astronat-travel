/**
 * geodetic-weather.ts — Geodetic Weather Computation Engine.
 *
 * Scores a LOCATION AT A TIME for astrologically-indicated weather / mundane
 * severity. Unlike [house-matrix.ts] (which scores a person at a place),
 * this engine is impersonal: only the location's fixed geodetic angles and
 * the current sky's transits, parans, stations, eclipses, ingresses, late
 * degrees, and world points matter.
 *
 * Output shape mirrors HouseMatrixResult: decomposable per-layer breakdown
 * + 0–100 score + severity tier + attributed event list. Score convention
 * follows house-matrix (high = calm). Severity labels invert accordingly.
 *
 * PHASES (each independently shippable)
 *   Phase 1 — L1 transit→fixed angle
 *   Phase 2 — L2 parans, L3 stations
 *   Phase 3 — L6 eclipses, L9 OOB tier shift
 *   Phase 4 — L4 world points, L7 late degrees + fixed stars  ← CURRENT
 *   Phase 5 — L5 seasonal ingresses, L8 configurations, nodal imbalance
 */
import type { ComputedPosition } from "@/lib/astro/transits";
import { geodeticMCLongitude, geodeticASCLongitude } from "@/app/lib/geodetic";
import type { MundaneParan } from "@/app/lib/mundane-engine";
import {
    scoreAngleTransits,
    type AngleTransitContribution,
} from "@/app/lib/geodetic/angle-transits";
import {
    scoreParans,
    type ParanContribution,
} from "@/app/lib/geodetic/paran-scoring";
import {
    scoreStations,
    type StationContribution,
} from "@/app/lib/geodetic/station-scoring";
import {
    scoreEclipses,
    type EclipseContribution,
} from "@/app/lib/geodetic/eclipse-scoring";
import {
    scoreSeverityModifiers,
    type SeverityModifier,
    type OOBPlanet,
} from "@/app/lib/geodetic/severity-modifiers";
import {
    scoreWorldPoints,
    type WorldPointContribution,
} from "@/app/lib/geodetic/world-points";
import {
    scoreLateDegrees,
    type LateDegreeContribution,
} from "@/app/lib/geodetic/late-degrees";

// ── Types ────────────────────────────────────────────────────────────────

export type GeodeticLayer =
    | "angle-transit"
    | "paran"
    | "station"
    | "world-point"
    | "ingress"
    | "eclipse"
    | "late-degree"
    | "configuration"
    | "severity-modifier";

export type SeverityTier =
    | "Calm"
    | "Unsettled"
    | "Turbulent"
    | "Severe"
    | "Extreme";

export interface ActiveEvent {
    layer: GeodeticLayer;
    label: string;
    planets: string[];
    orb?: number;
    severity: number;
    direction: "malefic" | "benefic" | "neutral";
    note?: string;
}

export interface GeodeticWeatherBreakdown {
    angleTransits: number;
    parans: number;
    stations: number;
    worldPoints: number;
    ingresses: number;
    eclipses: number;
    lateDegrees: number;
    configurations: number;
    bucketAngle: number;
    bucketParan: number;
    bucketStation: number;
    bucketIngress: number;
    bucketEclipse: number;
    bucketLate: number;
    bucketConfig: number;
    tierShift: number;
}

export interface GeodeticWeatherResult {
    dateUtc: string;
    location: { lat: number; lon: number };
    fixedAngles: { mc: number; ic: number; asc: number; dsc: number };
    score: number;
    severity: SeverityTier;
    severityPreShift: SeverityTier;
    events: ActiveEvent[];
    breakdown: GeodeticWeatherBreakdown;
    severityModifiers: SeverityModifier[];
    oobPlanets: OOBPlanet[];
    phasesActive: number[];
}

export interface GeodeticWeatherParams {
    dateUtc: Date;
    destLat: number;
    destLon: number;
    positions: ComputedPosition[];
    parans?: MundaneParan[];
}

// ── Scoring constants ─────────────────────────────────────────────────────

const RAW_CLAMPS = {
    angle:    { min: -100, max: 60 },
    paran:    { min:  -60, max: 40 },
    station:  { min:  -50, max: 25 },
    ingress:  { min:  -40, max: 25 },
    eclipse:  { min:  -70, max: 15 },
    late:     { min:  -30, max: 10 },
    config:   { min:  -40, max: 20 },
};

const NORM_BOUNDS = {
    angle:   { min: -80, max: 40 },
    paran:   { min: -50, max: 30 },
    station: { min: -40, max: 20 },
    ingress: { min: -35, max: 20 },
    eclipse: { min: -60, max: 10 },
    late:    { min: -25, max: 10 },
    config:  { min: -30, max: 15 },
};

const WEIGHTS = {
    angle: 0.28, paran: 0.17, station: 0.10, ingress: 0.08,
    eclipse: 0.15, late: 0.05, config: 0.10,
};
const BASELINE = 7;

// ── Helpers ───────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function normalizeBucket(raw: number, minBound: number, maxBound: number): number {
    const c = clamp(raw, minBound, maxBound);
    return ((c - minBound) / (maxBound - minBound)) * 100;
}

function tierFromScore(score: number): SeverityTier {
    if (score >= 80) return "Calm";
    if (score >= 60) return "Unsettled";
    if (score >= 40) return "Turbulent";
    if (score >= 20) return "Severe";
    return "Extreme";
}

const TIER_ORDER: SeverityTier[] = ["Calm", "Unsettled", "Turbulent", "Severe", "Extreme"];

function shiftTier(tier: SeverityTier, shift: number): SeverityTier {
    const idx = TIER_ORDER.indexOf(tier);
    const next = clamp(idx + shift, 0, TIER_ORDER.length - 1);
    return TIER_ORDER[next];
}

function toDirection(
    dir: "benefic" | "malefic" | "luminary" | "neutral"
): ActiveEvent["direction"] {
    if (dir === "benefic") return "benefic";
    if (dir === "malefic") return "malefic";
    return "neutral";
}

function labelAngleTransit(c: AngleTransitContribution): string {
    return `${c.planet} on fixed ${c.angle} (orb ${c.orb.toFixed(1)}°)`;
}
function labelParan(c: ParanContribution): string {
    return `${c.p1}/${c.p2} paran at ${c.lat}° lat`;
}
function labelStation(c: StationContribution): string {
    const when = c.daysFromTarget >= 0 ? `in ${Math.round(c.daysFromTarget)}d` : `${Math.round(-c.daysFromTarget)}d ago`;
    return `${c.planet} station ${c.type} ${when} near ${c.closestAngle} (orb ${c.angleOrb.toFixed(1)}°)`;
}
function labelEclipse(c: EclipseContribution): string {
    const when = c.daysFromTarget >= 0 ? `in ${Math.round(c.daysFromTarget)}d` : `${Math.round(-c.daysFromTarget)}d ago`;
    const trig = c.secondaryTriggerPlanet ? ` — ${c.secondaryTriggerPlanet} retriggering` : "";
    return `${c.kind[0].toUpperCase() + c.kind.slice(1)} eclipse ${c.aspectToAngle} ${c.closestAngle} ${when} (orb ${c.angleOrb.toFixed(1)}°)${trig}`;
}
function labelWorldPoint(c: WorldPointContribution): string {
    return `${c.planet} at ${c.cardinal} (orb ${c.orb.toFixed(2)}°) — GLOBAL`;
}
function labelLateDegree(c: LateDegreeContribution): string {
    const starTag = c.fixedStar ? ` + ${c.fixedStar} (${c.fixedStarOrb?.toFixed(2)}°)` : "";
    return `${c.planet} at ${c.degreeInSign.toFixed(1)}° ${c.sign} [${c.element}]${starTag}`;
}

// ── Core engine ───────────────────────────────────────────────────────────

export function computeGeodeticWeather(
    params: GeodeticWeatherParams
): GeodeticWeatherResult {
    const { dateUtc, destLat, destLon, positions, parans } = params;

    const geoMC  = geodeticMCLongitude(destLon);
    const geoASC = geodeticASCLongitude(destLon, destLat);
    const geoIC  = (geoMC + 180) % 360;
    const geoDSC = (geoASC + 180) % 360;

    // Layer 1: Transits to fixed angles
    const l1 = scoreAngleTransits({ positions, geoMC, geoASC });
    const rawAngle = clamp(l1.raw, RAW_CLAMPS.angle.min, RAW_CLAMPS.angle.max);

    // Layer 2: Parans at latitude
    const l2 = parans
        ? scoreParans(parans, destLat)
        : { raw: 0, contributions: [] as ParanContribution[] };
    const rawParan = clamp(l2.raw, RAW_CLAMPS.paran.min, RAW_CLAMPS.paran.max);

    // Layer 3: Station proximity
    const l3 = scoreStations({ dateUtc, geoMC, geoASC });
    const rawStation = clamp(l3.raw, RAW_CLAMPS.station.min, RAW_CLAMPS.station.max);

    // Layer 4: World points (global, routes into ingress bucket)
    const l4 = scoreWorldPoints({ positions });
    const rawIngress = clamp(l4.raw, RAW_CLAMPS.ingress.min, RAW_CLAMPS.ingress.max);

    // Layer 6: Eclipses
    const l6 = scoreEclipses({ dateUtc, geoMC, geoASC, positions });
    const rawEclipse = clamp(l6.raw, RAW_CLAMPS.eclipse.min, RAW_CLAMPS.eclipse.max);

    // Layer 7: Late degrees + fixed stars (global)
    const l7 = scoreLateDegrees({ positions });
    const rawLate = clamp(l7.raw, RAW_CLAMPS.late.min, RAW_CLAMPS.late.max);

    // Layer 8: configurations — Phase 5 stub
    const rawConfig = 0;

    // Layer 9: Severity modifiers (OOB tier shift)
    const l9 = scoreSeverityModifiers({ positions, geoMC, geoASC });

    // ── Normalize ─────────────────────────────────────────────────────────
    const bucketAngle   = normalizeBucket(rawAngle,   NORM_BOUNDS.angle.min,   NORM_BOUNDS.angle.max);
    const bucketParan   = normalizeBucket(rawParan,   NORM_BOUNDS.paran.min,   NORM_BOUNDS.paran.max);
    const bucketStation = normalizeBucket(rawStation, NORM_BOUNDS.station.min, NORM_BOUNDS.station.max);
    const bucketIngress = normalizeBucket(rawIngress, NORM_BOUNDS.ingress.min, NORM_BOUNDS.ingress.max);
    const bucketEclipse = normalizeBucket(rawEclipse, NORM_BOUNDS.eclipse.min, NORM_BOUNDS.eclipse.max);
    const bucketLate    = normalizeBucket(rawLate,    NORM_BOUNDS.late.min,    NORM_BOUNDS.late.max);
    const bucketConfig  = normalizeBucket(rawConfig,  NORM_BOUNDS.config.min,  NORM_BOUNDS.config.max);

    // ── Weighted blend ────────────────────────────────────────────────────
    const weighted =
          WEIGHTS.angle   * bucketAngle
        + WEIGHTS.paran   * bucketParan
        + WEIGHTS.station * bucketStation
        + WEIGHTS.ingress * bucketIngress
        + WEIGHTS.eclipse * bucketEclipse
        + WEIGHTS.late    * bucketLate
        + WEIGHTS.config  * bucketConfig
        + BASELINE;

    const score = clamp(Math.round(weighted), 0, 100);

    const tierShift = l9.tierShift;
    const severityPreShift = tierFromScore(score);
    const severity = shiftTier(severityPreShift, tierShift);

    // ── Events (sorted |severity| desc) ───────────────────────────────────
    const events: ActiveEvent[] = [
        ...l1.contributions.map(c => ({
            layer: "angle-transit" as const,
            label: labelAngleTransit(c),
            planets: [c.planet],
            orb: c.orb,
            severity: c.severity,
            direction: toDirection(c.direction),
        })),
        ...l2.contributions.map(c => ({
            layer: "paran" as const,
            label: labelParan(c),
            planets: [c.p1, c.p2],
            severity: c.severity,
            direction: c.direction,
            note: `latΔ=${c.latProximity}° type=${c.type}`,
        })),
        ...l3.contributions.map(c => ({
            layer: "station" as const,
            label: labelStation(c),
            planets: [c.planet],
            orb: c.angleOrb,
            severity: c.severity,
            direction: c.direction,
            note: `${c.daysFromTarget >= 0 ? "+" : ""}${c.daysFromTarget}d`,
        })),
        ...l4.contributions.map(c => ({
            layer: "world-point" as const,
            label: labelWorldPoint(c),
            planets: [c.planet],
            orb: c.orb,
            severity: c.severity,
            direction: c.direction,
            note: "applies to all locations simultaneously",
        })),
        ...l6.contributions.map(c => ({
            layer: "eclipse" as const,
            label: labelEclipse(c),
            planets: c.secondaryTriggerPlanet ? [c.secondaryTriggerPlanet] : [],
            orb: c.angleOrb,
            severity: c.severity,
            direction: "malefic" as const,
            note: c.secondaryTriggerPlanet
                ? `${c.daysFromTarget >= 0 ? "+" : ""}${c.daysFromTarget}d, trigger ${c.secondaryTriggerPlanet}@${c.secondaryTriggerOrb}°`
                : `${c.daysFromTarget >= 0 ? "+" : ""}${c.daysFromTarget}d`,
        })),
        ...l7.contributions.map(c => ({
            layer: "late-degree" as const,
            label: labelLateDegree(c),
            planets: [c.planet],
            severity: c.severity,
            direction: c.direction,
            note: c.note,
        })),
        ...l9.modifiers.map(m => ({
            layer: "severity-modifier" as const,
            label: m.label,
            planets: m.planets,
            severity: -15 * m.tierShift,
            direction: m.direction,
            note: m.note,
        })),
    ];
    events.sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));

    const phasesActive = parans ? [1, 2, 3, 4, 6, 7, 9] : [1, 3, 4, 6, 7, 9];

    return {
        dateUtc: dateUtc.toISOString(),
        location: { lat: destLat, lon: destLon },
        fixedAngles: { mc: geoMC, ic: geoIC, asc: geoASC, dsc: geoDSC },
        score,
        severity,
        severityPreShift,
        events,
        breakdown: {
            angleTransits: rawAngle,
            parans: rawParan,
            stations: rawStation,
            worldPoints: l4.raw,
            ingresses: rawIngress,
            eclipses: rawEclipse,
            lateDegrees: rawLate,
            configurations: rawConfig,
            bucketAngle:   Math.round(bucketAngle),
            bucketParan:   Math.round(bucketParan),
            bucketStation: Math.round(bucketStation),
            bucketIngress: Math.round(bucketIngress),
            bucketEclipse: Math.round(bucketEclipse),
            bucketLate:    Math.round(bucketLate),
            bucketConfig:  Math.round(bucketConfig),
            tierShift,
        },
        severityModifiers: l9.modifiers,
        oobPlanets: l9.oobPlanets,
        phasesActive,
    };
}
