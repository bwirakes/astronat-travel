"""
1. Inserts/updates the 11 subjects missing from eval.db with correct birth times.
2. Re-runs the engine for all 19 relocation cases using accurate birth times.
3. Saves engine_request.json + engine_output.json to relocation-examples/<folder>/.

Run from mcp-astro-engine/:
    source venv/bin/activate && python -m evaluation.fix_birth_times_and_rerun
"""
from __future__ import annotations

import csv
import json
import re
import sqlite3
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent.parent))
from evaluation.upstream import build_engine_payload

ENDPOINT       = "http://localhost:3000/api/house-matrix"
PREDICTIONS_CSV = Path(__file__).parent / "experiments/EXP-0004-scenarios/predictions.csv"
EVAL_DB        = Path(__file__).parent.parent / "data/eval.db"
OUTPUT_BASE    = Path(__file__).parent / "experiments/relocation-examples"

# ---------------------------------------------------------------------------
# Verified birth times from Astro-Databank (Rodden ratings noted)
# ---------------------------------------------------------------------------
CORRECT_BIRTH_TIMES: dict[str, dict] = {
    "Einstein, Albert":    {"birth_date": "1879-03-14", "birth_time": "11:30:00", "rodden_rating": "AA",
                             "birth_lat": 48.4,  "birth_lon": 10.0},
    "Freud, Sigmund":      {"birth_date": "1856-05-06", "birth_time": "18:30:00", "rodden_rating": "AA",
                             "birth_lat": 49.633, "birth_lon": 18.15},
    "Tesla, Nikola":       {"birth_date": "1856-07-10", "birth_time": "00:00:00", "rodden_rating": "B",
                             "birth_lat": 44.567, "birth_lon": 15.283},
    "Bowie, David":        {"birth_date": "1947-01-08", "birth_time": "22:59:00", "rodden_rating": "A",
                             "birth_lat": 51.45,  "birth_lon": -0.117},
    "Hendrix, Jimi":       {"birth_date": "1942-11-27", "birth_time": "10:15:00", "rodden_rating": "AA",
                             "birth_lat": 47.6,   "birth_lon": -122.333},
    "Carrey, Jim":         {"birth_date": "1962-01-17", "birth_time": "02:30:00", "rodden_rating": "A",
                             "birth_lat": 44.05,  "birth_lon": -79.467},
    "Chaplin, Charles":    {"birth_date": "1889-04-16", "birth_time": "20:00:00", "rodden_rating": "B",
                             "birth_lat": 51.5,   "birth_lon": -0.167},
    "Taylor, Elizabeth":   {"birth_date": "1932-02-27", "birth_time": "02:30:00", "rodden_rating": "AA",
                             "birth_lat": 51.5,   "birth_lon": -0.167},
    "Stravinsky, Igor":    {"birth_date": "1882-06-17", "birth_time": "12:00:00", "rodden_rating": "AA",
                             "birth_lat": 59.917, "birth_lon": 29.767},
    "Joyce, James":        {"birth_date": "1882-02-02", "birth_time": "06:00:00", "rodden_rating": "A",
                             "birth_lat": 53.333, "birth_lon": -6.25},
    "Nietzsche, Friedrich":{"birth_date": "1844-10-15", "birth_time": "10:00:00", "rodden_rating": "B",
                             "birth_lat": 51.233, "birth_lon": 12.117},
}

