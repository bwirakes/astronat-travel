import { describe, expect, it } from "bun:test";
import {
    computePersonalCycleContext,
    type PersonalCycleContext,
} from "@/app/lib/personal-cycles";
import type { ComputedPosition } from "@/lib/astro/transits";
import type { ProgressionsResult } from "@/app/lib/progressions";

// ─── Builders ───────────────────────────────────────────────────────────────
// Tests below pin one behavior at a time. Each builder takes the smallest
// number of parameters to flip the cycle being tested.

function natal(name: string, longitude: number) {
    return { name, planet: name, longitude };
}

function transitPos(name: string, longitude: number): ComputedPosition {
    return {
        name,
        longitude,
        sign: "Aries",
        degree_in_sign: 0,
        degree_minutes: 0,
        speed: 0.1,
        is_retrograde: false,
        computed_at_utc: new Date().toISOString(),
    };
}

function progressedBands(progSunLon: number, progMoonLon: number): ProgressionsResult {
    return {
        progressedDateUtc: "2026-05-01T00:00:00.000Z",
        yearsElapsed: 30,
        bands: [
            {
                planet: "Sun",
                longitude: progSunLon,
                sign: "Aries",
                longitudeRangeDeg: { fromLon: 0, toLon: 30 },
                longitudeRange: "0°E–30°E",
                destinationInBand: false,
            },
            {
                planet: "Moon",
                longitude: progMoonLon,
                sign: "Aries",
                longitudeRangeDeg: { fromLon: 0, toLon: 30 },
                longitudeRange: "0°E–30°E",
                destinationInBand: false,
            },
        ],
        aggregate: 0,
    };
}

// Reference dates for ordinal-of-Saturn-return tests.
const BIRTH_1996 = new Date("1996-05-01T00:00:00Z"); // age ~30 at refDate 2026-05-05
const BIRTH_1968 = new Date("1968-05-01T00:00:00Z"); // age ~58
const BIRTH_1936 = new Date("1936-05-01T00:00:00Z"); // age ~90
const REF_DATE   = new Date("2026-05-05T00:00:00Z");

// A neutral lunation that won't trip the gate (gibbous, transitional).
const NEUTRAL_LUNATION = progressedBands(0, 160); // elongation 160 → gibbous

// ─── Saturn return ──────────────────────────────────────────────────────────

describe("Saturn return detection", () => {
    it("activates when transit Saturn is within 5° of natal Saturn", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 102)], // orb 2°
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.saturnReturn).toBeDefined();
        expect(ctx.saturnReturn!.orb).toBe(2);
        expect(ctx.saturnReturn!.valence).toBe("gate");
        expect(ctx.gateActive).toBe(true);
    });

    it("does not activate beyond 5° orb", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 110)], // orb 10°
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.saturnReturn).toBeUndefined();
    });

    it("labels phase as exact when orb ≤ 1°", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 100.5)], // orb 0.5°
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.saturnReturn!.phase).toBe("exact");
    });

    it("labels phase as approaching when orb > 1°", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 103)], // orb 3°
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.saturnReturn!.phase).toBe("approaching");
    });

    it("assigns ordinal=1 around age 30", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 100)],
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.saturnReturn!.ordinal).toBe(1);
    });

    it("assigns ordinal=2 around age 58", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 100)],
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1968,
        });
        expect(ctx.saturnReturn!.ordinal).toBe(2);
    });

    it("assigns ordinal=3 around age 90", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 100)],
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1936,
        });
        expect(ctx.saturnReturn!.ordinal).toBe(3);
    });

    it("handles cross-zodiac wrap (e.g. natal at 358°, transit at 2°)", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 358)],
            transitPositions: [transitPos("Saturn", 2)], // 4° apart, not 356°
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.saturnReturn).toBeDefined();
        expect(ctx.saturnReturn!.orb).toBe(4);
    });
});

// ─── Midlife band ───────────────────────────────────────────────────────────

describe("Midlife detection", () => {
    it("activates on Uranus opposition within 3°", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Uranus", 100)],
            transitPositions: [transitPos("Uranus", 282)], // 182° apart → 2° from opposition
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.midlife).toBeDefined();
        expect(ctx.midlife!.weight).toBe(1);
        expect(ctx.midlife!.activeAspects[0].transit).toBe("uranus");
        expect(ctx.midlife!.activeAspects[0].aspect).toBe("opposition");
    });

    it("activates on Neptune square within 3°", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Neptune", 50)],
            transitPositions: [transitPos("Neptune", 138)], // 88° apart → 2° from square
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.midlife).toBeDefined();
        expect(ctx.midlife!.activeAspects[0].transit).toBe("neptune");
    });

    it("counts weight=3 when all three midlife aspects fire", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [
                natal("Uranus",  100),
                natal("Neptune",  50),
                natal("Pluto",   200),
            ],
            transitPositions: [
                transitPos("Uranus",  280), // opp natal Uranus, orb 0°
                transitPos("Neptune", 140), // sq natal Neptune, orb 0°
                transitPos("Pluto",   290), // sq natal Pluto, orb 0°
            ],
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.midlife!.weight).toBe(3);
        expect(ctx.midlife!.activeAspects).toHaveLength(3);
    });

    it("does not activate beyond 3° orb", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Uranus", 100)],
            transitPositions: [transitPos("Uranus", 290)], // 190° apart → 10° from opposition
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.midlife).toBeUndefined();
    });
});

