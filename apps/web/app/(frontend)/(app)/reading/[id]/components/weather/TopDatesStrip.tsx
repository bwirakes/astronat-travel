"use client";

import type { GWTravelWindow } from "@/app/lib/geodetic-weather-types";

interface Props {
    windows: GWTravelWindow[];
}

const RANK_ACCENT = ["var(--color-spiced-life)", "var(--gold)", "var(--color-y2k-blue)"];

export function TopDatesStrip({ windows }: Props) {
    if (!windows || windows.length === 0) {
        return (
            <div
                style={{
                    padding: "1rem 1.25rem",
                    border: "1px dashed var(--surface-border)",
                    borderRadius: "var(--radius-md)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    fontStyle: "italic",
                    color: "var(--text-tertiary)",
                    textAlign: "center",
                }}
            >
                Travel windows appear once the AI interpretation runs. Regenerate this reading to populate them.
            </div>
        );
    }

    return (
        <section
            aria-label="Top dates for this window"
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.25em",
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                Top dates
            </div>

            <div
                className="grid grid-cols-1 md:grid-cols-3"
                style={{ gap: "0.75rem" }}
            >
                {windows.slice(0, 3).map((w, i) => {
                    const accent = RANK_ACCENT[i] ?? RANK_ACCENT[0];
                    return (
                        <a
                            key={i}
                            href={`#window-${i}`}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                                padding: "0.85rem 1rem",
                                background: "var(--surface)",
                                border: "1px solid var(--surface-border)",
                                borderLeft: `4px solid ${accent}`,
                                borderRadius: "var(--radius-sm)",
                                textDecoration: "none",
                                color: "var(--text-primary)",
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.55rem",
                                    letterSpacing: "0.2em",
                                    color: accent,
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                }}
                            >
                                {String(i + 1).padStart(2, "0")} · {w.rank}
                            </span>
                            <span
                                style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {w.dates}
                            </span>
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.55rem",
                                    letterSpacing: "0.15em",
                                    color: "var(--text-tertiary)",
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                }}
                            >
                                {w.nights} nights · score {Math.round(w.score)}
                            </span>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}
