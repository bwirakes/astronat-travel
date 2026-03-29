# Prompt 19b — ACG Computation Engine (Accurate Lines)

**Phase:** 1 | **Priority:** P1 | **Depends on:** Prompt 19 (AcgMap scaffold)

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system.
2. **`app/globals.css`** — CSS tokens.
3. **`docs/prompts/19-acg-map-component.md`** — The visual component scaffold.
4. **`app/components/AstroMap.tsx`** — Reference implementation (Leaflet). Lines 50–163 contain the astronomy helpers that **already work correctly** for the Leaflet map. Port these into the SVG `AcgMap`.
5. **`app/components/AcgMap.tsx`** — Current SVG component. Lines 83–104 contain a simplified stub that draws all lines as verticals. **This prompt replaces that stub with accurate computation.**

---

## Context: What's Wrong Today

The current `AcgMap.tsx` draws **all 44 lines as straight verticals**. This is astronomically incorrect:

- **MC/IC lines** are correctly vertical (they represent geographic meridians). ✅
- **ASC/DSC lines** should be **sine-wave curves** that sweep across the map. They represent the horizon plane intersecting the planet's position, and their shape depends on the planet's **declination (δ)**. The current code draws them as straight verticals. ❌

The existing `AstroMap.tsx` (Leaflet version, lines 392–459) already has the correct spherical trigonometry. This prompt documents how to port that math into the SVG renderer.

---

## Step 0 — Input Data Requirements

The `AcgMap` component must accept **equatorial coordinates**, not just ecliptic longitude.

```ts
export interface AcgMapProps {
  /** User's natal data — used to derive ACG line positions */
  natal: NatalData;
  /** Birth datetime as ISO 8601 UTC string — REQUIRED for accurate lines */
  birthDateTimeUTC: string;
  /** Birth longitude in decimal degrees (east positive) — REQUIRED */
  birthLon: number;
  // ... existing props (highlightCity, compact, interactive, onLocationClick)
}
```

> [!IMPORTANT]
> Without `birthDateTimeUTC` and `birthLon`, ACG lines cannot be computed accurately.
> The component should fall back to a "demo mode" with mock line positions (current behaviour) when these are missing.

---

## Step 1 — Compute Greenwich Sidereal Time (GST)

GST is the sidereal time at the prime meridian at the moment of birth. It tells us which part of the sky is overhead at Greenwich.

```ts
/** Julian Day Number from a UTC Date */
function julianDay(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

/**
 * Greenwich Mean Sidereal Time in degrees (0–360).
 * IAU 2000 polynomial — same formula used by Swiss Ephemeris.
 */
function computeGMST(utcDate: Date): number {
  const JD = julianDay(utcDate);
  const T  = (JD - 2451545.0) / 36525.0;
  const gmst =
    280.46061837 +
    360.98564736629 * (JD - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  return ((gmst % 360) + 360) % 360;
}
```

This is already implemented in `AstroMap.tsx:61`.

---

## Step 2 — Compute RAMC (Right Ascension of Midheaven)

RAMC = the RA on the observer's local meridian at birth.

```
RAMC = GMST + birth_longitude
```

```ts
function computeRAMC(utcDate: Date, birthLonDeg: number): number {
  return ((computeGMST(utcDate) + birthLonDeg) % 360 + 360) % 360;
}
```

Already implemented in `AstroMap.tsx:75`.

---

## Step 3 — Convert Ecliptic → Equatorial Coordinates

The natal API returns **ecliptic longitude (λ)**. ACG needs **Right Ascension (α)** and **Declination (δ)**.

### Right Ascension (α)

```ts
/**
 * Ecliptic longitude → Right Ascension
 * tan(α) = sin(λ) · cos(ε) / cos(λ)
 * where ε = obliquity of the ecliptic ≈ 23.4393°
 */
function eclToRA(eclLonDeg: number): number {
  const λ = eclLonDeg * (Math.PI / 180);
  const ε = 23.4393 * (Math.PI / 180);
  const ra = Math.atan2(Math.sin(λ) * Math.cos(ε), Math.cos(λ));
  return ((ra * (180 / Math.PI)) % 360 + 360) % 360;
}
```

### Declination (δ)

```ts
/**
 * Ecliptic longitude → Declination
 * sin(δ) = sin(β)·cos(ε) + cos(β)·sin(ε)·sin(λ)
 * For planets near ecliptic, β ≈ 0, so:
 * sin(δ) = sin(ε) · sin(λ)
 */
function computeDec(eclLonDeg: number, eclLatDeg: number = 0): number {
  const λ = eclLonDeg * (Math.PI / 180);
  const β = eclLatDeg * (Math.PI / 180);
  const ε = 23.4393 * (Math.PI / 180);
  const sinDec = Math.sin(β) * Math.cos(ε) +
                 Math.cos(β) * Math.sin(ε) * Math.sin(λ);
  return Math.asin(sinDec) * (180 / Math.PI);
}
```

