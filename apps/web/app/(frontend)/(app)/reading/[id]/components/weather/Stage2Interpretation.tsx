"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { GWInterpretation } from "@/app/lib/geodetic-weather-types";

interface Props {
    interpretation: GWInterpretation;
    cityLabel: string;
    onBack: () => void;
    onContinue: () => void;
}

const IMPACT_ACCENT: Record<GWInterpretation["keyMoments"][number]["impact"], string> = {
    challenging: "var(--color-spiced-life)",
    supportive: "var(--sage)",
    neutral: "var(--gold)",
};

const IMPACT_LABEL: Record<GWInterpretation["keyMoments"][number]["impact"], string> = {
    challenging: "Pressure",
    supportive: "Lift",
    neutral: "Shift",
};

export function Stage2Interpretation({ interpretation, cityLabel, onBack, onContinue }: Props) {
    const { hook, keyMoments, advice } = interpretation;
    const overview = { title: "The sky ahead", content: hook };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            {/* Overview */}
            <section
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "clamp(1.5rem, 3vw, 2.25rem)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.9rem",
                }}
            >
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.25em",
                        color: "var(--color-y2k-blue)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    What the sky is doing for {cityLabel.split(",")[0]}
                </div>
                <h2
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                        lineHeight: 0.95,
                        letterSpacing: "-0.03em",
                        margin: 0,
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                    }}
                >
                    {overview.title}
                </h2>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "clamp(1rem, 1.6vw, 1.1rem)",
                        lineHeight: 1.55,
                        margin: 0,
                        color: "var(--text-primary)",
                        maxWidth: "62ch",
                    }}
                >
                    {overview.content}
                </p>
            </section>

            {/* Key moments */}
            {keyMoments.length > 0 && (
                <section>
                    <header style={{ marginBottom: "1rem" }}>
                        <div
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.62rem",
                                letterSpacing: "0.25em",
                                color: "var(--color-y2k-blue)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                marginBottom: "0.25rem",
                            }}
                        >
                            Key moments
                        </div>
                        <h3
                            style={{
                                fontFamily: "var(--font-primary)",
                                fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
                                lineHeight: 0.95,
                                letterSpacing: "-0.02em",
                                margin: 0,
                                color: "var(--text-primary)",
                                textTransform: "uppercase",
                            }}
                        >
                            The transits that shape the window
                        </h3>
                    </header>

                    <ol
                        style={{
                            listStyle: "none",
                            margin: 0,
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                        }}
                    >
                        {keyMoments.map((m, i) => {
                            const accent = IMPACT_ACCENT[m.impact];
                            return (
                                <li key={i}>
                                    <article
                                        style={{
                                            background: "var(--surface)",
                                            border: "1px solid var(--surface-border)",
                                            borderLeft: `4px solid ${accent}`,
                                            borderRadius: "var(--radius-md)",
                                            padding: "1.1rem 1.25rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <header
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "baseline",
                                                gap: "0.75rem",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontFamily: "var(--font-mono)",
                                                    fontSize: "0.6rem",
                                                    letterSpacing: "0.2em",
                                                    color: "var(--text-tertiary)",
                                                    textTransform: "uppercase",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {m.dates}
                                            </div>
                                            <span
                                                style={{
                                                    fontFamily: "var(--font-mono)",
                                                    fontSize: "0.55rem",
                                                    letterSpacing: "0.22em",
                                                    padding: "0.25rem 0.6rem",
                                                    border: `1px solid ${accent}`,
                                                    color: accent,
                                                    textTransform: "uppercase",
                                                    fontWeight: 800,
                                                    borderRadius: "999px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {IMPACT_LABEL[m.impact]}
                                            </span>
                                        </header>

                                        <h4
                                            style={{
                                                fontFamily: "var(--font-body)",
                                                fontSize: "1.1rem",
                                                fontWeight: 700,
                                                margin: 0,
                                                color: "var(--text-primary)",
                                                lineHeight: 1.25,
                                            }}
                                        >
                                            {m.title}
                                        </h4>

                                        <div
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "0.62rem",
                                                letterSpacing: "0.15em",
                                                color: accent,
                                                textTransform: "uppercase",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {m.driver}
                                        </div>

                                        <p
                                            style={{
                                                fontFamily: "var(--font-body)",
                                                fontSize: "0.95rem",
                                                lineHeight: 1.5,
                                                margin: 0,
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {m.body}
                                        </p>
                                    </article>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            )}

            {/* Advice */}
            <section
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: "clamp(0.75rem, 1.5vw, 1.25rem)" }}
            >
                <AdviceCard kind="best" title="When to act" body={advice.bestWindow} />
                <AdviceCard kind="watch" title="When to wait" body={advice.watchWindow} />
            </section>

            {/* Stage nav */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                    onClick={onBack}
                    className="btn btn-secondary"
                    style={{
                        padding: "0.75rem 1.1rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <ArrowLeft size={15} /> Summary
                </button>
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
                    See the full report <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}

function AdviceCard({
    kind,
    title,
    body,
}: {
    kind: "best" | "watch";
    title: string;
    body: string;
}) {
    const accent = kind === "best" ? "var(--sage)" : "var(--color-spiced-life)";
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: `4px solid ${accent}`,
                borderRadius: "var(--radius-md)",
                padding: "1.1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
            }}
        >
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: accent,
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                {title}
            </div>
            <p
                style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    margin: 0,
                    color: "var(--text-primary)",
                }}
            >
                {body}
            </p>
        </div>
    );
}
