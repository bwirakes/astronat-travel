"use client";

/**
 * GeodeticHouseWheel — renders the whole-sign geodetic house frame for the
 * destination, with each natal planet placed in its geodetic house.
 *
 * Distinct from the relocation wheel: relocation uses Placidus/whole-sign
 * cusps from the destination's local sidereal time; the geodetic wheel
 * anchors house 1 at the *sign-start* of the geodetic ASC. So a planet's
 * relocated house and geodetic house can disagree.
 *
 * Hover/focus on a planet → standard PlanetPlacementHoverContent (inherited
 * from NatalMockupWheel). Hover/focus on an angle marker → description
 * tooltip below the wheel explains what that angle means in the geodetic
 * frame.
 */

import { useState } from "react";
import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import {
    NATAL_WHEEL_SIGNS as SIGNS,
    natalWheelSvgXY as svgXY,
} from "@/app/lib/natal-wheel-shared";

type AngleName = "ASC" | "MC" | "DSC" | "IC";

interface Assignment {
    planet: string;
    longitude: number;
    house: number;
    sign?: string;
}

interface Props {
    isDark: boolean;
    cusps: number[];
    natalAssignments: Assignment[];
    geoASC: number;
    geoMC: number;
    lat: number;
    lon: number;
    city: string;
}

const ANGLE_DESC: Record<AngleName, { title: string; body: string }> = {
    ASC: {
        title: "Geodetic ASC — Ascendant",
        body: "The face this longitude reads onto you when you arrive. Your physical signature, body language, first impressions get filtered through this sign.",
    },
    MC: {
        title: "Geodetic MC — Midheaven",
        body: "What this longitude wants from you in public. Your work, reputation, and outward direction take on this sign's weight here.",
    },
    DSC: {
        title: "Geodetic DSC — Descendant",
        body: "Who this longitude pairs you with. The kind of partners, allies, and adversaries this place draws toward you.",
    },
    IC: {
        title: "Geodetic IC — Nadir",
        body: "What this longitude does to your private ground. Home, family, the unconscious base — this is the sign you root into here.",
    },
};

const ANGLE_TONE: Record<AngleName, { tone: string; primary: boolean }> = {
    ASC: { tone: "var(--gold)", primary: true },
    MC:  { tone: "var(--gold)", primary: true },
    DSC: { tone: "var(--text-secondary)", primary: false },
    IC:  { tone: "var(--text-secondary)", primary: false },
};

const ORB_INNER_R = 388;
const ORB_OUTER_R = 420;
const TICK_INNER_R = 388;
const TICK_OUTER_R = 438;
const LABEL_R = 466;
const PILL_W = 44;
const PILL_H = 22;

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

function arcBand(centerLon: number, halfWidth: number, rOut: number, rIn: number, asc: number): string {
    const a = svgXY(centerLon - halfWidth, rOut, asc);
    const b = svgXY(centerLon + halfWidth, rOut, asc);
    const c = svgXY(centerLon + halfWidth, rIn, asc);
    const d = svgXY(centerLon - halfWidth, rIn, asc);
    return `M ${a.x} ${a.y} A ${rOut} ${rOut} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rIn} ${rIn} 0 0 1 ${d.x} ${d.y} Z`;
}

function signFromLongitude(lon: number): string {
    const idx = Math.floor((((lon % 360) + 360) % 360) / 30) % 12;
    return SIGNS[idx]?.name ?? "Aries";
}

