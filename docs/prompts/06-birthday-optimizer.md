# Prompt 06 — Birthday Optimizer (Solar Return Charts)

> ⚠️ **MERGED:** This feature has been merged into the unified New Reading wizard. See **`17-new-reading.md`** (`?type=birthday`). This document is kept as **reference** for scoring logic and candidate cities.

**Phase:** 1 | **Deadline:** April 25, 2026 | **Priority:** P2

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — All CSS tokens. Never hardcode values.
3. **`docs/prd/analysis-layers.md`** — Engine layer architecture. Birthday Optimizer uses the house-matrix layer.
4. **`app/api/house-matrix/`** — Existing scoring endpoint. This is the engine for results.
5. **`app/api/natal/`** — Returns natal chart data (birth positions). Required input for solar return.

---

## What to Build

**Route:** `app/birthday/page.tsx`

"Where should I be on my birthday to activate the life themes I care about?"

This is a solar return chart feature: for a given year, we find the exact moment the Sun returns to its natal position. The location where the user *is* at that moment sets their astrological themes for the year ahead.

**Phase 1 scope:** Use the existing `house-matrix` endpoint with a curated candidate city list. Full solar return calculation (Swiss Ephemeris moment) is a Phase 2 enhancement.

---

## User Flow

```
Select birthday year
→ See top 5 recommended cities ranked by score (optimized for your saved Life Goals)
→ Click a city → see full breakdown
```

---

## UI Implementation

### Layout

```
app/birthday/
  page.tsx      ← Main page (server component, fetch profile)
  BirthdayClient.tsx  ← Client component (year picker, city results)
```

### Page Header

- Headline: `"Birthday Optimizer"` — `var(--font-primary)`, uppercase
- Sub: `"Find where to be on your birthday to set the year's themes."` — `var(--font-body)`
- Decorative element: Oversized `🎂` glyph, `position: absolute`, `opacity: 0.06`, `font-size: 12rem`, behind the header (ebook-style texture)

### Year Selector

Simple pill toggle for current year vs next year:

```tsx
<div style={{ display:'flex', gap:'0.5rem' }}>
  {[currentYear, currentYear + 1].map(year => (
    <button key={year}
      style={{
        borderRadius: 'var(--radius-full)',
        padding: '0.5rem 1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        background: selected === year ? 'var(--color-y2k-blue)' : 'transparent',
        border: '1px solid var(--surface-border)',
        color: selected === year ? 'white' : 'var(--text-secondary)',
      }}
    >{year}</button>
  ))}
</div>
```

### Automated Life Theme Scoring

Do not ask the user for their goals again! Fetch `profiles.life_goals` from Supabase on the server component. When calling the `house-matrix` engine, pass their saved goals to automatically optimize the city rankings.

### City Results

For Phase 1, score a **curated candidate list** (20 cities) using `/api/house-matrix`:

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

Display top 5 as ranked cards:

```tsx
// Rank card layout
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
}}>
  {topCities.map((city, i) => (
    <div key={city.name} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      padding: 'var(--space-md)',
      background: 'var(--surface)',
      border: '1px solid var(--surface-border)',
      borderRadius: i === 0 ? 'var(--shape-asymmetric-md)' : 'var(--radius-md)',
    }}>
      {/* Rank number */}
      <span style={{ fontFamily:'var(--font-primary)', fontSize:'3rem', color:'var(--text-tertiary)', lineHeight:1, width:'3rem', flexShrink:0 }}>
        {i + 1}
      </span>

      {/* City info */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily:'var(--font-secondary)', fontSize:'1.5rem' }}>{city.name}</h3>
        <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'var(--text-secondary)' }}>
          {city.verdict} — {city.score}/100
        </p>
      </div>

      {/* Score ring (reuse existing ScoreRing component) */}
      <ScoreRing score={city.score} size={56} />
    </div>
  ))}
</div>
```

**Verdict color scale (SAME AS EVERYWHERE ELSE):**

| Score | Verdict | Color |
|-------|---------|-------|
| ≥ 80 | Highly Productive | `var(--sage)` |
| 65–79 | Productive | `var(--color-y2k-blue)` |
| 50–64 | Mixed | `var(--gold)` |
| 35–49 | Challenging | `var(--color-spiced-life)` |
| < 35 | Hostile | `var(--color-planet-mars)` |

> ⚠️ Always use this exact table. Do not invent new labels.

---

## API Integration

For each candidate city, call `/api/house-matrix`:

```ts
const score = await fetch('/api/house-matrix', {
  method: 'POST',
  body: JSON.stringify({
    natal: profileNatal,     // from /api/natal
    destination: { lat: city.lat, lon: city.lon },
    date: birthdayDate,      // user's upcoming birthday
    lifeGoals: profileGoals, // passed in from profile, do not re-ask
  })
}).then(r => r.json())
```

Batch all 20 calls with `Promise.all` and rank by `macroScore`.

---

## Design Checklist

- [ ] Page header uses `var(--font-primary)` uppercase headline
- [ ] Oversized decorative element behind header (ebook-style, `opacity: 0.06`)
- [ ] Year selector uses pill toggle (Y2K Blue for selected)
- [ ] No goal selection UI — automatically uses goals from DB profile
- [ ] Rank #1 city uses `var(--shape-asymmetric-md)` border-radius (standout design)
- [ ] Score uses EXACT verdict color scale
- [ ] ScoreRing component reused — not re-implemented
- [ ] Loading states shown while 20 cities are being scored
