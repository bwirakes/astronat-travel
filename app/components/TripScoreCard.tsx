"use client";

import { useState, useEffect } from "react";
import styles from "./TripScoreCard.module.css";
import AIInsightBox from "./AIInsightBox";

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

interface TripScoreProps {
    summary: Summary | null;
    loading: boolean;
    destination: string;
    travelDate?: string;
    tripScore: number;
    acgScore: number;
    mundaneScore: number;
    readingMap?: Record<string, string>;
    loadingReading?: boolean;
}

const BAND_CONFIG = {
    highlyProductive: { label: "Highly Productive", color: "#5A9E78", ring: "#5A9E78", glow: "rgba(90,158,120,0.28)" },
    productive:       { label: "Productive",        color: "#7B9E87", ring: "#7B9E87", glow: "rgba(123,158,135,0.25)" },
    mixed:            { label: "Mixed",             color: "#C17B3F", ring: "#C17B3F", glow: "rgba(193,123,63,0.25)" },
    challenging:      { label: "Challenging",       color: "#C4622D", ring: "#C4622D", glow: "rgba(196,98,45,0.25)" },
    hostile:          { label: "Hostile",           color: "#A63020", ring: "#A63020", glow: "rgba(166,48,32,0.30)" },
};

type Verdict = keyof typeof BAND_CONFIG;

function getVerdict(score: number): Verdict {
    if (score >= 80) return "highlyProductive";
    if (score >= 65) return "productive";
    if (score >= 50) return "mixed";
    if (score >= 35) return "challenging";
    return "hostile";
}

