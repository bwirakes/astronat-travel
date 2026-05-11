"use client";

import React from "react";
import { SIGN_PATHS } from "@/app/components/SignIcon";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (exported for re-use in other pages)
// ═══════════════════════════════════════════════════════════════

export const ASC = 32.64; // ecliptic longitude of Ascendant (houses[0])
export const CX = 400;
export const CY = 400;

export const R = {
  outer:       385,
  zodiacInner: 345,
  houseNums:   316,
  planets:     272,
  inner:       190,
  glyphs:      365,
} as const;

/** The 12 house cusp longitudes (Placidus, Brandon's chart) */
export const HOUSES = [
   32.64,  62.33,  90.84, 119.64, 150.15, 181.91,
  212.64, 242.33, 270.84, 299.64, 330.15,   1.91,
];

type Element = "fire" | "earth" | "air" | "water";

export const SIGNS: { name: string; glyph: string; lon: number; elem: Element }[] = [
  { name: "Aries",       glyph: "♈", lon:   0, elem: "fire"  },
  { name: "Taurus",      glyph: "♉", lon:  30, elem: "earth" },
  { name: "Gemini",      glyph: "♊", lon:  60, elem: "air"   },
  { name: "Cancer",      glyph: "♋", lon:  90, elem: "water" },
  { name: "Leo",         glyph: "♌", lon: 120, elem: "fire"  },
  { name: "Virgo",       glyph: "♍", lon: 150, elem: "earth" },
  { name: "Libra",       glyph: "♎", lon: 180, elem: "air"   },
  { name: "Scorpio",     glyph: "♏", lon: 210, elem: "water" },
  { name: "Sagittarius", glyph: "♐", lon: 240, elem: "fire"  },
  { name: "Capricorn",   glyph: "♑", lon: 270, elem: "earth" },
  { name: "Aquarius",    glyph: "♒", lon: 300, elem: "air"   },
  { name: "Pisces",      glyph: "♓", lon: 330, elem: "water" },
];

export const ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.22)",
  earth: "rgba(201,169,110,0.20)",
  air:   "rgba(202,241,240,0.20)",
  water: "rgba(0,253,0,0.13)",
};

export const ELEM_STROKE: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.60)",
  earth: "rgba(201,169,110,0.55)",
  air:   "rgba(202,241,240,0.55)",
  water: "rgba(0,253,0,0.45)",
};

export const HOUSE_ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.18)",
  earth: "rgba(201,169,110,0.17)",
  air:   "rgba(202,241,240,0.17)",
  water: "rgba(0,253,0,0.12)",
};

// ═══════════════════════════════════════════════════════════════
// MATH HELPERS (exported for computing aspects, etc.)
// ═══════════════════════════════════════════════════════════════

