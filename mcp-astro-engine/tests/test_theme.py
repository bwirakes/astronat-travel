"""
Smoke test: kerykeion SVG generation with the light theme + remove_css_variables.
Writes the SVG to a tempfile and cleans up automatically.
"""
import tempfile
import os
import pytest

from kerykeion import AstrologicalSubjectFactory
from kerykeion.chart_data_factory import ChartDataFactory
from kerykeion.charts.chart_drawer import ChartDrawer


def test_light_theme_svg_generation():
    """Generate a natal chart SVG in light theme and verify it is non-empty."""
    subject = AstrologicalSubjectFactory.from_birth_data(
        "Brandon", 1988, 8, 17, 15, 15,
        lat=-6.2, lng=106.8, tz_str="UTC", online=False,
    )
    chart_data = ChartDataFactory.create_natal_chart_data(subject)
    drawer = ChartDrawer(chart_data=chart_data)

    # Use remove_css_variables so the SVG is portable (no unresolved CSS vars)
    svg = drawer.generate_svg_string(remove_css_variables=True)
    assert svg and len(svg) > 1000, "Expected a non-trivial SVG string"
    assert "<svg" in svg.lower(), "Output does not look like valid SVG"

    # Write to a temp file and confirm it is saved correctly, then auto-cleanup
    with tempfile.NamedTemporaryFile(suffix=".svg", mode="w", delete=False) as tmp:
        tmp_path = tmp.name
        tmp.write(svg)

    try:
        assert os.path.getsize(tmp_path) > 0, "SVG file was empty"
    finally:
        os.remove(tmp_path)
