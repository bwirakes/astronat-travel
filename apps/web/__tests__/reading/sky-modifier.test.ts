import { describe, expect, it } from "bun:test";
import { computeSkyModifier } from "@/app/lib/scoring-engine";
import { LIFE_EVENTS, PLANETS } from "@/app/lib/planet-library";
import type { UniversalSkyState } from "@/app/lib/universal-sky";

// ═══════════════════════════════════════════════════════════════
// Helpers — minimal UniversalSkyState fixture builder.
//
// We only populate the fields computeSkyModifier reads:
//   - retrogrades (planet, sign, element, modality, dignity)
//   - aspects (type, orb)
//   - eclipses (inSolarWindow, inLunarWindow)
//   - nodeAspects (planet, type, isMalefic, orb)
//
// All other fields are stubbed with empty/safe defaults so the type checks.
// ═══════════════════════════════════════════════════════════════

function emptyShellSky(overrides: Partial<UniversalSkyState> = {}): UniversalSkyState {
    return {
        refDateISO: "2026-05-10",
        retrogrades: [],
        stations: [],
        retrogradeWindows: [],
        ingresses: [],
        aspects: [],
        nodes: {
            trueNodeSign: "Pisces",
            trueNodeLon: 350,
            southNodeSign: "Virgo",
            southNodeLon: 170,
        },
        nodeAspects: [],
        eclipses: { inSolarWindow: false, inLunarWindow: false, nextEvents: [] },
        ...overrides,
    };
}

const IDENTITY_IDX = LIFE_EVENTS.indexOf("Identity & Self-Discovery");
const SPIRITUALITY_IDX = LIFE_EVENTS.indexOf("Spirituality & Inner Peace");

// ═══════════════════════════════════════════════════════════════
// Golden 1 — quiet sky returns ~zero across all events
// ═══════════════════════════════════════════════════════════════

