# 01b — Location Enrichment for AA-Rated Subjects

**Status:** Draft for review
**Owner:** TBD
**Depends on:** `01-dataset-sourcing.md` (Astro-Databank AA extraction)
**Consumed by:** `02-negative-sampling.md`, `03-feature-schema.md`

---

## 1. Purpose

Astro-Databank gives us AA-rated **birth data** but only sparse, inconsistent **location and life-event data** after birth. The geodetic and relocation engines require continuous residence history so we can:

1. Generate temporal negative controls (quiet years in a city where an event later occurred).
2. Pair every tagged life event with the subject's actual location on that date.
3. Produce a Feature Vector `X` at any `(subject, datetime, location)` triple.

This document defines the **evidence tiers, schema, sources, and validation protocol** for that enrichment layer. Nothing here specifies the ML model itself — this is purely about what goes into the pandas DataFrame before `train_test_split`.

---

## 2. Location Evidence Tiers

Rodden's AA/A/B/C applies to birth time. We need the analogue for location/residence claims. Without this, L-AA birth data will get silently mixed with Wikipedia-rumor addresses and the model will train on noise we can't detect.

| Tier | Evidence type | Examples | Use in training |
|------|---------------|----------|-----------------|
| **L-AA** | Primary legal document tied to subject by name + date | Lease, deed, tax filing, passport stamp, census entry, marriage/death certificate with address, voter roll, military service record | ✅ Phase 1 & beyond |
| **L-A** | Contemporaneous dated source authored at the location | Newspaper dateline, autobiography entry with month/year, published letter with location header, diplomatic cable | ✅ Phase 1 & beyond |
| **L-B** | Credible secondary biography that cites a primary source | Academic biography with footnote to archival material | ⚠️ Phase 2 robustness set only |
| **L-C** | Uncited secondary account | Wikipedia prose without citation, fan sites, obituaries written long after | ❌ Excluded from training; may be used for negative-sample geography generation |
| **L-DD** | "Dirty data" — conflicting sources, no resolution | Two biographies disagree on year of move, no tiebreaker | ❌ Rejected entirely |

**Rule:** A training record's effective tier is the **minimum** of (birth rating, location rating). An AA birth + L-C residence = L-C record and does not enter Phase 1.

**Open question for review:** Should L-B be admitted to Phase 1 if the cited primary source is verifiable (e.g., we can read the footnote)? Proposal: yes, but audit a 10% sample manually.

---

## 3. Schema

Two record types. Both live in SQLite/Postgres alongside the Astro-Databank extract, keyed by `subject_id`.

### 3.1 `residence_record`

Represents "subject lived at location L over interval [start, end]."

```
residence_record
├── id                  UUID
├── subject_id          FK → subjects
├── location_name       string               ("Paris, France")
├── geoname_id          int                  (GeoNames canonical ID)
├── latitude            float
├── longitude           float
├── country_iso         string (ISO 3166-1)
├── start_date          ISO date | null
├── start_precision     enum: day|month|year|decade|unknown
├── end_date            ISO date | null      (null ≠ unknown; see below)
├── end_precision       enum: day|month|year|decade|unknown|ongoing
├── end_is_open         bool                 (true = still residing at last known date)
├── evidence_tier       enum: L-AA|L-A|L-B|L-C|L-DD
├── sources             JSON array of Source objects
├── confidence          float [0,1]          (enrichment pipeline self-score)
├── notes               text
└── created_at, updated_at
```

`Source` object:
```
{
  "type": "wikidata|wikipedia|newspaper|book|archive|manual",
  "url": "...",
  "citation": "Baker, C. (1969). Ernest Hemingway: A Life Story, p.142",
  "retrieved_at": "2026-04-12T00:00:00Z",
  "extracted_by": "wikidata_sparql_v1|geoparser_v2|manual",
  "raw_snippet": "lived at 113 rue Notre-Dame-des-Champs from 1924"
}
```

**Semantics of nulls:**
- `start_date = null` → subject was present by `end_date` but start unknown
- `end_date = null` + `end_is_open = true` → last confirmed presence, still likely there
- `end_date = null` + `end_is_open = false` → endpoint unknown; treat as uncertain
- `start_precision = "decade"` with `start_date = 1920-01-01` → "sometime in the 1920s"

### 3.2 `event_record`

Represents a tagged life event with a date and (ideally) a location.

