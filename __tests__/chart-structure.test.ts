import { describe, expect, it } from "bun:test";
import {
    buildChartStructure,
    type ChartStructurePlanetInput,
} from "@/lib/readings/chart-structure";

// Whole-sign houses anchored at 0° Aries: each 30° block maps directly to
// the next house number, so signFromLongitude → house = sign index + 1.
function houseOfWholeSignAries(lon: number): number {
    return Math.floor((((lon % 360) + 360) % 360) / 30) + 1;
}

const SIGN_AT = (lon: number): string => {
    const idx = Math.floor((((lon % 360) + 360) % 360) / 30);
    return [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
    ][idx];
};

const planet = (name: string, longitude: number): ChartStructurePlanetInput => ({
    name,
    longitude,
    sign: SIGN_AT(longitude),
});

// ═══════════════════════════════════════════════════════════════
// Empty / no-cluster baselines
// ═══════════════════════════════════════════════════════════════

describe("buildChartStructure — empty inputs", () => {
    it("returns empty arrays for an empty input", () => {
        const out = buildChartStructure([], houseOfWholeSignAries);
        expect(out.stelliums).toEqual([]);
        expect(out.patterns).toEqual([]);
        expect(out.finalDispositor).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════
// Capricorn stellium fixture
// ═══════════════════════════════════════════════════════════════

describe("buildChartStructure — Capricorn stellium", () => {
    const fixture: ChartStructurePlanetInput[] = [
        planet("Sun",     270),
        planet("Mercury", 285),
        planet("Venus",   295),
        planet("Moon",    45),
        planet("Mars",    100),
        planet("Jupiter", 200),
        planet("Saturn",  320),
        planet("Uranus",  60),
        planet("Neptune", 150),
        planet("Pluto",   240),
    ];
    const out = buildChartStructure(fixture, houseOfWholeSignAries);

    it("surfaces a house stellium for the Capricorn cluster", () => {
        const houseStellium = out.stelliums.find((s) => s.kind === "house");
        expect(houseStellium).toBeDefined();
        expect(houseStellium!.key).toBe("house-10");
        expect(houseStellium!.location).toBe("Capricorn 10th house");
        expect(houseStellium!.members).toEqual(["Mercury", "Sun", "Venus"]);
        expect(houseStellium!.generational).toBe(false);
        expect(houseStellium!.livedTheme).toContain("10th house");
        expect(houseStellium!.livedTheme).toContain("3 planets");
    });

    it("surfaces a sign stellium with Saturn as dispositor and full placement", () => {
        const signStellium = out.stelliums.find((s) => s.kind === "sign");
        expect(signStellium).toBeDefined();
        expect(signStellium!.key).toBe("sign-capricorn");
        expect(signStellium!.location).toBe("Capricorn");
        expect(signStellium!.dispositor).toBe("Saturn (in Aquarius, 11th house)");
        expect(signStellium!.livedTheme).toContain("Saturn");
    });

    it("does NOT duplicate the orb cluster when it covers the same membership", () => {
        // House+sign clusters cover Sun/Mercury/Venus. The orb cluster
        // (if it fires) would be redundant — should be filtered out.
        const orbStelliums = out.stelliums.filter((s) => s.kind === "orb");
        // The Cap fixture has Sun(270)/Mercury(285)/Venus(295) — spread is
        // 25° which is wider than the 10° orb window, so no orb cluster
        // fires in the first place. Either way, no orb stellium should
        // appear in the output.
        expect(orbStelliums).toEqual([]);
    });

    it("identifies Saturn as the chart's final dispositor", () => {
        // Every chain in this fixture walks back to Saturn — the cluster
        // detector reports it, and chart-structure surfaces it with full
        // placement context.
        expect(out.finalDispositor).toBeDefined();
        expect(out.finalDispositor!.planet).toBe("Saturn");
        expect(out.finalDispositor!.placement).toBe("Aquarius, 11th house");
    });

    it("surfaces the Neptune T-Square (Uranus opp Pluto, Neptune square both)", () => {
        // Uranus(60) opp Pluto(240); Neptune(150) sq both → focal Neptune.
        const tSquare = out.patterns.find((p) => p.type === "t-square");
        expect(tSquare).toBeDefined();
        expect(tSquare!.focal).toBe("Neptune");
        expect(tSquare!.key).toBe("t-square-neptune");
        expect(tSquare!.members).toEqual(["Neptune", "Pluto", "Uranus"]);
        expect(tSquare!.livedTheme).toContain("Neptune");
        expect(tSquare!.livedTheme).toContain("pressure point");
    });
});

// ═══════════════════════════════════════════════════════════════
// Filter rules
// ═══════════════════════════════════════════════════════════════

describe("buildChartStructure — filter rules", () => {
    it("flags ≥2 outer members as generational", () => {
        // Saturn-Uranus-Pluto stellium in Capricorn / H10 — exactly the
        // generational cohort case the plan §8.4 directs prompts to skip.
        const fixture: ChartStructurePlanetInput[] = [
            planet("Saturn", 270),
            planet("Uranus", 273),
            planet("Pluto",  277),
            planet("Sun",    100),
            planet("Moon",   45),
            planet("Mercury", 80),
            planet("Venus",   115),
            planet("Mars",    200),
            planet("Jupiter", 220),
            planet("Neptune", 320),
        ];
        const out = buildChartStructure(fixture, houseOfWholeSignAries);
        const houseStellium = out.stelliums.find((s) => s.kind === "house");
        expect(houseStellium).toBeDefined();
        expect(houseStellium!.generational).toBe(true);
    });

    it("suppresses T-Squares where Moon is a non-apex member", () => {
        // Sun(0)-Mars(180) opposition; Moon(90) square both — Moon as apex
        // (focal). This case IS surfaced because Moon is the focal.
        const moonAsApex: ChartStructurePlanetInput[] = [
            planet("Sun",  0),
            planet("Mars", 180),
            planet("Moon", 90),
        ];
        const apexOut = buildChartStructure(moonAsApex, houseOfWholeSignAries);
        const apexT = apexOut.patterns.find((p) => p.type === "t-square");
        expect(apexT).toBeDefined();
        expect(apexT!.focal).toBe("Moon");

        // Sun(0)-Moon(180) opposition; Mars(90) square both — Moon as a
        // non-apex member. This case should be SUPPRESSED.
        const moonAsMember: ChartStructurePlanetInput[] = [
            planet("Sun",  0),
            planet("Moon", 180),
            planet("Mars", 90),
        ];
        const memberOut = buildChartStructure(moonAsMember, houseOfWholeSignAries);
        expect(memberOut.patterns.filter((p) => p.type === "t-square")).toEqual([]);
    });
});
