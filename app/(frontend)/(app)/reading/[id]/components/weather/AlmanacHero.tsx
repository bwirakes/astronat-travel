"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Props {
    city: string;              // "Tokyo, Japan"
    startDateLabel: string;
    endDateLabel: string;
    windowDays: number;
    generatedLabel: string;
    coordsLabel?: string;
    heroImage?: string;
    score: number;             // 0–100 resonance
    verdict: string;           // plain-English one-liner
    readingId?: string;        // for the regenerate action
}

function ScoreDial({ score }: { score: number }) {
    const clamped = Math.max(0, Math.min(100, score));
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const arcCircumference = circumference * 0.75;
    const filled = (clamped / 100) * arcCircumference;
    const ring =
        clamped >= 70
            ? "var(--color-y2k-blue)"
            : clamped >= 50
            ? "var(--gold)"
            : "var(--color-spiced-life)";
    const band =
        clamped >= 80 ? "Highly productive"
        : clamped >= 65 ? "Productive"
        : clamped >= 50 ? "Mixed"
        : clamped >= 35 ? "Challenging"
        : "Hostile";

    return (
        <div style={{ position: "relative", width: 160, height: 180, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ position: "relative", width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
                    <circle
                        cx="80" cy="80" r={radius}
                        stroke="rgba(248,245,236,0.1)"
                        strokeWidth="10" fill="none"
                        strokeDasharray={`${arcCircumference} ${circumference}`}
                        strokeLinecap="round"
                        transform="rotate(135 80 80)"
                    />
                    <circle
                        cx="80" cy="80" r={radius}
                        stroke={ring}
                        strokeWidth="10" fill="none"
                        strokeDasharray={`${filled} ${circumference}`}
                        strokeLinecap="round"
                        transform="rotate(135 80 80)"
                        style={{ filter: `drop-shadow(0 0 10px ${ring}99)`, transition: "stroke-dasharray 0.8s ease" }}
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "3.5rem",
                            lineHeight: 1,
                            color: "var(--color-eggshell)",
                            letterSpacing: "-0.03em",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {Math.round(clamped)}
                    </span>
                </div>
            </div>
            <span
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.58rem",
                    letterSpacing: "0.22em",
                    color: "var(--color-acqua)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                {band}
            </span>
        </div>
    );
}

export function AlmanacHero({
    city,
    startDateLabel,
    endDateLabel,
    windowDays,
    generatedLabel,
    coordsLabel,
    heroImage = "/moody-landscape.jpg",
    score,
    verdict,
    readingId,
}: Props) {
    const [primary, ...regionParts] = city.split(",");
    const region = regionParts.join(",").trim();
    const [regenerating, setRegenerating] = useState(false);

    const handleRegenerate = async () => {
        if (!readingId || regenerating) return;
        setRegenerating(true);
        try {
            const res = await fetch(`/api/readings/${readingId}/regenerate-weather`, {
                method: "POST",
            });
            if (res.ok) {
                // Reload so the new interpretation loads from Supabase.
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
                position: "relative",
                backgroundImage: `url(${heroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                padding: "clamp(1rem, 2.5vw, 1.5rem) clamp(1rem, 2.5vw, 2.5rem)",
                color: "var(--color-eggshell)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
            }}
        >
            {/* Scrim */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, rgba(27,27,27,0.65) 0%, rgba(27,27,27,0.22) 32%, rgba(27,27,27,0.55) 72%, rgba(27,27,27,0.95) 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* Chrome */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    zIndex: 2,
                    marginBottom: "clamp(1.5rem, 4vw, 3rem)",
                }}
            >
                <Link
                    href="/dashboard"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.9rem",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(8px)",
                        borderRadius: "999px",
                        color: "var(--color-eggshell)",
                        textDecoration: "none",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                    }}
                >
                    <ArrowLeft size={14} />
                    Dashboard
                </Link>

                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {readingId && (
                        <button
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.5rem 0.85rem",
                                background: regenerating ? "rgba(4,86,251,0.4)" : "rgba(4,86,251,0.65)",
                                border: "1px solid rgba(4,86,251,0.9)",
                                backdropFilter: "blur(8px)",
                                borderRadius: "999px",
                                color: "var(--color-eggshell)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.58rem",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                cursor: regenerating ? "not-allowed" : "pointer",
                            }}
                        >
                            <RefreshCw
                                size={12}
                                className={regenerating ? "animate-spin" : undefined}
                            />
                            {regenerating ? "Regenerating..." : "Regenerate"}
                        </button>
                    )}
                    {["share", "save"].map((l) => (
                        <button
                            key={l}
                            style={{
                                padding: "0.5rem 0.85rem",
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.18)",
                                backdropFilter: "blur(8px)",
                                borderRadius: "999px",
                                color: "var(--color-eggshell)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.58rem",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                            }}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main body — kicker + title + dial + verdict + meta */}
            <div style={{ position: "relative", zIndex: 2, flex: 1 }}>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.25em",
                        color: "var(--color-acqua)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginBottom: "1rem",
                    }}
                >
                    ★ A geodetic reading · {windowDays} days
                </div>

                {/* Title + dial row */}
                <div
                    className="flex flex-col md:flex-row md:items-end md:justify-between"
                    style={{ gap: "clamp(1.25rem, 3vw, 2.5rem)" }}
                >
                    <h1
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(3rem, 9vw, 7.5rem)",
                            lineHeight: 0.88,
                            letterSpacing: "-0.03em",
                            margin: 0,
                            color: "var(--color-eggshell)",
                            textTransform: "uppercase",
                            textWrap: "balance",
                            wordBreak: "normal",
                            overflowWrap: "normal",
                            hyphens: "none",
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        <span style={{ whiteSpace: "nowrap" }}>{primary}.</span>
                    </h1>

                    <div style={{ flexShrink: 0 }}>
                        <ScoreDial score={score} />
                    </div>
                </div>

                {/* Verdict subtitle */}
                <p
                    style={{
                        marginTop: "clamp(1rem, 2.5vw, 1.5rem)",
                        fontFamily: "var(--font-secondary)",
                        fontSize: "clamp(1.15rem, 2.2vw, 1.6rem)",
                        lineHeight: 1.35,
                        color: "var(--color-eggshell)",
                        maxWidth: "40ch",
                        margin: "clamp(1rem, 2.5vw, 1.5rem) 0 0",
                        fontWeight: 400,
                        textWrap: "pretty",
                        fontStyle: "italic",
                    }}
                >
                    {verdict}
                </p>

                {/* Meta row */}
                <div
                    style={{
                        marginTop: "clamp(1.25rem, 3vw, 2rem)",
                        display: "flex",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.2em",
                        color: "rgba(248,245,236,0.8)",
                        textTransform: "uppercase",
                        fontWeight: 600,
                    }}
                >
                    <span>{region || primary}</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>{startDateLabel} — {endDateLabel}</span>
                    {coordsLabel && (
                        <>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>{coordsLabel}</span>
                        </>
                    )}
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>Generated {generatedLabel}</span>
                </div>
            </div>

            {/* Scroll cue */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "clamp(1.5rem, 3vw, 2.25rem)",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid rgba(255,255,255,0.18)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.58rem",
                    letterSpacing: "0.2em",
                    color: "rgba(248,245,236,0.75)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                <span>scroll for why</span>
                <ChevronDown size={14} />
            </div>
        </section>
    );
}
