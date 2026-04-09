"use client";

import { useState, useEffect } from "react";
import styles from "./TripScoreCard.module.css";

export const BAND_CONFIG = {
    highlyProductive: { label: "Highly Productive", color: "var(--text-primary)", ring: "var(--color-y2k-blue)", glow: "rgba(4,86,251,0.28)" },
    productive:       { label: "Productive",        color: "var(--text-primary)", ring: "var(--color-y2k-blue)", glow: "rgba(4,86,251,0.25)" },
    mixed:            { label: "Mixed",             color: "var(--text-primary)", ring: "var(--color-acqua)", glow: "rgba(202,241,240,0.25)" },
    challenging:      { label: "Challenging",       color: "var(--text-primary)", ring: "var(--color-spiced-life)", glow: "rgba(230,122,122,0.25)" },
    hostile:          { label: "Hostile",           color: "var(--text-primary)", ring: "var(--color-spiced-life)", glow: "rgba(230,122,122,0.30)" },
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
                <span className={styles.ringScore} style={{ color: cfg.color, fontFamily: "var(--font-primary)" }}>{displayed}</span>
            </div>
            <span className={styles.ringLabel}>{cfg.label}</span>
        </div>
    );
}
