import { test, expect } from "@playwright/test";

/**
 * Lightweight accessibility smoke checks for the home page.
 *
 * Not a full WCAG audit — those need axe-core or pa11y, which require
 * extra dependencies. These checks catch the most common regressions:
 *
 *   - Page has a single <h1> (heading hierarchy starts correctly).
 *   - Every <img> has an `alt` attribute (decorative or descriptive).
 *   - Every <a> with no text content has an aria-label or title.
 *   - <html> has a lang attribute.
 *   - No tabindex > 0 (which breaks keyboard tab order).
 *
 * Promote to axe-core when ready by adding `@axe-core/playwright` and
 * gating on rule violations of severity >= "serious".
 */

test.describe("a11y smoke — home page", () => {
    test("html has lang attribute", async ({ page }) => {
        await page.goto("/");
        const lang = await page.locator("html").getAttribute("lang");
        expect(lang, "html element should have a lang attribute").toBeTruthy();
    });

    test("page has exactly one h1", async ({ page }) => {
        await page.goto("/");
        const h1Count = await page.locator("h1").count();
        expect(h1Count, "Page should have exactly one h1 for heading hierarchy").toBe(1);
    });

    test("every <img> has an alt attribute", async ({ page }) => {
        await page.goto("/");
        const imgs = page.locator("img");
        const count = await imgs.count();
        const missing: string[] = [];
        for (let i = 0; i < count; i++) {
            const alt = await imgs.nth(i).getAttribute("alt");
            const src = await imgs.nth(i).getAttribute("src");
            if (alt === null) missing.push(src ?? `<img index ${i}>`);
        }
        expect(missing, `imgs missing alt:\n${missing.join("\n")}`).toEqual([]);
    });

    test("no element uses tabindex > 0 (breaks keyboard tab order)", async ({ page }) => {
        await page.goto("/");
        const bad = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll("[tabindex]"));
            return els
                .map((el) => ({ tag: el.tagName.toLowerCase(), tabindex: el.getAttribute("tabindex") }))
                .filter((e) => Number(e.tabindex) > 0);
        });
        expect(bad, `Elements with tabindex > 0:\n${JSON.stringify(bad, null, 2)}`).toEqual([]);
    });

    test("text-only links have visible text content", async ({ page }) => {
        await page.goto("/");
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
        expect(empty, `Links with no accessible name:\n${empty.join("\n")}`).toEqual([]);
    });
});
