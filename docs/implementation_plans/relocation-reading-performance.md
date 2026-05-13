# Relocation Reading Performance Order Of Attack

## Current Order

1. Restore the old generation contract so the reading page does not poll a pending row.
2. Time each major `runAstrocarto` step and persist `generationTimings` on new readings.
3. Make long ephemeris scans cheap by batching and paginating Supabase range reads.
4. Reuse cached daily sky ranges for transit solving instead of recomputing weekly SwissEph positions.
5. Keep trip readings on the short timing window, while relocation keeps the longer planning horizon.

## Next If Still Slow

1. Precompute global station, retrograde, ingress, and eclipse windows into dedicated tables or static JSON.
2. Query those event windows directly instead of deriving stations from daily rows at request time.
3. Split relocation into a fast core reading plus a deferred timing-detail enrichment pass.
4. Add persistent caching for user-specific transit hits keyed by natal chart, reference week, and window.

