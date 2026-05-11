"use client";

import React, { useId, useMemo, useState } from "react";
import { WORLD_MAP_PATH } from "@/app/components/worldMapPath";
import {
    GEODETIC_ZONES,
    projectLon,
    projectLat,
    ELEMENT_COLORS,
} from "@/app/geodetic/data/geodeticZones";
import {
    geodeticASCLongitude,
    geodeticASCSign,
    geodeticMCLongitude,
    geodeticMCSign,
} from "@/app/lib/geodetic";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import { PLANET_PATHS } from "@/app/components/PlanetIcon";

const FONT_MONO = "var(--font-mono, monospace)";
const FONT_PRIMARY = "var(--font-primary, serif)";

const SIGNS_ORDERED = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

interface ParanOverlay {
    p1: string;
    p2: string;
    aspect?: string;
    lat: number;
    contribution: number;
}

interface Props {
    lat: number;
    lon: number;
    city: string;
    /** Optional paran latitudes to overlay as horizontal lines. Lines outside
     *  the cropped viewport are clipped automatically. */
    parans?: ParanOverlay[];
    /** When false, paran latitude lines are hidden entirely. Lets the parent
     *  expose a layer toggle without forking the parans prop. Defaults true
     *  for backwards compatibility with existing call sites. */
    showParans?: boolean;
    /** Hide the legend strip below the map — useful when the parent already
     *  renders its own legend (e.g. in a two-column sticky layout). */
    showLegend?: boolean;
    /** When provided, the unified legend renders an inline paran toggle. */
    onToggleParans?: () => void;
    /** Total paran count for the toggle's label. */
    paransCount?: number;
}

function shortestDelta(a: number, b: number): number {
    return ((a - b) + 540) % 360 - 180;
}

