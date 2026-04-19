"use client";

import { TIER_PALETTE, LAYER_LABEL, planetTailwindBg, planetGlyph, type GeodeticWeatherResult, type Tier } from "@/app/lib/geodetic-weather-types";
import { TierPill } from "./TierPill";

interface Props {
    days: GeodeticWeatherResult[];
    onExpand: (dayIndex: number) => void;
    /** Mapping from day to its index in the full window — needed for expand */
    indexMap: number[];
}

const TONE_SEQUENCE: Array<"eggshell" | "charcoal" | "black"> = ["eggshell", "charcoal", "black"];

const TONE_STYLES: Record<"eggshell" | "charcoal" | "black", { bg: string; text: string; accent: string; subtle: string }> = {
    eggshell: { bg: "var(--color-eggshell)", text: "var(--color-charcoal)", accent: "var(--color-y2k-blue)", subtle: "rgba(27,27,27,0.65)" },
    charcoal: { bg: "var(--color-charcoal)", text: "var(--color-eggshell)", accent: "var(--color-acqua)", subtle: "rgba(248,245,236,0.65)" },
    black: { bg: "var(--color-black)", text: "var(--color-eggshell)", accent: "var(--color-spiced-life)", subtle: "rgba(248,245,236,0.55)" },
};

/** Build a short plain-English headline from the day's top event. */
function headlineForDay(d: GeodeticWeatherResult): string {
    const top = d.events[0];
    if (!top) return "A quiet day by comparison.";
    const p = top.planets[0] ?? "Sky";
    switch (top.layer) {
        case "angle-transit":
            return `${p} meets your city's fixed axis.`;
        case "station":
            return `${p} stalls on your city's ${/MC/i.test(top.label) ? "top" : /IC/i.test(top.label) ? "root" : "horizon"} line.`;
        case "late-degree":
            return `${p} finishes its sign in the anaretic zone.`;
        case "eclipse":
            return `Eclipse aftershock lights the longitude.`;
        case "paran":
            return `${top.planets.join(" / ")} crossing at your latitude.`;
        case "world-point":
            return `${p} crosses a world-axis degree.`;
        case "configuration":
            return `A geometric pattern forms overhead.`;
        default:
            return top.label;
    }
}

function bodyForDay(d: GeodeticWeatherResult, tier: Tier): string {
    const top = d.events[0];
    if (!top) return "A flat day in a noisier window. Useful as a reset, not as a marker.";
    const layerKey = String(top.layer);
    const body = {
        "angle-transit": `A planet aligning with this city's permanent horizon or meridian. When a heavy planet touches one of the fixed lines this longitude carries, the region under it sits in a pressure system — figuratively, and often literally.`,
        "station": `The planet is parking — losing its forward momentum on a retrograde station. When movement stops on an axis, the energy compounds there.`,
        "late-degree": `The planet is grinding through the 26–29° anaretic zone. Forced-finish weather — things that were lingering come to a head.`,
        "eclipse": `A recent eclipse is still ringing at this longitude. Eclipses seed the ground and the ground keeps echoing for weeks.`,
        "paran": `Two planets cross a horizon line together at this latitude band — a doubled signature unique to this strip of earth.`,
        "world-point": `A slow planet at 0° of a cardinal sign. This is planetary in scope; the day reads at a higher register than usual.`,
        "configuration": `The sky has locked into a geometric pattern, and this location is catching one of the anchors.`,
    }[layerKey] ?? `A ${tier.toLowerCase()} day with ${d.events.length} active layer${d.events.length === 1 ? "" : "s"}.`;
    return body;
}

export function DatesToWatchGrid({ days, onExpand, indexMap }: Props) {
    if (days.length === 0) return null;

    return (
        <section style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <h3
                    style={{
                        fontFamily: "var(--font-secondary)",
                        fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                        lineHeight: 1,
                        margin: 0,
                        color: "var(--text-primary)",
                    }}
                >
                    Dates to watch
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
                    {days.length} peak severity {days.length === 1 ? "day" : "days"}
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1rem",
                }}
            >
                {days.map((d, i) => {
                    const toneKey = TONE_SEQUENCE[i % TONE_SEQUENCE.length];
                    const tone = TONE_STYLES[toneKey];
                    const tier = d.severity;
                    const palette = TIER_PALETTE[tier];
                    const dt = new Date(d.dateUtc);
                    const dow = dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase();
                    const mon = dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
                    const dayNum = dt.getUTCDate();
                    const planetsShown = Array.from(new Set(d.events.flatMap((e) => e.planets))).slice(0, 5);
                    const headline = headlineForDay(d);
                    const body = bodyForDay(d, tier);
                    const topLayerLabel = d.events[0] ? LAYER_LABEL[d.events[0].layer] ?? String(d.events[0].layer).toUpperCase() : "QUIET DAY";

                    return (
                        <article
                            key={d.dateUtc}
                            style={{
                                background: tone.bg,
                                color: tone.text,
                                padding: "1.5rem 1.75rem",
                                clipPath: "var(--cut-lg)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                position: "relative",
                                overflow: "hidden",
                                minHeight: "280px",
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    fontFamily: "var(--font-display-alt-2)",
                                    fontSize: "clamp(6rem, 12vw, 10rem)",
                                    color: tone.accent,
                                    opacity: 0.12,
                                    top: "30%",
                                    right: "-8%",
                                    pointerEvents: "none",
                                    lineHeight: 0.6,
                                }}
                            >
                                watch
                            </span>

                            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", position: "relative", zIndex: 1 }}>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.22em", color: tone.accent, fontWeight: 700, textTransform: "uppercase" }}>
                                    {dow} · {mon} {dayNum}
                                </div>
                                <TierPill tier={tier} size="sm" />
                            </header>

                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: tone.subtle, fontWeight: 700, textTransform: "uppercase", position: "relative", zIndex: 1 }}>
                                {topLayerLabel}
                            </div>

                            <h4 style={{ fontFamily: "var(--font-secondary)", fontSize: "clamp(1.3rem, 2.2vw, 1.85rem)", lineHeight: 1.1, color: tone.text, margin: 0, position: "relative", zIndex: 1 }}>
                                {headline}
                            </h4>

                            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", lineHeight: 1.55, color: tone.subtle, margin: 0, position: "relative", zIndex: 1 }}>
                                {body}
                            </p>

                            <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", gap: "0.75rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                                    {planetsShown.map((p) => (
                                        <span
                                            key={p}
                                            className={planetTailwindBg(p)}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.25rem",
                                                padding: "0.22rem 0.5rem",
                                                borderRadius: "999px",
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "0.55rem",
                                                letterSpacing: "0.1em",
                                                color: "var(--color-eggshell)",
                                                textTransform: "uppercase",
                                                fontWeight: 700,
                                            }}
                                        >
                                            <span style={{ fontFamily: "serif", fontSize: "0.8rem" }}>{planetGlyph(p)}</span>
                                            {p}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => onExpand(indexMap[i])}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        color: tone.accent,
                                        fontWeight: 700,
                                        padding: "0.25rem 0",
                                    }}
                                >
                                    expand →
                                </button>
                            </footer>

                            {/* Decorative dot using tier accent — the tier is a physical hint even in a monochrome card */}
                            <span
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    top: "1.25rem",
                                    right: "1.25rem",
                                    width: "6px",
                                    height: "6px",
                                    background: palette.accent,
                                    borderRadius: "50%",
                                    display: "none",
                                }}
                            />
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
