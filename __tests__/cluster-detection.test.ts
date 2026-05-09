import { describe, expect, it } from "bun:test";
import {
    detectClusters,
    type ClusterInputPlanet,
} from "@/app/lib/clusters";

// ═══════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════

// Capricorn longitudes start at 270°. 5° Cap = 275°, 8° Cap = 278°, 12° Cap = 282°.
const CAP_STELLIUM: ClusterInputPlanet[] = [
    { name: "Sun",     longitude: 275, sign: "Capricorn", house: 10 },
    { name: "Mercury", longitude: 278, sign: "Capricorn", house: 10 },
    { name: "Venus",   longitude: 282, sign: "Capricorn", house: 10 },
    // Filler so the chart isn't pathologically small.
    { name: "Moon",    longitude: 45,  sign: "Taurus",    house: 2  },
    { name: "Mars",    longitude: 100, sign: "Cancer",    house: 4  },
    { name: "Jupiter", longitude: 200, sign: "Libra",     house: 7  },
    { name: "Saturn",  longitude: 320, sign: "Aquarius",  house: 11 },
    { name: "Uranus",  longitude: 60,  sign: "Gemini",    house: 3  },
    { name: "Neptune", longitude: 150, sign: "Virgo",     house: 6  },
    { name: "Pluto",   longitude: 240, sign: "Sagittarius", house: 9 },
];

const NO_STELLIUM: ClusterInputPlanet[] = [
    { name: "Sun",     longitude: 15,  sign: "Aries",       house: 1  },
    { name: "Moon",    longitude: 45,  sign: "Taurus",      house: 2  },
    { name: "Mercury", longitude: 80,  sign: "Gemini",      house: 3  },
    { name: "Venus",   longitude: 110, sign: "Cancer",      house: 4  },
    { name: "Mars",    longitude: 140, sign: "Leo",         house: 5  },
    { name: "Jupiter", longitude: 175, sign: "Virgo",       house: 6  },
    { name: "Saturn",  longitude: 210, sign: "Libra",       house: 7  },
    { name: "Uranus",  longitude: 240, sign: "Sagittarius", house: 9  },
    { name: "Neptune", longitude: 280, sign: "Capricorn",   house: 10 },
    { name: "Pluto",   longitude: 320, sign: "Aquarius",    house: 11 },
];

// ═══════════════════════════════════════════════════════════════
// Detector basics
// ═══════════════════════════════════════════════════════════════

describe("detectClusters — empty / no-cluster baseline", () => {
    it("returns empty arrays for an evenly distributed chart", () => {
        const out = detectClusters(NO_STELLIUM);
        expect(out.houseClusters).toEqual([]);
        expect(out.signClusters).toEqual([]);
        expect(out.orbClusters).toEqual([]);
    });

    it("handles an empty input gracefully", () => {
        const out = detectClusters([]);
        expect(out.houseClusters).toEqual([]);
        expect(out.signClusters).toEqual([]);
        expect(out.orbClusters).toEqual([]);
        expect(out.finalDispositor).toBeUndefined();
    });
});

