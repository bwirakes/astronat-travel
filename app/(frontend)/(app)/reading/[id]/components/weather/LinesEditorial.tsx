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

const ANGLE_SHORT: Record<string, string> = {
    MC: "MC",
    IC: "IC",
    ASC: "ASC",
    DSC: "DSC",
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

// Plain-language caption per planet+angle combo.
function captionFor(planet: string, angle: string): string {
    const a = angle.toUpperCase();
    const p = planet;
    if (a === "MC") {
        if (p === "Sun") return "Visibility, ambition, and public work.";
        if (p === "Moon") return "Emotional weight on career and reputation.";
        if (p === "Mercury") return "Voice and ideas get heard here.";
        if (p === "Venus") return "Aesthetics and relationships shape your public face.";
        if (p === "Mars") return "Drive and ambition pushed into public view.";
        if (p === "Jupiter") return "Expansion, growth, visibility.";
        if (p === "Saturn") return "Structured career ambitions. Slow, serious.";
        if (p === "Uranus") return "Disruption and reinvention of your work.";
        if (p === "Neptune") return "A calling dissolves or refines — watch for blur.";
        if (p === "Pluto") return "Intense career transformation.";
    }
    if (a === "IC") {
        if (p === "Venus") return "Direct hit — home, belonging, aesthetic.";
        if (p === "Moon") return "Family, rest, deep interior — literal home.";
        if (p === "Sun") return "Identity roots itself here.";
        if (p === "Jupiter") return "Home grows. Foundations expand.";
        if (p === "Saturn") return "Hard work on roots. Heavy but anchoring.";
        if (p === "Mars") return "Friction under the floor — old family charge.";
        if (p === "Mercury") return "Journaling, learning from home returns.";
    }
    if (a === "ASC") {
        if (p === "Moon") return "Body softens, emotions closer to the surface.";
        if (p === "Sun") return "You show up brighter, more yourself.";
        if (p === "Venus") return "You look good here. Attraction warms.";
        if (p === "Mars") return "More assertive, more physical, shorter fuse.";
        if (p === "Jupiter") return "Confidence, broadened self-presentation.";
        if (p === "Saturn") return "Serious, disciplined, sometimes stiff.";
    }
    if (a === "DSC") {
        if (p === "Jupiter") return "Generous relationships, teachers, expansion in partnership.";
        if (p === "Venus") return "Relationships flow. Deals and romance land.";
        if (p === "Saturn") return "Partnerships feel heavier than usual.";
        if (p === "Sun") return "Partners become the focal lens.";
        if (p === "Moon") return "Emotional attunement to the people around you.";
    }
    return "A line on an angle is a line you feel.";
}

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

export function LinesEditorial({
    natalPlanets,
    birthDateTimeUTC,
    birthLon,
    destinationLat,
    destinationLon,
    cityPrimary,
}: Props) {
    const [lines, setLines] = useState<LineRow[]>([]);
    const natal = natalPlanets && natalPlanets.length > 0 ? natalToAcgData(natalPlanets) : null;

    const nearLines = [...lines]
        .filter((l) => l.distance_km >= 0 && l.distance_km < 1500)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 4);

    return (
        <section
            aria-label="Geodetic reading — your lines here"
            style={{
                padding: "clamp(2.5rem, 5vw, 4rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1.5rem, 3vw, 2.5rem)",
            }}
        >
            {/* Header grid: H2 left, intro right */}
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
                        § 1 — The geodetic reading
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
                        Why this place, for this chart.
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
                        textWrap: "pretty",
                        fontWeight: 300,
                    }}
                >
                    {nearLines.length > 0
                        ? `${nearLines.length} major planetary line${nearLines.length === 1 ? "" : "s"} pass close to ${cityPrimary}. A line on an angle is a line you feel — a planet on your Midheaven rewires how the world sees you, on the IC it rewires your sense of home.`
                        : `This is where your planetary lines cross the horizons and meridians of the earth. When a line lands close to an angle at ${cityPrimary}, that planet's theme becomes dominant for the visit.`}
                </p>
            </div>

            {/* Map + list grid */}
            <div
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr]"
                style={{ gap: "clamp(1.5rem, 3vw, 2.5rem)", alignItems: "start" }}
            >
                {/* Map */}
                {natal ? (
                    <div
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--surface-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "clamp(0.5rem, 1.5vw, 1rem)",
                        }}
                    >
                        <AcgMap
                            natal={natal}
                            birthDateTimeUTC={birthDateTimeUTC || undefined}
                            birthLon={birthLon ?? undefined}
                            highlightCity={{ lat: destinationLat, lon: destinationLon, name: cityPrimary }}
                            compact
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
                        }}
                    >
                        Complete your birth chart in your profile to see your planetary lines.
                    </div>
                )}

                {/* Line list */}
                {nearLines.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {nearLines.map((l, i) => {
                            const accent = PLANET_ACCENT[l.planet] || "var(--text-tertiary)";
                            const glyph = PLANET_GLYPH[l.planet] || "✦";
                            const angleShort = ANGLE_SHORT[l.angle] ?? l.angle;
                            const angleLong = ANGLE_LONG[l.angle] ?? l.angle;
                            const caption = captionFor(l.planet, l.angle);
                            const distanceText =
                                l.distance_km === 0 ? "EXACT" : `${Math.round(l.distance_km)}KM`;
                            return (
                                <li
                                    key={`${l.planet}-${l.angle}-${i}`}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "auto 1fr auto",
                                        gap: "clamp(0.75rem, 2vw, 1.25rem)",
                                        padding: "1rem 0",
                                        borderTop: i === 0 ? "none" : "1px dashed var(--surface-border)",
                                        alignItems: "start",
                                    }}
                                >
                                    <span
                                        aria-hidden
                                        style={{
                                            fontFamily: "var(--font-primary)",
                                            fontSize: "1.75rem",
                                            lineHeight: 1,
                                            color: accent,
                                            width: 32,
                                        }}
                                    >
                                        {glyph}
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontFamily: "var(--font-primary)",
                                                fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                                                lineHeight: 1.15,
                                                color: "var(--text-primary)",
                                                fontWeight: 400,
                                            }}
                                        >
                                            {l.planet}{" "}
                                            <span
                                                style={{
                                                    fontFamily: "var(--font-mono)",
                                                    fontSize: "0.58rem",
                                                    letterSpacing: "0.2em",
                                                    color: "var(--text-tertiary)",
                                                    textTransform: "uppercase",
                                                    fontWeight: 700,
                                                    marginLeft: "0.4rem",
                                                }}
                                            >
                                                on the {angleShort}
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                fontFamily: "var(--font-body)",
                                                fontSize: "0.95rem",
                                                lineHeight: 1.5,
                                                color: "var(--text-secondary)",
                                                margin: "0.35rem 0 0",
                                                fontWeight: 300,
                                                textWrap: "pretty",
                                            }}
                                        >
                                            {caption}
                                        </p>
                                        <div
                                            style={{
                                                display: "none",
                                            }}
                                            aria-hidden
                                        >
                                            {angleLong}
                                        </div>
                                    </div>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.58rem",
                                            letterSpacing: "0.22em",
                                            color: "var(--color-spiced-life)",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            fontVariantNumeric: "tabular-nums",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {distanceText}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.95rem",
                            color: "var(--text-tertiary)",
                        }}
                    >
                        Calculating nearest lines…
                    </div>
                )}
            </div>
        </section>
    );
}
