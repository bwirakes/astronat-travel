# Astrological Transit Engine — MCP Server

Enterprise-grade, LLM-integrated astrological transit engine backed by the Swiss Ephemeris (NASA JPL DE431). Pre-computes 700 years (1500–2200 CE) of planetary data into an ultra-fast SQLite cache, exposed via Model Context Protocol (MCP) endpoints.

## Architecture

```
┌─────────────────────────────────────┐
│          LLM (via MCP)              │
│  "When was Neptune in Gemini?"      │
└─────────┬───────────────────────────┘
          │ FastMCP (stdio)
┌─────────▼───────────────────────────┐
│        server.py (MCP Server)       │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ transits.py  │  │  aspects.py  │  │
│  │ (solver)     │  │  (geometry)  │  │
│  └──────┬──────┘  └──────────────┘  │
│         │ SQL queries (<5ms)        │
│  ┌──────▼───────────────────────┐   │
│  │   astro_engine.db (SQLite)   │   │
│  │   1.46M rows, 84K ingresses  │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## MCP Tools

| Tool | Description | Example Query |
|------|-------------|---------------|
| `get_historical_ingress` | When did a planet enter a sign? | "When was Neptune in Gemini?" |
| `get_12_month_transits` | 12-month aspect forecast | "What major transits are coming?" |
| `get_daily_cosmic_weather` | Today's transits vs natal chart | "What's the cosmic weather today?" |
| `register_user` | Register a new user's birth chart | "Add my friend's chart" |

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) Download high-precision ephemeris files
bash etl/download_ephe.sh

# 3. Build the 400-year ephemeris cache
python3 etl/build_ephemeris.py

# 4. Run tests
python3 -m pytest tests/ -v

# 5. Run server (stdio mode for MCP)
python3 server.py

# 6. Test mode (standalone)
python3 server.py --test
```

## Database Schema

### `ephemeris_daily` (1.46M rows)
Daily 00:00 UT positions for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.

### `zodiac_ingresses` (84K events)
Pre-computed sign-change timestamps with minute-level precision via binary bisection.

### `user_profiles_cache`
Multi-user natal chart cache. Brandon is pre-seeded; additional users registered via MCP tool.

## Ground Truth Validation

Validated against official Swiss Ephemeris PDFs from AstroDienst for dates 126 years apart:
- **1900-01-01**: Sun, Jupiter, Neptune — max drift 0.0000004°
- **2026-02-01**: Sun, Neptune, Saturn — max drift 0.0000003°
- **Threshold**: ±0.001° (4 arcseconds)
- **Result**: ✅ All 6 checkpoints pass
