# Prompt — Remaining Mockup Pages

> **Goal:** Complete the user journey so every link in the app leads somewhere. All pages should be **non-gated mockups** using static/mocked data — no auth required, no real API calls.

---

## Shared Rules (Apply to All Pages Below)

### Demo Mode (`?demo=true`)
Every server-component `page.tsx` must support a `?demo=true` query param:
- When `demo=true`: **skip all Supabase auth checks**, inject static mock data, mock save operations with `setTimeout`
- When absent: normal auth flow — redirect to `/flow` if unauthenticated
- Pattern (already implemented in `goals/page.tsx`):

```tsx
export default async function Page({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const params = await searchParams;
  const isDemo = params.demo === 'true';
  if (!isDemo) {
    // real auth + data fetch
  } else {
    // use mock data
  }
}
```

**All nav links from the home dashboard should append `?demo=true` when in demo mode.** Pass `isDemo` as a prop to client components.

### Design
- Read `.agents/skills/astro-design/SKILL.md` fully before any UI work
- All colors via `var(--*)` tokens from `globals.css` — zero hardcoded hex
- Icons: **Lucide SVGs only** — no emojis anywhere
- Cards: `var(--shape-asymmetric-md)` border-radius or `clip-path: var(--cut-md)`
- Logo: use `/logo-stacked.svg` with the shared `.onboarding-logo` CSS class for dark/light theming

### Layout
- Every page follows: Header (logo + ThemeToggle) → Content → optional FloatingCTA
- Max-width: `1400px`, centered, padded with `clamp(1.25rem, 3vw, 3rem)`
- Mobile-first, responsive at `768px` and `1200px` breakpoints

### Components to Extract First
Before building pages, extract these shared components from `flow/page.tsx`:

| Component | Current Location | Reuse In |
|-----------|-----------------|----------|
| `Pill` | `flow/page.tsx:164` | Reading results, birthday, couples |
| `Starburst` | `flow/page.tsx:50` | Birthday optimizer, reading results |
| `ProgressBar` (pips) | `flow/page.tsx:194` | Any multi-step flow |
| `VerdictLabel` | To create (see prompt 07 spec) | All score displays |
| `ScoreRing` | `app/components/ScoreRing` (exists) | All score displays |

---

## Pages to Build (in order)

### 1. `/reading/[id]` — Reading Results Page

**Priority:** P0 — This is the product itself.

**What a user expects:** After completing onboarding and paying $9, this is what they receive. The single most important page in the app.

**Mock data source:** Hardcode a sample reading result with realistic values.

**Sections (top to bottom):**

```
Header (logo + ThemeToggle)
├─ Destination banner: city name + ScoreRing + VerdictLabel
├─ House-by-house breakdown: 12 rows, each with house name, score, planet, sign, one-line insight
│   └─ Use expandable accordion pattern
├─ Transit windows: 3-4 upcoming windows with date range, transit type, and recommendation
├─ Planetary line distances: table showing nearest ACG lines and km distance
└─ CTA: "Run another reading" → /flow
```

**Key design details:**
- Score ring at top should be large (120px), centered, with verdict label below
- House breakdown rows alternate `var(--surface)` / transparent backgrounds
- Transit windows use pill tags: `[PERSONAL]` `[MUNDANE]` `[GEODETIC]`
- Distance tiers: `0-100mi: Strong`, `100-300mi: Moderate`, `300-500mi: Weak`
- Verdict color scale (use everywhere):
  - ≥80 Highly Productive `var(--sage)`
  - 65-79 Productive `var(--color-y2k-blue)`
  - 50-64 Mixed `var(--gold)`
  - 35-49 Challenging `var(--color-spiced-life)`
  - <35 Hostile `var(--color-planet-mars)`

---

### 2. `/readings` — Reading History

**Priority:** P0 — Access point for all past readings.

**Sections:**
```
Header
├─ Page title: "YOUR READINGS" (font-primary, uppercase)
├─ List of reading cards, each showing:
│   ├─ ScoreRing (small, 56px)
│   ├─ Destination name + date
│   ├─ VerdictLabel
│   └─ "View ›" button → /reading/[id]
└─ Empty state: "No readings yet. Start your first reading." → /flow
```