```
event_record
├── id                  UUID
├── subject_id          FK → subjects
├── event_type          enum: marriage|divorce|career_peak|publication|birth_child|
│                             death_loved_one|relocation|illness|legal|award|…
├── goal_mapping        int [1–9]            (maps to AstroNat's 9 Life Goals)
├── event_date          ISO date
├── event_precision     enum: day|month|year
├── location_geoname_id int | null
├── location_evidence   enum: L-AA|L-A|L-B|L-C|null
├── sources             JSON array of Source
├── magnitude           float | null         (optional subjective strength, for regression targets)
└── notes
```

`goal_mapping` will be defined in a sibling doc so event taxonomies stay synced with the 9 goals — not frozen here.

### 3.3 Derived view: `subject_location_timeline`

Materialized view that, for every subject, resolves residence records into a non-overlapping timeline with gap markers. Used by the negative sampler. Implementation detail, defined in `02-negative-sampling.md`.

---

## 4. Sources & Extraction Strategy

Ranked by expected records-per-engineering-hour.

### 4.1 Wikidata (primary automated source)

Most AA subjects have Wikidata entries. The SPARQL endpoint is free, rate-limited, and returns structured data with provenance.

**Relevant properties:**

| Property | Meaning | Tier if qualifiers present |
|----------|---------|---------------------------|
| P19 | place of birth | Already have (Astro-Databank) |
| P20 | place of death | L-A if dated, L-B otherwise |
| P551 | residence | **L-A if has P580 start + P582 end**, else L-C |
| P69 | educated at | L-B (infer city + attendance years) |
| P108 | employer | L-B (infer work city + tenure) |
| P937 | work location | L-B |
| P26 | spouse (with P580) | L-A for marriage date; location separate |
| P39 | position held (with P580/P582) | L-A for officeholders |

**Example query — residences with intervals for a subject:**

```sparql
SELECT ?place ?placeLabel ?start ?end ?coord WHERE {
  wd:Q23434 p:P551 ?stmt .          # Q23434 = Ernest Hemingway
  ?stmt ps:P551 ?place .
  OPTIONAL { ?stmt pq:P580 ?start . }
  OPTIONAL { ?stmt pq:P582 ?end . }
  OPTIONAL { ?place wdt:P625 ?coord . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
```

**Example query — all AA-relevant subjects with any residence data (bulk):**

```sparql
SELECT ?subject ?subjectLabel ?place ?placeLabel ?start ?end WHERE {
  VALUES ?subject { wd:Q23434 wd:Q7199 wd:Q882 ... }   # chunked list of AA subjects
  ?subject p:P551 ?stmt .
  ?stmt ps:P551 ?place .
  OPTIONAL { ?stmt pq:P580 ?start . }
  OPTIONAL { ?stmt pq:P582 ?end . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
```

**Tier assignment rule for Wikidata output:**
- Has both P580 and P582 with at least year precision → **L-A**
- Has one of P580/P582 → **L-B** (incomplete interval)
- No qualifiers → **L-C**

**Expected coverage:** ~60–70% of AA subjects will return at least one P551 or P108 record. Historical figures (pre-1900) coverage drops to ~30–40%.

**Implementation location:** `mcp-astro-engine/etl/wikidata_residence.py`
**Rate limits:** 5 concurrent requests, 60 req/min sustained. Use WDQS REST API with `User-Agent: astronat-research/0.1 (contact email)`.

### 4.2 Wikipedia biography geoparsing (fallback for Wikidata gaps)

For subjects where Wikidata is thin, parse the "Early life," "Career," and "Personal life" sections of the English Wikipedia article.

**Pipeline:**
1. Fetch article via Wikipedia REST API.
2. Extract prose sections (not infoboxes — those duplicate Wikidata).
3. spaCy NER for `GPE` + `DATE` entities.
4. For each sentence, pair the nearest `GPE` with the nearest `DATE` (within 40 tokens).
5. Geocode `GPE` via GeoNames API (respect 4-req/sec limit, cache aggressively).
6. Normalize date ("the early 1920s" → `start_date=1920, start_precision=decade`).
7. Check for citation footnote in the same sentence → if present, tier up to **L-B**, else **L-C**.

**Known failure modes — document in output, don't silently accept:**
- Same sentence mentions multiple cities (which does the date apply to?)
- Fictional locations from novels discussed in prose ("he set the novel in Cuba")
- Historical context not about the subject ("Paris was occupied in 1940")
- Pronoun resolution across paragraphs

