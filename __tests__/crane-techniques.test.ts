/**
 * crane-techniques.test.ts
 *
 * Contract evals for the Crane Weather Framework (T30–T34, T17b, T18c, T18d).
 *
 * Purpose: lock in the rules' shape, weights, and applicability before they
 * get wired into the scorer. If a rule changes, the test breaks and the change
 * is reviewed deliberately.
 */
import { describe, expect, it } from "bun:test";

import {
    CRANE_REJECTED_TECHNIQUES,
    CRANE_SUBCRITERIA,
    CRANE_T18_CAP_RAISED,
    CRANE_TECHNIQUES,
    SIGN_ELEMENTS,
    craneT30aElementMatch,
    craneT30bElementMatch,
    craneTechniqueById,
} from "@/app/lib/geodetic/crane-techniques";

describe("Crane T30–T34", () => {
    it("exposes exactly six techniques: T30a, T30b, T31, T32, T33, T34", () => {
        const ids = CRANE_TECHNIQUES.map((t) => t.id).sort();
        expect(ids).toEqual(["T30a", "T30b", "T31", "T32", "T33", "T34"]);
    });

    it("does not collide with existing dashboard technique IDs (T25–T28)", () => {
        const ids = new Set(CRANE_TECHNIQUES.map((t) => t.id));
        for (const existing of ["T25", "T25_world_axis", "T26", "T27", "T28"]) {
            expect(ids.has(existing)).toBe(false);
        }
    });

    it("pins the published weights from the validation report", () => {
        const expected: Record<string, number> = {
            T30a: 0.05,
            T30b: 0.04,
            T31: 0.06,
            T32: 0.05,
            T33: 0.04,
            T34: 0.07,
        };
        for (const t of CRANE_TECHNIQUES) {
            expect(t.weight).toBe(expected[t.id]);
        }
    });

    it("excludes seismic / accident event types from every Crane rule", () => {
        for (const t of CRANE_TECHNIQUES) {
            expect(t.appliesTo).not.toContain("seismic" as never);
            expect(t.appliesTo).not.toContain("accident" as never);
        }
    });

    it("T31 (Ceres angular) is distinct from retired Technique I (Ceres Rx)", () => {
        const t31 = CRANE_TECHNIQUES.find((t) => t.id === "T31")!;
        // T31's rule must reference angular Ceres in a weather chart, not Rx station.
        expect(t31.contexts).toContain("cardinal-ingress");
        expect(t31.notes).toMatch(/Technique I.*NOT CONFIRMED/i);
    });

    it("T33 (Sedna coastal storm) is watch-only pending validation", () => {
        const t33 = CRANE_TECHNIQUES.find((t) => t.id === "T33")!;
        expect(t33.status).toBe("watch");
    });

    it("T34 (Pluto sustained transit) requires ≥ 90-day orb contact", () => {
        const t34 = CRANE_TECHNIQUES.find((t) => t.id === "T34")!;
        expect(t34.rule).toMatch(/90/);
        expect(t34.bodies).toEqual(["Pluto"]);
    });
});

describe("Crane sub-criteria (T17b, T18c, T18d)", () => {
    it("registers all three sub-criteria", () => {
        const ids = CRANE_SUBCRITERIA.map((c) => c.id).sort();
        expect(ids).toEqual(["T17b", "T18c", "T18d"]);
    });

    it("T17b extends T17 nodal stress with South-Node-at-ingress", () => {
        const t17b = CRANE_SUBCRITERIA.find((c) => c.id === "T17b")!;
        expect(t17b.parentTechniqueId).toBe("T17");
        expect(t17b.weight).toBe(0.05);
    });

    it("T18c and T18d both extend T18 (raised cap)", () => {
        const t18c = CRANE_SUBCRITERIA.find((c) => c.id === "T18c")!;
        const t18d = CRANE_SUBCRITERIA.find((c) => c.id === "T18d")!;
        expect(t18c.parentTechniqueId).toBe("T18");
        expect(t18d.parentTechniqueId).toBe("T18");
        expect(t18c.weight).toBe(0.05);
        expect(t18d.weight).toBe(0.04);
    });

    it("T18 cap is raised to 0.20", () => {
        expect(CRANE_T18_CAP_RAISED).toBe(0.2);
    });
});

describe("Crane element matching", () => {
    it("classifies every zodiac sign by element", () => {
        for (const sign of ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]) {
            expect(SIGN_ELEMENTS[sign]).toBeDefined();
        }
    });

    it("T30a matches fire for heat/drought/wildfire; water for flood/cyclone", () => {
        expect(craneT30aElementMatch("heat")).toContain("fire");
        expect(craneT30aElementMatch("drought")).toContain("fire");
        expect(craneT30aElementMatch("wildfire")).toContain("fire");
        expect(craneT30aElementMatch("flood")).toContain("water");
        expect(craneT30aElementMatch("cyclone")).toContain("water");
        expect(craneT30aElementMatch("cold-snap")).toContain("earth");
        expect(craneT30aElementMatch("freeze")).toContain("water");
    });

    it("T30b matches fire for heat-class; water for flood-class; earth for cold-class", () => {
        expect(craneT30bElementMatch("heat")).toEqual(["fire"]);
        expect(craneT30bElementMatch("flood")).toEqual(["water"]);
        expect(craneT30bElementMatch("cold-snap")).toEqual(["earth"]);
    });
});

describe("Crane rejected techniques", () => {
    it("documents the techniques explicitly NOT added with a reason", () => {
        const names = CRANE_REJECTED_TECHNIQUES.map((r) => r.name);
        expect(names).toContain("Mercury sign = temperature");
        expect(names).toContain("Dwad positions of ingress charts");
        for (const r of CRANE_REJECTED_TECHNIQUES) {
            expect(r.reason.length).toBeGreaterThan(15);
        }
    });
});

describe("technique lookup", () => {
    it("finds T30a, T31, T34 by id", () => {
        expect(craneTechniqueById("T30a")?.id).toBe("T30a");
        expect(craneTechniqueById("T31")?.id).toBe("T31");
        expect(craneTechniqueById("T34")?.id).toBe("T34");
    });

    it("finds sub-criteria by id", () => {
        expect(craneTechniqueById("T17b")?.id).toBe("T17b");
        expect(craneTechniqueById("T18c")?.id).toBe("T18c");
    });

    it("returns undefined for unknown ids", () => {
        expect(craneTechniqueById("T999")).toBeUndefined();
    });
});
