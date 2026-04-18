"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface Props {
    cityPrimary: string;          // "MOSCOW"
    cityFull: string;             // "Moscow, Russia"
    titleFlourish: string;        // "opening" | "window" | ...
    coordsLabel: string;          // "55.75°N 37.62°E"
    windowCount: number;          // 3
    windowDays: number;           // 30 / 60 / 90
    dateRangeLabel: string;       // "APR 18 — MAY 18, 2026"
    generatedLabel: string;       // "APR 18, 2026 · 09:12"
    score: number;
    scoreBand: string;            // "MIXED" | "HIGHLY PRODUCTIVE" | ...
    readingId?: string;
}

export function Brief({
    cityPrimary,
    cityFull,
    titleFlourish,
    coordsLabel,
    windowCount,
    windowDays,
    dateRangeLabel,
    generatedLabel,
    score,
    scoreBand,
    readingId,
}: Props) {
    const [regenerating, setRegenerating] = useState(false);

    const handleRegenerate = async () => {
        if (!readingId || regenerating) return;
        setRegenerating(true);
        try {
            const res = await fetch(`/api/readings/${readingId}/regenerate-weather`, { method: "POST" });
            if (res.ok) {
                if (typeof window !== "undefined") window.location.reload();
            } else {
                setRegenerating(false);
                console.error("Regenerate failed:", await res.text());
            }
        } catch (err) {
            setRegenerating(false);
            console.error("Regenerate failed:", err);
        }
    };

    return (
        <section
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1rem, 2.5vw, 1.75rem)",
                paddingBottom: "clamp(1rem, 2vw, 1.5rem)",
                borderBottom: "1px solid var(--surface-border)",
            }}
        >
            {/* Chrome bar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                }}
            >
                <Link
                    href="/dashboard"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                    }}
                >
                    <ArrowLeft size={16} />
                    The Atlas
                </Link>

                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.22em",
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    {cityFull.toUpperCase()}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {readingId && (
                        <button
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.45rem 0.8rem",
                                background: "transparent",
                                border: "1px solid var(--surface-border)",
                                borderRadius: "999px",
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.58rem",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                cursor: regenerating ? "not-allowed" : "pointer",
                                opacity: regenerating ? 0.5 : 1,
                            }}
                        >
                            <RefreshCw size={11} className={regenerating ? "animate-spin" : undefined} />
                            {regenerating ? "…" : "Regenerate"}
                        </button>
                    )}
                    <button
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                            color: "var(--text-primary)",
                            background: "transparent",
                            border: "none",
                            textDecoration: "underline",
                            textUnderlineOffset: "3px",
                            cursor: "pointer",
                        }}
                    >
                        Share
                    </button>
                    <button
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                            color: "var(--text-primary)",
                            background: "transparent",
                            border: "none",
                            textDecoration: "underline",
                            textUnderlineOffset: "3px",
                            cursor: "pointer",
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Kicker */}
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.28em",
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                ★ Traveler&apos;s brief · Generated {generatedLabel}
            </div>

            {/* Title + score row */}
            <div
                className="flex flex-col md:flex-row md:items-end md:justify-between"
                style={{ gap: "clamp(1rem, 3vw, 2rem)" }}
            >
                <h1
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(3rem, 9vw, 7rem)",
                        lineHeight: 0.9,
                        letterSpacing: "-0.03em",
                        margin: 0,
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        textWrap: "balance",
                        wordBreak: "normal",
                        overflowWrap: "normal",
                        hyphens: "none",
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <span style={{ whiteSpace: "nowrap" }}>The {cityPrimary}</span>{" "}
                    <span
                        style={{
                            fontFamily: "var(--font-display-alt-2)",
                            color: "var(--color-y2k-blue)",
                            textTransform: "lowercase",
                            letterSpacing: 0,
                            fontSize: "0.75em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {titleFlourish}
                    </span>
                </h1>

                {/* Score pill */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "0.15rem",
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(2.5rem, 5vw, 4rem)",
                            lineHeight: 1,
                            color: "var(--color-spiced-life)",
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        {Math.round(score)}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.22em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        {scoreBand}
                    </span>
                </div>
            </div>

            {/* Meta row */}
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.22em",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem 0.9rem",
                    alignItems: "center",
                }}
            >
                <span>{cityFull}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{coordsLabel}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>
                    {windowCount} {windowCount === 1 ? "window" : "windows"}
                </span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>Next {windowDays} days</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{dateRangeLabel}</span>
            </div>
        </section>
    );
}
