"use client";

import React, { useState, useEffect } from "react";
import { SIGN_PATHS } from "@/app/components/SignIcon";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ASC = 32.64;
const CX = 400;
const CY = 400;

const R = {
  outer:       385,
  zodiacInner: 345,
  houseNums:   316,
  planets:     272,
  inner:       190,
  glyphs:      365,
} as const;

// ═══════════════════════════════════════════════════════════════
// EXAMPLE BIRTH DATA — Jakarta, Aug 17 1988 — Educational Reference
// ═══════════════════════════════════════════════════════════════

const NATAL_LON: Record<string, number> = {
  sun:     144.92,
  moon:    200.48,
  mercury: 158.88,
  venus:    99.26,
  mars:     10.91,
  jupiter:  63.85,
  saturn:  266.06,
  uranus:  267.19,
  neptune: 277.69,
  pluto:   219.99,
};

const HOUSES = [
   32.64,  62.33,  90.84, 119.64, 150.15, 181.91,
  212.64, 242.33, 270.84, 299.64, 330.15,   1.91,
];

type Element = "fire" | "earth" | "air" | "water";

const SIGNS: { name: string; glyph: string; lon: number; elem: Element }[] = [
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

const ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.22)",
  earth: "rgba(201,169,110,0.20)",
  air:   "rgba(202,241,240,0.20)",
  water: "rgba(0,253,0,0.13)",
};

const ELEM_STROKE: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.60)",
  earth: "rgba(201,169,110,0.55)",
  air:   "rgba(202,241,240,0.55)",
  water: "rgba(0,253,0,0.45)",
};

const HOUSE_ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.18)",
  earth: "rgba(201,169,110,0.17)",
  air:   "rgba(202,241,240,0.17)",
  water: "rgba(0,253,0,0.12)",
};

const PLANETS = [
  { id: "sun", glyph: "☉", color: "#C9A96E" },
  { id: "moon", glyph: "☽", color: "#CAF1F0" },
  { id: "mercury", glyph: "☿", color: "#0456fb" },
  { id: "venus", glyph: "♀", color: "#E67A7A" },
  { id: "mars", glyph: "♂", color: "#D32F2F" },
  { id: "jupiter", glyph: "♃", color: "#00FD00" },
  { id: "saturn", glyph: "♄", color: "#909090" },
  { id: "uranus", glyph: "♅", color: "#CAF1F0" },
  { id: "neptune", glyph: "♆", color: "#CAF1F0" },
  { id: "pluto", glyph: "♇", color: "#8E24AA" },
];

const PLANET_LON_OFFSET: Record<string, number> = {
  saturn: -2.5,
  uranus:  2.5,
};

// ═══════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function svgXY(lon: number, r: number) {
  const angle = toRad(180 - (lon - ASC));
  return {
    x: parseFloat((CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((CY + r * Math.sin(angle)).toFixed(3)),
  };
}

function zodiacSectorPath(signLon: number): string {
  const p1 = svgXY(signLon,      R.outer);
  const p2 = svgXY(signLon + 30, R.outer);
  const p3 = svgXY(signLon + 30, R.zodiacInner);
  const p4 = svgXY(signLon,      R.zodiacInner);
  return [`M ${p1.x} ${p1.y}`, `A ${R.outer} ${R.outer} 0 0 0 ${p2.x} ${p2.y}`, `L ${p3.x} ${p3.y}`, `A ${R.zodiacInner} ${R.zodiacInner} 0 0 1 ${p4.x} ${p4.y}`, `Z`].join(" ");
}

function houseSectorPath(cusp1: number, cusp2: number): string {
  const spanDeg = ((cusp2 - cusp1) + 360) % 360;
  const largeArc = spanDeg > 180 ? 1 : 0;
  const p1 = svgXY(cusp1, R.zodiacInner);
  const p2 = svgXY(cusp2, R.zodiacInner);
  const p3 = svgXY(cusp2, R.inner);
  const p4 = svgXY(cusp1, R.inner);
  return [`M ${p1.x} ${p1.y}`, `A ${R.zodiacInner} ${R.zodiacInner} 0 ${largeArc} 0 ${p2.x} ${p2.y}`, `L ${p3.x} ${p3.y}`, `A ${R.inner} ${R.inner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`, `Z`].join(" ");
}

// ═══════════════════════════════════════════════════════════════
// ASPECT COMPUTATION
// ═══════════════════════════════════════════════════════════════

interface AspectEntry {
  id: string; planetA: string; planetB: string;
  type: string; color: string;
  x1: number; y1: number; x2: number; y2: number;
  length: number;
}

function getAspect(lon1: number, lon2: number) {
  let d = Math.abs(lon1 - lon2);
  if (d > 180) d = 360 - d;
  if (Math.abs(d - 120) < 8)  return { type: "Trine",       color: "#00FD00" };
  if (Math.abs(d - 90)  < 8)  return { type: "Square",      color: "#E67A7A" };
  if (Math.abs(d - 180) < 10) return { type: "Opposition",  color: "#888888" };
  if (Math.abs(d - 60)  < 6)  return { type: "Sextile",     color: "#CAF1F0" };
  if (d < 8)                   return { type: "Conjunction", color: "#0456fb" };
  return null;
}

const ALL_ASPECTS: AspectEntry[] = (() => {
  const acc: AspectEntry[] = [];
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const p1 = PLANETS[i], p2 = PLANETS[j];
      const lon1 = NATAL_LON[p1.id], lon2 = NATAL_LON[p2.id];
      const asp = getAspect(lon1, lon2);
      if (!asp) continue;
      const pt1 = svgXY(lon1, R.inner);
      const pt2 = svgXY(lon2, R.inner);
      const length = parseFloat(Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y).toFixed(3));
      acc.push({ id: `${p1.id}-${p2.id}`, planetA: p1.id, planetB: p2.id, ...asp, x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y, length });
    }
  }
  return acc;
})();