export default function GeodeticHouseWheel({
    isDark, cusps, natalAssignments, geoASC, geoMC, lat, lon, city,
}: Props) {
    const [hoveredAngle, setHoveredAngle] = useState<AngleName | null>(null);

    // Wheel rotation reference: house 1 cusp (sign-start of geo-ASC).
    const wheelAsc = cusps[0] ?? geoASC;

    // Convert geodetic-house assignments into NatalMockupWheel's planet shape.
    const planetsForWheel: NatalPlanet[] = natalAssignments.map((a) => ({
        planet: a.planet,
        longitude: a.longitude,
        sign: a.sign ?? signFromLongitude(a.longitude),
        house: a.house,
    }));

    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC },
        { name: "MC",  lon: geoMC },
        { name: "DSC", lon: (geoASC + 180) % 360 },
        { name: "IC",  lon: (geoMC  + 180) % 360 },
    ];

    const lit = angles.map((a) => {
        const minOrb = planetsForWheel.reduce(
            (best, p) => Math.min(best, angularDiff(p.longitude, a.lon)),
            999,
        );
        return { ...a, tight: minOrb <= 2, wide: minOrb <= 5 };
    });

    const desc = hoveredAngle ? ANGLE_DESC[hoveredAngle] : null;

    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative", width: "100%" }}>
                <NatalMockupWheel
                    isDark={isDark}
                    planets={planetsForWheel}
                    cusps={cusps}
                />

                <svg
                    viewBox="0 0 800 800"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Geodetic angle markers"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "visible",
                        pointerEvents: "none",
                    }}
                >
                    {lit.map((a) => {
                        const dim = hoveredAngle !== null && hoveredAngle !== a.name;
                        return (
                            <path
                                key={`wedge-${a.name}`}
                                d={arcBand(a.lon, 5, ORB_OUTER_R, ORB_INNER_R, wheelAsc)}
                                fill={ANGLE_TONE[a.name].tone}
                                opacity={dim ? 0.04 : a.wide ? (hoveredAngle === a.name ? 0.45 : 0.32) : 0.10}
                                style={{ transition: "opacity 220ms ease" }}
                            />
                        );
                    })}

                    {lit.map((a) => {
                        const inner = svgXY(a.lon, TICK_INNER_R, wheelAsc);
                        const outer = svgXY(a.lon, TICK_OUTER_R, wheelAsc);
                        const tone = ANGLE_TONE[a.name].tone;
                        const dim = hoveredAngle !== null && hoveredAngle !== a.name;
                        return (
                            <g key={`tick-${a.name}`} style={{ opacity: dim ? 0.25 : 1, transition: "opacity 220ms ease" }}>
                                <line
                                    x1={inner.x} y1={inner.y}
                                    x2={outer.x} y2={outer.y}
                                    stroke={tone}
                                    strokeWidth={a.tight ? 3 : 2}
                                    strokeLinecap="round"
                                />
                                <circle cx={outer.x} cy={outer.y} r={a.tight ? 5 : 3.5} fill={tone} />
                            </g>
                        );
                    })}

                    {lit.map((a) => {
                        const p = svgXY(a.lon, LABEL_R, wheelAsc);
                        const tone = ANGLE_TONE[a.name].tone;
                        const dim = hoveredAngle !== null && hoveredAngle !== a.name;
                        const active = hoveredAngle === a.name;
                        return (
                            <g
                                key={`label-${a.name}`}
                                style={{
                                    pointerEvents: "auto",
                                    cursor: "pointer",
                                    opacity: dim ? 0.4 : 1,
                                    transition: "opacity 220ms ease",
                                }}
                                onMouseEnter={() => setHoveredAngle(a.name)}
                                onMouseLeave={() => setHoveredAngle(null)}
                                onFocus={() => setHoveredAngle(a.name)}
                                onBlur={() => setHoveredAngle(null)}
                                tabIndex={0}
                                role="button"
                                aria-label={`${a.name} — ${ANGLE_DESC[a.name].title}`}
                            >
                                <rect
                                    x={p.x - PILL_W / 2}
                                    y={p.y - PILL_H / 2}
                                    width={PILL_W}
                                    height={PILL_H}
                                    rx={PILL_H / 2}
                                    fill="var(--bg)"
                                    stroke={tone}
                                    strokeWidth={active ? 2.5 : 1.5}
                                />
                                <text
                                    x={p.x}
                                    y={p.y}
                                    fontSize={13}
                                    fontWeight={700}
                                    fill={tone}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontFamily="var(--font-mono, monospace)"
                                    letterSpacing={1}
                                >
                                    {a.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Coordinates + hover description panel */}
            <div style={{
                marginTop: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
            }}>
                <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                }}>
                    <span>{city}</span>
                    <span>{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
                    <span>geo-ASC {signFromLongitude(geoASC)} · geo-MC {signFromLongitude(geoMC)}</span>
                </div>

                <div
                    aria-live="polite"
                    style={{
                        minHeight: "3.5rem",
                        padding: "0.75rem 1rem",
                        background: desc
                            ? "color-mix(in oklab, var(--gold) 6%, transparent)"
                            : "color-mix(in oklab, var(--text-primary) 3%, transparent)",
                        border: "1px solid var(--surface-border)",
                        borderRadius: "var(--radius-sm)",
                        transition: "background 200ms ease",
                    }}
                >
                    {desc ? (
                        <>
                            <div style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.6rem",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: "var(--gold)",
                                fontWeight: 700,
                                marginBottom: "0.35rem",
                            }}>
                                {desc.title}
                            </div>
                            <div style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "0.88rem",
                                lineHeight: 1.55,
                                color: "var(--text-primary)",
                            }}>
                                {desc.body}
                            </div>
                        </>
                    ) : (
                        <div style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                            lineHeight: 1.55,
                            color: "var(--text-tertiary)",
                            fontStyle: "italic",
                        }}>
                            Hover or tap an angle pill (ASC, MC, DSC, IC) to see what that corner means here.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
