"use client";

import PlanetIcon from "./PlanetIcon";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import { geodeticMCSign, geodeticASCSign } from "@/app/lib/geodetic";
import styles from "@/app/(frontend)/(app)/flow/flow.module.css";

interface MundanePlanet {
    name: string;
    degree: number;
    sign: string;
}

interface GeodeticZoneCardProps {
    destLon: number;
    destLat: number;
    mundanePlanets?: MundanePlanet[];
}

export default function GeodeticZoneCard({ destLon, destLat, mundanePlanets }: GeodeticZoneCardProps) {
    const geoMC = geodeticMCSign(destLon);
    const geoASC = geodeticASCSign(destLon, destLat);
    const geodeticTransits = (mundanePlanets || []).filter((p) => p.sign === geoMC);

    return (
        <>
            <div className={styles.chartRulerBlock}>
                <div className={styles.chartRulerCell}>
                    <span className={styles.chartRulerCellLabel}>MC Zone</span>
                    <span className={styles.chartRulerCellValue}>{geoMC}</span>
                    <span className={styles.chartRulerCellSub}>{Math.round(destLon)}°</span>
                </div>
                <div className={styles.chartRulerCell}>
                    <span className={styles.chartRulerCellLabel}>ASC Zone</span>
                    <span className={styles.chartRulerCellValue}>{geoASC}</span>
                    <span className={styles.chartRulerCellSub}>Rising at lat</span>
                </div>
                <div className={styles.chartRulerCell}>
                    <span className={styles.chartRulerCellLabel}>Active</span>
                    <span className={styles.chartRulerCellValue}>
                        {geodeticTransits.length > 0 ? geodeticTransits.map((p) => p.name).join(", ") : "None"}
                    </span>
                    <span className={styles.chartRulerCellSub}>In {geoMC}</span>
                </div>
            </div>

            {geodeticTransits.length > 0 && (
                <div style={{ marginTop: "var(--space-md)" }}>
                    <span className={styles.lineSectionLabel} style={{ color: "#4DB6C4" }}>Active Geodetic Transits</span>
                    {geodeticTransits.map((p, i) => (
                        <div key={i} className={styles.transitRow}>
                            <PlanetIcon planet={p.name} color={PLANET_COLORS[p.name] || "currentColor"} size={14} />
                            <span className={styles.transitName} style={{ color: PLANET_COLORS[p.name] }}>{p.name}</span>
                            <span className={styles.transitType}>{p.degree.toFixed(1)}° {p.sign}</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
