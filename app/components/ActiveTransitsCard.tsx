"use client";

import PlanetIcon from "./PlanetIcon";
import AspectIcon from "./AspectIcon";
import { PLANET_COLORS } from "../lib/planet-data";
import styles from "../flow/flow.module.css";

interface Transit {
    planets: string;
    type: string;
    aspect: string;
    system?: string;
    orb?: number;
}

interface ActiveTransitsCardProps {
    transits: Transit[];
    travelDate: string;
}

export default function ActiveTransitsCard({ transits }: ActiveTransitsCardProps) {
    if (!transits || transits.length === 0) return null;

    const natalTs = transits.filter((t) => t.system === "natal" || !t.system);
    const geoTs = transits.filter((t) => t.system === "geodetic");

    const renderTransit = (t: Transit, i: number) => (
        <div key={i} className={styles.transitRow}>
            <div className={styles.aspectSvgIcon}>
                <AspectIcon aspect={t.aspect} size={14} />
            </div>
            <span className={styles.transitName} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                {t.planets.split(" - ").map((p, idx) => (
                    <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        {idx > 0 && " - "}
                        <PlanetIcon planet={p} color={PLANET_COLORS[p?.split("-")[0]] || PLANET_COLORS[p] || "currentColor"} size={14} />
                        {p}
                    </span>
                ))}
            </span>
            <span className={styles.transitType}>{t.type}{t.orb !== undefined ? ` (${t.orb}°)` : ""}</span>
        </div>
    );

    return (
        <>
            {natalTs.length > 0 && (
                <div className={styles.transitGroup}>
                    <div className={styles.transitGroupHeader}>
                        <span className={`${styles.tagPill} ${styles.tag_natal}`}>Natal</span>
                    </div>
                    <div className={styles.transitList} id="transitList">
                        {natalTs.map(renderTransit)}
                    </div>
                </div>
            )}

            {geoTs.length > 0 && (
                <div className={styles.transitGroup}>
                    <div className={styles.transitGroupHeader}>
                        <span className={`${styles.tagPill} ${styles.tag_geodetic}`}>Geodetic</span>
                    </div>
                    <div className={styles.transitList}>
                        {geoTs.map(renderTransit)}
                    </div>
                </div>
            )}
        </>
    );
}
