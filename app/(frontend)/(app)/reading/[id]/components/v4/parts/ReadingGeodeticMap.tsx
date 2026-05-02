"use client";

import React, { useMemo, useState } from "react";
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
    geodeticMCSign,
} from "@/app/lib/geodetic";

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
    | null;

function paranTone(contribution: number): string {
    if (contribution > 0) return "var(--sage, #4a8a6a)";
    if (contribution < 0) return "var(--color-spiced-life)";
    return "var(--text-tertiary)";
}

function capitalize(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

export default function ReadingGeodeticMap({ lat, lon, city, parans }: Props) {
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
    const viewBox = `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`;
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
    const lowerCurve = allCurves[ascSignIndex].points;
    const upperCurve = allCurves[(ascSignIndex + 1) % 12].points;

    const zonePolygon = useMemo(() => {
        const xL = projectLon(bandStart);
        const xR = projectLon(bandEnd);
        const upperInBand = upperCurve.filter(([l]) => l >= bandStart - 0.5 && l <= bandEnd + 0.5);
        const lowerInBand = lowerCurve.filter(([l]) => l >= bandStart - 0.5 && l <= bandEnd + 0.5);
        if (upperInBand.length === 0 || lowerInBand.length === 0) return null;
        const top = upperInBand.map(([l, la]) => `${projectLon(l)},${projectLat(la)}`);
        const bottom = [...lowerInBand].reverse().map(([l, la]) => `${projectLon(l)},${projectLat(la)}`);
        return `${xL},${projectLat(upperInBand[0][1])} ${top.join(" ")} ${xR},${projectLat(lowerInBand[lowerInBand.length - 1][1])} ${bottom.join(" ")}`;
    }, [upperCurve, lowerCurve, bandStart, bandEnd]);

    const polylinePoints = (curve: Array<[number, number]>) =>
        curve.map(([l, la]) => `${projectLon(l)},${projectLat(la)}`).join(" ");

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
                {/* Landmass — token-driven for theme awareness */}
                <path
                    d={WORLD_MAP_PATH}
                    fill="color-mix(in oklab, var(--text-primary) 9%, transparent)"
                    stroke="color-mix(in oklab, var(--text-primary) 22%, transparent)"
                    strokeWidth={0.4}
                    vectorEffect="non-scaling-stroke"
                />

                {/* MC meridians — hover reveals both adjacent MC zones */}
                {GEODETIC_ZONES.map((z, idx) => {
                    const x = projectLon(z.startLon);
                    if (z.startLon < cropLonStart - 30 || z.startLon > cropLonEnd) return null;
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
                                x1={x}
                                y1={cy - vh / 2}
                                x2={x}
                                y2={cy + vh / 2}
                                stroke="transparent"
                                strokeWidth={5}
                                pointerEvents="stroke"
                            />
                            <line
                                x1={x}
                                y1={cy - vh / 2}
                                x2={x}
                                y2={cy + vh / 2}
                                stroke={elem.stroke}
                                strokeWidth={isCityBoundary ? 1 : 0.6}
                                opacity={isCityBoundary ? 0.55 : 0.32}
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

                {/* The shared zone polygon — only filled region on the map */}
                {zonePolygon && (
                    <polygon
                        points={zonePolygon}
                        fill={mcElem.fill}
                        stroke={mcElem.stroke}
                        strokeWidth={1.4}
                        opacity={0.95}
                        vectorEffect="non-scaling-stroke"
                    />
                )}

                {/* MC meridian for the city */}
                <line
                    x1={cx}
                    y1={cy - vh / 2}
                    x2={cx}
                    y2={cy + vh / 2}
                    stroke="var(--color-spiced-life)"
                    strokeWidth={1.4}
                    strokeDasharray="3 3"
                    opacity={0.85}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Equator (subtle reference) */}
                <line
                    x1={cx - vw / 2}
                    y1={projectLat(0)}
                    x2={cx + vw / 2}
                    y2={projectLat(0)}
                    stroke="color-mix(in oklab, var(--text-primary) 20%, transparent)"
                    strokeWidth={0.4}
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Paran latitudes — horizontal lines crossing your latitude band */}
                {parans?.map((par, i) => {
                    const py = projectLat(par.lat);
                    const tone = paranTone(par.contribution);
                    const xL = cx - vw / 2;
                    const xR = cx + vw / 2;
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
                            <text
                                x={xR - 1}
                                y={py - 2}
                                fontSize={8}
                                fill={tone}
                                textAnchor="end"
                                fontFamily={FONT_MONO}
                                opacity={0.85}
                                pointerEvents="none"
                            >
                                {capitalize(par.p1)}/{capitalize(par.p2)}
                            </text>
                        </g>
                    );
                })}

                {/* City pin */}
                <g>
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
                            : "Paran line"}
                    </span>
                    {hovered.kind === "PARAN" ? (
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

            {/* Legend strip */}
            <div
                className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10.5px] tracking-[0.12em] uppercase"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
            >
                <LegendItem swatch="var(--color-spiced-life)" label={`${mcSign} MC overhead`} dashed />
                <LegendItem swatch="var(--gold)" label={`${ascSign} ASC rising`} />
                <LegendItem swatch={mcElem.stroke} label="Shared zone" filled fill={mcElem.fill} />
                {parans && parans.length > 0 && (
                    <LegendItem swatch="var(--text-tertiary)" label={`${parans.length} paran ${parans.length === 1 ? "line" : "lines"}`} dashed />
                )}
            </div>
        </div>
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
