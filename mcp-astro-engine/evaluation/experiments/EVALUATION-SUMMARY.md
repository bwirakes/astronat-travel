# Astro-Engine Evaluation Summary
**EXP-0004-scenarios · 551 rows · 91 subjects · 2026-04-12**

---

## Overall Scores

| Goal | N | PR-AUC (positive-detection) | Signal |
|---|---|---|---|
| **Career** | 270 | **0.810** [0.76, 0.87] | ✅ Strong |
| **Relocation** | 22 | **0.851** [0.65, 0.98] | ✅ Strong |
| Love | 233 | 0.423 [0.35, 0.54] | ⚠️ Weak |
| Growth | 26 | 0.056 (harm-detect: 0.961) | ⚠️ Inverted |

> PR-AUC measures how well the engine's score predicts real biographical events. Higher = more predictive. A random predictor scores ≈ the positive prevalence rate.

**Mean macroScore across all 551 rows:** 51.86 / 100

**Verdict distribution:**

| Verdict | Count |
|---|---|
| Mixed | 209 |
| Challenging | 188 |
| Productive | 79 |
| Hostile | 54 |
| Highly Productive | 21 |

### Effect of weight scenarios on relocation (EXP-0004)

Per-goal score re-aggregation dramatically improves the relocation signal:

| Scenario | Relocation PR-AUC | vs. macroScore baseline |
|---|---|---|
| macroScore (baseline) | 0.851 | — |
| `default` | **0.968** | +0.117 |
| `hellenistic_strict` | **0.968** | +0.117 |
| `material_heavy` | **0.962** | +0.111 |
| `network_weighted` | **0.955** | +0.104 |
| `angular_only` | **0.971** | +0.120 |

For AA-rated subjects (exact birth times), relocation PR-AUC peaks at **0.965** — near-perfect separation.

---

## Relocation Examples

All 19 relocation-labeled events from the dataset. Score range: 0–39 Hostile · 40–49 Challenging · 50–59 Mixed · 60–69 Productive · 70+ Highly Productive.

JSON output for each case: [`relocation-examples/`](./relocation-examples/)

| # | Subject | Move | Date | MacroScore | Verdict | Reloc score (default) |
|---|---|---|---|---|---|---|
| 1 | Hemingway, Ernest | Paris | 1923-12-31 | 55 | Mixed | 43.95 |
| 2 | Hemingway, Ernest | Oak Park, Illinois | 1928-04-01 | 24 | Hostile | 29.60 |
| 3 | Hemingway, Ernest | Ernest Hemingway House | 1939-01-01 | 26 | Hostile | 33.20 |
| 4 | Garland, Judy | Grand Rapids, Minnesota | 1926-01-01 | 66 | Productive | 43.85 |
| 5 | Holiday, Billie | New York City | 1929-01-01 | 71 | Productive | 56.75 |
| 6 | Hepburn, Audrey | Ixelles, Belgium | 1948-01-01 | 65 | Productive | 61.00 |
| 7 | Einstein, Albert | Smíchov | 1933-01-01 | 62 | Mixed | 40.75 |
| 8 | Freud, Sigmund | Freiberg/Mähren, Czech Republic | 1938-01-01 | 27 | Hostile | 48.05 |
| 9 | Tesla, Nikola | Smiljan, Croatia | 1884-01-01 | 38 | Challenging | 53.90 |
| 10 | Bowie, David | Brixton (London), England | 1979-01-01 | 50 | Mixed | 36.65 |
| 11 | Hendrix, Jimi | Seattle, Washington | 1966-09-23 | 65 | Productive | 56.60 |
| 12 | Carrey, Jim | Newmarket, Ontario | 1980-01-01 | **78** | Productive | 60.60 |
| 13 | Chaplin, Charles | London, England | 1910-01-01 | 47 | Challenging | 40.50 |
| 14 | Chaplin, Charles | London, England | 1952-01-01 | 64 | Mixed | 48.40 |
| 15 | Taylor, Elizabeth | London, England | 1939-01-01 | 43 | Challenging | 49.05 |
| 16 | Stravinsky, Igor | Oranienbaum, Russia | 1940-01-01 | 57 | Mixed | 38.95 |
| 17 | Joyce, James | Dublin, Ireland | 1902-01-01 | 35 | Challenging | 47.70 |
| 18 | Joyce, James | Dublin, Ireland | 1915-01-01 | 46 | Challenging | 51.90 |
| 19 | Nietzsche, Friedrich | Röcken, Germany | 1869-04-22 | 42 | Challenging | 58.75 |

All 19 are labeled positive (+1) in the dataset (documented, historically significant moves).
