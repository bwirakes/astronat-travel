"""
Fetch full engine JSON output for all 19 relocation-labeled rows.
Saves to evaluation/experiments/relocation-examples/<folder>/engine_output.json
and the corresponding request payload to engine_request.json.

Usage (from mcp-astro-engine/):
    python -m evaluation.fetch_relocation_outputs
"""

from __future__ import annotations

import csv
import json
import re
import sqlite3
import sys
import os
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent.parent))
from evaluation.upstream import build_engine_payload

ENDPOINT = "http://localhost:3000/api/house-matrix"
PREDICTIONS_CSV = Path(__file__).parent / "experiments/EXP-0004-scenarios/predictions.csv"
EVAL_DB = Path(__file__).parent.parent / "data/eval.db"
OUTPUT_BASE = Path(__file__).parent / "experiments/relocation-examples"


def load_birth_times() -> dict[str, str]:
    """Return {full_name: birth_time} from eval.db subjects table."""
    db = sqlite3.connect(str(EVAL_DB))
    db.row_factory = sqlite3.Row
    rows = db.execute("SELECT full_name, birth_time FROM subjects").fetchall()
    db.close()
    return {r["full_name"]: r["birth_time"] for r in rows}


def slug(name: str, date: str, loc: str) -> str:
    s = f"{name}_{date}_{loc}"
    s = re.sub(r"[^a-zA-Z0-9_-]", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:60]


def main() -> None:
    birth_times = load_birth_times()
    print(f"Loaded birth times for {len(birth_times)} subjects from DB")

    relocation_rows = []
    with open(PREDICTIONS_CSV) as f:
        for row in csv.DictReader(f):
            if row.get("relocation") and row["relocation"] not in ("", "0"):
                relocation_rows.append(row)

    print(f"Found {len(relocation_rows)} relocation rows — calling engine...\n")

    for i, row in enumerate(relocation_rows, 1):
        name = row["subject_name"]
        birth_time = birth_times.get(name, "12:00:00")
        birth_date = row["birth_date"]
        birth_lat = float(row["birth_lat"])
        birth_lon = float(row["birth_lon"])
        dest_lat = float(row["location_lat"])
        dest_lon = float(row["location_lon"])
        sample_date = row["sample_date"]
        location_name = row["location_name"]

        name_slug = name.replace(", ", "_").replace(",", "_")
        folder_name = f"{i:02d}_{slug(name_slug, sample_date, location_name)}"
        folder = OUTPUT_BASE / folder_name
        folder.mkdir(parents=True, exist_ok=True)

        print(f"[{i:02d}/19] {name} → {location_name} ({sample_date}) birth_time={birth_time}")

        # Build payload
        payload = build_engine_payload(
            birth_date=birth_date,
            birth_time=birth_time,
            birth_lat=birth_lat,
            birth_lon=birth_lon,
            dest_lat=dest_lat,
            dest_lon=dest_lon,
            sample_date=sample_date,
        )
        payload_dict = payload.as_json_dict()

        # Save request
        with open(folder / "engine_request.json", "w") as f:
            json.dump({
                "subject": name,
                "rodden_rating": row["rodden_rating"],
                "birth_date": birth_date,
                "birth_time": birth_time,
                "birth_lat": birth_lat,
                "birth_lon": birth_lon,
                "dest_lat": dest_lat,
                "dest_lon": dest_lon,
                "sample_date": sample_date,
                "location_name": location_name,
                **payload_dict,
            }, f, indent=2)

        # Call engine
        try:
            resp = requests.post(ENDPOINT, json=payload_dict, timeout=30)
            resp.raise_for_status()
            body = resp.json()
            with open(folder / "engine_output.json", "w") as f:
                json.dump(body, f, indent=2)
            macro = body.get("macroScore", "?")
            verdict = body.get("macroVerdict", "?")
            print(f"         ✓ macroScore={macro} ({verdict})")
        except Exception as e:
            print(f"         ✗ ERROR: {e}")
            with open(folder / "engine_output.json", "w") as f:
                json.dump({"error": str(e)}, f, indent=2)

    print("\nDone. Files written to experiments/relocation-examples/")


if __name__ == "__main__":
    main()
