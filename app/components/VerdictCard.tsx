"use client";

import styles from "./VerdictCard.module.css";

export interface SummaryWindow {
    dates: string;
    transit: string;
    why: string;
}

export interface Summary {
    verdict: "excellent" | "caution" | "avoid";
    headline: string;
    bestWindows: SummaryWindow[];
    avoidWindows: SummaryWindow[];
}

interface Props {
    summary: Summary | null;
    loading: boolean;
    destination: string;
}

const VERDICT_CONFIG = {
    excellent: { emoji: "🟢", label: "Excellent", accent: "#4ade80" },
    caution:   { emoji: "🟡", label: "Caution",   accent: "#C9A96E" },
    avoid:     { emoji: "🔴", label: "Avoid",     accent: "#FF4040" },
};

export default function VerdictCard({ summary, loading, destination }: Props) {
    if (loading) {
        return (
            <div className={`card ${styles.verdictCard} ${styles.loading}`}>
                <div className={styles.skeletonLine} style={{ width: "40%", height: "1.2rem" }} />
                <div className={styles.skeletonLine} style={{ width: "90%", height: "0.85rem", marginTop: "0.5rem" }} />
                <div className={styles.skeletonLine} style={{ width: "75%", height: "0.85rem" }} />
                <div className={styles.windowsGrid}>
                    <div className={styles.skeletonBlock} />
                    <div className={styles.skeletonBlock} />
                </div>
            </div>
        );
    }

    if (!summary) return null;

    const cfg = VERDICT_CONFIG[summary.verdict];

    return (
        <div className={`card ${styles.verdictCard}`} style={{ borderLeftColor: cfg.accent }}>
            {/* Verdict score */}
            <div className={styles.verdictHeader}>
                <span className={styles.verdictEmoji}>{cfg.emoji}</span>
                <div>
                    <h5 className={styles.verdictLabel} style={{ color: cfg.accent }}>
                        {cfg.label} for {destination}
                    </h5>
                    <p className={styles.verdictHeadline}>{summary.headline}</p>
                </div>
            </div>

            {/* Best / Avoid windows */}
            {(summary.bestWindows.length > 0 || summary.avoidWindows.length > 0) && (
                <div className={styles.windowsGrid}>
                    {/* Best windows */}
                    {summary.bestWindows.length > 0 && (
                        <div className={styles.windowsCol}>
                            <div className={styles.windowsColHeader}>
                                <span className={styles.windowsColIcon} style={{ color: "#4ade80" }}>✓</span>
                                <span className={styles.windowsColTitle}>Best Times to Visit</span>
                            </div>
                            <ul className={styles.windowList}>
                                {summary.bestWindows.map((w, i) => (
                                    <li key={i} className={styles.windowItem}>
                                        <span className={styles.windowDates}>{w.dates}</span>
                                        <span className={styles.windowTransit}>{w.transit}</span>
                                        <span className={styles.windowWhy}>{w.why}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Avoid windows */}
                    {summary.avoidWindows.length > 0 && (
                        <div className={styles.windowsCol}>
                            <div className={styles.windowsColHeader}>
                                <span className={styles.windowsColIcon} style={{ color: "#FF4040" }}>⚠</span>
                                <span className={styles.windowsColTitle}>Times to Avoid</span>
                            </div>
                            <ul className={styles.windowList}>
                                {summary.avoidWindows.map((w, i) => (
                                    <li key={i} className={styles.windowItem}>
                                        <span className={styles.windowDates}>{w.dates}</span>
                                        <span className={styles.windowTransit}>{w.transit}</span>
                                        <span className={styles.windowWhy}>{w.why}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
