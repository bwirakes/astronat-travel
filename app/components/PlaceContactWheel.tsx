"use client";

/**
 * PlaceContactWheel — overlay wheel showing the user's natal planets
 * against the destination's four geodetic anchors, with ±2° and ±5° orb
 * arcs that light up when a planet is inside.
 *
 * This is the "your chart on this place" visual that was missing from the
 * Place tab. It answers the contact question (does a natal planet sit on
 * one of the four corners?), not the geographic-strip question (which the
 * AcgMap and ReadingGeodeticMap already cover).
 *
 * Math conventions:
 *   - Geodetic angle longitudes come from the same SwissEph-grade helpers
 *     used in app/lib/geodetic.ts. We don't recompute them here.
 *   - Orb thresholds (±2° tight / ±5° wide) match Step 5 of computeHouseMatrix
 *     so the visual matches the score.
 */

import {
    NATAL_WHEEL_ELEM_FILL,
    NATAL_WHEEL_ELEM_STROKE,
    NATAL_WHEEL_SIGNS,
    natalWheelSvgXY,
    WHEEL_CX,
    WHEEL_CY,
} from "@/app/lib/natal-wheel-shared";

const VIEW = 800;
const ZODIAC_OUTER = 350;
const ZODIAC_INNER = 285;
const ORB_WIDE_RADIUS = 250;     // outer edge of the ±5° band
const ORB_TIGHT_RADIUS = 220;    // outer edge of the ±2° band
const ORB_INNER_RADIUS = 196;    // inner cap so we leave room for planet glyphs
const PLANET_RADIUS = 168;
const ANGLE_PIN_RADIUS = 196;

const ANGLE_STYLE = {
    ASC: { tone: "var(--color-y2k-blue, #4a7cff)", label: "ASC", primary: true  },
    MC:  { tone: "var(--color-y2k-blue, #4a7cff)", label: "MC",  primary: true  },
    DSC: { tone: "var(--text-secondary)",          label: "DSC", primary: false },
    IC:  { tone: "var(--text-secondary)",          label: "IC",  primary: false },
} as const;

type AngleName = keyof typeof ANGLE_STYLE;

const PLANET_GLYPH: Record<string, string> = {
    sun:     "☉",
    moon:    "☽",
    mercury: "☿",
    venus:   "♀",
    mars:    "♂",
    jupiter: "♃",
    saturn:  "♄",
    uranus:  "♅",
    neptune: "♆",
    pluto:   "♇",
    chiron:  "⚷",
    "true node": "☊",
    "north node": "☊",
};

interface NatalPlanetInput {
    name?: string;
    planet?: string;
    longitude: number;
    retrograde?: boolean;
}

interface Props {
    geoMC: number;
    geoASC: number;
    natalPlanets: NatalPlanetInput[];
    /** Optional CSS class applied to the wrapping <figure>. */
    className?: string;
    size?: number;
    rotateTo?: number;
}

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

/** Builds an SVG annular-segment path centered on `centerLon`, spanning
 *  ±halfWidthDeg, with radius range [rIn, rOut]. Mirrors the same
 *  large-arc-flag conventions used elsewhere in this codebase's natal
 *  wheel renderers. */
function arcBand(centerLon: number, halfWidthDeg: number, rOut: number, rIn: number, asc: number): string {
    const fromLon = centerLon - halfWidthDeg;
    const toLon = centerLon + halfWidthDeg;
    const a = natalWheelSvgXY(fromLon, rOut, asc);
    const b = natalWheelSvgXY(toLon, rOut, asc);
    const c = natalWheelSvgXY(toLon, rIn, asc);
    const d = natalWheelSvgXY(fromLon, rIn, asc);
    return `M ${a.x} ${a.y} A ${rOut} ${rOut} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rIn} ${rIn} 0 0 1 ${d.x} ${d.y} Z`;
}

function arcSector(fromLon: number, toLon: number, rOut: number, rIn: number, asc: number): string {
    const a = natalWheelSvgXY(fromLon, rOut, asc);
    const b = natalWheelSvgXY(toLon, rOut, asc);
    const c = natalWheelSvgXY(toLon, rIn, asc);
    const d = natalWheelSvgXY(fromLon, rIn, asc);
    return `M ${a.x} ${a.y} A ${rOut} ${rOut} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rIn} ${rIn} 0 0 1 ${d.x} ${d.y} Z`;
}

