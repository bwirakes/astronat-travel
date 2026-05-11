"use client";

import { useState } from "react";
import { AcgMap, type NatalData } from "@/app/components/AcgMap";

interface LineRow {
    planet: string;
    angle: string;
    distance_km: number;
}

interface Props {
    natalPlanets: Array<{ name?: string; planet?: string; longitude: number }>;
    birthDateTimeUTC: string | null;
    birthLon: number | null;
    destinationLat: number;
    destinationLon: number;
    cityPrimary: string;
}

const ANGLE_LONG: Record<string, string> = {
    MC: "Midheaven",
    IC: "Imum Coeli",
    ASC: "Ascendant",
    DSC: "Descendant",
};

const PLANET_GLYPH: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
    Chiron: "⚷",
};

const PLANET_ACCENT: Record<string, string> = {
    Sun: "var(--gold)",
    Moon: "var(--color-acqua)",
    Mercury: "var(--color-y2k-blue)",
    Venus: "var(--color-spiced-life)",
    Mars: "var(--color-planet-mars)",
    Jupiter: "var(--sage)",
    Saturn: "var(--text-tertiary)",
    Uranus: "var(--color-y2k-blue)",
    Neptune: "var(--color-acqua)",
    Pluto: "var(--color-planet-mars)",
    Chiron: "var(--text-secondary)",
};

function natalToAcgData(planets: Props["natalPlanets"]): NatalData | null {
    const byName = (n: string) =>
        planets.find((p) => (p.name ?? p.planet ?? "").toLowerCase() === n);

    const required = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
    const hits = required.map(byName);
    if (hits.some((x) => !x)) return null;

    return {
        sun: { longitude: hits[0]!.longitude },
        moon: { longitude: hits[1]!.longitude },
        mercury: { longitude: hits[2]!.longitude },
        venus: { longitude: hits[3]!.longitude },
        mars: { longitude: hits[4]!.longitude },
        jupiter: { longitude: hits[5]!.longitude },
        saturn: { longitude: hits[6]!.longitude },
        uranus: { longitude: hits[7]!.longitude },
        neptune: { longitude: hits[8]!.longitude },
        pluto: { longitude: hits[9]!.longitude },
        chiron: byName("chiron") ? { longitude: byName("chiron")!.longitude } : undefined,
        houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    };
}

export function LinesSection({
    natalPlanets,
    birthDateTimeUTC,
    birthLon,
    destinationLat,
    destinationLon,
    cityPrimary,
}: Props) {
    const [lines, setLines] = useState<LineRow[]>([]);
    const natal = natalPlanets && natalPlanets.length > 0 ? natalToAcgData(natalPlanets) : null;

    // Only keep lines within ~800km for the close-lines list.
    const nearLines = [...lines]
        .filter((l) => l.distance_km > 0 && l.distance_km < 1200)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 5);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(1rem, 2vw, 1.5rem)" }}>
            <header style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxWidth: "720px" }}>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.22em",
                        color: "var(--color-y2k-blue)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    The ACG lens · time-sensitive
                </div>
                <h3
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        margin: 0,
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        textWrap: "balance",
                    }}
                >
                    Your planetary lines over {cityPrimary}
                </h3>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        margin: "0.25rem 0 0",
                        maxWidth: "60ch",
                        textWrap: "pretty",
                        fontWeight: 300,
                    }}
                >
                    These lines plot where your natal planets cross the horizons and meridians of the earth <em>right now</em>. When a line lands within ~5° of an angle at your destination, that planet&apos;s theme becomes dominant for the visit.
                </p>
            </header>

            {/* Map — uses AcgMap component directly */}
            {natal ? (
                <div style={{ marginBottom: "clamp(1rem, 2.5vw, 2rem)" }}>
                    <AcgMap
                        natal={natal}
                        birthDateTimeUTC={birthDateTimeUTC || undefined}
                        birthLon={birthLon ?? undefined}
                        highlightCity={{ lat: destinationLat, lon: destinationLon, name: cityPrimary }}
                        compact={false}
                        interactive={false}
                        onLinesCalculated={(out) => setLines(out)}
                    />
                </div>
            ) : (
                <div
                    style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        border: "1px dashed var(--surface-border)",
                        borderRadius: "var(--radius-md)",
                        marginBottom: "2rem",
                    }}
                >
                    Complete your birth chart in your profile to see your planetary lines.
                </div>
            )}

            {/* Structured list of nearest lines */}
            {nearLines.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {nearLines.map((l, i) => {
                        const accent = PLANET_ACCENT[l.planet] || "var(--text-tertiary)";
                        const glyph = PLANET_GLYPH[l.planet] || "✦";
                        return (
                            <article
                                key={`${l.planet}-${l.angle}-${i}`}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "100px 1fr 140px",
                                    gap: "clamp(1rem, 3vw, 2.5rem)",
                                    padding: "clamp(1.25rem, 2.5vw, 2rem) 0",
                                    borderTop: "1px solid var(--surface-border)",
                                    alignItems: "start",
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-primary)",
                                            fontSize: "3rem",
                                            lineHeight: 1,
                                            color: accent,
                                        }}
                                    >
                                        {glyph}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.55rem",
                                            letterSpacing: "0.18em",
                                            color: "var(--text-tertiary)",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Line {String(i + 1).padStart(2, "0")} / {nearLines.length}
                                    </span>
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <h3
                                        style={{
                                            fontFamily: "var(--font-primary)",
                                            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                                            lineHeight: 1.05,
                                            letterSpacing: "-0.01em",
                                            margin: 0,
                                            color: "var(--text-primary)",
                                            fontWeight: 400,
                                        }}
                                    >
                                        {l.planet}{" "}
                                        <span
                                            style={{
                                                fontSize: "0.6em",
                                                fontStyle: "italic",
                                                color: "var(--color-acqua)",
                                                marginLeft: "0.25rem",
                                            }}
                                        >
                                            on the {ANGLE_LONG[l.angle] ?? l.angle}
                                        </span>
                                    </h3>
                                </div>

                                <div style={{ textAlign: "right" }}>
                                    <div
                                        style={{
                                            fontFamily: "var(--font-primary)",
                                            fontSize: "1.75rem",
                                            lineHeight: 1,
                                            color: "var(--color-spiced-life)",
                                            letterSpacing: "-0.02em",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {l.distance_km === 0 ? "exact" : `${l.distance_km} km`}
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
                                        from center
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
