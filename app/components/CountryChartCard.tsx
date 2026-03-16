"use client";

import PlanetIcon from "./PlanetIcon";
import { PLANET_COLORS } from "../lib/planet-data";
import { detectCountry } from "../lib/country-charts";
import styles from "../flow/flow.module.css";

interface WorldTransit {
    p1: string; p2: string; aspect: string; symbol: string; orb: number;
    p1Sign: string; p1Deg: number; p2Sign: string; p2Deg: number;
    applying: boolean; isTense: boolean;
}

interface CountryChartCardProps {
    destination: string;
    worldTransits: WorldTransit[];
}

export default function CountryChartCard({ destination, worldTransits }: CountryChartCardProps) {
    const countryChart = detectCountry(destination);
    if (!countryChart) return null;

    const transitsHittingCountry = worldTransits.filter(
        (t) =>
            t.p1Sign === countryChart.sun || t.p2Sign === countryChart.sun ||
            t.p1Sign === countryChart.moon || t.p2Sign === countryChart.moon,
    );

    return (
        <>
            <div className={styles.chartRulerBlock}>
                <div className={styles.chartRulerCell}>
                    <span className={styles.chartRulerCellLabel}>Sun</span>
                    <span className={styles.chartRulerCellValue}>{countryChart.sunDeg}° {countryChart.sun}</span>
                </div>
                <div className={styles.chartRulerCell}>
                    <span className={styles.chartRulerCellLabel}>Moon</span>
                    <span className={styles.chartRulerCellValue}>{countryChart.moonDeg}° {countryChart.moon}</span>
                </div>
                <div className={styles.chartRulerCell}>
                    <span className={styles.chartRulerCellLabel}>Founded</span>
                    <span className={styles.chartRulerCellValue} style={{ fontSize: "0.85rem" }}>{countryChart.founded}</span>
                </div>
            </div>

            {transitsHittingCountry.length > 0 && (
                <div style={{ marginTop: "var(--space-sm)" }}>
                    <p style={{ fontSize: "0.72rem", color: "var(--amber)", marginBottom: "var(--space-xs)" }}>
                        {transitsHittingCountry.length} transit{transitsHittingCountry.length > 1 ? "s" : ""} hitting {countryChart.country}'s natal chart
                    </p>
                    <div className={styles.transitList}>
                        {transitsHittingCountry.map((t, i) => (
                            <div key={i} className={`${styles.transitRow} ${t.isTense ? styles.mundaneTense : styles.mundaneEasy}`}>
                                <span className={styles.mundaneSymbol}>{t.symbol}</span>
                                <span className={styles.transitName}>
                                    <span style={{ color: PLANET_COLORS[t.p1] }}>{t.p1}</span> {t.aspect}{" "}
                                    <span style={{ color: PLANET_COLORS[t.p2] }}>{t.p2}</span>
                                </span>
                                <span className={styles.transitType}>{t.orb.toFixed(1)}° orb</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
