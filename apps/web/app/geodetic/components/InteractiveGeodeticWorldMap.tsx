"use client";

import React, { useMemo, useState } from "react";
import { WORLD_MAP_PATH } from "@/app/components/worldMapPath";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import { GEODETIC_ZONES, projectLon, projectLat, ELEMENT_COLORS } from "../data/geodeticZones";
import { geodeticASCLongitude } from "@/app/lib/geodetic";

// ── Ascendant-boundary curves ────────────────────────────────────────────
// For each sign boundary (0°, 30°, 60°, … 330° ecliptic), find the lat at
// each longitude where the geodetic ASC equals that boundary. Connecting
// those (lat, lon) pairs gives a curve on the map that separates two ASC
// sign zones. These are the "ASC lines" — they snake across the globe
// because the ASC depends on both longitude and latitude.
//
// The ASC curves in the PDF's Geodetic 101 diagram (p.2) are exactly this
// set: 12 curves that partition the earth into ASC-sign regions, rendered
// on top of the 12 straight MC-sign meridian bands. With the formula
// fixed, we can compute them correctly and use them to confirm claims
// like "this part of Europe has Leo rising."

interface AscBoundary {
    targetDeg: number;       // 0, 30, 60, … 330
    signEnteringOnNorth: string; // the sign the ASC enters as you move north across this curve at a fixed longitude
    points: Array<[number, number]>; // (lonDeg, latDeg) samples forming the curve
}

const SIGNS_ORDERED = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/**
 * At a given longitude, the geodetic ASC is a monotonic function of
 * latitude (proven by atan2 with fixed y = cos(LST) and x ranging from
 * +∞ to −∞ as lat goes from −90° to +90°). Binary-search for the latitude
 * where ASC equals `targetDeg`. Returns null if the target lies outside
 * the achievable range at this longitude.
 */
