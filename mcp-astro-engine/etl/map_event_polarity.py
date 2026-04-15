"""Map Astro-Databank event categories to per-goal polarity labels.

Implements docs/ml-evaluation/01c §5. For each event_record with an empty
goal_polarity map, inspect (event_type, subcategory, notes) and assign
{-1, 0, +1, null} per goal.

Polarity scheme (B with selective C per 01c §5):
  +1  unambiguous positive (awards, canonical publications, durable outcomes)
  -1  unambiguous negative (bankruptcy, suicide, crime, breakdown)
   0  neutral / no effect for this goal
 null no evidence for this goal — excluded from that goal's metrics

C-case events (marriage, publication, company founding) get Y=+1 here by
default and must be downgraded to Y=0 if the outcome window (01c §5) shows
failure within the window. Outcome-window validation is a later pass.

Usage:
    python -m etl.map_event_polarity --db data/eval.db
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


POLARITY_VERSION = "v1.0"  # bump on rule changes

# Canonical goal keys (docs/ml-evaluation/01c §2)
GOALS = ("love", "career", "community", "growth", "relocation")


@dataclass(frozen=True)
class GoalPolarity:
    love: Optional[int]
    career: Optional[int]
    community: Optional[int]
    growth: Optional[int]
    relocation: Optional[int]
    is_c_case: bool = False        # outcome window still required
    confidence: float = 1.0        # 1.0 = rule matched cleanly

    def as_dict(self) -> dict:
        return {
            "love": self.love,
            "career": self.career,
            "community": self.community,
            "growth": self.growth,
            "relocation": self.relocation,
            "is_c_case": self.is_c_case,
            "confidence": self.confidence,
        }


def _empty() -> dict[str, Optional[int]]:
    return {g: None for g in GOALS}


def map_event(
    event_type: str, subcategory: Optional[str], notes: Optional[str]
) -> GoalPolarity:
    """Return per-goal polarity for one event. Lowercase inputs expected.

    Uses a conservative cascade: check the most specific signals first
    (subcategory strings like "Prize", "Change residence"), falling back to
    event_type-level defaults.
    """
    et = (event_type or "").lower()
    sub = (subcategory or "").lower()
    text = (notes or "").lower()

    p = _empty()
    is_c = False
    confidence = 1.0

    # ----- LOVE goal (01c §5.1) -----
    if et == "relationship":
        if "marriage" in sub or "marriage" in text:
            p["love"] = 1              # C-case: demote to 0 if divorce ≤5y
            is_c = True
        elif "divorce" in sub or "divorce" in text:
            p["love"] = -1
        elif "engagement" in sub or "engagement" in text:
            # Broken engagement ≠ engagement announced; conservative +1
            p["love"] = 1
            is_c = True
        elif "affair" in text or "infidelity" in text:
            p["love"] = -1
        elif "widowhood" in text or "widowed" in text:
            p["love"] = 0              # per 01c §5.1 — exclude from training
        else:
            p["love"] = 0
            confidence = 0.5

    # ----- CAREER goal (01c §5.2) -----
    if et == "work":
        if "prize" in sub or any(w in text for w in ("nobel", "pulitzer", "oscar")):
            p["career"] = 1            # unambiguous +1, no window
        elif "published" in sub or "published" in text or "released" in text:
            p["career"] = 1            # C-case: demote if canon test fails
            is_c = True
        elif "promotion" in sub or "promoted" in text:
            p["career"] = 1
            is_c = True
        elif "appointed" in sub or "elected" in text:
            p["career"] = 1
            is_c = True
        elif "retirement" in sub or "retired" in text:
            p["career"] = 0
        elif "fired" in text or "resigned" in text:
            p["career"] = -1

    if et == "crime":
        p["career"] = -1               # unambiguous negative per §5.2
    if et == "financial":
        if "bankrupt" in text or "loss" in sub:
            p["career"] = -1

    # ----- COMMUNITY goal (01c §5.3) -----
    if et == "social":
        # Astro-Databank "Social" includes travel events, not community signals.
        # Community evidence from this dataset is thin per 01c §6.3.
        if "founded" in text or "co-founded" in text:
            p["community"] = 1
            is_c = True
        elif "ostracized" in text or "exile" in text:
            p["community"] = -1

    # ----- GROWTH goal (01c §5.4) -----
    if et == "health":
        if "hospitalization" in text or "breakdown" in text:
            p["growth"] = -1
        elif "accident" in sub or "injury" in sub:
            p["growth"] = -1           # treated as growth-goal negative per §5.4
    if et == "mental_health":
        p["growth"] = -1
    if et == "work" and ("degree" in text or "education" in text or "graduation" in text):
        p["growth"] = 1

    # ----- RELOCATION goal (01c §5.5) -----
    if et == "family" and "change residence" in sub:
        p["relocation"] = 1            # C-case: demote to 0 if reversed ≤3y
        is_c = True
    if "exile" in text or "deport" in text:
        p["relocation"] = -1

    return GoalPolarity(
        love=p["love"],
        career=p["career"],
        community=p["community"],
        growth=p["growth"],
        relocation=p["relocation"],
        is_c_case=is_c,
        confidence=confidence,
    )


def _parse_notes(notes: str) -> tuple[Optional[str], str]:
    """Extract subcategory from 'Subcategory: rest' — see astrodatabank_extract."""
    if notes and ":" in notes:
        before, _, after = notes.partition(":")
        if len(before) < 50 and len(before.split()) <= 5:
            return before.strip(), after.strip()
    return None, notes or ""


def run(db_path: str, overwrite: bool = False) -> dict:
    """Apply the polarity mapper to every event_record row in the DB."""
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        query = "SELECT id, event_type, notes, goal_polarity FROM event_record"
        rows = cur.execute(query).fetchall()

        now = datetime.now(timezone.utc).isoformat()
        stats: Counter = Counter()
        per_goal_stats: dict[str, Counter] = {g: Counter() for g in GOALS}

        for row in rows:
            existing = json.loads(row["goal_polarity"] or "{}")
            if existing and not overwrite:
                stats["skipped_already_labeled"] += 1
                continue

            subcat, desc = _parse_notes(row["notes"] or "")
            polarity = map_event(row["event_type"], subcat, row["notes"])

            # Track per-goal
            for g in GOALS:
                v = getattr(polarity, g)
                per_goal_stats[g][str(v)] += 1
            if polarity.is_c_case:
                stats["c_cases"] += 1

            cur.execute(
                "UPDATE event_record SET goal_polarity = ?, updated_at = ? WHERE id = ?",
                (json.dumps(polarity.as_dict()), now, row["id"]),
            )
            stats["labeled"] += 1

        conn.commit()
        return {
            "labeled": stats["labeled"],
            "skipped_already_labeled": stats["skipped_already_labeled"],
            "c_cases": stats["c_cases"],
            "per_goal": {g: dict(per_goal_stats[g]) for g in GOALS},
            "polarity_version": POLARITY_VERSION,
        }
    finally:
        conn.close()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/eval.db")
    ap.add_argument(
        "--overwrite", action="store_true",
        help="Re-label events even if goal_polarity is already set",
    )
    args = ap.parse_args()

    summary = run(args.db, overwrite=args.overwrite)
    print(f"Polarity version: {summary['polarity_version']}")
    print(f"Labeled: {summary['labeled']}  Skipped (already): {summary['skipped_already_labeled']}")
    print(f"C-case events (need outcome-window validation): {summary['c_cases']}")
    print("\nPer-goal distribution (None = no evidence for that goal):")
    for g, dist in summary["per_goal"].items():
        items = sorted(dist.items(), key=lambda kv: (kv[0] == "None", kv[0]))
        pretty = "  ".join(f"{k}={v}" for k, v in items)
        print(f"  {g:<11} {pretty}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
