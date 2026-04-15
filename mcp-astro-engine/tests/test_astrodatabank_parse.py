"""Unit tests for etl.astrodatabank_parse (BS4 HTML parser).

Uses a saved Hemingway fixture so tests run without Firecrawl credits.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from etl.astrodatabank_parse import parse_html


FIXTURE_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="module")
def hemingway():
    html = (FIXTURE_DIR / "hemingway.html").read_text()
    return parse_html("Hemingway,_Ernest", html)


# ============================================================================
# Core birth data
# ============================================================================


def test_full_name(hemingway):
    assert hemingway.astrodatabank_id == "Hemingway,_Ernest"
    assert hemingway.full_name == "Hemingway, Ernest"


def test_birthname(hemingway):
    assert hemingway.birthname == "Ernest Miller Hemingway"


def test_birth_date(hemingway):
    assert hemingway.birth_date == "1899-07-21"


def test_birth_time_minute_precision(hemingway):
    assert hemingway.birth_time == "08:00:00"
    assert hemingway.birth_time_precision == "minute"


def test_sex(hemingway):
    assert hemingway.sex == "M"


def test_birthplace(hemingway):
    assert hemingway.birth_location_name == "Oak Park, Illinois"


def test_birth_coordinates(hemingway):
    # 41°53' N, 87°47' W ≈ 41.883, -87.783 (Oak Park, Illinois)
    assert abs(hemingway.birth_lat - 41.883) < 0.01
    assert abs(hemingway.birth_lon - (-87.783)) < 0.01


# ============================================================================
# Rodden rating
# ============================================================================


def test_rodden_rating_is_aa(hemingway):
    assert hemingway.rodden_rating == "AA"


def test_rating_collector(hemingway):
    assert hemingway.rating_collector == "Scholfield"


def test_rating_source_notes(hemingway):
    # The "BC/BR in hand" text appears before "Rodden Rating" in the Data
    # source field.
    assert hemingway.rating_source_notes is not None
    assert "BC/BR" in hemingway.rating_source_notes


# ============================================================================
# Death
# ============================================================================


def test_death_year_from_categories(hemingway):
    # Hemingway died 1961-07-02. The infobox didn't have a "died" row, but
    # the MediaWiki category "1961 deaths" should populate death_date.
    assert hemingway.death_date is not None
    assert hemingway.death_date.startswith("1961")


def test_death_notes_from_categories(hemingway):
    assert hemingway.death_notes is not None
    assert "Suicide" in hemingway.death_notes


# ============================================================================
# Professions
# ============================================================================


def test_profession_tags_includes_writer(hemingway):
    # "Vocation : Writers : Fiction" should produce "Fiction"
    assert any("Fiction" in v or "Writer" in v for v in hemingway.profession_tags)


def test_profession_tags_non_empty(hemingway):
    assert len(hemingway.profession_tags) >= 1


# ============================================================================
# Events
# ============================================================================


def test_events_count(hemingway):
    # We saw 18 events in the markdown run. BS4 should find the same set.
    assert len(hemingway.raw_events) >= 15


def test_first_event_is_injury_1918(hemingway):
    evt = hemingway.raw_events[0]
    assert evt.date_iso == "1918-07-08"
    assert evt.date_precision == "day"
    assert evt.category == "Health"
    assert "Schrapnel" in evt.description or "Shrapnel" in evt.description


def test_marriage_1920_event(hemingway):
    marriages = [
        e for e in hemingway.raw_events
        if e.category == "Relationship" and e.date_iso.startswith("1920")
    ]
    assert len(marriages) == 1
    assert "Hadley" in marriages[0].description


def test_paris_relocation_1923(hemingway):
    paris_events = [
        e for e in hemingway.raw_events
        if "Paris" in e.description and e.category == "Family"
    ]
    assert len(paris_events) == 1
    assert paris_events[0].date_iso == "1923-12-31"
    assert paris_events[0].date_precision == "day"
    assert paris_events[0].subcategory == "Change residence"


def test_nobel_prize_1954(hemingway):
    nobel = [
        e for e in hemingway.raw_events
        if "Nobel" in e.description
    ]
    assert len(nobel) == 1
    assert nobel[0].date_iso.startswith("1954")
    assert nobel[0].category == "Work"


def test_all_events_have_iso_date(hemingway):
    for e in hemingway.raw_events:
        assert e.date_iso is not None
        assert e.date_precision in {"day", "month", "year"}


def test_event_subcategory_extracted(hemingway):
    # The "Change residence" events should have subcategory populated
    change_residences = [
        e for e in hemingway.raw_events if e.subcategory == "Change residence"
    ]
    assert len(change_residences) >= 3  # Paris, Key West, Havana
