import { describe, expect, it } from "bun:test";
import { detectAspectPatterns, type PatternInputPlanet } from "@/app/lib/aspect-patterns";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const SIGN_AT = (lon: number): string => {
    const idx = Math.floor((((lon % 360) + 360) % 360) / 30);
    return [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
    ][idx];
};

const planet = (name: string, longitude: number): PatternInputPlanet => ({
    name,
    longitude,
    sign: SIGN_AT(longitude),
});

// ═══════════════════════════════════════════════════════════════
// Grand Trine
// ═══════════════════════════════════════════════════════════════

describe("Grand Trine detection", () => {
    it("detects an exact fire-sign grand trine (Aries, Leo, Sagittarius)", () => {
        // 0° Aries, 120° Leo, 240° Sag — perfect 120° spacing.
        const planets: PatternInputPlanet[] = [
            planet("Sun",     0),
            planet("Mars",    120),
            planet("Jupiter", 240),
        ];
        const patterns = detectAspectPatterns(planets);
        expect(patterns).toHaveLength(1);
        expect(patterns[0].type).toBe("grand-trine");
        expect(patterns[0].element).toBe("Fire");
        expect(patterns[0].members).toEqual(["Jupiter", "Mars", "Sun"]);
        expect(patterns[0].tightness).toBeCloseTo(1.0, 2);
    });

    it("detects a loose-orb grand trine and tapers tightness", () => {
        // 0° Aries, 124° Leo (4° off ideal), 240° Sag.
        // Aries-Leo arc: 124° (dev=4)
        // Leo-Sag arc: 116° (dev=4)
        // Aries-Sag arc: 120° (dev=0)
        // Tightest dev = 0, loosest = 4 → all within tight orb (5°),
        // tightness = 1.
        const tight = detectAspectPatterns([
            planet("Sun",     0),
            planet("Mars",    124),
            planet("Jupiter", 240),
        ]);
        expect(tight).toHaveLength(1);
        expect(tight[0].tightness).toBe(1);

        // 0° Aries, 127° Leo (7° off ideal — within loose 8° but past tight 5°).
        // Tightness should be 1 - (7-5)/(8-5) = 1 - 2/3 ≈ 0.33.
        const loose = detectAspectPatterns([
            planet("Sun",     0),
            planet("Mars",    127),
            planet("Jupiter", 240),
        ]);
        expect(loose).toHaveLength(1);
        expect(loose[0].tightness).toBeCloseTo(0.33, 2);
    });

    it("rejects a trine that crosses elements", () => {
        // 0° Aries (Fire), 120° Leo (Fire), 240° Sag (Fire) — but swap one
        // for a non-fire-sign placement at the same longitude band.
        // 0° Aries (Fire), 110° Cancer (Water), 240° Sag (Fire)
        // 110° is Cancer (90-119) — Water, not Fire.
        const patterns = detectAspectPatterns([
            planet("Sun",     0),
            planet("Mars",    110),  // Cancer
            planet("Jupiter", 240),
        ]);
        expect(patterns.filter((p) => p.type === "grand-trine")).toHaveLength(0);
    });

    it("rejects a trine that exceeds the loose orb", () => {
        // 0° Aries, 130° Leo (10° off ideal — outside loose 8° on Aries-Leo
        // pair, even if other pairs are fine).
        const patterns = detectAspectPatterns([
            planet("Sun",     0),
            planet("Mars",    130),
            planet("Jupiter", 240),
        ]);
        expect(patterns.filter((p) => p.type === "grand-trine")).toHaveLength(0);
    });

    it("dedupes — one grand trine reported per member set", () => {
        // Same trine, planets given in different positional ordering. The
        // detector should still emit exactly one descriptor.
        const planets: PatternInputPlanet[] = [
            planet("Jupiter", 240),
            planet("Sun",     0),
            planet("Mars",    120),
        ];
        const patterns = detectAspectPatterns(planets);
        expect(patterns.filter((p) => p.type === "grand-trine")).toHaveLength(1);
    });
});

// ═══════════════════════════════════════════════════════════════
// T-Square
// ═══════════════════════════════════════════════════════════════