export function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function svgXY(lon: number, r: number) {
  const angle = toRad(180 - (lon - ASC));
  return {
    x: parseFloat((CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((CY + r * Math.sin(angle)).toFixed(3)),
  };
}

export function zodiacSectorPath(signLon: number): string {
  const p1 = svgXY(signLon,      R.outer);
  const p2 = svgXY(signLon + 30, R.outer);
  const p3 = svgXY(signLon + 30, R.zodiacInner);
  const p4 = svgXY(signLon,      R.zodiacInner);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.outer} ${R.outer} 0 0 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 0 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

export function houseSectorPath(cusp1: number, cusp2: number): string {
  const spanDeg = ((cusp2 - cusp1) + 360) % 360;
  const largeArc = spanDeg > 180 ? 1 : 0;
  const p1 = svgXY(cusp1, R.zodiacInner);
  const p2 = svgXY(cusp2, R.zodiacInner);
  const p3 = svgXY(cusp2, R.inner);
  const p4 = svgXY(cusp1, R.inner);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.inner} ${R.inner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface WheelPlanet {
  id: string;
  glyph: string;
  color: string;
  lon: number;       // ecliptic longitude (from NATAL_LON)
  lonOffset?: number; // visual nudge for conjunctions
}

export interface WheelAspect {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
  length: number;
  type?: string;
}

// ═══════════════════════════════════════════════════════════════
// NATAL WHEEL SVG COMPONENT
// ═══════════════════════════════════════════════════════════════

interface NatalWheelSVGProps {
  isDark: boolean;
  /** 1-indexed house number to highlight (null = none highlighted) */
  activeHouse?: number | null;
  /** Planet markers to render (pass [] or omit to hide planets) */
  planets?: WheelPlanet[];
  /** Aspect lines to render (pass [] or omit to hide aspects) */
  aspectLines?: WheelAspect[];
}

export function NatalWheelSVG({
  isDark,
  activeHouse = null,
  planets = [],
  aspectLines = [],
}: NatalWheelSVGProps) {
  const c = {
    circlePrimary:   isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.85)",
    circleSecondary: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.65)",
    circleInner:     isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.50)",
    glyphFill:       isDark ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.95)",
    houseAxis:       isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.95)",
    houseLine:       isDark ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.75)",
    axisLabel:       isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.85)",
    houseNum:        isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.80)",
    tick:            isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.60)",
    tickMajor:       isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.85)",
    planetBg:        isDark ? "rgba(0,0,0,0.88)" : "var(--color-eggshell)",
  };

  return (
    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <defs>
        {/* Planet glow filters */}
        {planets.map((p) => (
          <filter key={p.id} id={`glow-${p.id}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feFlood floodColor={p.color} floodOpacity="1" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
        {/* Wheel glow — used for structural lines */}
        <filter id="glow-lines" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Active house glow */}
        <filter id="glow-house-active" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ══ BACKGROUND WHEEL ══ */}
      <g id="bg-wheel" opacity={isDark ? "0.55" : "0.9"}>

        {/* House wedge fills — highlights active house */}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          const signIdx = Math.floor(cusp / 30) % 12;
          const elem = SIGNS[signIdx].elem;
          const isActive = activeHouse === i + 1;
          return (
            <path
              key={`house-wedge-${i}`}
              d={houseSectorPath(cusp, next)}
              fill={isActive ? "rgba(4, 86, 251, 0.32)" : HOUSE_ELEM_FILL[elem]}
              stroke={isActive ? "rgba(4, 86, 251, 0.85)" : "none"}
              strokeWidth={isActive ? 1.5 : 0}
              filter={isActive ? "url(#glow-house-active)" : undefined}
              style={{ transition: "fill 0.5s ease, stroke 0.5s ease" }}
            />
          );
        })}

        {/* Outer boundary */}
        <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" filter="url(#glow-lines)" />
        {/* Zodiac inner edge */}
        <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" filter="url(#glow-lines)" />
        {/* Inner sanctum */}
        <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" filter="url(#glow-lines)" />

        {/* Earth Symbol (Center) */}
        <circle cx={CX} cy={CY} r="10" fill="none" stroke={c.circleSecondary} strokeWidth="1.2" />
        <line x1={CX - 10} y1={CY} x2={CX + 10} y2={CY} stroke={c.circleSecondary} strokeWidth="1.2" />
        <line x1={CX} y1={CY - 10} x2={CX} y2={CY + 10} stroke={c.circleSecondary} strokeWidth="1.2" />

        {/* Zodiac sectors */}
        {SIGNS.map((s) => {
          const mid = svgXY(s.lon + 15, R.glyphs);
          const divFrom = svgXY(s.lon, R.outer);
          const divTo   = svgXY(s.lon, R.zodiacInner);
          return (
            <g key={s.name}>
              <path
                d={zodiacSectorPath(s.lon)}
                fill={ELEM_FILL[s.elem]}
                stroke={ELEM_STROKE[s.elem]}
                strokeWidth="0.5"
              />
              <g
                transform={`translate(${mid.x - 10}, ${mid.y - 10})`}
                style={{ color: c.glyphFill }}
                filter="url(#glow-lines)"
                dangerouslySetInnerHTML={{ __html: SIGN_PATHS[s.name] }}
              />
              <line
                x1={divFrom.x} y1={divFrom.y} x2={divTo.x} y2={divTo.y}
                stroke={ELEM_STROKE[s.elem]} strokeWidth="1.2"
              />
            </g>
          );
        })}

        {/* 5° tick marks on outer ring */}
        {Array.from({ length: 72 }, (_, i) => {
          const lon = i * 5;
          const isMajor = lon % 30 === 0;
          const innerR = R.outer - (isMajor ? 11 : 5);
          const from = svgXY(lon, R.outer);
          const to   = svgXY(lon, innerR);
          return (
            <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isMajor ? c.tickMajor : c.tick}
              strokeWidth={isMajor ? 1.2 : 0.5} />
          );
        })}

        {/* House cusp lines */}
        {HOUSES.map((cusp, i) => {
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          const from = svgXY(cusp, R.zodiacInner);
          const to   = svgXY(cusp, R.inner);
          return (
            <line key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isAxis ? c.houseAxis : c.houseLine}
              strokeWidth={isAxis ? 2.5 : 1.2}
              strokeDasharray={isAxis ? undefined : "6 4"}
              filter={isAxis ? "url(#glow-lines)" : undefined}
            />
          );
        })}

        {/* Axis labels: ASC / DSC / MC / IC */}
        {([
          { label: "ASC", idx: 0 },
          { label: "DSC", idx: 6 },
          { label: "MC",  idx: 9 },
          { label: "IC",  idx: 3 },
        ] as const).map(({ label, idx }) => {
          const pt = svgXY(HOUSES[idx], R.zodiacInner - 24);
          return (
            <text key={label} x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="11" fill={c.axisLabel}
              fontFamily="var(--font-mono)" letterSpacing="2"
              filter="url(#glow-lines)"
              fontWeight="600"
            >
              {label}
            </text>
          );
        })}

        {/* House numbers 1–12 at midpoint of each house */}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          const mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
          const pt = svgXY(mid, R.houseNums);
          const isActive = activeHouse === i + 1;
          return (
            <text key={i} x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={isActive ? "16" : "14"}
              fill={isActive ? "rgba(4, 86, 251, 1)" : c.houseNum}
              fontFamily="var(--font-mono)"
              fontWeight={isActive ? "800" : "600"}
              style={{ transition: "fill 0.5s ease, font-size 0.3s ease" }}
            >
              {i + 1}
            </text>
          );
        })}
      </g>

      {/* ══ ASPECT LINES & GUIDES ══ */}
      <g id="aspect-lines">
        {aspectLines.map((asp) => (
          <g key={asp.id} id={`aspect-group-${asp.id}`} opacity="0">
            {/* Guide lines connecting the angle to the center */}
            <line x1={CX} y1={CY} x2={asp.x1} y2={asp.y1} stroke={c.tick} strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1={CX} y1={CY} x2={asp.x2} y2={asp.y2} stroke={c.tick} strokeWidth="0.8" strokeDasharray="3 3" />
            
            {/* Main geometrical aspect line */}
            <line
              id={`aspect-${asp.id}`}
              x1={asp.x1} y1={asp.y1}
              x2={asp.x2} y2={asp.y2}
              stroke={asp.color}
              strokeWidth="2"
              strokeDasharray={asp.length}
              strokeDashoffset={asp.length}
            />

            {/* Angle & Name Tooltip */}
            {asp.type && (() => {
              const a1 = Math.atan2(asp.y1 - CY, asp.x1 - CX);
              const a2 = Math.atan2(asp.y2 - CY, asp.x2 - CX);
              let diff = a2 - a1;
              while (diff <= -Math.PI) diff += 2 * Math.PI;
              while (diff > Math.PI) diff -= 2 * Math.PI;
              const midAngle = a1 + diff / 2;
              
              // Push the tooltip into the wedge 55px from center
              const dist = 55;
              const labelX = CX + dist * Math.cos(midAngle);
              const labelY = CY + dist * Math.sin(midAngle);

              const ASPECT_DEGREES: Record<string, string> = {
                "Conjunction": "0°",
                "Sextile": "60°",
                "Square": "90°",
                "Trine": "120°",
                "Opposition": "180°"
              };
              const labelText = `${asp.type} ${ASPECT_DEGREES[asp.type] || ""}`.trim();
              
              return (
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect x="-42" y="-12" width="84" height="24" rx="12" fill={c.planetBg} stroke={asp.color} strokeWidth="1" opacity="0.95" />
                  <text
                    x="0" y="1"
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="9.5" fill={c.houseAxis}
                    fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.5"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })()}
          </g>
        ))}
      </g>

      {/* ══ PLANET MARKERS (revealed by GSAP) ══ */}
      {planets.map((p) => {
        const lon    = p.lon;
        const lonAdj = lon + (p.lonOffset ?? 0);
        const pt     = svgXY(lonAdj, R.planets);
        const pinPt  = svgXY(lon, R.zodiacInner - 5);
        const deg    = Math.floor(lon % 30);

        return (
          <g key={p.id} id={`planet-${p.id}`} opacity="0" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}>
            {/* Connector to zodiac ring */}
            <line
              x1={pt.x} y1={pt.y} x2={pinPt.x} y2={pinPt.y}
              stroke={p.color} strokeWidth="0.8" opacity="0.35"
            />
            {/* Pin dot */}
            <circle cx={pinPt.x} cy={pinPt.y} r="2.8" fill={p.color} opacity="0.9" />
            {/* Glow halos */}
            <circle cx={pt.x} cy={pt.y} r="28" fill={p.color} opacity="0.08" />
            <circle cx={pt.x} cy={pt.y} r="22" fill={p.color} opacity="0.05" />
            {/* Glyph pill */}
            <circle cx={pt.x} cy={pt.y} r="20"
              fill={c.planetBg}
              stroke={p.color}
              strokeWidth="1.8"
            />
            {/* Glyph */}
            <text
              x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="20" fill={p.color}
              fontFamily="var(--font-secondary)"
              filter={`url(#glow-${p.id})`}
            >
              {p.glyph}
            </text>
            {/* Degree label */}
            <text
              x={pt.x} y={pt.y + 34}
              textAnchor="middle" dominantBaseline="central"
              fontSize="9" fill={p.color}
              fontFamily="var(--font-mono)"
              fontWeight="600"
              opacity="0.9"
            >
              {deg}°
            </text>
          </g>
        );
      })}
    </svg>
  );
}
