# 01 — Dataset Sourcing: AA-Rated Subject Extraction

**Status:** Draft for review
**Owner:** TBD
**Depends on:** nothing upstream — this is the data entry point
**Consumed by:** [01b](./01b-location-enrichment.md) (residence enrichment), [01c §5](./01c-goals-and-houses.md) (event labeling), [02](./02-negative-sampling.md), [04](./04-evaluation-protocol.md)

---

## 1. Purpose

Defines the procedure for extracting AA-rated subject records from Astro-Databank into a local, versioned dataset. This is the upstream source of every (subject, birth data) used in the evaluation framework. Everything downstream inherits the reliability of this extraction.

**What this produces:**

```
subjects table (SQLite or Postgres)
├── subject_id           UUID (stable)
├── astrodatabank_id     string (external ID on astro-databank.com)
├── full_name            string
├── birth_date           ISO date
├── birth_time           ISO time (24h)
├── birth_time_precision enum: minute | hour | noon_default
├── birth_location_name  string
├── birth_geoname_id     int (GeoNames)
├── birth_lat            float
├── birth_lon            float
├── rodden_rating        enum: AA | A | B | C | DD
├── rating_source_notes  text (the justification Astro-Databank gives)
├── death_date           ISO date | null
├── death_location       string | null
├── profession_tags      JSON array (from Astro-Databank categories)
├── astrodatabank_url    string
├── extracted_at         timestamp
└── extraction_version   string (e.g., "v1.0")
```

## 2. What Astro-Databank is