describe("T-Square detection", () => {
    it("detects a textbook T-square with the focal planet at the apex", () => {
        // Sun at 0° Aries, Moon at 180° Libra (opposition).
        // Mars at 90° Cancer (square to both → focal).
        const patterns = detectAspectPatterns([
            planet("Sun",  0),
            planet("Moon", 180),
            planet("Mars", 90),
        ]);
        expect(patterns).toHaveLength(1);
        expect(patterns[0].type).toBe("t-square");
        expect(patterns[0].focal).toBe("Mars");
        expect(patterns[0].members).toEqual(["Mars", "Moon", "Sun"]);
        expect(patterns[0].tightness).toBeCloseTo(1.0, 2);
    });

    it("rejects when the focal candidate isn't square to both opposition members", () => {
        // Sun-Moon opposition, but Mars at 60° (sextile to Sun, not square).
        const patterns = detectAspectPatterns([
            planet("Sun",  0),
            planet("Moon", 180),
            planet("Mars", 60),
        ]);
        expect(patterns.filter((p) => p.type === "t-square")).toHaveLength(0);
    });

    it("emits one pattern per focal across two independent oppositions", () => {
        // Two separate oppositions with one focal each:
        //   Sun(0) — Moon(180) opposition; Mars(90) is focal.
        //   Venus(60) — Pluto(240) opposition; Mercury(330) is focal.
        // Some accidental cross-aspects also fit (Mercury squares Sun/Moon
        // too, etc.), so we just assert that ≥2 T-Squares exist and the
        // expected focals are present.
        const patterns = detectAspectPatterns([
            planet("Sun",     0),
            planet("Moon",    180),
            planet("Mars",    90),
            planet("Venus",   60),
            planet("Pluto",   240),
            planet("Mercury", 330),
        ]);
        const tSquares = patterns.filter((p) => p.type === "t-square");
        expect(tSquares.length).toBeGreaterThanOrEqual(2);
        const focals = new Set(tSquares.map((p) => p.focal));
        expect(focals.has("Mars")).toBe(true);
        expect(focals.has("Mercury")).toBe(true);
    });

    it("Grand-Cross-shaped fixture emits 4 T-Squares (correct, until Phase 4b adds Grand Cross detection)", () => {
        // Sun(0)-Moon(180) AND Mars(90)-Saturn(270) — two oppositions with
        // every cross-pair at 90° (a textbook Grand Cross). Each opposition
        // has 2 valid focals → 4 T-Squares total. Phase 4b will collapse
        // this into a single Grand Cross descriptor.
        const patterns = detectAspectPatterns([
            planet("Sun",    0),
            planet("Moon",   180),
            planet("Mars",   90),
            planet("Saturn", 270),
        ]);
        const tSquares = patterns.filter((p) => p.type === "t-square");
        expect(tSquares).toHaveLength(4);
    });

    it("tapers tightness for loose-orb squares and oppositions", () => {
        // Sun at 0°, Moon at 187° (7° off opposition — within loose 9° but
        // past tight 6°). Mars at 90° (perfect square to both).
        // Opposition tightness = 1 - (7-6)/(9-6) = 1 - 1/3 ≈ 0.67
        // Square A (Sun-Mars) tightness = 1.0 (90° from 0°)
        // Square B (Moon-Mars) angular dist = |187-90| = 97 → dev 7° from 90°
        //   → tightness = 1 - (7-5)/(8-5) = 1 - 2/3 ≈ 0.33
        // Min of the three = 0.33.
        const patterns = detectAspectPatterns([
            planet("Sun",  0),
            planet("Moon", 187),
            planet("Mars", 90),
        ]);
        expect(patterns).toHaveLength(1);
        expect(patterns[0].tightness).toBeCloseTo(0.33, 2);
    });
});

// ═══════════════════════════════════════════════════════════════
// Mixed / no-pattern baselines
// ═══════════════════════════════════════════════════════════════

describe("baseline cases", () => {
    it("returns empty for fewer than 3 planets", () => {
        expect(detectAspectPatterns([])).toEqual([]);
        expect(detectAspectPatterns([planet("Sun", 0)])).toEqual([]);
        expect(detectAspectPatterns([planet("Sun", 0), planet("Moon", 90)])).toEqual([]);
    });

    it("returns empty for a chart with neither pattern present", () => {
        // 3 planets at 0°, 30°, 60° — sextiles all around, no trines or
        // squares of the right shape.
        const patterns = detectAspectPatterns([
            planet("Sun",  0),
            planet("Moon", 30),
            planet("Mars", 60),
        ]);
        expect(patterns).toEqual([]);
    });
});
