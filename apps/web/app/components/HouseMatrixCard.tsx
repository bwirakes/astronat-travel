"use client";

import { useState } from "react";
import type { HouseScore, HouseMatrixResult } from "@/app/lib/house-matrix";
import PlanetIcon from "./PlanetIcon";
import SignIcon from "./SignIcon";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import styles from "./HouseMatrixCard.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────
function barColor(score: number): string {
    if (score >= 85) return "var(--sage)";
    if (score >= 70) return "rgba(123,158,135,0.8)";
    if (score >= 55) return "var(--cyan)";
    if (score >= 40) return "var(--text-tertiary)";
    if (score >= 25) return "var(--amber)";
    return "var(--accent)";
}

function statusClass(status: string): string {
    switch (status) {
        case "Peak Flow":        return styles.statusPeak;
        case "Highly Favorable": return styles.statusHighly;
        case "Favorable":        return styles.statusFavorable;
        case "Neutral":          return styles.statusNeutral;
        case "Challenging":      return styles.statusChallenging;
        case "Severe Friction":  return styles.statusSevere;
        default:                 return styles.statusNeutral;
    }
}

function statusDotClass(status: string): string {
    switch (status) {
        case "Peak Flow":
        case "Highly Favorable": return styles.dotGreen;
        case "Favorable":        return styles.dotCyan;
        case "Neutral":          return styles.dotGray;
        case "Challenging":      return styles.dotAmber;
        case "Severe Friction":  return styles.dotRed;
        default:                 return styles.dotGray;
    }
}

function BreakdownChip({ label, value }: { label: string; value: number }) {
    if (value === 0) return null;
    const cls = value > 0 ? styles.breakdownPos : styles.breakdownNeg;
    return (
        <span className={styles.chip}>
            <span className={styles.chipLabel}>{label}</span>
            <span className={`${styles.chipVal} ${cls}`}>
                {value > 0 ? "+" : ""}{value}
            </span>
        </span>
    );
}

// ── House row ─────────────────────────────────────────────────────────────
/**
 * .row is an explicit CSS grid with named areas.
 *
 * Desktop (> 600px) — single row:
 *   "rank house sphere ruler score status"
 *
 * Mobile (≤ 600px) — two rows:
 *   "rank house sphere  dot"
 *   "rank ruler  bar    bar"
 *
 * Each child has a fixed grid-area name. Mobile hides desktop-only
 * children (.scoreDesktop → display:none) and shows mobile-only
 * children (.scoreBar, .statusDot → visible).
 */
