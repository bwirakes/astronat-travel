# Geodetic Weather — Backtest Report

Run: 2026-04-18T04:41:00.787Z
Cases: **31** · API: http://localhost:3000/api/geodetic-weather

## Aggregate metrics

| Metric | Value | Target |
|---|---|---|
| Tier-match accuracy | **90.3%** (28/31) | ≥ 85% |
| Layer attribution recall | **100.0%** | ≥ 80% |
| Null-control false-positive | **0.0%** (0/4) | ≤ 10% |
| Score calibration MAE | **7.0** | ≤ 15 |
| Avg regional delta | **2.0** pts | ≥ 15 |

## By category

| Category | n | tier pass |
|---|---|---|
| hydromet | 13 | 11/13 (85%) |
| geophysical | 7 | 6/7 (86%) |
| wildfire | 5 | 5/5 (100%) |
| mundane-trigger | 2 | 2/2 (100%) |
| control-calm | 4 | 4/4 (100%) |

## Per-case detail

| Case | Score | Tier | Expected | Pass | LayerRecall | Calib | RegionalΔ | Top event |
|---|---|---|---|---|---|---|---|---|
| valencia-dana-2024 | 66 | Unsettled | ≥Turbulent | ✗ | 100% | 16 | 2 | late-degree: Pluto at 29.7° Capricorn [Earth] (-22) |
| rhine-floods-2021 | 68 | Unsettled | ≥Turbulent | ✗ | 100% | 18 | — | angle-transit: Saturn on fixed ASC (orb 2.5°) (-12) |
| pakistan-floods-2022 | 64 | Unsettled | ≥Unsettled | ✓ | 100% | 6 | — | configuration: t-square — Venus, Saturn, Uranus (-22) |
| katrina-2005 | 75 | Unsettled | ≥Unsettled | ✓ | 100% | 5 | — | angle-transit: Venus on fixed ASC (orb 0.0°) (34) |
| sandy-2012 | 69 | Unsettled | ≥Unsettled | ✓ | 100% | 1 | — | configuration: yod — Moon, Neptune, Venus (-8) |
| harvey-2017 | 65 | Unsettled | ≥Unsettled | ✓ | 100% | 5 | — | late-degree: Uranus at 28.3° Aries [Fire] (-16) |
| maria-2017 | 70 | Unsettled | ≥Unsettled | ✓ | 100% | 0 | — | late-degree: Uranus at 27.6° Aries [Fire] (-6) |
| ian-2022 | 70 | Unsettled | ≥Unsettled | ✓ | 100% | 0 | — | late-degree: Pluto at 26.1° Capricorn [Earth] (-8) |
| libya-derna-2023 | 69 | Unsettled | ≥Unsettled | ✓ | 100% | 1 | — | late-degree: Pluto at 28.1° Capricorn [Earth] (-22) |
| dubai-floods-2024 | 56 | Turbulent | ≥Unsettled | ✓ | 100% | 14 | — | late-degree: Neptune at 28.5° Pisces [Water] + Scheat (1.12°) (-39) |
| cyclone-idai-2019 | 66 | Unsettled | ≥Unsettled | ✓ | 100% | 4 | — | configuration: t-square — Moon, Jupiter, Sun (-10) |
| texas-uri-2021 | 71 | Unsettled | ≥Unsettled | ✓ | 100% | 1 | — | configuration: stellium — Jupiter, Mercury, Venus (4) |
| storm-harry-2025 | 65 | Turbulent | ≥Turbulent | ✓ | 100% | 15 | — | late-degree: Neptune at 28.3° Pisces [Water] + Scheat (1.32°) (-39) |
| tohoku-2011 | 61 | Unsettled | ≥Turbulent | ✗ | 100% | 11 | — | late-degree: Uranus at 30.0° Pisces [Water] + Scheat (0.39°) (-30) |
| indian-ocean-tsunami-2004 | 73 | Unsettled | ≥Unsettled | ✓ | 100% | 3 | — | angle-transit: Sun on fixed IC (orb 0.8°) (5) |
| haiti-eq-2010 | 72 | Unsettled | ≥Unsettled | ✓ | 100% | 2 | — | late-degree: Jupiter at 28.8° Aquarius [Air] (5) |
| nepal-eq-2015 | 68 | Unsettled | ≥Unsettled | ✓ | 100% | 2 | — | late-degree: Moon at 29.4° Cancer [Water] (-8) |
| turkey-syria-eq-2023 | 56 | Turbulent | ≥Turbulent | ✓ | 100% | 6 | — | angle-transit: Saturn on fixed ASC (orb 0.3°) (-43) |
| la-palma-2021 | 73 | Unsettled | ≥Unsettled | ✓ | 100% | 3 | — | configuration: grand-trine — Mars, Saturn, True Node (8) |
| tonga-2022 | 66 | Severe | ≥Unsettled | ✓ | 100% | 4 | — | angle-transit: Mars on fixed DSC (orb 1.8°) (-16) |
| la-fires-2025 | 68 | Unsettled | ≥Unsettled | ✓ | 100% | 2 | — | late-degree: Mars at 29.6° Cancer [Water] (-14) |
| maui-2023 | 68 | Unsettled | ≥Unsettled | ✓ | 100% | 2 | — | late-degree: Pluto at 28.7° Capricorn [Earth] (-22) |
| camp-fire-2018 | 70 | Unsettled | ≥Unsettled | ✓ | 100% | 0 | — | angle-transit: Jupiter on fixed MC (orb 1.6°) (18) |
| aus-black-summer | 61 | Turbulent | ≥Unsettled | ✓ | 100% | 9 | — | paran: Sun/Uranus paran at -35.5° lat (-19) |
| pnw-heat-dome-2021 | 56 | Turbulent | ≥Unsettled | ✓ | 100% | 14 | — | angle-transit: Neptune on fixed DSC (orb 0.3°) (-33) |
| arab-spring-tunis-2011 | 56 | Turbulent | ≥Turbulent | ✓ | 100% | 6 | — | angle-transit: Mars on fixed ASC (orb 0.2°) (-42) |
| beirut-2020 | 67 | Unsettled | ≥Unsettled | ✓ | 100% | 3 | — | configuration: stellium — Pluto, Jupiter, Saturn (-18) |
| nyc-null-2018 | 63 | Turbulent | ≥Calm | ✓ | 100% | 22 | — | configuration: t-square — Venus, Uranus, Mars (-22) |
| reykjavik-null-2019 | 73 | Unsettled | ≥Calm | ✓ | 100% | 12 | — | angle-transit: Mars on fixed DSC (orb 1.6°) (-19) |
| singapore-null-2016 | 65 | Unsettled | ≥Calm | ✓ | 100% | 20 | — | configuration: t-square — Sun, Jupiter, Saturn (-16) |
| buenos-aires-null-2017 | 74 | Unsettled | ≥Calm | ✓ | 100% | 11 | — | late-degree: Mars at 29.4° Taurus [Earth] (-14) |

## Tier shifts fired

- **storm-harry-2025** +1: OOB Mars + OOB Moon combo
- **tonga-2022** +2: OOB malefic on fixed angle (Mars@DSC); OOB Mars + OOB Moon combo; 9 planets on one side of nodal axis
- **aus-black-summer** +1: 8 planets on one side of nodal axis
- **nyc-null-2018** +1: 8 planets on one side of nodal axis
