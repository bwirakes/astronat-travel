/**
 * Feature flags for the AstroNat scoring engine.
 *
 * WIDE_SCORING_V1 — toggles the wide-variance recalibration of W_EVENTS,
 * Lilly accidental dignity, ACG line cap, and bucket weights. Designed to
 * lift cadent-anchored events out of the unreachable floor and widen
 * place/time conditional std (~17 / ~13 points per event vs ~7 / ~5 today).
 *
 * Read once at module load; toggling at runtime requires a server restart.
 */

function readFlag(name: string): boolean {
    const v = process.env[name];
    if (!v) return false;
    const norm = v.toLowerCase();
    return norm === "1" || norm === "true" || norm === "on" || norm === "yes";
}

export const WIDE_SCORING_V1 = readFlag("WIDE_SCORING_V1");
