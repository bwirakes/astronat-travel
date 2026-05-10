import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { computeHouseMatrix, type MatrixNatalPlanet } from "@/app/lib/house-matrix";
import { setClusterScoringEnabled, isClusterScoringEnabled } from "@/app/lib/scoring-flags";

// ═══════════════════════════════════════════════════════════════
// Fixtures — minimal natal chart inputs for the amplifier path.
// We use Whole-Sign relocated cusps anchored to 0° Aries so each
// 30° block of longitude maps to its sign's corresponding house.
// ═══════════════════════════════════════════════════════════════

const WHOLE_SIGN_ARIES_CUSPS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/** Three-planet Capricorn stellium (Sun, Mercury, Venus) in H10 with the
 *  remaining planets scattered across distinct houses. Placements are
 *  outside combust orbs so cluster-leader logic is uneventful. */
function capricornStelliumChart(): MatrixNatalPlanet[] {
    return [
        { planet: "Sun",     longitude: 270, sign: "Capricorn", retrograde: false },
        { planet: "Mercury", longitude: 285, sign: "Capricorn", retrograde: false }, // 15° from Sun
        { planet: "Venus",   longitude: 295, sign: "Capricorn", retrograde: false }, // 25° from Sun
        { planet: "Moon",    longitude: 45,  sign: "Taurus",    retrograde: false },
        { planet: "Mars",    longitude: 100, sign: "Cancer",    retrograde: false },
        { planet: "Jupiter", longitude: 200, sign: "Libra",     retrograde: false },
        { planet: "Saturn",  longitude: 320, sign: "Aquarius",  retrograde: false },
        { planet: "Uranus",  longitude: 60,  sign: "Gemini",    retrograde: false },
        { planet: "Neptune", longitude: 150, sign: "Virgo",     retrograde: false },
        { planet: "Pluto",   longitude: 240, sign: "Sagittarius", retrograde: false },
    ];
}

/** Same shape but no stellium — every planet in its own house. */
function evenChart(): MatrixNatalPlanet[] {
    return [
        { planet: "Sun",     longitude: 15,  sign: "Aries",       retrograde: false },
        { planet: "Moon",    longitude: 45,  sign: "Taurus",      retrograde: false },
        { planet: "Mercury", longitude: 80,  sign: "Gemini",      retrograde: false },
        { planet: "Venus",   longitude: 110, sign: "Cancer",      retrograde: false },
        { planet: "Mars",    longitude: 140, sign: "Leo",         retrograde: false },
        { planet: "Jupiter", longitude: 175, sign: "Virgo",       retrograde: false },
        { planet: "Saturn",  longitude: 210, sign: "Libra",       retrograde: false },
        { planet: "Uranus",  longitude: 240, sign: "Sagittarius", retrograde: false },
        { planet: "Neptune", longitude: 280, sign: "Capricorn",   retrograde: false },
        { planet: "Pluto",   longitude: 320, sign: "Aquarius",    retrograde: false },
    ];
}

function score(natalPlanets: MatrixNatalPlanet[]) {
    return computeHouseMatrix({
        natalPlanets,
        relocatedCusps: WHOLE_SIGN_ARIES_CUSPS,
        acgLines: [],
        transits: [],
        parans: [],
        destLat: 0,
        destLon: 0,
        sect: "day",
    });
}

// ═══════════════════════════════════════════════════════════════
// Restore the flag default after each test so flag state from one
// test doesn't bleed into another.
// ═══════════════════════════════════════════════════════════════

let priorFlag: boolean;
beforeEach(() => {
    priorFlag = isClusterScoringEnabled();
});
afterEach(() => {
    setClusterScoringEnabled(priorFlag);
});

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe("CLUSTER_SCORING_V1 amplifier — flag-off baseline", () => {
    it("produces bit-for-bit identical scores when the flag is off", () => {
        setClusterScoringEnabled(false);
        const a = score(capricornStelliumChart());
        const b = score(capricornStelliumChart());
        for (let i = 0; i < 12; i++) {
            expect(a.houses[i].score).toBe(b.houses[i].score);
            expect(a.houses[i].breakdown.occupants).toBe(b.houses[i].breakdown.occupants);
        }
    });

    it("produces identical scores for an even (no-stellium) chart in either flag state", () => {
        setClusterScoringEnabled(false);
        const off = score(evenChart());
        setClusterScoringEnabled(true);
        const on = score(evenChart());
        // No stellium → no amplifier → no change.
        for (let i = 0; i < 12; i++) {
            expect(on.houses[i].score).toBe(off.houses[i].score);
            expect(on.houses[i].breakdown.occupants).toBe(off.houses[i].breakdown.occupants);
        }
    });
});

