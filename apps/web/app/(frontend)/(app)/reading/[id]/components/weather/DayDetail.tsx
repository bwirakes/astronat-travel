"use client";

import { useState } from "react";
import {
    BUCKET_COPY,
    LAYER_LABEL,
    PLANET_GLYPH,
    dayCardCopy,
    tierToBucket,
    type GeodeticWeatherResult,
    type GWEvent,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    day: GeodeticWeatherResult;
    cityLabel: string;
}

export function DayDetail({ day, cityLabel }: Props) {
    const [showDetails, setShowDetails] = useState(false);
    const bucket = tierToBucket(day.severity);
    const copy = BUCKET_COPY[bucket];
    const dt = new Date(day.dateUtc);
    const { driver, impact } = dayCardCopy(day);

    const weekday = dt.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const dayNum = dt.getUTCDate();
    const monthLong = dt.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

    return (
        <section
            id="day-detail"
            style={{
                scrollMarginTop: "1rem",
                position: "relative",
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--surface-border)",
                borderLeft: `4px solid ${copy.accent}`,
                borderRadius: "var(--radius-md)",
                padding: "clamp(1.5rem, 2.5vw, 2rem)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
            }}
        >
            {/* Kicker */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.25em",
                        color: "var(--color-y2k-blue)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                    }}
                >
                    03 · {cityLabel.split(",")[0]} · selected day
                </div>
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.2em",
                        padding: "0.3rem 0.7rem",
                        border: `1px solid ${copy.accent}`,
                        color: copy.accent,
                        textTransform: "uppercase",
                        fontWeight: 800,
                        borderRadius: "999px",
                    }}
                >
                    {copy.label}
                </span>
            </div>

            {/* Section header — the only stylized serif in this block */}
            <h2
                style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.025em",
                    margin: 0,
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                }}
            >
                Why this day
            </h2>

            {/* Date + driver + impact — clean grotesque data */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <div
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "0.01em",
                    }}
                >
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{weekday}, {monthLong} {dayNum}</span>
                </div>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.2em",
                        color: copy.accent,
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    {driver}
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.55,
                        margin: 0,
                        color: "var(--text-primary)",
                        maxWidth: "44ch",
                    }}
                >
                    {impact}
                </p>
            </div>

            {/* Progressive disclosure — tight-orb astrology readout.
                Filters to events with orb <= 1° (the predictive cutoff the
                Geodetic 101 case studies use). If no orbs fall under the
                threshold, we still show the top 4 by |severity|. */}
            {day.events.length > 0 && (() => {
                const tight = day.events.filter((e) => typeof e.orb === "number" && (e.orb ?? 999) <= 1);
                const rows = (tight.length > 0
                    ? tight
                    : [...day.events].sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity))
                ).slice(0, 6);

                return (
                    <div>
                        <button
                            onClick={() => setShowDetails((v) => !v)}
                            style={{
                                background: "transparent",
                                border: `1px solid var(--surface-border)`,
                                borderRadius: "var(--radius-xs)",
                                padding: "0.45rem 0.8rem",
                                cursor: "pointer",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.58rem",
                                letterSpacing: "0.2em",
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}
                        >
                            {showDetails
                                ? "Hide orb readout ↑"
                                : tight.length > 0
                                ? `Show ${tight.length} tight hit${tight.length === 1 ? "" : "s"} (< 1°) ↓`
                                : `Show top ${rows.length} transits ↓`}
                        </button>

                        {showDetails && (
                            <div
                                style={{
                                    marginTop: "0.85rem",
                                    padding: "1rem 1.1rem",
                                    background: "var(--bg-raised)",
                                    border: "1px solid var(--surface-border)",
                                    borderRadius: "var(--radius-xs)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.35rem",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "baseline",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.55rem",
                                            letterSpacing: "0.22em",
                                            color: "var(--text-tertiary)",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Orb readout
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.5rem",
                                            letterSpacing: "0.15em",
                                            color: "var(--text-tertiary)",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {tight.length > 0 ? "sub-1°" : "top by severity"}
                                    </span>
                                </div>
                                {rows.map((e, i) => (
                                    <OrbRow
                                        key={`${e.layer}-${i}`}
                                        event={e}
                                        isLast={i === rows.length - 1}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </section>
    );
}

/* ─── OrbRow — Hawaii-style tight-orb readout line ──────────────────────
   Format: [glyph1] [⚷ glyph2 | layer-tag] [arc-min orb] [aspect/layer]
   Mono throughout; sign driven by event.direction (malefic → -, else +).
   ──────────────────────────────────────────────────────────────────── */

function OrbRow({ event, isLast }: { event: GWEvent; isLast: boolean }) {
    const planet1 = event.planets[0];
    const planet2 = event.planets[1];
    const glyph1 = planet1 ? PLANET_GLYPH[planet1] ?? "✦" : "✦";
    const glyph2 = planet2 ? PLANET_GLYPH[planet2] ?? "" : "";

    // Arc-minute formatted orb, signed. If no orb, blank.
    const hasOrb = typeof event.orb === "number";
    const orbSign = event.direction === "malefic" ? "-" : event.direction === "benefic" ? "+" : "";
    const deg = hasOrb ? Math.floor(event.orb!) : 0;
    const min = hasOrb ? Math.round((event.orb! - deg) * 60) : 0;
    const orbStr = hasOrb ? `${orbSign}${deg}°${String(min).padStart(2, "0")}'` : "—";
    const orbColor =
        event.direction === "malefic"
            ? "var(--color-spiced-life)"
            : event.direction === "benefic"
            ? "var(--sage)"
            : "var(--gold)";

    const layerTag = LAYER_LABEL[event.layer] ?? String(event.layer);

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(80px, max-content) 1fr auto",
                gap: "0.85rem",
                alignItems: "center",
                paddingBottom: isLast ? 0 : "0.5rem",
                borderBottom: isLast ? "none" : "1px solid var(--surface-border)",
            }}
        >
            {/* Glyph pair */}
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontFamily: "var(--font-primary)",
                    fontSize: "1.35rem",
                    lineHeight: 1,
                    color: "var(--text-primary)",
                }}
            >
                <span style={{ color: orbColor }}>{glyph1}</span>
                {glyph2 && (
                    <>
                        <span
                            aria-hidden
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.65rem",
                                color: "var(--text-tertiary)",
                                letterSpacing: "0.1em",
                            }}
                        >
                            ⚷
                        </span>
                        <span style={{ color: orbColor }}>{glyph2}</span>
                    </>
                )}
            </div>

            {/* Layer tag */}
            <span
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.58rem",
                    letterSpacing: "0.18em",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                title={event.label}
            >
                {layerTag}
            </span>

            {/* Orb */}
            <span
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    color: orbColor,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                }}
            >
                {orbStr}
            </span>
        </div>
    );
}
