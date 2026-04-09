# AI Implementation Prompts: Ultimate Reading Experience
## Sequential Build Plan — `app/reading/[id]`

These prompts are designed to be executed sequentially by an AI engineer. Each prompt specifies a **role**, the **exact files to read before writing any code**, a **reuse-first policy** for shared components, and precise **Astro-Brand style rules** derived from `astro-design/SKILL.md`.

> [!IMPORTANT]
> **Run Prompt 0 first.** Before touching `app/reading/[id]`, complete the design system foundation audit in `docs/design-system/component-audit-prompt.md`. That prompt extracts shared Shadcn primitives that ALL reading page prompts depend on:
> - `app/components/ui/accordion.tsx`
> - `app/components/ui/planet-hover-card.tsx`
> - `app/components/ui/astro-pill.tsx`
> - `app/components/ui/section-header.tsx`
> - `app/components/ui/astro-loader.tsx`
> - `app/lib/astro-wording.ts`
>
> Do not begin Prompt 1 until `npx tsc --noEmit` passes on those files.

---

## Prerequisites (Read Before Any Prompt)

Before running any prompt, the AI engineer must read the following files in full:

1. `docs/design-system/component-audit-prompt.md` — the Prompt 0 that must already be complete
2. `app/mock-reading-design/page.tsx` — the GSAP shell to migrate
3. `app/reading/[id]/page.tsx` — the production page being replaced
4. `app/globals.css` — the single source of truth for all CSS tokens
5. `app/mock-reading-design/components/PlanetaryShiftStory.tsx` — layout reference
6. `app/mock-reading-design/components/FinalReportSummary.tsx` — layout reference
7. `app/lib/house-matrix.ts` — source types: `HouseScore`, `HouseMatrixResult`
8. `app/lib/astro-wording.ts` — `PLANET_DOMAINS`, `HOUSE_DOMAINS`, `getOrdinal` (created in Prompt 0)

**Component inventory — these are the ONLY approved building blocks. Do not create new ones:**

| Component | Import path | What it does |
|---|---|---|
| `ScoreRing` | `@/app/components/ScoreRing` | Circular score meter |
| `HouseMatrixCard` | `@/app/components/HouseMatrixCard` | Full 12-house data table |
| `AcgLinesCard` | `@/app/components/AcgLinesCard` | Geographic line list |
| `ActiveTransitsCard` | `@/app/components/ActiveTransitsCard` | Transit windows |
| `VerdictCard` | `@/app/components/VerdictCard` | Headline verdict |
| `Navbar` | `@/app/components/Navbar` | Global nav |
| `Accordion` | `@/app/components/ui/accordion` | ✨ NEW from Prompt 0 |
| `PlanetHoverCard` | `@/app/components/ui/planet-hover-card` | ✨ NEW from Prompt 0 |
| `AstroPill` | `@/app/components/ui/astro-pill` | ✨ NEW from Prompt 0 |
| `SectionHeader` | `@/app/components/ui/section-header` | ✨ NEW from Prompt 0 |
| `AstroLoader` | `@/app/components/ui/astro-loader` | ✨ NEW from Prompt 0 |

---

## Prompt 1 — Shell Migration & Editorial Loader

**Role:** You are a senior Frontend Engineer responsible for the `app/reading/[id]` route. Your job is to replace the generic layout shell with the editorial GSAP scrollytelling container. You do not touch business logic, Supabase fetches, or data-display components. You only change the layout wrapper.

**Task:**

Read `app/mock-reading-design/page.tsx` and `app/reading/[id]/page.tsx`.

Rewrite `app/reading/[id]/page.tsx` as follows:

1. **Remove** the `<DashboardLayout>` import and wrapper.
2. **Copy** the `snap-y snap-proximity` scroll container, `isDark` MutationObserver theme listener, and fixed-background layer from the mockup page.
3. **Keep** the existing Supabase `fetchReading()` and state mapping logic exactly as written.
4. **Replace** the generic `<Loader2>` loading state with an editorial full-screen loader:
   - Background: `var(--color-black)` full viewport
   - Centered: `<img src="/avatar/saturn-monogram.svg" />` at `width: 80px`
   - Apply CSS `animation: spin 3s linear infinite`
   - Below it: `<span>` in `var(--font-mono)`, `font-size: 0.6rem`, `letter-spacing: 0.2em`, `text-transform: uppercase`, text: `"Computing Chart Matrix..."`
5. **Wire** the `reading` state as props into the four child scroll section placeholders: `<PlanetaryShiftStory>`, `<GeographicACGMapLines>`, `<FinalReportSummary>`.

