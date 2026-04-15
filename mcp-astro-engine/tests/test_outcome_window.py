"""Tests for etl.outcome_window (the destination extractor + window math)."""

from __future__ import annotations

from datetime import date

from etl.outcome_window import _extract_destination, _parse_iso, _years_between


def test_parse_iso_ymd():
    assert _parse_iso("1923-12-31") == date(1923, 12, 31)


def test_parse_iso_handles_datetime_prefix():
    assert _parse_iso("1923-12-31T08:00:00") == date(1923, 12, 31)


def test_parse_iso_none_on_invalid():
    assert _parse_iso("") is None
    assert _parse_iso(None) is None


def test_years_between_basic():
    d1 = date(2020, 1, 1)
    d2 = date(2025, 1, 1)
    assert 4.9 < _years_between(d1, d2) < 5.1


def test_extract_destination_paris():
    assert _extract_destination("change residence: move to paris to write") == "paris"


def test_extract_destination_handles_missing():
    assert _extract_destination("change residence: unspecified") is None


def test_extract_destination_with_country():
    assert _extract_destination("change residence: moved to havana, cuba") == "havana, cuba"
