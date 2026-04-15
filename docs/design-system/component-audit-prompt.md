# Prompt 0 — Design System Audit & Shadcn Component Library Foundation

> **This prompt runs BEFORE any implementation prompt in `docs/readings/implementation_prompts.md`.
> Complete this audit and extract the unified components first. Every subsequent prompt depends on the component inventory established here.**

---

## Role

You are a **Design Systems Engineer** with deep familiarity with Shadcn UI, Radix UI primitives, CVA (Class Variance Authority), and the Astro-Brand design system.

Your job is to audit the existing `app/components/` library, identify every component built as a one-off that should be a shared, Shadcn-backed primitive, extract them into `app/components/ui/`, and write the style contract that enforces brand compliance across the entire application.

You are NOT building features yet. You are building the foundation that makes all future features consistent and maintainable.

---

## Read First (Required Context)

Read each of these files in full before writing any code:

| File | Why |
|---|---|
| `app/globals.css` | Single source of truth for all CSS variables — tokens, radii, shapes, colors, fonts |
| `docs/brand/guidelines.md` | Canonical brand identity — tone, palette, shape rules |
| `.agents/skills/astro-design/SKILL.md` | Component authoring rules — shape options, font hierarchy, color composition |
| `components.json` | Shadcn config — confirms `style: "base-nova"`, `cssVariables: true`, aliases |
| `app/components/ui/button.tsx` | The ONLY existing Shadcn primitive — use as the pattern template |
| `app/components/ScoreRing.tsx` | One-off to be evaluated for promotion |
| `app/components/HouseMatrixCard.tsx` | One-off to be evaluated for promotion |
| `app/components/ExpandableCard.tsx` | One-off to be evaluated for promotion |
| `app/components/DashboardLayout.tsx` | One-off to be evaluated for promotion |
| `app/chart/ChartClient.tsx` | Inline accordion + hover card patterns to be extracted |

---

## Step 1 — Audit Existing Components

Scan every file in `app/components/`. For each one, classify it:

| Component | Shadcn Base | Reused Across Pages | Promote to `ui/`? |
|---|---|---|---|
| `ScoreRing.tsx` | None (custom SVG) | ✓ readings, home | Yes — thin wrapper |
| `HouseMatrixCard.tsx` | None (custom table) | ✓ reading, mock-reading | Yes — data table pattern |
| `ExpandableCard.tsx` | → Radix Accordion | ✓ reading, chart | Replace with `ui/accordion.tsx` |
| `DashboardLayout.tsx` | None (layout shell) | ✓ chart, readings, profile | Yes — promote to `ui/layout.tsx` |
| `AcgLinesCard.tsx` | None (data table) | ✓ chart, mock-reading | Yes |
| `ActiveTransitsCard.tsx` | None (data list) | ✓ reading | Yes |
| `VerdictCard.tsx` | None | ✓ reading | Yes |
| `TripScoreCard.tsx` | None | ✓ reading | Yes |
| `Navbar.tsx` | None | ✓ every page | Keep — already clean |
| `PlanetIcon.tsx` | None (SVG switch) | ✓ chart, reading | Keep as utility |
| `SignIcon.tsx` | None (SVG switch) | ✓ chart, reading | Keep as utility |
| `ThemeToggle.tsx` | None | ✓ dashboard pages | Promote to `ui/theme-toggle.tsx` |

**Inline patterns that must be extracted (currently embedded in page files):**

| Pattern | Currently in | Extract to |
|---|---|---|
| `PlanetHover` (Radix HoverCard) | `ChartClient.tsx` | `app/components/ui/planet-hover-card.tsx` |
| Accordion house list (Radix Accordion) | `ChartClient.tsx` (inline) | `app/components/ui/accordion.tsx` |
| Pill / Tag element | Scattered inline styles across 9+ files | `app/components/ui/astro-pill.tsx` |
| Section header (`2px border + font-primary`) | Scattered inline styles across 7+ files | `app/components/ui/section-header.tsx` |
| Editorial loader (saturn SVG + mono text) | `reading/[id]/page.tsx` (Loader2) | `app/components/ui/astro-loader.tsx` |

---

## Step 2 — Fix `button.tsx` (Existing Shadcn Component)

The existing `app/components/ui/button.tsx` has brand violations. Fix them before proceeding:

