/**
 * outer-planet-scoring.ts — Angularity-based strength scoring for Uranus, Neptune, Pluto.
 *
 * In Hellenistic astrology, the outer planets (Uranus, Neptune, Pluto) do not
 * exist; they have no traditional essential dignities and are not assigned
 * triplicity/term/face rulership.
 *
 * Per the AstroNat model spec, their influence is computed via a separate path:
 *   1. Angularity (house position)           — primary strength driver
 *   2. Aspects to personal planets (1–5°)    — how strongly they color the chart
 *   3. Modern essential dignities             — "at home" in modern-assigned signs
 *   4. Retrograde status                      — Rx = closer to Earth = MORE powerful
 *   5. Planetary speed                        — slow-moving = intensified influence
 *
 * References:
 *   - AstroNat model spec (Notion "Scoring for Inner & Outer Planets")
 *   - Lila Astrology scoring table (Astrodynes/Dirah method)
 */

// ── Outer Planet Classification ────────────────────────────────────────────
const OUTER_PLANET_NAMES = ["uranus", "neptune", "pluto"];

/**
 * Returns true if the given planet name is an outer (trans-Saturnian) planet.
 */
export function isOuterPlanet(planetName: string): boolean {
    return OUTER_PLANET_NAMES.includes(planetName.toLowerCase());
}

// ── Personal Planets (for aspect computation) ──────────────────────────────
// Only aspects to these classical personal planets count for outer-planet strength.
const PERSONAL_PLANETS = ["sun", "moon", "mercury", "venus", "mars"];

// ── Modern Essential Dignities for Outer Planets ──────────────────────────
// These are modern assignments and do NOT apply to the inner-planet Hellenistic pipeline.
const MODERN_DIGNITIES: Record<string, { ruler: string[]; exalted: string[] }> = {
    uranus:  { ruler: ["Aquarius"],          exalted: ["Scorpio"]     },
    neptune: { ruler: ["Pisces"],             exalted: ["Sagittarius"] }, // Some use Cancer
    pluto:   { ruler: ["Scorpio"],            exalted: ["Leo"]         },
};

// ── Angularity Score ───────────────────────────────────────────────────────

/**
 * Per model spec (Lila Astrology / Dirah):
 *   H1/H10 = +40   (strongest angles — ASC & MC)
 *   H4/H7  = +30   (secondary angles — IC & DSC)
 *   H5/H9/H11 = +20 (succedent/cadent with positive themes)
 *   H2/H3  =  +5   (mildly positive succedent/cadent)
 *   H6     = −10   (cadent, house of illness)
 *   H8     = −15   (succedent, house of death)
 *   H12    = −10   (cadent, house of isolation)
 */
export function outerAngularityScore(houseNum: number): number {
    switch (houseNum) {
        case 1:
        case 10: return 40;
        case 4:
        case 7:  return 30;
        case 5:
        case 9:
        case 11: return 20;
        case 2:
        case 3:  return 5;
        case 6:  return -10;
        case 8:  return -15;
        case 12: return -10;
        default: return 0;
    }
}

// ── Aspect to Personal Planets ─────────────────────────────────────────────

interface NatalPlanetRef {
    planet?: string;
    name?: string;
    longitude: number;
}

/**
 * Score how strongly an outer planet aspects personal planets.
 * Conjunctions are strongest, followed by oppositions and squares (hard aspects).
 * Soft aspects (trine, sextile) are noted but weighted lower.
 * Tight orbs (≤1°) are dramatically stronger than wide orbs.
 */
