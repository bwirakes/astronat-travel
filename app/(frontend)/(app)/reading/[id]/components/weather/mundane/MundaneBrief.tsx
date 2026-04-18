"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
    cityFull: string;
    cityPrimary: string;
    coordsLabel: string;
    dateRangeLabel: string;
    windowDays: number;
    generatedLabel: string;
    tier: "Calm" | "Unsettled" | "Turbulent" | "Severe" | "Extreme";
    /** One AI-written declarative sentence — the "situation lead." */
    situationLead: string;
}

const TIER_ORDER = ["Calm", "Unsettled", "Turbulent", "Severe", "Extreme"] as const;
const TIER_COLORS: Record<(typeof TIER_ORDER)[number], string> = {
    Calm: "var(--sage)",
    Unsettled: "var(--color-y2k-blue)",
    Turbulent: "var(--gold)",
    Severe: "var(--color-spiced-life)",
    Extreme: "#7a1b1b",
};

/**
 * Mundane / weather reading header. NOAA-discussion frame, not magazine.
 * Pressure dial replaces the personal score dial: one segment lit, labelled.
 */
export function MundaneBrief({
    cityFull,
    cityPrimary,
    coordsLabel,
    dateRangeLabel,
    windowDays,
    generatedLabel,
    tier,
    situationLead,
}: Props) {
    return (
        <section
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1.25rem, 2.5vw, 1.75rem)",
                paddingBottom: "clamp(1.25rem, 2vw, 1.75rem)",
                borderBottom: "1px solid var(--surface-border)",
            }}
        >
            {/* Chrome bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
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
                    Geodetic weather · {cityFull.toUpperCase()}
                </div>
                <div />
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
                ⚠ Forecast discussion · Generated {generatedLabel}
            </div>

            {/* Title */}
            <h1
                style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(2.5rem, 7vw, 5rem)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.03em",
                    margin: 0,
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    textWrap: "balance",
                }}
            >
                <span style={{ whiteSpace: "nowrap" }}>The {cityPrimary} forecast.</span>
            </h1>

            {/* Situation lead */}
            <p
                style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                    lineHeight: 1.5,
                    color: "var(--text-primary)",
                    margin: 0,
                    maxWidth: "60ch",
                    textWrap: "pretty",
                    fontStyle: "italic",
                    fontWeight: 400,
                }}
            >
                {situationLead}
            </p>

            {/* Pressure dial — 5 segments */}
            <div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "4px",
                        marginBottom: "0.5rem",
                    }}
                >
                    {TIER_ORDER.map((t) => {
                        const active = t === tier;
                        return (
                            <div
                                key={t}
                                style={{
                                    height: 12,
                                    background: active ? TIER_COLORS[t] : "var(--surface-border)",
                                    opacity: active ? 1 : 0.35,
                                    borderRadius: 2,
                                    transition: "opacity 0.3s ease",
                                }}
                            />
                        );
                    })}
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "4px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.52rem",
                        letterSpacing: "0.18em",
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    {TIER_ORDER.map((t) => (
                        <span
                            key={t}
                            style={{
                                color: t === tier ? TIER_COLORS[t] : "var(--text-tertiary)",
                                fontWeight: t === tier ? 800 : 600,
                            }}
                        >
                            {t}
                        </span>
                    ))}
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
                <span>Next {windowDays} days</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{dateRangeLabel}</span>
            </div>
        </section>
    );
}
