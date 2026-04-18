"use client";

import { useState } from "react";
import type { GeodeticWeatherResult } from "@/app/lib/geodetic-weather-types";

interface Props {
    days: GeodeticWeatherResult[];
    startDate: string;
}

const TIER_COLOR: Record<string, string> = {
    Calm: "var(--sage)",
    Unsettled: "var(--color-y2k-blue)",
    Turbulent: "var(--gold)",
    Severe: "var(--color-spiced-life)",
    Extreme: "#7a1b1b",
};

const LAYER_GLYPH: Record<string, string> = {
    "angle-transit": "✚",
    paran: "÷",
    station: "◉",
    eclipse: "●",
    "world-point": "◆",
    "late-degree": "○",
    configuration: "▲",
    ingress: "→",
    "severity-modifier": "!",
};

function fmtDay(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

function topLayer(day: GeodeticWeatherResult): string {
    if (!day.events || day.events.length === 0) return "";
    const sorted = [...day.events].sort(
        (a, b) => Math.abs(b.severity ?? 0) - Math.abs(a.severity ?? 0),
    );
    return sorted[0].layer ?? "";
}

/**
 * A dense horizontal heatmap of tier × day. One column per day, coloured
 * by tier. Top glyph = top event layer. Tap/hover → pops a detail card.
 *
 * This is the deterministic core of the mundane reading: zero AI in here.
 */
export function PressureTimeline({ days }: Props) {
    const [selected, setSelected] = useState<number | null>(null);
    const day = selected != null ? days[selected] : null;

    return (
        <section aria-label="Pressure timeline" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                B · Pressure gradient
            </div>

            <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
                <div
                    role="list"
                    style={{
                        display: "grid",
                        gridAutoFlow: "column",
                        gridAutoColumns: "minmax(24px, 1fr)",
                        gap: "3px",
                        minWidth: Math.max(400, days.length * 26),
                    }}
                >
                    {days.map((d, i) => {
                        const colour = TIER_COLOR[d.severity] ?? "var(--surface-border)";
                        const glyph = LAYER_GLYPH[topLayer(d)] ?? "";
                        const isSelected = i === selected;
                        return (
                            <button
                                key={d.dateUtc}
                                onClick={() => setSelected(isSelected ? null : i)}
                                aria-label={`${fmtDay(d.dateUtc)} — ${d.severity}`}
                                style={{
                                    height: 64,
                                    background: colour,
                                    border: isSelected ? "2px solid var(--text-primary)" : "1px solid transparent",
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "center",
                                    paddingBottom: "0.25rem",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.8rem",
                                    color: "var(--color-eggshell)",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                                    transition: "border 0.15s ease",
                                }}
                            >
                                {glyph}
                            </button>
                        );
                    })}
                </div>

                <div
                    style={{
                        display: "grid",
                        gridAutoFlow: "column",
                        gridAutoColumns: "minmax(24px, 1fr)",
                        gap: "3px",
                        minWidth: Math.max(400, days.length * 26),
                        marginTop: "0.35rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.48rem",
                        letterSpacing: "0.08em",
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                    }}
                >
                    {days.map((d, i) => (
                        <span
                            key={d.dateUtc}
                            style={{
                                textAlign: "center",
                                visibility: i % Math.max(1, Math.floor(days.length / 10)) === 0 ? "visible" : "hidden",
                            }}
                        >
                            {fmtDay(d.dateUtc).replace(" ", "\n")}
                        </span>
                    ))}
                </div>
            </div>

            {/* Detail card for selected day */}
            {day && (
                <div
                    style={{
                        padding: "1rem 1.25rem",
                        background: "var(--surface)",
                        border: "1px solid var(--surface-border)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: "1rem",
                        }}
                    >
                        <div style={{ fontFamily: "var(--font-primary)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
                            {fmtDay(day.dateUtc)}
                        </div>
                        <div
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.58rem",
                                letterSpacing: "0.22em",
                                color: TIER_COLOR[day.severity] ?? "var(--text-tertiary)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}
                        >
                            {day.severity}
                        </div>
                    </div>
                    {day.events.length === 0 ? (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0 }}>
                            No active events.
                        </p>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            {day.events.map((e, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "24px 1fr auto",
                                        gap: "0.6rem",
                                        alignItems: "baseline",
                                        paddingTop: "0.35rem",
                                        borderTop: i === 0 ? "none" : "1px dashed var(--surface-border)",
                                    }}
                                >
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-tertiary)" }}>
                                        {LAYER_GLYPH[e.layer] ?? "·"}
                                    </span>
                                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                        {e.label}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.55rem",
                                            letterSpacing: "0.18em",
                                            color:
                                                e.direction === "malefic"
                                                    ? "var(--color-spiced-life)"
                                                    : e.direction === "benefic"
                                                    ? "var(--sage)"
                                                    : "var(--text-tertiary)",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {e.layer}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
