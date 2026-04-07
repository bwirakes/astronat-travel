import React from "react";
import { SIGN_PATHS } from "./SignIcon";
import { PLANET_COLORS } from "../lib/planet-data";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & COLORS
// ═══════════════════════════════════════════════════════════════

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

const PLANET_GLYPHS: Record<string, string> = {
  "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
  "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
  "North Node": "☊", "South Node": "☋", "Chiron": "⚷",
  "Ascendant": "ASC", "MC": "MC", "IC": "IC", "DC": "DC"
};

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

// ═══════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function svgXY(lon: number, r: number, asc: number) {
  const angle = toRad(180 - (lon - asc));
  return {
    x: parseFloat((CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((CY + r * Math.sin(angle)).toFixed(3)),
  };
}

function zodiacSectorPath(signLon: number, asc: number): string {
  const p1 = svgXY(signLon,      R.outer, asc);
  const p2 = svgXY(signLon + 30, R.outer, asc);
  const p3 = svgXY(signLon + 30, R.zodiacInner, asc);
  const p4 = svgXY(signLon,      R.zodiacInner, asc);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.outer} ${R.outer} 0 0 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 0 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

function houseSectorPath(cusp1: number, cusp2: number, asc: number): string {
  const spanDeg = ((cusp2 - cusp1) + 360) % 360;
  const largeArc = spanDeg > 180 ? 1 : 0;
  const p1 = svgXY(cusp1, R.zodiacInner, asc);
  const p2 = svgXY(cusp2, R.zodiacInner, asc);
  const p3 = svgXY(cusp2, R.inner, asc);
  const p4 = svgXY(cusp1, R.inner, asc);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.inner} ${R.inner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
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

// ═══════════════════════════════════════════════════════════════
// TYPES & COMPONENTS
// ═══════════════════════════════════════════════════════════════

export interface NatalPlanet {
  planet: string;
  longitude: number;
  isAngle?: boolean;
}

export interface NatalMockupWheelProps {
  isDark: boolean;
  planets: NatalPlanet[];
  cusps: number[]; // Array of 12 elements
}

export default function NatalMockupWheel({ isDark, planets, cusps }: NatalMockupWheelProps) {
  const asc = cusps[0] || 0;

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
    planetBg:        "var(--surface)",
  };

  const stdPlanets = planets.filter(p => !p.isAngle);

  // Compute Aspects
  const ALL_ASPECTS = (() => {
    const acc: any[] = [];
    for (let i = 0; i < stdPlanets.length; i++) {
        for (let j = i + 1; j < stdPlanets.length; j++) {
            const p1 = stdPlanets[i], p2 = stdPlanets[j];
            const lon1 = p1.longitude, lon2 = p2.longitude;
            const asp = getAspect(lon1, lon2);
            if (!asp) continue;
            const pt1 = svgXY(lon1, R.inner, asc);
            const pt2 = svgXY(lon2, R.inner, asc);
            const length = parseFloat(Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y).toFixed(3));
            acc.push({ id: `${p1.planet}-${p2.planet}`, planetA: p1.planet, planetB: p2.planet, ...asp, x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y, length });
        }
    }
    return acc;
  })();

  // Overlaps detection to spread out planets (basic offset logic)
  const renderPlanets = stdPlanets.map((p, i) => {
     let offset = 0;
     // simple detection for close conjuncts to slightly stagger
     for (let j = 0; j < stdPlanets.length; j++) {
        if(i !== j && Math.abs(stdPlanets[j].longitude - p.longitude) < 3) {
            offset = i > j ? 3 : -3;
        }
     }
     return { ...p, lonAdj: p.longitude + offset };
  });

  return (
    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "100%", maxHeight: "80vh" }}>
      <defs>
        {stdPlanets.map((p) => {
            const color = PLANET_COLORS[p.planet] || "#FFF";
            return (
          <filter key={p.planet} id={`glow-${p.planet}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feFlood floodColor={color} floodOpacity="1" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )})}
        <filter id="glow-lines" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ══ BACKGROUND WHEEL ══ */}
      <g id="bg-wheel" opacity={isDark ? "0.55" : "0.9"}>
        {cusps.length === 12 && cusps.map((cusp, i) => {
          const next = cusps[(i + 1) % 12];
          const signIdx = Math.floor(cusp / 30) % 12;
          const elem = SIGNS[signIdx]?.elem || "fire";
          return (
            <path
              key={`house-wedge-${i}`}
              d={houseSectorPath(cusp, next, asc)}
              fill={HOUSE_ELEM_FILL[elem]}
            />
          );
        })}

        <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" filter="url(#glow-lines)" />
        <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" filter="url(#glow-lines)" />
        <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" filter="url(#glow-lines)" />

        {SIGNS.map((s) => {
          const mid = svgXY(s.lon + 15, R.glyphs, asc);
          const divFrom = svgXY(s.lon, R.outer, asc);
          const divTo   = svgXY(s.lon, R.zodiacInner, asc);
          return (
            <g key={s.name}>
              <path
                d={zodiacSectorPath(s.lon, asc)}
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

        {Array.from({ length: 72 }, (_, i) => {
          const lon = i * 5;
          const isMajor = lon % 30 === 0;
          const innerR = R.outer - (isMajor ? 11 : 5);
          const from = svgXY(lon, R.outer, asc);
          const to   = svgXY(lon, innerR, asc);
          return (
            <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isMajor ? c.tickMajor : c.tick}
              strokeWidth={isMajor ? 1.2 : 0.5} />
          );
        })}

        {cusps.length === 12 && cusps.map((cusp, i) => {
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          const from = svgXY(cusp, R.zodiacInner, asc);
          const to   = svgXY(cusp, R.inner, asc);
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

        {cusps.length === 12 && ([
          { label: "ASC", idx: 0 },
          { label: "DSC", idx: 6 },
          { label: "MC",  idx: 9 },
          { label: "IC",  idx: 3 },
        ] as const).map(({ label, idx }) => {
          const pt = svgXY(cusps[idx], R.zodiacInner - 24, asc);
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

        {cusps.length === 12 && cusps.map((cusp, i) => {
          const next = cusps[(i + 1) % 12];
          let mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
          const pt = svgXY(mid, R.houseNums, asc);
          return (
            <text key={i} x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="14" fill={c.houseNum}
              fontFamily="var(--font-mono)" fontWeight="600"
            >
              {i + 1}
            </text>
          );
        })}
      </g>

      <g id="aspect-lines">
        {ALL_ASPECTS.map((asp) => (
          <line
            key={asp.id}
            id={`aspect-${asp.id}`}
            x1={asp.x1} y1={asp.y1}
            x2={asp.x2} y2={asp.y2}
            stroke={asp.color}
            strokeWidth="1.2"
            opacity="0.55" 
          />
        ))}
      </g>

      {renderPlanets.map((p) => {
        const pt    = svgXY(p.lonAdj, R.planets, asc);
        const pinPt = svgXY(p.longitude, R.zodiacInner - 5, asc);
        const deg   = Math.floor(p.longitude % 30);
        const color = PLANET_COLORS[p.planet] || "#FFF";
        const glyphStr = PLANET_GLYPHS[p.planet] || p.planet.charAt(0);

        return (
          <g key={p.planet} id={`planet-${p.planet}`}>
            <line
              x1={pt.x} y1={pt.y} x2={pinPt.x} y2={pinPt.y}
              stroke={color} strokeWidth="0.8" opacity="0.35"
            />
            <circle cx={pinPt.x} cy={pinPt.y} r="2.8" fill={color} opacity="0.9" />
            <circle cx={pt.x} cy={pt.y} r="28" fill={color} opacity="0.08" />
            <circle cx={pt.x} cy={pt.y} r="22" fill={color} opacity="0.05" />
            <circle cx={pt.x} cy={pt.y} r="20"
              fill={c.planetBg}
              stroke={color}
              strokeWidth="1.8"
            />
            <text
              x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={glyphStr.length > 1 ? "12" : "20"} fill={color}
              fontFamily="var(--font-secondary)"
              filter={`url(#glow-${p.planet})`}
            >
              {glyphStr}
            </text>
            <text
              x={pt.x} y={pt.y + 34}
              textAnchor="middle" dominantBaseline="central"
              fontSize="9" fill={color}
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
