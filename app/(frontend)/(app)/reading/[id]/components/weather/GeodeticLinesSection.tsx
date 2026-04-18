"use client";

import { WORLD_MAP_PATH } from "@/app/components/worldMapPath";
import {
    GEODETIC_ZONES,
    ELEMENT_COLORS,
    projectLon,
    projectLat,
} from "@/app/geodetic/data/geodeticZones";

interface Props {
    destinationLat: number;
    destinationLon: number;
    cityPrimary: string;
}

/**
 * Derive the city's geodetic zone by longitude. Zones are 30° wide
 * starting at 0° Aries = Greenwich. Return the zone whose [start, start+30)
 * range contains the normalised longitude.
 */
function zoneForLongitude(lon: number) {
    // Normalize longitude to [-180, 180]
    const norm = ((lon + 540) % 360) - 180;
    return (
        GEODETIC_ZONES.find((z) => {
            const start = z.startLon;
            const end = start + 30;
            return norm >= start && norm < end;
        }) ?? GEODETIC_ZONES[0]
    );
}

/**
 * Approximate geodetic ASC sign — at mid-latitudes the rising sign sits
 * roughly 3 signs ahead of the MC sign. This is a fixed permanent feature
 * of each location and does NOT vary with time (only with latitude).
 */
function approxAscZone(mcStartLon: number) {
    const ascStart = ((mcStartLon + 90 + 180) % 360) - 180;
    return (
        GEODETIC_ZONES.find((z) => {
            const start = z.startLon;
            const end = start + 30;
            return ascStart >= start && ascStart < end;
        }) ?? GEODETIC_ZONES[0]
    );
}