def upsert_subjects(db_path: str) -> None:
    db = sqlite3.connect(db_path)
    for name, d in CORRECT_BIRTH_TIMES.items():
        existing = db.execute(
            "SELECT subject_id FROM subjects WHERE full_name = ?", (name,)
        ).fetchone()
        if existing:
            db.execute(
                """UPDATE subjects SET birth_time=?, birth_time_precision='minute',
                   rodden_rating=?, birth_lat=?, birth_lon=?
                   WHERE full_name=?""",
                (d["birth_time"], d["rodden_rating"], d["birth_lat"], d["birth_lon"], name),
            )
            print(f"  Updated: {name} → {d['birth_time']} ({d['rodden_rating']})")
        else:
            import uuid
            db.execute(
                """INSERT INTO subjects
                   (subject_id, astrodatabank_id, full_name, birth_date, birth_time,
                    birth_time_precision, birth_lat, birth_lon, rodden_rating)
                   VALUES (?,?,?,?,?,'minute',?,?,?)""",
                (str(uuid.uuid4()), name.lower().replace(", ", "-").replace(" ", "-"),
                 name, d["birth_date"], d["birth_time"],
                 d["birth_lat"], d["birth_lon"], d["rodden_rating"]),
            )
            print(f"  Inserted: {name} → {d['birth_time']} ({d['rodden_rating']})")
    db.commit()
    db.close()


def load_birth_times(db_path: str) -> dict[str, str]:
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    rows = db.execute("SELECT full_name, birth_time FROM subjects").fetchall()
    db.close()
    return {r["full_name"]: r["birth_time"] for r in rows}


def slug(name: str, date: str, loc: str) -> str:
    s = f"{name}_{date}_{loc}"
    s = re.sub(r"[^a-zA-Z0-9_-]", "-", s)
    return re.sub(r"-+", "-", s).strip("-")[:60]


def main() -> None:
    print("=== Step 1: Upserting birth times into eval.db ===")
    upsert_subjects(str(EVAL_DB))

    birth_times = load_birth_times(str(EVAL_DB))
    print(f"\nDB now has birth times for {len(birth_times)} subjects.\n")

    reloc_rows = [
        row for row in csv.DictReader(open(PREDICTIONS_CSV))
        if row.get("relocation") and row["relocation"] not in ("", "0")
    ]
    print(f"=== Step 2: Re-running engine for {len(reloc_rows)} relocation cases ===\n")

    for i, row in enumerate(reloc_rows, 1):
        name        = row["subject_name"]
        birth_time  = birth_times.get(name, "12:00:00")
        birth_date  = row["birth_date"]
        birth_lat   = float(row["birth_lat"])
        birth_lon   = float(row["birth_lon"])
        dest_lat    = float(row["location_lat"])
        dest_lon    = float(row["location_lon"])
        sample_date = row["sample_date"]
        loc_name    = row["location_name"]

        # Use corrected birth coords if available
        if name in CORRECT_BIRTH_TIMES:
            birth_lat = CORRECT_BIRTH_TIMES[name]["birth_lat"]
            birth_lon = CORRECT_BIRTH_TIMES[name]["birth_lon"]
            birth_date = CORRECT_BIRTH_TIMES[name]["birth_date"]

        name_slug   = name.replace(", ", "_").replace(",", "_")
        folder_name = f"{i:02d}_{slug(name_slug, sample_date, loc_name)}"
        folder      = OUTPUT_BASE / folder_name
        folder.mkdir(parents=True, exist_ok=True)

        print(f"[{i:02d}/19] {name} → {loc_name} ({sample_date})  birth_time={birth_time}")

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

        with open(folder / "engine_request.json", "w") as f:
            json.dump({
                "subject": name, "rodden_rating": row["rodden_rating"],
                "birth_date": birth_date, "birth_time": birth_time,
                "birth_lat": birth_lat, "birth_lon": birth_lon,
                "dest_lat": dest_lat, "dest_lon": dest_lon,
                "sample_date": sample_date, "location_name": loc_name,
                **payload_dict,
            }, f, indent=2)

        try:
            resp = requests.post(ENDPOINT, json=payload_dict, timeout=30)
            resp.raise_for_status()
            body = resp.json()
            with open(folder / "engine_output.json", "w") as f:
                json.dump(body, f, indent=2)
            print(f"         ✓  macroScore={body.get('macroScore')} ({body.get('macroVerdict')})")
        except Exception as e:
            print(f"         ✗  ERROR: {e}")
            with open(folder / "engine_output.json", "w") as f:
                json.dump({"error": str(e)}, f, indent=2)

    print("\nDone.")


if __name__ == "__main__":
    main()