describe("computeSkyModifier — quiet sky", () => {
    it("returns a 9-element vector of all zeros when nothing is happening", () => {
        const mod = computeSkyModifier(emptyShellSky());
        expect(mod).toHaveLength(LIFE_EVENTS.length);
        for (const v of mod) expect(v).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════
// Golden 2 — Mercury Rx in Pisces (detriment + element clash)
//
// This is the headline calibration case. Mercury hates Water (clash 1.4×)
// AND is in detriment in Pisces (1.5×). With BASE_RX_WEIGHT[mercury]=7 and
// modality=mutable (1.2×), severity = 7 × 1.5 × 1.2 × 1.4 = 17.64.
//
// That severity is then distributed across the 9 events by the Mercury
// row of PLANET_EVENT_AFFINITY. Mercury weighs heaviest on Career and
// Health (both 0.5–0.7), lightest on Spirituality (0.2). All entries are
// strictly negative (retrograde dampens, never lifts).
// ═══════════════════════════════════════════════════════════════

describe("computeSkyModifier — Mercury Rx in Pisces", () => {
    const mod = computeSkyModifier(emptyShellSky({
        retrogrades: [{
            planet: "mercury",
            sign: "Pisces",
            element: "water",
            modality: "mutable",
            dignity: "detriment",
            longitude: 345,
            speed: -0.3,
        }],
    }));

    it("produces a 9-element vector", () => {
        expect(mod).toHaveLength(LIFE_EVENTS.length);
    });

    it("dampens every event (no positive entries)", () => {
        for (const v of mod) expect(v).toBeLessThan(0);
    });

    it("element-clash + detriment + mutable stacking lands in expected band", () => {
        // Severity 17.64 distributed by Mercury's affinity row (max 0.7).
        // Worst-affected event: 17.64 × 0.7 = -12.35.
        // Least-affected event: 17.64 × 0.2 = -3.53.
        const worst = Math.min(...mod);
        const least = Math.max(...mod);
        expect(worst).toBeGreaterThan(-13);   // not exceeding the math
        expect(worst).toBeLessThan(-11);      // and clearly below -11
        expect(least).toBeLessThan(-3);
        expect(least).toBeGreaterThan(-4);
    });

    it("dampens harder than the same Mercury Rx in an air sign would", () => {
        // Mercury Rx in Gemini (domicile + air = preferred element):
        //   severity = 7 × 0.4 (domicile) × 1.2 (mutable) × 0.85 (preferred)
        //            = 2.86 (vs 17.64 in Pisces — ~6× difference)
        const airMod = computeSkyModifier(emptyShellSky({
            retrogrades: [{
                planet: "mercury",
                sign: "Gemini",
                element: "air",
                modality: "mutable",
                dignity: "domicile",
                longitude: 75,
                speed: -0.3,
            }],
        }));
        // Sum-magnitude comparison — Pisces case should be much heavier.
        const piscesTotal = mod.reduce((a, b) => a + b, 0);
        const geminiTotal = airMod.reduce((a, b) => a + b, 0);
        expect(piscesTotal).toBeLessThan(geminiTotal); // more negative = lower
        expect(Math.abs(piscesTotal)).toBeGreaterThan(Math.abs(geminiTotal) * 4);
    });
});

// ═══════════════════════════════════════════════════════════════
// Golden 3 — node aspects bias toward Identity & Spirituality
//
// Mars conjunction North Node (orb 1°) is malefic + hard. The dampener
// applies *only* to Identity (idx 0) and Spirituality (idx 8), not to
// the other 7 events. Other entries should be exactly 0 in this fixture.
// ═══════════════════════════════════════════════════════════════

describe("computeSkyModifier — malefic node aspect", () => {
    it("biases dampener onto Identity and Spirituality only", () => {
        const mod = computeSkyModifier(emptyShellSky({
            nodeAspects: [{
                planet: "mars",
                node: "north",
                type: "conjunction",
                orb: 1,
                isMalefic: true,
            }],
        }));

        // Identity & Spirituality dampened
        expect(mod[IDENTITY_IDX]).toBeLessThan(0);
        expect(mod[SPIRITUALITY_IDX]).toBeLessThan(0);
        // Same magnitude — same dampener applied to both
        expect(mod[IDENTITY_IDX]).toBeCloseTo(mod[SPIRITUALITY_IDX], 5);
        // Every other event untouched
        for (let i = 0; i < LIFE_EVENTS.length; i++) {
            if (i === IDENTITY_IDX || i === SPIRITUALITY_IDX) continue;
            expect(mod[i]).toBe(0);
        }
    });

    it("ignores benign node aspects (only malefics dampen)", () => {
        const mod = computeSkyModifier(emptyShellSky({
            nodeAspects: [{
                planet: "venus",
                node: "north",
                type: "conjunction",
                orb: 1,
                isMalefic: false,
            }],
        }));
        for (const v of mod) expect(v).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════
// Plumbing sanity — affinity table dimensions match LIFE_EVENTS / PLANETS
// ═══════════════════════════════════════════════════════════════

describe("computeSkyModifier — output shape contract", () => {
    it("always returns LIFE_EVENTS.length entries", () => {
        const mod = computeSkyModifier(emptyShellSky({
            retrogrades: [{
                planet: "pluto", sign: "Aquarius", element: "air",
                modality: "fixed", dignity: "fall", longitude: 305, speed: -0.01,
            }],
            aspects: [{ p1: "saturn", p2: "neptune", type: "trine", orb: 2 }],
            eclipses: { inSolarWindow: true, inLunarWindow: false, nextEvents: [] },
        }));
        expect(mod).toHaveLength(LIFE_EVENTS.length);
    });

    it("PLANETS array contains every planet referenced by BASE_RX_WEIGHT", () => {
        // Implicit guard: if PLANETS shrinks or a planet is renamed,
        // BASE_RX_WEIGHT lookups in the production code would silently
        // return undefined and stop dampening that planet. This snapshot
        // catches the drift.
        for (const p of ["sun", "moon", "mercury", "venus", "mars",
                         "jupiter", "saturn", "uranus", "neptune", "pluto"]) {
            expect(PLANETS).toContain(p);
        }
    });
});
