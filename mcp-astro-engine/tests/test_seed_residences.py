"""Tests for etl.seed_residences_from_events destination parser."""

from __future__ import annotations

from etl.seed_residences_from_events import _parse_destination


def test_simple_move_to_paris():
    assert _parse_destination("Change residence: Move to Paris to write") == "Paris"


def test_moved_past_tense():
    assert _parse_destination("Change residence: Moved to Key West, FL") == "Key West, FL"


def test_move_with_country():
    assert _parse_destination("Change residence: Move to Havana, Cuba") == "Havana, Cuba"


def test_no_destination_returns_none():
    assert _parse_destination("Change residence: Miscellaneous") is None


def test_strips_prefix_case_insensitive():
    assert _parse_destination("CHANGE RESIDENCE: Moved to London") == "London"


def test_handles_extra_context():
    # Trailing context should be dropped
    result = _parse_destination(
        "Change residence: Move to New York for a publishing job"
    )
    assert result == "New York"


def test_empty_input():
    assert _parse_destination("") is None
    assert _parse_destination("Change residence:") is None