**Mock data:** 3 sample readings (Tokyo 87, Paris 62, Bali 91).

---

### 3. `/profile` — User Profile + Sign Out

**Priority:** P1 — Users literally cannot sign out without this page.

**Reference:** `docs/prompts/08-profile.md` has the full spec.

**Sections:**
```
Header
├─ Pill: "ACCOUNT"
├─ Title: "YOUR PROFILE" (font-primary)
├─ Section 1: Birth Data Form
│   ├─ First name, Date of birth, Time of birth, City of birth
│   ├─ "I don't know my birth time" toggle
│   └─ Save button (asymmetric-md shape)
├─ Section 2: Account
│   ├─ "Logged in as user@email.com" (mocked)
│   └─ Sign out button
└─ Navigation: Avatar in home header should link here
```

---

### 4. `/birthday` — Birthday Optimizer

**Priority:** P2 — Hero card on home dashboard.

**Reference:** `docs/prompts/06-birthday-optimizer.md` has the full spec.

**Sections:**
```
Header
├─ Title: "BIRTHDAY OPTIMIZER" (font-primary)
├─ Sub: "Find where to be on your birthday to set the year's themes."
├─ Year toggle pills: 2026 | 2027
├─ Top 5 ranked cities:
│   ├─ Rank number (font-primary, 3rem, ghost style)
│   ├─ City name + verdict + score
│   └─ ScoreRing (56px)
└─ #1 city uses asymmetric-md border-radius to stand out
```

**Mock data:** 5 cities from the candidate list with pre-assigned scores.

---

### 5. `/couples` — Couples & Family Scoring

**Priority:** P2 — Feature card on home dashboard.

**Reference:** `docs/prompts/07-couples-family.md` has the full spec.

**Sections:**
```
Header
├─ Title: "COUPLES & FAMILY" (font-primary)
├─ Partner input form (name, DOB, time, city — reuse .input-field classes)
├─ 3-column score comparison:
│   ├─ YOU (charcoal bg, ScoreRing 80px)
│   ├─ TOGETHER (Y2K blue bg, ScoreRing 96px — most prominent)
│   └─ PARTNER (charcoal bg, ScoreRing 80px)
├─ Conflict callout (if scores differ >20)
└─ Individual house breakdowns (expandable accordions)
```

**Mock data:** Pre-filled partner, destination "Tokyo", scores You=87, Partner=62, Together=75.

---

### 6. `/chart` — Natal Chart Viewer

**Priority:** P3 — Nice-to-have for power users.

**Sections:**
```
Header
├─ Title: "YOUR CHART" (font-primary)
├─ NatalChart component (already exists in codebase)
├─ Planet positions table:
│   ├─ Planet | Sign | House | Degree
│   └─ Use pill tags for dignities (DOMICILE, EXALTED, etc.)
└─ Aspect grid (stretch goal)
```

**Mock data:** A realistic natal chart dataset.

---

## Build Order Summary

| Phase | Pages | Estimated Effort |
|-------|-------|-----------------|
| **Phase A** | Extract shared components (`Pill`, `VerdictLabel`, `Starburst`) | 30 min |
| **Phase B** | `/reading/[id]` + `/readings` | 2-3 hours |
| **Phase C** | `/profile` | 1 hour |
| **Phase D** | `/birthday` + `/couples` | 2-3 hours |
| **Phase E** | `/chart` | 1-2 hours |

---

## After Building: Home Dashboard Update

Once all pages exist, update `app/home/HomeClient.tsx` explore grid to include all 5 feature cards per the [prompt 04 spec](file:///Users/brandonwirakesuma/Documents/astro-nat/docs/prompts/04-app-home.md):

| Card | Icon | URL |
|------|------|-----|
| My Readings | `<BookOpen>` | `/readings` |
| Birthday Optimizer | `<Cake>` | `/birthday` |
| Life Goals | `<Heart>` | `/goals` |
| Couples & Family | `<Users>` | `/couples` |
| My Chart | `<Star>` | `/chart` |
