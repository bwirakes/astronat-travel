#!/usr/bin/env python3
"""
test_kerykeion_natal.py — Kerykeion Natal API Tests
=====================================================
Tests the refactored natal_chart_utils.py (kerykeion backend).

Test categories:
  1. Unit tests — no database needed (hardcoded birth data)
  2. Integration tests — require astro_engine.db (marked with @pytest.mark.integration)

Run all:
    pytest tests/test_kerykeion_natal.py -v

Run unit only (CI-safe):
    pytest tests/test_kerykeion_natal.py -v -m "not integration"
"""
import os
import sys
import pytest
from pathlib import Path
from datetime import date, datetime, timezone

# Add project root so we can import engine modules
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Add skill-layer scripts to path (for natal_chart_utils)
SKILL_SCRIPTS = PROJECT_ROOT.parent / "skills" / "astro-research" / "scripts"
if SKILL_SCRIPTS.exists():
    sys.path.insert(0, str(SKILL_SCRIPTS))


# ──────────────────────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def kerykeion_available():
    try:
        import kerykeion  # noqa: F401
        return True
    except ImportError:
        return False


@pytest.fixture(scope="session")
def brandon_subject(kerykeion_available):
    """Brandon's known birth data as a kerykeion subject (no DB required)."""
    if not kerykeion_available:
        pytest.skip("kerykeion not installed")
    from kerykeion import AstrologicalSubjectFactory
    # Brandon: 1988-08-17 22:15 WIB (UTC+7) in Jakarta → UTC 15:15 on same date
    return AstrologicalSubjectFactory.from_birth_data(
        name="Brandon",
        year=1988, month=8, day=17,
        hour=15, minute=15,
        lat=-6.2088, lng=106.8456,
        tz_str="UTC",
        online=False,
    )


@pytest.fixture(scope="session")
def natalia_subject(kerykeion_available):
    """Natalia's known birth data (no DB required)."""
    if not kerykeion_available:
        pytest.skip("kerykeion not installed")
    from kerykeion import AstrologicalSubjectFactory
    # Natalia: 1990-12-23 15:57 SGT (UTC+8) → UTC 07:57 on same date
    return AstrologicalSubjectFactory.from_birth_data(
        name="Natalia",
        year=1990, month=12, day=23,
        hour=7, minute=57,
        lat=1.3521, lng=103.8198,
        tz_str="UTC",
        online=False,
    )


@pytest.fixture(scope="session")
def today_str():
    return date.today().isoformat()


# ──────────────────────────────────────────────────────────────────────────────
# 1. Unit Tests — kerykeion subject correctness
# ──────────────────────────────────────────────────────────────────────────────

class TestSubjectCreation:
    """Validate kerykeion subjects for known birth data."""

    def test_brandon_sun_sign(self, brandon_subject):
        """Brandon (Leo Sun) — sun should be in Leo."""
        from natal_chart_utils import _expand_sign
        sun_sign = _expand_sign(brandon_subject.sun.sign)
        assert sun_sign == "Leo", f"Expected Leo, got {sun_sign}"

    def test_brandon_subject_has_planets(self, brandon_subject):
        assert brandon_subject.sun is not None
        assert brandon_subject.moon is not None
        assert brandon_subject.mercury is not None

    def test_natalia_subject_creates(self, natalia_subject):
        assert natalia_subject is not None
        assert natalia_subject.name == "Natalia"

    def test_subject_has_coordinates(self, brandon_subject):
        assert abs(brandon_subject.lat - (-6.2088)) < 0.01
        assert abs(brandon_subject.lng - 106.8456) < 0.01


# ──────────────────────────────────────────────────────────────────────────────
# 2. Unit Tests — get_chart_stats shape & content
# ──────────────────────────────────────────────────────────────────────────────

