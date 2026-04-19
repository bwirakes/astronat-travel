# /data/geodetic

Geodetic pattern events (ingresses, stations, eclipses, lunations) live in
the Supabase table `geodetic_events` (migration:
[supabase/migrations/20260419000000_geodetic_events.sql](../../supabase/migrations/20260419000000_geodetic_events.sql)).

Generate / refresh:

```bash
bun run generate:geodetic-patterns            # full 1976–2026
bun run generate:geodetic-patterns 2024 2026  # subset
```

Schema: see `PatternEvent` in [lib/astro/geodetic-patterns.ts](../../lib/astro/geodetic-patterns.ts).
Read by: [app/(frontend)/(app)/geodetic-patterns/actions.ts](../../app/%28frontend%29/%28app%29/geodetic-patterns/actions.ts).