Flag these records with `confidence < 0.5` and exclude from training unless promoted by manual review.

**Implementation location:** `mcp-astro-engine/etl/wiki_geoparse.py`
**Libraries:** `spacy` (en_core_web_trf), `geonames` client, `dateparser`.

### 4.3 Newspapers & periodical archives (manual for top cohort)

For the 200 highest-profile AA subjects, manually search newspapers.com / NYT TimesMachine / ProQuest for datelines. Every dateline of the form "CITY, MONTH DAY — By [subject]" is **L-A** and atomic.

Worth the human time only for subjects who will anchor our validation set. Tracked in a Google Sheet, exported to CSV, imported via `mcp-astro-engine/etl/import_manual_csv.py`.

### 4.4 Domain-specific structured databases

One-off scrapers per domain; only build when the subject cohort justifies it.

| Database | Subject class | Yield | Tier | Priority |
|----------|---------------|-------|------|----------|
| IMDb | Actors, directors | Filming location + dates (proxy for residence during shoot) | L-B | High — huge subject count |
| Baseball-Reference, Basketball-Reference, Pro-Football-Reference | Athletes | Team-city by season | L-A | High — clean structured data |
| SEC EDGAR | US CEOs & executives | Address of record per annual filing | L-AA | Medium |
| Grove Music Online | Classical musicians | Concert tours with dates/cities | L-A | Low (paywalled) |
| Ancestry / FamilySearch | Pre-1950 subjects | Decennial US census, immigration records | L-AA | High for older cohort |
| SSA Death Index | Deceased US subjects | Last residence | L-AA | Low (endpoint only) |
| Peerage.com | British aristocracy | Estate records | L-B | Low (niche) |

### 4.5 Autobiographies & authorized biographies (manual)

Highest quality non-primary source. Time-consuming. Reserve for the ~50-subject hand-curated validation cohort (see §6). A well-indexed biography yields 20–100 dated location records per subject.

### 4.6 FOIA / archival requests

FBI files, passport application archives (NARA), diplomatic records. Months of lag. Only pursue for subjects where the ROI is uniquely high — typically not worth it for training data, occasionally worth it for celebrity validation cases.

---

## 5. Enrichment Pipeline

```
┌─────────────────────┐
│ Astro-Databank AA   │  subjects + birth data
│ extract (N subjects)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Wikidata SPARQL     │  P19, P20, P551, P69, P108, P26, P39
│ (batched by 50 QIDs)│  → residence_record, event_record rows
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Wikipedia geoparse  │  fills subjects with <2 Wikidata residences
│ (gap filler)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Domain DBs          │  conditional on subject class
│ (IMDb, sports refs) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Manual CSV import   │  top 200 subjects, newspaper datelines
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Conflict resolver   │  overlapping intervals, source disagreement
│ → L-DD or merged    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ subject_location_   │  materialized timeline per subject
│ timeline view       │
└─────────────────────┘
```

**Conflict resolution rules (draft):**
1. Higher tier always wins (L-AA beats L-A beats L-B …).
2. Within same tier, more recent `retrieved_at` wins if sources are the same type.
3. Within same tier, different source types → merge as overlapping residences (subject may genuinely have had two concurrent addresses).
4. Irreconcilable conflicts within same tier → mark both **L-DD**, exclude, log for manual review.

---

## 6. Validation Protocol

Before any enriched data enters training, validate the enrichment pipeline itself against a hand-curated gold set.

**Gold set construction:**
- Pick 50 subjects spanning eras (pre-1900: 10, 1900–1950: 20, 1950–2000: 15, post-2000: 5) and professions.
- Hand-curate residence history and event history from authoritative biographies, tier **L-A** or **L-AA** only.
- Store in `mcp-astro-engine/data/gold_set/` (committed to repo).

**Validation metrics (enrichment, not ML):**

| Metric | Definition | Target |
|--------|------------|--------|
| Residence recall | Of gold residences, what fraction does automated enrichment surface? | ≥ 70% |
| Residence precision | Of automated residences, what fraction match gold intervals (±1 year tolerance)? | ≥ 85% |
| Tier accuracy | When pipeline assigns L-A, does gold agree it's L-A or better? | ≥ 90% |
| Event location recall | Of gold events with known locations, what fraction does enrichment place correctly? | ≥ 75% |

If any metric is below target, **do not proceed to Phase 1 training.** Tune filters or demote records to lower tiers.

