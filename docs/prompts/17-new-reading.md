# Prompt 17 — New Reading Wizard (Unified Flow)

**Phase:** 1 | **Priority:** P0

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prompts/13-shared-components.md`** — Uses `Pill`, `VerdictLabel`, `ScoreRing`.
4. **`docs/prd/scoring-rubric.md`** — Scoring engine for results.
5. **`app/api/house-matrix/`** — Scoring endpoint.
6. **`app/api/natal/`** — Chart calculation endpoint.
7. **`app/api/geocode/`** — City autocomplete endpoint.

---

## What to Build

**Route:** `app/new-reading/page.tsx`

A unified wizard that handles ALL reading types. This replaces `/flow` for authenticated users. Every feature card on the App Home deep-links into this wizard via `?type=...`.

**Demo mode:** Support `?demo=true` — use mock data, skip auth.

---

## The 5 Reading Types

| Type | Deep-link | Steps | Output |
|------|----------|-------|--------|
| `trip` | `?type=trip` | Destination → Results | Full reading at `/reading/[id]` |
| `relocation` | `?type=relocation` | Destination → Results | Full reading (relocation-weighted) |
| `birthday` | `?type=birthday` | Year → Top 5 cities | Ranked cards, click → full reading |
| `couples` | `?type=couples` | Partner data → Destination → Comparison | 3-column comparison |
| `goals` | `?type=goals` | Confirm goals → Top 5 cities | Ranked cards, click → full reading |

---

## Step 1 — Type Selection (only shown when no `?type=` param)

Five large cards in a responsive grid (2 columns desktop, 1 mobile):

```tsx
const READING_TYPES = [
  { type: 'trip', icon: 'MapPin', title: 'Score a Trip', description: 'How cosmically aligned is your next trip?', accent: 'var(--color-y2k-blue)' },
  { type: 'relocation', icon: 'Home', title: 'Find Where to Live', description: 'Where should you move for the next chapter?', accent: 'var(--color-acqua)' },
  { type: 'birthday', icon: 'Cake', title: 'Birthday Optimizer', description: 'Where to be on your birthday to set the year\'s themes', accent: 'var(--gold)' },
  { type: 'couples', icon: 'Users', title: 'Read for Two', description: 'Compare your chart with a partner', accent: 'var(--color-spiced-life)' },
  { type: 'goals', icon: 'Target', title: 'Goals-Based Search', description: 'Find the best cities for what you\'re seeking', accent: 'var(--sage)' },
]
```

**Card design:**
```tsx
<button
  onClick={() => setReadingType(type)}
  style={{
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: 'var(--space-lg)',
    background: 'var(--surface)',
    border: '1px solid var(--surface-border)',
    borderRadius: 'var(--shape-asymmetric-md)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s var(--ease)',
  }}
>
  <div style={{
    width: 48, height: 48, borderRadius: 'var(--radius-full)',
    background: accent, color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 'var(--space-sm)',
  }}>
    <Icon size={22} />
  </div>
  <h3 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.25rem' }}>{title}</h3>
  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{description}</p>
</button>
```

---

## Step 2 — Input (varies by type)

### Trip / Relocation

```tsx
<section>
  <Pill>{readingType === 'trip' ? 'TRIP' : 'RELOCATION'}</Pill>
  <h2 style={{ fontFamily: 'var(--font-primary)', marginTop: 'var(--space-sm)' }}>
    {readingType === 'trip' ? 'WHERE ARE YOU GOING?' : 'WHERE DO YOU WANT TO LIVE?'}
  </h2>

  <div className="input-group">
    <label className="input-label">Destination city</label>
    <input type="text" className="input-field" placeholder="Type a city..." />
    {/* Autocomplete via /api/geocode */}
  </div>

  {readingType === 'trip' && (
    <div className="input-group">
      <label className="input-label">Travel dates (optional)</label>
      <input type="date" className="input-field" />
    </div>
  )}

  <button className="btn btn-primary" style={{ borderRadius: 'var(--shape-asymmetric-md)' }}
    onClick={runReading}>
    Score this {readingType === 'trip' ? 'trip' : 'city'} →
  </button>
