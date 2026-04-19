"use client";

import { useMemo, useState } from "react";
import {
    BUCKET_COPY,
    tierToBucket,
    type GeodeticWeatherResult,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    days: GeodeticWeatherResult[];
    startDate: string;
    onPickDay?: (index: number) => void;
}

interface Bar {
    label: string;       // "Rough stretch" | "Green window"
    startIdx: number;
    endIdx: number;
    peakIdx: number;
    strength: number;    // 0–1
    accent: string;
    kind: "rough" | "good";
}

/**
 * Aggregate consecutive same-bucket days into contiguous bars.
 * Good windows: 3+ consecutive good days.
 * Rough windows: any contiguous rough span.
 */
function buildBars(days: GeodeticWeatherResult[]): Bar[] {
    const bars: Bar[] = [];
    let i = 0;
    while (i < days.length) {
        const b = tierToBucket(days[i].severity);
        if (b === "mixed") { i++; continue; }
        let j = i;
        while (j < days.length && tierToBucket(days[j].severity) === b) j++;
        const span = days.slice(i, j);
        const len = span.length;

        // Surface green windows at ≥2 days so short good stretches at the
        // tail of a 7-day forecast don't get hidden — otherwise the Gantt
        // looks rough-peak + silence while the strip clearly shows green.
        if (b === "rough" || (b === "good" && len >= 2)) {
            // Peak = the day with the highest |deviation from 50|
            let peakOffset = 0;
            let bestDev = -1;
            span.forEach((d, k) => {
                const dev = Math.abs(d.score - 50);
                if (dev > bestDev) { bestDev = dev; peakOffset = k; }
            });
            const avgDev = span.reduce((a, d) => a + Math.abs(d.score - 50), 0) / len;
            bars.push({
                label: b === "rough" ? "Rough stretch" : "Green window",
                startIdx: i,
                endIdx: j - 1,
                peakIdx: i + peakOffset,
                strength: Math.min(1, avgDev / 50),
                accent: BUCKET_COPY[b].accent,
                kind: b as "rough" | "good",
            });
        }
        i = j;
    }
    return bars;
}

function fmtDay(iso: string): { d: number; m: string } {
    const dt = new Date(iso);
    return {
        d: dt.getUTCDate(),
        m: dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    };
}

