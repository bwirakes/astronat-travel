# Phase 0 Baseline — perf/phase-0-baseline

Captured after Phase 0 + Phase 1 + Phase 3 changes landed. This is the
"observability is wired, quick wins applied" baseline that future phases
should be measured against.

## Build environment

- Next.js: 16.2.4
- React: 19.2.4
- Bun: 1.3.10
- Build tool: Turbopack (default in Next 16)
- Build command: `bun run analyze --output` (uses `next experimental-analyze`)
- Output dir: `.next/diagnostics/analyze/`
- Stats source: `.next/diagnostics/route-bundle-stats.json`

## First-load JS by route (uncompressed bytes; expect ~30% after Brotli)

| Route                       | First-load JS | Chunks |
|-----------------------------|---------------|--------|
| /admin/[[...segments]]      | 2722 KB       | 19     |
| /app                        | 1483 KB       | 26     |
| /                           | 1418 KB       | 25     |
| /corporate-intelligence     | 1418 KB       | 25     |
| /geodetic                   | 1418 KB       | 25     |
| /map-from-home              | 1418 KB       | 25     |
| /chart                      | 1397 KB       | 24     |
| /scoring                    | 1386 KB       | 24     |
| /mundane/[slug]             | 1382 KB       | 24     |
| /weather                    | 1376 KB       | 22     |
| /weather/[eventId]          | 1374 KB       | 22     |
| /blog                       | 1356 KB       | 23     |
| /readings                   | 1345 KB       | 22     |
| /learn/geodetic-astrology   | 1298 KB       | 22     |
| /reading/new                | 1193 KB       | 20     |
| /reading/[id]               | 1114 KB       | n/a    |
| /dashboard                  | 1096 KB       | n/a    |
| /about                      | 1176 KB       | 22     |
| /couples                    | 1175 KB       | 20     |
| /mundane                    | 1156 KB       | 20     |
| /flow                       | 1152 KB       | 20     |
| /birthday                   | 1146 KB       | 20     |
| /learn/houses               | 1149 KB       | 21     |
| /learn/natal-chart          | 1144 KB       | 21     |
| /learn/aspects              | 1143 KB       | 21     |
| /learn/malefic-benefic      | 1142 KB       | 21     |
| /learn/astrocartography     | 1137 KB       | 21     |
| /login                      | 775 KB        | n/a    |

## Heaviest individual chunks

| Chunk                            | Size       |
|----------------------------------|------------|
| 0ojfrw05xxknu.js                 | 1074 KB    |
| 0zkbpobmufsk5.js                 | 556 KB     |
| 02k3ejt8.adu9.js                 | 380 KB     |
| 13-afrgq__wt..js                 | 227 KB     |
| 15ktl7ler44oc.js                 | 202 KB     |
| 0l6tmlyk452x7.js                 | 162 KB     |
| 0bzaj6xuyw344.js                 | 152 KB     |

The 1074 KB chunk appears in every route's first-load list — that's the shared
runtime + React tree + cross-route shared deps. The 556 KB chunk appears across
the marketing/blog/learn cluster.

## Observability

- `<SpeedInsights />` and `<Analytics />` mounted in `app/(frontend)/layout.tsx`.
  Vercel will start collecting RUM (LCP/INP/CLS) on first production deploy.
- `<WebVitals />` (`app/components/web-vitals.tsx`) logs each metric to console
  in dev for local sanity-check.
- `bun run analyze` regenerates this report. Reports are written to
  `.next/diagnostics/analyze/` (gitignored).

## What Phase 0 + 1 + 3 already locked in

- **Reels:** 17.8 MB of GIFs replaced with 2.32 MB of MP4s (≈86% reduction).
  `InstagramReels` already branched on extension, so no component changes.
- **Mockup routes:** 11 directories deleted (~123 files), 9 redirects removed.
- **Docs:** 95 files removed from index, `/docs/` gitignored — local-only now.
- **Fonts:** all 10 families kept; weights trimmed where unused; explicit
  `display: 'swap'`; `preload: false` on the 3 unused families and on
  decorative/display fonts.
- **`optimizePackageImports`:** `lucide-react`, `framer-motion`,
  `@radix-ui/*`, `@base-ui/react` get auto-tree-shaking.
- **Image config:** AVIF + WebP, 1-year cache TTL, `remotePatterns` derived
  from env (`NEXT_PUBLIC_SUPABASE_URL`, `S3_ENDPOINT`).
- **Lite skeleton:** `<RouteSkeleton>` (server-component, sub-1 KB) replaces
  the 254-line `<AstroAppLoader>` in `dashboard/`, `readings/`, `reading/[id]/`
  `loading.tsx` files. Heavy loader reserved for cold starts.
- **Server-only deps verified:** `stripe`, `resend`, `@notionhq/client`,
  `@aws-sdk/client-s3`, `pdf2json`, `pg`, `ffmpeg-static` only imported from
  `app/api/**/route.ts`. No client leaks.

## Recommended next moves (post-baseline)

The biggest remaining wins, ranked:

1. **The 1074 KB shared chunk.** Run `bun run analyze` (interactive UI) and
   open chunk `0ojfrw05xxknu.js`. Almost certainly framer-motion + a couple of
   barrel imports. `optimizePackageImports` will help on the next build, but
   manually replacing trivial `motion.div` decorative cases with CSS keyframes
   is the next lever.
2. **`/readings` first-load is 1345 KB** even though it's a list page. The
   page is `"use client"` end-to-end and does an unbounded
   `.select("*")` fetch inside `useEffect` — that's Phase 2 territory (RSC
   rewrite). Ship Phase 0/1/3 first, measure RUM, then reopen Phase 2.
3. **`/admin` at 2722 KB** is Payload's UI. Audit whether non-admin users can
   reach this route (they shouldn't); Payload bundle is a sunk cost for the
   admin surface.
4. **Lighthouse incognito** runs on `/`, `/dashboard`, `/readings`,
   `/reading/[seed-id]`, `/chart`. Capture LCP, TBT, INP, CLS. Save here as
   `lighthouse-baseline.md`. Numbers from Speed Insights will start arriving
   24-48 h after deploy.