**Style rules:**
- Use `var(--color-eggshell)` / `var(--color-charcoal)` for `isDark` color switching — never hardcode hex.
- No `<DashboardLayout>`. No `boxShadow`. No generic `rounded-lg`.

**Evaluation tests to write alongside:**

Create `__tests__/reading/reading-page.test.tsx`:
```
✓ Renders saturn-monogram SVG during loading state, not Loader2
✓ Does not render DashboardLayout at any point
✓ Applies snap-y snap-proximity to the root container
✓ demo=true resolves from MOCK_READING_DETAILS, skips Supabase call
✓ Skip button is visible when activeView does not start with 'report'
```

---

## Prompt 2 — Dynamic Planetary Shift Scrollytelling

**Role:** You are a Frontend Engineer specialising in data-driven animation. You understand both the `house-matrix.ts` scoring engine and the GSAP/IntersectionObserver pattern. Your goal is to make the planet story cards reflect real relocated chart data rather than static mock planets.

**Task:**

Read `app/mock-reading-design/components/PlanetaryShiftStory.tsx` and `app/lib/house-matrix.ts` (focus on the `HouseScore` type).

Create `app/reading/[id]/components/PlanetaryShiftStory.tsx` with the following changes:

1. **Accept props:**
   ```typescript
   interface PlanetaryShiftStoryProps {
     houses: HouseScore[];
     destination: string;
   }
   ```
2. **Derive narrative houses** using this exact logic:
   ```typescript
   const narrativeHouses = [...houses]
     .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
     .slice(0, 4)
     .map((h, i) => ({ ...h, narrativeIndex: i }));
   ```
3. **Map card content from `HouseScore` fields:**
   - **Card title:** `h.sphere` (e.g., "Career & Reputation") in `var(--font-primary)`, `font-size: clamp(2rem, 5vw, 4rem)`, `uppercase`
   - **House number pill:** `H{h.house}` — `var(--font-mono)`, `0.6rem`, `border: 1px solid currentColor`, `border-radius: 20px`
   - **Score tag:** `{h.score}/100` — `var(--font-mono)`, `0.6rem`, fill color from `barColor(h.score)` logic (copy from `HouseMatrixCard`)
   - **Body text:** `h.rulerPlanet in {h.relocatedSign} · {h.rulerCondition}` — `var(--font-body)`, `1rem`
   - **SLOOP SCRIPT overlay:** `h.rulerPlanet.charAt(0)` — `var(--font-display-alt-2)`, `font-size: clamp(12rem, 25vw, 18rem)`, `opacity: 0.85`, `color: var(--color-y2k-blue)`, `pointer-events: none`

4. **Color-block rhythm** (strictly via CSS variables, zero hardcoded hex):
   - `narrativeIndex 0` → `background: var(--color-eggshell)`, `color: var(--color-charcoal)`
   - `narrativeIndex 1` → `background: var(--color-charcoal)`, `color: var(--color-eggshell)`
   - `narrativeIndex 2` → `background: var(--color-black)`, `color: var(--color-eggshell)`
   - `narrativeIndex 3` → `background: var(--color-charcoal)`, `color: var(--color-eggshell)`

5. **Do not** import or recreate `HouseMatrixCard`. This is storytelling only — individual house insights, not the full table.

**Style rules:**
- Card shape: `border-radius: var(--shape-asymmetric-md)` — no `rounded-lg`
- `--font-primary` for headlines, `--font-body` for body, `--font-mono` for all micro labels
- Progress pill tag at top-right: `"1 OF 4"`, `"2 OF 4"` using `var(--font-mono)`, `border: 1px solid currentColor`, `border-radius: 20px`

**Evaluation tests to write alongside:**

Create `__tests__/reading/PlanetaryShiftStory.test.tsx`:
```
✓ Renders ≤ 4 cards from a 12-house HouseScore[] input
✓ Houses are sorted by Math.abs(score - 50) descending
✓ Card 0 has backgroundColor matching var(--color-eggshell)
✓ Card 1 has backgroundColor matching var(--color-charcoal)
✓ Each card's SLOOP SCRIPT span content === h.rulerPlanet.charAt(0)
✓ Does not crash when houses array has 0 or 1 entries
✓ Progress pill shows "1 OF N" correctly
```

---

## Prompt 3 — Brutalist Final Verdict Section

**Role:** You are a Frontend Engineer and design systems specialist. You are responsible for the final data-reveal section of the reading page. Your job is not to write new data components — the shared library already has those. Your primary reference for layout and writing patterns is `app/chart/ChartClient.tsx`, which established the editorial vocabulary, accordion pattern, and hover interaction model for this application. You must port those same patterns into the reading verdict layout.

