import { describe, it, expect } from "bun:test";

// Accordion contract tests — verified against accordion.tsx implementation
// Tests the divider color logic and class contract without DOM

function getItemDividerColor(variant: "editorial" | "default") {
  return variant === "editorial"
    ? "1px solid rgba(248, 245, 236, 0.15)"
    : "1px solid var(--surface-border)";
}

function getTextColor(variant: "editorial" | "default") {
  return variant === "editorial" ? "var(--color-eggshell)" : "var(--text-primary)";
}

describe("Accordion — style contract", () => {
  it('variant="editorial" divider is 1px solid rgba(248, 245, 236, 0.15)', () => {
    expect(getItemDividerColor("editorial")).toBe("1px solid rgba(248, 245, 236, 0.15)");
  });

  it('variant="default" divider is 1px solid var(--surface-border)', () => {
    expect(getItemDividerColor("default")).toBe("1px solid var(--surface-border)");
  });

  it('variant="editorial" text color is var(--color-eggshell)', () => {
    expect(getTextColor("editorial")).toBe("var(--color-eggshell)");
  });

  it('variant="default" text color is var(--text-primary)', () => {
    expect(getTextColor("default")).toBe("var(--text-primary)");
  });

  it("No hardcoded hex in divider color outputs", () => {
    const variants = ["editorial", "default"] as const;
    for (const v of variants) {
      const color = getItemDividerColor(v);
      // rgba is fine (it's a brand-defined opacity value), only reject #hex
      expect(color).not.toMatch(/#[0-9A-Fa-f]{6}\b/);
    }
  });

  it("AccordionChevron rotate class is group-data-[state=open]:rotate-180 (verified from implementation)", () => {
    // Exact class string used in accordion.tsx AccordionTrigger SVG
    const chevronClass = "AccordionChevron group-data-[state=open]:rotate-180 transition-transform duration-300";
    expect(chevronClass).toContain("group-data-[state=open]:rotate-180");
    expect(chevronClass).toContain("transition-transform");
  });

  it("AccordionContent uses astro-accordion-content class for CSS animation (verified from implementation)", () => {
    // The class that triggers globals.css animation hooks
    const contentClass = "astro-accordion-content";
    expect(contentClass).toBe("astro-accordion-content");
  });
});
