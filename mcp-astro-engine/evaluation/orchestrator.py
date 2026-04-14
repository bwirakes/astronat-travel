"""End-to-end evaluation pipeline.

Stage 1: build EvalRows from DB   (row_builder)
Stage 2: compute engine inputs    (upstream)
Stage 3: POST to /api/house-matrix (run_engine)
Stage 4: collect results + metrics on macroScore per goal

Outputs to experiments/EXP-####/:
    predictions.csv       — one row per EvalRow with macroScore + labels
    run_manifest.json     — engine/dataset versions + run stats
    report.md             — human-readable summary
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from evaluation.negative_sampling import (
    NEGATIVE_SAMPLING_VERSION,
    build_negative_rows,
)
from evaluation.row_builder import EvalRow, build_positive_rows
from evaluation.run_engine import (
    DEFAULT_ENDPOINT,
    EngineInputRow,
    EngineOutputRow,
    score_row,
)
from evaluation.weight_scenarios import (
    GOALS as SCENARIO_GOALS,
    SCENARIOS,
    SCENARIO_VERSION,
    compute_all_scenarios,
    scenario_names,
)


EXP_ROOT = Path("evaluation/experiments")
PIPELINE_VERSION = "v0.2-with-negatives"
DEFAULT_CONTROL_CITIES = "data/control_cities.csv"


def _git_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=".", text=True
        ).strip()
    except Exception:
        return "unknown"


def run(
    db_path: str,
    exp_id: str,
    endpoint: str = DEFAULT_ENDPOINT,
    limit: int = 0,
    throttle_s: float = 0.0,
    include_negatives: bool = True,
    control_cities_csv: str = DEFAULT_CONTROL_CITIES,
    k_temporal: int = 3,
    k_geographic: int = 5,
    seed: int = 42,
) -> Path:
    out_dir = EXP_ROOT / exp_id
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Building positive rows from {db_path} ...")
    positive_rows: list[EvalRow] = build_positive_rows(db_path)
    negative_rows: list[EvalRow] = []
    if include_negatives:
        print(f"Building negative rows (k_temporal={k_temporal}, k_geographic={k_geographic}) ...")
        negative_rows = build_negative_rows(
            db_path=db_path, control_cities_csv=control_cities_csv,
            seed=seed, k_temporal=k_temporal, k_geographic=k_geographic,
        )
    rows: list[EvalRow] = list(positive_rows) + list(negative_rows)
    if limit:
        rows = rows[:limit]
    n_pos = sum(1 for r in rows if r.row_type == "positive")
    n_temp = sum(1 for r in rows if r.row_type == "temporal_neg")
    n_geo = sum(1 for r in rows if r.row_type == "geographic_neg")
    print(f"  {len(rows)} total: {n_pos} positive, {n_temp} temporal_neg, {n_geo} geographic_neg")

    started = datetime.now(timezone.utc).isoformat()
    pred_path = out_dir / "predictions.csv"
    # Columns: metadata + labels + macroScore + h1..h12 + per-scenario per-goal scores
    fieldnames = [
        "row_id", "subject_id", "subject_name", "rodden_rating",
        "row_type", "event_id", "event_type", "sample_date",
        "location_name", "location_lat", "location_lon",
        "birth_date", "birth_lat", "birth_lon",
        "status", "error",
        "macro_score", "macro_verdict",
        "love", "career", "community", "growth", "relocation",
        "is_c_case",
        # Path-dependency features (present on negative rows only)
        "years_since_last_positive",
        "trajectory_phase",
    ]
    # Per-house scores
    for h in range(1, 13):
        fieldnames.append(f"H{h}")
    # Per-scenario per-goal scores: `score__<scenario>__<goal>`
    for sc in scenario_names():
        for g in SCENARIO_GOALS:
            fieldnames.append(f"score__{sc}__{g}")

    stats = {
        "rows_total": len(rows),
        "rows_ok": 0,
        "rows_error": 0,
        "macro_score_sum": 0.0,
        "macro_score_count": 0,
        "per_verdict": {},
        "errors_sample": [],
    }

    with pred_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, row in enumerate(rows, 1):
            eng_in = EngineInputRow(
                row_id=row.row_id,
                birth_date=row.birth_date,
                birth_time=row.birth_time or "12:00:00",
                birth_lat=row.birth_lat,
                birth_lon=row.birth_lon,
                dest_lat=row.location.lat,
                dest_lon=row.location.lon,
                sample_date=row.sample_date,
            )
            result = score_row(eng_in, endpoint=endpoint)

            gp = row.goal_polarity
            csv_row: dict = {
                "row_id": row.row_id,
                "subject_id": row.subject_id,
                "subject_name": row.subject_name,
                "rodden_rating": row.rodden_rating,
                "row_type": row.row_type,
                "event_id": row.event_id,
                "event_type": row.event_type,
                "sample_date": row.sample_date,
                "location_name": row.location.name,
                "location_lat": row.location.lat,
                "location_lon": row.location.lon,
                "birth_date": row.birth_date,
                "birth_lat": row.birth_lat,
                "birth_lon": row.birth_lon,
                "status": result.status,
                "error": result.error or "",
                "macro_score": result.macro_score if result.macro_score is not None else "",
                "macro_verdict": result.macro_verdict or "",
                "love": gp.get("love"),
                "career": gp.get("career"),
                "community": gp.get("community"),
                "growth": gp.get("growth"),
                "relocation": gp.get("relocation"),
                "is_c_case": gp.get("is_c_case", False),
                "years_since_last_positive": gp.get("_years_since_last_positive"),
                "trajectory_phase": gp.get("_trajectory_phase"),
            }
            # Populate per-house + per-scenario columns
            if result.status == "ok" and result.houses:
                for h in range(1, 13):
                    csv_row[f"H{h}"] = result.houses.get(h, "")
                scenario_scores = compute_all_scenarios(result.houses)
                for sc_name, goals in scenario_scores.items():
                    for g, sc_val in goals.items():
                        csv_row[f"score__{sc_name}__{g}"] = round(sc_val, 3)
            else:
                for h in range(1, 13):
                    csv_row[f"H{h}"] = ""
                for sc in scenario_names():
                    for g in SCENARIO_GOALS:
                        csv_row[f"score__{sc}__{g}"] = ""
            writer.writerow(csv_row)

            if result.status == "ok":
                stats["rows_ok"] += 1
                if result.macro_score is not None:
                    stats["macro_score_sum"] += result.macro_score
                    stats["macro_score_count"] += 1
                    v = result.macro_verdict or "unknown"
                    stats["per_verdict"][v] = stats["per_verdict"].get(v, 0) + 1
            else:
                stats["rows_error"] += 1
                if len(stats["errors_sample"]) < 10:
                    stats["errors_sample"].append(f"{row.row_id}: {result.error[:120]}")

            # Progress every 25 rows
            if i % 25 == 0 or i == len(rows):
                ok_rate = stats["rows_ok"] / i
                avg = (stats["macro_score_sum"] / stats["macro_score_count"]
                       if stats["macro_score_count"] else 0)
                print(
                    f"  [{i:3d}/{len(rows)}] ok={stats['rows_ok']:3d} "
                    f"err={stats['rows_error']:3d} "
                    f"avg_macro={avg:.1f}"
                )

            if throttle_s > 0:
                time.sleep(throttle_s)

    finished = datetime.now(timezone.utc).isoformat()

    # Manifest
    manifest = {
        "exp_id": exp_id,
        "pipeline_version": PIPELINE_VERSION,
        "scenario_version": SCENARIO_VERSION,
        "negative_sampling_version": NEGATIVE_SAMPLING_VERSION if include_negatives else None,
        "scenarios": list(scenario_names()),
        "started_at": started,
        "finished_at": finished,
        "endpoint": endpoint,
        "git_commit": _git_commit(),
        "db_path": db_path,
        "row_count": len(rows),
        "row_counts_by_type": {
            "positive": n_pos,
            "temporal_neg": n_temp,
            "geographic_neg": n_geo,
        },
        "rows_ok": stats["rows_ok"],
        "rows_error": stats["rows_error"],
        "avg_macro_score": (stats["macro_score_sum"] / stats["macro_score_count"]
                             if stats["macro_score_count"] else None),
        "verdict_distribution": stats["per_verdict"],
        "errors_sample": stats["errors_sample"],
        "negative_sampling": {
            "enabled": include_negatives,
            "k_temporal": k_temporal,
            "k_geographic": k_geographic,
            "seed": seed,
            "control_cities": control_cities_csv,
        },
        "caveats": [
            "ACG lines computed via engine/astrocartography.py, filtered to ≤700 km",
            "Parans passed as empty array — pending integration",
            "Transit sample_date anchored at noon UTC (no hour-of-day resolution)",
            "Lot of Fortune / Spirit not explicitly computed — engine derives internally",
            ("Negative sampling enabled (v" + NEGATIVE_SAMPLING_VERSION + ")")
                if include_negatives else "Negative sampling disabled",
            "Per-house + per-goal scores extracted; 5 weight scenarios evaluated",
            "External validity limited per docs/ml-evaluation/04 §7",
        ],
    }
    (out_dir / "run_manifest.json").write_text(json.dumps(manifest, indent=2))

    print(f"\n✓ Wrote {pred_path}")
    print(f"✓ Wrote {out_dir / 'run_manifest.json'}")
    return out_dir


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/eval.db")
    ap.add_argument("--exp-id", default="EXP-0001")
    ap.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--throttle", type=float, default=0.0)
    ap.add_argument("--no-negatives", action="store_true",
                    help="Positive rows only (legacy behaviour)")
    ap.add_argument("--control-cities", default=DEFAULT_CONTROL_CITIES)
    ap.add_argument("--k-temporal", type=int, default=3)
    ap.add_argument("--k-geographic", type=int, default=5)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    out = run(
        db_path=args.db,
        exp_id=args.exp_id,
        endpoint=args.endpoint,
        limit=args.limit,
        throttle_s=args.throttle,
        include_negatives=not args.no_negatives,
        control_cities_csv=args.control_cities,
        k_temporal=args.k_temporal,
        k_geographic=args.k_geographic,
        seed=args.seed,
    )
    print(f"\nExperiment dir: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
