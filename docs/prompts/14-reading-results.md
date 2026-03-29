# Prompt 14 — Reading Results Page

**Phase:** 1 — Mockup | **Priority:** P0 — This is the product itself.

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prd/scoring-rubric.md`** — House scoring computation for realistic mock data.
4. **`docs/prd/analysis-layers.md`** — 5-layer architecture for what to display.
5. **`docs/prompts/13-shared-components.md`** — Extract shared components first.

---

## What to Build

**Route:** `app/reading/[id]/page.tsx`

This is the most important page in the app. After completing onboarding and paying $9, this is what the user receives — their full astrocartography reading for a destination.

**Demo mode:** Support `?demo=true`. Mock a complete reading result for Tokyo with `macroScore: 87`.

---

## Page Layout (top to bottom)

### 1. Destination Banner

```tsx
<section style={{
  textAlign: 'center',
  padding: 'var(--space-xl) 0',
}}>
  <Pill>READING</Pill>
  <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginTop: 'var(--space-sm)' }}>
    TOKYO, JAPAN
  </h1>
  <ScoreRing score={87} size={120} />
  <VerdictLabel score={87} />
  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
    March 15 – March 22, 2026 · Trip
  </p>
</section>
```

### 2. House-by-House Breakdown

12 expandable accordion rows, one per house. Each row shows:

| Column | Content | Typography |
|--------|---------|-----------|
| House # | `H1`, `H2`, etc. | `var(--font-primary)`, 1.5rem |
| House name | "Identity", "Finances", etc. | `var(--font-secondary)`, 1rem |
| Score | `72/100` | `var(--font-mono)`, color from verdict scale |
| Planet | `☿ Mercury in Gemini` | `var(--font-body)` |
| Dignity pill | `DOMICILE` / `EXALTED` / `DETRIMENT` / `FALL` | `Pill` component |

**Alternating row backgrounds:** odd rows `var(--surface)`, even rows transparent.

**Expanded state** shows a one-line insight text:
```
"Mercury in domicile on your ASC — communication flows effortlessly here. 
Ideal for networking, media, and intellectual pursuits."
```

### 3. Transit Windows

3-4 upcoming windows. Each card:

```tsx
<div style={{
  padding: 'var(--space-md)',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--shape-asymmetric-md)',
  marginBottom: 'var(--space-sm)',
}}>
  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-xs)' }}>
    <Pill variant="personal">PERSONAL</Pill>
    {/* or variant="mundane" or variant="geodetic" */}
  </div>
  <h4 style={{ fontFamily: 'var(--font-secondary)' }}>Jupiter trine natal Sun</h4>
  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
    Apr 12 – May 3, 2026
  </p>
  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
    Peak window for career breakthroughs and public visibility.
  </p>
</div>
```

### 4. Planetary Line Distances

Table showing nearest ACG lines:

| Planet | Line Type | Distance | Tier |
|--------|----------|----------|------|
| Jupiter | MC | 42 mi | `Strong` (0-100mi) |
| Venus | DSC | 187 mi | `Moderate` (100-300mi) |
| Saturn | IC | 423 mi | `Weak` (300-500mi) |
| Mars | ASC | 89 mi | `Strong` (0-100mi) |

Distance tier colors:
- Strong: `var(--sage)`
- Moderate: `var(--gold)`
- Weak: `var(--color-spiced-life)`

### 5. Bottom CTA

```tsx
<button className="btn btn-primary" style={{ borderRadius: 'var(--shape-asymmetric-md)' }}
  onClick={() => router.push('/flow')}>
  Run another reading →
</button>
```

---

## Mock Data

```ts
const MOCK_READING = {
  id: 'demo-reading-1',
  destination: 'Tokyo, Japan',
  macroScore: 87,
  travelDate: '2026-03-15',
  travelType: 'trip',
  houses: [
    { house: 1, name: 'Identity', score: 72, planet: 'Mercury', sign: 'Gemini', dignity: 'domicile', insight: 'Communication flows effortlessly here.' },
    { house: 2, name: 'Finances', score: 65, planet: 'Venus', sign: 'Taurus', dignity: 'domicile', insight: 'Material stability is favored.' },
    { house: 3, name: 'Communication', score: 81, planet: 'Jupiter', sign: 'Sagittarius', dignity: 'domicile', insight: 'Learning and connections thrive.' },
    { house: 4, name: 'Home & Roots', score: 44, planet: 'Saturn', sign: 'Capricorn', dignity: 'domicile', insight: 'Grounding but heavy energy.' },
    { house: 5, name: 'Creativity & Love', score: 88, planet: 'Venus', sign: 'Pisces', dignity: 'exalted', insight: 'Romance and artistic expression peak here.' },
    { house: 6, name: 'Health & Work', score: 59, planet: 'Mars', sign: 'Virgo', dignity: null, insight: 'Steady productivity, watch for overwork.' },
    { house: 7, name: 'Partnerships', score: 91, planet: 'Jupiter', sign: 'Libra', dignity: null, insight: 'Ideal for forming lasting partnerships.' },
    { house: 8, name: 'Transformation', score: 38, planet: 'Pluto', sign: 'Scorpio', dignity: 'domicile', insight: 'Deep but intense transformations.' },
    { house: 9, name: 'Travel & Philosophy', score: 95, planet: 'Jupiter', sign: 'Sagittarius', dignity: 'domicile', insight: 'Peak travel energy — the world opens up.' },
    { house: 10, name: 'Career & Status', score: 82, planet: 'Sun', sign: 'Leo', dignity: 'domicile', insight: 'Public recognition and career growth.' },
    { house: 11, name: 'Community', score: 76, planet: 'Uranus', sign: 'Aquarius', dignity: 'domicile', insight: 'Social connections expand rapidly.' },
    { house: 12, name: 'Spirituality', score: 70, planet: 'Neptune', sign: 'Pisces', dignity: 'domicile', insight: 'Deep intuitive insights and spiritual growth.' },
  ],
  transits: [
    { type: 'personal', title: 'Jupiter trine natal Sun', date: 'Apr 12 – May 3, 2026', insight: 'Peak window for career breakthroughs.' },
    { type: 'mundane', title: 'Saturn enters Aries', date: 'May 25, 2026', insight: 'Global restructuring — new ambitions favored.' },
    { type: 'geodetic', title: 'Venus line crosses Tokyo meridian', date: 'Jun 1–14, 2026', insight: 'Romance and beauty activated in this zone.' },
  ],
  lines: [
    { planet: 'Jupiter', lineType: 'MC', distance: 42, tier: 'Strong' },
    { planet: 'Venus', lineType: 'DSC', distance: 187, tier: 'Moderate' },
    { planet: 'Saturn', lineType: 'IC', distance: 423, tier: 'Weak' },
    { planet: 'Mars', lineType: 'ASC', distance: 89, tier: 'Strong' },
  ],
}
```

---

## Design Checklist

- [ ] ScoreRing at 120px, centered, with VerdictLabel below
- [ ] House rows use alternating `var(--surface)` / transparent backgrounds
- [ ] Dignity pills use `Pill` component
- [ ] Transit cards use `Pill` with `variant` for type coloring
- [ ] Distance tiers color-coded (Strong=sage, Moderate=gold, Weak=spiced-life)
- [ ] Verdict color scale used exactly (never invent new labels)
- [ ] Icons: Lucide SVGs only — no emojis
- [ ] `?demo=true` supported with full mock data
- [ ] Expandable accordion for house details
