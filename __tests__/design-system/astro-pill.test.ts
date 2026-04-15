import { describe, it, expect } from "bun:test";
import { pillVariants } from "@/app/components/ui/astro-pill";

// Tests the CVA variant contract directly — no DOM needed
describe("AstroPill — CVA variant contract", () => {
  it('variant="accent" includes bg-[var(--color-y2k-blue)]', () => {
    const cls = pillVariants({ variant: "accent" });
    expect(cls).toContain("bg-[var(--color-y2k-blue)]");
  });

  it('variant="sage" includes text-[var(--sage)] and border-[var(--sage)]', () => {
    const cls = pillVariants({ variant: "sage" });
    expect(cls).toContain("text-[var(--sage)]");
    expect(cls).toContain("border-[var(--sage)]");
  });

  it('shape="cut" includes [clip-path:var(--cut-sm)] and NOT rounded-full', () => {
    const cls = pillVariants({ shape: "cut" });
    expect(cls).toContain("[clip-path:var(--cut-sm)]");
    expect(cls).not.toContain("rounded-full");
  });

  it('shape="pill" includes rounded-full', () => {
    const cls = pillVariants({ shape: "pill" });
    expect(cls).toContain("rounded-full");
  });

  it("No hardcoded hex (#xxxxxx) in any variant className", () => {
    const variants = ["default", "accent", "sage", "gold", "spiced", "ghost"] as const;
    for (const v of variants) {
      const cls = pillVariants({ variant: v });
      expect(cls).not.toMatch(/#[0-9A-Fa-f]{3,6}/);
    }
  });

  it('variant="ghost" uses var(--surface-border) and var(--text-secondary)', () => {
    const cls = pillVariants({ variant: "ghost" });
    expect(cls).toContain("border-[var(--surface-border)]");
    expect(cls).toContain("text-[var(--text-secondary)]");
  });

  it('size="md" includes text-[0.65rem]', () => {
    const cls = pillVariants({ size: "md" });
    expect(cls).toContain("text-[0.65rem]");
  });
});