**Before writing any code, read these files:**
1. `app/mock-reading-design/components/FinalReportSummary.tsx` — layout skeleton reference
2. `app/chart/ChartClient.tsx` — for `PLANET_DOMAINS`, `HOUSE_DOMAINS`, `PlanetHover`, Radix Accordion implementation, and the editorial `2px solid var(--text-primary)` section header pattern

---

**Task:**

Create `app/reading/[id]/components/FinalReportSummary.tsx`. Accept the live reading data:

```typescript
interface FinalReportSummaryProps {
  reading: {
    destination: string;
    macroScore: number;
    macroVerdict: string;
    houses: HouseScore[];
    transitWindows: any[];
    planetaryLines: any[];
  };
}
```

---

**Step A — Copy & Extend the Wording Dictionaries from `ChartClient.tsx`**

`ChartClient.tsx` already defined `PLANET_DOMAINS` and `HOUSE_DOMAINS`. Do NOT rewrite them — import or copy them into a shared utility file at `app/lib/astro-wording.ts` so both the chart and reading pages use the same source of truth:

```typescript
// app/lib/astro-wording.ts
export const PLANET_DOMAINS: Record<string, string> = {
  "Sun": "YOUR IDENTITY AND WHERE YOU SHINE",
  "Moon": "YOUR BODY AND EMOTIONS",
  "Mercury": "HOW AND WHERE YOU COMMUNICATE",
  "Venus": "HOW AND WHERE YOU CONNECT",
  "Mars": "HOW AND WHERE YOU TAKE ACTION",
  "Jupiter": "HOW AND WHERE YOU CREATE ABUNDANCE",
  "Saturn": "HOW AND WHERE YOU CREATE BOUNDARIES",
  "Uranus": "HOW AND WHERE YOU INNOVATE AND DISRUPT",
  "Neptune": "HOW AND WHERE YOU USE YOUR IMAGINATION",
  "Pluto": "HOW AND WHERE YOU HOLD SECRET POWER",
};

export const HOUSE_DOMAINS: Record<number, string> = {
  1: "self, appearance, vitality, and life force",
  2: "assets, resources, and talents",
  3: "communication, daily rituals, siblings, and extended family",
  4: "parents, caregivers, foundations, and home",
  5: "pleasure, romance, creative energy, and children",
  6: "work, health, and pets",
  7: "committed partnerships",
  8: "death, mental health, and other people's resources",
  9: "travel, education, publishing, religion, astrology, and philosophy",
  10: "career and public roles",
  11: "community, friends, and good fortune",
  12: "sorrow, loss, daemon, and hidden life",
};

export const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
```

Then, update `app/chart/ChartClient.tsx` to import from `@/app/lib/astro-wording` instead of defining these inline.

---

**Step B — Add a `RelocatedPlanetHover` Component**

Mirror the `PlanetHover` component from `ChartClient.tsx`, but adapted for relocated context. Add it locally to `FinalReportSummary.tsx`:

```tsx
// Shows the RELOCATED house context for a planet on hover
function RelocatedPlanetHover({ planet, relocatedHouse, relocatedSign, rulerCondition, children }: {
  planet: string;
  relocatedHouse: number;
  relocatedSign: string;
  rulerCondition: string;
  children: React.ReactNode;
}) {
  const pColor = PLANET_COLORS[planet] || "var(--color-y2k-blue)";
  return (
    <HoverCard.Root openDelay={200} closeDelay={150}>
      <HoverCard.Trigger asChild>
        <span style={{ cursor: "zoom-in", borderBottom: `1px dashed ${pColor}` }}>{children}</span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content sideOffset={5} style={{
          zIndex: 9999, background: "var(--surface)",
          border: "1px solid var(--surface-border)",
          padding: "var(--space-lg)", width: "300px",
          borderRadius: "var(--radius-sm)",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pColor, marginBottom: "0.5rem" }}>
            {PLANET_DOMAINS[planet] || planet}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>
            {planet} in {relocatedSign} in the {getOrdinal(relocatedHouse)} House of {HOUSE_DOMAINS[relocatedHouse] || "life"}.
            <br /><span style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>{rulerCondition} dignity at this location.</span>
          </p>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
```

---

**Step C — House Breakdown: Radix Accordion (mirrors ChartClient.tsx)**

Do **NOT** use an expanding `<div>` or the existing but already-bordered `HouseMatrixCard` for the house narrative list. Instead, implement a **Radix Accordion** that matches the `ChartClient.tsx` planet accordion pattern exactly:

