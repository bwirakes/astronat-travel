"use client";

/**
 * NatalChart.tsx
 * Renders a minimal but beautiful natal chart wheel as an SVG.
 * Works from the natal_planets array returned by the astro engine.
 * Falls back to mock data gracefully if planets are empty.
 */

import { useMemo } from "react";
import { PLANET_GLYPHS, PLANET_COLORS, SIGN_GLYPHS } from "../lib/planet-data";

interface NatalPlanet {
    planet: string;
    sign: string;
    degree: number;      // 0-29 within sign
    longitude: number;   // 0-359 ecliptic longitude
    retrograde: boolean;
    house: number;       // 1-12
}

interface Props {
    natalPlanets: NatalPlanet[];
    sunSign?: string | null;
    name?: string;
}

const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_COLORS: Record<string, string> = {
    Aries: "#e85d4a", Taurus: "#4ade80", Gemini: "#f5c542", Cancer: "#c4c9d4",
    Leo: "#f5a623", Virgo: "#7ecbf5", Libra: "#f5a0c8", Scorpio: "#9b6bff",
    Sagittarius: "#f5c542", Capricorn: "#8b8fa3", Aquarius: "#42d4c8", Pisces: "#6b7cff",
};

const ELEMENT_COLORS: Record<string, string> = {
    // Fire: Aries, Leo, Sagittarius
    Aries: "rgba(232,93,74,0.08)", Leo: "rgba(245,166,35,0.08)", Sagittarius: "rgba(245,197,66,0.08)",
    // Earth: Taurus, Virgo, Capricorn
    Taurus: "rgba(74,222,128,0.06)", Virgo: "rgba(126,203,245,0.06)", Capricorn: "rgba(139,143,163,0.06)",
    // Air: Gemini, Libra, Aquarius
    Gemini: "rgba(245,197,66,0.06)", Libra: "rgba(245,160,200,0.06)", Aquarius: "rgba(66,212,200,0.06)",
    // Water: Cancer, Scorpio, Pisces
    Cancer: "rgba(196,201,212,0.06)", Scorpio: "rgba(155,107,255,0.06)", Pisces: "rgba(107,124,255,0.06)",
};

