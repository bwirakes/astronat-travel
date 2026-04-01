# Prompt 19 — ACG Map Component (Reusable)

**Phase:** 1 | **Priority:** P1

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`app/components/map.module.css`** — Existing map styles.
4. **`docs/prompts/18-chart-wheel.md`** — ChartWheel uses the same color palette; keep consistent.
5. **`app/api/natal/`** — ACG lines are derived from the natal output.

---

## What to Build

Extract and unify all ACG map rendering into a single reusable component:

**`app/components/AcgMap.tsx`**

This component renders a full-width world SVG map with planet lines, paran lines, and optional highlighted markers.

---

## Component API

```tsx
interface AcgMapProps {
  /** User's natal data — used to derive ACG line positions */
  natal: NatalData;
  /** Optional: a specific city to highlight with a pin */
  highlightCity?: { lat: number; lon: number; name: string; score?: number };
  /** If true, smaller/compact map for embedding in cards */
  compact?: boolean;
  /** If true, click anywhere on map to get score for that lat/lon */
  interactive?: boolean;
  /** Callback when user clicks a location in interactive mode */
  onLocationClick?: (lat: number, lon: number) => void;
}

export function AcgMap({ natal, highlightCity, compact = false, interactive = false, onLocationClick }: AcgMapProps)
```

---

## Layers (drawn in order, bottom to top)

### Layer 1 — Base SVG World Map
- Use the existing world map SVG asset from `public/` (already in project).
- Background: `var(--surface)` / `var(--color-charcoal)` in dark mode.
- Country outlines: `var(--surface-border)`, stroke-width 0.3.
- Ocean fill: `var(--bg)`.

### Layer 2 — ACG Planet Lines (Vertical)

Each planet draws a curved line where it crosses each angle (ASC, DSC, MC, IC):

```tsx
const PLANET_LINE_COLORS: Record<string, string> = {
  Sun:     'var(--gold)',
  Moon:    'var(--color-acqua)',
  Mercury: 'var(--color-y2k-blue)',
  Venus:   'var(--color-spiced-life)',
  Mars:    'var(--color-planet-mars)',
  Jupiter: 'var(--sage)',
  Saturn:  'var(--text-tertiary)',
  Uranus:  'var(--color-y2k-blue)',
  Neptune: 'var(--color-acqua)',
  Pluto:   'var(--color-planet-mars)',
  Chiron:  'var(--text-secondary)',
};
```

- MC/IC lines: solid stroke, opacity 0.9
- ASC/DSC lines: dashed stroke (`strokeDasharray="4 3"`), opacity 0.7
- Stroke width: 1.2 (compact: 0.8)

### Layer 3 — Paran Lines (Horizontal)
- Faint horizontal lines at paranatellonta latitudes.
- Color: `var(--surface-border)`, opacity 0.4, dashed.

### Layer 4 — Highlighted City Pin
```tsx
{highlightCity && (
  <g transform={`translate(${projectLon(highlightCity.lon)}, ${projectLat(highlightCity.lat)})`}>
    {/* Outer pulse ring */}
    <circle r={compact ? 4 : 6} fill="none" stroke="var(--color-y2k-blue)" strokeWidth="1.5" opacity="0.5">
      <animate attributeName="r" values={compact ? "4;8;4" : "6;12;6"} dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
    </circle>
    {/* Inner pin */}
    <circle r={compact ? 3 : 4} fill="var(--color-y2k-blue)" />
    {/* Score badge (fullsize only) */}
    {!compact && highlightCity.score && (
      <text y="-10" textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', fill: 'var(--color-y2k-blue)' }}>
        {highlightCity.score}
      </text>
    )}
  </g>
)}
```

### Layer 5 — Interactive Click Zone (optional)
```tsx
{interactive && (
  <rect width="100%" height="100%" fill="transparent"
    style={{ cursor: 'crosshair' }}
    onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const lat = unprojectLat(y, rect.height);
      const lon = unprojectLon(x, rect.width);
      onLocationClick?.(lat, lon);
    }}
  />
)}
```

---

## Map Projection

Use simple equirectangular (plate carrée) projection:

```ts
// Map dimensions: 1000 x 500 (SVG viewBox)
const projectLon = (lon: number) => (lon + 180) * (1000 / 360);
const projectLat = (lat: number) => (90 - lat) * (500 / 180);
const unprojectLon = (x: number, w: number) => (x / w) * 360 - 180;
const unprojectLat = (y: number, h: number) => 90 - (y / h) * 180;
```

---

## Responsive Sizing

```tsx
<div style={{
  width: '100%',
  borderRadius: compact ? 'var(--radius-sm)' : 'var(--radius-md)',
  overflow: 'hidden',
  border: '1px solid var(--surface-border)',
}}>
  <svg
    viewBox="0 0 1000 500"
    style={{ width: '100%', height: 'auto', display: 'block' }}
    preserveAspectRatio="xMidYMid meet"
  >
    {/* layers */}
  </svg>
</div>
```

---

## Where AcgMap Is Used

| Page | Mode | Props |
|------|------|-------|
| `/chart` | Full width, interactive | `natal={user} interactive onLocationClick={...}` |
| `/reading/[id]` | Full width, city pinned | `natal={user} highlightCity={destination}` |
| `/new-reading` (city result cards) | Compact preview | `natal={user} compact highlightCity={city}` |
| `/mundane` | Country boundary highlight | Future prop: `highlightCountry` |

---

## Demo Mode (`?demo=true`)

```ts
const MOCK_ACG_LINES = [
  { planet: 'Sun', angle: 'MC', longitude: 143 },
  { planet: 'Jupiter', angle: 'ASC', longitude: 98 },
  { planet: 'Venus', angle: 'IC', longitude: 225 },
];

const MOCK_CITY = { lat: 35.68, lon: 139.69, name: 'Tokyo', score: 87 };
```

---

## Design Checklist

- [ ] Component in `app/components/AcgMap.tsx` — no inline maps on any page
- [ ] All planet line colors use the canonical palette matching `ChartWheel`
- [ ] MC/IC: solid lines, ASC/DSC: dashed lines
- [ ] `compact` prop changes sizes/labels but not color logic
- [ ] Animated pulse ring on city pin
- [ ] SVG `viewBox="0 0 1000 500"` with `width="100%" height="auto"` for full responsiveness
- [ ] No hardcoded hex colors
- [ ] `?demo=true` renders with mock natal + Tokyo pin
