# Prompt 10 — Performance & Caching

**Phase:** 2 | **Deadline:** May 27, 2026 | **Priority:** P2

---

## Read These First

1. **`app/api/house-matrix/`** — Most expensive endpoint. First target for caching.
2. **`app/api/natal/`** — Second target. Natal chart never changes for a user.
3. **`docs/prd/scoring-rubric.md`** — Understanding computation depth helps identify cacheable inputs.

---

## What to Build

Sub-2 second response times for repeat queries by caching expensive calculations.

---

## Caching Strategy

### Layer 1: Natal Chart (permanent)

A user's natal chart never changes. Cache it at the profile level:

```ts
// In lib/db.ts
export async function getNatalChart(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('natal_cache')
    .eq('id', userId)
    .single()

  if (profile?.natal_cache) return profile.natal_cache

  // Calculate and cache
  const natal = await fetch('/api/natal', { /* birth data */ }).then(r => r.json())
  await supabase.from('profiles').update({ natal_cache: natal }).eq('id', userId)
  return natal
}
```

Add `natal_cache JSONB` column to `profiles`:
```sql
ALTER TABLE public.profiles ADD COLUMN natal_cache JSONB;
```

### Layer 2: Search Results (TTL: 24h)

Cache house-matrix results per `(userId, destination, date)` tuple in the `searches` table. Already designed — `score_detail JSONB` column holds the full result. On subsequent requests to the same destination, return from DB instead of recalculating.

### Layer 3: Next.js Route Cache

Use Next.js `unstable_cache` for server components that fetch Supabase data:

```ts
import { unstable_cache } from 'next/cache'

export const getCachedProfile = unstable_cache(
  async (userId: string) => getProfile(userId),
  ['profile'],
  { revalidate: 3600, tags: ['profile'] }
)
```

---

## Verification

- [ ] Natal chart cached in `profiles.natal_cache` after first calculation
- [ ] Repeat destination requests served from `searches.score_detail`
- [ ] Server component data uses `unstable_cache`
- [ ] Average API response < 2s for repeat queries (measure with browser DevTools)
