import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const globalsCss = readFileSync(join(ROOT, "app/globals.css"), "utf8");
const svgShapes = readFileSync(join(ROOT, "app/components/ui/svg-shapes.tsx"), "utf8");

const READING_TAB_FILES = [
  "app/(frontend)/(app)/reading/[id]/components/v4/tabs/OverviewTab.tsx",
  "app/(frontend)/(app)/reading/[id]/components/v4/tabs/SkyKpiCard.tsx",
  "app/(frontend)/(app)/reading/[id]/components/v4/tabs/PlaceFieldTab.tsx",
  "app/(frontend)/(app)/reading/[id]/components/v4/tabs/TimingTab.tsx",
];

describe("brand tokens — globals.css contract", () => {
  it("defines --lift-accent and points it at --color-acqua so it tracks theme", () => {
    expect(globalsCss).toMatch(/--lift-accent:\s*var\(--color-acqua\)/);
  });

  it("defines --lift-accent-soft as a translucent acqua mix", () => {
    expect(globalsCss).toMatch(/--lift-accent-soft:\s*color-mix\([^)]*var\(--color-acqua\)/);
  });

  it("--color-acqua is theme-aware (different values for :root and [data-theme=\"light\"])", () => {
    const rootAcqua = /:root\s*{[\s\S]*?--color-acqua:\s*(#[0-9A-Fa-f]+)/.exec(globalsCss)?.[1];
    const lightAcqua = /\[data-theme="light"\]\s*{[\s\S]*?--color-acqua:\s*(#[0-9A-Fa-f]+)/.exec(globalsCss)?.[1];
    expect(rootAcqua).toBeTruthy();
    expect(lightAcqua).toBeTruthy();
    expect(rootAcqua?.toLowerCase()).not.toBe(lightAcqua?.toLowerCase());
  });
});

describe("brand primitives — svg-shapes module", () => {
  it("exports BrandSparkle", () => {
    expect(svgShapes).toMatch(/export function BrandSparkle\b/);
  });

  it("BrandSparkle uses currentColor so callers can theme it via parent", () => {
    const match = /export function BrandSparkle[\s\S]*?return \(([\s\S]*?)\);/.exec(svgShapes);
    expect(match?.[1]).toContain('fill="currentColor"');
  });
});

describe("brand pass — regression guards on reading tab files", () => {
  for (const rel of READING_TAB_FILES) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    const file = rel.split("/").pop();

    it(`${file} no longer uses var(--sage) (replaced by --lift-accent)`, () => {
      expect(src).not.toMatch(/var\(--sage(?:-soft)?\)/);
    });

    it(`${file} no longer inlines the deep-acqua color-mix string`, () => {
      // The old inline form that we collapsed into the --lift-accent token.
      // If this reappears it means someone bypassed the token. Regression.
      expect(src).not.toContain(
        "color-mix(in oklab, var(--color-acqua) 40%, var(--text-primary))",
      );
    });
  }
});

describe("AnswerCard — tone API contract", () => {
  const overviewSrc = readFileSync(
    join(ROOT, "app/(frontend)/(app)/reading/[id]/components/v4/tabs/OverviewTab.tsx"),
    "utf8",
  );

  it("AnswerCard accepts tone: \"supportive\" | \"caution\" (not raw accent string)", () => {
    expect(overviewSrc).toMatch(/tone:\s*AnswerCardTone/);
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

  it("supportive tone resolves to var(--lift-accent), not raw acqua", () => {
    // toneAccent helper should map "supportive" → var(--lift-accent)
    expect(overviewSrc).toMatch(/case\s+"supportive":\s*return\s+"var\(--lift-accent\)"/);
  });
});