export type NatalWheelProps = {
  /** CSS variable for the theme accent color */
  accent?: string;
  /** Whether to show the planets */
  showPlanets?: boolean;
  /** Whether to show the aspects in the center */
  showAspects?: boolean;
  /** Whether to highlight the houses vs the signs */
  mode?: "standard" | "houses";
};

export function NatalWheel({ accent = "var(--text-primary)", showPlanets = true, showAspects = true, mode = "standard" }: NatalWheelProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

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
    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "auto" }}>
      <defs>
        <filter id="glow-lines" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g id="bg-wheel" opacity={isDark ? "0.75" : "0.9"}>
        {/* House wedge fills */}
        {mode === "houses" && HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          const signIdx = Math.floor(cusp / 30) % 12;
          const elem = SIGNS[signIdx].elem;
          return <path key={`hw-${i}`} d={houseSectorPath(cusp, next)} fill={HOUSE_ELEM_FILL[elem]} />;
        })}

        <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" filter="url(#glow-lines)" />
        <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" filter="url(#glow-lines)" />
        <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" filter="url(#glow-lines)" />

        {SIGNS.map((s) => {
          const mid = svgXY(s.lon + 15, R.glyphs);
          const divFrom = svgXY(s.lon, R.outer);
          const divTo   = svgXY(s.lon, R.zodiacInner);
          return (
            <g key={s.name}>
              {mode !== "houses" && <path d={zodiacSectorPath(s.lon)} fill={ELEM_FILL[s.elem]} stroke={ELEM_STROKE[s.elem]} strokeWidth="0.5" />}
              <g transform={`translate(${mid.x - 10}, ${mid.y - 10})`} style={{ color: c.glyphFill }} filter="url(#glow-lines)" dangerouslySetInnerHTML={{ __html: SIGN_PATHS[s.name] }} />
              <line x1={divFrom.x} y1={divFrom.y} x2={divTo.x} y2={divTo.y} stroke={ELEM_STROKE[s.elem]} strokeWidth="1.2" />
            </g>
          );
        })}

        {Array.from({ length: 72 }, (_, i) => {
          const lon = i * 5;
          const isMajor = lon % 30 === 0;
          const innerR = R.outer - (isMajor ? 11 : 5);
          const from = svgXY(lon, R.outer);
          const to   = svgXY(lon, innerR);
          return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={isMajor ? c.tickMajor : c.tick} strokeWidth={isMajor ? 1.2 : 0.5} />;
        })}

        {HOUSES.map((cusp, i) => {
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          const from = svgXY(cusp, R.zodiacInner);
          const to   = svgXY(cusp, R.inner);
          return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={isAxis ? c.houseAxis : c.houseLine} strokeWidth={isAxis ? 2.5 : 1.2} strokeDasharray={isAxis ? undefined : "6 4"} filter={isAxis ? "url(#glow-lines)" : undefined} />;
        })}

        {([{ label: "ASC", idx: 0 }, { label: "DSC", idx: 6 }, { label: "MC", idx: 9 }, { label: "IC", idx: 3 }] as const).map(({ label, idx }) => {
          const pt = svgXY(HOUSES[idx], R.zodiacInner - 24);
          return <text key={label} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="11" fill={c.axisLabel} fontFamily="var(--font-mono)" letterSpacing="2" filter="url(#glow-lines)" fontWeight="600">{label}</text>;
        })}

        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          let mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
          const pt = svgXY(mid, R.houseNums);
          return <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="14" fill={c.houseNum} fontFamily="var(--font-mono)" fontWeight="600">{i + 1}</text>;
        })}
      </g>

      {/* Aspect lines */}
      {showAspects && (
        <g id="aspect-lines">
          {ALL_ASPECTS.map((asp) => (
            <line key={asp.id} x1={asp.x1} y1={asp.y1} x2={asp.x2} y2={asp.y2} stroke={asp.color} strokeWidth="1.2" opacity="0.6" />
          ))}
        </g>
      )}

      {/* Planet markers */}
      {showPlanets && PLANETS.map((p) => {
        const lon = NATAL_LON[p.id];
        const lonAdj = lon + (PLANET_LON_OFFSET[p.id] ?? 0);
        const pt    = svgXY(lonAdj, R.planets);
        const pinPt = svgXY(lon, R.zodiacInner - 5);
        const deg   = Math.floor(lon % 30);
        return (
          <g key={p.id} id={`planet-${p.id}`} style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}>
            <line x1={pt.x} y1={pt.y} x2={pinPt.x} y2={pinPt.y} stroke={p.color} strokeWidth="0.8" opacity="0.45" />
            <circle cx={pinPt.x} cy={pinPt.y} r="2.8" fill={p.color} opacity="0.9" />
            <circle cx={pt.x} cy={pt.y} r="20" fill={c.planetBg} stroke={p.color} strokeWidth="1.8" />
            <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="20" fill={p.color} fontFamily="var(--font-secondary)">{p.glyph}</text>
            <text x={pt.x} y={pt.y + 34} textAnchor="middle" dominantBaseline="central" fontSize="9" fill={p.color} fontFamily="var(--font-mono)" fontWeight="600" opacity="0.9">{deg}°</text>
          </g>
        );
      })}
    </svg>
  );
}
