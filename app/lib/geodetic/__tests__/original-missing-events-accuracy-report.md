# Original Dashboard Missing Events Accuracy Audit

Date: 2026-05-13

## Scope

The restored dashboard imports 149 events from the original HTML dashboard. The normalized geodetic engine catalog currently contains 40 events. Matching by event date, 133 original-dashboard rows are absent from the normalized engine catalog.

This audit evaluates the missing rows as imported claims. It does not treat them as verified training data.

## Coverage

- Original dashboard events: 149
- Normalized engine events: 40
- Present in normalized catalog by date: 16
- Missing from normalized catalog by date: 133

Missing rows by type:

- earthquake: 38
- storm_cyclone: 21
- flood: 20
- compound: 17
- accident: 16
- wildfire: 8
- heatwave: 7
- aviation: 2
- industrial: 1
- explosion: 1
- volcano: 1
- winter_storm: 1

## Ephemeris Claim Audit

For missing rows, I parsed planet-degree claims from event titles, star notes, event notes, geostress/pattern text, and criteria text. I then checked those claims at 12:00 UTC on the event date using `computeRealtimePositions`.

Thresholds:

- pass: claimed planet longitude within 3 degrees
- warn: greater than 3 degrees and up to 8 degrees
- fail: greater than 8 degrees
- unverifiable: no machine-parseable planet-degree claim in the row

Event-level result after corrections:

- pass: 26
- warn: 14
- fail: 0
- unverifiable: 93

Claim-level result after corrections:

- checked claims: 163
- pass: 147
- warn: 16
- fail: 0

## Corrected Hard Failures

| Date | Event | Claim | Ephemeris result | Orb |
|---|---|---:|---:|---:|
| 1994-01-17 | Northridge earthquake M6.7 — Los Angeles | Mars 9°♊ | Mars 21.7° Capricorn | 137.27° |
| 1995-01-17 | Kobe earthquake M6.9 — Japan | Mars 11°♊ | Mars 1.3° Virgo | 80.26° |
| 2026-03-22 | Hawaii flooding — Big Island 2026 | Moon 28.1°♓ | Moon 17.7° Taurus | 49.63° |
| 2010-01-12 | Haiti earthquake M7.0 — Port-au-Prince | Venus 22°♒ | Venus 22.3° Capricorn | 29.68° |
| 2005-10-08 | Kashmir earthquake M7.6 — Pakistan/AK | Saturn 12°♋ | Saturn 9.5° Leo | 27.51° |
| 2004-12-26 | Indian Ocean earthquake & tsunami — M9.1 | Mars 25°♐ | Mars 0.6° Sagittarius | 24.43° |
| 2001-01-26 | Gujarat earthquake M7.7 — India | Saturn at ♉30° | Saturn 24.1° Taurus | 24.06° |
| 2008-05-12 | Sichuan earthquake — China 2008 | Mars 9°♋ | Mars 1.4° Leo | 22.43° |
| 2008-05-02 | Cyclone Nargis — Myanmar 2008 | Mars 4°♋ | Mars 26.1° Cancer | 22.11° |
| 1992-08-24 | Hurricane Andrew — Florida/Louisiana | Jupiter 10°♎ | Jupiter 19.9° Virgo | 20.10° |

These and the remaining hard-fail claims were corrected in `original-events.ts`. The audit now has zero claims outside the 8-degree failure threshold.

## Residual Review Warnings

The following claims remain in the 3-8 degree warning band. These should be reviewed with exact event time, landfall time, eruption time, or date range before forcing a value.

| Date | Event | Claim | Ephemeris result | Orb |
|---|---|---:|---:|---:|
| 2025-07-30 | Kamchatka M8.8 earthquake + Pacific tsunami — Russia | Saturn ~9°♈ | Saturn 1.7°♈ | 7.32° |
| 2018-09-28 | Sulawesi earthquake M7.5 + liquefaction — Palu | Mars at 28°♑ | Mars 5.0°♒ | 6.99° |
| 2012-10-29 | Hurricane Sandy — US East Coast | Mars 23°♐ | Mars 16.1°♐ | 6.87° |
| 2026-03-17 | TC Narelle — NW Australia historic cyclone | Jupiter ~22°♋ | Jupiter 15.2°♋ | 6.85° |
| 2026-03-22 | Hawaii flooding — Big Island 2026 | Mars Rx 9.4°♓ | Mars 15.7°♓ | 6.27° |
| 2017-08-25 | Hurricane Harvey — Texas | Mars 29°♌ | Mars 23.1°♌ | 5.93° |
| 1992-08-24 | Hurricane Andrew — Florida/Louisiana | Mars 13°♊ | Mars 18.8°♊ | 5.78° |
| 2004-12-26 | Indian Ocean earthquake & tsunami — M9.1 | Jupiter 11°♎ | Jupiter 16.7°♎ | 5.73° |
| 2021-07-14 | Western Europe floods 2021 | Mars 26°♌ | Mars 20.4°♌ | 5.60° |
| 2017-09-20 | Hurricane Maria — Puerto Rico 2017 | Saturn ♐27° | Saturn 21.7°♐ | 5.27° |

## Evaluation

The imported event set should be displayed as original-dashboard source data, not as a fully verified engine dataset. The hard ephemeris failures have been corrected, but many rows remain unstructured and therefore cannot yet be independently rescored.

The biggest modeling risk is score inflation: rows with incorrect planet-degree claims can still carry high PSS values and criterion counts. The normalized engine should not train on or benchmark against those rows until each row is converted into structured, ephemeris-backed features.

## Recommended Acceptance Gates

1. Keep the full 149 rows visible for parity with the original dashboard.
2. Mark the imported event table as source/restored, not verified.
3. Promote an event into the normalized engine only after:
   - event facts are source-confirmed,
   - event timestamp/location are structured,
   - all planet-degree claims are recomputed from ephemeris,
   - geodetic angle claims are recomputed from coordinates,
   - score components are regenerated rather than copied.
4. Add row-level badges: verified, needs review, failed ephemeris, or unstructured.