function solveLatForAsc(lonDeg: number, targetDeg: number): number | null {
    // Reachability gate. ASC = atan2(cos(lon), x); sign(sin(ASC)) must equal
    // sign(cos(lon)). If the target's y-sign disagrees with this longitude's
    // y-sign, no real crossing exists — bail before the binary search can
    // converge to a phantom solution at the ±180° discontinuity in
    // shortestDelta.
    const yTarget = Math.sin(targetDeg * (Math.PI / 180));
    const yLon = Math.cos(lonDeg * (Math.PI / 180));
    const EPS = 1e-6;
    if (Math.abs(yTarget) > EPS && Math.abs(yLon) > EPS) {
        if (Math.sign(yTarget) !== Math.sign(yLon)) return null;
    }
    const TOL = 0.02;
    let lo = -84;
    let hi = 84;
    const fLo = shortestDelta(geodeticASCLongitude(lonDeg, lo), targetDeg);
    const fHi = shortestDelta(geodeticASCLongitude(lonDeg, hi), targetDeg);
    if (Math.sign(fLo) === Math.sign(fHi)) return null;
    for (let iter = 0; iter < 40; iter++) {
        const mid = (lo + hi) / 2;
        const f = shortestDelta(geodeticASCLongitude(lonDeg, mid), targetDeg);
        if (Math.abs(f) < TOL) return mid;
        if (Math.sign(f) === Math.sign(fLo)) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

function buildAscCurve(targetDeg: number, lonStart: number, lonEnd: number, step = 1): Array<[number, number]> {
    const points: Array<[number, number]> = [];
    for (let lon = lonStart; lon <= lonEnd; lon += step) {
        const lat = solveLatForAsc(lon, targetDeg);
        if (lat !== null) points.push([lon, lat]);
    }
    return points;
}

type HoveredAxis =
    | { kind: "MC"; westSign: string; eastSign: string; color: string }
    | { kind: "ASC"; southSign: string; northSign: string; color: string }
    | { kind: "PARAN"; p1: string; p2: string; aspect?: string; lat: number; contribution: number; color: string }
    | { kind: "CITY"; mcLon: number; ascLon: number; mcSign: string; ascSign: string; color: string }
    | null;

/** Format an ecliptic longitude as "DD.DD° Sign" (e.g., 174.76 → "24.76° Virgo"). */
function formatZodiac(eclipticLon: number): string {
    const lon = ((eclipticLon % 360) + 360) % 360;
    const sign = SIGNS_ORDERED[Math.floor(lon / 30)];
    const within = lon - Math.floor(lon / 30) * 30;
    return `${within.toFixed(2)}° ${sign}`;
}

function paranTone(contribution: number): string {
    if (contribution > 0) return "var(--sage, #4a8a6a)";
    if (contribution < 0) return "var(--color-spiced-life)";
    return "var(--text-tertiary)";
}

function capitalize(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

export default function ReadingGeodeticMap({ lat, lon, city, parans, showParans = true, showLegend = true, onToggleParans, paransCount = 0 }: Props) {
    const reactId = useId();
    const clipId = `rg-map-clip-${reactId.replace(/:/g, "")}`;
    const [hovered, setHovered] = useState<HoveredAxis>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const handleMove = (e: React.MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    const ascSign = geodeticASCSign(lon, lat);
    const mcSign = geodeticMCSign(lon);
    const ascSignIndex = SIGNS_ORDERED.indexOf(ascSign);
    const mcZone = GEODETIC_ZONES.find(
        (z) => lon >= z.startLon && lon < z.startLon + 30,
    ) ?? GEODETIC_ZONES[0];
    const mcElem = ELEMENT_COLORS[mcZone.elem];

    const bandStart = mcZone.startLon;
    const bandEnd = bandStart + 30;

    const cropWidthDeg = 84;
    const cropHeightDeg = 56;
    const cx = projectLon(lon);
    const cy = projectLat(lat);
    const vw = cropWidthDeg * (1000 / 360);
    const vh = cropHeightDeg * (500 / 180);
    // ── Antimeridian-safe projection ────────────────────────────────────
    // The shared `projectLon` wraps at ±180° (modular). For cities near the
    // dateline (Auckland, Suva, Anchorage…) the viewport straddles 180°,
    // so any longitude on the "far side" of the seam projects to a tiny x
    // and falls off the visible canvas. We re-express each longitude in the
    // city-centered window (cityLon-180°, cityLon+180°] before projecting,
    // giving a continuous x range across the seam. Equivalent to D3's
    // `geoIdentity().clipAngle(null)` re-centered on the city.
    const pX = (lonDeg: number) => {
        const raw = projectLon(lonDeg);
        if (raw < cx - 500) return raw + 1000;
        if (raw > cx + 500) return raw - 1000;
        return raw;
    };
    // Single ruler strip: MC along the top. The ASC axis is communicated by
    // the gold ASC boundary curves drawn on-map; paran latitudes are
    // labeled directly via planet glyphs sitting on each paran line.
    const padTop = 26;
    const padLeft = 0;
    const xViewLeft = cx - vw / 2;
    const yViewTop = cy - vh / 2;
    const yViewBottom = cy + vh / 2;
    const xViewRight = cx + vw / 2;
    const viewBox = `${xViewLeft - padLeft} ${yViewTop - padTop} ${vw + padLeft} ${vh + padTop}`;
    const cropLonStart = lon - cropWidthDeg / 2 - 6;
    const cropLonEnd = lon + cropWidthDeg / 2 + 6;

    const allCurves = useMemo(
        () => SIGNS_ORDERED.map((sign, i) => ({
            sign,
            targetDeg: i * 30,
            points: buildAscCurve(i * 30, cropLonStart, cropLonEnd),
        })),
        [cropLonStart, cropLonEnd],
    );
const zonePolygon = (() => {
        // Rasterize the MC × ASC region directly: at every longitude in the
        // MC band, find the latitude range where geodeticASCSign() matches
        // the city's ASC sign. This avoids the boundary-curve approach,
        // which fails at the cardinal ASC degrees (0°, 90°, 180°, 270°)
        // because those boundaries are mathematically degenerate — the
        // ASC=180° "curve," for example, only exists at the single point
        // (lon=90°, lat=0°) in the geodetic system. Going to lon=120° the
        // boundary has no finite latitude; Libra extends asymptotically
        // toward the pole. Sampling avoids this entirely: it just asks
        // "at this lon, where IS my ASC sign?" and lets the polygon
        // shape itself.
        const top: string[] = [];
        const bottom: string[] = [];
        let valid = 0;
        for (let l = bandStart; l <= bandEnd; l += 1) {
            let minLat: number | null = null;
            let maxLat: number | null = null;
            for (let la = -84; la <= 84; la += 1) {
                if (geodeticASCSign(l, la) === ascSign) {
                    if (minLat === null) minLat = la;
                    maxLat = la;
                }
            }
            if (minLat !== null && maxLat !== null) {
                valid++;
                top.push(`${pX(l)},${projectLat(maxLat)}`);
                bottom.push(`${pX(l)},${projectLat(minLat)}`);
            }
        }
        if (valid < 2) return null;
        return [...top, ...bottom.reverse()].join(" ");
    })();

    const polylinePoints = (curve: Array<[number, number]>) =>
        curve.map(([l, la]) => `${pX(l)},${projectLat(la)}`).join(" ");

    return (
        <div className="relative w-full">
            <svg
                viewBox={viewBox}
                className="w-full h-auto block"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    background: "color-mix(in oklab, var(--text-primary) 2%, var(--bg))",
                    borderRadius: "var(--shape-asymmetric-sm, 8px)",
                }}
            >
                <defs>
                    {/* Clip the map content to the unpadded viewport so the
                     *  world path / curves / parans never bleed into the
                     *  zodiac ruler strips drawn outside this region. */}
                    <clipPath id={clipId}>
                        <rect x={xViewLeft} y={yViewTop} width={vw} height={vh} />
                    </clipPath>
                </defs>

                <g clipPath={`url(#${clipId})`}>
                {/* Landmass — drawn at three offsets (-1000, 0, +1000 SVG-units,
                 *  i.e. one full world-width). The clipPath above keeps each
                 *  copy confined to the visible viewport, so for cities near
                 *  the antimeridian (Auckland, Suva, Anchorage…) the dateline
                 *  seam is bridged by whichever copy intersects the window. */}
                {[-1000, 0, 1000].map((dx) => (
                    <path
                        key={`world-${dx}`}
                        transform={dx ? `translate(${dx} 0)` : undefined}
                        d={WORLD_MAP_PATH}
                        fill="color-mix(in oklab, var(--text-primary) 9%, transparent)"
                        stroke="color-mix(in oklab, var(--text-primary) 22%, transparent)"
                        strokeWidth={0.4}
                        vectorEffect="non-scaling-stroke"
                    />
                ))}

                {/* MC band shading — full-height tinted strips per zone.
                 *  Kept *below* the polygon in saturation so the eye reads
                 *  MC × ASC intersection (the polygon) first, with the band
                 *  tint acting as quiet contextual backdrop. */}
                {GEODETIC_ZONES.map((z) => {
                    const xL = pX(z.startLon);
                    const xR = pX(z.startLon + 30);
                    if (xR < xViewLeft || xL > xViewRight) return null;
                    const elem = ELEMENT_COLORS[z.elem];
                    const isCity = z.id === mcZone.id;
                    return (
                        <rect
                            key={`mc-band-${z.id}`}
                            x={xL}
                            y={yViewTop}
                            width={xR - xL}
                            height={vh}
                            fill={elem.fill}
                            opacity={isCity ? 0.30 : 0.20}
                            pointerEvents="none"
                        />
                    );
                })}

                {/* MC meridians — hover reveals both adjacent MC zones */}
                {GEODETIC_ZONES.map((z, idx) => {
                    const x = pX(z.startLon);
                    if (x < xViewLeft - 30 || x > xViewRight + 30) return null;
                    const elem = ELEMENT_COLORS[z.elem];
                    const isCityBoundary = z.id === mcZone.id;
                    const westSign = GEODETIC_ZONES[(idx - 1 + GEODETIC_ZONES.length) % GEODETIC_ZONES.length].sign;
                    const eastSign = z.sign;
                    return (
                        <g
                            key={`mc-${z.id}`}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHovered({ kind: "MC", westSign, eastSign, color: elem.stroke })}
                            onMouseMove={handleMove}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <line
                                x1={x} y1={yViewTop} x2={x} y2={yViewBottom}
                                stroke="transparent"
                                strokeWidth={5}
                                pointerEvents="stroke"
                            />
                            <line
                                x1={x} y1={yViewTop} x2={x} y2={yViewBottom}
                                stroke={elem.stroke}
                                strokeWidth={isCityBoundary ? 1.8 : 1.2}
                                opacity={isCityBoundary ? 0.85 : 0.6}
                                vectorEffect="non-scaling-stroke"
                                pointerEvents="none"
                            />
                        </g>
                    );
                })}

                {/* ASC boundary curves — hover reveals both adjacent ASC zones */}
                {allCurves.map((curve, i) => {
                    if (curve.points.length < 2) return null;
                    const isBracket = i === ascSignIndex || i === (ascSignIndex + 1) % 12;
                    const pts = polylinePoints(curve.points);
                    const southSign = SIGNS_ORDERED[(i - 1 + 12) % 12];
                    const northSign = curve.sign;
                    return (
                        <g
                            key={`asc-${i}`}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHovered({ kind: "ASC", southSign, northSign, color: "var(--gold)" })}
                            onMouseMove={handleMove}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <polyline
                                points={pts}
                                fill="none"
                                stroke="transparent"
                                strokeWidth={5}
                                pointerEvents="stroke"
                            />
                            <polyline
                                points={pts}
                                fill="none"
                                stroke="var(--gold)"
                                strokeWidth={isBracket ? 1.4 : 0.6}
                                strokeDasharray={isBracket ? undefined : "2 3"}
                                opacity={isBracket ? 0.95 : 0.4}
                                vectorEffect="non-scaling-stroke"
                                pointerEvents="none"
                            />
                        </g>
                    );
                })}

                {/* The shared zone polygon — the *primary* visual emphasis
                 *  on the map. Uses the saturated element-stroke color as
                 *  the fill (vs. the lighter element-fill used for the band
                 *  shading), so MC × ASC intersection reads first. */}
                {zonePolygon && (
                    <polygon
                        points={zonePolygon}
                        fill={mcElem.stroke}
                        stroke={mcElem.stroke}
                        strokeWidth={1.8}
                        fillOpacity={0.55}
                        strokeOpacity={0.95}
                        vectorEffect="non-scaling-stroke"
                    />
                )}

                {/* MC meridian for the city */}
                <line
                    x1={cx}
                    y1={yViewTop}
                    x2={cx}
                    y2={yViewBottom}
                    stroke="var(--color-spiced-life)"
                    strokeWidth={1.4}
                    strokeDasharray="3 3"
                    opacity={0.85}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Degenerate cardinal ASC boundaries — ASC=0° and ASC=180°
                 *  collapse to vertical meridians (lon=270°E and 90°E
                 *  respectively) instead of curves. Rendered AFTER polygon +
                 *  city MC line so the gold reads cleanly through the
                 *  saturated polygon stroke that sits on the same x. */}
                {[
                    { targetDeg: 180, meridianLon: 90, southSign: "Virgo", northSign: "Libra" },
                    { targetDeg: 0, meridianLon: -90, southSign: "Pisces", northSign: "Aries" },
                ].map(({ targetDeg, meridianLon, southSign, northSign }) => {
                    const x = pX(meridianLon);
                    if (x < xViewLeft - 5 || x > xViewRight + 5) return null;
                    const isBracket = targetDeg === ascSignIndex * 30
                        || targetDeg === ((ascSignIndex + 1) % 12) * 30;
                    return (
                        <g
                            key={`asc-cardinal-${targetDeg}`}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHovered({ kind: "ASC", southSign, northSign, color: "var(--gold)" })}
                            onMouseMove={handleMove}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <line x1={x} y1={yViewTop} x2={x} y2={yViewBottom}
                                stroke="transparent" strokeWidth={5}
                                pointerEvents="stroke" />
                            <line x1={x} y1={yViewTop} x2={x} y2={yViewBottom}
                                stroke="var(--gold)"
                                strokeWidth={isBracket ? 1.8 : 0.8}
                                strokeDasharray={isBracket ? undefined : "3 3"}
                                opacity={isBracket ? 1 : 0.55}
                                vectorEffect="non-scaling-stroke"
                                pointerEvents="none" />
                        </g>
                    );
                })}

                {/* Equator (subtle reference) */}
                <line
                    x1={xViewLeft}
                    y1={projectLat(0)}
                    x2={xViewRight}
                    y2={projectLat(0)}
                    stroke="color-mix(in oklab, var(--text-primary) 20%, transparent)"
                    strokeWidth={0.4}
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Paran latitudes — horizontal lines crossing your latitude band.
                 *  Labels intentionally not rendered on the map — they collide
                 *  when ≥2 parans land within ~3° of each other. The parent
                 *  surfaces the labels in the latitude-crossings list, where
                 *  the planet pair gets a full row of breathing room. */}
                {showParans && parans?.map((par, i) => {
                    const py = projectLat(par.lat);
                    const tone = paranTone(par.contribution);
                    const xL = xViewLeft;
                    const xR = xViewRight;
                    return (
                        <g
                            key={`paran-${i}`}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHovered({ kind: "PARAN", p1: par.p1, p2: par.p2, aspect: par.aspect, lat: par.lat, contribution: par.contribution, color: tone })}
                            onMouseMove={handleMove}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <line
                                x1={xL} y1={py} x2={xR} y2={py}
                                stroke="transparent"
                                strokeWidth={5}
                                pointerEvents="stroke"
                            />
                            <line
                                x1={xL} y1={py} x2={xR} y2={py}
                                stroke={tone}
                                strokeWidth={1}
                                strokeDasharray="4 3"
                                opacity={0.65}
                                vectorEffect="non-scaling-stroke"
                                pointerEvents="none"
                            />
                            {/* Planet glyphs sit at the line's endpoints with
                             *  a small rounded swatch behind so they read
                             *  against landmass and ocean equally. */}
                            <PlanetGlyph planet={par.p1} cx={xL + 7} cy={py} size={9} color={tone} />
                            <PlanetGlyph planet={par.p2} cx={xR - 7} cy={py} size={9} color={tone} />
                        </g>
                    );
                })}

                {/* City pin — hover reveals geodetic MC + ASC in zodiac coords */}
                <g
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHovered({
                        kind: "CITY",
                        mcLon: geodeticMCLongitude(lon),
                        ascLon: geodeticASCLongitude(lon, lat),
                        mcSign,
                        ascSign,
                        color: "var(--color-spiced-life)",
                    })}
                    onMouseMove={handleMove}
                    onMouseLeave={() => setHovered(null)}
                >
                    <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="var(--color-spiced-life)"
                        stroke="var(--bg)"
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                    />
                    <circle
                        cx={cx}
                        cy={cy}
                        r={11}
                        fill="none"
                        stroke="var(--color-spiced-life)"
                        strokeWidth={0.8}
                        opacity={0.5}
                        vectorEffect="non-scaling-stroke"
                    />
                    <text
                        x={cx + 9}
                        y={cy - 7}
                        fontSize={11}
                        fill="var(--text-primary)"
                        fontFamily={FONT_PRIMARY}
                    >
                        {city}
                    </text>
                </g>
                </g>

                {/* ── Zodiac rulers (MC + ASC) ───────────────────────────
                 *  Top edge labels the MC sign for each 30° meridian band;
                 *  left edge labels the ASC sign for each ascending band
                 *  (sliced at the city's longitude). Each segment is back-
                 *  tinted with its zodiac element color so the rulers also
                 *  serve as a fire/earth/air/water key.
                 */}

                {/* TOP ruler — element-tinted band per MC zone */}
                {GEODETIC_ZONES.map((z) => {
                    const xL = pX(z.startLon);
                    const xR = pX(z.startLon + 30);
                    if (xR < xViewLeft - padLeft || xL > xViewRight) return null;
                    const elem = ELEMENT_COLORS[z.elem];
                    const isCity = z.id === mcZone.id;
                    return (
                        <rect key={`mc-tint-${z.id}`}
                            x={Math.max(xL, xViewLeft - padLeft)}
                            y={yViewTop - padTop}
                            width={Math.min(xR, xViewRight) - Math.max(xL, xViewLeft - padLeft)}
                            height={padTop}
                            fill={isCity ? elem.stroke : elem.fill}
                            opacity={isCity ? 0.55 : 0.7} />
                    );
                })}

                {/* Hairline separator between map and MC ruler */}
                <line x1={xViewLeft} y1={yViewTop} x2={xViewRight} y2={yViewTop}
                    stroke="color-mix(in oklab, var(--text-primary) 18%, transparent)"
                    strokeWidth={0.5} vectorEffect="non-scaling-stroke" />

                {/* TOP ruler — MC glyphs (active sign 1.4× larger, full color;
                 *  neighbors ghosted so the city's MC anchor reads first) */}
                {GEODETIC_ZONES.map((z) => {
                    const x = pX(z.startLon + 15);
                    if (x < xViewLeft + 6 || x > xViewRight - 6) return null;
                    const isCity = z.id === mcZone.id;
                    return (
                        <GlyphMarker key={`mc-${z.id}`} sign={z.sign}
                            x={x} y={yViewTop - padTop * 0.60}
                            size={isCity ? 14 : 10}
                            color={isCity ? "var(--color-spiced-life)" : "var(--text-secondary)"}
                            opacity={isCity ? 1 : 0.45} />
                    );
                })}
                <text x={cx} y={yViewTop - padTop * 0.18} textAnchor="middle"
                    fontSize={4.2} fontFamily={FONT_MONO}
                    letterSpacing={0.6} fill="var(--color-spiced-life)" opacity={0.9}>
                    MC · {mcSign.toUpperCase()}
                </text>

            </svg>

            {/* Floating hover card */}
            {hovered && (
                <div
                    style={{
                        position: "fixed",
                        left: mousePos.x + 15,
                        top: mousePos.y + 15,
                        background: "var(--surface, var(--bg))",
                        border: `1px solid ${hovered.color}`,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm, 6px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                        pointerEvents: "none",
                        zIndex: 9999,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        minWidth: 180,
                    }}
                >
                    <span
                        style={{
                            fontFamily: FONT_MONO,
                            fontSize: "0.6rem",
                            color: "var(--text-tertiary)",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                        }}
                    >
                        {hovered.kind === "MC" ? "Midheaven boundary"
                            : hovered.kind === "ASC" ? "Ascendant boundary"
                            : hovered.kind === "CITY" ? `${city} · geodetic position`
                            : "Paran line"}
                    </span>
                    {hovered.kind === "CITY" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                                <span style={{ fontFamily: FONT_MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-tertiary)", minWidth: 24 }}>MC</span>
                                <span style={{ fontFamily: FONT_PRIMARY, fontSize: "1rem", color: "var(--color-spiced-life)", fontWeight: 500 }}>
                                    {formatZodiac(hovered.mcLon)}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                                <span style={{ fontFamily: FONT_MONO, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-tertiary)", minWidth: 24 }}>ASC</span>
                                <span style={{ fontFamily: FONT_PRIMARY, fontSize: "1rem", color: "var(--gold)", fontWeight: 500 }}>
                                    {formatZodiac(hovered.ascLon)}
                                </span>
                            </div>
                        </div>
                    ) : hovered.kind === "PARAN" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ fontFamily: FONT_PRIMARY, fontSize: "0.95rem", color: hovered.color }}>
                                {capitalize(hovered.p1)} {hovered.aspect ? hovered.aspect : "—"} {capitalize(hovered.p2)}
                            </div>
                            <div style={{ fontFamily: FONT_MONO, fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                                {hovered.lat.toFixed(2)}° · {Math.abs(hovered.lat - lat).toFixed(1)}° {hovered.lat > lat ? "north" : "south"} of you · {hovered.contribution > 0 ? "+" : ""}{Math.round(hovered.contribution)}
                            </div>
                        </div>
                    ) : hovered.kind === "MC" ? (
                        <div className="flex items-baseline gap-2" style={{ color: hovered.color }}>
                            <span style={{ fontFamily: FONT_PRIMARY, fontSize: "1rem", fontWeight: 500 }}>
                                {hovered.westSign}
                            </span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: "0.7rem", opacity: 0.7 }}>← west</span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: "0.85rem", opacity: 0.5 }}>·</span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: "0.7rem", opacity: 0.7 }}>east →</span>
                            <span style={{ fontFamily: FONT_PRIMARY, fontSize: "1rem", fontWeight: 500 }}>
                                {hovered.eastSign}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-2" style={{ color: hovered.color }}>
                            <span style={{ fontFamily: FONT_PRIMARY, fontSize: "1rem", fontWeight: 500 }}>
                                {hovered.northSign}
                            </span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: "0.7rem", opacity: 0.7 }}>↑ north</span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: "0.85rem", opacity: 0.5 }}>·</span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: "0.7rem", opacity: 0.7 }}>south ↓</span>
                            <span style={{ fontFamily: FONT_PRIMARY, fontSize: "1rem", fontWeight: 500 }}>
                                {hovered.southSign}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Trimmed legend — the four-edge ruler now self-labels the
             *  chart angles, so the legend below carries only the things
             *  the rulers cannot explain: the polygon's identity and the
             *  paran-layer toggle. */}
            {showLegend && (
                <div
                    className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10.5px] tracking-[0.12em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    <LegendItem swatch={mcElem.stroke} label={`${mcSign} MC × ${ascSign} ASC`} filled fill={mcElem.fill} />
                    {onToggleParans && paransCount > 0 ? (
                        <button
                            type="button"
                            onClick={onToggleParans}
                            aria-pressed={showParans}
                            className="inline-flex items-center gap-2 cursor-pointer"
                            style={{
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                fontFamily: FONT_MONO,
                                fontSize: "inherit",
                                letterSpacing: "inherit",
                                textTransform: "inherit",
                                color: showParans ? "var(--text-secondary)" : "var(--text-tertiary)",
                            }}
                        >
                            <span
                                aria-hidden="true"
                                className="inline-block w-[14px] h-[2px]"
                                style={{
                                    background: showParans
                                        ? "repeating-linear-gradient(90deg, var(--text-secondary) 0 4px, transparent 4px 7px)"
                                        : "color-mix(in oklab, var(--text-tertiary) 40%, transparent)",
                                }}
                            />
                            <span>
                                {showParans ? "Hide" : "Show"} {paransCount} paran {paransCount === 1 ? "line" : "lines"}
                            </span>
                        </button>
                    ) : (
                        showParans && parans && parans.length > 0 && (
                            <LegendItem swatch="var(--text-tertiary)" label={`${parans.length} paran ${parans.length === 1 ? "line" : "lines"}`} dashed />
                        )
                    )}
                </div>
            )}
        </div>
    );
}

