"use client";
import React from "react";
import { motion } from "framer-motion";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import { ALL_PLANETS, PLANET_LON_OFFSET, NATAL_LON, HOUSES, SIGNS, ELEM_FILL, ELEM_STROKE, HOUSE_ELEM_FILL } from "../data";
import { useAnimationMachine } from "../AnimationMachine";

const ASC = 32.64;
const CX = 400;
const CY = 400;
const ROTATION_SHIFT = -105;
const VISUAL_SHIFT = -105; // Negative forces visually correct clockwise planetary shift

const R = {
  outer:       385,
  zodiacInner: 345,
  houseNums:   316,
  planets:     272,
  inner:       190,
  glyphs:      365,
} as const;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function svgXY(lon: number, r: number) {
  const angle = toRad(180 - (lon - ASC));
  return {
    x: parseFloat((CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((CY + r * Math.sin(angle)).toFixed(3)),
  };
}

function zodiacSectorPath(signLon: number): string {
  const p1 = svgXY(signLon, R.outer);
  const p2 = svgXY(signLon + 30, R.outer);
  const p3 = svgXY(signLon + 30, R.zodiacInner);
  const p4 = svgXY(signLon, R.zodiacInner);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.outer} ${R.outer} 0 0 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 0 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

/** Arc path for a house wedge between two cusp longitudes (inner chart area) */
function houseSectorPath(cusp1: number, cusp2: number): string {
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

export const ALL_ASPECTS = (() => {
  const acc = [];
  for (let i = 0; i < ALL_PLANETS.length; i++) {
    for (let j = i + 1; j < ALL_PLANETS.length; j++) {
      const p1 = ALL_PLANETS[i], p2 = ALL_PLANETS[j];
      const lon1 = NATAL_LON[p1.id], lon2 = NATAL_LON[p2.id];
      const asp = getAspect(lon1, lon2);
      if (!asp) continue;
      const pt1 = svgXY(lon1 + VISUAL_SHIFT, R.inner);
      const pt2 = svgXY(lon2 + VISUAL_SHIFT, R.inner);
      const length = parseFloat(Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y).toFixed(3));
      acc.push({ id: `${p1.id}-${p2.id}`, planetA: p1.id, planetB: p2.id, ...asp, x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y, length });
    }
  }
  return acc;
})();

export default function RelocatedWheelInteractive({ isDark }: { isDark: boolean }) {
  const { activeView, activeIndex } = useAnimationMachine();
  
  // Map narrative planet IDs to their respective section indices
  const PLANET_INDICES: Record<string, number> = {
    sun: 1,
    mercury: 2,
    jupiter: 3,
    pluto: 4
  };

  const c = {
    circlePrimary:   isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.65)",
    circleSecondary: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.45)",
    circleInner:     isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.30)",
    glyphFill:       isDark ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.75)",
    houseAxis:       isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.85)",
    houseLine:       isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.55)",
    axisLabel:       isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.85)",
    houseNum:        isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.60)",
    tick:            isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",
    tickMajor:       isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.8)",
    planetBg:        isDark ? "rgba(0,0,0,0.88)" : "var(--color-eggshell)",
  };

  return (
    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <defs>
        {ALL_PLANETS.map((p) => (
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
        {/* Glow for wheel structure lines (from mockup-natal) */}
        <filter id="glow-lines" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Glow for active aspect arcs */}
        {ALL_PLANETS.map((p) => (
          <filter key={`glow-arc-${p.id}`} id={`glow-arc-${p.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {/* BG WHEEL STRUCTURE (with wedges) */}
      <g id="fixed-houses" opacity={isDark ? "0.8" : "1"}>
        {/* House wedge fills */}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          const signIdx = Math.floor(cusp / 30) % 12;
          const elem = SIGNS[signIdx].elem;
          return (
            <path
              key={`house-wedge-${i}`}
              d={houseSectorPath(cusp, next)}
              fill={HOUSE_ELEM_FILL[elem]}
            />
          );
        })}

        {HOUSES.map((cusp, i) => {
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          const from = svgXY(cusp, R.zodiacInner);
          const to   = svgXY(cusp, R.inner);
          return (
            <line key={`house-line-${i}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isAxis ? c.houseAxis : c.houseLine}
              strokeWidth={isAxis ? 2.5 : 1.2}
              strokeDasharray={isAxis ? undefined : "6 4"}
              filter={isAxis ? "url(#glow-lines)" : undefined}
            />
          );
        })}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          let mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
          const pt = svgXY(mid, R.houseNums);
          return (
            <text key={`house-num-${i}`} x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="14" fill={c.houseNum}
              fontFamily="var(--font-mono)" fontWeight="600"
            >
              {i + 1}
            </text>
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
      </g>

      {/* ZODIAC (Starts Natal: 0deg rotation) */}
      <g id="static-zodiac" style={{ transformOrigin: "400px 400px", transform: "rotate(0deg)" }}>
        {SIGNS.map((s) => {
          const mid = svgXY(s.lon + 15, R.glyphs);
          const divFrom = svgXY(s.lon, R.outer);
          const divTo   = svgXY(s.lon, R.zodiacInner);
          return (
            <g key={s.name}>
              <path
                d={zodiacSectorPath(s.lon)}
                fill={ELEM_FILL[s.elem]} // Note: fill opacity will stack but it's fine
                fillOpacity="0.5"
                stroke={ELEM_STROKE[s.elem]}
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
              <g
                transform={`translate(${mid.x - 10}, ${mid.y - 10})`}
                style={{ color: c.glyphFill }}
                dangerouslySetInnerHTML={{ __html: SIGN_PATHS[s.name] }}
              />
              <line
                x1={divFrom.x} y1={divFrom.y} x2={divTo.x} y2={divTo.y}
                stroke={ELEM_STROKE[s.elem]} strokeWidth="1.2" strokeOpacity="0.4"
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
            <line key={`tick-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isMajor ? c.tickMajor : c.tick}
              strokeWidth={isMajor ? 1.2 : 0.5} />
          );
        })}
      </g>

      {/* STATIC CIRCLES */}
      <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" filter="url(#glow-lines)" />
      <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" filter="url(#glow-lines)" />
      <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" filter="url(#glow-lines)" />

      {/* ASPECT LINES (Geometric center web) */}
      <motion.g id="aspect-lines" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ duration: 1.5, delay: 0.5 }}>
        {ALL_ASPECTS.map((asp, i) => (
          <motion.line
            key={asp.id}
            id={`aspect-${asp.id}`}
            x1={asp.x1} y1={asp.y1}
            x2={asp.x2} y2={asp.y2}
            stroke={asp.color}
            strokeWidth="1.2"
            strokeDasharray={asp.length}
            initial={{ strokeDashoffset: asp.length }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 2, delay: 0.8 + (i * 0.05), ease: "easeOut" }}
          />
        ))}
      </motion.g>

      {/* PLANET ARCS & POSITIONS */}
      <g id="planet-layers">
        {ALL_PLANETS.map((p) => {
          const lon = NATAL_LON[p.id] + (PLANET_LON_OFFSET[p.id] ?? 0);
          
          // PALE GHOST = Natal Position
          const ptGhost    = svgXY(lon, R.planets);
          const pinPtGhost = svgXY(lon, R.zodiacInner - 5);
          const degGhost   = Math.floor(lon % 30);
          
          // ACTIVE = Relocated Position
          const lonActive  = lon + VISUAL_SHIFT;
          const ptActive   = svgXY(lonActive, R.planets);
          const pinPtActive= svgXY(lonActive, R.zodiacInner - 5);
          const degActive  = Math.floor(lonActive % 30);
          
          const sweepFlag  = VISUAL_SHIFT > 0 ? 0 : 1; 
          const arcLength  = Math.abs(VISUAL_SHIFT) * (Math.PI / 180) * R.planets;
          
          // The planet structurally holds its moved position if we're past it
          const planetTargetIndex = PLANET_INDICES[p.id] ?? 999;
          const isAtOrPast = activeIndex >= planetTargetIndex || activeIndex >= 5; // index 5 is map-intro
          
          // But the arc is ONLY visible and animating when we are ON this exact planet step
          const isDrawingArc = activeIndex === planetTargetIndex;

          return (
            <g key={p.id}>
              {/* === TRAJECTORY ARC === */}
              <motion.path
                id={`arc-${p.id}`}
                d={`M ${ptGhost.x} ${ptGhost.y} A ${R.planets} ${R.planets} 0 0 ${sweepFlag} ${ptActive.x} ${ptActive.y}`}
                fill="none"
                stroke={p.color}
                strokeWidth="2"
                strokeDasharray={arcLength}
                initial={{ strokeDashoffset: arcLength, opacity: 0 }}
                animate={{ 
                  strokeDashoffset: isDrawingArc ? 0 : arcLength,
                  opacity: isDrawingArc ? 1 : 0 
                }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                filter={`url(#glow-arc-${p.id})`}
              />

              {/* === THE ONE TRUE PLANET === */}
              <g id={`moving-planet-${p.id}`}>
                {/* Connector from glyph area to zodiac pin */}
                <motion.line
                  initial={{ x1: ptGhost.x, y1: ptGhost.y, x2: pinPtGhost.x, y2: pinPtGhost.y }}
                  animate={{ 
                    x1: isAtOrPast ? ptActive.x : ptGhost.x, 
                    y1: isAtOrPast ? ptActive.y : ptGhost.y,
                    x2: isAtOrPast ? pinPtActive.x : pinPtGhost.x, 
                    y2: isAtOrPast ? pinPtActive.y : pinPtGhost.y 
                  }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  stroke={p.color} strokeWidth="0.8" opacity="0.35"
                />
                
                {/* Zodiac pin dot */}
                <motion.circle 
                  initial={{ cx: pinPtGhost.x, cy: pinPtGhost.y }}
                  animate={{ cx: isAtOrPast ? pinPtActive.x : pinPtGhost.x, cy: isAtOrPast ? pinPtActive.y : pinPtGhost.y }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  r="2.8" fill={p.color} opacity="0.9" 
                />
                
                {/* Outer glow halos - precisely matching mockup-natal */}
                <motion.circle 
                   initial={{ cx: ptGhost.x, cy: ptGhost.y }}
                   animate={{ cx: isAtOrPast ? ptActive.x : ptGhost.x, cy: isAtOrPast ? ptActive.y : ptGhost.y }}
                   transition={{ duration: 1.2, ease: "easeInOut" }}
                   r="28" fill={p.color} opacity="0.08" />
                <motion.circle 
                   initial={{ cx: ptGhost.x, cy: ptGhost.y }}
                   animate={{ cx: isAtOrPast ? ptActive.x : ptGhost.x, cy: isAtOrPast ? ptActive.y : ptGhost.y }}
                   transition={{ duration: 1.2, ease: "easeInOut" }}
                   r="22" fill={p.color} opacity="0.05" />
                   
                {/* Glyph background pill */}
                <motion.circle 
                  initial={{ cx: ptGhost.x, cy: ptGhost.y }}
                  animate={{ cx: isAtOrPast ? ptActive.x : ptGhost.x, cy: isAtOrPast ? ptActive.y : ptGhost.y }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  r="20" fill={c.planetBg} stroke={p.color} strokeWidth="1.8" 
                />
                
                {/* Planet glyph */}
                <motion.text
                  initial={{ x: ptGhost.x, y: ptGhost.y }}
                  animate={{ x: isAtOrPast ? ptActive.x : ptGhost.x, y: isAtOrPast ? ptActive.y : ptGhost.y }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="20" fill={p.color}
                  fontFamily="var(--font-secondary)"
                  filter={`url(#glow-${p.id})`}
                >
                  {p.glyph}{"\uFE0E"}
                </motion.text>
                
                {/* Degree label */}
                <motion.text
                  initial={{ x: ptGhost.x, y: ptGhost.y + 34 }}
                  animate={{ x: isAtOrPast ? ptActive.x : ptGhost.x, y: isAtOrPast ? ptActive.y + 34 : ptGhost.y + 34 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="9" fill={p.color}
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                  opacity="0.9"
                >
                  {isAtOrPast ? degActive : degGhost}°
                </motion.text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