export function GanttTimelineSection({ days, onPickDay }: Props) {
    const bars = useMemo(() => buildBars(days), [days]);
    const total = days.length;
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    // Day-dots intensity strip: per-day score → height.
    const dotHeights = useMemo(
        () => days.map((d) => Math.max(0.18, Math.abs(d.score - 50) / 50)),
        [days],
    );

    // Ruler ticks — every 7 days for 7/30 day, every 15 for 90 day
    const tickEvery = total >= 60 ? 15 : total >= 14 ? 7 : 3;
    const ticks: number[] = [];
    for (let i = 0; i <= total; i += tickEvery) ticks.push(i);
    if (ticks[ticks.length - 1] !== total) ticks.push(total);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(1rem, 2vw, 1.5rem)" }}>
            <header style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxWidth: "720px" }}>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.22em",
                        color: "var(--color-spiced-life)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    Transit windows · when &amp; how hard
                </div>
                <h3
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        margin: 0,
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        textWrap: "balance",
                    }}
                >
                    Pressure across the window
                </h3>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        margin: "0.25rem 0 0",
                        maxWidth: "60ch",
                        textWrap: "pretty",
                        fontWeight: 300,
                    }}
                >
                    Each bar is a continuous stretch; the tick inside marks the peak day. The strip below rolls up every day in the forecast so you can spot tight clusters at a glance.
                </p>
            </header>

            {/* Gantt grid */}
            <div
                style={{
                    background: "var(--bg-raised)",
                    padding: "clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.75rem)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--surface-border)",
                }}
            >
                {/* Ruler */}
                <div
                    style={{
                        position: "relative",
                        height: 24,
                        borderBottom: "1px solid var(--surface-border)",
                        marginBottom: "0.75rem",
                    }}
                >
                    {ticks.map((t) => {
                        const pct = (t / total) * 100;
                        const label = t === 0 ? "now" : `d${t}`;
                        return (
                            <div
                                key={t}
                                style={{
                                    position: "absolute",
                                    left: `${pct}%`,
                                    bottom: 0,
                                    transform: "translateX(-50%)",
                                }}
                            >
                                <div style={{ width: 1, height: 6, background: "var(--surface-border)" }} />
                                <div
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.55rem",
                                        letterSpacing: "0.15em",
                                        color: "var(--text-tertiary)",
                                        textTransform: "uppercase",
                                        paddingTop: "0.25rem",
                                        whiteSpace: "nowrap",
                                        fontWeight: 700,
                                    }}
                                >
                                    {label}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bars */}
                {bars.length === 0 ? (
                    <p
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.9rem",
                            color: "var(--text-tertiary)",
                            fontStyle: "italic",
                            margin: "1.5rem 0",
                            textAlign: "center",
                        }}
                    >
                        No clear windows in this forecast — the window runs mostly mixed.
                    </p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {bars.map((bar, i) => {
                            const startPct = (bar.startIdx / total) * 100;
                            const widthPct = ((bar.endIdx - bar.startIdx + 1) / total) * 100;
                            const peakWithinPct = ((bar.peakIdx - bar.startIdx + 0.5) / (bar.endIdx - bar.startIdx + 1)) * 100;
                            const peakDay = days[bar.peakIdx];
                            const peakLabel = fmtDay(peakDay.dateUtc);
                            const isHovered = hoverIdx === i;

                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "140px 1fr",
                                        gap: "clamp(0.5rem, 1vw, 1rem)",
                                        alignItems: "center",
                                        padding: "0.85rem 0",
                                        borderTop: i === 0 ? "none" : "1px solid var(--surface-border)",
                                    }}
                                    onMouseEnter={() => setHoverIdx(i)}
                                    onMouseLeave={() => setHoverIdx(null)}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                        <span
                                            style={{
                                                fontFamily: "var(--font-body)",
                                                fontSize: "0.85rem",
                                                fontWeight: 600,
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {bar.label}
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "0.55rem",
                                                letterSpacing: "0.15em",
                                                color: bar.accent,
                                                textTransform: "uppercase",
                                                fontWeight: 700,
                                            }}
                                        >
                                            peak {peakLabel.m} {peakLabel.d}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => onPickDay?.(bar.peakIdx)}
                                        style={{
                                            position: "relative",
                                            height: 34,
                                            background: "transparent",
                                            border: "none",
                                            cursor: onPickDay ? "pointer" : "default",
                                            padding: 0,
                                        }}
                                    >
                                        {/* Bar */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: `${startPct}%`,
                                                width: `${widthPct}%`,
                                                top: 10,
                                                height: 14,
                                                background: bar.accent,
                                                opacity: 0.3 + bar.strength * 0.5 + (isHovered ? 0.15 : 0),
                                                borderRadius: 7,
                                                transition: "opacity 0.2s ease",
                                            }}
                                        />
                                        {/* Peak marker */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: `calc(${startPct}% + ${peakWithinPct}% * ${widthPct / 100})`,
                                                top: 2,
                                                height: 30,
                                                width: 2,
                                                background: bar.accent,
                                            }}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Day-dots intensity strip */}
                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--surface-border)" }}>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.2em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                            fontWeight: 700,
                        }}
                    >
                        Daily intensity · {total} days
                    </div>
                    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 42, width: "100%" }}>
                        {dotHeights.map((h, i) => {
                            const day = days[i];
                            const bucket = tierToBucket(day.severity);
                            const color = BUCKET_COPY[bucket].accent;
                            return (
                                <button
                                    key={i}
                                    onClick={() => onPickDay?.(i)}
                                    title={`Day ${i + 1} — ${BUCKET_COPY[bucket].short}`}
                                    style={{
                                        flex: 1,
                                        height: `${Math.max(18, h * 100)}%`,
                                        background: color,
                                        opacity: bucket === "mixed" ? 0.35 : 0.7 + h * 0.3,
                                        border: "none",
                                        padding: 0,
                                        cursor: onPickDay ? "pointer" : "default",
                                        borderRadius: 1,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
