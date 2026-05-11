"use client";

import type { GWKeyMoment } from "@/app/lib/geodetic-weather-types";

interface Props {
    movements: GWKeyMoment[];
}

const IMPACT_ACCENT: Record<GWKeyMoment["impact"], string> = {
    challenging: "var(--color-spiced-life)",
    supportive: "var(--sage)",
    neutral: "var(--gold)",
};

const IMPACT_LABEL: Record<GWKeyMoment["impact"], string> = {
    challenging: "Pressure",
    supportive: "Lift",
    neutral: "Shift",
};

export function MovementsSection({ movements }: Props) {
    if (!movements || movements.length === 0) return null;

    return (
        <section
            aria-label="Movements"
            style={{
                padding: "clamp(2.5rem, 5vw, 4.5rem) 0",
                borderTop: "1px solid var(--surface-border)",
            }}
        >
            <header style={{ marginBottom: "clamp(1.5rem, 3vw, 2.75rem)", maxWidth: "820px" }}>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.28em",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginBottom: "0.5rem",
                    }}
                >
                    Movements
                </div>
                <h2
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(2rem, 5vw, 4rem)",
                        lineHeight: 0.95,
                        letterSpacing: "-0.02em",
                        margin: "0 0 0.9rem",
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        textWrap: "balance",
                    }}
                >
                    {movements.length === 1 ? "One movement" : `${movements.length} movements`}
                    , loosely{" "}
                    <span
                        style={{
                            fontFamily: "var(--font-display-alt-2)",
                            color: "var(--color-y2k-blue)",
                            textTransform: "lowercase",
                            letterSpacing: 0,
                            fontSize: "1em",
                        }}
                    >
                        in order
                    </span>
                </h2>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "60ch",
                        textWrap: "pretty",
                        fontWeight: 300,
                    }}
                >
                    Forecasts aren&apos;t fortune — they&apos;re weather. Here is what this sky tends to make, and when.
                </p>
            </header>

            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
                {movements.map((m, i) => {
                    const accent = IMPACT_ACCENT[m.impact];
                    return (
                        <li
                            key={i}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "100px 1fr",
                                gap: "clamp(1rem, 2.5vw, 2rem)",
                                padding: "clamp(1.5rem, 2.5vw, 2rem) 0",
                                borderTop: "1px solid var(--surface-border)",
                                alignItems: "start",
                            }}
                        >
                            {/* Left spine — mvt number + dates + impact label */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <span
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "2.5rem",
                                        lineHeight: 0.9,
                                        letterSpacing: "-0.02em",
                                        color: accent,
                                    }}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.55rem",
                                        letterSpacing: "0.2em",
                                        color: "var(--text-tertiary)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    Mvt. {String(i + 1).padStart(2, "0")} / {String(movements.length).padStart(2, "0")}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.58rem",
                                        letterSpacing: "0.15em",
                                        color: accent,
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    {IMPACT_LABEL[m.impact]}
                                </span>
                            </div>

                            {/* Right body */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: 0 }}>
                                <div
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.58rem",
                                        letterSpacing: "0.22em",
                                        color: accent,
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    {m.dates}
                                </div>

                                <h3
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                                        lineHeight: 1.05,
                                        letterSpacing: "-0.015em",
                                        margin: 0,
                                        color: "var(--text-primary)",
                                        fontWeight: 400,
                                        textWrap: "balance",
                                    }}
                                >
                                    {m.title}
                                </h3>

                                <div
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.58rem",
                                        letterSpacing: "0.18em",
                                        color: "var(--text-secondary)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    {m.driver}
                                </div>

                                <p
                                    style={{
                                        fontFamily: "var(--font-body)",
                                        fontSize: "1rem",
                                        lineHeight: 1.65,
                                        color: "var(--text-secondary)",
                                        margin: "0.25rem 0 0",
                                        maxWidth: "62ch",
                                        textWrap: "pretty",
                                        fontWeight: 300,
                                    }}
                                >
                                    {m.body}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