export function GeodeticLinesSection({
    destinationLat,
    destinationLon,
    cityPrimary,
}: Props) {
    const mcZone = zoneForLongitude(destinationLon);
    const ascZone = approxAscZone(mcZone.startLon);
    const mcElem = ELEMENT_COLORS[mcZone.elem];
    const ascElem = ELEMENT_COLORS[ascZone.elem];

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
                    The geodetic lens · permanent
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
                    {cityPrimary}&apos;s permanent signature
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
                    Geodetic lines don&apos;t move. The zodiac is projected onto Earth itself (0° Aries at Greenwich, one sign every 30° of longitude), so every place sits permanently under a fixed sign. Whatever transits that sign lights up the whole column — regardless of you, regardless of the date.
                </p>
            </header>

            {/* World map with zones + pin */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "2 / 1",
                    background: "var(--bg-raised)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--surface-border)",
                    overflow: "hidden",
                }}
            >
                <svg
                    viewBox="0 0 1000 500"
                    preserveAspectRatio="xMidYMid slice"
                    style={{ width: "100%", height: "100%", display: "block" }}
                >
                    {/* 12 zone columns */}
                    {GEODETIC_ZONES.map((z) => {
                        const x = projectLon(z.startLon);
                        const width = 1000 / 12;
                        const isMC = z.id === mcZone.id;
                        const isASC = z.id === ascZone.id;
                        const elem = ELEMENT_COLORS[z.elem];
                        return (
                            <g key={z.id}>
                                <rect
                                    x={x}
                                    y={0}
                                    width={width}
                                    height={500}
                                    fill={isMC ? elem.fill.replace("0.15", "0.45") : isASC ? elem.fill.replace("0.15", "0.28") : elem.fill}
                                    stroke={elem.stroke}
                                    strokeWidth={isMC ? 1.5 : 0.5}
                                    strokeDasharray={isMC ? "none" : "4 4"}
                                    opacity={isMC ? 1 : isASC ? 0.8 : 0.35}
                                />
                                <text
                                    x={x + width / 2}
                                    y={28}
                                    textAnchor="middle"
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "18px",
                                        fill: elem.stroke,
                                        opacity: isMC ? 1 : isASC ? 0.75 : 0.35,
                                    }}
                                >
                                    {z.glyph}
                                </text>
                                <text
                                    x={x + 4}
                                    y={488}
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "7px",
                                        fill: elem.stroke,
                                        opacity: isMC ? 0.9 : isASC ? 0.65 : 0.3,
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    {z.startLon >= 0 ? `${z.startLon}°E` : `${Math.abs(z.startLon)}°W`}
                                </text>
                            </g>
                        );
                    })}

                    {/* Landmass */}
                    <path
                        d={WORLD_MAP_PATH}
                        fill="rgba(255,255,255,0.08)"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="0.5"
                    />

                    {/* Approximated geodetic ASC curve — sinusoid passing
                        through the equator at the destination's MC longitude.
                        This is the fixed permanent rising-line for this
                        latitude band; a pedagogic approximation, not exact. */}
                    {(() => {
                        const mcLon = mcZone.startLon + 15; // zone center
                        const points: string[] = [];
                        for (let lonStep = -180; lonStep <= 180; lonStep += 4) {
                            const lat = Math.sin(((lonStep - mcLon) * Math.PI) / 180) * 55;
                            points.push(`${projectLon(lonStep)},${projectLat(lat)}`);
                        }
                        return (
                            <polyline
                                points={points.join(" ")}
                                fill="none"
                                stroke="var(--gold)"
                                strokeWidth="1.5"
                                strokeDasharray="6 4"
                                opacity="0.5"
                                vectorEffect="non-scaling-stroke"
                            />
                        );
                    })()}

                    {/* Equator + tropics */}
                    <line
                        x1="0" y1={projectLat(0)} x2="1000" y2={projectLat(0)}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="0.4"
                        strokeDasharray="4 4"
                    />

                    {/* Destination pin */}
                    <g transform={`translate(${projectLon(destinationLon)}, ${projectLat(destinationLat)})`}>
                        <circle r="10" fill="none" stroke="var(--color-y2k-blue)" strokeWidth="1.5" opacity="0.6" />
                        <circle r="4" fill="var(--color-y2k-blue)" />
                        <text
                            x="10"
                            y="4"
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                fill: "var(--color-eggshell)",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            {cityPrimary}
                        </text>
                    </g>
                </svg>
            </div>

            {/* Legend for the dashed ASC curve */}
            <div
                style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.58rem",
                    letterSpacing: "0.18em",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <span aria-hidden style={{ width: 22, height: 2, background: mcElem.stroke }} />
                    MC · {mcZone.sign}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <span aria-hidden style={{ width: 22, height: 2, background: ascElem.stroke, opacity: 0.7 }} />
                    ASC · {ascZone.sign} (approx)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <span
                        aria-hidden
                        style={{
                            width: 22,
                            height: 2,
                            backgroundImage:
                                "repeating-linear-gradient(90deg, var(--gold) 0 6px, transparent 6px 10px)",
                        }}
                    />
                    Rising curve
                </span>
            </div>

            {/* MC + ASC interpretation panels */}
            <div
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: "0.9rem" }}
            >
                <ZonePanel
                    kind="MC"
                    zone={mcZone}
                    lead={`${cityPrimary} sits permanently under the ${mcZone.sign} meridian.`}
                />
                <ZonePanel
                    kind="ASC"
                    zone={ascZone}
                    lead={`${cityPrimary}'s approximate geodetic rising is ${ascZone.sign}.`}
                />
            </div>

            {/* Comparative teaching callout */}
            <aside
                style={{
                    padding: "1rem 1.25rem",
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderLeft: "4px solid var(--color-spiced-life)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                }}
            >
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.22em",
                        color: "var(--color-spiced-life)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    How to read this
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        margin: 0,
                        fontWeight: 300,
                        textWrap: "pretty",
                    }}
                >
                    Example: Donald Trump is Leo rising in Queens (NYC). In parts of Europe, his geodetic ASC falls on Leo too — a fixed permanent match, not time-sensitive. That means transits through Aries (ruler of his 9th from Leo) hit his rising across that whole band of earth, every time they happen, regardless of year. The zone you&apos;re sitting in is the equivalent anchor for you.
                </p>
            </aside>
        </div>
    );
}

function ZonePanel({
    kind,
    zone,
    lead,
}: {
    kind: "MC" | "ASC";
    zone: (typeof GEODETIC_ZONES)[number];
    lead: string;
}) {
    const elem = ELEMENT_COLORS[zone.elem];
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: `4px solid ${elem.stroke}`,
                borderRadius: "var(--radius-sm)",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.22em",
                        color: elem.stroke,
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    {kind === "MC" ? "Geodetic MC" : "Geodetic ASC"}
                </span>
                <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.5rem", color: elem.stroke, lineHeight: 1 }}>
                    {zone.glyph} {zone.sign}
                </span>
            </div>
            <div
                style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "0.95rem",
                    color: "var(--text-primary)",
                    fontStyle: "italic",
                    lineHeight: 1.4,
                }}
            >
                {lead}
            </div>
            <p
                style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.85rem",
                    lineHeight: 1.55,
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontWeight: 300,
                    textWrap: "pretty",
                }}
            >
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: elem.stroke, marginRight: "0.45rem" }}>
                    {zone.keyword}
                </strong>
                {zone.desc}
            </p>
        </div>
    );
}
