"use client";

/**
 * CityFingerprintWheel — small SVG zodiac ring showing only the four
 * geodetic angle glyphs (geo-MC / geo-IC / geo-ASC / geo-DSC) at their
 * ecliptic longitudes.
 *
 * "City fingerprint" = the time-invariant signature every visitor lands in.
 * This is intentionally chartless (no natal planets, no houses) so the user
 * can see what the place itself carries before we overlay their chart in
 * the next wheel.
 */

import {
    NATAL_WHEEL_ELEM_FILL,
    NATAL_WHEEL_ELEM_STROKE,
    NATAL_WHEEL_SIGNS,
    natalWheelSvgXY,
    WHEEL_CX,
    WHEEL_CY,
} from "@/app/lib/natal-wheel-shared";

interface Props {
    /** Geodetic-MC ecliptic longitude (deg) — geographic longitude mod 360. */
    geoMC: number;
    /** Geodetic-ASC ecliptic longitude (deg). */
    geoASC: number;
    /** Optional CSS-class for the wrapping <figure>. */
    className?: string;
    /** SVG-coordinate width/height. The SVG itself scales via CSS. */
    size?: number;
    /** Where to place the rotation reference. Default geoASC, so the wheel
     *  reads like a chart with rising on the left. */
    rotateTo?: number;
}

const VIEW = 800;
const ZODIAC_OUTER = 350;
const ZODIAC_INNER = 280;
const GLYPH_RADIUS = 245;
const ANGLE_RING = 218;

/** Colors for the four angle markers. ASC/MC = warm primary; DSC/IC =
 *  desaturated companions. Keeps the eye on the cardinal pair. */
const ANGLE_STYLE = {
    ASC: { tone: "var(--color-y2k-blue, #4a7cff)", label: "ASC" },
    MC:  { tone: "var(--color-y2k-blue, #4a7cff)", label: "MC"  },
    DSC: { tone: "var(--text-secondary)",          label: "DSC" },
    IC:  { tone: "var(--text-secondary)",          label: "IC"  },
} as const;

type AngleName = keyof typeof ANGLE_STYLE;

function signAt(lon: number) {
    const idx = Math.floor((((lon % 360) + 360) % 360) / 30) % 12;
    return NATAL_WHEEL_SIGNS[idx];
}

/** Polar arc path for a 30° zodiac sector. */
function arcSector(fromLon: number, toLon: number, rOut: number, rIn: number, asc: number): string {
    const a = natalWheelSvgXY(fromLon, rOut, asc);
    const b = natalWheelSvgXY(toLon, rOut, asc);
    const c = natalWheelSvgXY(toLon, rIn, asc);
    const d = natalWheelSvgXY(fromLon, rIn, asc);
    return `M ${a.x} ${a.y} A ${rOut} ${rOut} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rIn} ${rIn} 0 0 1 ${d.x} ${d.y} Z`;
}

export default function CityFingerprintWheel({
    geoMC,
    geoASC,
    className,
    size = 320,
    rotateTo,
}: Props) {
    const asc = rotateTo ?? geoASC;

    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC },
        { name: "MC",  lon: geoMC },
        { name: "DSC", lon: (geoASC + 180) % 360 },
        { name: "IC",  lon: (geoMC + 180) % 360 },
    ];

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
                aria-label="City fingerprint wheel: zodiac with the four geodetic angles"
            >
                {/* Background outer ring — keeps the wheel readable on either bg. */}
                <circle cx={WHEEL_CX} cy={WHEEL_CY} r={ZODIAC_OUTER + 12}
                    fill="var(--bg, transparent)" stroke="var(--surface-border)" strokeWidth={1} />

                {/* 12 zodiac sectors with element-tinted fills. */}
                {NATAL_WHEEL_SIGNS.map((s) => (
                    <path
                        key={`sec-${s.name}`}
                        d={arcSector(s.lon, s.lon + 30, ZODIAC_OUTER, ZODIAC_INNER, asc)}
                        fill={NATAL_WHEEL_ELEM_FILL[s.elem]}
                        stroke={NATAL_WHEEL_ELEM_STROKE[s.elem]}
                        strokeWidth={1}
                    />
                ))}

                {/* Sign glyphs at each sector midpoint. */}
                {NATAL_WHEEL_SIGNS.map((s) => {
                    const mid = s.lon + 15;
                    const p = natalWheelSvgXY(mid, (ZODIAC_OUTER + ZODIAC_INNER) / 2, asc);
                    return (
                        <text
                            key={`glyph-${s.name}`}
                            x={p.x}
                            y={p.y}
                            fontSize={26}
                            fill="var(--text-primary)"
                            textAnchor="middle"
                            dominantBaseline="central"
                            opacity={0.85}
                        >
                            {s.glyph}
                        </text>
                    );
                })}

                {/* Inner ring boundary — visual frame for the angle markers. */}
                <circle cx={WHEEL_CX} cy={WHEEL_CY} r={ANGLE_RING}
                    fill="none" stroke="var(--surface-border)" strokeWidth={1} strokeDasharray="2,3" />

                {/* The four geodetic angles, drawn as radial lines + outboard pills. */}
                {angles.map((a) => {
                    const inner = natalWheelSvgXY(a.lon, ANGLE_RING, asc);
                    const outer = natalWheelSvgXY(a.lon, ZODIAC_OUTER + 4, asc);
                    const labelP = natalWheelSvgXY(a.lon, ZODIAC_OUTER + 38, asc);
                    const tone = ANGLE_STYLE[a.name].tone;
                    return (
                        <g key={`angle-${a.name}`}>
                            <line
                                x1={inner.x}
                                y1={inner.y}
                                x2={outer.x}
                                y2={outer.y}
                                stroke={tone}
                                strokeWidth={2.5}
                                strokeLinecap="round"
                            />
                            <circle cx={inner.x} cy={inner.y} r={5} fill={tone} />
                            <text
                                x={labelP.x}
                                y={labelP.y}
                                fontSize={20}
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

                {/* Center dot (chartless — no planets, no houses). */}
                <circle cx={WHEEL_CX} cy={WHEEL_CY} r={4}
                    fill="var(--text-secondary)" opacity={0.5} />
            </svg>
        </figure>
    );
}

/** Public helper: maps a longitude to the matching sign object. Useful for
 *  the bullets rendered next to the wheel ("MC: Capricorn — career runs
 *  structured…"). Exported here so the Place tab doesn't need to import
 *  the raw zodiac data. */
export function angleSignAt(lon: number) {
    return signAt(lon);
}