Astro-Databank is a publicly accessible, community-curated database of birth charts hosted at [astro.com/astro-databank](https://www.astro.com/astro-databank/). It is maintained by astro.com (Swiss Ephemeris publisher) and was founded on Lois Rodden's rating system for birth-time reliability.

**Rating system (Rodden Ratings):**

| Rating | Meaning | Usability |
|---|---|---|
| **AA** | Birth certificate / official hospital record verified | ✅ Phase 1 eligible |
| **A** | From the person, their family, or contemporaneous records | ⚠️ Phase 2 stretch goal |
| **B** | From biography or autobiography | ❌ Excluded |
| **C** | Caution — source unknown or questionable | ❌ Excluded |
| **DD** | "Dirty data" — conflicting times reported, no resolution | ❌ Excluded |
| **XX** | No known time | ❌ Excluded |

**Why AA-only for Phase 1:** A birth time error of 4 minutes shifts ACG and geodetic angles by ~1° (≈ 70 miles). Any rating below AA introduces angle errors large enough to change which house planets fall in, corrupting every spatial feature the engine uses.

## 3. Scope of extraction

**Phase 1 target:** 500 AA-rated subjects.

**Filtering criteria applied at extraction:**

1. **Rating = AA only.** No compromises.
2. **Known death date, OR born before 1980.** Ensures outcome-window validation is possible ([01c §5](./01c-goals-and-houses.md)). Living subjects under 46 don't have enough tail for many outcome windows.
3. **At least one tagged biographical event in the Astro-Databank entry.** Subjects with only birth data and no events contribute nothing to evaluation labels. Some will be enriched later via [01b](./01b-location-enrichment.md), but entries with zero Astro-Databank events are deprioritized.
4. **Cross-cohort diversity targets** (soft — don't rejection-sample aggressively, but report extraction-cohort statistics):
   - ≥ 30% non-Western (born outside North America / Europe)
   - ≥ 30% female (Astro-Databank is historically male-skewed)
   - Era distribution: 10% pre-1900, 40% 1900–1950, 40% 1950–2000, 10% post-2000
   - Profession mix across artists, scientists, politicians, athletes, business, others

If the diversity targets can't be met within AA-rated availability (likely for pre-1900 non-Western subjects), extraction proceeds with what's available and the shortfall is documented.

## 4. Extraction approach

Astro-Databank **has no formal API.** Data is in HTML wiki-style pages. Extraction is by structured HTML scrape.

### 4.1 Discovery: AA-rated subject list

Astro-Databank has a category index for ratings. The AA list is at:
`https://www.astro.com/astro-databank/Category:Rodden_Rating_AA`

This yields a paginated listing of all AA-rated entries (~10,000+ at time of writing). Pagination is navigable via `?from=` query parameters.

**Step 1 — crawl category pages, collect subject URLs.** Save as `data/raw/aa_subject_urls.txt`.

Implemented at `mcp-astro-engine/etl/astrodatabank_list.py`. Respects robots.txt. Single-threaded, 2-second delay between requests.

### 4.2 Per-subject extraction

For each URL in the list (filtered per §3 criteria), fetch the page and parse:

**Parsed fields from the standard Astro-Databank page structure:**

| Astro-Databank field | Extracted as | Parser hint |
|---|---|---|
| "Born on" | birth_date, birth_time | Format: "DD Month YYYY at HH:MM (= HH:MM UT)" |
| "in" (birthplace) | birth_location_name | Followed by lat/lon in parentheses |
| Rodden Rating | rodden_rating | Usually shown as "Rodden Rating AA" heading |
| "Collector:" / "Source Notes:" | rating_source_notes | Free text; store verbatim |
| Categories | profession_tags | Wiki category links at page bottom |
| "Died" | death_date, death_location | If present |
| "Events" | event_records_raw | List of dated events with locations, if present |

**The "Events" section is critical.** Astro-Databank entries often tag major events: marriages, awards, deaths of family members, publications, etc. Each tagged event gives us a dated (event_type, location) tuple that feeds directly into [01c §5](./01c-goals-and-houses.md) label generation.

**Event extraction example (Hemingway page):**
```
Events (raw scraped):
  "1921-09-03: Marriage to Hadley Richardson, Chicago IL"
  "1926-10-22: Book published (The Sun Also Rises), New York NY"
  "1927-01-27: Divorce from Hadley Richardson, Paris France"
  ...
```

These go into the `event_record` table from [01b §3.2](./01b-location-enrichment.md) with `evidence_tier = L-A` (Astro-Databank events are typically sourced from biographies).

**Tier assignment for Astro-Databank events:**
- If the event cites a primary document (birth certificate, court record, newspaper) → **L-A** or **L-AA** as warranted
- If the event cites only a biography or Wikipedia → **L-B**
- If no citation given → **L-C** and excluded from Phase 1 labels

Since Astro-Databank entries vary in citation quality, every event gets individual tier assessment, not a blanket "from Astro-Databank = tier X."

### 4.3 Rate limiting and politeness

Astro.com is not a large institution and hosts Astro-Databank as a community resource. Aggressive scraping could reasonably be viewed as abuse.

**Rules:**
- Single-threaded. No concurrency.
- 2-second minimum delay between requests.
- User-Agent: `astronat-research/0.1 (research extract, contact: <email>)`
- Honor `robots.txt`.
- Cache every fetched page locally (`data/raw/astrodatabank_cache/`) so re-runs hit cache, not network.
- One-pass extraction: we crawl once, store raw HTML + parsed JSON, and re-parse from local cache as needed.

**Estimated extraction time:** ~500 subjects × 2 seconds = ~20 minutes for target-cohort fetching. The discovery crawl (all AA URLs) is ~1 hour.

### 4.4 Parser robustness

Astro-Databank is semi-structured HTML, not schema-validated. Expect:

- **Format drift across eras.** Older entries use different section headings.
- **Missing fields.** Not every entry has events, death date, or even location coordinates.
- **Embedded HTML oddities.** Escaped unicode, nested tables, inline footnotes.
- **Typos and data errors.** "1921-09-03" vs "1921-9-3" vs "September 3, 1921."

**Strategy:**
- Parsers should be tolerant and log warnings, not crash.
- Every parse-failure row is written to `data/raw/parse_failures.jsonl` for manual review.
- Target ≤ 10% parse-failure rate on the AA cohort. Above that, parser needs work.

### 4.5 Disambiguation and deduplication

Some subjects have multiple Astro-Databank entries (rare; usually for figures with contested birth data). Handle via:
- Deduplicate on `astrodatabank_id` (URL-derived).
- If duplicate names with different AA-rated times exist, flag for manual review and exclude both until resolved.

## 5. Validation

Before the subject dataset is accepted for downstream use:

**Check 1: Rodden rating hygiene.** 100% of extracted subjects must have `rodden_rating = AA`. Any non-AA row is a parser bug.

**Check 2: Birth data completeness.** Every subject has non-null `birth_date`, `birth_time`, `birth_lat`, `birth_lon`. Anything missing = excluded.

**Check 3: Time precision.** Birth times should have minute precision (e.g., "14:22", not "14:00" or "noon"). Entries with suspicious precision (exact hour, exact half-hour) may still be AA but warrant extra scrutiny — a midwife who wrote "2 PM" is less reliable than a hospital record of "14:22." Flag but don't exclude.

**Check 4: Geocoding sanity.** `birth_lat` and `birth_lon` must resolve to a real location matching `birth_location_name` via GeoNames lookup. Mismatches (e.g., "London" → coordinates in rural Iowa) indicate parsing errors.

**Check 5: Cohort statistics.** Report extraction-cohort distributions against §3 targets. Publish these alongside the extraction as `data/raw/cohort_stats.md`. Known shortfalls are documented, not silently tolerated.

## 6. Licensing and ethics

### 6.1 Astro-Databank terms

Astro-Databank data is published under the [Creative Commons Attribution-ShareAlike license](https://creativecommons.org/licenses/by-sa/4.0/) (per astro.com's stated terms on the site; verify current terms at extraction time).

**Implications:**
- ✅ We can extract and use the data for research.
- ✅ We can build derived products on top of it.
- ⚠️ Any redistribution of the raw data (as a bundled dataset, for example) requires attribution and preservation of the CC-BY-SA license.
- ⚠️ Derivative datasets (our enriched version with location history + outcome labels) are in a gray zone. Conservative interpretation: also CC-BY-SA. We should not gate access to derivative data without legal review.

**Practical stance for Phase 1:**
- Do not publicly redistribute the raw Astro-Databank extract.
- Internal use (training our evaluation pipeline, investor demo reports) is acceptable.
- Attribution: every report cites Astro-Databank as the data source.
- If Phase 2 involves training a publicly-shipped model, **consult a lawyer** about whether CC-BY-SA propagates to the model weights. (Model-weight licensing is a live legal question; don't assume.)

### 6.2 Subject privacy

All AA-rated subjects on Astro-Databank are public figures. Birth data is already publicly posted on astro.com. We are not exposing private information.

However:
- For living subjects, avoid enriching granular *current* residence data (street-level addresses). Stay at city/country level.
- For deceased subjects, full biographical enrichment is acceptable.
- Do not redistribute sensitive life events (medical, legal) that Astro-Databank redacted. Respect the source's editorial decisions.

### 6.3 Attribution requirements

Every evaluation report (`EXP-####/report.md`) must include:

> **Data source.** Subject birth data and a portion of event records are drawn from Astro-Databank ([astro.com/astro-databank](https://www.astro.com/astro-databank/)), a community-maintained database under CC-BY-SA license. Extraction was performed on [date] using extraction version [v#.#]. We gratefully acknowledge the collectors and contributors who maintain Astro-Databank as a public resource for astrological research.

## 7. Known limitations

### 7.1 Astro-Databank cohort bias

Astro-Databank skews heavily toward:
- White Western subjects (European + North American > 80% of AA entries)
- Male subjects (~70% of AA entries)
- Entertainment industry (actors, musicians, authors) and politics (highest event documentation)
- 20th century (pre-1900 AA entries are rare because birth records were less standardized)

The evaluation cohort inherits these biases. We cannot fix them by sampling harder — the underlying pool doesn't contain the diversity we'd want. Must be reported as an external validity limitation (per [04 §7](./04-evaluation-protocol.md)).

### 7.2 Event coverage varies wildly

Some AA entries have rich, dated event lists (Hemingway, JFK). Others have only birth data and a one-line bio (many minor actors). Event-poor subjects contribute poorly to label generation and may need [01b](./01b-location-enrichment.md) enrichment to be usable — if enrichment fails, they're effectively "birth data only" and drop out of most goal evaluations.

### 7.3 Time precision is often suspicious

"AA-rated" doesn't always mean "to the minute." Some AA entries cite birth certificates that report "2 PM" without further precision. The engine treats these as "14:00:00.00" but the true time could be anywhere in a 1-hour window. This introduces systematic angle noise of up to 15° in ACG/geodetic calculations — enough to change house assignments. Flag and monitor per-subject; exclude subjects with ≥ 30-minute time uncertainty from Phase 1 evaluation.

### 7.4 Astro-Databank corrections happen

The database is community-maintained and occasionally corrects ratings or times. An entry we extracted as AA in April 2026 might be downgraded to A in November. Mitigations:
- Pin extraction version in every evaluation run (per [04 §4.1](./04-evaluation-protocol.md)).
- Re-extract periodically (quarterly) and diff against prior extracts; subjects that changed rating or time are flagged.
- Published reports reference the extraction version explicitly.

## 8. Implementation file map

```
mcp-astro-engine/
├── etl/
│   ├── astrodatabank_list.py       # Crawl AA category, collect URLs
│   ├── astrodatabank_extract.py    # Per-subject page parse
│   ├── astrodatabank_events.py     # Event section parser (shared w/ 01b)
│   └── validate_extraction.py      # Run §5 checks
├── data/
│   └── raw/
│       ├── astrodatabank_cache/    # Raw HTML (gitignored; ~500 MB)
│       ├── aa_subject_urls.txt
│       ├── subjects_v1.parquet
│       ├── events_raw_v1.parquet
│       ├── parse_failures.jsonl
│       └── cohort_stats.md
└── tests/
    ├── test_astrodatabank_parser.py  # Fixture-based unit tests
    └── test_validate_extraction.py
```

## 9. Extraction version management

Every extraction produces a versioned dataset. Versions are immutable:

| Version | Trigger | Dataset change |
|---|---|---|
| v1.0 | Initial Phase 1 extract | N=500 AA subjects |
| v1.1 | Parser bug fix | Same subjects, re-parsed fields |
| v1.2 | Adding diversity cohort | N grows to 600 |
| v2.0 | Including A-rated subjects | Major cohort change |

Version is stamped on every subject row as `extraction_version`. Evaluation runs pin the version ([04 §4.1](./04-evaluation-protocol.md)). Re-runs on the same version = deterministic.

## 10. Open questions

1. **License verification.** I've stated CC-BY-SA based on standard astro.com practice, but should be confirmed against current Astro-Databank terms at extraction time. Proposal: extraction script reads the license statement from the site and logs it in `cohort_stats.md` as a record.

2. **A-rated Phase 2 inclusion.** Is A-rating (self-reported by the person or family) acceptable for Phase 2 expansion? Angle errors could be larger but still usable. Proposal: run a Phase 1.5 sensitivity analysis — re-run evaluation with A-rated subjects included and see whether metrics degrade by > 0.05 PR-AUC. If yes, A stays excluded; if no, expand.

3. **Living-subject enrichment depth.** §6.2 restricts living subjects to city/country-level residence. Is that sufficient for evaluation, or does ACG-line proximity require finer-grained location data that would make us uncomfortable storing? Proposal: city-centroid coordinates are sufficient for engine input, and we shouldn't go finer for living subjects.

4. **Event-free AA subjects.** Should we extract these for birth-data-only use (e.g., feature distribution analysis) or skip entirely? Proposal: extract but tag `has_events = false`; use for non-label analyses only.

5. **Attribution in product UI.** Do consumer users see "Data from Astro-Databank" attribution anywhere, or is the attribution limited to internal/investor reports? Proposal: footnote-level attribution in any product feature that relies on AA-cohort evaluation metrics. "Based on evaluation against 500 historically-verified cases" should link to a page that names Astro-Databank.
