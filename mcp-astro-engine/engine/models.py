#!/usr/bin/env python3
"""
models.py — Pydantic schemas for all MCP tool responses.

These models enforce strict, predictable JSON contracts between the MCP server
and the LLM, eliminating hallucination risks in the data layer.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────────
# Shared
# ──────────────────────────────────────────────────────────────────────────────

class PlanetPosition(BaseModel):
    """A planet's position at a specific moment."""
    name: str
    longitude: float = Field(description="Ecliptic longitude 0-360°")
    sign: str = Field(description="Zodiac sign name")
    degree_in_sign: float = Field(description="Degree within the sign (0-30)")
    degree_minutes: int = Field(default=0, description="Arcminutes (0-59)")
    speed: float = Field(description="Daily motion in degrees")
    is_retrograde: bool
    house: int | None = Field(default=None, description="House placement (1-12) if user profile provided")
    computed_at_utc: str = Field(description="Exact ISO 8601 timestamp (UTC) of this calculation")


class NatalPlanet(BaseModel):
    """A planet in a user's natal chart."""
    name: str
    longitude: float
    sign: str
    degree_in_sign: float
    house: int | None = None


# ──────────────────────────────────────────────────────────────────────────────
# Ingress Events
# ──────────────────────────────────────────────────────────────────────────────

class IngressEvent(BaseModel):
    """A planet entering a new zodiac sign."""
    planet: str
    entered_sign: str
    exited_sign: str
    timestamp_utc: str = Field(description="ISO 8601 timestamp to the minute")
    is_retrograde_reentry: bool


class IngressQueryResult(BaseModel):
    """Response for get_historical_ingress tool."""
    query: str
    planet: str
    target_sign: str
    total_events: int
    events: list[IngressEvent]


# ──────────────────────────────────────────────────────────────────────────────
# Aspect Hits
# ──────────────────────────────────────────────────────────────────────────────

class AspectHit(BaseModel):
    """A single aspect between a transiting and natal planet."""
    transit_planet: str
    natal_planet: str
    aspect: str = Field(description="Conjunction, Sextile, Square, Trine, or Opposition")
    angle: int = Field(description="Exact angle of the aspect")
    orb: float = Field(description="Degrees from exact")
    is_exact: bool = Field(description="True if orb < 0.5°")
    date: str = Field(description="Date of the aspect (YYYY-MM-DD)")


# ──────────────────────────────────────────────────────────────────────────────
# Transit Forecast
# ──────────────────────────────────────────────────────────────────────────────

class RetrogradePeriod(BaseModel):
    """A retrograde period for a planet."""
    planet: str
    start_date: str
    end_date: str
    sign: str


class TransitForecast(BaseModel):
    """Response for get_12_month_transits tool."""
    user_id: str
    user_name: str
    period_start: str
    period_end: str
    major_aspects: list[AspectHit]
    ingresses: list[IngressEvent]
    retrograde_periods: list[RetrogradePeriod]


# ──────────────────────────────────────────────────────────────────────────────
# Daily Cosmic Weather
# ──────────────────────────────────────────────────────────────────────────────

class DailyWeather(BaseModel):
    """Response for get_daily_cosmic_weather tool."""
    user_id: str
    user_name: str
    date: str
    computed_at_utc: str = Field(description="Exact ISO 8601 timestamp (UTC) of this calculation")
    transit_positions: list[PlanetPosition]
    active_aspects: list[AspectHit]
    ingresses_today: list[IngressEvent]


# ──────────────────────────────────────────────────────────────────────────────
# User Registration
# ──────────────────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    """Response for register_user tool."""
    user_id: str
    display_name: str
    natal_planets: list[NatalPlanet]
    house_cusps: list[float]
    message: str


# ──────────────────────────────────────────────────────────────────────────────
# Astrocartography
# ──────────────────────────────────────────────────────────────────────────────

class AstroCartographyLine(BaseModel):
    """One planet's angular line on the world map."""
    planet: str
    angle_type: str = Field(description="'MC', 'IC', 'ASC', or 'DSC'")
    longitude: float | None = Field(default=None, description="Longitude for vertical MC/IC lines")
    points: list[dict] | None = Field(default=None, description="List of {lat, lon} dicts for ASC/DSC curves")

class CityRelocationAspects(BaseModel):
    """How planetary lines interact with a specific city."""
    city_query: str
    resolved_address: str
    latitude: float
    longitude: float
    closest_lines: list[dict] = Field(description="Sorted list of {'planet', 'angle', 'distance_km'}")

class AstroCartographyMap(BaseModel):
    """Response for astrocartography tools."""
    computed_at_utc: str
    label: str = Field(description="'Natal Map', or Transiting ISO Date")
    user_id: str | None = Field(default=None)
    lines: list[AstroCartographyLine]
    total_lines: int