class TestChartStats:
    """Validate get_chart_stats() returns expected structure."""

    def test_stats_has_required_keys(self, brandon_subject, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import get_chart_stats
        stats = get_chart_stats(brandon_subject)
        assert "planets" in stats
        assert "aspects" in stats
        assert "element_counts" in stats
        assert "modality_counts" in stats
        assert "sun_sign" in stats
        assert "moon_sign" in stats

    def test_stats_has_planets(self, brandon_subject, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import get_chart_stats
        stats = get_chart_stats(brandon_subject)
        assert len(stats["planets"]) >= 10, "Expected at least 10 planet entries"

    def test_planet_shape(self, brandon_subject, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import get_chart_stats
        stats = get_chart_stats(brandon_subject)
        for p in stats["planets"]:
            assert "name" in p
            assert "sign" in p
            assert "degree" in p
            assert "retrograde" in p
            assert isinstance(p["degree"], float)
            assert isinstance(p["retrograde"], bool)

    def test_sun_sign_is_leo(self, brandon_subject, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import get_chart_stats
        stats = get_chart_stats(brandon_subject)
        assert stats["sun_sign"].lower() == "leo", (
            f"Brandon's Sun should be Leo, got: {stats['sun_sign']}"
        )

    def test_stats_returns_empty_for_none(self, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import get_chart_stats
        result = get_chart_stats(None)
        assert result == {}


# ──────────────────────────────────────────────────────────────────────────────
# 3. Unit Tests — transit subject & stats
# ──────────────────────────────────────────────────────────────────────────────

class TestTransitSubject:
    """Validate transit subject creation and stats."""

    def test_transit_subject_creates(self, brandon_subject, today_str, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import _build_transit_subject
        ts = _build_transit_subject(brandon_subject.lat, brandon_subject.lng, today_str)
        assert ts is not None
        assert ts.name == "Transit"

    def test_transit_stats_has_date(self, brandon_subject, today_str, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import get_transit_stats
        stats = get_transit_stats(brandon_subject, today_str)
        assert stats.get("date") == today_str
        assert stats.get("type") == "transit"
        assert len(stats.get("planets", [])) >= 10


# ──────────────────────────────────────────────────────────────────────────────
# 4. Unit Tests — SVG generation (no Notion upload)
# ──────────────────────────────────────────────────────────────────────────────

class TestSvgGeneration:
    """Validate ChartDrawer produces valid SVG."""

    def test_natal_svg_is_nonempty(self, brandon_subject, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from kerykeion.chart_data_factory import ChartDataFactory
        from kerykeion.charts.chart_drawer import ChartDrawer
        chart_data = ChartDataFactory.create_natal_chart_data(brandon_subject)
        svg = ChartDrawer(chart_data=chart_data).generate_svg_string()
        assert svg and len(svg) > 1000, "SVG should be substantial"
        assert "<svg" in svg.lower(), f"Output should contain SVG markup, got: {svg[:100]}"

    def test_transit_svg_is_nonempty(self, brandon_subject, today_str, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from kerykeion import AstrologicalSubjectFactory
        from kerykeion.chart_data_factory import ChartDataFactory
        from kerykeion.charts.chart_drawer import ChartDrawer
        y, mo, d = (int(x) for x in today_str.split("-"))
        transit = AstrologicalSubjectFactory.from_birth_data(
            "Transit", y, mo, d, 12, 0,
            lat=brandon_subject.lat, lng=brandon_subject.lng,
            tz_str="UTC", online=False,
        )
        chart_data = ChartDataFactory.create_transit_chart_data(brandon_subject, transit)
        svg = ChartDrawer(chart_data=chart_data).generate_svg_string()
        assert svg and "<svg" in svg.lower()


# ──────────────────────────────────────────────────────────────────────────────
# 5. Unit Tests — Public API compatibility
# ──────────────────────────────────────────────────────────────────────────────

class TestPublicApiShape:
    """Ensure public function signatures are unchanged (callers won't break)."""

    def test_generate_chart_png_birth_returns_bytes(self, brandon_subject, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        try:
            import cairosvg
            cairosvg.svg2png  # trigger OSError if libcairo missing
        except (ImportError, OSError):
            pytest.skip("cairosvg/libcairo not available on this system")
        from natal_chart_utils import generate_chart_png
        result = generate_chart_png(brandon_subject)
        assert isinstance(result, bytes)
        assert len(result) > 0, "PNG bytes should be non-empty"

    def test_generate_chart_png_transit_returns_bytes(self, brandon_subject, today_str, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        try:
            import cairosvg
            cairosvg.svg2png  # trigger OSError if libcairo missing  
        except (ImportError, OSError):
            pytest.skip("cairosvg/libcairo not available on this system")
        from natal_chart_utils import generate_chart_png
        result = generate_chart_png(brandon_subject, today_str)
        assert isinstance(result, bytes)

    def test_format_chart_stats_markdown(self, brandon_subject, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import get_chart_stats, format_chart_stats_markdown
        stats = get_chart_stats(brandon_subject)
        md = format_chart_stats_markdown(stats, "Brandon Natal")
        assert "Brandon Natal" in md
        assert "| Planet |" in md
        assert "Leo" in md  # Brandon's Sun

    def test_expand_sign_roundtrip(self):
        """All kerykeion 3-letter abbreviations should map correctly."""
        from natal_chart_utils import _expand_sign, _SIGN_MAP
        for abbr, full in _SIGN_MAP.items():
            assert _expand_sign(abbr) == full


# ──────────────────────────────────────────────────────────────────────────────
# 6. Integration Tests — require astro_engine.db
# ──────────────────────────────────────────────────────────────────────────────

DB_PATH = PROJECT_ROOT / "data" / "astro_engine.db"


@pytest.mark.integration
class TestBuildNatalDataFromDB:
    """Tests that need the live SQLite database."""

    @pytest.fixture(autouse=True)
    def require_db(self):
        if not DB_PATH.exists():
            pytest.skip(f"astro_engine.db not found at {DB_PATH}")

    def test_brandon_loads_from_db(self, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import build_natal_data
        subject, name = build_natal_data("brandon")
        assert subject is not None, "brandon should be in the DB"
        assert "brandon" in name.lower() or "wirakesuma" in name.lower()

    def test_natalia_loads_from_db(self, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import build_natal_data
        subject, name = build_natal_data("natalia")
        assert subject is not None, "natalia should be in the DB"

    def test_unknown_user_returns_none(self, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import build_natal_data
        subject, name = build_natal_data("no_such_user_xyz_42")
        assert subject is None
        assert name is None

    def test_brandon_sun_leo_via_db(self, kerykeion_available):
        if not kerykeion_available:
            pytest.skip("kerykeion not installed")
        from natal_chart_utils import build_natal_data, get_chart_stats
        subject, _ = build_natal_data("brandon")
        stats = get_chart_stats(subject)
        assert stats["sun_sign"].lower() == "leo"
