import { describe, expect, it } from "bun:test";
import {
    EVENT_LABELS,
    HERO_BAND_LABEL,
    HERO_LABELS,
    WINDOW_LABELS,
    WINDOW_RATIONALES,
    computeCoherence,
    heroBand,
    verdictBand,
    verdictTone,
    type HeroBand,
    type VerdictBand,
    type VerdictTone,
} from "@/app/lib/verdict";

describe("verdictBand thresholds", () => {
    it("returns peak at and above 80", () => {
        expect(verdictBand(80)).toBe("peak");
        expect(verdictBand(95)).toBe("peak");
        expect(verdictBand(100)).toBe("peak");
    });

    it("returns solid in [65, 80)", () => {
        expect(verdictBand(65)).toBe("solid");
        expect(verdictBand(72)).toBe("solid");
        expect(verdictBand(79)).toBe("solid");
    });

    it("returns mixed in [50, 65)", () => {
        expect(verdictBand(50)).toBe("mixed");
        expect(verdictBand(57)).toBe("mixed");
        expect(verdictBand(64)).toBe("mixed");
    });

    it("returns tight in [35, 50)", () => {
        expect(verdictBand(35)).toBe("tight");
        expect(verdictBand(42)).toBe("tight");
        expect(verdictBand(49)).toBe("tight");
    });

    it("returns hard below 35", () => {
        expect(verdictBand(34)).toBe("hard");
        expect(verdictBand(0)).toBe("hard");
    });
});

describe("verdictTone", () => {
    it("groups peak and solid as lift", () => {
        expect(verdictTone("peak")).toBe("lift");
        expect(verdictTone("solid")).toBe("lift");
    });
    it("groups mixed as neutral", () => {
        expect(verdictTone("mixed")).toBe("neutral");
    });
    it("groups tight and hard as press", () => {
        expect(verdictTone("tight")).toBe("press");
        expect(verdictTone("hard")).toBe("press");
    });
});

describe("heroBand collapses 5-band → 4-band", () => {
    it("preserves peak, solid, mixed", () => {
        expect(heroBand(85)).toBe("peak");
        expect(heroBand(70)).toBe("solid");
        expect(heroBand(55)).toBe("mixed");
    });
    it("collapses tight and hard into tough", () => {
        expect(heroBand(40)).toBe("tough");
        expect(heroBand(20)).toBe("tough");
    });
});

describe("label dictionaries are exhaustive over VerdictBand", () => {
    const allBands: VerdictBand[] = ["peak", "solid", "mixed", "tight", "hard"];
    it.each(allBands.map((band) => [band]))("HERO_LABELS has %s", (band) => {
        expect(HERO_LABELS[band]).toBeTruthy();
    });
    it.each(allBands.map((band) => [band]))("EVENT_LABELS has %s", (band) => {
        expect(EVENT_LABELS[band]).toBeTruthy();
    });
    it.each(allBands.map((band) => [band]))("WINDOW_LABELS has %s", (band) => {
        expect(WINDOW_LABELS[band]).toBeTruthy();
    });
    it.each(allBands.map((band) => [band]))("WINDOW_RATIONALES has %s", (band) => {
        expect(WINDOW_RATIONALES[band]).toBeTruthy();
    });
});

describe("HERO_BAND_LABEL is exhaustive over HeroBand", () => {
    const heroBands: HeroBand[] = ["peak", "solid", "mixed", "tough"];
    it.each(heroBands.map((band) => [band]))("has %s", (band) => {
        expect(HERO_BAND_LABEL[band]).toBeTruthy();
    });
});

describe("computeCoherence", () => {
    it("returns 100 when both partners score identically", () => {
        expect(computeCoherence(72, 72)).toBe(100);
        expect(computeCoherence(30, 30)).toBe(100);
        expect(computeCoherence(0, 0)).toBe(100);
    });

    it("treats two coherently-low scores as coherent (not incoherent)", () => {
        // Two partners both at 30 is a coherent 'tough match', not an
        // incoherent reading. The hero pill surfaces the underlying band
        // separately; coherence isolates alignment from absolute score.
        expect(computeCoherence(30, 30)).toBe(100);
    });

    it("scales linearly with the absolute delta", () => {
        expect(computeCoherence(80, 70)).toBe(90);
        expect(computeCoherence(80, 50)).toBe(70);
        expect(computeCoherence(80, 20)).toBe(40);
    });

    it("is symmetric in its arguments", () => {
        expect(computeCoherence(80, 50)).toBe(computeCoherence(50, 80));
        expect(computeCoherence(95, 12)).toBe(computeCoherence(12, 95));
    });

    it("floors at 0 for the maximum delta", () => {
        expect(computeCoherence(100, 0)).toBe(0);
        expect(computeCoherence(0, 100)).toBe(0);
    });

    it("rounds the result to an integer", () => {
        // delta 7.5 → coherence 92.5 → 93 (round-half-to-even gives 92, but
        // Math.round in JS rounds half-to-positive-infinity so it's 93).
        expect(Number.isInteger(computeCoherence(80, 72.5))).toBe(true);
    });
});

describe("engine ↔ hero ↔ timing thresholds agree on key transitions", () => {
    // The whole point of verdict.ts is that the same score produces the
    // same band semantics across surfaces. If anyone changes the cutoffs
    // for one surface but not another, this test catches it.
    const cases: Array<[number, VerdictBand, "good" | "mixed" | "hard"]> = [
        [85, "peak",  "good"],
        [72, "solid", "good"],
        [57, "mixed", "mixed"],
        [42, "tight", "hard"],
        [20, "hard",  "hard"],
    ];
    it.each(cases)("score %p → band %p (timing tone group %p)", (score, band, toneGroup) => {
        expect(verdictBand(score)).toBe(band);
        const tone: VerdictTone = verdictTone(band);
        const timingTag = tone === "lift" ? "good" : tone === "neutral" ? "mixed" : "hard";
        expect(timingTag).toBe(toneGroup);
    });
});