function PlanetGlyph({ planet, cx, cy, size, color }: {
    planet: string;
    cx: number;
    cy: number;
    size: number;
    color: string;
}) {
    const key = capitalize(planet?.split("-")[0] ?? "");
    const path = PLANET_PATHS[key];
    if (!path) return null;
    const s = size / 20;
    return (
        <g pointerEvents="none">
            {/* Token-aware swatch keeps the glyph legible against landmass
             *  + ocean without forcing a hard background color. */}
            <circle cx={cx} cy={cy} r={size / 1.6}
                fill="var(--bg)" stroke={color}
                strokeWidth={0.6} opacity={0.85}
                vectorEffect="non-scaling-stroke" />
            <g
                transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${s})`}
                style={{ color }}
                aria-label={key}
                dangerouslySetInnerHTML={{ __html: path }}
            />
        </g>
    );
}

function GlyphMarker({ sign, x, y, size, color, opacity = 1 }: {
    sign: string;
    x: number;
    y: number;
    size: number;
    color: string;
    opacity?: number;
}) {
    const path = SIGN_PATHS[sign];
    if (!path) return null;
    // SIGN_PATHS use a 20×20 viewBox; translate to (x,y) then scale.
    const s = size / 20;
    return (
        <g
            transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}
            style={{ color }}
            opacity={opacity}
            aria-label={`${sign} glyph`}
            dangerouslySetInnerHTML={{ __html: path }}
        />
    );
}

function LegendItem({
    swatch,
    label,
    dashed,
    filled,
    fill,
}: {
    swatch: string;
    label: string;
    dashed?: boolean;
    filled?: boolean;
    fill?: string;
}) {
    return (
        <span className="inline-flex items-center gap-2">
            {filled ? (
                <span
                    className="inline-block w-[14px] h-[10px] border"
                    style={{ background: fill, borderColor: swatch }}
                />
            ) : (
                <span
                    className="inline-block w-[14px] h-[2px]"
                    style={{
                        background: dashed
                            ? `repeating-linear-gradient(90deg, ${swatch} 0 4px, transparent 4px 7px)`
                            : swatch,
                    }}
                />
            )}
            <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        </span>
    );
}
