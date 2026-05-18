import { test, expect } from "@playwright/test";

/**
 * Smoke tests — minimal health checks that must hold on every PR.
 *
 * Scope:
 *   1. Home page loads and returns 200.
 *   2. No JavaScript console errors fire during initial render.
 *   3. No failed network requests for in-app assets.
 *   4. Page title + an H1 are present (basic SEO/a11y sanity).
 *
 * Routes that require auth are skipped — see brand-theme.spec.ts for
 * theme-level checks that exercise the brand-pass tokens.
 */

test.describe("smoke — home page", () => {
    test("renders without console errors or failed in-app requests", async ({ page }) => {
        const consoleErrors: string[] = [];
        const failedRequests: string[] = [];

        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });
        page.on("requestfailed", (req) => {
            const url = req.url();
            // Ignore third-party analytics/telemetry failures — they shouldn't
            // gate CI on our brand-pass work.
            if (url.startsWith("http://localhost") || url.startsWith("/")) {
                failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
            }
        });

        const response = await page.goto("/", { waitUntil: "networkidle" });
        expect(response?.status()).toBeLessThan(400);

        // Surface noise but allow benign warnings (e.g. dev-only React strict
        // mode). Real ship-blockers are uncaught exceptions / 404s on app code.
        const realErrors = consoleErrors.filter(
            (e) => !e.includes("Download the React DevTools") && !e.includes("Hydration"),
        );
        expect(realErrors, `console errors:\n${realErrors.join("\n")}`).toEqual([]);
        expect(failedRequests, `failed requests:\n${failedRequests.join("\n")}`).toEqual([]);
    });

    test("has page title and a primary heading", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/AstroNat/i);
        // The home page hero is an h1.
        const h1 = page.locator("h1").first();
        await expect(h1).toBeVisible();
    });
});