**Location:** `mcp-astro-engine/tests/test_enrichment_quality.py`, runs against the gold set on every enrichment pipeline change.

---

## 7. Bias & Leakage Risks

Enrichment quality is asymmetric in a way that will silently corrupt training if not managed.

### 7.1 Fame bias

Wikipedia and biographies overweight the *famous* years of a subject's life. Paris 1926 (when Hemingway published *The Sun Also Rises*) has 50× the prose coverage of Paris 1923.

**Consequence:** If we only surface residence-years with rich coverage, every positive event will co-occur with a well-documented residence — and every quiet year will be missing. The model learns "documentation density" rather than astrology.

**Mitigation:**
- For every subject, require residence coverage of **≥ 80% of years between birth and death (or present)**. Subjects failing this are held out until enrichment fills gaps.
- When a residence interval is inferred from an event ("Hemingway was in Paris in 1926 because he published there"), flag it. Negative sampling must explicitly include inferred-interval years that have *no* associated events.

### 7.2 Survivorship bias in Astro-Databank itself

AA subjects are disproportionately famous, successful, and Western. The model learns patterns of notable lives, which may not generalize to typical users.

**Mitigation:** Not solvable via enrichment. Flagged here so it's documented; addressed in `05-metrics.md` under external validity.

### 7.3 Geographic coverage bias

Wikidata and Wikipedia are richest for North American and Western European locations. Subjects who lived in Lagos, Jakarta, or São Paulo get thinner enrichment.

**Mitigation:** Track enrichment coverage by subject birth country. If a geographic cohort has < 50% the enrichment density of the best-covered cohort, exclude from training and document the exclusion.

### 7.4 Date-location coupling leakage

If a marriage event and a residence interval share the same source sentence, they carry correlated noise. Training records must cite *independent* sources for (subject is in city C at time T) and (event E occurred at time T).

**Mitigation:** In conflict resolver, flag records where event and residence derive from the same `Source.url`. Require at least one independent source for positive training examples.

---

## 8. Privacy & Licensing

- **Wikidata:** CC0, no restrictions.
- **Wikipedia:** CC BY-SA — attribution required; our derived data must carry source citations (already in schema).
- **Newspapers.com / ProQuest:** Terms prohibit bulk redistribution; only extracted facts (dates, locations) stored, not prose.
- **IMDb:** Non-commercial use of extracted data requires review; may need API license for production.
- **Ancestry / FamilySearch:** Personal-use license, check bulk extraction terms.
- **Living subjects:** Residence data for living non-public figures will not be enriched. Living public figures (defined as: has a Wikipedia article) are in scope, but precise current addresses are excluded — city/country resolution only.

---

## 9. Deliverables

Ordered for review + implementation:

1. ✅ This document.
2. `mcp-astro-engine/ml/schema/location_schema.sql` — table DDL matching §3.
3. `mcp-astro-engine/data/gold_set/` — 50-subject hand-curated validation set (weeks of manual work).
4. `mcp-astro-engine/etl/wikidata_residence.py` — §4.1 implementation.
5. `mcp-astro-engine/etl/wiki_geoparse.py` — §4.2 implementation.
6. `mcp-astro-engine/tests/test_enrichment_quality.py` — §6 validation harness.
7. Enrichment run 1 report, appended to this doc as §10 once complete.

---

## 10. Open Questions (for Brandon's review)

1. **L-B admission in Phase 1?** Strict (L-AA + L-A only, smaller dataset) or permissive (include L-B with cited primary sources, larger but noisier)?
2. **Gold set size:** 50 hand-curated subjects feels minimum viable. Is there budget for 100? Larger gold set = better pipeline validation but 2× the curation cost.
3. **Living subjects scope:** confirm we're comfortable enriching city/country-level residence for living public figures with Wikipedia articles. Anything stricter?
4. **Geographic cohort threshold:** §7.3 proposes excluding cohorts with < 50% enrichment density of best-covered cohort. Is 50% the right bar, or should we accept more geographic imbalance to preserve sample size?
5. **Event taxonomy:** `event_record.event_type` needs the canonical list mapped to the 9 Life Goals. Does that belong in this doc or in a sibling `01c-event-taxonomy.md`? Recommend sibling doc to keep this one focused.
6. **Manual curation staffing:** who does the 200-subject newspaper dateline work and the 50-subject gold set? Intern / contractor / founder time?
