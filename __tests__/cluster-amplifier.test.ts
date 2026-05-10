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

    it("does not amplify houses without a stellium or a dispositor", () => {
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart());
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart());

        // Houses expected to move:
        //   H10 — holds the Capricorn stellium (amp + leader logic)
        //   H11 — Saturn sits there. Saturn disposits the Cap cluster
        //         (×1.08) AND is the chart's final dispositor (+10), since
        //         every chain in this fixture walks back to Saturn through
        //         Capricorn or Aquarius.
        const movingHouses = new Set([10, 11]);
        for (let i = 0; i < 12; i++) {
            const houseNum = i + 1;
            if (movingHouses.has(houseNum)) continue;
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

    // (former "scales with cluster size" test removed — Phase 2 leader
    // redistribution makes raw ratios non-monotonic when individual planet
    // mods have mixed signs. Size-scaling of the amplifier alone is now
    // covered indirectly by the ×1.10 triple-amp test above, which uses
    // a tied-leader cluster so no redistribution interferes.)
});

// ═══════════════════════════════════════════════════════════════
// Leader arbitration (Phase 2)
// ═══════════════════════════════════════════════════════════════

describe("CLUSTER_SCORING_V1 leader arbitration", () => {
    /** Quad stellium with a clear dignified leader: Sun, Mercury, Venus all
     *  peregrine in Capricorn, plus Mars in Capricorn — Mars is exalted,
     *  so it's the sole leader. */
    function quadCapWithMarsLeader() {
        return [
            { planet: "Sun",     longitude: 270, sign: "Capricorn", retrograde: false },
            { planet: "Mercury", longitude: 285, sign: "Capricorn", retrograde: false },
            { planet: "Venus",   longitude: 295, sign: "Capricorn", retrograde: false },
            { planet: "Mars",    longitude: 290, sign: "Capricorn", retrograde: false },
            { planet: "Moon",    longitude: 45,  sign: "Taurus",    retrograde: false },
            { planet: "Jupiter", longitude: 200, sign: "Libra",     retrograde: false },
            { planet: "Saturn",  longitude: 320, sign: "Aquarius",  retrograde: false },
            { planet: "Uranus",  longitude: 60,  sign: "Gemini",    retrograde: false },
            { planet: "Neptune", longitude: 150, sign: "Virgo",     retrograde: false },
            { planet: "Pluto",   longitude: 240, sign: "Sagittarius", retrograde: false },
        ];
    }

    it("redistributes occupant weight toward the dignified leader vs amp-only", () => {
        // Compare:
        //   triple Capricorn (all tied peregrine) → amp only, no leader logic
        //   quad with Mars leader → amp + redistribution
        // The two are not directly comparable in absolute terms, but we can
        // verify the QUAD H10 occupants differ meaningfully from the
        // counterfactual where leader logic didn't apply (i.e., from the
        // amp-only baseline).
        setClusterScoringEnabled(true);
        const quad = score(quadCapWithMarsLeader());
        const triple = score(capricornStelliumChart());
        // Quad's H10 occupants must be a finite number, not NaN/clamped weirdly.
        expect(Number.isFinite(quad.houses[9].breakdown.occupants)).toBe(true);
        // And it must differ from the triple (different cluster contents).
        expect(quad.houses[9].breakdown.occupants).not.toBe(triple.houses[9].breakdown.occupants);
    });

    it("does not fire when leaders are tied (all peregrine)", () => {
        // Triple Capricorn — all 3 are tied peregrine, so the leader path
        // returns 1.0 for every member. The H10 occupants should equal the
        // amp-only result (×1.10 of flag-off, within rounding).
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart()).houses[9].breakdown.occupants;
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart()).houses[9].breakdown.occupants;
        const expected = Math.round(off * 1.10); // amp only, no leader bonus
        expect(Math.abs(on - expected)).toBeLessThanOrEqual(2);
    });
});

// ═══════════════════════════════════════════════════════════════
// Mutual reception (Phase 2)
// ═══════════════════════════════════════════════════════════════

