"""Tests for etl.map_event_polarity.

Verify that common Astro-Databank event types map to the expected per-goal
polarities per docs/ml-evaluation/01c §5.
"""

from __future__ import annotations

from etl.map_event_polarity import map_event, GOALS


def test_marriage_is_c_case_positive_love():
    p = map_event("relationship", "Marriage", "Marriage: Hadley Richardson")
    assert p.love == 1
    assert p.is_c_case is True
    assert p.career is None
    assert p.relocation is None


def test_divorce_is_negative_love_not_c_case():
    p = map_event("relationship", "Divorce", "Divorce: Hadley Richardson")
    assert p.love == -1
    assert p.is_c_case is False


def test_nobel_prize_is_unambiguous_positive_career():
    p = map_event("work", "Prize", "Prize: Nobel Prize for Literature")
    assert p.career == 1
    assert p.is_c_case is False        # awards don't need outcome windows


def test_publication_is_c_case_positive_career():
    p = map_event("work", "Published/ Exhibited/ Released",
                  "Published: Reputation established with Sun Also Rises")
    assert p.career == 1
    assert p.is_c_case is True


def test_change_residence_is_c_case_positive_relocation():
    p = map_event("family", "Change residence",
                  "Change residence: Move to Paris to write")
    assert p.relocation == 1
    assert p.is_c_case is True
    # Relocation event should NOT auto-label career/love
    assert p.career is None
    assert p.love is None


def test_accident_is_negative_growth():
    p = map_event("health", "Accident (Non-fatal)", "Accident (Non-fatal): Car accident")
    assert p.growth == -1
    assert p.career is None


def test_crime_is_negative_career():
    p = map_event("crime", None, "Arrest and conviction")
    assert p.career == -1


def test_mental_breakdown_is_negative_growth():
    p = map_event("mental_health", "Psychotic episode", "Began of mental breakdown")
    assert p.growth == -1


def test_social_travel_is_all_null():
    """'Social : Begin Travel' is a trip marker, not a community signal."""
    p = map_event("social", "Begin Travel", "Travel to Mayo for shock treatments")
    # No goal should fire on plain travel — it's neither community formation
    # nor relocation.
    assert all(getattr(p, g) is None for g in GOALS)


def test_bankruptcy_is_negative_career():
    p = map_event("financial", "Loss", "Major bankruptcy")
    assert p.career == -1


def test_unrecognized_event_returns_all_null():
    p = map_event("unknown", None, "Something random")
    assert all(getattr(p, g) is None for g in GOALS)


def test_polarity_serialization():
    p = map_event("work", "Prize", "Prize: Nobel")
    d = p.as_dict()
    assert d["career"] == 1
    assert d["is_c_case"] is False
    assert "confidence" in d
    assert set(d.keys()) == set(GOALS) | {"is_c_case", "confidence"}
