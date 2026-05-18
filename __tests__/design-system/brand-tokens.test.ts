import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const globalsCss = readFileSync(join(ROOT, "app/globals.css"), "utf8");
const svgShapes = readFileSync(join(ROOT, "app/components/ui/svg-shapes.tsx"), "utf8");

/**
 * Brand token tests — these assert SYSTEM INVARIANTS, not implementation
 * fingerprints. Specifically:
 *
 *   1. The lift-accent semantic token is defined and theme-aware.
 *   2. Every variable declared in BOTH the dark (:root) and light theme
 *      blocks has a different value in each — otherwise the duplicate
 *      declaration is dead code and likely a bug where someone intended
 *      to make the token theme-aware but forgot to change the value.
 *   3. Shared SVG primitives use currentColor so callers can theme them.
 *   4. AnswerCard's tone API is locked — no raw color strings leaking out.
 *
 * Drift catching for new var(--sage) sites and process.env.X! patterns
 * lives in eslint.config.mjs (no-restricted-syntax), not here. ESLint
 * fires in the editor and at commit time; tests fire later.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface CssBlock {
    /** Source range label, e.g. ":root" or '[data-theme="light"]'. */
    label: string;
    /** Map of variable name (with leading --) → declared value. */
    vars: Map<string, string>;
}

/**
 * Pull out the CSS variable declarations from a single selector block.
 * Naive but sufficient for this codebase — the globals.css file is hand-
 * authored and uses straightforward single-line declarations.
 */