Both already implemented in `AstroMap.tsx:84,100`.

---

## Step 4 — MC & IC Lines (Vertical)

MC and IC are the simplest. A planet is on the MC at the geographic longitude where its RA equals the local sidereal time.

```
MC_longitude = RAMC − planet_RA    (normalised to −180…180)
IC_longitude = MC_longitude + 180°
```

```ts
function mcLonFromRAMC(RAMC: number, planetRA: number): number {
  const raw = RAMC - planetRA;
  return ((raw + 540) % 360) - 180;
}
```

**Rendering**: These are perfectly **vertical straight lines** from pole to pole. Draw as `<line x1={x} y1={0} x2={x} y2={500} />`.

---

## Step 5 — ASC & DSC Lines (The Curves) ⭐ KEY FORMULA

This is where the magic happens. The horizon equation from spherical trigonometry:

$$\cos(H) = -\tan(\phi) \cdot \tan(\delta)$$

Where:
- **H** = Local Hour Angle (the angular distance between the planet and the local meridian)
- **φ** = Geographic latitude (what we're solving for at each longitude)
- **δ** = Planet's declination (computed in Step 3)

### Algorithm

For each planet, sweep through all 360° of Earth's longitude in 2–3° steps:

```ts
function computeAscDscCurve(
  mcLon: number,           // MC longitude of this planet
  decDeg: number,          // Declination of this planet
  angle: 'ASC' | 'DSC'
): Array<{ lat: number; lon: number }> {
  const sign = angle === 'ASC' ? -1 : 1;
  const decRad = decDeg * (Math.PI / 180);
  const points: Array<{ lat: number; lon: number }> = [];

  for (let latDeg = -75; latDeg <= 75; latDeg += 2) {
    const φ = latDeg * (Math.PI / 180);
    const tanPhi_tanDec = Math.tan(φ) * Math.tan(decRad);

    // Circumpolar check: planet never rises/sets at this latitude
    if (Math.abs(tanPhi_tanDec) > 1) continue;

    const H_rad = Math.acos(-tanPhi_tanDec);
    const H_deg = H_rad * (180 / Math.PI);

    // ASC: planet is east of meridian (rising)  → lon = MC - H
    // DSC: planet is west of meridian (setting) → lon = MC + H
    const ptLon = mcLon + sign * H_deg;
    const normLon = ((ptLon + 540) % 360) - 180;

    points.push({ lat: latDeg, lon: normLon });
  }

  return points;
}
```

### Rendering as SVG `<polyline>`

```tsx
{ascDscPoints.length > 2 && (
  <polyline
    points={ascDscPoints.map(p =>
      `${projectLon(p.lon)},${projectLat(p.lat)}`
    ).join(' ')}
    fill="none"
    stroke={color}
    strokeWidth={compact ? 0.8 : 1.2}
    strokeDasharray={dash}
    opacity={opacity}
  />
)}
```

> [!WARNING]
> **Wrap-around handling**: When the curve crosses the ±180° boundary, split it into separate segments to avoid a line being drawn across the entire map. Check for jumps > 180° between consecutive points and split there.

---

## Step 6 — Paran Lines (Horizontal)

Paran lines represent latitudes where **two planets are simultaneously angular**. They are drawn as **faint horizontal dashed lines**.

### Computation

A paran occurs at the latitude where Planet A is rising while Planet B is culminating (or other angular combinations). The latitude is found by:

$$\cos(H_A) = -\tan(\phi) \cdot \tan(\delta_A)$$
$$\cos(H_B) = -\tan(\phi) \cdot \tan(\delta_B)$$

...and solving for the φ where `H_A + H_B = 360°` (or 0°, 180°, etc.).

For the MVP, draw paran lines at the **circumpolar boundary** latitudes for each planet:

```ts
// The latitude where a planet becomes circumpolar
// (never rises or always stays above horizon)
const paranLat = 90 - Math.abs(decDeg);
```

Draw these as faint horizontal lines at `90 - |δ|` and `-(90 - |δ|)`.

---

## Step 7 — Full Line Generation Pipeline

```ts
interface AcgLine {
  planet: string;
  angle: 'MC' | 'IC' | 'ASC' | 'DSC';
  // MC/IC: single longitude value → vertical line
  longitude?: number;
  // ASC/DSC: array of (lat, lon) points → polyline curve
  curve?: Array<{ lat: number; lon: number }>;
  color: string;
  declination: number;
}

function computeAllAcgLines(
  natal: NatalData,
  birthDateTimeUTC: string,
  birthLon: number
): AcgLine[] {
  const utcDate = new Date(birthDateTimeUTC);
  const RAMC = computeRAMC(utcDate, birthLon);
  const lines: AcgLine[] = [];

  const planets = [
    'sun', 'moon', 'mercury', 'venus', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'
  ] as const;

  for (const p of planets) {
    const point = natal[p];
    if (!point) continue;

    const name = p.charAt(0).toUpperCase() + p.slice(1);
    const ra  = eclToRA(point.longitude);
    const dec = computeDec(point.longitude);
    const color = PLANET_LINE_COLORS[name] || 'var(--text-tertiary)';

    // MC (vertical)
    const mcLon = mcLonFromRAMC(RAMC, ra);
    lines.push({ planet: name, angle: 'MC', longitude: mcLon, color, declination: dec });

    // IC (vertical, opposite)
    const icLon = ((mcLon + 180 + 540) % 360) - 180;
    lines.push({ planet: name, angle: 'IC', longitude: icLon, color, declination: dec });

    // ASC (curve)
    const ascCurve = computeAscDscCurve(mcLon, dec, 'ASC');
    lines.push({ planet: name, angle: 'ASC', curve: ascCurve, color, declination: dec });

    // DSC (curve)
    const dscCurve = computeAscDscCurve(mcLon, dec, 'DSC');
    lines.push({ planet: name, angle: 'DSC', curve: dscCurve, color, declination: dec });
  }

  return lines;
}
```

---

## Step 8 — SVG Rendering Rules

| Line Type | Shape | Stroke | Opacity | Notes |
|-----------|-------|--------|---------|-------|
| MC | `<line>` vertical | Solid | 0.9 | Pole to pole |
| IC | `<line>` vertical | Dashed `10 5` | 0.7 | Pole to pole |
| ASC | `<polyline>` curve | Dashed `6 3` | 0.7 | Sine wave, splits at ±180° |
| DSC | `<polyline>` curve | Dashed `2 5` | 0.5 | Mirror of ASC |

**Labels**: Place small planet glyph + angle abbreviation (MC, IC, AC, DC) at the top and midpoint of each line. Use `PLANET_LINE_COLORS` from `AcgMap.tsx`.

---

## Step 9 — Component Props Update

The updated `AcgMap` props should be:

```ts
interface AcgMapProps {
  natal: NatalData;
  birthDateTimeUTC?: string;
  birthLon?: number;
  highlightCity?: { lat: number; lon: number; name: string; score?: number };
  compact?: boolean;
  interactive?: boolean;
  onLocationClick?: (lat: number; lon: number) => void;
}
```

When `birthDateTimeUTC` and `birthLon` are provided → use accurate computation.
When missing → fall back to current simplified vertical-only rendering (demo mode).

---

## Verification Plan

### Visual Validation
1. **MC/IC sanity**: The Sun's MC line should pass through the **subsolar point** at the moment of birth (the longitude where the sun was directly overhead).
2. **ASC/DSC shape**: The curves should look like **sine waves**. The amplitude of the wave is controlled by the planet's declination. A planet at 0° declination produces a nearly flat line along the equator. A planet at ±23° declination produces the widest wave.
3. **Cross-reference**: Compare the output visually against <https://astro.com> ACG maps for the same birth data.

### Automated Tests
- `bun run build` — ensure no SSR crashes.
- Unit test: For Sun at 0° Aries (RA ≈ 0°, Dec ≈ 0°) at midnight UTC with birth longitude 0°, the MC line should be at approximately 0° longitude.

---

## Design Checklist

- [ ] `computeAscDscCurve()` function in `AcgMap.tsx`
- [ ] ASC/DSC rendered as `<polyline>` curves, not vertical `<line>` elements
- [ ] MC/IC remain as vertical `<line>` elements
- [ ] Wrap-around split at ±180° for curves
- [ ] `birthDateTimeUTC` and `birthLon` props added to `AcgMapProps`
- [ ] Fallback demo mode when birth data is missing
- [ ] Paran lines at circumpolar boundary latitudes
- [ ] Labels: planet glyph + angle abbreviation on each line
- [ ] All colors from `PLANET_LINE_COLORS` (no hardcoded hex)
- [ ] Visual comparison against reference ACG map (astro.com)
