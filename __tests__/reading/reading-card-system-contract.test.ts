import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

describe("reading card system contract", () => {
    const shellCss = read("app/(frontend)/(app)/reading/[id]/components/v4/reading-shell.css");
    const readingCopy = read("app/(frontend)/(app)/reading/[id]/components/shared/ReadingCopy.tsx");
    const tonePill = read("app/(frontend)/(app)/reading/[id]/components/shared/ReadingTonePill.tsx");

    it("defines route-scoped card tokens and reusable card classes", () => {
        for (const token of [
            "--reading-card-bg",
            "--reading-card-bg-strong",
            "--reading-card-border",
            "--reading-card-border-accent",
            "--reading-card-shadow",
            "--reading-chip-acqua",
            "--reading-chip-spiced",
        ]) {
            expect(shellCss).toContain(token);
        }

        expect(shellCss).toContain(".reading-card");
        expect(shellCss).toContain(".reading-card--strong");
        expect(shellCss).toContain(".reading-card--accent");
        expect(shellCss).toContain(".reading-card__top-rule");
    });

    it('ReadingGuideRows surface="cards" uses shared reading-card tokens', () => {
        expect(readingCopy).toContain('surface?: "ledger" | "cards"');
        expect(readingCopy).toContain("var(--reading-card-bg");
        expect(readingCopy).toContain("var(--reading-card-shadow");
        expect(readingCopy).toContain("var(--reading-card-border-accent");
    });

    it("ReadingTonePill maps supported tones to route-safe tokens", () => {
        for (const tone of ["blue", "acqua", "spiced", "gold", "neutral"]) {
            expect(tonePill).toContain(tone);
        }

        expect(tonePill).toContain("var(--reading-chip-acqua)");
        expect(tonePill).toContain("var(--reading-chip-spiced)");
        expect(tonePill).toContain("var(--color-charcoal)");
    });

    it("Academy/Learn footer is not rendered by reading experiences", () => {
        const solo = read("app/(frontend)/(app)/reading/[id]/components/v4/HundredOneReadingView.tsx");
        const couples = read("app/(frontend)/(app)/reading/[id]/components/couples/CouplesReadingView.tsx");

        expect(solo).not.toContain("LearnFooter");
        expect(couples).not.toContain("LearnFooter");
    });

    it("NextTabNav rejects stale bridge copy that does not match the next tab", () => {
        const nextTabNav = read("app/(frontend)/(app)/reading/[id]/components/v4/NextTabNav.tsx");

        expect(nextTabNav).toContain("bridgeMatchesNextTab");
        expect(nextTabNav).toContain("nextTab.fallbackBridge");
        expect(nextTabNav).toContain('bridgeTerms: ["geography", "map", "place", "world", "line"]');
        expect(nextTabNav).toContain('bridgeTerms: ["timing", "timeline", "transit", "window", "date"]');
    });
});