function ScoreRing({ score, verdict }: { score: number; verdict: Verdict }) {
    const [displayed, setDisplayed] = useState(0);
    const cfg = BAND_CONFIG[verdict];
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const arcCircumference = circumference * 0.75;
    const arcFilled = (displayed / 100) * arcCircumference;

    useEffect(() => {
        if (score === 0) return;
        let start: number | null = null;
        const duration = 1100;
        const animate = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.round(eased * score));
            if (progress < 1) requestAnimationFrame(animate);
        };
        const raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [score]);

    return (
        <div className={styles.ringWrap} style={{ "--ring-glow": cfg.glow } as React.CSSProperties}>
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className={styles.ringSvg}>
                <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none"
                    strokeDasharray={`${arcCircumference} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" transform="rotate(135 70 70)" />
                <circle cx="70" cy="70" r={radius} stroke={cfg.ring} strokeWidth="10" fill="none"
                    strokeDasharray={`${arcFilled} ${circumference}`} strokeDashoffset={0} strokeLinecap="round"
                    transform="rotate(135 70 70)" style={{ filter: `drop-shadow(0 0 6px ${cfg.ring}88)`, transition: "stroke-dasharray 0.05s linear" }} />
            </svg>
            <div className={styles.ringCenter}>
                <span className={styles.ringScore} style={{ color: cfg.color }}>{displayed}</span>
            </div>
            <span className={styles.ringLabel}>{cfg.label}</span>
        </div>
    );
}

export default function TripScoreCard({
    summary, loading, destination, travelDate, tripScore, acgScore, mundaneScore, readingMap, loadingReading,
}: TripScoreProps) {
    const computedVerdict: Verdict = getVerdict(tripScore);

    useEffect(() => {
        if (loading) {
            (window as any).__tripScoreStart = performance.now();
        } else if ((window as any).__tripScoreStart) {
            const end = performance.now();
            const duration = end - (window as any).__tripScoreStart;
            console.log(`[TripScoreCard] Data-to-Render time: ${duration.toFixed(2)}ms`);
            delete (window as any).__tripScoreStart;
        }
    }, [loading]);

    if (loading) {
        return (
            <div className={`card ${styles.scoreCard} ${styles.loading}`}>
                <div className={styles.scoreTop}>
                    <div className={styles.skeletonRing} />
                    <div className={styles.scoreDetails}>
                        <div className={styles.skeletonLine} style={{ width: "30%", height: "0.6rem" }} />
                        <div className={styles.skeletonLine} style={{ width: "70%", height: "1.8rem", margin: "0.2rem 0" }} />
                        <div className={styles.breakdown} style={{ marginTop: "0.8rem" }}>
                            <div className={styles.skeletonLine} style={{ width: "100%", height: "0.3rem" }} />
                            <div className={styles.skeletonLine} style={{ width: "100%", height: "0.3rem" }} />
                        </div>
                    </div>
                </div>
                <div className={styles.skeletonLine} style={{ width: "100%", height: "3rem", marginTop: "0.5rem" }} />
                <div className={styles.windowsRow} style={{ borderTop: "none" }}>
                    <div className={styles.skeletonLine} style={{ width: "100%", height: "6rem" }} />
                    <div className={styles.skeletonLine} style={{ width: "100%", height: "6rem" }} />
                </div>
            </div>
        );
    }

    return (
        <div className={`card ${styles.scoreCard}`}>
            <div className={styles.scoreTop}>
                <ScoreRing score={tripScore} verdict={computedVerdict} />
                <div className={styles.scoreDetails}>
                    <div className={styles.scoreDestLabel}>
                        <span className={styles.scoreDestTag}>TRIP SCORE</span>
                        <h3 className={styles.scoreDestName}>{destination}</h3>
                        {travelDate && (
                            <span className={styles.scoreDestTag} style={{ marginTop: '0.15rem' }}>
                                {new Date(travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        )}
                    </div>
                    <div className={styles.breakdown}>
                        <BreakdownBar label="Personal" value={acgScore} max={70} color="var(--gold)" />
                        <BreakdownBar label="Collective" value={mundaneScore} max={30} color="#a78bfa" />
                    </div>
                    {/* Tense transit warning pills */}
                    {summary && (summary.avoidWindows?.length ?? 0) > 0 && (
                        <div className={styles.warningPills}>
                            {summary.avoidWindows.map((w, i) => (
                                <span key={i} className={styles.warningPill}>
                                    ⚠ {w.transit} · {w.dates}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {summary?.headline && (
                <p className={styles.scoreHeadline}>{summary.headline}</p>
            )}

            {summary && ((summary.bestWindows?.length ?? 0) > 0 || (summary.avoidWindows?.length ?? 0) > 0) && (
                <div className={styles.windowsRow}>
                    {(summary.bestWindows?.length ?? 0) > 0 && (
                        <WindowCol title="Go" windows={summary.bestWindows} accent="var(--sage)" />
                    )}
                    {(summary.avoidWindows?.length ?? 0) > 0 && (
                        <WindowCol title="Avoid" windows={summary.avoidWindows} accent="var(--accent)" />
                    )}
                </div>
            )}

            {readingMap && readingMap["Verdict"] ? (
                <div className={styles.aiVerdictSection}>
                    <div className={styles.aiVerdictLabel}>✦ Insights</div>
                    <AIInsightBox readingMap={readingMap} sectionKey="Verdict" />
                </div>
            ) : loadingReading ? (
                <div className={`${styles.aiVerdictSection} ${styles.loadingInsights}`}>
                    <div className={styles.aiVerdictLabel}>✦ Generating Insights...</div>
                    <div className={styles.skeletonBox}>
                        <div className={styles.skeletonLine} style={{ width: "100%" }} />
                        <div className={styles.skeletonLine} style={{ width: "95%" }} />
                        <div className={styles.skeletonLine} style={{ width: "40%" }} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = Math.round((value / max) * 100);
    return (
        <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>{label}</span>
            <div className={styles.breakdownTrack}>
                <div className={styles.breakdownFill} style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className={styles.breakdownVal} style={{ color }}>{value}<span className={styles.breakdownMax}>/{max}</span></span>
        </div>
    );
}

function WindowCol({ title, windows, accent }: { title: string; windows: SummaryWindow[]; accent: string }) {
    return (
        <div className={styles.windowCol}>
            <div className={styles.windowColTitle} style={{ color: accent }}>{title}</div>
            <ul className={styles.windowList}>
                {windows.map((w, i) => (
                    <li key={i} className={styles.windowItem}>
                        <span className={styles.windowDates}>{w.dates}</span>
                        {w.transit && <span className={styles.windowTransit}>{w.transit}</span>}
                        <span className={styles.windowWhy}>{w.why}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
