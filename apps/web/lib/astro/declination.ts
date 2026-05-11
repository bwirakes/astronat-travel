/**
 * Declination — ecliptic → equatorial conversion.
 * OOB when |declination| > 23.4393° (Sun's maximum).
 */
import { OBLIQUITY_RAD } from "@/app/lib/astro-constants";

export const OOB_THRESHOLD_DEG = 23.4393;

export function computeDeclination(lonDeg: number, latDeg: number): number {
    const λ = lonDeg * (Math.PI / 180);
    const β = latDeg * (Math.PI / 180);
    const ε = OBLIQUITY_RAD;
    const sinDelta = Math.sin(β) * Math.cos(ε) + Math.cos(β) * Math.sin(ε) * Math.sin(λ);
    const clamped = Math.max(-1, Math.min(1, sinDelta));
    return Math.asin(clamped) * (180 / Math.PI);
}

export function isOutOfBounds(declinationDeg: number): boolean {
    return Math.abs(declinationDeg) > OOB_THRESHOLD_DEG;
}
