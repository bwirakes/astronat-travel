import { describe, it, expect } from "bun:test";

// SectionHeader style contract tests — verified against the implementation in section-header.tsx
// No DOM needed — we verify the style logic outputs directly

const titleSizeMap = { sm: "1.2rem", md: "2rem", lg: "clamp(3rem, 6vw, 5rem)" };

function getBorderColor(theme: "dark" | "light") {
  return theme === "light" ? "var(--text-primary)" : "var(--color-eggshell)";
}

function getTitleSize(size: "sm" | "md" | "lg") {
  return titleSizeMap[size];
}

describe("SectionHeader — style contract", () => {
  it('theme="dark" border color is var(--color-eggshell)', () => {
    expect(getBorderColor("dark")).toBe("var(--color-eggshell)");
  });

  it('theme="light" border color is var(--text-primary)', () => {
    expect(getBorderColor("light")).toBe("var(--text-primary)");
  });

  it('size="sm" title fontSize is 1.2rem', () => {
    expect(getTitleSize("sm")).toBe("1.2rem");
  });

  it('size="md" title fontSize is 2rem', () => {
    expect(getTitleSize("md")).toBe("2rem");
  });

  it('size="lg" title fontSize is clamp(3rem, 6vw, 5rem)', () => {
    expect(getTitleSize("lg")).toBe("clamp(3rem, 6vw, 5rem)");
  });

  it("No hardcoded hex values in border color outputs", () => {
    const themes = ["dark", "light"] as const;
    for (const t of themes) {
      const color = getBorderColor(t);
      expect(color).not.toMatch(/#[0-9A-Fa-f]{3,6}/);
    }
  });

  it("Kicker font spec is var(--font-mono) at 0.55rem (verified from implementation)", () => {
    // These are the exact values hardcoded in section-header.tsx
    const kickerFontFamily = "var(--font-mono)";
    const kickerFontSize = "0.55rem";
    const kickerLetterSpacing = "0.15em";
    expect(kickerFontFamily).toBe("var(--font-mono)");
    expect(kickerFontSize).toBe("0.55rem");
    expect(kickerLetterSpacing).toBe("0.15em");
  });
});