export default function PlaceContactWheel({
    geoMC,
    geoASC,
    natalPlanets,
    className,
    size = 360,
    rotateTo,
}: Props) {
    const asc = rotateTo ?? geoASC;

    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC },
        { name: "MC",  lon: geoMC },
        { name: "DSC", lon: (geoASC + 180) % 360 },
        { name: "IC",  lon: (geoMC + 180) % 360 },
    ];

    // Pre-compute per-angle hit metadata so we know which orb bands to glow.
    // A planet is "tight" when within 2°, "wide" when within 5°.
    const angleHits = angles.map((a) => {
        let bestOrb = 999;
        for (const p of natalPlanets) {
            const orb = angularDiff(p.longitude, a.lon);
            if (orb < bestOrb) bestOrb = orb;
        }
        return {
            ...a,
            tight: bestOrb <= 2,
            wide: bestOrb <= 5,
        };
    });

    return (
        <figure
            className={className}
            style={{ width: size, maxWidth: "100%", margin: "0 auto", aspectRatio: "1 / 1" }}
        >
            <svg
                viewBox={`0 0 ${VIEW} ${VIEW}`}
                width="100%"
                height="100%"
                role="img"
                aria-label="Your chart on this place: natal planets overlaid with orb arcs at the four geodetic angles"
            >
                {/* Outer frame circle. */}
                <circle cx={WHEEL_CX} cy={WHEEL_CY} r={ZODIAC_OUTER + 12}
                    fill="var(--bg, transparent)" stroke="var(--surface-border)" strokeWidth={1} />

                {/* 12 zodiac sectors, lightly tinted so the planet ring still reads. */}
                {NATAL_WHEEL_SIGNS.map((s) => (
                    <path
                        key={`sec-${s.name}`}
                        d={arcSector(s.lon, s.lon + 30, ZODIAC_OUTER, ZODIAC_INNER, asc)}
                        fill={NATAL_WHEEL_ELEM_FILL[s.elem]}
                        stroke={NATAL_WHEEL_ELEM_STROKE[s.elem]}
                        strokeWidth={1}
                        opacity={0.7}
                    />
                ))}

                {/* Sign glyphs (smaller / dimmer to keep the focus on planets + arcs). */}
                {NATAL_WHEEL_SIGNS.map((s) => {
                    const mid = s.lon + 15;
                    const p = natalWheelSvgXY(mid, (ZODIAC_OUTER + ZODIAC_INNER) / 2, asc);
                    return (
                        <text
                            key={`glyph-${s.name}`}
                            x={p.x}
                            y={p.y}
                            fontSize={20}
                            fill="var(--text-secondary)"
                            textAnchor="middle"
                            dominantBaseline="central"
                            opacity={0.7}
                        >
                            {s.glyph}
                        </text>
                    );
                })}

                {/* Orb bands per angle: ±5° (wide) and ±2° (tight). */}
                {angleHits.map((a) => {
                    const tone = ANGLE_STYLE[a.name].tone;
                    return (
                        <g key={`orb-${a.name}`}>
                            <path
                                d={arcBand(a.lon, 5, ORB_WIDE_RADIUS, ORB_TIGHT_RADIUS, asc)}
                                fill={tone}
                                opacity={a.wide ? 0.18 : 0.06}
                            />
                            <path
                                d={arcBand(a.lon, 2, ORB_TIGHT_RADIUS, ORB_INNER_RADIUS, asc)}
                                fill={tone}
                                opacity={a.tight ? 0.32 : 0.10}
                            />
                        </g>
                    );
                })}

                {/* Angle pins at the inner edge of the orb bands. */}
                {angleHits.map((a) => {
                    const pin = natalWheelSvgXY(a.lon, ANGLE_PIN_RADIUS, asc);
                    const labelP = natalWheelSvgXY(a.lon, ZODIAC_OUTER + 38, asc);
                    const tone = ANGLE_STYLE[a.name].tone;
                    return (
                        <g key={`pin-${a.name}`}>
                            <circle cx={pin.x} cy={pin.y} r={5} fill={tone} />
                            <text
                                x={labelP.x}
                                y={labelP.y}
                                fontSize={18}
                                fontWeight={700}
                                fill={tone}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontFamily="var(--font-mono, monospace)"
                            >
                                {ANGLE_STYLE[a.name].label}
                            </text>
                        </g>
                    );
                })}

                {/* Natal planet glyphs at PLANET_RADIUS, with a faint tick out
                    to the orb-band so the eye can trace which planet activates
                    which corner. */}
                {natalPlanets.map((p, i) => {
                    const name = (p.name ?? p.planet ?? "").trim();
                    if (!name) return null;
                    const lower = name.toLowerCase();
                    const glyph = PLANET_GLYPH[lower] ?? name.charAt(0).toUpperCase();
                    const pos = natalWheelSvgXY(p.longitude, PLANET_RADIUS, asc);
                    const tickOut = natalWheelSvgXY(p.longitude, PLANET_RADIUS + 22, asc);
                    return (
                        <g key={`planet-${i}-${lower}`}>
                            <line
                                x1={pos.x}
                                y1={pos.y}
                                x2={tickOut.x}
                                y2={tickOut.y}
                                stroke="var(--text-tertiary)"
                                strokeWidth={1}
                                opacity={0.45}
                            />
                            <circle cx={pos.x} cy={pos.y} r={14}
                                fill="var(--surface)" stroke="var(--text-secondary)" strokeWidth={1} />
                            <text
                                x={pos.x}
                                y={pos.y}
                                fontSize={18}
                                fill="var(--text-primary)"
                                textAnchor="middle"
                                dominantBaseline="central"
                            >
                                {glyph}
                            </text>
                        </g>
                    );
                })}

                {/* Center dot. */}
                <circle cx={WHEEL_CX} cy={WHEEL_CY} r={3}
                    fill="var(--text-secondary)" opacity={0.4} />
            </svg>
        </figure>
    );
}
