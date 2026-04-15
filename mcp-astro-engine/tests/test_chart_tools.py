#!/usr/bin/env python3
"""
test_chart_tools.py — Regression tests for get_natal_chart and get_transit_chart.

These tests validate MCP tool error-handling contracts without requiring the
`natal` library to be installed, ensuring they always return valid JSON.

Skipped automatically if `fastmcp` / `mcp` is not installed in the
test environment (the engine runs in a separate venv on DigitalOcean).
"""
import sys
import os
import json
import pytest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Skip all tests in this module if the mcp/fastmcp package isn't available
try:
    from mcp.server.fastmcp import FastMCP  # noqa: F401
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False

pytestmark = pytest.mark.skipif(
    not MCP_AVAILABLE,
    reason="fastmcp not installed in this environment — chart tool tests skipped"
)


def test_get_natal_chart_unknown_user():
    """Should return JSON error, not raise, when user is not registered."""
    from server import get_natal_chart
    result = json.loads(get_natal_chart("no_such_user_xyz_abc"))
    assert "error" in result, f"Expected 'error' key, got: {list(result.keys())}"


def test_get_transit_chart_unknown_user():
    """Should return JSON error, not raise, when user is not registered."""
    from server import get_transit_chart
    result = json.loads(get_transit_chart("no_such_user_xyz_abc", "2026-03-01"))
    assert "error" in result, f"Expected 'error' key, got: {list(result.keys())}"


def test_get_transit_chart_bad_date():
    """Should return JSON error for an invalid date string, not crash."""
    from server import get_transit_chart
    result = json.loads(get_transit_chart("natalia", "not-a-valid-date"))
    assert "error" in result, f"Expected 'error' key, got: {list(result.keys())}"


def test_get_natal_chart_returns_json_string():
    """Return value must always be a valid JSON string."""
    from server import get_natal_chart
    raw = get_natal_chart("any_user_id")
    assert isinstance(raw, str)
    parsed = json.loads(raw)  # Should not raise
    assert isinstance(parsed, dict)


def test_get_transit_chart_returns_json_string():
    """Return value must always be a valid JSON string."""
    from server import get_transit_chart
    raw = get_transit_chart("any_user_id", "2026-03-01")
    assert isinstance(raw, str)
    parsed = json.loads(raw)
    assert isinstance(parsed, dict)
