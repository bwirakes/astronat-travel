"use client";

import type { GWPersonalLens } from "@/app/lib/geodetic-weather-types";
import { planetGlyph } from "@/app/lib/geodetic-weather-types";

interface Props {
    lens: GWPersonalLens;
    cityPrimary: string;
}

function fmtLon(lon: number): string {
    const east = ((lon % 360) + 360) % 360;
    if (east <= 180) return `${east.toFixed(1)}°E`;
    return `${(360 - east).toFixed(1)}°W`;
}

/**
 * § 3 — Where your planets land. The PDF's principle 3 (p.5): each natal
 * planet's ecliptic longitude IS its geographic longitude (0° Aries pinned
 * to Greenwich). This section renders the mapping for every natal planet
 * and tags the ones that happen to land on the destination's meridian or
 * its 180° opposite.
 */
export function NatalGeography({ lens, cityPrimary }: Props) {
    const rows = lens.natalPlanetGeography ?? [];
    if (rows.length === 0) return null;

    const sorted = [...rows].sort((a, b) => {
        if (a.angularMatch !== b.angularMatch) return a.angularMatch ? -1 : 1;
        return a.geographicLon - b.geographicLon;
    });

    return (
        <section
            aria-label="Where your planets land on earth"
            style={{
                padding: "clamp(2.5rem, 5vw, 4rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1.25rem, 3vw, 2rem)",
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
                        § 3 — Where your planets land
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
                        Your natal planets, on earth.
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
                    Each planet&apos;s ecliptic position maps 1:1 to a geographic
                    longitude — 0° Aries pinned to Greenwich, one sign per
                    30°. These are your personal meridians on the world map.
                    A planet that lands within 5° of {cityPrimary} (or its
                    opposite) is tagged <em>active here</em>.
                </p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {sorted.map((row, i) => (
                    <li
                        key={`${row.planet}-${i}`}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "32px 1fr auto auto",
                            gap: "0.85rem",
                            alignItems: "baseline",
                            padding: "0.7rem 0",
                            borderTop: i === 0 ? "none" : "1px dashed var(--surface-border)",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-primary)",
                                fontSize: "1.2rem",
                                color: row.angularMatch ? "var(--color-spiced-life)" : "var(--color-y2k-blue)",
                                lineHeight: 1,
                            }}
                            aria-hidden
                        >
                            {planetGlyph(row.planet)}
                        </span>
                        <span
                            style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "0.98rem",
                                color: "var(--text-primary)",
                            }}
                        >
                            <strong style={{ fontWeight: 500 }}>{row.planet}</strong>
                            {" "}
                            <span style={{ color: "var(--text-tertiary)" }}>
                                {row.geographicLon.toFixed(2)}°
                            </span>
                            {" → "}
                            <span style={{ color: "var(--text-secondary)" }}>{row.geographicLabel}</span>
                        </span>
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.6rem",
                                letterSpacing: "0.18em",
                                color: "var(--text-tertiary)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}
                        >
                            {fmtLon(row.geographicLon)}
                        </span>
                        {row.angularMatch ? (
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.55rem",
                                    letterSpacing: "0.2em",
                                    color: "var(--color-spiced-life)",
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                    border: "1px solid var(--color-spiced-life)",
                                    borderRadius: "999px",
                                    padding: "0.18rem 0.5rem",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Active here
                            </span>
                        ) : (
                            <span aria-hidden />
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
