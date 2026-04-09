# Prompt 03 — Onboarding Wizard (6-Screen Flow)

**Phase:** 1 | **Deadline:** April 15, 2026 | **Priority:** P0

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Typography, colors, shapes, assets. Follow exactly.
2. **`app/globals.css`** — CSS token reference. Never hardcode values.
3. **`docs/prd/onboarding-flow.md`** — Full screen-by-screen spec with data model. This is your primary source.
4. **`app/flow/page.tsx`** — Existing 47KB flow wizard. **Refactor this file** — do not build from scratch.
5. **`app/mockup-onboarding/page.tsx`** — Visual reference mockup.

---

## What to Build

Refactor `app/flow/page.tsx` into a proper 6-screen progressive wizard following `docs/prd/onboarding-flow.md`. The flow must:
- Show value (Screen 3: Aha Moment) **before** asking for signup or payment
- Collect birth data, life goals, and destination progressively
- Use existing API endpoints — no new backend needed
- In Phase 1: results preview is **not gated** (no paywall yet)

---

## The 6 Screens

```
Screen 1: Welcome → Screen 2: Birth Data → Screen 3: Aha Moment ✨
→ Screen 4: Life Goals → Screen 5: Destination → Screen 6: Results Preview
```

### Screen 1 — Welcome
**Purpose:** Brand hook. Zero input.

| Element | Spec |
|---------|------|
| Background image | `/astronat-hero.jpg` (Vespa + cypress), full-bleed |
| Overlay | Glassmorphic dark overlay: `rgba(0,0,0,0.45)` |
| Logo | `/logo-stacked.svg` centered, `filter: invert(1)` white on dark |
| Headline | `"Where in the world should you be?"` — `var(--font-primary)`, clamp(3rem, 6vw, 5rem), white |
| Sub-line | `"Your astrocartography reading, personalized."` — `var(--font-body)`, `var(--color-acqua)` |
| CTA | `"Get Started →"` button — `btn-primary` class, `var(--color-y2k-blue)` bg |

### Screen 2 — Birth Data
**Purpose:** Capture identity for chart calculation.

| Field | Type | Notes |
|-------|------|-------|
| First name | text input | Personalize all future output |
| Date of birth | date picker | On entry: show Sun sign glyph inline (`getSunSign()` utility already exists) |
| Time of birth | time picker | "I don't know" toggle → defaults to 12:00 noon. Flag `birth_time_known = false` |
| City of birth | text autocomplete | Call `/api/geocode` for lat/lon. Show country flag emoji. |

**Micro-interaction:** When date is selected, animate in Sun sign glyph + name below the date field using `framer-motion`: `initial={{ opacity:0, scale:0.8 }}`, `animate={{ opacity:1, scale:1 }}`.

### Screen 3 — Aha Moment ✨
**Purpose:** Deliver instant value. This is the Duolingo "lesson before signup" moment.

- Call `/api/natal` with birth data from Screen 2
- Display animated natal chart wheel (`NatalChart` component — already exists)
- Show 3 personalized bullet points:
  - `"☀️ [Sun Sign] Sun — [trait]"`
  - `"🌙 [Moon Sign] Moon — [trait]"`
  - `"↑ [Rising Sign] Rising — [trait]"`
- Tone: `"You're a Leo Sun with Aries Rising — fire meets fire. You thrive in places that match your intensity."`
- CTA: `"Show me where →"`

### Screen 4 — Life Goals 🎯
**Purpose:** Intent capture. Drives which houses/transits get weighted in the reading.

Multi-select toggle cards (max 3). Use `clip-path: var(--cut-sm)` on each card:

| Goal | Icon | Engine Mapping |
|------|------|---------------|
| Love & Relationships | 💕 | 5th & 7th House, Venus lines |
| Career & Ambition | 💼 | 10th & 6th House, MC lines, Saturn/Jupiter |
| Community & Friendships | 🤝 | 11th & 3rd House, social transits |
| Timing & Life Transitions | ⏱️ | Active transits, profections, travel windows |
| Personal Growth | 🌱 | 9th & 12th House, Neptune/Jupiter |
| Relocation / Living | 🏠 | 4th House, IC lines |

