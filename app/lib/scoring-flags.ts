/**
 * Feature flags for the AstroNat scoring engine.
 *
 * WIDE_SCORING_V1 — toggles the wide-variance recalibration of W_EVENTS,
 * Lilly accidental dignity, ACG line cap, and bucket weights. Designed to
 * lift cadent-anchored events out of the unreachable floor and widen
 * place/time conditional std (~17 / ~13 points per event vs ~7 / ~5 today).
 *
 * SOLAR_TIERS_V2_ENABLED — three-tier solar proximity (Cazimi / Combust /
 * Under the Beams). When false, the legacy two-tier behavior applies.
 *
 * DEGREE_THEORY_ENABLED — apply additive per-planet degree-theory nudge
 * (anaretic 29° = -3, 0° = +2, domicile-degree match = +2, detriment = -2).
 *
 * Read once at module load from env vars. WIDE_SCORING_V1 is exported as a
 * read-only const (toggle requires server restart). The newer V2 flags are
 * stored in module-level lets with getter/setter pairs so eval / sweep
 * scripts can flip them per pass without spawning new processes; production
 * code should treat them as read-once.
 */

function readFlag(name: string, defaultValue: boolean = false): boolean {
    const v = process.env[name];
    if (v === undefined) return defaultValue;
    const norm = v.toLowerCase();
    if (norm === "0" || norm === "false" || norm === "off" || norm === "no" || norm === "") return false;
    return norm === "1" || norm === "true" || norm === "on" || norm === "yes";
}

export const WIDE_SCORING_V1 = readFlag("WIDE_SCORING_V1");

// Mutable runtime flags — default ON so production benefits from the new
// behavior, but eval scripts can flip them off for baseline comparisons.
let _solarTiersV2 = readFlag("SOLAR_TIERS_V2_ENABLED", true);
let _degreeTheory = readFlag("DEGREE_THEORY_ENABLED", true);
// CURRENT_SKY_PENALTY_V1 — when true, computeCurrentSkyPenalty operates on the
// literal sky at refDate (transitPositions × natalPlanets). When false, the
// 12-month-window aggregate penalty is used (saturates at the cap).
let _currentSkyPenalty = readFlag("CURRENT_SKY_PENALTY_V1", true);
// SOFT_CAP_TOP_V1 — compress upper tail of macro + event scores. Above the
// knee (85), each extra raw point counts at SLOPE (0.4) and the final cap is
// 95 instead of 100, so 100 outcomes become rare/impossible without making
// mid-range scores look worse.
let _softCapTop = readFlag("SOFT_CAP_TOP_V1", true);
// CLUSTER_SCORING_V1 — surface stelliums (house/sign/orb), dispositor chains,
// dignified cluster leaders, mutual reception pairs, and downstream amplifier
// hooks. Default OFF; clusters.ts detection is pure (no side effects), but
// integration points in house-matrix gate their amplifier behind this flag so
// scores stay bit-for-bit identical when off.
let _clusterScoring = readFlag("CLUSTER_SCORING_V1", false);

export function isSolarTiersV2Enabled(): boolean { return _solarTiersV2; }
export function isDegreeTheoryEnabled(): boolean { return _degreeTheory; }
export function isCurrentSkyPenaltyEnabled(): boolean { return _currentSkyPenalty; }
export function isSoftCapTopEnabled(): boolean { return _softCapTop; }
export function isClusterScoringEnabled(): boolean { return _clusterScoring; }

export function setSolarTiersV2Enabled(v: boolean): void { _solarTiersV2 = v; }
export function setDegreeTheoryEnabled(v: boolean): void { _degreeTheory = v; }
export function setCurrentSkyPenaltyEnabled(v: boolean): void { _currentSkyPenalty = v; }
export function setSoftCapTopEnabled(v: boolean): void { _softCapTop = v; }
export function setClusterScoringEnabled(v: boolean): void { _clusterScoring = v; }

/**
 * Soft-cap upper-tail compression and lower-tail cushioning for scores.
 * Hard-clamped to [0, 100] when the flag is off (legacy).
 *
 *   raw < 15   → 15 + (raw - 15) * 0.4, clamped at 5
 *   raw ≤ 85   → unchanged
 *   raw > 85   → 85 + (raw - 85) * 0.4, clamped at 95
 *
 * The lower cushion keeps a harsh stack from reading as absolute zero unless
 * the raw math is deeply below zero, while still preserving the warning band.
 */
export function softCapScore(raw: number): number {
    if (!_softCapTop) {
        return Math.max(0, Math.min(100, Math.round(raw)));
    }
    const FLOOR_KNEE = 15;
    const FLOOR_SLOPE = 0.4;
    const FLOOR = 5;
    const KNEE = 85;
    const SLOPE = 0.4;
    const CAP = 95;
    let v = raw;
    if (v < FLOOR_KNEE) v = FLOOR_KNEE + (v - FLOOR_KNEE) * FLOOR_SLOPE;
    if (v > KNEE) v = KNEE + (v - KNEE) * SLOPE;
    return Math.max(FLOOR, Math.min(CAP, Math.round(v)));
}