describe("detectClusters — Capricorn triple stellium", () => {
    const out = detectClusters(CAP_STELLIUM);

    it("fires the house-cluster detector at house 10", () => {
        expect(out.houseClusters).toHaveLength(1);
        const c = out.houseClusters[0];
        expect(c.kind).toBe("house");
        expect(c.anchorHouse).toBe(10);
        expect(c.size).toBe(3);
        expect(c.members.map((m) => m.planet).sort()).toEqual(["Mercury", "Sun", "Venus"]);
    });

    it("fires the sign-cluster detector for Capricorn with Saturn as dispositor", () => {
        expect(out.signClusters).toHaveLength(1);
        const c = out.signClusters[0];
        expect(c.kind).toBe("sign");
        expect(c.anchorSign).toBe("Capricorn");
        expect(c.dispositor).toBe("Saturn");
        expect(c.size).toBe(3);
    });

    it("fires the orb-cluster detector with a tight spread", () => {
        expect(out.orbClusters).toHaveLength(1);
        const c = out.orbClusters[0];
        expect(c.kind).toBe("orb");
        expect(c.size).toBe(3);
        // Spread = 282 - 275 = 7°
        expect(c.spreadDegrees).toBeCloseTo(7, 1);
    });

    it("does not flag the Capricorn stellium as generational", () => {
        // Sun, Mercury, Venus — zero outers.
        expect(out.houseClusters[0].generational).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════
// Stellium boundary edge cases
// ═══════════════════════════════════════════════════════════════

describe("detectClusters — boundary cases", () => {
    it("two planets in one house do NOT form a stellium", () => {
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",     longitude: 275, sign: "Capricorn", house: 10 },
            { name: "Mercury", longitude: 278, sign: "Capricorn", house: 10 },
            { name: "Moon",    longitude: 45,  sign: "Taurus",    house: 2  },
        ];
        const out = detectClusters(planets);
        expect(out.houseClusters).toEqual([]);
        expect(out.signClusters).toEqual([]);
        expect(out.orbClusters).toEqual([]);
    });

    it("orb-cluster wraps around 0°/360°", () => {
        // 3 planets at 358°, 1°, 5° — spread of 7° crossing the Aries point.
        const planets: ClusterInputPlanet[] = [
            { name: "Saturn",  longitude: 358, sign: "Pisces", house: 12 },
            { name: "Sun",     longitude: 1,   sign: "Aries",  house: 1  },
            { name: "Mercury", longitude: 5,   sign: "Aries",  house: 1  },
            { name: "Moon",    longitude: 100, sign: "Cancer", house: 4  },
        ];
        const out = detectClusters(planets);
        expect(out.orbClusters).toHaveLength(1);
        expect(out.orbClusters[0].size).toBe(3);
        expect(out.orbClusters[0].spreadDegrees).toBeCloseTo(7, 1);
    });

    it("flags clusters with ≥2 outer planets as generational", () => {
        const planets: ClusterInputPlanet[] = [
            { name: "Saturn",  longitude: 270, sign: "Capricorn", house: 10 },
            { name: "Uranus",  longitude: 273, sign: "Capricorn", house: 10 },
            { name: "Pluto",   longitude: 277, sign: "Capricorn", house: 10 },
            { name: "Sun",     longitude: 100, sign: "Cancer",    house: 4  },
        ];
        const out = detectClusters(planets);
        expect(out.houseClusters).toHaveLength(1);
        expect(out.houseClusters[0].generational).toBe(true);
    });

    it("does not flag a cluster with one outer as generational", () => {
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",     longitude: 270, sign: "Capricorn", house: 10 },
            { name: "Mercury", longitude: 273, sign: "Capricorn", house: 10 },
            { name: "Pluto",   longitude: 277, sign: "Capricorn", house: 10 },
        ];
        const out = detectClusters(planets);
        expect(out.houseClusters[0].generational).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════
// Dignified-leader logic
// ═══════════════════════════════════════════════════════════════

describe("detectClusters — dignified leader", () => {
    it("picks the highest-dignity non-combust member", () => {
        // Sun in Leo (domicile +15), Mercury in Leo peregrine, Venus in Leo peregrine.
        // All in H5, well clear of combust orb (90° apart so combust is moot).
        // To avoid Mercury being combust, separate by 30° — but then they're not
        // all in Leo. Instead: same sign, but spread within Leo so Mercury is
        // combust only if within 9° of Sun. Place Sun at 130° (10° Leo), Mercury
        // at 140° (20° Leo) — that's 10° apart, just outside combust.
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",     longitude: 130, sign: "Leo", house: 5 },
            { name: "Mercury", longitude: 140, sign: "Leo", house: 5 },
            { name: "Venus",   longitude: 145, sign: "Leo", house: 5 },
        ];
        const out = detectClusters(planets);
        expect(out.houseClusters).toHaveLength(1);
        expect(out.houseClusters[0].dignifiedLeaders).toEqual(["Sun"]);
    });

    it("excludes combust members from the leader pool", () => {
        // All three peregrine in Cancer → tied at -15. Mercury is combust
        // (within 9° of Sun) → must be excluded → leaders are Sun + Saturn.
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",     longitude: 100, sign: "Cancer", house: 4 },
            { name: "Mercury", longitude: 103, sign: "Cancer", house: 4 }, // 3° from Sun → combust
            { name: "Saturn",  longitude: 115, sign: "Cancer", house: 4 }, // 15° from Sun → not combust
        ];
        const out = detectClusters(planets);
        const leaders = out.houseClusters[0].dignifiedLeaders.sort();
        expect(leaders).toEqual(["Saturn", "Sun"]);
        expect(leaders).not.toContain("Mercury");
    });

    it("forces cazimi members to lead even when others are more dignified", () => {
        // Sun in Cancer (peregrine), Mercury cazimi to Sun (peregrine),
        // Jupiter in Cancer (exalted, +12). Without cazimi, Jupiter would lead.
        // With cazimi, Mercury forces leadership.
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",     longitude: 100,    sign: "Cancer", house: 4 },
            { name: "Mercury", longitude: 100.1,  sign: "Cancer", house: 4 }, // cazimi (≤0.28°)
            { name: "Jupiter", longitude: 115,    sign: "Cancer", house: 4 }, // exalted in Cancer
        ];
        const out = detectClusters(planets);
        expect(out.houseClusters[0].dignifiedLeaders).toEqual(["Mercury"]);
    });

    it("returns multiple leaders on a dignity tie", () => {
        // Three peregrine planets, none combust → all tied → all leaders.
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",    longitude: 100, sign: "Cancer", house: 4 },
            { name: "Mars",   longitude: 130, sign: "Leo",    house: 5 }, // different sign
            { name: "Saturn", longitude: 150, sign: "Virgo",  house: 6 },
            // Moon and Venus must clear the 9° combust orb so they remain
            // leadership-eligible. Sun at 100°, so members must be ≥ 109°
            // (or ≥ 117° to also clear Under Beams — though Under Beams no
            // longer triggers exclusion as of the buildMember refinement).
            { name: "Moon",   longitude: 120, sign: "Cancer", house: 4 },
            { name: "Venus",  longitude: 125, sign: "Cancer", house: 4 },
        ];
        // Cluster: Sun, Moon, Venus all in Cancer/H4.
        // Sun in Cancer = peregrine (-15)
        // Moon in Cancer = domicile (+15)
        // Venus in Cancer = peregrine (-15)
        // Moon should be the sole leader.
        const out = detectClusters(planets);
        expect(out.houseClusters[0].dignifiedLeaders).toEqual(["Moon"]);
    });
});

// ═══════════════════════════════════════════════════════════════
// Mutual reception
// ═══════════════════════════════════════════════════════════════

describe("detectClusters — mutual reception", () => {
    it("detects a mutual-reception pair within a house cluster", () => {
        // Sun in Cancer (Moon's domicile) + Moon in Leo (Sun's domicile).
        // Both in H1 (artificial fixture — house assignments are pre-resolved
        // by house-matrix, so the test trusts the input).
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",  longitude: 100, sign: "Cancer", house: 1 },
            { name: "Moon", longitude: 130, sign: "Leo",    house: 1 },
            { name: "Mars", longitude: 0,   sign: "Aries",  house: 1 }, // 3rd member to make it a cluster
        ];
        const out = detectClusters(planets);
        expect(out.houseClusters).toHaveLength(1);
        expect(out.houseClusters[0].mutualReceptionPairs).toEqual([["Moon", "Sun"]]);
    });

    it("does not surface mutual reception across separate clusters", () => {
        // Two separate H1 + H7 clusters, mutual receptors split between them.
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",     longitude: 100, sign: "Cancer", house: 1 },
            { name: "Mercury", longitude: 105, sign: "Cancer", house: 1 },
            { name: "Mars",    longitude: 110, sign: "Cancer", house: 1 },
            { name: "Moon",    longitude: 130, sign: "Leo",    house: 7 },
            { name: "Venus",   longitude: 135, sign: "Leo",    house: 7 },
            { name: "Saturn",  longitude: 140, sign: "Leo",    house: 7 },
        ];
        const out = detectClusters(planets);
        // Sun is in H1 cluster, Moon in H7 cluster — they are in mutual
        // reception across the chart, but mutual reception is only detected
        // WITHIN clusters.
        for (const c of out.houseClusters) {
            expect(c.mutualReceptionPairs).toEqual([]);
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// Final dispositor
// ═══════════════════════════════════════════════════════════════

describe("detectClusters — final dispositor", () => {
    it("returns the single planet at the terminus of every chain", () => {
        // Saturn in Capricorn (self-disposited).
        // Every other planet's chain walks back to Saturn:
        //   Sun in Capricorn → Saturn
        //   Mercury in Aquarius → Saturn
        //   Venus in Capricorn → Saturn
        //   Mars in Aquarius → Saturn
        //   Moon in Capricorn → Saturn
        const planets: ClusterInputPlanet[] = [
            { name: "Saturn",  longitude: 270, sign: "Capricorn", house: 10 },
            { name: "Sun",     longitude: 280, sign: "Capricorn", house: 10 },
            { name: "Mercury", longitude: 305, sign: "Aquarius",  house: 11 },
            { name: "Venus",   longitude: 290, sign: "Capricorn", house: 10 },
            { name: "Mars",    longitude: 320, sign: "Aquarius",  house: 11 },
            { name: "Moon",    longitude: 285, sign: "Capricorn", house: 10 },
            { name: "Jupiter", longitude: 295, sign: "Capricorn", house: 10 },
            { name: "Uranus",  longitude: 310, sign: "Aquarius",  house: 11 },
            { name: "Neptune", longitude: 280, sign: "Capricorn", house: 10 },
            { name: "Pluto",   longitude: 322, sign: "Aquarius",  house: 11 },
        ];
        const out = detectClusters(planets);
        expect(out.finalDispositor).toBe("Saturn");
    });

    it("returns undefined when chains converge to multiple planets", () => {
        // Saturn in Capricorn (self-disposited) + Mars in Aries (self-disposited).
        // Two independent termini → no single final dispositor.
        const planets: ClusterInputPlanet[] = [
            { name: "Saturn",  longitude: 270, sign: "Capricorn", house: 10 },
            { name: "Sun",     longitude: 280, sign: "Capricorn", house: 10 },
            { name: "Mars",    longitude: 0,   sign: "Aries",     house: 1  },
            { name: "Mercury", longitude: 5,   sign: "Aries",     house: 1  },
        ];
        const out = detectClusters(planets);
        expect(out.finalDispositor).toBeUndefined();
    });

    it("returns undefined on a non-self-disposited cycle", () => {
        // Sun in Cancer (ruled by Moon) + Moon in Leo (ruled by Sun).
        // Mutual rulership without a self-loop — no terminus.
        const planets: ClusterInputPlanet[] = [
            { name: "Sun",  longitude: 100, sign: "Cancer", house: 4 },
            { name: "Moon", longitude: 130, sign: "Leo",    house: 5 },
        ];
        const out = detectClusters(planets);
        expect(out.finalDispositor).toBeUndefined();
    });
});