function HouseRow({ h, rank, expanded, onToggle }: {
    h: HouseScore;
    rank: number;
    expanded: boolean;
    onToggle: () => void;
}) {
    const color = barColor(h.score);
    return (
        <div className={styles.rowWrap}>
            <div
                className={styles.row}
                onClick={onToggle}
                role="button"
                aria-expanded={expanded}
            >
                {/* rank */}
                <span className={styles.gRank}>{rank}</span>

                {/* H# + sign name */}
                <div className={styles.gHouse}>
                    <SignIcon
                        sign={h.relocatedSign}
                        size={18}
                        className={styles.signIcon}
                        color="var(--text-tertiary)"
                    />
                    <div className={styles.houseText}>
                        <span className={styles.houseNum}>H{h.house}</span>
                        <span className={styles.signName}>{h.relocatedSign}</span>
                    </div>
                </div>

                {/* sphere of life */}
                <span className={styles.gSphere}>{h.sphere}</span>

                {/* ruler: SVG icon + planet name + condition */}
                <div className={styles.gRuler}>
                    <PlanetIcon
                        planet={h.rulerPlanet}
                        color={PLANET_COLORS[h.rulerPlanet] || "currentColor"}
                        size={11}
                    />
                    <span
                        className={styles.rulerName}
                        style={{ color: PLANET_COLORS[h.rulerPlanet] || "inherit" }}
                    >
                        {h.rulerPlanet}
                    </span>
                    <span className={styles.rulerSep} aria-hidden>·</span>
                    <span className={styles.rulerCond}>{h.rulerCondition}</span>
                </div>

                {/* Desktop score bar + number (hidden on mobile) */}
                <div className={styles.gScore}>
                    <div className={styles.scoreTrack}>
                        <div
                            className={styles.scoreFill}
                            style={{ width: `${h.score}%`, background: color }}
                        />
                    </div>
                    <span className={styles.scoreVal} style={{ color }}>{h.score}</span>
                </div>

                {/* Desktop status pill (hidden on mobile) */}
                <span className={`${styles.gStatus} ${statusClass(h.status)}`}>
                    {h.status}
                </span>

                {/* Mobile: score bar fills the "bar" area (hidden on desktop) */}
                <div className={styles.gBar}>
                    <div className={styles.mScoreTrack}>
                        <div
                            className={styles.scoreFill}
                            style={{ width: `${h.score}%`, background: color }}
                        />
                    </div>
                    <span className={styles.mScoreVal} style={{ color }}>{h.score}</span>
                </div>

                {/* Mobile: status dot in "dot" area (hidden on desktop) */}
                <span
                    className={`${styles.gDot} ${statusDotClass(h.status)}`}
                    title={h.status}
                />
            </div>

            {/* Expanded breakdown */}
            {expanded && (
                <div className={styles.breakdownRow}>
                    <div className={styles.breakdownGrid}>
                        <BreakdownChip label="Base"       value={h.breakdown.base} />
                        <BreakdownChip label="Dignity"    value={h.breakdown.dignity} />
                        <BreakdownChip label="Occupants"  value={h.breakdown.occupants} />
                        <BreakdownChip label="ACG"        value={h.breakdown.acgLine} />
                        <BreakdownChip label="Geodetic"   value={h.breakdown.geodetic} />
                        <BreakdownChip label="Transits"   value={h.breakdown.transits} />
                        <BreakdownChip label="Natal Rx"   value={h.breakdown.retrograde} />
                        <BreakdownChip label="Transit Rx" value={h.breakdown.transitRx} />
                        <BreakdownChip label="Paran"      value={h.breakdown.paran} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────
interface HouseMatrixCardProps {
    matrix: HouseMatrixResult | null;
    loading?: boolean;
}

export default function HouseMatrixCard({ matrix, loading }: HouseMatrixCardProps) {
    const [expandedHouse, setExpandedHouse] = useState<number | null>(null);

    if (loading) {
        return (
            <div className={`card ${styles.card}`}>
                <div className={styles.header}>
                    <h5 className={styles.title}>House Placements</h5>
                </div>
                <div className={styles.skeletonList}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.skeletonRow} />
                    ))}
                </div>
            </div>
        );
    }

    if (!matrix || matrix.houses.length === 0) return null;

    const sorted = [...matrix.houses].sort((a, b) => b.score - a.score);
    const macroColor = barColor(matrix.macroScore);

    return (
        <div className={`card ${styles.card}`}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h5 className={styles.title}>House Placements</h5>
                    <p className={styles.subtitle}>Ranked by activation strength at this destination</p>
                </div>
                <div className={styles.macroChip}>
                    <span className={styles.macroLabel}>Aggregate</span>
                    <span className={styles.macroScore} style={{ color: macroColor }}>
                        {matrix.macroScore}
                    </span>
                    <span className={styles.macroMax}>/ 100</span>
                </div>
            </div>

            {/* Desktop column labels (mirror the grid template) */}
            <div className={styles.colLabels} aria-hidden>
                <span />{/* rank */}
                <span>House</span>
                <span>Sphere</span>
                <span>Ruler</span>
                <span>Score</span>
                <span>Status</span>
            </div>
            <div className={styles.divider} />

            <div className={styles.list}>
                {sorted.map((h, i) => (
                    <HouseRow
                        key={h.house}
                        h={h}
                        rank={i + 1}
                        expanded={expandedHouse === h.house}
                        onToggle={() =>
                            setExpandedHouse(expandedHouse === h.house ? null : h.house)
                        }
                    />
                ))}
            </div>
        </div>
    );
}
