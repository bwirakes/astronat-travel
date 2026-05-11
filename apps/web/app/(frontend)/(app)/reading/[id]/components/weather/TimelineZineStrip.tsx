"use client";

import { useState } from "react";
import {
    TIER_PALETTE,
    planetGlyph,
    type GeodeticWeatherResult,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    days: GeodeticWeatherResult[];
    onSelect: (index: number) => void;
    selectedIndex?: number;
}

export function TimelineZineStrip({ days, onSelect, selectedIndex }: Props) {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    return (
        <section style={{ position: "relative" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                }}
            >
                <h3
                    style={{
                        fontFamily: "var(--font-secondary)",
                        fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                        lineHeight: 1,
                        margin: 0,
                        color: "var(--text-primary)",
                    }}
                >
                    The window, day by day
                </h3>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.22em",
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                    }}
                >
                    Tap or scroll ·  {days.length} daily snapshots
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "2px",
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    paddingBottom: "0.5rem",
                    WebkitOverflowScrolling: "touch",
                }}
                role="list"
            >
                {days.map((d, i) => {
                    const dt = new Date(d.dateUtc);
                    const palette = TIER_PALETTE[d.severity];
                    const topEvents = d.events.slice(0, 3);
                    const isEclipse = d.events.some((e) => e.layer === "eclipse");
                    const isStation = d.events.some((e) => e.layer === "station");
                    const isWorldPoint = d.events.some((e) => e.layer === "world-point");
                    const dateNum = dt.getUTCDate();
                    const showMonthKicker = i === 0 || dateNum === 1;
                    const monthLabel = dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
                    const isActive = selectedIndex === i || hoverIdx === i;

                    return (
                        <button
                            key={d.dateUtc}
                            role="listitem"
                            onClick={() => onSelect(i)}
                            onMouseEnter={() => setHoverIdx(i)}
                            onMouseLeave={() => setHoverIdx(null)}
                            onFocus={() => setHoverIdx(i)}
                            onBlur={() => setHoverIdx(null)}
                            aria-label={`${dt.toDateString()} — ${d.severity}`}
                            style={{
                                flex: "0 0 auto",
                                minWidth: "2.2rem",
                                width: `calc((100% - ${(days.length - 1) * 2}px) / ${days.length})`,
                                maxWidth: "4rem",
                                height: "clamp(140px, 22vw, 200px)",
                                background: palette.bg,
                                color: palette.text,
                                border: "none",
                                outline: isActive ? `2px solid ${palette.accent}` : "none",
                                outlineOffset: "-2px",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0.4rem 0.2rem 0.3rem",
                                scrollSnapAlign: "start",
                                position: "relative",
                                transition: "filter 0.15s ease, transform 0.15s ease",
                                filter: isActive ? "brightness(1.08)" : "none",
                                transform: isActive ? "translateY(-2px)" : "none",
                            }}
                        >
                            {/* Special marker row */}
                            <div
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.7rem",
                                    lineHeight: 1,
                                    color: palette.accent,
                                    minHeight: "0.8rem",
                                }}
                                aria-hidden
                            >
                                {isEclipse ? (
                                    <svg width="10" height="10" viewBox="0 0 10 10">
                                        <circle cx="5" cy="5" r="4" fill={palette.accent} />
                                        <circle cx="3.2" cy="5" r="2.8" fill={palette.bg} />
                                    </svg>
                                ) : isStation ? (
                                    <span style={{ fontWeight: 800 }}>℞</span>
                                ) : isWorldPoint ? (
                                    <svg width="10" height="10" viewBox="0 0 10 10">
                                        <polygon points="1,2 9,2 5,9" fill={palette.accent} />
                                    </svg>
                                ) : null}
                            </div>

                            {/* Planet glyph stack */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "0.15rem",
                                    flex: 1,
                                    justifyContent: "center",
                                }}
                                aria-hidden
                            >
                                {topEvents.map((e, ei) => {
                                    const p = e.planets[0];
                                    return (
                                        <span
                                            key={`${d.dateUtc}-${ei}`}
                                            style={{
                                                fontFamily: "serif",
                                                fontSize: "clamp(0.85rem, 1.2vw, 1.05rem)",
                                                lineHeight: 1,
                                                color: palette.text,
                                                opacity: 1 - ei * 0.25,
                                            }}
                                        >
                                            {p ? planetGlyph(p) : "·"}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Date number + month kicker */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" }}>
                                {showMonthKicker && (
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.5rem",
                                            letterSpacing: "0.15em",
                                            color: palette.accent,
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {monthLabel}
                                    </span>
                                )}
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: palette.text,
                                    }}
                                >
                                    {dateNum}
                                </span>
                            </div>

                            {/* Tooltip */}
                            {isActive && (
                                <div
                                    role="tooltip"
                                    style={{
                                        position: "absolute",
                                        bottom: "calc(100% + 6px)",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "var(--color-charcoal)",
                                        color: "var(--color-eggshell)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.1em",
                                        padding: "0.4rem 0.6rem",
                                        whiteSpace: "nowrap",
                                        clipPath: "var(--cut-sm)",
                                        zIndex: 20,
                                        pointerEvents: "none",
                                    }}
                                >
                                    {topEvents[0]?.label ?? d.severity}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
