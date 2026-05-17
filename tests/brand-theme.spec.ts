import { test, expect } from "@playwright/test";

/**
 * Brand-theme tests — verifies the brand-pass tokens resolve correctly in
 * both themes, and that the theme-toggle mechanism actually flips them.
 *
 * This is the runtime guarantee that complements the brand-tokens.test.ts
 * Bun unit test (which is a static contract on globals.css):
 *
 *   - Bun test asserts the CSS source declares the right tokens.
 *   - Playwright test asserts the browser resolves them to different
 *     readable values when [data-theme] flips.
 *
 * Catches: any regression where someone breaks theme-awareness (e.g.,
 * accidentally hardcodes a hex in a [data-theme] block, or removes the
 * --lift-accent token entirely).
 */

async function resolveCssVar(page: import("@playwright/test").Page, varName: string): Promise<string> {
    return page.evaluate((name: string) => {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
    }, varName);
}

async function setTheme(page: import("@playwright/test").Page, theme: "light" | "dark") {
    await page.evaluate((t: string) => {
        document.documentElement.setAttribute("data-theme", t);
    }, theme);
    // CSS variables update synchronously; small wait lets layout settle.
    await page.waitForTimeout(50);
}

test.describe("brand tokens — theme-aware resolution", () => {
    test("--lift-accent resolves to different values in light vs dark themes", async ({ page }) => {
        await page.goto("/");

        await setTheme(page, "light");
        const liftLight = await resolveCssVar(page, "--lift-accent");

        await setTheme(page, "dark");
        const liftDark = await resolveCssVar(page, "--lift-accent");

        expect(liftLight, "--lift-accent should resolve to a color in light theme").not.toBe("");
        expect(liftDark, "--lift-accent should resolve to a color in dark theme").not.toBe("");
        // The actual values can be hex, rgb(), or whatever CSS produces, but
        // they must differ — that's the theme-awareness guarantee.
        expect(liftLight).not.toBe(liftDark);
    });

    test("--lift-accent-soft is translucent in both themes", async ({ page }) => {
        await page.goto("/");

        for (const theme of ["light", "dark"] as const) {
            await setTheme(page, theme);
            const soft = await resolveCssVar(page, "--lift-accent-soft");
            expect(soft, `${theme} theme: --lift-accent-soft empty`).not.toBe("");
            // color-mix(... transparent) renders as rgba/rgb with alpha.
            // Accept either format — we only care that it's not opaque.
            const hasAlpha =
                soft.includes("rgba(") ||
                soft.includes("color-mix(") ||
                /\b0\.\d+\b/.test(soft);
            expect(hasAlpha, `${theme} theme: --lift-accent-soft "${soft}" should be translucent`).toBe(true);
        }
    });

    test("toggling data-theme attribute synchronously flips theme tokens", async ({ page }) => {
        await page.goto("/");

        await setTheme(page, "dark");
        const acquaDark = await resolveCssVar(page, "--color-acqua");

        await setTheme(page, "light");
        const acquaLight = await resolveCssVar(page, "--color-acqua");

        // Per the brand book:
        //   dark theme  → pale  #CAF1F0
        //   light theme → deep  #007676
        // Different hex casings render the same — compare lowercased.
        expect(acquaDark.toLowerCase()).not.toBe(acquaLight.toLowerCase());
    });
});
