"use client";

import { useState } from "react";
import PlanetIcon from "./PlanetIcon";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import styles from "@/app/(frontend)/(app)/flow/flow.module.css";

interface PlanetLine {
    planet: string; angle: string; distance_km: number;
    orb?: number; is_paran?: boolean; meaning?: { badge: string };
    /** Signed raw contribution this line makes to the geodetic bucket of
     *  the score (same math as house-matrix.ts). Rendered as a `+N` / `-N`
     *  chip on the row so the user can trace lines back to the §01 score. */
    contribution?: number;
}

interface NatalPlanet {
    planet: string; sign: string; degree: number; longitude: number;
    retrograde: boolean; house: number; condition?: string; dignity?: string;
}

interface AcgLinesCardProps {
    planetLines: PlanetLine[];
    natalPlanets: NatalPlanet[];
    birthCity: string;
    destination: string;
}

function getInfluenceTier(km: number): { label: string; color: string } {
    if (km <= 161) return { label: "Strong", color: "var(--sage)" };
    if (km <= 483) return { label: "Moderate", color: "var(--amber)" };
    if (km <= 805) return { label: "Weak", color: "var(--text-tertiary)" };
    return { label: "Distant", color: "var(--text-tertiary)" };
}

// 3-dot importance bar. Mirrors the same thresholds as getInfluenceTier so
// "Strong/Moderate/Weak" and "●●●/●●○/●○○" agree by construction.
function getImportanceDots(km: number): 1 | 2 | 3 {
    if (km <= 161) return 3;
    if (km <= 483) return 2;
    return 1;
}

function DotBar({ filled, color }: { filled: 1 | 2 | 3; color: string }) {
    return (
        <span
            className={styles.lineDots}
            role="img"
            aria-label={`Importance: ${filled} of 3`}
            title={["light", "moderate", "strong"][filled - 1] + " influence"}
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className={styles.lineDot}
                    style={{
                        background: i < filled ? color : "transparent",
                        borderColor: color,
                    }}
                />
            ))}
        </span>
    );
}

export default function AcgLinesCard({ planetLines, birthCity, destination }: AcgLinesCardProps) {
    const [showAll, setShowAll] = useState(false);
    const locationLabel = destination || birthCity || "birth place";

    const allLines = [...planetLines].sort((a, b) => a.distance_km - b.distance_km);
    const seen = new Map<string, PlanetLine>();
    for (const l of allLines) {
        if (!seen.has(l.planet) || l.distance_km < seen.get(l.planet)!.distance_km)
            seen.set(l.planet, l);
    }
    const dedupedLines = Array.from(seen.values()).sort((a, b) => a.distance_km - b.distance_km);
    const acgLines = dedupedLines.filter((l) => !l.is_paran);
    const paranLines = dedupedLines.filter((l) => l.is_paran);
    const visible = showAll ? acgLines : acgLines.slice(0, 5);

    const renderLine = (line: PlanetLine, i: number) => {
        const planetKey = line.planet?.split("-")[0] || line.planet;
        const color = PLANET_COLORS[planetKey] || PLANET_COLORS[line.planet] || "#ffffff";
        const tier = getInfluenceTier(line.distance_km);
        const isClose = line.distance_km <= 300;
        const importance = getImportanceDots(line.distance_km);
        // Hover/AT label retains the quantitative detail dropped from the row.
        const ariaDetail = `${tier.label.toLowerCase()} · ${line.distance_km} km`;
        const c = typeof line.contribution === "number" ? line.contribution : null;
        const chipText = c === null ? null : (c > 0 ? `+${c}` : c < 0 ? `${c}` : "0");
        const chipColor = c === null ? null : (c > 0 ? "var(--sage)" : c < 0 ? "var(--v4-accent, #E47A7A)" : "var(--text-tertiary)");
        return (
            <div
                key={i}
                className={`${styles.lineRow} ${isClose ? styles.lineRowHighlight : ""}`}
                title={`${line.planet} on ${line.angle} — ${ariaDetail}${c !== null ? ` · ${chipText} pts` : ""}`}
            >
                <DotBar filled={importance} color={color} />
                <div className={styles.lineInfo}>
                    <div className={styles.planetSvgIcon}>
                        <PlanetIcon planet={line.planet} color={color} size={16} />
                    </div>
                    <span style={{ fontWeight: 600, color, fontSize: "0.82rem" }}>{line.planet}</span>
                    <span className={styles.lineAngle}>{line.angle}</span>
                </div>
                {chipText && (
                    <span
                        className={styles.lineContribChip}
                        style={{ color: chipColor!, borderColor: chipColor! }}
                        aria-label={`Contributes ${chipText} points to your score via astrocartography`}
                    >
                        {chipText}
                    </span>
                )}
            </div>
        );
    };

    return (
        <>
            <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: "var(--space-sm)" }}>
                {acgLines.length} lines near {locationLabel} · sorted by proximity
            </p>

            {acgLines.length === 0 && paranLines.length === 0 && (
                <div className="mt-4 p-6 border border-dashed border-[var(--surface-border)] rounded-[var(--shape-asymmetric-md)] bg-[var(--surface)] opacity-80 flex flex-col items-center text-center">
                    <span className="font-mono text-xs tracking-widest uppercase text-[var(--color-y2k-blue)] mb-2">Neutral Zone</span>
                    <p className="font-body text-sm text-[var(--text-secondary)]">There are no major planetary lines intersecting near this region. This indicates a quiet geographic space, free from extreme angular spikes. Good for rest or building from an uninfluenced baseline.</p>
                </div>
            )}

            {acgLines.length > 0 && (
                <div className={styles.lineSection}>
                    <div className={styles.lineList} id="lineList">
                        {visible.map(renderLine)}
                    </div>
                    {acgLines.length > 5 && (
                        <button className={styles.showAllBtn} onClick={() => setShowAll(!showAll)}>
                            {showAll ? "▲ Top 5" : `▼ All ${acgLines.length}`}
                        </button>
                    )}
                </div>
            )}

            {paranLines.length > 0 && (
                <div className={styles.lineSection}>
                    <span className={styles.lineSectionLabel} style={{ color: "var(--cyan)" }}>
                        Parans ({paranLines.length})
                    </span>
                    <div className={styles.lineList} id="paranList">
                        {paranLines.map(renderLine)}
                    </div>
                </div>
            )}
        </>
    );
}
