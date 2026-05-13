# Geodetic Engine Ephemeris Evaluation

Date run: 2026-05-13
Evaluator stance: data science / model evaluation, first-principles audit of source data before score tuning.

## Scope

This evaluates the downloaded dashboard `geodetic_dashboard_simplified (2).html` against the app engine, especially:

- `app/lib/scoring-engine.ts`
- `app/lib/geodetic/weather-triggers.ts`
- `app/lib/geodetic/weather-techniques.ts`
- `app/lib/geodetic/geodetic-events.ts`
- `lib/astro/transits.ts`

The app's ephemeris path is `computeRealtimePositions`, which uses Swiss Ephemeris WASM and is treated here as the NASA-correct/canonical computational source already available in the engine.

## Findings

### 1. `scoring-engine.ts` is not the primary date-risk surface

`scoring-engine.ts` does not hard-code 2026 dates, signs, or degrees. It consumes precomputed `TransitHit[]`, `UniversalSkyState`, and station contributions, then distributes them into life-event rows.

The risky information is upstream in the geodetic source catalogs and dashboard-derived tables. That is good architecture: corrections should happen in reusable source data and ephemeris validators, not inside the final tensor scoring layer.

### 2. Dashboard date/sign/degree mismatches

Downloaded dashboard issues confirmed by engine ephemeris:

- Jupiter into Leo is shown as `May 11, 2026` in the dashboard sidebar. Engine ephemeris puts Jupiter at `20.48 Cancer` on May 11 and crossing `0 Leo` around `2026-06-30T06:00Z`.
- Saturn final ingress Aries is shown as `Nov 4, 2025` in the dashboard sidebar. Engine ephemeris shows Saturn still in Pisces on that date; final Aries crossing is around `2026-02-14T00:00Z`.
- Uranus final ingress Gemini is shown as `Apr 14, 2026` in the dashboard sidebar. Engine ephemeris shows Uranus still `29.39 Taurus`; final crossing is around `2026-04-26T00:00Z`.
- Neptune retrograde station is shown as `Jun 29, 2026`. Engine speed reversal occurs around `2026-07-07T10:57Z` at `4.42 Aries`.
- Mars crossing the Aug 12 eclipse degree is listed as `2026-10-18` at `20 Leo`. Engine ephemeris has Mars only at `11.55 Leo` at noon UTC, roughly `8.45 degrees` away.

The repo now corrects these issues in the source tables used by the `/geodetic-test` dashboard and evaluator.

### 3. Canonical event tables have parity gaps

Initial parity gaps found in `weather-triggers.ts`:

- `2026-03-18` new moon, while canonical `LUNATIONS` has `2026-03-19T01:24Z`.
- `2026-12-08` new moon, while canonical `LUNATIONS` has `2026-12-09T00:51Z`.
- `2026-08-28` partial lunar eclipse, while canonical `ECLIPSES` did not include it and `LUNATIONS` contained an ordinary full moon on that date.

The test run also exposed a deeper base-computation issue: many full-moon `LUNATIONS` rows have a `sign` matching the Moon sign but a numeric `degree` roughly 180 degrees away. Since scorers consume the numeric degree, this can route full-moon activations to the opposite geodetic longitude.

These gaps have been corrected: full moons now use Moon longitude, the Aug 28 eclipse lives in `ECLIPSES`, ordinary lunations exclude eclipse-grade dates, and the stale trigger/station dates were moved to their ephemeris dates.

### 4. Scoring methodology risks

The dashboard PSS formula is additive and easy to inspect, but it is vulnerable to unverified feature stacking:

- A wrong ingress date can add a false `0.07` ingress feature.
- A wrong station date can add a false high-weight `0.15-0.20` station feature.
- A wrong eclipse-degree trigger can add a false `0.15` Mars trigger.
- A missing eclipse in canonical tables can under-score real eclipse windows while another table over-scores them as ordinary lunations.
- A full-moon degree/sign mismatch can put the right date on the wrong geodetic meridian.

The app's fused reading methodology is safer because `scoring-engine.ts` caps transit modifiers by row and keeps place affinity, transits, sky, and station layers separate. The geodetic weather catalog should adopt the same discipline: compute features from ephemeris-derived primitives, store source confidence, and only then apply weights.

## Added Evaluations

I added `__tests__/geodetic/ephemeris-source-parity.test.ts`.

The suite evaluates:

- Moon trigger parity against canonical lunation/eclipse tables.
- Mars eclipse-degree trigger rows against actual Mars longitude.
- Neptune station date against an actual speed reversal.

The tests now pass on the corrected source data and define the acceptance criteria for future geodetic catalog changes.

## Recommended Acceptance Criteria

Use these before approving source-data or scoring changes:

- All event dates that drive score weights must be generated from `computeRealtimePositions` or a reviewed canonical table.
- Static dashboard claims may be used only as editorial hypotheses until they pass ephemeris parity.
- Ingress/station/eclipses should carry exact UTC timestamps, not date-only labels, even if the UI rounds them.
- Phase 2 trigger rows must satisfy their scoring orb on the claimed date or be relabeled as estimated windows.
- Evaluation should report both binary pass/fail and magnitude of error in days/degrees.

## Fixes Applied

1. Correct full-moon numeric degrees so `degree` and `sign` describe the same body/longitude.
2. Move `2026-03-18` new moon to canonical `2026-03-19`.
3. Move `2026-12-08` new moon to canonical `2026-12-09`.
4. Add `2026-08-28T04:18Z` lunar eclipse to `ECLIPSES` and remove the ordinary full-moon duplicate.
5. Correct Neptune Rx station from `2026-06-29` to `2026-07-07`.
6. Correct the `2026-10-18 Mars crosses 20 Leo eclipse degree` trigger to `2026-11-03`.
7. Add the missing 2026 Mercury, Venus, Jupiter, Saturn, Uranus, Neptune, and Pluto station events used by the station scorer.
8. Add the unauthenticated `/geodetic-test` dashboard as a live QA surface over the ephemeris-backed data.