```diff
// BEFORE (hardcoded hex):
- default: "bg-[#1B1B1B] text-[#F8F5EC] border-transparent dark:bg-[#F8F5EC] dark:text-[#1B1B1B]..."
- outline: "border-2 border-[#1B1B1B] dark:border-[#F8F5EC]..."

// AFTER (CSS vars):
+ default: "bg-[var(--color-charcoal)] text-[var(--color-eggshell)] border-transparent dark:bg-[var(--color-eggshell)] dark:text-[var(--color-charcoal)]..."
+ outline: "border-2 border-[var(--color-charcoal)] dark:border-[var(--color-eggshell)]..."
```

All six variants must use CSS variables exclusively. See `app/globals.css` for the exact token names.

---

## Step 3 — Build the UI Primitives

Create each of the following files. The contract is: **Shadcn primitive as the structural base, Astro-Brand tokens as the visual skin.**

### `app/components/ui/accordion.tsx`
**Base:** `@radix-ui/react-accordion`
**Purpose:** Replaces one-off `ExpandableCard.tsx` and the inline Radix usage in `ChartClient.tsx`.

Variants:
- `editorial` — for dark-background sections (charcoal/black). Item divider: `1px solid rgba(248,245,236,0.15)`. Text: `var(--color-eggshell)`.
- `default` — for light-background sections. Item divider: `1px solid var(--surface-border)`. Text: `var(--text-primary)`.

The trigger must include:
- Ghost number prefix (`--font-primary`, `1.5rem`, `opacity: 0.3`) as an optional prop `showIndex`
- Auto-rotating chevron (`AccordionChevron group-data-[state=open]:rotate-180`)
- CSS keyframes `slideDown` / `slideUp` — extract from `ChartClient.tsx` and add to `globals.css` under `/* ── Accordion Animations ── */`

```tsx
// Usage example from FinalReportSummary:
<Accordion variant="editorial" type="single" collapsible>
  {houses.map((h, i) => (
    <AccordionItem key={h.house} value={String(h.house)} showIndex={i + 1}>
      <AccordionTrigger label={h.sphere} meta={`${h.rulerPlanet} · ${h.score}/100`} />
      <AccordionContent>{/* house detail */}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

---

### `app/components/ui/planet-hover-card.tsx`
**Base:** `@radix-ui/react-hover-card`
**Purpose:** Replace the inline `PlanetHover` function in `ChartClient.tsx`. Used wherever a planet name appears in the UI.

Props:
```typescript
interface PlanetHoverCardProps {
  planet: string;           // e.g. "Jupiter"
  sign: string;             // e.g. "Sagittarius"
  house: number;            // natal or relocated house
  degree?: string;          // e.g. "12° 00′"
  rulerCondition?: string;  // "Domicile" | "Exalted" | etc. (only for relocated)
  context?: "natal" | "relocated"; // changes subtitle wording
  children: React.ReactNode;
}
```

Style contract:
- Trigger: `cursor: zoom-in`, `borderBottom: 1px dashed {planetColor}`
- Content: `background: var(--surface)`, `border: 1px solid var(--surface-border)`, `borderRadius: var(--radius-sm)`, `width: 300px`, NO `box-shadow`
- Planet title: `--font-primary`, `1.2rem`, `uppercase`
- Domain line: `--font-mono`, `0.6rem`, `uppercase`, `color: {planetColor}`
- Body text: `--font-body`, `0.9rem`, `color: var(--text-secondary)`

Pulls `PLANET_DOMAINS` and `HOUSE_DOMAINS` from `@/app/lib/astro-wording` (created in Prompt 3).

---

### `app/components/ui/astro-pill.tsx`
**Base:** `cva` + HTML `<span>`
**Purpose:** Replace the 9+ instances of inline pill/tag styles scattered across the codebase.

```typescript
const pillVariants = cva(
  "inline-flex items-center font-mono uppercase tracking-[0.08em] border",
  {
    variants: {
      variant: {
        default:   "border-current text-current bg-transparent",      // 1px solid currentColor
        accent:    "bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] border-transparent",
        sage:      "bg-transparent text-[var(--sage)] border-[var(--sage)]",
        gold:      "bg-transparent text-[var(--gold)] border-[var(--gold)]",
        spiced:    "bg-transparent text-[var(--color-spiced-life)] border-[var(--color-spiced-life)]",
        ghost:     "border-[var(--surface-border)] text-[var(--text-secondary)] bg-transparent",
      },
      size: {
        xs: "text-[0.5rem] px-[0.5rem] py-[0.15rem] rounded-full",
        sm: "text-[0.55rem] px-[0.8rem] py-[0.3rem] rounded-full",
        md: "text-[0.65rem] px-[1rem] py-[0.35rem] rounded-full",
      },
      shape: {
        pill:    "rounded-full",
        cut:     "[clip-path:var(--cut-sm)]",           // Y2K chamfered
        square:  "rounded-none",
      }
    },
    defaultVariants: { variant: "default", size: "sm", shape: "pill" },
  }
);
```

**Replace all inline snippet patterns like this:**
```tsx
// BEFORE (scattered, inconsistent):
<span style={{ border: "1px solid currentColor", borderRadius: "20px", padding: "0.3rem 0.8rem", fontSize: "0.65rem", fontFamily: "var(--font-mono)" }}>PEAK FLOW</span>

