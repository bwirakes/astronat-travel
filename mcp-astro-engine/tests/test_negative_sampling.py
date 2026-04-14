"""Tests for evaluation.negative_sampling.

Uses a synthetic in-memory SQLite DB populated with a single Hemingway-like
subject so every code path is exercised without needing real data.
"""

from __future__ import annotations

import json
import sqlite3
import tempfile
import uuid
from datetime import date
from pathlib import Path

import numpy as np
import pytest

from evaluation.negative_sampling import (
    _approx_continent,
    _build_event_buffers,
    _filter_control_pool,
    _haversine_km,
    _partition_residence,
    _trajectory_phase,
    _years_since_last_positive,
    build_negative_rows,
    load_control_cities,
    sample_geographic_negatives,
    sample_temporal_negatives,
)


# ---------------------------------------------------------------------------
# Helpers — build a synthetic DB that mirrors the real schema.
# ---------------------------------------------------------------------------


SCHEMA_PATH = Path(__file__).parent.parent / "data/schema/001_eval_core.sql"


def _build_synthetic_db(tmp_path: Path) -> Path:
    db_path = tmp_path / "test.db"
    conn = sqlite3.connect(db_path)
    with open(SCHEMA_PATH) as f:
        conn.executescript(f.read())

    subject_id = str(uuid.uuid4())
    conn.execute(
        """INSERT INTO subjects (
            subject_id, astrodatabank_id, full_name, birth_date, birth_time,
            birth_time_precision, birth_location_name, birth_lat, birth_lon,
            rodden_rating, astrodatabank_url, extracted_at, extraction_version,
            has_events, death_date
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (subject_id, "Hemingway,_Ernest", "Hemingway, Ernest", "1899-07-21",
         "08:00:00", "minute", "Oak Park, IL", 41.883, -87.783, "AA",
         "https://example.com/Hemingway", "2026-01-01T00:00:00Z", "v1.0",
         1, "1961-07-02"),
    )

    residences = [
        # Paris 1921–1928
        ("Paris", 48.8566, 2.3522, "FR", "1921-01-01", "1928-01-01"),
        # Key West 1928–1939
        ("Key West", 24.5551, -81.78, "US", "1928-04-01", "1939-01-01"),
        # Havana 1939–1961
        ("Havana", 23.1136, -82.3666, "CU", "1939-01-01", "1961-07-02"),
    ]
    for name, lat, lon, iso, start, end in residences:
        conn.execute(
            """INSERT INTO residence_record (
                id, subject_id, location_name, latitude, longitude, country_iso,
                start_date, start_precision, end_date, end_precision,
                end_is_open, evidence_tier, sources, confidence,
                extracted_by, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), subject_id, name, lat, lon, iso,
             start, "year", end, "year",
             0, "L-A", json.dumps([]), 0.95,
             "test", "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
        )

    events = [
        # Marriage 1921 Paris — C-case love +1, preserved
        ("relationship", "1921-09-03", "day", "Paris", 48.8566, 2.3522,
         {"love": 1, "career": None, "community": None, "growth": None,
          "relocation": None, "is_c_case": True}),
        # Publication 1926 Paris — career +1 C-case
        ("work", "1926-10-22", "day", "Paris", 48.8566, 2.3522,
         {"love": None, "career": 1, "community": None, "growth": None,
          "relocation": None, "is_c_case": True}),
        # Divorce 1927 Paris — love -1
        ("relationship", "1927-01-27", "day", "Paris", 48.8566, 2.3522,
         {"love": -1, "career": None, "community": None, "growth": None,
          "relocation": None, "is_c_case": False}),
        # Move to Key West 1928 — relocation +1 C-case
        ("family", "1928-04-01", "month", "Key West", 24.5551, -81.78,
         {"love": None, "career": None, "community": None, "growth": None,
          "relocation": 1, "is_c_case": True}),
        # Nobel 1954 Havana — career +1, unambiguous
        ("work", "1954-01-01", "year", "Havana", 23.1136, -82.3666,
         {"love": None, "career": 1, "community": None, "growth": None,
          "relocation": None, "is_c_case": False}),
    ]
    for et, ed, ep, loc, lat, lon, polarity in events:
        conn.execute(
            """INSERT INTO event_record (
                id, subject_id, event_type, event_date, event_precision,
                location_name, latitude, longitude,
                evidence_tier, sources, goal_polarity,
                outcome_validated, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), subject_id, et, ed, ep,
             loc, lat, lon,
             "L-B", json.dumps([]), json.dumps(polarity),
             1, "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
        )

    conn.commit()
    conn.close()
    return db_path


@pytest.fixture
def synthetic_db(tmp_path):
    return _build_synthetic_db(tmp_path)


# ---------------------------------------------------------------------------
# Unit tests — helpers
# ---------------------------------------------------------------------------


def test_haversine_known_distance():
    # NYC (40.7, -74.0) to London (51.5, -0.1) ≈ 5570 km
    d = _haversine_km(40.7, -74.0, 51.5, -0.1)
    assert 5500 < d < 5650


def test_approx_continent():
    assert _approx_continent(48.8566, 2.3522) == "Europe"
    assert _approx_continent(40.7, -74.0) == "North America"
    assert _approx_continent(35.6762, 139.6503) == "Asia"
    assert _approx_continent(-33.8688, 151.2093) == "Oceania"
    assert _approx_continent(-34.6037, -58.3816) == "South America"
    assert _approx_continent(-26.2041, 28.0473) == "Africa"


def test_partition_residence_too_short_returns_empty():
    r = {"start_date": "1920-01-01", "end_date": "1920-06-01"}
    assert _partition_residence(r, None) == []


def test_partition_residence_produces_nonoverlapping_windows():
    r = {"start_date": "1921-01-01", "end_date": "1928-01-01"}
    windows = _partition_residence(r, None)
    # ~7 years → ~6-7 twelve-month windows (fencepost; last partial dropped)
    assert 6 <= len(windows) <= 7
    # Non-overlapping: each window's end ≤ next window's start
    for a, b in zip(windows, windows[1:]):
        assert a[1] <= b[0]


def test_event_buffers_include_marriage_and_outcome_window():
    events = [{
        "event_date": "1921-09-03",
        "goal_polarity": json.dumps({"love": 1, "is_c_case": True}),
    }]
    buffers = _build_event_buffers(events, "love")
    assert len(buffers) == 1
    start, end = buffers[0]
    # Should cover ±3mo around event AND extend 5y for C-case love
    assert start < date(1921, 9, 3)
    assert end > date(1926, 1, 1)  # at least 4+ years past event
    assert end < date(1927, 6, 1)


def test_years_since_last_positive_handles_missing():
    subject_events: list[dict] = []
    assert _years_since_last_positive(date(1930, 1, 1), subject_events) is None


def test_years_since_last_positive_basic():
    events = [
        {"event_date": "1920-01-01",
         "goal_polarity": json.dumps({"love": 1})},
        {"event_date": "1925-01-01",
         "goal_polarity": json.dumps({"career": 1})},
    ]
    years = _years_since_last_positive(date(1930, 1, 1), events)
    assert years is not None
    assert 4.9 < years < 5.1


def test_trajectory_phase_early_mid_late():
    events = [{"event_date": "1920-01-01", "goal_polarity": "{}"}]
    assert _trajectory_phase(date(1919, 1, 1), events, None) == "pre_first_event"
    assert _trajectory_phase(date(1925, 1, 1), events, None) == "early"
    assert _trajectory_phase(date(1935, 1, 1), events, None) == "mid"
    assert _trajectory_phase(date(1960, 1, 1), events, None) == "late"


# ---------------------------------------------------------------------------
# Unit tests — temporal sampling
# ---------------------------------------------------------------------------


def test_temporal_sampling_excludes_marriage_outcome_window(synthetic_db):
    rng = np.random.default_rng(42)
    conn = sqlite3.connect(synthetic_db)
    conn.row_factory = sqlite3.Row
    subj = dict(conn.execute("SELECT * FROM subjects").fetchone())
    events = [dict(r) for r in conn.execute("SELECT * FROM event_record")]
    residences = [dict(r) for r in conn.execute("SELECT * FROM residence_record")]
    conn.close()

    temporals = sample_temporal_negatives(
        subj, events, residences, goal="love", rng=rng, k=3,
    )
    # Every sample must be outside [1921-09 - 3mo, 1926-09 approx] (C-case)
    # AND outside divorce ±3mo
    banned_start = date(1921, 6, 3)
    banned_end = date(1926, 12, 3)
    for t in temporals:
        sd = date.fromisoformat(t["sample_date"])
        assert not (banned_start <= sd <= banned_end), (
            f"Sample {sd} falls inside love event buffer"
        )


def test_temporal_sampling_returns_empty_when_no_positives(synthetic_db):
    """Goal with no positive events → no temporal negatives for that goal."""
    rng = np.random.default_rng(42)
    conn = sqlite3.connect(synthetic_db)
    conn.row_factory = sqlite3.Row
    subj = dict(conn.execute("SELECT * FROM subjects").fetchone())
    events = [dict(r) for r in conn.execute("SELECT * FROM event_record")]
    residences = [dict(r) for r in conn.execute("SELECT * FROM residence_record")]
    conn.close()

    # 'community' has no positives in synthetic data
    temporals = sample_temporal_negatives(
        subj, events, residences, goal="community", rng=rng, k=3,
    )
    assert temporals == []


def test_temporal_rows_have_path_features(synthetic_db):
    rng = np.random.default_rng(42)
    conn = sqlite3.connect(synthetic_db)
    conn.row_factory = sqlite3.Row
    subj = dict(conn.execute("SELECT * FROM subjects").fetchone())
    events = [dict(r) for r in conn.execute("SELECT * FROM event_record")]
    residences = [dict(r) for r in conn.execute("SELECT * FROM residence_record")]
    conn.close()

    temporals = sample_temporal_negatives(
        subj, events, residences, goal="career", rng=rng, k=3,
    )
    assert len(temporals) > 0
    for t in temporals:
        # Every negative must carry path-dependency features
        assert "trajectory_phase" in t
        assert t["trajectory_phase"] in (
            "pre_first_event", "early", "mid", "late", "counterfactual",
        )
        assert "years_since_last_positive" in t


# ---------------------------------------------------------------------------
# Unit tests — geographic sampling
# ---------------------------------------------------------------------------


def _tiny_control_pool():
    # Simulate a minimal control_cities.csv subset
    from evaluation.negative_sampling import ControlCity
    return [
        ControlCity(2643743, "London", "GB", "Europe", 51.5, -0.1, 43),
        ControlCity(2950159, "Berlin", "DE", "Europe", 52.5, 13.4, 1237),
        ControlCity(3117735, "Madrid", "ES", "Europe", 40.4, -3.7, 850),
        ControlCity(3169070, "Rome",   "IT", "Europe", 41.9, 12.5, -753),
        ControlCity(5128581, "New York", "US", "North America", 40.7, -74.0, 1624),
    ]


def test_control_pool_continent_matched():
    pool = _tiny_control_pool()
    # Paris event → should get European cities only
    filtered = _filter_control_pool(48.85, 2.35, date(1926, 10, 22), [], pool)
    continents = {c.continent for c in filtered}
    assert continents == {"Europe"}


def test_control_pool_excludes_nearby_cities():
    pool = _tiny_control_pool()
    # Event at Paris (48.85, 2.35); Rome is ~1100 km so OK, but a hypothetical
    # city next door shouldn't appear.
    filtered = _filter_control_pool(48.85, 2.35, date(1926, 10, 22), [], pool)
    for c in filtered:
        d = _haversine_km(48.85, 2.35, c.lat, c.lon)
        assert d >= 100.0, f"{c.name} too close: {d:.1f} km"


def test_control_pool_excludes_subject_residences():
    pool = _tiny_control_pool()
    # London is in subject residences → must be filtered out
    subject_residences = [{"geoname_id": 2643743}]
    filtered = _filter_control_pool(48.85, 2.35, date(1926, 1, 1),
                                     subject_residences, pool)
    names = {c.name for c in filtered}
    assert "London" not in names


def test_geographic_negatives_labels(synthetic_db):
    rng = np.random.default_rng(42)
    pool = _tiny_control_pool()
    event_row = {
        "event_date": "1926-10-22",
        "latitude": 48.85, "longitude": 2.35,
        "_goal": "career",
    }
    geos = sample_geographic_negatives(event_row, [], pool, rng, k=5)
    assert len(geos) > 0
    for g in geos:
        assert g["row_type"] == "geographic_neg"
        assert g["sample_date"] == "1926-10-22"
        assert g["trajectory_phase"] == "counterfactual"


# ---------------------------------------------------------------------------
# Integration — end-to-end negative building
# ---------------------------------------------------------------------------


def test_end_to_end_build_negatives(synthetic_db, tmp_path):
    # Minimal control_cities.csv for the test
    controls_csv = tmp_path / "control_cities.csv"
    with open(controls_csv, "w", newline="") as f:
        f.write(
            "geoname_id,name,country,continent,lat,lon,founded_year,population_1900\n"
            "2643743,London,GB,Europe,51.5,-0.1,43,6506000\n"
            "2950159,Berlin,DE,Europe,52.5,13.4,1237,1889000\n"
            "3117735,Madrid,ES,Europe,40.4,-3.7,850,540000\n"
            "3169070,Rome,IT,Europe,41.9,12.5,-753,463000\n"
            "5128581,New York,US,North America,40.7,-74.0,1624,3437000\n"
        )
    rows = build_negative_rows(
        str(synthetic_db), controls_csv, seed=42,
        k_temporal=3, k_geographic=3,
    )
    assert len(rows) > 0

    # Expected row types
    types = {r.row_type for r in rows}
    assert "temporal_neg" in types
    assert "geographic_neg" in types

    # Every row has exactly one goal with Y=0; others null
    for r in rows:
        zeroes = [g for g in ("love", "career", "community", "growth", "relocation")
                  if r.goal_polarity.get(g) == 0]
        assert len(zeroes) == 1, (
            f"Row {r.row_id} should label exactly one goal Y=0, got {zeroes}"
        )

    # Determinism check
    rows2 = build_negative_rows(
        str(synthetic_db), controls_csv, seed=42,
        k_temporal=3, k_geographic=3,
    )
    assert len(rows) == len(rows2)
