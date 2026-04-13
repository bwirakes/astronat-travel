-- AstroNat evaluation dataset schema
-- Referenced by docs/ml-evaluation/01-dataset-sourcing.md §1
--                docs/ml-evaluation/01b-location-enrichment.md §3
-- SQLite-compatible. Apply via: sqlite3 data/eval.db < data/schema/001_eval_core.sql

PRAGMA foreign_keys = ON;

-- ============================================================================
-- subjects — AA-rated entries from Astro-Databank (per 01 §1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
    subject_id              TEXT PRIMARY KEY,           -- UUID
    astrodatabank_id        TEXT NOT NULL UNIQUE,       -- URL-derived ID
    full_name               TEXT NOT NULL,

    birth_date              TEXT NOT NULL,              -- ISO YYYY-MM-DD
    birth_time              TEXT NOT NULL,              -- HH:MM:SS (24h, local)
    birth_time_precision    TEXT NOT NULL               -- minute|hour|noon_default
                            CHECK (birth_time_precision IN ('minute','hour','noon_default')),

    birth_location_name     TEXT NOT NULL,
    birth_geoname_id        INTEGER,
    birth_lat               REAL NOT NULL,
    birth_lon               REAL NOT NULL,
    birth_country_iso       TEXT,

    rodden_rating           TEXT NOT NULL
                            CHECK (rodden_rating IN ('AA','A','B','C','DD','XX')),
    rating_source_notes     TEXT,

    death_date              TEXT,                        -- ISO, nullable
    death_location          TEXT,

    profession_tags         TEXT,                        -- JSON array
    sex                     TEXT,                        -- 'M'|'F'|NULL

    astrodatabank_url       TEXT NOT NULL,
    extracted_at            TEXT NOT NULL,               -- ISO 8601
    extraction_version      TEXT NOT NULL,               -- e.g., "v1.0"

    has_events              INTEGER NOT NULL DEFAULT 0   -- bool: any events tagged
);

CREATE INDEX IF NOT EXISTS idx_subjects_rating ON subjects(rodden_rating);
CREATE INDEX IF NOT EXISTS idx_subjects_birth_date ON subjects(birth_date);
CREATE INDEX IF NOT EXISTS idx_subjects_has_events ON subjects(has_events);

-- ============================================================================
-- residence_record — per 01b §3.1
-- ============================================================================
CREATE TABLE IF NOT EXISTS residence_record (
    id                      TEXT PRIMARY KEY,            -- UUID
    subject_id              TEXT NOT NULL REFERENCES subjects(subject_id),

    location_name           TEXT NOT NULL,
    geoname_id              INTEGER,
    wikidata_place_qid      TEXT,
    latitude                REAL,
    longitude               REAL,
    country_iso             TEXT,

    start_date              TEXT,                        -- ISO, nullable
    start_precision         TEXT
                            CHECK (start_precision IN ('day','month','year','decade','unknown')),
    end_date                TEXT,                        -- ISO, nullable
    end_precision           TEXT
                            CHECK (end_precision IN ('day','month','year','decade','unknown','ongoing')),
    end_is_open             INTEGER NOT NULL DEFAULT 0,

    evidence_tier           TEXT NOT NULL
                            CHECK (evidence_tier IN ('L-AA','L-A','L-B','L-C','L-DD')),
    sources                 TEXT NOT NULL,               -- JSON array of Source objects
    confidence              REAL NOT NULL,               -- [0,1]
    extracted_by            TEXT NOT NULL,               -- pipeline component name
    notes                   TEXT,

    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_residence_subject ON residence_record(subject_id);
CREATE INDEX IF NOT EXISTS idx_residence_tier ON residence_record(evidence_tier);
CREATE INDEX IF NOT EXISTS idx_residence_dates ON residence_record(subject_id, start_date, end_date);

-- ============================================================================
-- event_record — per 01b §3.2 with per-goal polarity map (updated per 01c §5)
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_record (
    id                      TEXT PRIMARY KEY,
    subject_id              TEXT NOT NULL REFERENCES subjects(subject_id),

    event_type              TEXT NOT NULL,               -- marriage|divorce|award|...
    event_date              TEXT NOT NULL,               -- ISO
    event_precision         TEXT NOT NULL
                            CHECK (event_precision IN ('day','month','year')),

    location_geoname_id     INTEGER,
    location_name           TEXT,
    latitude                REAL,
    longitude               REAL,

    evidence_tier           TEXT
                            CHECK (evidence_tier IN ('L-AA','L-A','L-B','L-C',NULL)),
    sources                 TEXT,                        -- JSON array

    -- Per-goal polarity map (01c §5). JSON shape:
    --   {"love": 1, "career": -1, "community": 0, "growth": null, "relocation": 1}
    -- null = no evidence for that goal; 0 = neutral; +1/-1 = polarity
    goal_polarity           TEXT NOT NULL,               -- JSON object

    -- For window-required (C-case) labels per 01c §5:
    outcome_validated       INTEGER NOT NULL DEFAULT 0,  -- bool
    outcome_notes           TEXT,

    magnitude               REAL,                        -- optional subjective strength
    notes                   TEXT,

    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_subject ON event_record(subject_id);
CREATE INDEX IF NOT EXISTS idx_event_date ON event_record(event_date);
CREATE INDEX IF NOT EXISTS idx_event_type ON event_record(event_type);

-- ============================================================================
-- extraction_run — one row per ETL run, for provenance
-- ============================================================================
CREATE TABLE IF NOT EXISTS extraction_run (
    run_id                  TEXT PRIMARY KEY,
    run_type                TEXT NOT NULL,               -- astrodatabank|wikidata|wiki_geoparse|manual
    started_at              TEXT NOT NULL,
    finished_at             TEXT,
    version                 TEXT NOT NULL,               -- e.g., "v1.0"
    git_commit              TEXT,                        -- code version at run time
    input_args              TEXT,                        -- JSON
    rows_in                 INTEGER,
    rows_ok                 INTEGER,
    rows_failed             INTEGER,
    notes                   TEXT
);

-- ============================================================================
-- parse_failure — rows that failed extraction, for debug
-- ============================================================================
CREATE TABLE IF NOT EXISTS parse_failure (
    id                      TEXT PRIMARY KEY,
    run_id                  TEXT REFERENCES extraction_run(run_id),
    source_url              TEXT,
    stage                   TEXT,                        -- 'list'|'page'|'events'|...
    error                   TEXT,
    raw_snippet             TEXT,
    created_at              TEXT NOT NULL
);
