"use client";

import type { GeodeticWeatherResult } from "@/app/lib/geodetic-weather-types";
import {
    aggregateRisk,
    RISK_LABELS,
    RISK_GLOSS,
    type RiskChannel,
} from "@/app/lib/geodetic/risk-profiles";

interface Props {
    days: GeodeticWeatherResult[];
    /** If the intake selected a channel, emphasise that row first. */
    goalFilter?: string | null;
}

const GOAL_TO_CHANNEL: Record<string, RiskChannel> = {
    seismic: "seismic",
    quakes: "seismic",
    hydro: "hydro",
    floods: "hydro",
    atmospheric: "atmospheric",
    civil: "civil",
    fires: "fire",
    fire: "fire",
};

/**
 * Turns the computed events into a risk-profile readout, channel by channel.
 * Deterministic. Drives section D of the mundane report.
 */
export function RiskMatrix({ days, goalFilter }: Props) {
    const allEvents = days.flatMap((d) => d.events ?? []);
    const risk = aggregateRisk(
        allEvents.map((e) => ({
            layer: e.layer,
            planets: e.planets ?? [],
            direction: e.direction,
        })),
    );

    const ordered: RiskChannel[] = ["seismic", "hydro", "atmospheric", "civil", "fire"];
    const preferred = goalFilter ? GOAL_TO_CHANNEL[goalFilter] : null;
    if (preferred) {
        ordered.sort((a, b) => (a === preferred ? -1 : b === preferred ? 1 : 0));
    }

    return (
        <section
            aria-label="Risk matrix"
            style={{
                padding: "clamp(2.5rem, 5vw, 4rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1.25rem, 2.5vw, 2rem)",
            }}
        >
            <div
                className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]"
                style={{ gap: "clamp(1.25rem, 3vw, 2.5rem)", alignItems: "start" }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.62rem",
                            letterSpacing: "0.28em",
                            color: "var(--gold)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginBottom: "0.6rem",
                        }}
                    >
                        D · What this looks like on the ground
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                            margin: 0,
                            color: "var(--text-primary)",
                            textWrap: "balance",
                        }}
                    >
                        Likely physical signatures.
                    </h2>
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "52ch",
                        fontWeight: 300,
                    }}
                >
                    Each channel shows the worst-case severity across the window
                    based on the active planetary signatures. Rule-derived from
                    the geodetic weather matrix, not AI.
                </p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {ordered.map((ch) => {
                    const value = risk[ch];
                    const isHighlighted = preferred === ch;
                    return (
                        <li
                            key={ch}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(180px, 1fr) minmax(140px, 2fr) auto",
                                gap: "clamp(0.75rem, 2vw, 1.5rem)",
                                alignItems: "center",
                                padding: "1rem 0",
                                borderTop: "1px solid var(--surface-border)",
                                background: isHighlighted ? "color-mix(in srgb, var(--gold) 8%, transparent)" : "transparent",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                                        lineHeight: 1.2,
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    {RISK_LABELS[ch]}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "var(--font-body)",
                                        fontSize: "0.85rem",
                                        lineHeight: 1.45,
                                        color: "var(--text-secondary)",
                                        marginTop: "0.2rem",
                                        fontWeight: 300,
                                    }}
                                >
                                    {RISK_GLOSS[ch]}
                                </div>
                            </div>
                            {/* bar */}
                            <div style={{ display: "flex", gap: "3px" }}>
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            height: 10,
                                            background: i < value ? barColor(value) : "var(--surface-border)",
                                            borderRadius: 1,
                                            opacity: i < value ? 1 : 0.35,
                                        }}
                                    />
                                ))}
                            </div>
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.58rem",
                                    letterSpacing: "0.22em",
                                    color: barColor(value),
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                }}
                            >
                                {["none", "low", "mod", "high", "sev", "ext"][value]}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function barColor(value: number): string {
    if (value >= 4) return "#7a1b1b";
    if (value >= 3) return "var(--color-spiced-life)";
    if (value >= 2) return "var(--gold)";
    if (value >= 1) return "var(--color-y2k-blue)";
    return "var(--text-tertiary)";
}
