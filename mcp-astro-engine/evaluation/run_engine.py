"""Python client for the /api/house-matrix scoring endpoint.

Requires the Next.js dev server running (npm run dev). See
docs/ml-evaluation/04 §4.3 "Stage 2: Run engine".
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional

import requests

from evaluation.upstream import EnginePayload, build_engine_payload


DEFAULT_ENDPOINT = "http://localhost:3000/api/house-matrix"


@dataclass
class EngineInputRow:
    row_id: str
    birth_date: str
    birth_time: str
    birth_lat: float
    birth_lon: float
    dest_lat: float
    dest_lon: float
    sample_date: str


@dataclass
class EngineOutputRow:
    row_id: str
    status: str                          # "ok" | "error"
    error: Optional[str] = None
    macro_score: Optional[float] = None
    macro_verdict: Optional[str] = None
    houses: Optional[dict[int, float]] = None     # {1: 60, 2: 32, ..., 12: 48}


def score_row(
    row: EngineInputRow,
    endpoint: str = DEFAULT_ENDPOINT,
    timeout_s: int = 30,
) -> EngineOutputRow:
    try:
        payload = build_engine_payload(
            birth_date=row.birth_date,
            birth_time=row.birth_time,
            birth_lat=row.birth_lat,
            birth_lon=row.birth_lon,
            dest_lat=row.dest_lat,
            dest_lon=row.dest_lon,
            sample_date=row.sample_date,
        )
    except Exception as e:
        return EngineOutputRow(row.row_id, status="error", error=f"upstream: {e}")

    try:
        resp = requests.post(
            endpoint,
            json=payload.as_json_dict(),
            timeout=timeout_s,
        )
        resp.raise_for_status()
    except requests.HTTPError as e:
        return EngineOutputRow(
            row.row_id, status="error",
            error=f"http {resp.status_code}: {resp.text[:200]}",
        )
    except requests.RequestException as e:
        return EngineOutputRow(
            row.row_id, status="error", error=f"http: {e}"
        )

    try:
        body = resp.json()
    except json.JSONDecodeError as e:
        return EngineOutputRow(
            row.row_id, status="error", error=f"json: {e}"
        )

    if "error" in body:
        return EngineOutputRow(
            row.row_id, status="error", error=body.get("detail") or body["error"]
        )

    houses: dict[int, float] = {}
    for h in body.get("houses", []):
        try:
            houses[int(h["house"])] = float(h["score"])
        except (KeyError, ValueError, TypeError):
            continue

    return EngineOutputRow(
        row_id=row.row_id,
        status="ok",
        macro_score=body.get("macroScore"),
        macro_verdict=body.get("macroVerdict"),
        houses=houses or None,
    )


def main() -> int:
    """Smoke test — Hemingway 1926 Paris."""
    row = EngineInputRow(
        row_id="smoke-hemingway-paris-1926",
        birth_date="1899-07-21",
        birth_time="08:00:00",
        birth_lat=41.883,
        birth_lon=-87.783,
        dest_lat=48.857,
        dest_lon=2.352,
        sample_date="1926-10-22",
    )
    r = score_row(row)
    print(f"status        = {r.status}")
    if r.status == "ok":
        print(f"macroScore    = {r.macro_score}")
        print(f"macroVerdict  = {r.macro_verdict}")
    else:
        print(f"error: {r.error}")
    return 0 if r.status == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(main())
