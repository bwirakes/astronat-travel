"use client";

import PlanetIcon from "./PlanetIcon";
import { PLANET_COLORS } from "../lib/planet-data";
import styles from "../flow/flow.module.css";

interface WorldTransit {
    p1: string; p2: string; aspect: string; symbol: string; orb: number;
    p1Sign: string; p1Deg: number; p2Sign: string; p2Deg: number;
    applying: boolean; isTense: boolean;
}
interface AngularPlanet {
    planet: string; angle: string; distFromLocation: number; sign: string; degree: number;
}

interface WorldSkyCardProps {
    worldTransits: WorldTransit[];
    angularPlanets: AngularPlanet[];
    travelDate: string;
    destination: string;
}

export default function WorldSkyCard({ worldTransits, angularPlanets, travelDate, destination }: WorldSkyCardProps) {
    if (worldTransits.length === 0 && angularPlanets.length === 0) return null;

    return (
        <>
            <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: "var(--space-sm)" }}>
                Active for all on {travelDate ? new Date(travelDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "this date"}
            </p>

            {worldTransits.length > 0 && (
                <div className={styles.transitList}>
                    {worldTransits.slice(0, 6).map((t, i) => (
                        <div key={i} className={`${styles.transitRow} ${t.isTense ? styles.mundaneTense : styles.mundaneEasy}`}>
                            <span className={styles.mundaneSymbol}>{t.symbol}</span>
                            <span className={styles.transitName} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                <PlanetIcon planet={t.p1} color={PLANET_COLORS[t.p1] || "currentColor"} size={13} />
                                <span style={{ color: PLANET_COLORS[t.p1] || "inherit" }}>{t.p1}</span>
                                <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>{t.p1Deg}° {t.p1Sign}</span>
                                <span style={{ opacity: 0.4, margin: "0 2px" }}>·</span>
                                <PlanetIcon planet={t.p2} color={PLANET_COLORS[t.p2] || "currentColor"} size={13} />
                                <span style={{ color: PLANET_COLORS[t.p2] || "inherit" }}>{t.p2}</span>
                                <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>{t.p2Deg}° {t.p2Sign}</span>
                            </span>
                            <span className={styles.transitType}>{t.aspect} {t.orb.toFixed(1)}°</span>
                            <span className={`${styles.tagPill} ${t.applying ? styles.tag_apl : styles.tag_sep}`}>
                                {t.applying ? "APL" : "SEP"}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {angularPlanets.length > 0 && (
                <>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: "var(--space-md)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Angular over {destination}
                    </p>
                    <div className={styles.transitList}>
                        {angularPlanets.map((a, i) => (
                            <div key={i} className={styles.transitRow}>
                                <PlanetIcon planet={a.planet} color={PLANET_COLORS[a.planet] || "currentColor"} size={14} />
                                <span className={styles.transitName} style={{ color: PLANET_COLORS[a.planet] }}>{a.planet}</span>
                                <span className={styles.transitType}>{a.degree}° {a.sign}</span>
                                <span className={`${styles.tagPill} ${styles.tag_angular}`}>{a.angle}</span>
                                <span className={styles.transitType}>~{a.distFromLocation} km</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
