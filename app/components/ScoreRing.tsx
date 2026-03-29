"use client";

import { useState, useEffect } from "react";
import styles from "./TripScoreCard.module.css";

export const BAND_CONFIG = {
    highlyProductive: { label: "Highly Productive", color: "#5A9E78", ring: "#5A9E78", glow: "rgba(90,158,120,0.28)" },
    productive:       { label: "Productive",        color: "#7B9E87", ring: "#7B9E87", glow: "rgba(123,158,135,0.25)" },
    mixed:            { label: "Mixed",             color: "#C17B3F", ring: "#C17B3F", glow: "rgba(193,123,63,0.25)" },
    challenging:      { label: "Challenging",       color: "#C4622D", ring: "#C4622D", glow: "rgba(196,98,45,0.25)" },
    hostile:          { label: "Hostile",           color: "#A63020", ring: "#A63020", glow: "rgba(166,48,32,0.30)" },
};

export type Verdict = keyof typeof BAND_CONFIG;

export function getVerdict(score: number): Verdict {
    if (score >= 80) return "highlyProductive";
    if (score >= 65) return "productive";
    if (score >= 50) return "mixed";
    if (score >= 35) return "challenging";
    return "hostile";
}

export function ScoreRing({ score, verdict }: { score: number; verdict: Verdict }) {
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
