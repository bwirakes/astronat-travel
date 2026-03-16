"use client";

import type { TravelWindow } from "../lib/planet-data";
import styles from "../flow/flow.module.css";

interface TravelWindowsCardProps {
    windows: TravelWindow[];
    travelDate: string;
}

function qualityToScore(quality: string): number {
    switch (quality) {
        case "excellent": return 85;
        case "good":      return 70;
        case "caution":   return 55;
        case "avoid":     return 30;
        default:          return 60;
    }
}

export default function TravelWindowsCard({ windows, travelDate }: TravelWindowsCardProps) {
    if (!windows || windows.length === 0) return null;

    return (
        <>
            {travelDate && (() => {
                const td = new Date(travelDate + "T00:00:00");
                const today = new Date();
                const daysUntil = Math.round((td.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                    <div className={styles.travelDatePill}>
                        <span className={styles.travelDateIcon}>✦</span>
                        <span>
                            <strong>{td.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
                            {daysUntil > 0 ? (
                                <span className={styles.travelDaysUntil}> — {daysUntil}d away</span>
                            ) : daysUntil === 0 ? (
                                <span className={styles.travelDaysUntil}> — Today</span>
                            ) : (
                                <span className={styles.travelDaysUntil}> — {Math.abs(daysUntil)}d ago</span>
                            )}
                        </span>
                    </div>
                );
            })()}

            <div className={styles.windowsGrid}>
                {windows.map((w, i) => {
                    const isTargetMonth = travelDate && (() => {
                        const td = new Date(travelDate + "T00:00:00");
                        const monthName = td.toLocaleDateString("en-GB", { month: "long" });
                        const yearSuffix = td.getFullYear().toString().slice(-2);
                        return (
                            w.month.toLowerCase().includes(monthName.toLowerCase()) ||
                            w.month.toLowerCase().includes(`${monthName.slice(0, 3).toLowerCase()} '${yearSuffix}`)
                        );
                    })();

                    const approxScore = qualityToScore(w.quality);

                    return (
                        <div key={i} className={`${styles.windowItem} ${styles[`q_${w.quality}`]} ${isTargetMonth ? styles.windowItemTarget : ""}`}>
                            <div className={styles.windowMonth}>
                                {w.month}
                                {isTargetMonth && <span className={styles.windowTargetBadge}>Your trip</span>}
                            </div>
                            <div className={styles.windowQuality}>
                                <span className={`${styles.qDot} ${styles[`qd_${w.quality}`]}`} />
                                {w.quality}
                                <span style={{ marginLeft: "auto", fontSize: "0.6rem", opacity: 0.6 }}>
                                    ~{approxScore}
                                </span>
                            </div>
                            <div className={styles.windowReason}>{w.reason}</div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
