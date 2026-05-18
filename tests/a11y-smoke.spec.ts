import { test, expect } from "@playwright/test";
import { PUBLIC_ROUTES } from "./routes";

/**
 * Lightweight accessibility checks across every public route.
 *
 * Not a full WCAG audit — promote to @axe-core/playwright when you have a
 * compliance reason. These checks catch the most common regressions:
 *
 *   - <html> has a lang attribute
 *   - Page has at least one <h1>
 *   - Every <img> has an `alt` attribute (decorative or descriptive)
 *   - No tabindex > 0 (breaks keyboard tab order)
 *   - Text-only links have visible text content (or aria-label / img alt)
 *
 * Iterates the public-route registry so adding a new public route
 * automatically extends a11y coverage.
 */

for (const route of PUBLIC_ROUTES) {
    const label = route.label ?? route.path;
    test.describe(`a11y (public) — ${label}`, () => {
        test("html has lang attribute", async ({ page }) => {
            await page.goto(route.path);
            const lang = await page.locator("html").getAttribute("lang");
            expect(lang, `${route.path}: html missing lang attribute`).toBeTruthy();
        });

        test("page has at least one h1", async ({ page }) => {
            await page.goto(route.path);
            const h1Count = await page.locator("h1").count();
            expect(h1Count, `${route.path}: should have ≥1 h1`).toBeGreaterThanOrEqual(1);
        });

        test("every <img> has an alt attribute", async ({ page }) => {
            await page.goto(route.path);
            const imgs = page.locator("img");
            const count = await imgs.count();
            const missing: string[] = [];
            for (let i = 0; i < count; i++) {
                const alt = await imgs.nth(i).getAttribute("alt");
                const src = await imgs.nth(i).getAttribute("src");
                if (alt === null) missing.push(src ?? `<img index ${i}>`);
            }
            expect(missing, `${route.path}: imgs missing alt:\n${missing.join("\n")}`).toEqual([]);
        });

        test("no element uses tabindex > 0", async ({ page }) => {
            await page.goto(route.path);
            const bad = await page.evaluate(() => {
                const els = Array.from(document.querySelectorAll("[tabindex]"));
                return els
                    .map((el) => ({ tag: el.tagName.toLowerCase(), tabindex: el.getAttribute("tabindex") }))
                    .filter((e) => Number(e.tabindex) > 0);
            });
            expect(bad, `${route.path}: tabindex > 0 found:\n${JSON.stringify(bad, null, 2)}`).toEqual([]);
        });

        test("links have an accessible name", async ({ page }) => {
            await page.goto(route.path);
            const empty = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll("a"));
                return links
                    .filter((a) => {
                        const text = (a.textContent ?? "").trim();
                        const hasLabel = a.getAttribute("aria-label") || a.getAttribute("title");
                        const hasImgAlt = Array.from(a.querySelectorAll("img")).some(
                            (img) => img.getAttribute("alt"),
                        );
                        return !text && !hasLabel && !hasImgAlt;
                    })
                    .map((a) => a.outerHTML.slice(0, 120));
            });
            expect(empty, `${route.path}: links missing accessible name:\n${empty.join("\n")}`).toEqual([]);
        });
    });
}