describe("CLUSTER_SCORING_V1 mutual reception bonus", () => {
    /** Three planets in H1 — Sun in Cancer (Moon's domicile), Moon in Leo
     *  (Sun's domicile), Mars in Aries. Sun↔Moon mutual reception, both
     *  participating; Mars provides the third member to qualify as a
     *  cluster. Spread far enough that no combust applies. */
    function mrTrioH1() {
        return [
            { planet: "Sun",  longitude: 100, sign: "Cancer", retrograde: false },
            { planet: "Moon", longitude: 130, sign: "Leo",    retrograde: false },
            { planet: "Mars", longitude: 0,   sign: "Aries",  retrograde: false },
            { planet: "Mercury", longitude: 50,  sign: "Taurus",      retrograde: false },
            { planet: "Venus",   longitude: 200, sign: "Libra",       retrograde: false },
            { planet: "Jupiter", longitude: 230, sign: "Scorpio",     retrograde: false },
            { planet: "Saturn",  longitude: 270, sign: "Capricorn",   retrograde: false },
            { planet: "Uranus",  longitude: 310, sign: "Aquarius",    retrograde: false },
            { planet: "Neptune", longitude: 340, sign: "Pisces",      retrograde: false },
            { planet: "Pluto",   longitude: 250, sign: "Sagittarius", retrograde: false },
        ];
    }

    it("applies the +8 bonus to MR participants in a house cluster", () => {
        // The MR bonus is additive (+8 per participant per pair). The H1
        // cluster has Sun + Moon in MR, both members of the cluster, so
        // both get +8. Mars is in the cluster but not in MR, so it doesn't
        // get the bonus.
        //
        // We can't directly assert the +8 because it composes with leader
        // logic and amp. But we can compare the MR fixture's H1 occupants
        // against a counterfactual where the MR pair is broken — Sun moved
        // to Aries (no longer in Moon's domicile) — and assert the MR
        // version is higher.
        const noMr = mrTrioH1();
        const sunIdx = noMr.findIndex((p) => p.planet === "Sun");
        noMr[sunIdx] = { planet: "Sun", longitude: 5, sign: "Aries", retrograde: false };
        // Adjust Mars so the H1 cluster still has 3 members after Sun moved.
        const marsIdx = noMr.findIndex((p) => p.planet === "Mars");
        noMr[marsIdx] = { planet: "Mars", longitude: 15, sign: "Aries", retrograde: false };
        // Add a third H1 occupant since Sun is no longer in H1 (Cancer).
        // Move Mercury into Aries.
        const mercIdx = noMr.findIndex((p) => p.planet === "Mercury");
        noMr[mercIdx] = { planet: "Mercury", longitude: 25, sign: "Aries", retrograde: false };

        setClusterScoringEnabled(true);
        const withMrH1 = score(mrTrioH1()).houses[0].breakdown.occupants;
        const noMrH1 = score(noMr).houses[0].breakdown.occupants;

        // Assertion is qualitative: the MR fixture moves H1 occupants
        // because of the +16 (two participants × +8) flat bonus, which is
        // applied AFTER the multiplicative path. The exact magnitude is
        // hard to predict because the H1 occupants in the two fixtures
        // come from different planets, but the no-MR baseline should NOT
        // have the +16 boost.
        expect(withMrH1).not.toBe(noMrH1);
    });
});

// ═══════════════════════════════════════════════════════════════
// Dispositor / domicile (Phase 3)
// ═══════════════════════════════════════════════════════════════

describe("CLUSTER_SCORING_V1 dispositor section", () => {
    it("boosts the dispositor's house dignity (+5) when the cusp ruler disposits a cluster", () => {
        // Capricorn stellium → Saturn is the dispositor. Saturn rules
        // both Capricorn (cusp on H10 in this whole-sign fixture) and
        // Aquarius (cusp on H11). On both H10 and H11, the cusp ruler is
        // Saturn, so the dispositor dignity bonus (+5 per disposited
        // cluster, count = 1 here) should fire on the dignity component.
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart());
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart());

        // H10's cusp ruler is Saturn → +5 dignity from the dispositor bonus.
        expect(on.houses[9].breakdown.dignity - off.houses[9].breakdown.dignity).toBe(5);
        // H11's cusp ruler is also Saturn → also +5.
        expect(on.houses[10].breakdown.dignity - off.houses[10].breakdown.dignity).toBe(5);
        // H1 (Aries cusp, ruler Mars) — Mars is not a dispositor in this
        // fixture, so no dignity change.
        expect(on.houses[0].breakdown.dignity).toBe(off.houses[0].breakdown.dignity);
    });

    it("applies the +10 final-dispositor bonus to the master-key planet's occupants", () => {
        // CAP_STELLIUM has every chain converging on Saturn (Saturn rules
        // both Capricorn and Aquarius, both signs hold planets, every
        // other planet's chain walks back through one of those signs).
        // Saturn sits in Aquarius / H11. The +10 bonus must fire on H11
        // occupants — it's the largest single component of the H11 shift.
        //
        // We can't isolate the +10 from the ×1.08 dispositor multiplier
        // and other small changes without dissecting the mod arithmetic,
        // but we can assert that H11 moves by AT LEAST 10 points (the
        // floor set by the additive bonus, since Saturn's mod is the only
        // occupant in H11).
        setClusterScoringEnabled(false);
        const off = score(capricornStelliumChart());
        setClusterScoringEnabled(true);
        const on = score(capricornStelliumChart());
        const delta = on.houses[10].breakdown.occupants - off.houses[10].breakdown.occupants;
        expect(delta).toBeGreaterThanOrEqual(10);
    });

    it("does not fire dispositor effects when no sign stelliums exist", () => {
        // The even (no-stellium) fixture has no sign clusters → no
        // dispositors → no Step 2.5 bonus → no Step 3 multiplier →
        // no final dispositor → identical scores in either flag state.
        setClusterScoringEnabled(false);
        const off = score(evenChart());
        setClusterScoringEnabled(true);
        const on = score(evenChart());
        for (let i = 0; i < 12; i++) {
            expect(on.houses[i].breakdown.dignity).toBe(off.houses[i].breakdown.dignity);
            expect(on.houses[i].breakdown.occupants).toBe(off.houses[i].breakdown.occupants);
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