**Selected state:** `background: var(--color-y2k-blue)`, `color: white`.
**Unselected state:** `background: var(--surface)`, `border: 1px solid var(--surface-border)`.

### Screen 5 — Destination
**Purpose:** Where does the user want to go?

| Field | Type | Notes |
|-------|------|-------|
| Destination city | autocomplete | Call `/api/geocode` — same as birth city |
| Travel date | date picker (optional) | Helper text: "Dates are flexible — we'll find the best windows." |
| Travel type | pill toggle | `Trip` vs `Relocation` — changes reading weight |

**Pill toggle design:**
```tsx
<div style={{ display:'flex', border:'1px solid var(--surface-border)', borderRadius:'var(--radius-full)' }}>
  <button style={{ borderRadius:'var(--radius-full)', padding:'0.5rem 1.5rem',
    background: selected==='trip' ? 'var(--color-y2k-blue)' : 'transparent' }}>Trip</button>
  <button style={{ borderRadius:'var(--radius-full)', padding:'0.5rem 1.5rem',
    background: selected==='relocation' ? 'var(--color-y2k-blue)' : 'transparent' }}>Relocation</button>
</div>
```

### Screen 6 — Signup & Results Preview
**Purpose:** Show the score and convert the user. In Phase 1, the full results are previewed, and auth essentially "saves" the reading to their new account.

- Call `/api/house-matrix` with data from local state
- Display `macroScore` using the ScoreRing component
- Show verdict using the standard color scale
- Gated state: "Save your reading to view the full breakdown"
- Auth: Google OAuth + Magic Link. 
  - **CRITICAL:** Because OAuth redirects the user away from the app, all Onboarding state MUST be persisted (see State Management below).

**Scoring Color Scale:**

| Score | Verdict | Color |
|-------|---------|-------|
| ≥ 80 | Highly Productive | `var(--sage)` |
| 65–79 | Productive | `var(--color-y2k-blue)` |
| 50–64 | Mixed | `var(--gold)` |
| 35–49 | Challenging | `var(--color-spiced-life)` |
| < 35 | Hostile | `var(--color-planet-mars)` |

> ⚠️ **This table is the law. Use it everywhere. Never invent new score labels or colors.**

---

## State Management (CRITICAL FLOW)

Because users are unauthenticated during steps 1-5, and OAuth on Screen 6 redirects them away from the site, standard React state will be lost. 

**Requirements:**
1. Use `zustand` with `persist` middleware (saving to `localStorage`), or standard `localStorage` wrapper.
2. Store the collected data in this persistent local store.
3. On auth callback (`/auth/callback/route.ts` - from Prompt 02), when the new user returns, read this `localStorage`.
4. Trigger bulk DB insert (create `profile` + save `search`) to Supabase.
5. Clear the `localStorage` and redirect to App Home.

```ts
type OnboardingData = {
  firstName: string
  birthDate: string
  birthTime: string
  birthTimeKnown: boolean
  birthCity: string
  birthLat: number
  birthLon: number
  lifeGoals: string[]
  destination: string
  destLat: number
  destLon: number
  travelDate?: string
  travelType: 'trip' | 'relocation'
}
```

---

## Screen Transitions

Use `framer-motion` `AnimatePresence` for smooth screen transitions:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={step}
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  >
    {/* Current screen */}
  </motion.div>
</AnimatePresence>
```

---

## Design Checklist

- [ ] Screen 1 uses `/astronat-hero.jpg` with glassmorphic overlay
- [ ] Screen 2 shows Sun sign glyph micro-interaction on date entry
- [ ] Screen 3 natal chart renders (`NatalChart` component)
- [ ] Screen 4 goal cards use `clip-path: var(--cut-sm)`, correct selected/unselected states
- [ ] Screen 5 Trip/Relocation pill toggle working
- [ ] Screen 6 uses EXACT scoring color scale (no invented labels)
- [ ] `framer-motion` `AnimatePresence` between screens
- [ ] Progress indicator (dots or step count) visible on all screens
- [ ] All inputs use `.input-field` class from globals.css
- [ ] All buttons use `.btn-primary` or `.btn-secondary` classes