```tsx
import * as Accordion from "@radix-ui/react-accordion";

// Inside FinalReportSummary, after the ScoreRing hero:
<div style={{ marginBottom: "var(--space-3xl)" }}>
  <h3 style={{
    fontFamily: "var(--font-primary)", fontSize: "1.2rem",
    letterSpacing: "0.05em", margin: "0 0 1.5rem 0",
    paddingBottom: "1rem",
    borderBottom: "2px solid var(--color-eggshell)", // editorial header rule from ChartClient
    color: "var(--color-eggshell)",
    textTransform: "uppercase"
  }}>
    HOUSE SHIFTS IN {reading.destination.toUpperCase()}
  </h3>

  <Accordion.Root type="single" collapsible className="w-full">
    {reading.houses.map((h) => (
      <Accordion.Item
        key={h.house}
        value={String(h.house)}
        style={{ borderBottom: "1px solid rgba(248,245,236,0.15)" }} // var(--color-eggshell) at 15% opacity
      >
        <Accordion.Header className="m-0">
          <Accordion.Trigger className="AccordionTrigger astro-trigger group" style={{ padding: "1rem 0", color: "var(--color-eggshell)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
              {/* House number — BETTER DAYS ghost text */}
              <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.5rem", color: "var(--color-eggshell)", opacity: 0.3, width: "2.5rem" }}>
                {String(h.house).padStart(2, "0")}
              </span>
              {/* Sphere name */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.02em" }}>
                {h.sphere.toUpperCase()}
              </span>
              {/* Right: sign + score tag */}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-tertiary)", marginLeft: "auto", marginRight: "1.5rem" }}>
                <RelocatedPlanetHover planet={h.rulerPlanet} relocatedHouse={h.house} relocatedSign={h.relocatedSign} rulerCondition={h.rulerCondition}>
                  {h.rulerPlanet}
                </RelocatedPlanetHover>
                {" "}in {h.relocatedSign} · {h.score}/100
              </span>
            </div>
            {/* Chevron — same as ChartClient.tsx */}
            <svg className="AccordionChevron group-data-[state=open]:rotate-180 transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ opacity: 0.4 }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="AccordionContent astro-content">
          <div style={{ padding: "0 0 2rem 3.25rem", maxWidth: "700px" }}>
            {/* Domain copy — from HOUSE_DOMAINS and PLANET_DOMAINS */}
            <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", color: PLANET_COLORS[h.rulerPlanet] || "var(--color-y2k-blue)", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>
              {PLANET_DOMAINS[h.rulerPlanet] || h.rulerPlanet}
            </h4>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.6, color: "var(--color-eggshell)", opacity: 0.8, margin: "0 0 0.75rem 0" }}>
              {h.rulerPlanet} in {h.relocatedSign} in the {getOrdinal(h.house)} House of{" "}
              {HOUSE_DOMAINS[h.house] || "life"}.
            </p>
            {/* Score breakdown chips — reused verbatim from HouseMatrixCard */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
              {Object.entries(h.breakdown)
                .filter(([, v]) => (v as number) !== 0)
                .map(([key, val]) => (
                  <span key={key} style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                    border: "1px solid var(--surface-border)", borderRadius: "20px",
                    padding: "0.15rem 0.5rem",
                    color: (val as number) > 0 ? "var(--sage)" : "var(--color-spiced-life)"
                  }}>
                    {key} {(val as number) > 0 ? "+" : ""}{val as number}
                  </span>
              ))}
            </div>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    ))}
  </Accordion.Root>
</div>
```

The Radix Accordion CSS keyframe animations (`slideDown`, `slideUp`, `astro-trigger`, `astro-content`) are already defined in `ChartClient.tsx`'s inline `<style jsx global>` block. Extract them into `app/globals.css` as a one-time move so both pages share them.

---

**Step D — Compose Data Components**

After the accordion, render the remaining data components in the 12-column editorial grid (same column structure as the mock):

```tsx
// Hero score
<ScoreRing score={reading.macroScore} verdict={getVerdict(reading.macroScore)} />

// Geographic lines — wrapped in theme-dark
<div className="theme-dark">
  <AcgLinesCard planetLines={reading.planetaryLines} natalPlanets={[]} birthCity="" destination={reading.destination} />
</div>

// Transit timing — wrapped in theme-dark
<div className="theme-dark">
  <ActiveTransitsCard transits={reading.transitWindows} travelDate={reading.travelDate} />
</div>
```

---

