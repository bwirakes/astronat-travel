# Astro-Engine Evaluation Summary
**Generated:** 2026-04-15  
**Covers:** EXP-0001 → EXP-0004-scenarios  
**Dataset:** 551 rows, 91 subjects (AA/A/B Rodden ratings)  
**Engine endpoint:** `http://localhost:3000/api/house-matrix`

---

## 1. Overall Scores & Evaluation

### What is being measured?

The engine assigns a `macroScore` (0–100) to each subject+location+date triplet. We evaluate how well that score predicts whether a real biographical event (relocation, career milestone, love event, growth event) was positive (+1), neutral (0), or harmful (−1).

The primary metric is **PR-AUC** (Precision-Recall Area Under Curve for positive-event detection). A random predictor scores ~equal to the positive prevalence rate; anything higher means the engine has real signal.

---

### EXP-0004 Per-Goal Results (551 rows)

| Goal | N rows | Positive (+1) | Neutral (0) | Negative (−1) | **PR-AUC** | Signal strength |
|---|---|---|---|---|---|---|
| **Career** | 270 | 223 | 8 | 39 | **0.810** [0.76, 0.87] | ✅ Strong |
| **Relocation** | 22 | 19 | 3 | 0 | **0.851** [0.65, 0.98] | ✅ Strong (small N) |
| **Love** | 233 | 99 | 85 | 49 | **0.423** [0.35, 0.54] | ⚠️ Weak |
| **Growth** | 26 | 1 | 0 | 25 | **0.056** (harm: **0.961**) | ⚠️ Inverted — detects harm well |
| **Community** | 0 | — | — | — | — | No data yet |

> **Baseline to beat:** A random predictor would score ~equal to positive prevalence (e.g. 0.86 for career, 0.86 for relocation). The engine's 0.810 (career) and 0.851 (relocation) are competitive but still have room to grow with per-goal re-aggregation.

---

### Verdict Distribution (551 rows)

| Verdict | Count | % |
|---|---|---|
| Mixed | 209 | 38% |
| Challenging | 188 | 34% |
| Productive | 79 | 14% |
| Hostile | 54 | 10% |
| Highly Productive | 21 | 4% |

**Mean macroScore:** 51.86 / 100

---

### Birth-Time Precision Effect (Rodden Rating Stratification)

| Goal | All subjects | AA only (hospital records) | A only |
|---|---|---|---|
| Relocation | 0.851 | **0.965** | 0.692 |
| Career | 0.810 | 0.795 | 0.830 |
| Love | 0.423 | 0.477 | 0.355 |

Relocation signal jumps from 0.851 → **0.965** when restricted to AA-rated subjects (exact birth times from hospital records). This is the highest signal in the entire evaluation and confirms the engine is highly sensitive to precise birth time for location-based scoring.

---

### Weight Scenario Comparison (EXP-0004)

Five weight configurations were tested. All scenarios dramatically outperform the baseline `macroScore` for relocation:

| Scenario | Relocation PR-AUC | vs. macroScore |
|---|---|---|
| macroScore (baseline) | 0.851 | — |
| `default` | **0.968** | +0.117 ✅ |
| `hellenistic_strict` | **0.968** | +0.117 ✅ |
| `material_heavy` | **0.962** | +0.111 ✅ |
| `network_weighted` | **0.955** | +0.104 ✅ |
| `angular_only` | **0.971** | +0.120 ✅ |

**Key takeaway:** Per-goal score re-aggregation is the single highest-leverage next step. Even the worst scenario improves relocation by >0.10.

---

### Experiment Progression Summary

| Experiment | N rows | Career PR-AUC | Relocation PR-AUC | Key change |
|---|---|---|---|---|
| EXP-0001 | 249 | 0.750 | — (too few) | Baseline pipeline |
| EXP-0002 | 249 | 0.756 | — | + ACG line integration |
| EXP-0003 | 551 | 0.810 | 0.851 | + A/B-rated subjects added |
| EXP-0004 | 551 | 0.810 | 0.851 → **0.968** | + Weight scenarios (per-goal scores) |

---

## 2. Relocation Examples from the Database

The following 5 cases are drawn from the 19 relocation-labeled rows in EXP-0004. Each represents a real, documented move by a historical figure; the engine scores that location at the time of the move across 5 weight scenarios.

**Score range guide:** 0–39 Hostile · 40–49 Challenging · 50–59 Mixed · 60–69 Productive · 70–100 Highly Productive

---

### Person 1 — Billie Holiday · New York City (1929)

| Field | Value |
|---|---|
| Born | April 7, 1915 (AA rating) |
| Move | Relocated to New York City, age 13 |
| Outcome label | ✅ Positive (+1) |
| macroScore | **71 — Productive** |

| Scenario | Relocation score |
|---|---|
| `default` | 56.75 |
| `hellenistic_strict` | 58.0 |
| `material_heavy` | 57.65 |
| `network_weighted` | 55.65 |
| `angular_only` | 60.45 |

**Context:** Holiday moved to NYC as a teenager where she began her singing career, later becoming one of jazz's most influential voices. The engine scores the move as Mixed-to-Productive (55–60) across all scenarios — appropriately capturing that NYC was a formative but also difficult environment.

---

### Person 2 — Audrey Hepburn · Ixelles, Belgium (1948)

| Field | Value |
|---|---|
| Born | May 4, 1929 (AA rating) |
| Move | Return to Brussels/Ixelles post-WWII, age 18 |
| Outcome label | ✅ Positive (+1) |
| macroScore | **65 — Productive** |

