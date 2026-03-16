# Score Methodology — Technical Summary

## Data Sources (API Calls)

Three backend APIs feed the scoring system:

1. **`/api/mundane`** — Computes the live sky for a given `date/lat/lon`. Key fields: `worldTransits[]` (planet-to-planet aspects, each with `p1`, `p2`, `aspect`, `orb`, `applying`, `isTense`) and `parans[]`. This is the **collective sky** layer.

2. **`/api/house-matrix`** — The scoring engine. Receives `natalPlanets`, `relocatedCusps`, `acgLines`, `transits` (from mundane `worldTransits`), `parans`, and `destLat/destLon`. Returns `macroScore` (0–100), `personalScore` (0–70), `collectiveScore` (0–30), and `macroVerdict`.

3. **`/api/transits`** — Personal transits (natal chart to current sky). Raw result stored as `transitData` but **not currently used in house scoring** — only used for 12-month window derivation via `generateWindowsFromTransits()`.

## Score Decomposition

```
macroScore (0–100) = personalScore (0–70) + collectiveScore (0–30)
```

- **personalScore** — Weighted across all 12 houses using planet occupants, dignity, ACG line proximity, and cusp strength. Angular houses (1/4/7/10) weight 40%, succedent (2/5/8/11) 35%, cadent (3/6/9/12) 25%.
- **collectiveScore** — Travel-context weighted: H9 = 40%, H12 = 30%, H3 = 15%, remainder 15%. Reflects foreign travel quality.
- **globalPenalty** — Computed before house scoring: tight-orb applying hard transits (e.g. Mars sq Uranus ≤1°) subtract up to −20 pts from all house bases.

Verdicts: Highly Productive ≥80 · Productive ≥65 · Mixed ≥50 · Challenging ≥35 · Hostile <35.

## Conflict Detection (Summary API)

`/api/summary` receives `worldTransits[]` (up to 8 entries from mundane). A `travelDateConflict` fires if any transit has `isTense: true && applying !== false`. This injects a **CRITICAL OVERRIDE** into the LLM prompt: forces `score ≤ 44`, mandatory first-sentence warning, and prevents positive framing.

## What the 12-Month Window Should Mirror

Currently `generateWindowsFromTransits()` uses a simplified scoring loop. To match the matrix:

1. **For each month**, call `/api/mundane` with `date = first of month`, same destination lat/lon.
2. Pass the returned `worldTransits` into **`computeHouseMatrix()`** with the user's `natalPlanets` + `relocatedCusps`.
3. Use the resulting `macroScore` as the quality score for that month window.
4. Map: `macroScore ≥ 65` → `excellent`, `≥ 50` → `good`, `≥ 35` → `caution`, `< 35` → `avoid`.
5. Flag any window where `globalPenalty > 5` as a **Dates to Avoid** entry with the triggering transit named.

This ensures the 12-month card uses the exact same engine as the trip score ring.