</section>
```

On submit: call `/api/house-matrix` → save to `searches` → redirect to `/reading/[id]`.

### Birthday

```tsx
<section>
  <Pill>BIRTHDAY OPTIMIZER</Pill>
  <h2 style={{ fontFamily: 'var(--font-primary)' }}>WHERE ON YOUR BIRTHDAY?</h2>
  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
    We'll score 20 cities and show you where to be.
  </p>

  {/* Year toggle */}
  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'var(--space-md)' }}>
    {[currentYear, currentYear + 1].map(yr => (
      <button key={yr} style={{
        borderRadius: 'var(--radius-full)',
        padding: '0.5rem 1.5rem',
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
        background: year === yr ? 'var(--color-y2k-blue)' : 'transparent',
        border: '1px solid var(--surface-border)',
        color: year === yr ? 'white' : 'var(--text-secondary)',
      }} onClick={() => setYear(yr)}>{yr}</button>
    ))}
  </div>

  <button className="btn btn-primary" style={{ borderRadius: 'var(--shape-asymmetric-md)', marginTop: 'var(--space-lg)' }}
    onClick={runBirthdaySearch}>
    Find my cities →
  </button>
</section>
```

On submit: batch-score 20 candidate cities (from `CANDIDATE_CITIES` list in prompt 06) using `/api/house-matrix` + user's saved `life_goals` from profile. Show top 5 inline.

### Couples

```tsx
<section>
  <Pill>COUPLES</Pill>
  <h2 style={{ fontFamily: 'var(--font-primary)' }}>READ FOR TWO</h2>

  {/* Partner birth data form */}
  <div className="input-group">
    <label className="input-label">Partner's name</label>
    <input type="text" className="input-field" />
  </div>
  <div className="input-group">
    <label className="input-label">Date of birth</label>
    <input type="date" className="input-field" />
  </div>
  <div className="input-group">
    <label className="input-label">Time of birth</label>
    <input type="time" className="input-field" />
    <label style={{ fontSize:'0.7rem', color:'var(--text-tertiary)' }}>
      <input type="checkbox" /> Unknown (12:00 noon)
    </label>
  </div>
  <div className="input-group">
    <label className="input-label">City of birth</label>
    <input type="text" className="input-field" placeholder="Type a city..." />
  </div>

  {/* Destination */}
  <div className="input-group" style={{ marginTop: 'var(--space-lg)' }}>
    <label className="input-label">Destination to score</label>
    <input type="text" className="input-field" placeholder="Type a destination..." />
  </div>

  <button className="btn btn-primary" style={{ borderRadius: 'var(--shape-asymmetric-md)' }}
    onClick={runCouplesReading}>
    Compare scores →
  </button>
</section>
```

On submit: call `/api/house-matrix` for both users → show comparison inline.

### Goals

```tsx
<section>
  <Pill>GOALS SEARCH</Pill>
  <h2 style={{ fontFamily: 'var(--font-primary)' }}>CITIES FOR YOUR GOALS</h2>

  {/* Show current saved goals with edit toggle */}
  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
    Your current goals:
  </p>

  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
    {ALL_GOALS.map(goal => (
      <button key={goal.key}
        onClick={() => toggleGoal(goal.key)}
        style={{
          clipPath: 'var(--cut-sm)',
          background: selected.includes(goal.key) ? 'var(--color-y2k-blue)' : 'var(--surface)',
          border: `1px solid ${selected.includes(goal.key) ? 'var(--color-y2k-blue)' : 'var(--surface-border)'}`,
          color: selected.includes(goal.key) ? 'white' : 'var(--text-primary)',
          padding: 'var(--space-md)', textAlign: 'left',
        }}>
        <LucideIcon size={20} />
        <h4 style={{ fontFamily: 'var(--font-secondary)' }}>{goal.label}</h4>
      </button>
    ))}
  </div>

  <button className="btn btn-primary" style={{ borderRadius: 'var(--shape-asymmetric-md)', marginTop: 'var(--space-lg)' }}
    onClick={runGoalsSearch}>
    Find best cities →
  </button>
</section>
```

On submit: batch-score 20 candidate cities weighted by selected goals → show top 5 inline.

---

## Step 3 — Results (varies by type)

### Trip / Relocation → Redirect to `/reading/[id]`

After scoring, save to `searches` table, redirect to the full Reading Results page.

### Birthday / Goals → Inline Top 5 Ranked Cards

```tsx
<section>
  <Pill>{readingType === 'birthday' ? 'BIRTHDAY RESULTS' : 'GOAL RESULTS'}</Pill>
  <h2 style={{ fontFamily: 'var(--font-primary)' }}>YOUR TOP CITIES</h2>

  {topCities.map((city, i) => (
    <div key={city.name} style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
      padding: 'var(--space-md)',
      background: 'var(--surface)',
      border: '1px solid var(--surface-border)',
      borderRadius: i === 0 ? 'var(--shape-asymmetric-md)' : 'var(--radius-md)',
      marginBottom: 'var(--space-sm)',
      cursor: 'pointer',
    }}
    onClick={() => router.push(`/reading/${city.id}`)}>
      <span style={{ fontFamily: 'var(--font-primary)', fontSize: '2.5rem', color: 'var(--text-tertiary)', width: '2.5rem', flexShrink: 0, lineHeight: 1 }}>
        {i + 1}
      </span>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.25rem' }}>{city.name}</h3>
        <VerdictLabel score={city.score} />
      </div>
      <ScoreRing score={city.score} size={56} />
    </div>
  ))}