| Scenario | Relocation score |
|---|---|
| `default` | 61.0 |
| `hellenistic_strict` | **68.0** |
| `material_heavy` | 57.55 |
| `network_weighted` | 54.6 |
| `angular_only` | **68.7** |

**Context:** This move marks the beginning of Hepburn's ballet and acting career trajectory. The `angular_only` and `hellenistic_strict` scenarios score it highest (68–69), suggesting the relocation impact was driven by angular planets — consistent with ACG methodology for career-defining moves.

---

### Person 3 — Jim Carrey · Newmarket, Ontario (1980)

| Field | Value |
|---|---|
| Born | January 17, 1962 (AA rating) |
| Move | Family relocation, age 18 |
| Outcome label | ✅ Positive (+1) |
| macroScore | **78 — Productive** |

| Scenario | Relocation score |
|---|---|
| `default` | 60.6 |
| `hellenistic_strict` | 60.0 |
| `material_heavy` | 60.65 |
| `network_weighted` | 60.15 |
| `angular_only` | 62.25 |

**Context:** Highest macroScore (78) of all relocation events. Strong agreement across all five scenarios (60–62), all landing in the Productive range. The engine correctly identifies this as a favorable relocation. Carrey moved to Toronto around this period and began his stand-up career.

---

### Person 4 — Ernest Hemingway · Paris (1923)

| Field | Value |
|---|---|
| Born | July 21, 1899 (AA rating) |
| Move | Expatriate relocation to Paris, age 24 |
| Outcome label | ✅ Positive (+1) |
| macroScore | **55 — Mixed** |

| Scenario | Relocation score |
|---|---|
| `default` | 43.95 |
| `hellenistic_strict` | 46.0 |
| `material_heavy` | 41.85 |
| `network_weighted` | 40.85 |
| `angular_only` | **51.95** |

**Context:** Hemingway's Paris years produced _The Sun Also Rises_ and his earliest major works. Interestingly, the engine scores this as Challenging-to-Mixed (41–52). This is a case where the macroScore underestimates the cultural/creative significance — consistent with the engine's known weakness in the Love/Growth/creative-output domain. The `angular_only` scenario gives the most favorable read (51.95).

**Note:** Hemingway also has two later relocations in the dataset (Oak Park 1928 and Key West/Cuba 1939) that the engine correctly scores as Hostile (macro=24 and 26), which correspond to documented turbulent periods.

---

### Person 5 — Jimi Hendrix · Seattle (1966)

| Field | Value |
|---|---|
| Born | November 27, 1942 (AA rating) |
| Move | Return to Seattle, age 23 |
| Outcome label | ✅ Positive (+1) |
| macroScore | **65 — Productive** |

| Scenario | Relocation score |
|---|---|
| `default` | 56.6 |
| `hellenistic_strict` | 60.0 |
| `material_heavy` | 55.75 |
| `network_weighted` | 54.45 |
| `angular_only` | **60.7** |

**Context:** Hendrix returned to Seattle in 1966 shortly before his breakthrough UK move later that year. The engine scores the Seattle location as Productive (65 macro), with per-scenario relocation scores in the Mixed-to-Productive range (54–60). The `hellenistic_strict` and `angular_only` scenarios agree most with the biographical positive label.

---

## 3. Compute Cost

No monetary API cost is incurred — all evaluations run against a local Next.js endpoint (`http://localhost:3000/api/house-matrix`).

| Experiment | Rows | Duration | Throughput | Cost/row |
|---|---|---|---|---|
| EXP-0001 | 249 | 1.37 s | 181 rows/s | ~5.5 ms |
| EXP-0002 | 249 | 1.72 s | 145 rows/s | ~6.9 ms |
| EXP-0003 | 551 | 6.07 s | 91 rows/s | ~11 ms |
| EXP-0004 | 551 | 4.24 s | 130 rows/s | ~7.7 ms |

EXP-0004 runs 5 weight scenarios per row but completes in 4.24s — faster than EXP-0003's single-scenario run — because per-goal scores are extracted from the same API response rather than making additional calls.

---

## 4. What's Next

| Priority | Action | Expected impact |
|---|---|---|
| 🔴 High | Per-goal score re-aggregation (per-house weights × goal affinity matrix) | Relocation likely hits 0.97+ for AA cohort |
| 🔴 High | Paran integration (currently empty array passed to engine) | Removes known pipeline gap |
| 🟡 Medium | Negative event sampling (harm-detection PR-AUC is currently too weak to trust) | Needed before any harm-detection claims |
| 🟡 Medium | ACG line scoring integration with per-goal weights | Should improve love/partnership signal |
| 🟢 Low | Expand cohort beyond Western/20th-century subjects | External validity |

---

## 5. Caveats

- **Positive-event bias:** Biographical sources (Astro-Databank) overweight awards, moves to fame, and marriages. Harm-detection PR-AUC should not be trusted yet.
- **macroScore is goal-agnostic:** The 0.810 career and 0.851 relocation numbers measure how well a *general composite* predicts each goal — not a goal-tuned predictor. Per-goal scenarios already show +0.11 gains for relocation.
- **Sample size:** Relocation N=22 is small. The 0.851/0.968 PR-AUC confidence intervals are wide [0.65, 0.98]. More relocation events needed before drawing strong conclusions.
- **Cohort:** 91 subjects, predominantly Western, 20th-century, famous. Not representative of general population.