export function outerAspectToPersonalScore(
    outerLongitude: number,
    natalPlanets: NatalPlanetRef[],
): number {
    const ASPECTS = [
        { angle: 0,   weight: 1.5 },  // Conjunction — strongest
        { angle: 180, weight: 1.2 },  // Opposition
        { angle: 90,  weight: 1.0 },  // Square
        { angle: 120, weight: 0.7 },  // Trine
        { angle: 60,  weight: 0.5 },  // Sextile
    ];

    let total = 0;

    for (const np of natalPlanets) {
        const pName = (np.planet || (np as unknown as Record<string, string>).name || "").toLowerCase();
        if (!PERSONAL_PLANETS.includes(pName)) continue;

        let diff = Math.abs(outerLongitude - np.longitude) % 360;
        if (diff > 180) diff = 360 - diff;

        for (const asp of ASPECTS) {
            const orb = Math.abs(diff - asp.angle);
            if (orb <= 3) {
                // Orb tiers: ≤1° = full, ≤2° = 70%, ≤3° = 40%
                const orbScale = orb <= 1 ? 1.0 : orb <= 2 ? 0.7 : 0.4;
                // Base contribution per personal-planet aspect: 15 pts (max)
                total += Math.round(15 * asp.weight * orbScale);
                break; // Tightest aspect wins per planet pair
            }
        }
    }

    return Math.min(40, total); // Cap total contribution
}

// ── Modern Dignity Score ───────────────────────────────────────────────────

/**
 * +10 if the outer planet is in its modern-assigned rulership sign.
 *  +7 if in its modern exaltation.
 *  0 otherwise.
 */
export function outerDignityScore(planetName: string, sign: string): number {
    const p = planetName.toLowerCase();
    const entry = MODERN_DIGNITIES[p];
    if (!entry) return 0;
    if (entry.ruler.includes(sign))   return 10;
    if (entry.exalted.includes(sign)) return 7;
    return 0;
}

// ── Retrograde Modifier ────────────────────────────────────────────────────

/**
 * Outer planets retrograde = "Full" (closest to Earth) = MORE powerful.
 * This is the OPPOSITE of inner planet retrograde which means internalized/weakened.
 * Per spec: "Retrograde: outer planets that are retrograde are often considered
 * more powerful, as they are 'Full' (closest to the Earth)."
 */
export function outerRetrogradeModifier(isRetrograde: boolean): number {
    return isRetrograde ? 10 : 0;
}

// ── Planetary Speed Bonus ──────────────────────────────────────────────────

/**
 * Slow-moving outer planet = more sustained, intensified influence.
 * Per spec: +10 points if the planet is moving at less than 20% of its average speed.
 *
 * Average daily speeds (degrees/day):
 *   Uranus:  ~0.080 °/day
 *   Neptune: ~0.040 °/day
 *   Pluto:   ~0.020 °/day (slowest)
 */
const AVERAGE_DAILY_SPEED: Record<string, number> = {
    uranus:  0.08,
    neptune: 0.04,
    pluto:   0.02,
};

export function outerSpeedBonus(planetName: string, speed?: number): number {
    if (speed === undefined) return 0;
    const avgSpeed = AVERAGE_DAILY_SPEED[planetName.toLowerCase()];
    if (!avgSpeed) return 0;
    // If currently moving at < 20% of average (stationary or near-stationary)
    if (Math.abs(speed) < avgSpeed * 0.20) return 10;
    return 0;
}

// ── Combined Outer Planet Score ────────────────────────────────────────────

export interface OuterPlanetScoreParams {
    planetName:   string;
    sign:         string;
    houseNum:     number;
    longitude:    number;
    isRetrograde: boolean;
    natalPlanets: NatalPlanetRef[];
    /** Daily speed in degrees/day (optional — enables speed bonus) */
    speed?:       number;
}

/**
 * Compute the full strength score for an outer planet using the 5-factor model.
 * Replaces `getOccupantModifier()` for Uranus, Neptune, and Pluto.
 *
 * Score range: approximately −15 to +100 (before house-matrix capping).
 */
export function computeOuterPlanetScore(params: OuterPlanetScoreParams): number {
    const { planetName, sign, houseNum, longitude, isRetrograde, natalPlanets, speed } = params;

    const angularity = outerAngularityScore(houseNum);
    const aspects    = outerAspectToPersonalScore(longitude, natalPlanets);
    const dignity    = outerDignityScore(planetName, sign);
    const rxBonus    = outerRetrogradeModifier(isRetrograde);
    const speedBonus = outerSpeedBonus(planetName, speed);

    return angularity + aspects + dignity + rxBonus + speedBonus;
}
