"use client";

import { useState } from "react";
import {
    TIER_PALETTE,
    LAYER_BODY,
    formatAngle,
    type GeodeticWeatherResult,
    type GWCityForecast,
} from "@/app/lib/geodetic-weather-types";
import { EventPullQuoteCard } from "./EventPullQuoteCard";
import { BucketSparkPanel } from "./BucketSparkPanel";
import { TierPill } from "./TierPill";

interface Props {
    city: GWCityForecast;
    dayIndex: number;
    goalFilter?: string | null;
    filterFn?: (layer: string) => boolean;
}

const TONE_SEQUENCE: Array<"eggshell" | "charcoal" | "black"> = ["eggshell", "charcoal", "black"];

export function DayDeepDive({ city, dayIndex, filterFn }: Props) {
    const day = city.days[dayIndex];
    const [hoverLayer, setHoverLayer] = useState<string | null>(null);
    if (!day) return null;

    const dt = new Date(day.dateUtc);
    const palette = TIER_PALETTE[day.severity];
    const displayEvents = filterFn ? day.events.filter((e) => filterFn(e.layer)) : day.events;
    const events = displayEvents.length > 0 ? displayEvents : day.events;

    return (
        <section id="day-deep-dive" style={{ scrollMarginTop: "1.5rem" }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                }}
            >
                <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: palette.accent, textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
                        The anchor day · {city.label.split(",")[0]}
                    </div>
                    <h3
                        style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                            lineHeight: 1.05,
                            margin: 0,
                            color: "var(--text-primary)",
                        }}
                    >
                        {dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })}
                    </h3>
                </div>
                <TierPill tier={day.severity} size="lg" />
            </header>

            <div
                className="grid grid-cols-1 md:grid-cols-[3fr_2fr]"
                style={{ display: "grid", gap: "clamp(1rem, 2vw, 2rem)", alignItems: "start" }}
            >
                {/* Left — event stack */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
                    {events.map((e, i) => {
                        const tone = TONE_SEQUENCE[i % TONE_SEQUENCE.length];
                        return (
                            <div
                                key={`${e.layer}-${i}`}
                                onMouseEnter={() => setHoverLayer(String(e.layer))}
                                onMouseLeave={() => setHoverLayer(null)}
                            >
                                <EventPullQuoteCard event={e} tone={tone} size={i === 0 ? "lg" : "md"} body={LAYER_BODY[e.layer]} />
                            </div>
                        );
                    })}
                    {events.length === 0 && (
                        <div
                            style={{
                                padding: "1.5rem",
                                border: "1px dashed var(--surface-border)",
                                color: "var(--text-tertiary)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.7rem",
                                letterSpacing: "0.2em",
                                textAlign: "center",
                                textTransform: "uppercase",
                            }}
                        >
                            No events in the filtered layer set.
                        </div>
                    )}
                </div>

                {/* Right — bucket spark panel + modifiers + fixed angle mini-map */}
                <aside
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                        padding: "1.5rem",
                        background: "var(--surface)",
                        border: "1px solid var(--surface-border)",
                        clipPath: "var(--cut-md)",
                        minWidth: 0,
                    }}
                >
                    <BucketSparkPanel breakdown={day.breakdown} highlightLayer={hoverLayer ?? undefined} />

                    {day.severityModifiers.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--color-spiced-life)", fontWeight: 700, textTransform: "uppercase" }}>
                                Modifiers
                            </div>
                            {day.severityModifiers.map((m, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "0.6rem 0.8rem",
                                        background: "var(--color-charcoal)",
                                        color: "var(--color-eggshell)",
                                        clipPath: "var(--cut-sm)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.62rem",
                                        letterSpacing: "0.15em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    TIER {m.tierShift > 0 ? "UP" : "DOWN"} ×{Math.abs(m.tierShift)} — {m.label}
                                </div>
                            ))}
                        </div>
                    )}

                    <FixedAnglesMiniMap city={city} activeFromEvents={events.some((e) => e.layer === "paran")} />
                </aside>
            </div>
        </section>
    );
}

function FixedAnglesMiniMap({ city, activeFromEvents }: { city: GWCityForecast; activeFromEvents: boolean }) {
    const { mc, asc } = city.fixedAngles;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--color-y2k-blue)", fontWeight: 700, textTransform: "uppercase" }}>
                Fixed lines
            </div>
            <svg viewBox="0 0 200 100" style={{ width: "100%", height: "auto", background: "var(--bg)" }} aria-hidden>
                {/* Latitude band if paran active */}
                {activeFromEvents && (
                    <rect x="0" y="46" width="200" height="8" fill="var(--color-spiced-life)" opacity="0.4" />
                )}
                {/* Meridian lines (dotted blue) — stylized around a centered dot */}
                <g stroke="var(--color-y2k-blue)" strokeDasharray="2 3" fill="none" opacity="0.8">
                    <line x1="100" y1="0" x2="100" y2="100" />
                    <line x1="50" y1="0" x2="50" y2="100" />
                    <line x1="150" y1="0" x2="150" y2="100" />
                    <line x1="0" y1="50" x2="200" y2="50" />
                </g>
                {/* City marker */}
                <circle cx="100" cy="50" r="3.5" fill="var(--color-spiced-life)" stroke="var(--color-eggshell)" strokeWidth="1" />
            </svg>
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.55rem",
                    letterSpacing: "0.12em",
                    color: "var(--text-tertiary)",
                    lineHeight: 1.4,
                    textTransform: "uppercase",
                }}
            >
                MC {formatAngle(mc)} · ASC {formatAngle(asc)}
                <br />
                Four permanent lines. Today's sky is lighting them up.
            </div>
        </div>
    );
}
