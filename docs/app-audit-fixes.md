# (app) Section Audit — Fix List

Tracks all fixes derived from the UX/frontend audit of `app/(frontend)/(app)/`.
Status legend: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked/needs user decision

---

## P0 — Security / Correctness

- [x] **Restore `middleware.ts`** — renamed back from `.bak`; (app) routes protected again.
- [x] **Remove dead `/backtest` entry** from `PROTECTED_PREFIXES` in middleware.
- [x] **Dashboard guest data leak** — removed unauthenticated fallback branch in `dashboard/page.tsx`; middleware now guarantees `user`.
- [ ] **Verify `/login?next=` param handling** in `(auth)/login` so middleware redirects land correctly.

## P1 — Navigation & Routing

- [x] **Add shared `<BackButton>`** component at `components/app/back-button.tsx` — uses `router.back()` with configurable fallback.
- [x] **Integrate BackButton** on: birthday, goals, mundane, reading/[id]. Profile/chart/couples/readings already use DashboardLayout's back. Cleaned orphan `ArrowLeft` imports.
- [x] **Smarter DashboardLayout back** — prefers `router.back()` when history exists; falls back to sensible parent for `/reading/*`, `/learn/*`, `/mundane/*`.
- [ ] **Breadcrumbs / back on learn/*** — learn sub-pages rely on Navbar only; add BackButton or breadcrumb row (9 files, deferred to next pass).
- [ ] **Reconcile plural/singular** — decide canonical: `/readings` list + `/reading/[id]` detail; align not-found fallbacks.
- [ ] **Document short-id → "most recent" fallback** in `reading/[id]/page.tsx` or remove it.
- [ ] **Flow deep-link guards** — validate `?step=` range; redirect invalid steps to `?step=1`.

## P1 — CLS / Perceived Speed

- [x] **reading/[id] loading.tsx** — added skeleton matching the final header/grid layout. Full-page spinner path inside the component is now a secondary fallback.
- [ ] **reading/[id]** — wrap narrative section in `<Suspense>` with section-level skeleton; stop full remount when narrative resolves.
- [ ] **HomeClient (dashboard)** — pre-allocate card heights so GSAP animation doesn't reflow post-hydration.
- [x] **readings list** — added `readings/loading.tsx` with card-grid skeleton.
- [x] **dashboard loading.tsx** — added skeleton.
- [ ] **Remaining `loading.tsx` + `error.tsx`** per segment: chart, learn, mundane, profile, goals.
- [ ] **Birthday year buttons** — fix width so bg swap doesn't reflow text.
- [ ] **Flow `<Image>` dimensions** — add explicit `width`/`height` or `fill` + aspect wrapper everywhere.

## P1 — Performance

- [ ] **reading/[id] tab panels** — `dynamic({ ssr:false })` for off-screen tabs: timing, relocation, geodetic, ACG map (heavy).
- [ ] **HomeClient GSAP** — extract animations to `dynamic()` component.
- [ ] **Learn pages SVG+GSAP** (natal-chart 604, houses 525, aspects 444) — lazy-load chart visuals via `dynamic({ ssr:false, loading: <Skeleton/> })`.
- [ ] **Flow (795 LOC client)** — consider splitting onboarding into `/flow/[step]` route segments.
- [ ] **Narrative fetch waterfall** — move narrative fetch server-side via RSC (parallel with reading fetch) instead of post-mount client `useEffect`.
- [ ] **Error boundaries** on inline `fetch()` calls (narrative, geocode, billing) — add retry or user-visible error state.

## P2 — Responsive / Mobile

- [x] **reading/[id]** — replaced custom `min-[370px]:grid-cols-2` with `sm:grid-cols-2`.
- [ ] **reading/[id]** — wrap hero with `overflow-hidden` to contain `clamp(20rem, 40vw, 40rem)` decorative text.
- [ ] **Scale horizontal padding** — `px-4 md:px-8 lg:px-12` on pages currently using flat `px-4`: reading, chart, readings, mundane, learn/*.
- [ ] **Learn SVG viewBox** — make natal-chart/houses/constellations SVGs responsive via `viewBox` + `preserveAspectRatio` (wrapper w/ aspect ratio).
- [ ] **Flow page style harmonization** — replace inline `style={{fontSize: clamp(...)}}` with Tailwind responsive text classes where possible.

## P2 — Data / State

- [ ] **Flow onboarding persistence** — currently `localStorage` pre-OAuth; survives only same browser. Persist draft to DB keyed by anon id, or pass payload via `?next=` query.
- [ ] **Goals server-side `redirect('/flow')`** — duplicates middleware; remove once middleware restored.
- [ ] **Middleware protected list** — drive from shared constant exported from `lib/auth/protected-routes.ts` (single source of truth).

## P3 — Cleanup

- [ ] **Remove unused `/backtest` references** repo-wide (follow-up to middleware cleanup).
- [ ] **Document `dynamicParams: false`** on `/mundane/[slug]` or switch to ISR so admin-added charts don't require redeploy.

---

## Top-5 execution order

1. Middleware restore (P0) — pending user confirm
2. BackButton + integration (P1 nav)
3. reading/[id] skeleton + Suspense + lazy tabs (P1 CLS + perf)
4. Mobile breakpoint + overflow fixes (P2 responsive)
5. loading.tsx skeletons + lazy GSAP (P1 CLS + perf)
