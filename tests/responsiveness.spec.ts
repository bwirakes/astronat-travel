import { test, expect } from "@playwright/test";

const VIEWPORTS = [
    { name: "Mobile (375px)", width: 375, height: 812 },
    { name: "Tablet (768px)", width: 768, height: 1024 },
    { name: "Desktop (1280px)", width: 1280, height: 800 },
];

for (const viewport of VIEWPORTS) {
    test.describe(viewport.name, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } });

        test("flow page renders without overflow", async ({ page }) => {
            await page.goto("/flow");
            await page.waitForLoadState("networkidle");

            // Page should not have horizontal overflow
            const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
            const windowWidth = viewport.width;
            expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 2); // ±2px tolerance

            // Key heading should be visible
            const heading = page.locator("h2").first();
            await expect(heading).toBeVisible();
        });

        test("form inputs are visible and usable", async ({ page }) => {
            await page.goto("/flow");
            await page.waitForLoadState("networkidle");

            // Name input
            const nameInput = page.locator("input[type='text']").first();
            await expect(nameInput).toBeVisible();
            await nameInput.fill("Test User");

            // Date input
            const dateInput = page.locator("input[type='date']").first();
            await expect(dateInput).toBeVisible();

            // Time input
            const timeInput = page.locator("input[type='time']");
            await expect(timeInput).toBeVisible();
        });

        test("navbar is visible", async ({ page }) => {
            await page.goto("/flow");
            await page.waitForLoadState("networkidle");

            const navbar = page.locator("nav").first();
            await expect(navbar).toBeVisible();
        });

        test("progress indicators render", async ({ page }) => {
            // Progress steps are intentionally hidden on mobile (< 640px) to prevent overflow
            if (viewport.width < 640) {
                test.skip();
                return;
            }
            await page.goto("/flow");
            await page.waitForLoadState("networkidle");

            // At least one progress step label visible
            const labels = page.getByText("Chart");
            await expect(labels.first()).toBeVisible();
        });
    });
}