**BAN LIST — the following are forbidden in this file:**
- ❌ `box-shadow` of any kind
- ❌ `border-radius: 12px` or Tailwind `rounded-lg`, `rounded-xl`
- ❌ Any hardcoded hex color value
- ❌ A new `<div style={{ background: 'var(--surface)' }}>` card wrapper around the shared components
- ❌ Importing `DashboardLayout`
- ❌ Redefining `PLANET_DOMAINS`, `HOUSE_DOMAINS`, or `getOrdinal` — they must import from `@/app/lib/astro-wording`
- ❌ Using `useState` for accordion open/close — Radix handles its own state

**Section header rule (from `ChartClient.tsx` pattern):**
- `borderBottom: "2px solid var(--color-eggshell)"` on `<h3>` section labels
- `paddingBottom: "1rem"`, `marginBottom: "1.5rem"`
- `var(--font-primary)`, `font-size: 1.2rem`, `letter-spacing: 0.05em`, `text-transform: uppercase`

---

**Evaluation tests to write alongside:**

Create `__tests__/reading/FinalReportSummary.test.tsx`:
```
✓ Renders <ScoreRing> with correct macroScore prop
✓ Renders Radix Accordion with one item per house in reading.houses
✓ Each accordion trigger displays h.sphere, h.rulerPlanet, and h.score
✓ Opened accordion content renders HOUSE_DOMAINS text for that house number
✓ RelocatedPlanetHover renders on planet name elements
✓ Renders <AcgLinesCard> with planetaryLines from reading prop
✓ Renders <ActiveTransitsCard> with transitWindows from reading prop
✓ Does not define PLANET_DOMAINS or HOUSE_DOMAINS locally (must import from astro-wording)
✓ Does not render DashboardLayout
✓ Does not render any element with inline style containing 'box-shadow'
✓ Does not render any element with inline borderRadius of 12px or greater
```

---

## Prompt 4 — Geographic Map Overlay Panel

**Role:** You are a Frontend Engineer handling the map interlude section. The SVG map background is purely aesthetic and stays as-is. Your job is to overlay a floating data panel that displays the real `reading.planetaryLines` data.

**Task:**

Read `app/mock-reading-design/components/GeographicACGMap.tsx`.

Create `app/reading/[id]/components/GeographicACGMapLines.tsx`. Keep the existing static SVG map background. Add a floating panel as an `<aside>` element positioned at bottom-left of the map section.

**Props:**
```typescript
interface GeographicACGMapLinesProps {
  planetaryLines: Array<{
    planet: string;
    line: string;        // "ASC", "MC", "DSC", "IC"
    distance: string;    // e.g. "42 km"
    tier: string;        // "Strong" | "Moderate" | "Weak"
  }>;
  destination: string;
}
```

**Aside panel spec:**
- `clip-path: var(--cut-sm)` — Y2K chamfered shape, NOT rounded corners
- `background: var(--color-black)`
- `border: 1px solid var(--color-y2k-blue)`
- `padding: var(--space-md)`
- `max-width: 280px`
- `position: absolute`, `bottom: var(--space-xl)`, `left: var(--space-xl)`

**For each planetary line entry:**
- Planet name: `var(--font-body)`, `font-weight: 600`, `0.85rem`
- Line type tag: `var(--font-mono)`, `0.55rem`, `color: var(--color-y2k-blue)` on `background: transparent`, `border: 1px solid var(--color-y2k-blue)`, `border-radius: 20px`
- Distance: `var(--font-mono)`, `0.55rem`, `color: var(--text-tertiary)`
- Tier indicator:
  - `"Strong"` → `color: var(--sage)` (neon green)
  - `"Moderate"` → `color: var(--gold)`
  - `"Weak"` → `color: var(--text-tertiary)`

**Evaluation tests to write alongside:**

Create `__tests__/reading/GeographicACGMapLines.test.tsx`:
```
✓ Renders one row per entry in planetaryLines array
✓ "Strong" tier renders with var(--sage) color token
✓ "Moderate" tier renders with var(--gold) color token
✓ Aside panel has clip-path style (not border-radius for shaping)
✓ No hardcoded hex color values in any inline style
✓ Renders empty state gracefully when planetaryLines is empty
```

---

## Final Build Gate

After all 4 prompts are complete, run the following and fix any failures before marking the work done:

```bash
# TypeScript check
npx tsc --noEmit

# Lint
npx eslint app/reading --ext .tsx,.ts

# Unit tests
npx jest __tests__/reading/ --verbose

# Production build
bun run build
```

> [!CAUTION]
> Do NOT merge to main if any of the above fail. The `bun run build` output must show zero TypeScript errors and zero ESLint warnings in the `app/reading` path.
