/**
 * embed-crane-framework.ts — pulls Nat's HTML reference doc into a TS module
 * the dashboard can render. Scopes the styles to `.crane-framework` so they
 * don't leak to the rest of /geodetic-test.
 *
 *   bun run scripts/embed-crane-framework.ts
 *
 * Output: app/(frontend)/(marketing)/geodetic-test/crane-framework-html.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = "/Users/brandonwirakesuma/Downloads/AstroWeather_Framework_Crane.html";
const OUT = resolve(
    process.cwd(),
    "app/(frontend)/(marketing)/geodetic-test/crane-framework-html.ts",
);
const SCOPE = ".crane-framework";

function extractBetween(html: string, openTag: string, closeTag: string): string {
    const openIdx = html.indexOf(openTag);
    const closeIdx = html.indexOf(closeTag);
    if (openIdx < 0 || closeIdx < 0) throw new Error(`Tags not found: ${openTag} / ${closeTag}`);
    return html.slice(openIdx + openTag.length, closeIdx);
}

/**
 * Prefix every CSS selector with the scope. Body selector is rewritten to the
 * scope itself. Pseudo / at-rules are left untouched.
 */
function scopeStyles(css: string, scope: string): string {
    return css.replace(/([^{}]+)\{([^{}]*)\}/g, (_, rawSelectors: string, body: string) => {
        const selectors = rawSelectors.split(",").map((s) => s.trim()).filter(Boolean);
        const scoped = selectors.map((sel) => {
            if (sel.startsWith("@")) return sel;
            if (sel === ":root") return scope;
            if (sel === "body") return scope;
            if (sel === "*") return `${scope} *`;
            return `${scope} ${sel}`;
        });
        return `${scoped.join(", ")} { ${body.trim()} }`;
    });
}

function main() {
    const raw = readFileSync(SRC, "utf8");
    const stylesRaw = extractBetween(raw, "<style>", "</style>");
    const bodyRaw = extractBetween(raw, "<body>", "</body>");

    const styles = scopeStyles(stylesRaw, SCOPE);
    // Drop the outer h1/subtitle since the page already supplies its own header.
    // Keep everything else.
    const body = bodyRaw.trim();

    const ts = `/**
 * AUTO-GENERATED — do not hand-edit.
 *
 * Source: ${SRC}
 * Generated: ${new Date().toISOString()}
 * Scope: ${SCOPE} (every CSS rule from the source is prefixed with this so it
 *        cannot leak into the rest of /geodetic-test).
 *
 * Regenerate via: bun run scripts/embed-crane-framework.ts
 */

/** Scope class name applied to the container that wraps the embedded HTML. */
export const CRANE_FRAMEWORK_SCOPE = "crane-framework";

/** Scoped CSS string — render inside a <style> tag. */
export const CRANE_FRAMEWORK_STYLES = ${JSON.stringify(styles)};

/** Body HTML to drop inside <div className={CRANE_FRAMEWORK_SCOPE}>…</div>. */
export const CRANE_FRAMEWORK_BODY_HTML = ${JSON.stringify(body)};
`;

    writeFileSync(OUT, ts);
    console.log(`✓ Wrote ${OUT}`);
    console.log(`  styles: ${styles.length} chars`);
    console.log(`  body:   ${body.length} chars`);
}

main();