describe("CLUSTER_SCORING_V1 amplifier — flag-on with stellium", () => {
    it("amplifies the stellium house's occupants when the flag is on", () => {
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart());
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart());

        // H10 holds the Capricorn stellium. Amplifier should change the
        // occupants total (direction depends on whether the planets'
        // contributions are positive or negative; we just assert a change).
        expect(on.houses[9].breakdown.occupants).not.toBe(off.houses[9].breakdown.occupants);
    });

    it("does not amplify houses without a stellium", () => {
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart());
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart());

        // Houses 1–9 and 11–12 hold one or zero planets — no amplifier
        // should fire on any of them.
        const stelliumHouses = new Set([10]);
        for (let i = 0; i < 12; i++) {
            const houseNum = i + 1;
            if (stelliumHouses.has(houseNum)) continue;
            expect(on.houses[i].breakdown.occupants).toBe(off.houses[i].breakdown.occupants);
        }
    });

    it("amplifies the occupants by the expected ×1.10 ratio for a triple stellium", () => {
        // Same fixture, flag off vs flag on. The amplifier multiplies each
        // planet's mod by ×1.10 (per-planet rounding); the sum should
        // approximate occupants_off × 1.10 within a small rounding tolerance.
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart());
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart());

        const offOcc = off.houses[9].breakdown.occupants;
        const onOcc = on.houses[9].breakdown.occupants;
        const expected = Math.round(offOcc * 1.10);
        // ±2 tolerance: per-planet Math.round can drift up to ~1.5 from
        // the single-rounded ratio across 3 planets.
        expect(Math.abs(onOcc - expected)).toBeLessThanOrEqual(2);
    });

    it("the multiplier scales with cluster size (4-planet × > 3-planet ×)", () => {
        // Compare the AMPLIFIER ratio (on/off) for a 3-planet vs 4-planet
        // stellium. The 4-planet cluster gets ×1.20; the 3-planet ×1.10.
        // We don't compare absolute values (Mars's individual contribution
        // can flip the sign of the running sum), we compare the ratio of
        // amplified-to-baseline.
        const triple = capricornStelliumChart();
        const quad = capricornStelliumChart();
        const marsIdx = quad.findIndex((p) => p.planet === "Mars");
        quad[marsIdx] = {
            planet: "Mars",
            longitude: 290,
            sign: "Capricorn",
            retrograde: false,
        };

        setClusterScoringEnabled(false);
        const tripleOff = score(triple).houses[9].breakdown.occupants;
        const quadOff = score(quad).houses[9].breakdown.occupants;
        setClusterScoringEnabled(true);
        const tripleOn = score(triple).houses[9].breakdown.occupants;
        const quadOn = score(quad).houses[9].breakdown.occupants;

        // Ratios — guard against div-by-zero on either path.
        if (tripleOff !== 0 && quadOff !== 0) {
            const tripleRatio = tripleOn / tripleOff;
            const quadRatio = quadOn / quadOff;
            // Both ratios should be > 1 (amplifier always multiplies by ≥1).
            expect(tripleRatio).toBeGreaterThanOrEqual(1.0);
            expect(quadRatio).toBeGreaterThanOrEqual(1.0);
            // Quad ratio (×1.20) > triple ratio (×1.10).
            expect(quadRatio).toBeGreaterThan(tripleRatio);
        }
    });
});

describe("CLUSTER_SCORING_V1 amplifier — propagation through the bucket blend", () => {
    it("the per-house final score blend smooths small occupant movements", () => {
        // The H10 occupants change is real, but the final house `score` is
        // a weighted blend of bucketNatal (0.27/0.30) + bucketOccupants (0.25)
        // + bucketTransit + bucketGeodetic, and bucketOccupants normalizes
        // the raw occupants into a 15-85 band before the blend. A 1-2 point
        // raw-occupants change typically rounds away in the final blend.
        // This test documents that — a triple-stellium amplifier (×1.10)
        // is intentionally subtle at the score level. Larger clusters
        // (size 4 → ×1.20, size 5 → ×1.30) and the upcoming dispositor
        // bonus (Phase 3) are what move the final score visibly.
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart());
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart());

        // Raw occupants must move on the stellium house.
        expect(on.houses[9].breakdown.occupants).not.toBe(off.houses[9].breakdown.occupants);
        // Final score may or may not visibly move at size 3 — both outcomes
        // are acceptable. Just assert the score difference is small.
        expect(Math.abs(on.houses[9].score - off.houses[9].score)).toBeLessThanOrEqual(2);
    });
});