</section>
```

### Couples → Inline Comparison

3-column comparison (see `07-couples-family.md` for full design). Show:
- **YOU** (charcoal bg, ScoreRing 80px)
- **TOGETHER** (Y2K blue bg, ScoreRing 96px — most prominent)
- **PARTNER** (charcoal bg, ScoreRing 80px)

Plus conflict callout if scores differ > 20 points.

---

## Mock Data (for `?demo=true`)

```ts
const MOCK_TOP_CITIES = [
  { id: 'demo-1', name: 'Bali, Indonesia', score: 91 },
  { id: 'demo-2', name: 'Tokyo, Japan', score: 87 },
  { id: 'demo-3', name: 'Lisbon, Portugal', score: 78 },
  { id: 'demo-4', name: 'Barcelona, Spain', score: 71 },
  { id: 'demo-5', name: 'Cape Town, South Africa', score: 64 },
]

const MOCK_COUPLES = {
  userScore: 87,
  partnerScore: 62,
  compositeScore: 75,
  destination: 'Tokyo, Japan',
}
```

---

## Candidate Cities (for Birthday / Goals batch scoring)

```ts
const CANDIDATE_CITIES = [
  { name: "Bali, Indonesia", lat: -8.34, lon: 115.09 },
  { name: "Tokyo, Japan", lat: 35.68, lon: 139.69 },
  { name: "Paris, France", lat: 48.85, lon: 2.35 },
  { name: "New York, USA", lat: 40.71, lon: -74.00 },
  { name: "London, UK", lat: 51.50, lon: -0.12 },
  { name: "Dubai, UAE", lat: 25.20, lon: 55.27 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Barcelona, Spain", lat: 41.38, lon: 2.17 },
  { name: "Sydney, Australia", lat: -33.87, lon: 151.21 },
  { name: "Berlin, Germany", lat: 52.52, lon: 13.40 },
  { name: "Copenhagen, Denmark", lat: 55.68, lon: 12.57 },
  { name: "Hong Kong", lat: 22.31, lon: 114.17 },
  { name: "Amsterdam, Netherlands", lat: 52.37, lon: 4.90 },
  { name: "Lisbon, Portugal", lat: 38.72, lon: -9.14 },
  { name: "Mexico City, Mexico", lat: 19.43, lon: -99.13 },
  { name: "Cape Town, South Africa", lat: -33.92, lon: 18.42 },
  { name: "Istanbul, Turkey", lat: 41.01, lon: 28.95 },
  { name: "Mumbai, India", lat: 19.08, lon: 72.88 },
  { name: "Buenos Aires, Argentina", lat: -34.60, lon: -58.38 },
  { name: "Kyoto, Japan", lat: 35.01, lon: 135.77 },
]
```

---

## Screen Transitions

Use `framer-motion` `AnimatePresence` between wizard steps:

```tsx
<AnimatePresence mode="wait">
  <motion.div key={step}
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  >
    {currentStepContent}
  </motion.div>
</AnimatePresence>
```

---

## Design Checklist

- [ ] Type cards use `var(--shape-asymmetric-md)` with accent-colored icon circles
- [ ] Deep-linking: `?type=trip` skips type selection and goes straight to input
- [ ] All form inputs use `.input-field`, `.input-label`, `.input-group` classes
- [ ] Score displays use EXACT verdict color scale (VerdictLabel component)
- [ ] Ranked city cards: #1 gets asymmetric border-radius, rest get standard
- [ ] Couples comparison: center card (TOGETHER) is largest and Y2K Blue
- [ ] Birthday/Goals: auto-scores from profile `life_goals` — no re-input
- [ ] `?demo=true` supported — mock data for all 5 types
- [ ] framer-motion transitions between steps
- [ ] Icons: Lucide only — no emojis
