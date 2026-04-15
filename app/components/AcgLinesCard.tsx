"use client";

import { useState } from "react";
import PlanetIcon from "./PlanetIcon";
import { PLANET_COLORS, getOrbStrengthColor } from "@/app/lib/planet-data";
import styles from "@/app/(frontend)/(app)/flow/flow.module.css";

interface PlanetLine {
    planet: string; angle: string; distance_km: number;
    orb?: number; is_paran?: boolean; meaning?: { badge: string };
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

function getOrbLabel(orb: number | undefined): { label: string; color: string } | null {
    if (orb === undefined || orb === null) return null;
    if (orb <= 5) return { label: `${orb.toFixed(1)}° orb`, color: "var(--sage)" };
    return { label: `${orb.toFixed(1)}° orb`, color: "var(--text-tertiary)" };
}

export default function AcgLinesCard({ planetLines, destination }: AcgLinesCardProps) {
    const [showAll, setShowAll] = useState(false);

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
        const orbColor = getOrbStrengthColor(line.distance_km);
        const tier = getInfluenceTier(line.distance_km);
        const orbLabel = getOrbLabel(line.orb);
        const isClose = line.distance_km <= 300;
        return (
            <div key={i} className={`${styles.lineRow} ${isClose ? styles.lineRowHighlight : ""}`}>
                <div className={styles.lineInfo}>
                    <div className={styles.planetSvgIcon}>
                        <PlanetIcon planet={line.planet} color={color} size={16} />
                    </div>
                    <span style={{ fontWeight: 600, color, fontSize: "0.82rem" }}>{line.planet}</span>
                    <span className={styles.lineAngle}>{line.angle}</span>
                </div>
                <div className={styles.lineMeta}>
                    <span className={styles.lineOrbDot} style={{ background: orbColor }} />
                    <span className={styles.lineDist}>{line.distance_km} km</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: tier.color, marginLeft: "0.3rem" }}>
                        {tier.label}
                    </span>
                    {orbLabel && (
                        <span style={{ fontSize: "0.65rem", color: orbLabel.color, marginLeft: "0.4rem", opacity: 0.8 }}>
                            {orbLabel.label}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: "var(--space-sm)" }}>
                {acgLines.length} lines near {destination} · sorted by proximity
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
