# Relocation Reading Performance Order Of Attack

## Current Order

1. Restore the old generation contract so the reading page does not poll a pending row.
2. Time each major `runAstrocarto` step and persist `generationTimings` on new readings.
3. Make long ephemeris scans cheap by batching and paginating Supabase range reads.
4. Reuse cached daily sky ranges for transit solving instead of recomputing weekly SwissEph positions.
5. Keep trip readings on the short timing window, while relocation keeps the longer planning horizon.
6. Treat stations and retrograde windows as global event lookups from precomputed constants instead of deriving them from daily ephemeris rows inside each reading.
7. Serve universal daily ephemeris ranges from a generated 2024-2035 static bundle before falling back to `ephemeris_daily`.

## Next If Still Slow

1. Generate ingress/aspect sky-weather constants from the same script path so `computeUniversalSky` can become mostly date lookup.
2. Split relocation into a fast core reading plus a deferred timing-detail enrichment pass.
3. Add persistent caching for user-specific transit hits keyed by natal chart, reference week, and window.
