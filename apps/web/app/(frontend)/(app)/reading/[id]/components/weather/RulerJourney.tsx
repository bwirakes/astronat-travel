"use client";

import type { GWPersonalLens } from "@/app/lib/geodetic-weather-types";

interface Props {
    lens: GWPersonalLens;
    cityPrimary: string;
    /** AI-written Chain sentence. Already validated by the prompt. */
    rulerJourneyChain?: string;
}

const PLANET_GLYPH: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

const SIGN_GLYPH: Record<string, string> = {
    Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
    Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
    Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Per Geodetic_101.pdf p.3: "Chart ruler determines everything."
 * This section visualises the relocated delta: the ruling planet moves
 * from its natal house to a new relocated house at the destination.
 *
 * Deterministic layout: simple side-by-side text blocks + a minimal SVG
 * connector. The Chain sentence below is the one AI-written line, already
 * validated for real anchor nouns in each → segment.
 */
export function RulerJourney({ lens, cityPrimary, rulerJourneyChain }: Props) {
    const ruler = lens.chartRulerPlanet;
    const rulerGlyph = PLANET_GLYPH[ruler] ?? "✦";
    const ascGlyph = SIGN_GLYPH[lens.relocatedAscSign] ?? "";
    const sameHouse = lens.chartRulerNatalHouse === lens.chartRulerRelocatedHouse;

    return (
        <section
            aria-label="Chart ruler's journey"
            style={{
                padding: "clamp(2.5rem, 5vw, 4rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1.5rem, 3vw, 2.5rem)",
            }}
        >
            {/* Header */}
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
                        § 2 — The ruler travels
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                            margin: 0,
                            color: "var(--text-primary)",
                            textWrap: "balance",
                        }}
                    >
                        In {cityPrimary} you become {lens.relocatedAscSign}{" "}
                        <span
                            style={{
                                fontFamily: "var(--font-display-alt-2)",
                                color: "var(--color-y2k-blue)",
                                textTransform: "lowercase",
                                letterSpacing: 0,
                                fontSize: "0.85em",
                            }}
                        >
                            rising
                        </span>
                        .
                    </h2>
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "52ch",
                        fontWeight: 300,
                    }}
                >
                    Your rising sign changes when you travel. Your ruling planet
                    moves with you — into a different house of the relocated
                    chart — and the topic of the trip moves with it.
                </p>
            </div>

            {/* Natal vs relocated comparison */}
            <div
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]"
                style={{
                    gap: "clamp(1rem, 3vw, 2rem)",
                    alignItems: "stretch",
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "clamp(1.25rem, 3vw, 2rem)",
                }}
            >
                {/* Natal block */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.22em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        Back home — natal
                    </div>
                    <div
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(1.5rem, 3vw, 2rem)",
                            lineHeight: 1.1,
                            letterSpacing: "-0.01em",
                            color: "var(--text-primary)",
                        }}
                    >
                        <span style={{ color: "var(--color-y2k-blue)" }}>{rulerGlyph}</span> {ruler}{" "}
                        <span style={{ color: "var(--text-tertiary)", fontSize: "0.7em" }}>
                            in your {ordinal(lens.chartRulerNatalHouse)}
                        </span>
                    </div>
                    <p
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                            color: "var(--text-secondary)",
                            margin: 0,
                            fontWeight: 300,
                        }}
                    >
                        {lens.chartRulerNatalDomain}
                    </p>
                </div>

                {/* Arrow */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-primary)",
                        fontSize: "2rem",
                        color: "var(--color-y2k-blue)",
                    }}
                    aria-hidden
                >
                    →
                </div>

                {/* Relocated block */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.22em",
                            color: "var(--color-spiced-life)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        In {cityPrimary} — relocated
                    </div>
                    <div
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(1.5rem, 3vw, 2rem)",
                            lineHeight: 1.1,
                            letterSpacing: "-0.01em",
                            color: "var(--text-primary)",
                        }}
                    >
                        <span style={{ color: "var(--color-spiced-life)" }}>{rulerGlyph}</span> {ruler}{" "}
                        <span style={{ color: "var(--text-tertiary)", fontSize: "0.7em" }}>
                            {sameHouse ? "stays in your " : "moves to your "}
                            {ordinal(lens.chartRulerRelocatedHouse)}
                        </span>
                    </div>
                    <p
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                            color: "var(--text-primary)",
                            margin: 0,
                            fontWeight: 400,
                        }}
                    >
                        {lens.chartRulerRelocatedDomain}
                    </p>
                </div>
            </div>

            {/* Chain sentence */}
            {rulerJourneyChain && (
                <blockquote
                    style={{
                        margin: 0,
                        padding: "1rem 1.25rem",
                        borderLeft: `3px solid var(--gold)`,
                        background: "var(--surface)",
                        borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.22em",
                            color: "var(--gold)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginBottom: "0.5rem",
                        }}
                    >
                        The chain
                    </div>
                    <p
                        style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                            lineHeight: 1.55,
                            color: "var(--text-primary)",
                            margin: 0,
                            textWrap: "pretty",
                            fontStyle: "italic",
                        }}
                    >
                        {rulerJourneyChain}
                    </p>
                </blockquote>
            )}

            {/* World-point contacts */}
            {lens.worldPointContacts.length > 0 && (
                <div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.22em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginBottom: "0.75rem",
                        }}
                    >
                        World points in your chart — public visibility
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {lens.worldPointContacts.map((w, i) => (
                            <li
                                key={i}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "32px 1fr auto",
                                    gap: "0.75rem",
                                    padding: "0.6rem 0",
                                    borderTop: i === 0 ? "none" : "1px dashed var(--surface-border)",
                                    alignItems: "baseline",
                                }}
                            >
                                <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.25rem", color: "var(--color-y2k-blue)" }}>
                                    {PLANET_GLYPH[w.planet] ?? "✦"}
                                </span>
                                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.98rem", color: "var(--text-primary)" }}>
                                    Your {w.planet} on the <em>{w.pointType}</em> point — public moves amplify here.
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.55rem",
                                        letterSpacing: "0.18em",
                                        color: "var(--color-spiced-life)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    ±{w.orbDeg.toFixed(1)}°
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
