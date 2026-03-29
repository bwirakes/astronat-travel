# Prompt 18 — Chart Wheel (AstroChart SVG)

**Phase:** 1 | **Priority:** P1

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prompts/13-shared-components.md`** — Uses `Pill` shared component.
4. **`app/api/natal/`** — Existing natal chart API endpoint — this is the data source.
5. **`app/chart/page.tsx`** — Existing chart page with planet table to enhance.

---

## What to Build

### Step 1 — Install AstroChart

```bash
bun add astrochart.js
```

---

### Step 2 — `app/components/ChartWheel.tsx`

A reusable SVG chart wheel component wrapping the `astrochart.js` library.

```tsx
"use client";
import { useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────

interface NatalPlanetData {
  sun: { longitude: number };
  moon: { longitude: number };
  mercury: { longitude: number };
  venus: { longitude: number };
  mars: { longitude: number };
  jupiter: { longitude: number };
  saturn: { longitude: number };
  uranus: { longitude: number };
  neptune: { longitude: number };
  pluto: { longitude: number };
  chiron?: { longitude: number }; // optional — include if available
  houses: number[]; // array of 12 house cusp degrees
}

// ── Data adapter: our API format → AstroChart format ─────────

function toAstroChartFormat(natal: NatalPlanetData) {
  const planets: Record<string, number[]> = {
    Sun: [natal.sun.longitude],
    Moon: [natal.moon.longitude],
    Mercury: [natal.mercury.longitude],
    Venus: [natal.venus.longitude],
    Mars: [natal.mars.longitude],
    Jupiter: [natal.jupiter.longitude],
    Saturn: [natal.saturn.longitude],
    Uranus: [natal.uranus.longitude],
    Neptune: [natal.neptune.longitude],
    Pluto: [natal.pluto.longitude],
  };
  // Add Chiron if available
  if (natal.chiron) {
    planets["Chiron"] = [natal.chiron.longitude];
  }
  return { planets, cusps: natal.houses };
}

// ── Inline CSS variable resolver ─────────────────────────────
// AstroChart needs hex values — read from computed styles at render time

function resolveToken(token: string): string {
  if (typeof window === "undefined") return "#ffffff";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || "#ffffff";
}

// ── ChartWheel Component ──────────────────────────────────────

export function ChartWheel({ natal, size = 500 }: { natal: NatalPlanetData; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`astronat-wheel-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    import("astrochart.js").then(({ Chart }) => {
      const chart = new Chart(idRef.current, size, size, {
        // ── Brand customization ──────────────────────────────
        COLOR_BACKGROUND: "transparent",
        COLOR_CIRCLE: resolveToken("--surface-border"),
        COLOR_LINES: resolveToken("--surface-border"),
        COLOR_SIGNS: resolveToken("--text-secondary"),
        COLOR_HOUSE_NUMBERS: resolveToken("--text-tertiary"),
        COLOR_POINTS: resolveToken("--text-primary"),
        FONT_GENERAL: "var(--font-mono)",
        // ── Planet colors → brand tokens ─────────────────────
        PLANETS_COLOR: {
          Sun:     resolveToken("--gold"),
          Moon:    resolveToken("--color-acqua"),
          Mercury: resolveToken("--color-y2k-blue"),
          Venus:   resolveToken("--color-spiced-life"),
          Mars:    resolveToken("--color-planet-mars"),
          Jupiter: resolveToken("--sage"),
          Saturn:  resolveToken("--text-tertiary"),
          Uranus:  resolveToken("--color-y2k-blue"),
          Neptune: resolveToken("--color-acqua"),
          Pluto:   resolveToken("--color-planet-mars"),
          Chiron:  resolveToken("--text-secondary"),
        },
      });

      chart.radix(toAstroChartFormat(natal));
    });
  }, [natal, size]);

  return (
    <div
      id={idRef.current}
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: size,
        aspectRatio: "1 / 1",
        margin: "0 auto",
      }}
    />
  );
}
```

> **Key notes:**
> - `import("astrochart.js")` is dynamic to avoid SSR crash (chart uses DOM).
> - `resolveToken` reads computed CSS variables at runtime so brand tokens work correctly inside the SVG.
> - Unique ID per instance avoids conflicts if multiple wheels are on the same page.
> - `Chiron` is included if the natal API returns it — gracefully omitted if not.

---

### Step 3 — Update `app/chart/page.tsx`

Replace the existing static mockup with:

1. **Pill tab switcher** — three tabs: `WHEEL | PLANETS | ASPECTS`
2. **WHEEL tab** — `<ChartWheel natal={natalData} size={500} />`
3. **PLANETS tab** — existing planet table (already built)
4. **ASPECTS tab** — rendered from `radix.aspects()` output

**Tab state:**
```tsx
const [tab, setTab] = useState<'wheel' | 'planets' | 'aspects'>('wheel');
```

**Tab switcher:**
```tsx
<div style={{ display: 'flex', gap: '0.25rem', marginBottom: 'var(--space-lg)' }}>
  {(['wheel', 'planets', 'aspects'] as const).map(t => (
    <button
      key={t}
      onClick={() => setTab(t)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)',
        border: '1px solid var(--surface-border)',
        background: tab === t ? 'var(--color-y2k-blue)' : 'transparent',
        color: tab === t ? 'white' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >{t}</button>
  ))}
</div>
```

**ASPECTS tab rendering:**
```tsx
const ASPECT_DOT_COLORS: Record<string, string> = {
  Trine: 'var(--sage)',
  Sextile: 'var(--sage)',
  Conjunction: 'var(--color-y2k-blue)',
  Opposition: 'var(--color-planet-mars)',
  Square: 'var(--color-spiced-life)',
};
```

---

### Step 4 — Demo Mode

Support `?demo=true`:
```ts
const MOCK_NATAL: NatalPlanetData = {
  sun: { longitude: 143 },
  moon: { longitude: 225 },
  mercury: { longitude: 156 },
  venus: { longitude: 108 },
  mars: { longitude: 280 },
  jupiter: { longitude: 255 },
  saturn: { longitude: 335 },
  uranus: { longitude: 295 },
  neptune: { longitude: 282 },
  pluto: { longitude: 219 },
  chiron: { longitude: 190 },
  houses: [296, 350, 30, 56, 75, 94, 116, 170, 210, 236, 255, 274],
};
```

---

## Design Checklist

- [ ] `ChartWheel` is in `app/components/ChartWheel.tsx` — component-based, reusable
- [ ] Dynamic import of `astrochart.js` (no SSR crash)
- [ ] All colors resolved from CSS tokens at runtime (dark/light mode responsive)
- [ ] Chiron included with graceful fallback if missing
- [ ] `/chart` has WHEEL | PLANETS | ASPECTS tab switcher
- [ ] Pill tab switcher uses `var(--font-mono)`, `var(--radius-full)`, `var(--color-y2k-blue)` for active
- [ ] SVG wheel is responsive: `width: 100%; aspect-ratio: 1/1; max-width: 500px`
- [ ] `?demo=true` supported
- [ ] No hardcoded colors or fonts