// ─── Progressed lunation phase ──────────────────────────────────────────────

describe("Progressed lunation phase bucketing", () => {
    const cases: Array<{ elongation: number; phase: string; valence: string }> = [
        { elongation:   0, phase: "new",            valence: "uplift"        },
        { elongation:  20, phase: "new",            valence: "uplift"        },
        { elongation:  60, phase: "crescent",       valence: "uplift"        },
        { elongation: 100, phase: "first-quarter",  valence: "transitional"  },
        { elongation: 150, phase: "gibbous",        valence: "transitional"  },
        { elongation: 200, phase: "full",           valence: "transitional"  },
        { elongation: 240, phase: "disseminating",  valence: "transitional"  },
        { elongation: 280, phase: "last-quarter",   valence: "gate"          },
        { elongation: 330, phase: "balsamic",       valence: "gate"          },
    ];

    for (const c of cases) {
        it(`elongation ${c.elongation}° → ${c.phase} (${c.valence})`, () => {
            const ctx = computePersonalCycleContext({
                natalPlanets: [],
                transitPositions: [],
                progressedBands: progressedBands(0, c.elongation),
                refDate: REF_DATE,
                birthDateUtc: BIRTH_1996,
            });
            expect(ctx.progressedLunation.phase).toBe(c.phase as any);
            expect(ctx.progressedLunation.valence).toBe(c.valence as any);
        });
    }

    it("computes elongation across the 0/360 wrap (prog Moon at 10°, prog Sun at 350°)", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [],
            transitPositions: [],
            progressedBands: progressedBands(350, 10),
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        // Moon at 10°, Sun at 350° → Moon 20° ahead of Sun
        expect(ctx.progressedLunation.elongation).toBe(20);
        expect(ctx.progressedLunation.phase).toBe("new");
    });
});

// ─── Aggregate behavior ─────────────────────────────────────────────────────

describe("Aggregate dominant + flags", () => {
    it("returns dominant=none and gateActive=false when nothing fires", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 200)], // far from return
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.dominant).toBe("none");
        expect(ctx.gateActive).toBe(false);
        expect(ctx.upliftActive).toBe(false);
        expect(ctx.summary).toBe("");
    });

    it("Saturn return wins over midlife when both fire", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [
                natal("Saturn", 100),
                natal("Uranus", 100),
            ],
            transitPositions: [
                transitPos("Saturn", 100), // return active
                transitPos("Uranus", 280), // opposition active
            ],
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.dominant).toBe("saturn-return");
        expect(ctx.gateActive).toBe(true);
        expect(ctx.summary).toContain("Saturn return");
    });

    it("balsamic lunation wins when no heavy cycle is firing", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [],
            transitPositions: [],
            progressedBands: progressedBands(0, 330), // balsamic
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.dominant).toBe("balsamic-lunation");
        expect(ctx.gateActive).toBe(true);
    });

    it("uplift fires only when no gate is active", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [],
            transitPositions: [],
            progressedBands: progressedBands(0, 30), // new moon → uplift
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.dominant).toBe("lunation-uplift");
        expect(ctx.gateActive).toBe(false);
        expect(ctx.upliftActive).toBe(true);
    });

    it("gateActive suppresses upliftActive even when both phases match", () => {
        // Saturn return + new lunation: gate wins, uplift goes false.
        const ctx = computePersonalCycleContext({
            natalPlanets: [natal("Saturn", 100)],
            transitPositions: [transitPos("Saturn", 100)],
            progressedBands: progressedBands(0, 30), // would-be uplift
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.gateActive).toBe(true);
        expect(ctx.upliftActive).toBe(false);
    });

    it("summary is non-empty whenever dominant ≠ 'none'", () => {
        const cases: Array<Partial<Parameters<typeof computePersonalCycleContext>[0]>> = [
            { natalPlanets: [natal("Saturn", 100)], transitPositions: [transitPos("Saturn", 100)] },
            { natalPlanets: [natal("Uranus", 100)], transitPositions: [transitPos("Uranus", 280)] },
            { progressedBands: progressedBands(0, 330) },
            { progressedBands: progressedBands(0, 30) },
        ];
        for (const overrides of cases) {
            const ctx = computePersonalCycleContext({
                natalPlanets: [],
                transitPositions: [],
                progressedBands: NEUTRAL_LUNATION,
                refDate: REF_DATE,
                birthDateUtc: BIRTH_1996,
                ...overrides,
            } as Parameters<typeof computePersonalCycleContext>[0]);
            expect(ctx.summary.length).toBeGreaterThan(0);
        }
    });
});

// ─── Robustness ─────────────────────────────────────────────────────────────

describe("Missing input robustness", () => {
    it("falls back to transitional placeholder when progressedBands is missing", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [],
            transitPositions: [],
            // progressedBands omitted
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.progressedLunation).toBeDefined();
        expect(ctx.progressedLunation.valence).toBe("transitional");
        expect(ctx.dominant).toBe("none");
        expect(ctx.gateActive).toBe(false);
    });

    it("returns dominant=none when natalPlanets is empty", () => {
        const ctx = computePersonalCycleContext({
            natalPlanets: [],
            transitPositions: [transitPos("Saturn", 100)],
            progressedBands: NEUTRAL_LUNATION,
            refDate: REF_DATE,
            birthDateUtc: BIRTH_1996,
        });
        expect(ctx.saturnReturn).toBeUndefined();
        expect(ctx.midlife).toBeUndefined();
    });
});