// Mock natal data for demonstration when engine is offline
const MOCK_NATAL: NatalPlanet[] = [
    { planet: "Sun", sign: "Scorpio", degree: 14, longitude: 224, retrograde: false, house: 8 },
    { planet: "Moon", sign: "Aquarius", degree: 7, longitude: 307, retrograde: false, house: 11 },
    { planet: "Mercury", sign: "Scorpio", degree: 2, longitude: 212, retrograde: false, house: 7 },
    { planet: "Venus", sign: "Libra", degree: 21, longitude: 201, retrograde: false, house: 7 },
    { planet: "Mars", sign: "Capricorn", degree: 18, longitude: 288, retrograde: false, house: 10 },
    { planet: "Jupiter", sign: "Virgo", degree: 5, longitude: 155, retrograde: false, house: 5 },
    { planet: "Saturn", sign: "Pisces", degree: 28, longitude: 358, retrograde: false, house: 12 },
    { planet: "Uranus", sign: "Capricorn", degree: 12, longitude: 282, retrograde: false, house: 9 },
    { planet: "Neptune", sign: "Capricorn", degree: 14, longitude: 284, retrograde: true, house: 9 },
    { planet: "Pluto", sign: "Scorpio", degree: 22, longitude: 232, retrograde: false, house: 8 },
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function NatalChart({ natalPlanets, sunSign, name }: Props) {
    const planets = useMemo(
        () => (natalPlanets && natalPlanets.length > 0 ? natalPlanets : MOCK_NATAL),
        [natalPlanets]
    );

    const isMock = !natalPlanets || natalPlanets.length === 0;

    const SIZE = 400;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    // Radii
    const R_OUTER = 180;   // outer wheel edge
    const R_SIGN = 162;    // sign band outer
    const R_SIGN_IN = 140; // sign band inner
    const R_HOUSE = 125;   // house ring
    const R_PLANET = 100;  // planet placement ring

    // House cusp angles — simplified equal houses starting from ASC at 180° (left)
    // In a real chart these come from the engine; we approximate with equal 30° houses
    // where H1 starts at 180° (the left / Ascendant position)
    const ascAngle = 180; // Ascendant on the left

    // Sign sector for each sign: Aries = 0°, Taurus = 30°, etc.
    // In a Western chart displayed with Aries at the bottom-left typically,
    // here we fix Aries start at 0° (top = Aries start) for simplicity
    const signStartAngle = (signIndex: number) => signIndex * 30; // 0–330°

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
        }}>
            {/* Label */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500,
            }}>
                <span style={{ color: "var(--gold)", fontFamily: "serif", fontSize: "0.85rem" }}>
                    {sunSign ? SIGN_GLYPHS[sunSign] : "☽"}
                </span>
                Natal Chart{name ? ` · ${name}` : ""}
                {isMock && (
                    <span style={{
                        fontSize: "0.6rem",
                        color: "var(--gold)",
                        background: "var(--gold-soft)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        border: "1px solid rgba(250,218,94,0.2)",
                        letterSpacing: "0.06em",
                    }}>
                        SAMPLE
                    </span>
                )}
            </div>

            <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                width="100%"
                style={{ maxWidth: 380, overflow: "visible" }}
                aria-label="Natal chart wheel"
            >
                {/* ── Background ── */}
                <circle cx={cx} cy={cy} r={R_OUTER + 4} fill="var(--surface)" stroke="var(--surface-border)" strokeWidth="1" />

                {/* ── 12 Sign Sectors (coloured band) ── */}
                {SIGNS.map((sign, i) => {
                    const startDeg = signStartAngle(i);
                    const endDeg = startDeg + 30;
                    return (
                        <path
                            key={`sector-${sign}`}
                            d={`
                                ${describeArc(cx, cy, R_SIGN, startDeg, endDeg)}
                                L ${polarToCartesian(cx, cy, R_SIGN_IN, endDeg).x} ${polarToCartesian(cx, cy, R_SIGN_IN, endDeg).y}
                                ${describeArc(cx, cy, R_SIGN_IN, endDeg, startDeg)}
                                Z
                            `}
                            fill={ELEMENT_COLORS[sign] || "rgba(255,255,255,0.03)"}
                            stroke="var(--surface-border)"
                            strokeWidth="0.5"
                        />
                    );
                })}

                {/* ── Sign Divider Lines (outer spokes) ── */}
                {SIGNS.map((_, i) => {
                    const angle = signStartAngle(i);
                    const inner = polarToCartesian(cx, cy, R_SIGN_IN, angle);
                    const outer = polarToCartesian(cx, cy, R_OUTER, angle);
                    return (
                        <line key={`div-${i}`}
                            x1={inner.x} y1={inner.y}
                            x2={outer.x} y2={outer.y}
                            stroke="var(--surface-border)" strokeWidth="0.8" />
                    );
                })}

                {/* ── Sign Glyphs ── */}
                {SIGNS.map((sign, i) => {
                    const midAngle = signStartAngle(i) + 15;
                    const r = (R_SIGN + R_SIGN_IN) / 2;
                    const pos = polarToCartesian(cx, cy, r, midAngle);
                    return (
                        <text key={`glyph-${sign}`}
                            x={pos.x} y={pos.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="10"
                            fontFamily="serif"
                            fill={SIGN_COLORS[sign] || "var(--text-tertiary)"}
                            opacity="0.9"
                        >
                            {SIGN_GLYPHS[sign]}
                        </text>
                    );
                })}

                {/* ── House Dividers (12 equal houses from ascendant) ── */}
                {Array.from({ length: 12 }, (_, i) => {
                    const angle = ascAngle + i * 30;
                    const inner = polarToCartesian(cx, cy, 40, angle);
                    const outer = polarToCartesian(cx, cy, R_SIGN_IN, angle);
                    const isCardinal = i % 3 === 0;
                    return (
                        <line key={`house-${i}`}
                            x1={inner.x} y1={inner.y}
                            x2={outer.x} y2={outer.y}
                            stroke={isCardinal ? "var(--text-tertiary)" : "var(--surface-border)"}
                            strokeWidth={isCardinal ? 1 : 0.5}
                            opacity={isCardinal ? 0.6 : 0.3}
                        />
                    );
                })}

                {/* ── House Numbers ── */}
                {Array.from({ length: 12 }, (_, i) => {
                    const houseNum = i + 1;
                    const midAngle = ascAngle + i * 30 + 15;
                    const pos = polarToCartesian(cx, cy, R_HOUSE, midAngle);
                    return (
                        <text key={`hnum-${houseNum}`}
                            x={pos.x} y={pos.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="8" fill="var(--text-tertiary)"
                            opacity="0.5" fontWeight="500"
                        >
                            {houseNum}
                        </text>
                    );
                })}

                {/* ── Inner Circle (chart core) ── */}
                <circle cx={cx} cy={cy} r={R_PLANET - 12}
                    fill="var(--bg)" stroke="var(--surface-border)" strokeWidth="0.5" opacity="0.7" />

                {/* ── Planets ── */}
                {planets.map((p, idx) => {
                    // Place planet using ecliptic longitude (0 = Aries start)
                    // We map longitude directly to angle on the wheel
                    const angle = p.longitude ?? (SIGNS.indexOf(p.sign) * 30 + p.degree);
                    const pos = polarToCartesian(cx, cy, R_PLANET - 16, angle);
                    const color = PLANET_COLORS[p.planet] || "#fff";

                    return (
                        <g key={`planet-${p.planet}-${idx}`}>
                            {/* dot on ecliptic ring */}
                            <circle
                                cx={polarToCartesian(cx, cy, R_SIGN_IN - 8, angle).x}
                                cy={polarToCartesian(cx, cy, R_SIGN_IN - 8, angle).y}
                                r="2.5" fill={color} opacity="0.8"
                            />
                            {/* line from dot to glyph */}
                            <line
                                x1={polarToCartesian(cx, cy, R_SIGN_IN - 12, angle).x}
                                y1={polarToCartesian(cx, cy, R_SIGN_IN - 12, angle).y}
                                x2={pos.x} y2={pos.y}
                                stroke={color} strokeWidth="0.6" opacity="0.3"
                            />
                            {/* Planet glyph */}
                            <text
                                x={pos.x} y={pos.y}
                                textAnchor="middle" dominantBaseline="middle"
                                fontSize="11" fontFamily="serif"
                                fill={color} opacity="0.95"
                            >
                                <title>{`${p.planet} in ${p.sign} ${p.degree}° H${p.house}${p.retrograde ? " Rx" : ""}`}</title>
                                {PLANET_GLYPHS[p.planet] || p.planet[0]}
                            </text>
                            {/* Retrograde indicator */}
                            {p.retrograde && (
                                <text
                                    x={pos.x + 8} y={pos.y - 6}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fontSize="5.5" fill={color} opacity="0.7"
                                >
                                    Rx
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* ── Centre: sun/ASC indicator ── */}
                <circle cx={cx} cy={cy} r="22"
                    fill="var(--surface)" stroke="var(--surface-border)" strokeWidth="0.8" />
                <text x={cx} y={cy - 4}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="14" fontFamily="serif"
                    fill="var(--gold)" opacity="0.9"
                >
                    {sunSign ? SIGN_GLYPHS[sunSign] : "☉"}
                </text>
                <text x={cx} y={cy + 10}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="5.5" fill="var(--text-tertiary)"
                    letterSpacing="0.05em" style={{ textTransform: "uppercase" }}
                >
                    {sunSign || "NATAL"}
                </text>

                {/* ── ASC marker ── */}
                <text
                    x={polarToCartesian(cx, cy, R_OUTER - 8, ascAngle).x}
                    y={polarToCartesian(cx, cy, R_OUTER - 8, ascAngle).y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="6" fill="var(--accent)" opacity="0.8"
                    fontWeight="700" letterSpacing="0.05em"
                >
                    ASC
                </text>
            </svg>

            {/* ── Planet Legend ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "0.4rem 0.8rem",
                width: "100%",
                marginTop: "0.5rem",
            }}>
                {planets.map((p) => (
                    <div key={p.planet} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        color: "var(--text-tertiary)",
                    }}>
                        <span style={{
                            fontFamily: "serif",
                            fontSize: "0.85rem",
                            color: PLANET_COLORS[p.planet] || "var(--text-secondary)",
                            lineHeight: 1,
                        }}>
                            {PLANET_GLYPHS[p.planet]}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                            {p.sign.slice(0, 3)} {Math.round(p.degree)}°
                            {p.retrograde ? <span style={{ color: "var(--accent)", fontSize: "0.6rem" }}> Rx</span> : null}
                            {" "}
                            <span style={{ color: "var(--text-tertiary)" }}>H{p.house}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
