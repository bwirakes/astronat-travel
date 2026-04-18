"use client";

import { ArrowRight } from "lucide-react";
import {
    BUCKET_COPY,
    dayCardCopy,
    tierToBucket,
    type GWCityForecast,
    type GeodeticWeatherResult,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    city: GWCityForecast;
    windowDays: number;
    startDate: string;
    endDate: string;
    macroScore: number;
    onPickDay: (originalIndex: number) => void;
    onContinue: () => void;
}

function fmtShort(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRowDate(iso: string) {
    const dt = new Date(iso);
    return {
        weekday: dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
        month: dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        day: dt.getUTCDate(),
    };
}

export function Stage1Summary({
    city,
    windowDays,
    startDate,
    endDate,
    macroScore,
    onPickDay,
    onContinue,
}: Props) {
    const counts = { good: 0, mixed: 0, rough: 0 };
    for (const d of city.days) counts[tierToBucket(d.severity)]++;
    const total = city.days.length;
    const goodPct = total ? counts.good / total : 0;
    const roughPct = total ? counts.rough / total : 0;

    let headline: string;
    if (goodPct >= 0.7) headline = "Mostly smooth";
    else if (roughPct >= 0.3) headline = "A rough stretch";
    else headline = "A mixed window";

    // Top 3 best / top 3 worst by score, preserving original index.
    const indexed = city.days.map((d, i) => ({ d, i }));
    const best = [...indexed]
        .filter((x) => tierToBucket(x.d.severity) === "good")
        .sort((a, b) => b.d.score - a.d.score)
        .slice(0, 3);
    const worst = [...indexed]
        .filter((x) => tierToBucket(x.d.severity) === "rough")
        .sort((a, b) => a.d.score - b.d.score)
        .slice(0, 3);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            {/* Score + verdict card */}
            <section
                style={{
                    background: "var(--color-charcoal)",
                    color: "var(--color-eggshell)",
                    border: "1px solid var(--surface-border)",
                    padding: "clamp(1.75rem, 4vw, 3rem)",
                    borderRadius: "var(--radius-lg)",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "clamp(1.5rem, 3vw, 2rem)",
                }}
                className="grid-cols-1 md:grid-cols-[auto_1fr]"
            >
                {/* Score dial */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ScoreDial score={macroScore} />
                </div>

                {/* Verdict copy */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "center" }}>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.62rem",
                            letterSpacing: "0.25em",
                            color: "var(--color-acqua)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        {city.label} · {fmtShort(startDate)} → {fmtShort(endDate)} · {windowDays} days
                    </div>
                    <h1
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
                            lineHeight: 0.95,
                            letterSpacing: "-0.03em",
                            margin: 0,
                            color: "var(--color-eggshell)",
                            textTransform: "uppercase",
                            wordBreak: "normal",
                            overflowWrap: "normal",
                            hyphens: "none",
                        }}
                    >
                        {headline.split(" ").map((w, i, arr) => (
                            <span key={i} style={{ whiteSpace: "nowrap" }}>
                                {w}
                                {i < arr.length - 1 ? " " : "."}
                            </span>
                        ))}
                    </h1>

                    {/* Proportion bar */}
                    <div
                        role="img"
                        aria-label={`${counts.good} good, ${counts.mixed} mixed, ${counts.rough} rough days`}
                        style={{
                            display: "flex",
                            gap: "3px",
                            height: "16px",
                            borderRadius: "var(--radius-xs)",
                            overflow: "hidden",
                        }}
                    >
                        {(["good", "mixed", "rough"] as const).map((k) => (
                            <div
                                key={k}
                                style={{
                                    flex: counts[k] / Math.max(1, total) || 0,
                                    background: BUCKET_COPY[k].accent,
                                    minWidth: counts[k] > 0 ? "6px" : 0,
                                }}
                            />
                        ))}
                    </div>

                    {/* Count pills */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {(["good", "mixed", "rough"] as const).map((b) => {
                            const c = BUCKET_COPY[b];
                            return (
                                <span
                                    key={b}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        padding: "0.3rem 0.75rem",
                                        border: `1px solid ${c.accent}`,
                                        borderRadius: "999px",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.18em",
                                        color: "var(--color-eggshell)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    <span
                                        aria-hidden
                                        style={{ width: 8, height: 8, borderRadius: 2, background: c.accent }}
                                    />
                                    {counts[b]} {c.short}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Best / Watch highlights */}
            <section
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: "clamp(0.75rem, 1.5vw, 1.25rem)" }}
            >
                <HighlightColumn
                    title="Best days"
                    subtitle="Pick these for important plans"
                    bucket="good"
                    rows={best}
                    empty="No clearly good days in this window."
                    onPick={onPickDay}
                />
                <HighlightColumn
                    title="Watch these"
                    subtitle="Consider shifting if you can"
                    bucket="rough"
                    rows={worst}
                    empty="No rough days flagged."
                    onPick={onPickDay}
                />
            </section>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={onContinue}
                    className="btn btn-primary"
                    style={{
                        padding: "0.85rem 1.25rem",
                        borderRadius: "var(--shape-asymmetric-md)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    Read what it means <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}

function ScoreDial({ score }: { score: number }) {
    const clamped = Math.max(0, Math.min(100, score));
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const arcCircumference = circumference * 0.75;
    const filled = (clamped / 100) * arcCircumference;
    const ring =
        clamped >= 70
            ? "var(--sage)"
            : clamped >= 50
            ? "var(--gold)"
            : "var(--color-spiced-life)";

    return (
        <div style={{ position: "relative", width: 160, height: 160 }}>
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="rgba(248,245,236,0.08)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${arcCircumference} ${circumference}`}
                    strokeLinecap="round"
                    transform="rotate(135 80 80)"
                />
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={ring}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${filled} ${circumference}`}
                    strokeLinecap="round"
                    transform="rotate(135 80 80)"
                    style={{ filter: `drop-shadow(0 0 8px ${ring}66)`, transition: "stroke-dasharray 0.6s ease" }}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.1rem",
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "3rem",
                        fontWeight: 800,
                        color: "var(--color-eggshell)",
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {Math.round(clamped)}
                </span>
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.25em",
                        color: "var(--color-acqua)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    / 100 overall
                </span>
            </div>
        </div>
    );
}

function HighlightColumn({
    title,
    subtitle,
    bucket,
    rows,
    empty,
    onPick,
}: {
    title: string;
    subtitle: string;
    bucket: "good" | "rough";
    rows: { d: GeodeticWeatherResult; i: number }[];
    empty: string;
    onPick: (i: number) => void;
}) {
    const copy = BUCKET_COPY[bucket];
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: `4px solid ${copy.accent}`,
                borderRadius: "var(--radius-md)",
                padding: "1.25rem 1.25rem 0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
            }}
        >
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: copy.accent,
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                {title}
            </div>
            <p
                style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.82rem",
                    color: "var(--text-tertiary)",
                    margin: "0 0 0.5rem 0",
                }}
            >
                {subtitle}
            </p>

            {rows.length === 0 ? (
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.85rem",
                        color: "var(--text-tertiary)",
                        fontStyle: "italic",
                        margin: "0 0 0.75rem 0",
                    }}
                >
                    {empty}
                </p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {rows.map(({ d, i }) => (
                        <HighlightRow key={d.dateUtc} day={d} onPick={() => onPick(i)} accent={copy.accent} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function HighlightRow({
    day,
    accent,
    onPick,
}: {
    day: GeodeticWeatherResult;
    accent: string;
    onPick: () => void;
}) {
    const f = fmtRowDate(day.dateUtc);
    const { impact } = dayCardCopy(day);
    return (
        <li>
            <button
                onClick={onPick}
                style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "54px 1fr auto",
                    gap: "0.85rem",
                    alignItems: "center",
                    textAlign: "left",
                    padding: "0.7rem 0",
                    background: "transparent",
                    border: "none",
                    borderTop: "1px solid var(--surface-border)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.52rem",
                            letterSpacing: "0.2em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        {f.weekday}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            lineHeight: 1,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.02em",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {f.day}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.52rem",
                            letterSpacing: "0.2em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        {f.month}
                    </span>
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.85rem",
                        lineHeight: 1.4,
                        margin: 0,
                        color: "var(--text-primary)",
                    }}
                >
                    {impact}
                </p>
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.15em",
                        color: accent,
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    open →
                </span>
            </button>
        </li>
    );
}