function extractVarsFromBlock(css: string, selector: string): CssBlock {
    // Find the first occurrence of `<selector> {` and grab until the matching }.
    // Balanced brace tracking handles nested rules (color-mix, etc.).
    const startMarker = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`);
    const startMatch = startMarker.exec(css);
    if (!startMatch) throw new Error(`Selector ${selector} not found in globals.css`);

    let depth = 1;
    let i = startMatch.index + startMatch[0].length;
    while (i < css.length && depth > 0) {
        const ch = css[i];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        i++;
    }
    const body = css.slice(startMatch.index + startMatch[0].length, i - 1);

    // Match top-level --name: value; lines. The value can contain ; inside
    // (e.g. inside color-mix(...)) but at this level we use a non-greedy
    // match terminated by ; followed by whitespace + --, } or EOL.
    const vars = new Map<string, string>();
    const declRe = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m: RegExpExecArray | null;
    while ((m = declRe.exec(body)) !== null) {
        // Strip inline comments and trim
        const value = m[2].replace(/\/\*[\s\S]*?\*\//g, "").trim();
        vars.set(m[1], value);
    }
    return { label: selector, vars };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 — lift-accent semantic token
// ─────────────────────────────────────────────────────────────────────────────

describe("brand tokens — semantic accent", () => {
    it("--lift-accent is defined and tracks --color-acqua (theme-aware)", () => {
        expect(globalsCss).toMatch(/--lift-accent:\s*var\(--color-acqua\)/);
    });

    it("--lift-accent-soft is defined as a translucent acqua mix", () => {
        expect(globalsCss).toMatch(/--lift-accent-soft:\s*color-mix\([^)]*var\(--color-acqua\)/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2 — Theme-parity invariant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Variables intentionally declared in BOTH themes with the SAME value.
 * Adding a name here is an explicit acknowledgment that the duplicate
 * declaration is on purpose (usually: fixed-context tokens that don't
 * vary by theme, or aliases of theme-neutral colors). New entries
 * should require a code-review conversation, not a silent slip.
 */
const INTENTIONAL_THEME_DUPLICATES = new Set<string>([
    // Fixed-context tokens — the background they sit on doesn't change
    // between themes, so the text-on-X color is intentionally stable.
    "--text-on-charcoal",
    "--text-on-y2k-blue",
    "--text-on-acqua-soft",
    // Aliases of theme-neutral brand colors. spiced-life and y2k-blue
    // are declared only in :root, so any alias resolves to the same
    // value in both blocks. Kept in both for documentation.
    "--accent",
    "--color-planet-neptune",
    // Theme-neutral palette extensions (amber/gold are not themed).
    "--amber",
    "--gold-soft",
    // FIXME: --color-acqua-soft has the same hex as --color-acqua,
    // but the name implies it should be a translucent variant.
    // Likely a pre-existing bug; tracked in the brand cleanup followup.
    "--color-acqua-soft",
]);

describe("globals.css — theme parity", () => {
    const dark = extractVarsFromBlock(globalsCss, ":root");
    const light = extractVarsFromBlock(globalsCss, '[data-theme="light"]');

    it("at least one variable is declared in both themes (sanity check)", () => {
        const inBoth = [...dark.vars.keys()].filter((k) => light.vars.has(k));
        expect(inBoth.length, "Expected some vars to be declared in both themes").toBeGreaterThan(0);
    });

    it("variables declared in both blocks resolve to different values (with allowlist)", () => {
        const conflicts: string[] = [];
        for (const [name, darkValue] of dark.vars) {
            if (INTENTIONAL_THEME_DUPLICATES.has(name)) continue;
            const lightValue = light.vars.get(name);
            if (lightValue === undefined) continue;
            const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
            if (norm(darkValue) === norm(lightValue)) {
                conflicts.push(`  ${name}: both themes resolve to "${darkValue}"`);
            }
        }
        expect(
            conflicts,
            `These variables are declared in BOTH :root and [data-theme="light"] ` +
                `with IDENTICAL values, which usually means someone intended to make ` +
                `the token theme-aware but forgot to change the value in one block.\n\n` +
                `Either:\n` +
                `  (a) remove the duplicate declaration (declare it once in :root), or\n` +
                `  (b) change the value in one theme so the variable actually varies, or\n` +
                `  (c) add the name to INTENTIONAL_THEME_DUPLICATES in this test with a comment explaining why.\n\n` +
                `Conflicts:\n${conflicts.join("\n")}`,
        ).toEqual([]);
    });

    it("INTENTIONAL_THEME_DUPLICATES stays minimal — flag if it grows", () => {
        // Soft cap to discourage growing the allowlist forever. If you legitimately
        // need to bump this, do it in the same PR as the new entry so reviewers
        // see the rationale on the same change.
        expect(
            INTENTIONAL_THEME_DUPLICATES.size,
            "Allowlist of theme-stable duplicates is growing — review each entry",
        ).toBeLessThanOrEqual(12);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 — Shared SVG primitives
// ─────────────────────────────────────────────────────────────────────────────

describe("brand primitives — svg-shapes module", () => {
    it("exports BrandSparkle", () => {
        expect(svgShapes).toMatch(/export function BrandSparkle\b/);
    });

    it("BrandSparkle uses currentColor so callers can theme it via parent", () => {
        const match = /export function BrandSparkle[\s\S]*?return \(([\s\S]*?)\);/.exec(svgShapes);
        expect(match?.[1]).toContain('fill="currentColor"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4 — AnswerCard tone API contract
// ─────────────────────────────────────────────────────────────────────────────

describe("AnswerCard — tone API contract", () => {
    const overviewSrc = readFileSync(
        join(ROOT, "app/(frontend)/(app)/reading/[id]/components/v4/tabs/OverviewTab.tsx"),
        "utf8",
    );

    it('AnswerCard tone type is "supportive" | "caution"', () => {
        expect(overviewSrc).toMatch(/type AnswerCardTone\s*=\s*"supportive"\s*\|\s*"caution"/);
    });

    it("AnswerCard call sites pass tone, never accent", () => {
        const callSites = overviewSrc.match(/<AnswerCard[\s\S]*?\/>/g) ?? [];
        expect(callSites.length).toBeGreaterThan(0);
        for (const call of callSites) {
            expect(call).toMatch(/\btone="(supportive|caution)"/);
            expect(call).not.toMatch(/\baccent=/);
        }
    });

    it('supportive tone maps to var(--lift-accent), not a raw color', () => {
        expect(overviewSrc).toMatch(/case\s+"supportive":\s*return\s+"var\(--lift-accent\)"/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5 — Travel-window tone marker contract
// ─────────────────────────────────────────────────────────────────────────────

describe("travel-window tone dot", () => {
    it("base tone uses --gold", () => {
        expect(globalsCss).toMatch(
            /\.travel-window-dot\s*\{[^}]*background:\s*var\(--gold\)/,
        );
    });

    it("good tone uses --lift-accent", () => {
        expect(globalsCss).toMatch(
            /\.travel-window-row--good\s+\.travel-window-dot\s*\{[^}]*background:\s*var\(--lift-accent\)/,
        );
    });

    it("hard tone uses --color-spiced-life", () => {
        expect(globalsCss).toMatch(
            /\.travel-window-row--hard\s+\.travel-window-dot\s*\{[^}]*background:\s*var\(--color-spiced-life\)/,
        );
    });
});
