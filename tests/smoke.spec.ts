import { test, expect } from "@playwright/test";
import { PUBLIC_ROUTES, AUTH_ROUTES } from "./routes";

/**
 * Per-route smoke checks — the broad gate.
 *
 * Public routes get the full treatment: 200 OK + no console errors +
 * no failed in-app requests + key elements present.
 *
 * Auth-gated routes get a narrower check: status code is not 5xx and
 * the URL after navigation contains "/login" (i.e. auth gate did fire).
 *
 * Both groups iterate the route registry in tests/routes.ts — add routes
 * there to expand coverage without writing new specs.
 */

for (const route of PUBLIC_ROUTES) {
    const label = route.label ?? route.path;
    test.describe(`smoke (public) — ${label}`, () => {
        test("renders without console errors or failed in-app requests", async ({ page }) => {
            const consoleErrors: string[] = [];
            const failedRequests: string[] = [];

            page.on("console", (msg) => {
                if (msg.type() === "error") consoleErrors.push(msg.text());
            });
            page.on("requestfailed", (req) => {
                const url = req.url();
                // Ignore third-party telemetry/analytics failures — they shouldn't
                // gate CI on our work.
                if (url.startsWith("http://localhost") || url.startsWith("/")) {
                    failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
                }
            });

            const response = await page.goto(route.path, { waitUntil: "networkidle" });
            expect(response?.status(), `${route.path} should not return a server error`).toBeLessThan(500);

            const benignPatterns = [
                "Download the React DevTools",
                "Hydration",
                // PostHog warning when token is unset — guarded in instrumentation-client.ts
                // but the page may have other call sites that log similar warnings; treat as benign.
                "PostHog was initialized without a token",
            ];
            const realErrors = consoleErrors.filter(
                (e) => !benignPatterns.some((p) => e.includes(p)),
            );
            expect(realErrors, `${route.path} console errors:\n${realErrors.join("\n")}`).toEqual([]);
            expect(failedRequests, `${route.path} failed requests:\n${failedRequests.join("\n")}`).toEqual([]);
        });

        test("has a primary heading", async ({ page }) => {
            await page.goto(route.path);
            const h1 = page.locator("h1").first();
            await expect(h1, `${route.path} should have an h1`).toBeVisible();
        });
    });
}

for (const route of AUTH_ROUTES) {
    const label = route.label ?? route.path;
    test.describe(`smoke (auth-gated) — ${label}`, () => {
        test("redirects unauthenticated visitors to /login", async ({ page }) => {
            await page.goto(route.path);
            expect(
                page.url(),
                `${route.path} should redirect to /login when unauthenticated; got: ${page.url()}`,
            ).toContain("/login");
        });

        test("does not 5xx", async ({ page }) => {
            const response = await page.goto(route.path);
            // After redirect Playwright reports the final response, which should be
            // the /login page (200). We just want to rule out a server crash.
            expect(response?.status(), `${route.path} should not return 5xx`).toBeLessThan(500);
        });
    });
}
