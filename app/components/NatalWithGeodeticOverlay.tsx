"use client";

/**
 * NatalWithGeodeticOverlay — wraps `NatalMockupWheel` (the user's existing
 * natal chart visual) and overlays four geodetic angle markers for the
 * destination on top.
 *
 * Why a wrapper, not a prop on NatalMockupWheel:
 *   The natal wheel is a stable, well-tested visual used elsewhere. Adding
 *   place-specific overlay logic into it would couple unrelated concerns.
 *   This wrapper renders the natal wheel as the base layer and stacks a
 *   transparent SVG above with the same viewBox (800×800) so coordinates
 *   stay aligned via the shared geometry helpers.
 *
 * What the overlay shows:
 *   - Four radial markers at geo-MC / geo-IC / geo-ASC / geo-DSC.
 *   - A faint ±5° wedge per angle that visually "lights up" when a natal
 *     planet sits inside the orb (the engine's Step 5 contact rule).
 *   - Small mono labels at the rim.
 *
 * The natal wheel never changes. The overlay tells you which corners of
 * THIS place are activated by YOUR chart.
 */

import NatalMockupWheel, { type NatalPlanet } from "./NatalMockupWheel";
import {
    NATAL_WHEEL_SIGNS as SIGNS,
    natalWheelSvgXY as svgXY,
    WHEEL_CX as CX,
    WHEEL_CY as CY,
} from "@/app/lib/natal-wheel-shared";

interface Props {
    isDark: boolean;
    planets: NatalPlanet[];
    cusps: number[];
    geoMC: number;
    geoASC: number;
    onPlanetClick?: (planetName: string) => void;
}

/** Wedge radii — sized so the overlay sits *outside* the natal wheel
 *  (which extends to R.outer = 385) without colliding with planet glyphs. */
const ORB_INNER_R = 386;
const ORB_OUTER_R = 416;
const TICK_INNER_R = 386;
const TICK_OUTER_R = 432;
const LABEL_R = 448;

const ANGLE_STYLE = {
    ASC: { tone: "var(--color-y2k-blue, #4a7cff)", primary: true  },
    MC:  { tone: "var(--color-y2k-blue, #4a7cff)", primary: true  },
    DSC: { tone: "var(--text-secondary)",          primary: false },
    IC:  { tone: "var(--text-secondary)",          primary: false },
} as const;

type AngleName = keyof typeof ANGLE_STYLE;

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

/** Annular path covering ±halfWidth degrees around `centerLon`. */
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
    const natalAsc = cusps[0] ?? 0;

    const angles: Array<{ name: AngleName; lon: number }> = [
        { name: "ASC", lon: geoASC },
        { name: "MC",  lon: geoMC },
        { name: "DSC", lon: (geoASC + 180) % 360 },
        { name: "IC",  lon: (geoMC + 180) % 360 },
    ];

    // Per-angle: does any natal planet sit inside the ±5° wedge?
    const lit = angles.map((a) => {
        const minOrb = planets.reduce(
            (best, p) => Math.min(best, angularDiff(p.longitude, a.lon)),
            999,
        );
        return { ...a, tight: minOrb <= 2, wide: minOrb <= 5 };
    });

    return (
        <div style={{ position: "relative", width: "100%" }}>
            {/* Base layer: untouched natal wheel. */}
            <NatalMockupWheel
                isDark={isDark}
                planets={planets}
                cusps={cusps}
                onPlanetClick={onPlanetClick}
            />

            {/* Overlay layer: same viewBox + asc rotation, geodetic markers only.
                pointer-events: none so hover on natal planets still works. */}
            <svg
                viewBox="0 0 800 800"
                xmlns="http://www.w3.org/2000/svg"
                aria-label={`Geodetic angle overlay for the destination`}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    pointerEvents: "none",
                }}
            >
                {/* ±5° wedges, glow when a natal planet sits inside. */}
                {lit.map((a) => (
                    <path
                        key={`wedge-${a.name}`}
                        d={arcBand(a.lon, 5, ORB_OUTER_R, ORB_INNER_R, natalAsc)}
                        fill={ANGLE_STYLE[a.name].tone}
                        opacity={a.wide ? 0.32 : 0.10}
                    />
                ))}

                {/* Radial tick at each angle longitude. */}
                {lit.map((a) => {
                    const inner = svgXY(a.lon, TICK_INNER_R, natalAsc);
                    const outer = svgXY(a.lon, TICK_OUTER_R, natalAsc);
                    const tone = ANGLE_STYLE[a.name].tone;
                    return (
                        <g key={`tick-${a.name}`}>
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

                {/* Outboard label. */}
                {lit.map((a) => {
                    const p = svgXY(a.lon, LABEL_R, natalAsc);
                    const tone = ANGLE_STYLE[a.name].tone;
                    return (
                        <text
                            key={`label-${a.name}`}
                            x={p.x}
                            y={p.y}
                            fontSize={20}
                            fontWeight={700}
                            fill={tone}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontFamily="var(--font-mono, monospace)"
                            style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 4 }}
                        >
                            {a.name}
                        </text>
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

// Keep `CX`/`CY` referenced so future overlay tweaks (a center marker, etc.)
// can use the shared geometry without re-importing.
void CX;
void CY;