function solveLatForAsc(lonDeg: number, targetDeg: number): number | null {
    const TOL = 0.02;
    let lo = -84;
    let hi = 84;
    const fLo = shortestDelta(geodeticASCLongitude(lonDeg, lo), targetDeg);
    const fHi = shortestDelta(geodeticASCLongitude(lonDeg, hi), targetDeg);
    if (Math.sign(fLo) === Math.sign(fHi)) return null; // no crossing in range

    for (let iter = 0; iter < 40; iter++) {
        const mid = (lo + hi) / 2;
        const f = shortestDelta(geodeticASCLongitude(lonDeg, mid), targetDeg);
        if (Math.abs(f) < TOL) return mid;
        if (Math.sign(f) === Math.sign(fLo)) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

/** Signed angular difference a − b in [-180, 180]. */
function shortestDelta(a: number, b: number): number {
    let d = ((a - b) + 540) % 360 - 180;
    return d;
}

function buildAscBoundaries(): AscBoundary[] {
    const boundaries: AscBoundary[] = [];
    for (let i = 0; i < 12; i++) {
        const targetDeg = i * 30;
        const points: Array<[number, number]> = [];
        for (let lon = -180; lon <= 180; lon += 2) {
            const lat = solveLatForAsc(lon, targetDeg);
            if (lat !== null) points.push([lon, lat]);
        }
        boundaries.push({
            targetDeg,
            signEnteringOnNorth: SIGNS_ORDERED[i],
            points,
        });
    }
    return boundaries;
}

function polylinePoints(curve: Array<[number, number]>): string {
    return curve.map(([lon, lat]) => `${projectLon(lon)},${projectLat(lat)}`).join(" ");
}

export default function InteractiveGeodeticWorldMap({ className }: { className?: string }) {
    const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
    const isDark = true;

    const ascBoundaries = useMemo(() => buildAscBoundaries(), []);

    // Which ASC-rising zone corresponds to the hovered sign zone?
    // Each sign S "is rising" in the band between ASC boundary S.start
    // (i.e. targetDeg = signIndex*30) and the next boundary (signIndex+1)*30.
    const activeSign = activeZoneId
        ? GEODETIC_ZONES.find((z) => z.id === activeZoneId)?.sign
        : null;
    const activeSignIndex = activeSign ? SIGNS_ORDERED.indexOf(activeSign) : -1;

    return (
        <div className={`relative ${className || ""}`}>
            <svg
                viewBox="0 0 1000 500"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                style={{ display: "block" }}
            >
                <defs>
                    {GEODETIC_ZONES.map((z) => (
                        <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.05" />
                        </linearGradient>
                    ))}
                    {/* ASC curve stroke — a warmer gold so they read as a distinct layer from MC red. */}
                    <linearGradient id="asc-curve" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(201,169,110,0.7)" />
                        <stop offset="100%" stopColor="rgba(201,169,110,0.7)" />
                    </linearGradient>
                </defs>

                {/* World Map Landmass */}
                <path
                    d={WORLD_MAP_PATH}
                    fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(27,27,27,0.12)"}
                    stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(27,27,27,0.3)"}
                    strokeWidth="0.5"
                />

                {/* Geodetic MC Zone Bands (time-invariant, 12 × 30° longitudinal strips) */}
                {GEODETIC_ZONES.map((z) => {
                    const x1 = projectLon(z.startLon);
                    const width = 1000 / 12;
                    const isActive = activeZoneId === z.id;
                    const elem = ELEMENT_COLORS[z.elem];

                    return (
                        <g key={z.id}>
                            <rect
                                x={x1}
                                y={0}
                                width={width}
                                height={500}
                                fill={isActive ? elem.fill.replace("0.15", "0.35") : elem.fill}
                                stroke={elem.stroke}
                                strokeWidth={isActive ? 1.5 : 0.5}
                                strokeDasharray={isActive ? "none" : "4 4"}
                                style={{ transition: "all 0.4s ease", cursor: "pointer" }}
                                opacity={activeZoneId ? (isActive ? 1 : 0.2) : 0.4}
                                onMouseEnter={() => setActiveZoneId(z.id)}
                                onMouseLeave={() => setActiveZoneId(null)}
                                onClick={() => setActiveZoneId(z.id)}
                            />

                            <g
                                transform={`translate(${x1 + width / 2 - 8}, 20)`}
                                opacity={activeZoneId ? (isActive ? 1 : 0.1) : 0.2}
                                style={{ transition: "opacity 0.4s ease", color: elem.stroke }}
                                dangerouslySetInnerHTML={{ __html: SIGN_PATHS[z.sign] }}
                            />

                            <line
                                x1={x1} y1={0} x2={x1} y2={500}
                                stroke={elem.stroke}
                                strokeWidth={isActive ? 1.5 : 0.5}
                                opacity={activeZoneId ? (isActive ? 0.9 : 0.15) : 0.25}
                                style={{ transition: "all 0.4s ease" }}
                            />

                            <text
                                x={x1 + 4}
                                y={490}
                                fontSize="7"
                                fill={elem.stroke}
                                fontFamily="var(--font-mono)"
                                opacity={activeZoneId ? (isActive ? 0.9 : 0.15) : 0.3}
                                style={{ transition: "opacity 0.4s ease" }}
                            >
                                {z.startLon >= 0 ? `${z.startLon}°E` : `${Math.abs(z.startLon)}°W`}
                            </text>
                        </g>
                    );
                })}

                {/* ASC-boundary curves — gold. Each of 12 curves separates two ASC-sign zones. */}
                {ascBoundaries.map((b, i) => {
                    // When a sign is hovered, emphasise the two boundaries that frame
                    // its ASC-rising band (the curve at the sign's start + the next sign's start).
                    const isFrontOfActive =
                        activeSignIndex >= 0 && i === activeSignIndex;
                    const isBackOfActive =
                        activeSignIndex >= 0 && i === (activeSignIndex + 1) % 12;
                    const isActiveEdge = isFrontOfActive || isBackOfActive;

                    return (
                        <g key={`asc-${b.targetDeg}`}>
                            <polyline
                                points={polylinePoints(b.points)}
                                fill="none"
                                stroke="rgba(201,169,110,0.8)"
                                strokeWidth={isActiveEdge ? 1.6 : 0.7}
                                strokeDasharray={isActiveEdge ? "none" : "2 3"}
                                opacity={
                                    activeZoneId
                                        ? (isActiveEdge ? 1 : 0.15)
                                        : 0.55
                                }
                                style={{ transition: "all 0.4s ease" }}
                            />
                            {/* Sign glyph at a sensible latitude anchor — the curve's equatorial crossing. */}
                            {b.points.length > 0 && (() => {
                                // Find the point closest to lat 0 for a label anchor.
                                let best = b.points[0];
                                for (const p of b.points) if (Math.abs(p[1]) < Math.abs(best[1])) best = p;
                                return (
                                    <text
                                        x={projectLon(best[0]) + 4}
                                        y={projectLat(best[1]) - 3}
                                        fontSize="7"
                                        fill="rgba(201,169,110,0.85)"
                                        fontFamily="var(--font-mono)"
                                        opacity={activeZoneId ? (isActiveEdge ? 1 : 0.15) : 0.5}
                                        style={{ transition: "opacity 0.4s ease" }}
                                    >
                                        {b.signEnteringOnNorth} ASC
                                    </text>
                                );
                            })()}
                        </g>
                    );
                })}

                {/* Equator */}
                <line x1="0" y1={projectLat(0)} x2="1000" y2={projectLat(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="6 4" />
                <text x="4" y={projectLat(0) - 4} fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">EQUATOR</text>

                {/* Tropics */}
                <line x1="0" y1={projectLat(23.5)} x2="1000" y2={projectLat(23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
                <line x1="0" y1={projectLat(-23.5)} x2="1000" y2={projectLat(-23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
            </svg>

            {/* Pop-up info card for the hovered/clicked zone */}
            {activeZoneId && (() => {
                const zone = GEODETIC_ZONES.find((z) => z.id === activeZoneId);
                if (!zone) return null;
                const elem = ELEMENT_COLORS[zone.elem];

                return (
                    <div className="mt-4 md:mt-0 md:absolute md:top-auto md:bottom-8 md:right-8 z-10 pointer-events-none transition-all w-full px-4 md:px-0">
                        <div
                            className="p-5 backdrop-blur-xl w-full mx-auto md:w-80 shadow-2xl"
                            style={{
                                background: "rgba(10,10,10,0.85)",
                                border: `1px solid ${elem.stroke}`,
                                borderRadius: "var(--shape-asymmetric-sm)",
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="font-primary text-3xl text-white/95">{zone.sign}</div>
                                    <div className="text-2xl" style={{ color: elem.stroke }}>{zone.glyph}</div>
                                </div>
                                <div className="font-mono text-[9px] uppercase tracking-widest text-white/50 text-right">
                                    {zone.startLon >= 0 ? `${zone.startLon}°E` : `${Math.abs(zone.startLon)}°W`}<br />
                                    to {zone.startLon + 30 >= 0 ? `${zone.startLon + 30}°E` : `${Math.abs(zone.startLon + 30)}°W`}
                                </div>
                            </div>
                            <div className="font-secondary text-sm italic mb-3" style={{ color: elem.stroke }}>
                                {zone.keyword}
                            </div>
                            <p className="font-body text-xs text-white/80 leading-relaxed mb-3">
                                {zone.desc}
                            </p>
                            <p className="font-mono text-[9px] uppercase tracking-widest text-white/60 mb-3">
                                Red column = MC (Midheaven) zone · fixed vertical band<br />
                                Gold curve = ASC (Rising) boundary · depends on latitude
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {zone.cities.slice(0, 3).map((city) => (
                                    <span
                                        key={city}
                                        className="font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-sm border"
                                        style={{ borderColor: elem.stroke, color: elem.stroke, opacity: 0.8 }}
                                    >
                                        {city}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
