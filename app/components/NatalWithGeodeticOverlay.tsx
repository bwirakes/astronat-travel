"use client";

/**
 * NatalWithGeodeticOverlay — wraps `NatalMockupWheel` and stacks four
 * geodetic angle markers (ASC / MC / DSC / IC) above it.
 *
 * Hover any corner to dim the others and emphasise its ±5° wedge.
 */

import { useState } from "react";
import NatalMockupWheel, { type NatalPlanet } from "./NatalMockupWheel";
import {
    NATAL_WHEEL_SIGNS as SIGNS,
    natalWheelSvgXY as svgXY,
} from "@/app/lib/natal-wheel-shared";

interface Props {
    isDark: boolean;
    planets: NatalPlanet[];
    cusps: number[];
    geoMC: number;
    geoASC: number;
    onPlanetClick?: (planetName: string) => void;
}

const ORB_INNER_R = 388;
const ORB_OUTER_R = 420;
const TICK_INNER_R = 388;
const TICK_OUTER_R = 438;
const LABEL_R = 466;
const PILL_W = 44;
const PILL_H = 22;

const ANGLE_STYLE: Record<AngleName, { tone: string; primary: boolean }> = {
    ASC: { tone: "var(--gold)",          primary: true  },
    MC:  { tone: "var(--gold)",          primary: true  },
    DSC: { tone: "var(--text-secondary)", primary: false },
    IC:  { tone: "var(--text-secondary)", primary: false },
};

type AngleName = "ASC" | "MC" | "DSC" | "IC";

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

export default function NatalWithGeodeticOverlay({
    isDark, planets, cusps, geoMC, geoASC, onPlanetClick,
}: Props) {
    const [hovered, setHovered] = useState<AngleName | null>(null);
    const natalAsc = cusps[0] ?? 0;

    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC },
        { name: "MC",  lon: geoMC },
        { name: "DSC", lon: (geoASC + 180) % 360 },
        { name: "IC",  lon: (geoMC + 180) % 360 },
    ];

    const lit = angles.map((a) => {
        const minOrb = planets.reduce(
            (best, p) => Math.min(best, angularDiff(p.longitude, a.lon)),
            999,
        );
        return { ...a, tight: minOrb <= 2, wide: minOrb <= 5 };
    });

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <NatalMockupWheel
                isDark={isDark}
                planets={planets}
                cusps={cusps}
                onPlanetClick={onPlanetClick}
            />

            <svg
                viewBox="0 0 800 800"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Geodetic angle overlay for the destination"
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
                    const dim = hovered !== null && hovered !== a.name;
                    return (
                        <path
                            key={`wedge-${a.name}`}
                            d={arcBand(a.lon, 5, ORB_OUTER_R, ORB_INNER_R, natalAsc)}
                            fill={ANGLE_STYLE[a.name].tone}
                            opacity={dim ? 0.04 : a.wide ? (hovered === a.name ? 0.45 : 0.32) : 0.10}
                            style={{ transition: "opacity 220ms ease" }}
                        />
                    );
                })}

                {lit.map((a) => {
                    const inner = svgXY(a.lon, TICK_INNER_R, natalAsc);
                    const outer = svgXY(a.lon, TICK_OUTER_R, natalAsc);
                    const tone = ANGLE_STYLE[a.name].tone;
                    const dim = hovered !== null && hovered !== a.name;
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
                    const p = svgXY(a.lon, LABEL_R, natalAsc);
                    const tone = ANGLE_STYLE[a.name].tone;
                    const dim = hovered !== null && hovered !== a.name;
                    const active = hovered === a.name;
                    return (
                        <g
                            key={`label-${a.name}`}
                            style={{
                                pointerEvents: "auto",
                                cursor: "pointer",
                                opacity: dim ? 0.4 : 1,
                                transition: "opacity 220ms ease",
                            }}
                            onMouseEnter={() => setHovered(a.name)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => setHovered(a.name)}
                            onBlur={() => setHovered(null)}
                            tabIndex={0}
                            role="button"
                            aria-label={`${a.name} corner${a.wide ? " — activated by a planet within 5°" : ""}`}
                        >
                            {/* Pill background — solid bg fill so labels are readable
                                against any wheel content sitting behind. */}
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
    );
}

/** Re-export for consumers — they can render the natal-only wheel directly. */
export { default as NatalMockupWheel } from "./NatalMockupWheel";

/** Sign object at a given ecliptic longitude — small public helper used by
 *  the Place tab when building the GeodeticGridCard rows. */
export function signAtLon(lon: number) {
    const idx = Math.floor((((lon % 360) + 360) % 360) / 30) % 12;
    return SIGNS[idx];
}
