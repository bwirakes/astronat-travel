# Original Geodetic Dashboard Issues And Fixes

Date: 2026-05-13

## Source

Original file reviewed:

`/Users/brandonwirakesuma/Downloads/geodetic_dashboard_simplified (2).html`

Rebuilt route:

`/geodetic-test`

## Structural Drift

Issue: The first rebuild preserved the general dark-console styling, but it drifted from the original HTML structure. The Event Correlations tab showed a forecast planet-position table instead of the original historical event-correlation table.

Fix:

- Rebuilt `/geodetic-test` around the original two-column console layout.
- Restored the original tab strip labels.
- Made tabs interactive with a client-side controller.
- Restored the first tab's original stat strip and table columns:
  `Date / Event / Type / Sev / Deaths / $B / PSS / Stars / Patterns / Source`.

## Missing Events

Issue: The normalized engine catalog had only 40 events, while the original HTML dashboard contained 149 event rows. The missing rows included non-weather categories such as industrial, aviation, explosion, volcano, and accident.

Fix:

- Extracted the full original 149-row event array into `original-events.ts`.
- Wired the Event Correlations tab to the restored original event table.
- Preserved the ephemeris-backed forecast and validation views separately so restored source data does not masquerade as verified engine data.

Restored original table summary:

- Total events: 149
- Severity-5: 47
- High-PSS >= 0.55: 66
- Mean PSS: 0.537
- Eclipse pair window: 23
- Total damage: $2559B

## Stale 2026 Ephemeris Dates

Issue: Several 2026 rows in the original dashboard used stale or incorrect dates/degrees for stations, lunations, and triggers.

Fix:

- Corrected Neptune retrograde station to July 7, 2026.
- Corrected Uranus direct to 27 degrees Taurus.
- Corrected Jupiter Leo ingress to June 30, 2026.
- Corrected Mars eclipse trigger timing to November 3, 2026.
- Corrected 2026 moon trigger dates and full-moon degrees against canonical lunation/eclipse tables.

Verification:

- `ephemeris-source-parity.test.ts` passes.
- `geodetic-events.test.ts` passes.
- `personal-lunations.test.ts` passes.

## Full-Moon Degree Bug

Issue: Several full moons used the opposing Sun longitude rather than the Moon longitude. This silently shifted geodetic angle matching by 180 degrees.

Fix:

- Updated canonical 2026 full-moon rows to use Moon longitude.
- Added tests that compare `MOON_CALENDAR_2026` against canonical lunation/eclipse data.

## Eclipse/Lunation Duplication

Issue: The original source mixed eclipse-grade lunations into ordinary lunation rows, including the August 28, 2026 lunar eclipse.

Fix:

- Added the missing August 28, 2026 lunar eclipse to `ECLIPSES`.
- Removed the duplicate ordinary full moon from `LUNATIONS`.
- Added a regression test that prevents eclipse-grade lunations from living in the ordinary lunation table.

## Bad Planet-Degree Claims In Restored Events

Issue: The restored 149-row event database contained hard ephemeris failures. These were too large to explain by timezone, event-hour drift, or rounding.

Examples from the original:

- Northridge 1994 claimed Mars 9 degrees Gemini; ephemeris gives Mars 21.7 degrees Capricorn.
- Kobe 1995 claimed Mars 11 degrees Gemini; ephemeris gives Mars 1.3 degrees Virgo.
- Hawaii flooding 2026 claimed Moon 28.1 degrees Pisces; ephemeris gives Moon 17.7 degrees Taurus.
- Haiti 2010 claimed Venus 22 degrees Aquarius; ephemeris gives Venus 22.3 degrees Capricorn.
- Kashmir 2005 claimed Saturn 12 degrees Cancer; ephemeris gives Saturn 9.5 degrees Leo.
- Indian Ocean tsunami 2004 claimed Mars 25 degrees Sagittarius; ephemeris gives Mars 0.6 degrees Sagittarius.

Fix:

- Corrected the hard-fail planet-degree text in `original-events.ts`.
- Removed or softened misleading star-zone claims where the corrected planet was not near the stated star.
- Updated the Validation tab to show residual review warnings instead of stale hard failures.

Post-fix ephemeris audit:

- Missing original rows by date: 133
- Parsed claims checked: 163
- Claims passing within 3 degrees: 147
- Claims in review band, 3-8 degrees: 16
- Claims failing beyond 8 degrees: 0
- Rows still unstructured/unverifiable: 93

## Residual Risk

Issue: Many original rows remain prose-only. They contain event summaries, score labels, and interpretive criteria, but not enough structured data to recompute every score.

Fix applied:

- Marked restored original data as imported/source data.
- Added a Validation tab audit showing missing-row coverage and residual ephemeris warnings.
- Added `original-missing-events-accuracy-report.md` as a durable evaluator artifact.

Remaining work:

- Convert each original row into structured event facts: exact timestamp, location, coordinates, event type, severity, and source URL.
- Recompute geodetic MC/ASC/IC/DSC claims from coordinates.
- Regenerate PSS from structured features instead of copying criterion counts.
- Promote rows into the normalized engine only after source and ephemeris checks pass.
