"use client";

import type { GWTravelWindow } from "@/app/lib/geodetic-weather-types";

interface Props {
    windows: GWTravelWindow[];
    cityPrimary: string;
}

const RANK_ACCENT = ["var(--color-spiced-life)", "var(--gold)", "var(--color-y2k-blue)"];

export function TravelWindowsSection({ windows, cityPrimary }: Props) {
    if (!windows || windows.length === 0) return null;

    return (
        <section
            aria-label="Travel Windows"
            style={{
                padding: "clamp(2.5rem, 5vw, 4.5rem) 0",
                borderTop: "1px solid var(--surface-border)",
            }}
        >
            <header style={{ marginBottom: "clamp(1.5rem, 3vw, 2.25rem)", maxWidth: "820px" }}>
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
                    01 · When to book
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
                    Three windows{" "}
                    <span
                        style={{
                            fontFamily: "var(--font-display-alt-2)",
                            color: "var(--color-spiced-life)",
                            textTransform: "lowercase",
                            letterSpacing: 0,
                            fontSize: "1em",
                        }}
                    >
                        open
                    </span>
                </h2>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "62ch",
                        textWrap: "pretty",
                    }}
                >
                    Inside this forecast, three stretches stand out in {cityPrimary}. Each has a different flavour. Pick the one that fits your calendar.
                </p>
            </header>

            <ol
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {windows.map((w, i) => {
                    const accent = RANK_ACCENT[i] ?? RANK_ACCENT[0];
                    return (
                        <li
                            key={i}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "80px 1fr auto",
                                gap: "clamp(1rem, 3vw, 2.5rem)",
                                padding: "clamp(1.25rem, 2.5vw, 2rem) 0",
                                borderTop: "1px solid var(--surface-border)",
                                alignItems: "start",
                            }}
                        >
                            {/* Left — numeric index + rank kicker */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                <span
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "2.75rem",
                                        lineHeight: 0.9,
                                        color: accent,
                                        letterSpacing: "-0.02em",
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
                                    Window {String(i + 1).padStart(2, "0")} / {windows.length}
                                </span>
                            </div>

                            {/* Middle — rank name + dates + note */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0 }}>
                                <h3
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                                        lineHeight: 1.05,
                                        letterSpacing: "-0.015em",
                                        margin: 0,
                                        color: "var(--text-primary)",
                                        fontWeight: 400,
                                        textWrap: "balance",
                                    }}
                                >
                                    {w.rank}
                                </h3>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.8rem",
                                        flexWrap: "wrap",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.62rem",
                                        letterSpacing: "0.18em",
                                        color: accent,
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    <span>{w.dates}</span>
                                    <span style={{ opacity: 0.5 }}>·</span>
                                    <span>{w.nights} nights</span>
                                </div>
                                <p
                                    style={{
                                        fontFamily: "var(--font-body)",
                                        fontSize: "0.98rem",
                                        lineHeight: 1.55,
                                        color: "var(--text-secondary)",
                                        margin: "0.2rem 0 0",
                                        maxWidth: "58ch",
                                        textWrap: "pretty",
                                        fontWeight: 300,
                                    }}
                                >
                                    {w.note}
                                </p>
                            </div>

                            {/* Right — score */}
                            <div style={{ textAlign: "right", minWidth: "4.5rem" }}>
                                <div
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "2rem",
                                        lineHeight: 1,
                                        color: accent,
                                        letterSpacing: "-0.02em",
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {Math.round(w.score)}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.52rem",
                                        letterSpacing: "0.2em",
                                        color: "var(--text-tertiary)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    score
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