// AFTER:
<AstroPill variant="sage" size="sm">PEAK FLOW</AstroPill>
```

---

### `app/components/ui/section-header.tsx`
**Base:** HTML `<div>` with CVA
**Purpose:** Replace the 7+ instances of the `2px solid var(--text-primary) border-bottom` + `font-primary uppercase` pattern.

```tsx
interface SectionHeaderProps {
  kicker?: string;       // small mono label above, e.g. "HOW IT WORKS"
  title: string;         // --font-primary, uppercase, large
  theme?: "dark" | "light"; // controls border and text colors
  size?: "sm" | "md" | "lg";
}
```

Style contract:
- Kicker: `--font-mono`, `0.55rem`, `letter-spacing: 0.15em`, `text-transform: uppercase`, `color: var(--text-tertiary)`
- Title: `--font-primary`, size-dependent (`1.2rem` | `2rem` | `clamp(3rem, 6vw, 5rem)`), `letter-spacing: 0.02em`, `uppercase`
- Divider rule: `theme="light"` → `borderBottom: 2px solid var(--text-primary)`, `theme="dark"` → `borderBottom: 2px solid var(--color-eggshell)`
- Padding below title: `padding-bottom: 1rem`, `marginBottom: 1.5rem`

---

### `app/components/ui/astro-loader.tsx`
**Base:** HTML + CSS animation
**Purpose:** Brand-compliant loading state. Replaces all `<Loader2>` usages.

```tsx
// app/components/ui/astro-loader.tsx
export function AstroLoader({ label = "Computing Chart Matrix..." }: { label?: string }) {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--color-black)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1.5rem"
    }}>
      <img
        src="/avatar/saturn-monogram.svg"
        alt="Loading"
        width={80} height={80}
        style={{ animation: "astro-spin 3s linear infinite", filter: "invert(1)" }}
      />
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "0.6rem",
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: "var(--text-tertiary)"
      }}>{label}</span>
    </div>
  );
}
```

Add to `app/globals.css`:
```css
/* ── Astro Loader ── */
@keyframes astro-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

---

## Step 4 — Update `app/lib/astro-wording.ts`

This is the shared content/copy layer. Create it now so Prompt 3 can import from it:

```typescript
// app/lib/astro-wording.ts
// Single source of truth for all editorial planet/house wording.
// Previously duplicated inline in: ChartClient.tsx, FinalReportSummary (mock)

export const PLANET_DOMAINS: Record<string, string> = {
  "Sun":        "YOUR IDENTITY AND WHERE YOU SHINE",
  "Moon":       "YOUR BODY AND EMOTIONS",
  "Mercury":    "HOW AND WHERE YOU COMMUNICATE",
  "Venus":      "HOW AND WHERE YOU CONNECT",
  "Mars":       "HOW AND WHERE YOU TAKE ACTION",
  "Jupiter":    "HOW AND WHERE YOU CREATE ABUNDANCE",
  "Saturn":     "HOW AND WHERE YOU CREATE BOUNDARIES",
  "Uranus":     "HOW AND WHERE YOU INNOVATE AND DISRUPT",
  "Neptune":    "HOW AND WHERE YOU USE YOUR IMAGINATION",
  "Pluto":      "HOW AND WHERE YOU HOLD SECRET POWER",
  "Chiron":     "HOW AND WHERE YOU FIND HEALING",
  "North Node": "HOW AND WHERE YOU'RE INSATIABLE",
  "South Node": "HOW AND WHERE YOU LEARN TO LET GO",
  "Ascendant":  "YOUR MOTIVATION FOR LIVING LIFE",
  "MC":         "YOUR PUBLIC IMAGE AND VOCATION",
  "DC":         "YOUR COMMITTED RELATIONSHIPS",
  "IC":         "YOUR ANCESTRY AND HOME",
};

export const HOUSE_DOMAINS: Record<number, string> = {
  1:  "self, appearance, vitality, and life force",
  2:  "assets, resources, and talents",
  3:  "communication, daily rituals, siblings, and extended family",
  4:  "parents, caregivers, foundations, and home",
  5:  "pleasure, romance, creative energy, and children",
  6:  "work, health, and pets",
  7:  "committed partnerships",
  8:  "death, mental health, and other people's resources",
  9:  "travel, education, publishing, religion, astrology, and philosophy",
  10: "career and public roles",
  11: "community, friends, and good fortune",
  12: "sorrow, loss, daemon, and hidden life",
};

export const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Score → status label (mirrors house-matrix.ts statusFromScore)
export const SCORE_STATUS: Record<string, string> = {
  "Peak Flow":        "Peak Flow",
  "Highly Favorable": "Highly Favorable",
  "Favorable":        "Favorable",
  "Neutral":          "Neutral",
  "Challenging":      "Challenging",
  "Severe Friction":  "Severe Friction",
};
```

After creating it, update `app/chart/ChartClient.tsx` to import from `@/app/lib/astro-wording` and remove the local definitions.

---

## Step 5 — Update `components.json` Registrations (Optional)

Confirm that new `ui/` components are reachable via the `@/app/components/ui/*` alias already configured in `components.json`. No config changes needed — just verify the alias resolves.

---

## Step 6 — Update Existing Pages to Use New Primitives

For each page listed below, replace inline patterns with the new components. This is a find-and-replace pass, not a full refactor:

| Page | Replace |
|---|---|
| `app/chart/ChartClient.tsx` | Inline `PlanetHover` → `<PlanetHoverCard>`, inline accordion → `<Accordion variant="editorial">`, section header → `<SectionHeader>`, `PLANET_DOMAINS` import from `astro-wording` |
| `app/reading/[id]/page.tsx` | `<Loader2>` → `<AstroLoader>`, inline pill tags → `<AstroPill>` |
| `app/readings/page.tsx` | Inline pill tags → `<AstroPill>` |
| `app/mock-reading-design/page.tsx` | Skip button inline styles → `<AstroPill shape="cut">` |
| `app/home/*.tsx` | Section labels → `<SectionHeader>` |

---

## Evaluation Tests

Create `__tests__/design-system/` and write tests alongside:

### `astro-pill.test.tsx`
```
✓ variant="accent" applies bg-[var(--color-y2k-blue)]
✓ variant="sage" applies text-[var(--sage)] and border-[var(--sage)]
✓ shape="cut" applies clip-path:var(--cut-sm), not border-radius
✓ No hardcoded hex values in any rendered className
✓ Renders children correctly
```

### `planet-hover-card.test.tsx`
```
✓ Renders trigger with correct planet color bottom border
✓ On open: displays PLANET_DOMAINS[planet] wording
✓ On open: displays "planet in sign in the Nth House of domain" sentence
✓ context="relocated" shows rulerCondition in subtitle
✓ Content panel has no box-shadow style
```

### `accordion.test.tsx`
```
✓ variant="editorial" applies eggshell/15% opacity divider color
✓ variant="default" applies var(--surface-border) divider
✓ showIndex prop renders ghost number prefix
✓ Chevron rotates 180deg when item is open (data-state=open)
✓ slideDown/slideUp animations are applied via className, not js transition
```

### `section-header.test.tsx`
```
✓ theme="dark" renders borderBottom: 2px solid var(--color-eggshell)
✓ theme="light" renders borderBottom: 2px solid var(--text-primary)
✓ kicker prop renders in --font-mono at 0.55rem
✓ No hardcoded hex color in any rendered style
```

### `astro-wording.test.ts`
```
✓ PLANET_DOMAINS["Sun"] === "YOUR IDENTITY AND WHERE YOU SHINE"
✓ HOUSE_DOMAINS[9] === "travel, education, publishing, religion, astrology, and philosophy"
✓ getOrdinal(1) === "1st"
✓ getOrdinal(12) === "12th"
✓ getOrdinal(22) === "22nd"
```

---

## Build Gate

After completing this prompt, run before moving to implementation:

```bash
# TypeScript — all new ui/ components must be clean
npx tsc --noEmit

# Lint — no inline hex values in the new components
npx eslint app/components/ui --ext .tsx,.ts

# Tests
npx jest __tests__/design-system/ --verbose

# Verify Shadcn alias resolution
npx shadcn status
```

> [!IMPORTANT]
> Only proceed to `docs/readings/implementation_prompts.md` **after this build gate passes cleanly.**
> The reading page prompts assume `AstroLoader`, `AstroPill`, `Accordion`, `PlanetHoverCard`, `SectionHeader`, and `app/lib/astro-wording` all exist and are importable.
