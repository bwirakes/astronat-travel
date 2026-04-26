"use client";

import React, { useRef, useState } from "react";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import { PlanetPlacementHoverContent } from "@/app/components/ui/planet-placement-hover-content";
import type { V4ChartPlanet } from "@/app/lib/reading-viewmodel";

const CX = 400;
const CY = 400;

const R = {
  outer:       385,
  zodiacInner: 345,
  houseOuterOuter: 345,
  houseOuterInner: 275,
  houseInnerOuter: 275,
  houseInnerInner: 205,
  planetsOuter:   310,
  planetsInner:   240,
  inner:       205,
  glyphs:      365,
} as const;

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

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// We will default ASC to 180 (left side)
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

function houseSectorPath(cusp1: number, cusp2: number, asc: number, rOuter: number, rInner: number): string {
  const spanDeg = ((cusp2 - cusp1) + 360) % 360;
  const largeArc = spanDeg > 180 ? 1 : 0;
  const p1 = svgXY(cusp1, rOuter, asc);
  const p2 = svgXY(cusp2, rOuter, asc);
  const p3 = svgXY(cusp2, rInner, asc);
  const p4 = svgXY(cusp1, rInner, asc);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

interface Props {
  natalPlanets: V4ChartPlanet[];
  natalAnglesDeg: Record<"ASC"|"IC"|"DSC"|"MC", number> | null;
  relocatedAnglesDeg: Record<"ASC"|"IC"|"DSC"|"MC", number> | null;
  natalCuspsDeg: number[];
  relocatedCuspsDeg: number[];
}

export default function RelocationBiWheel({
  natalPlanets,
  natalAnglesDeg,
  relocatedAnglesDeg,
  natalCuspsDeg,
  relocatedCuspsDeg,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [houseMode, setHouseMode] = useState<"natal" | "relocated">("relocated");
  const [hoveredPlanet, setHoveredPlanet] = useState<{
    planet: V4ChartPlanet;
    x: number;
    y: number;
    isOuter: boolean;
  } | null>(null);

  const c = {
    circlePrimary:   "var(--v4-ink)",
    circleSecondary: "var(--v4-ink-soft)",
    circleInner:     "var(--v4-border)",
    glyphFill:       "var(--v4-ink)",
    houseAxisNatal:  "var(--v4-ink-faint)",
    houseLineNatal:  "var(--v4-border)",
    houseAxisRelo:   "var(--v4-ink)",
    houseLineRelo:   "var(--v4-ink-faint)",
    axisLabelNatal:  "var(--v4-ink-faint)",
    axisLabelRelo:   "var(--v4-ink)",
    tick:            "var(--v4-border)",
    tickMajor:       "var(--v4-ink-faint)",
    planetBgInner:   "var(--v4-bg)",
    planetBgOuter:   "var(--v4-bg)",
  };

  const stdPlanets = natalPlanets;
  
  // Choose which ASC to lock the wheel to.
  // When we switch house modes, we keep the wheel oriented so the chosen ASC is on the left (180deg).
  const activeAsc = houseMode === "natal" 
     ? (natalAnglesDeg?.ASC ?? natalCuspsDeg[0] ?? 0)
     : (relocatedAnglesDeg?.ASC ?? relocatedCuspsDeg[0] ?? 0);

  const activeCusps = houseMode === "natal" ? natalCuspsDeg : relocatedCuspsDeg;
  const isAxisColor = houseMode === "natal" ? c.houseAxisNatal : c.houseAxisRelo;
  const isLineColor = houseMode === "natal" ? c.houseLineNatal : c.houseLineRelo;

  // Stagger overlapping planets using simple offset logic
  const renderPlanets = stdPlanets.map((p, i) => {
     let offset = 0;
     for (let j = 0; j < stdPlanets.length; j++) {
        if(i !== j && Math.abs(stdPlanets[j].deg - p.deg) < 4) {
            offset = i > j ? 4 : -4;
        }
     }
     return { ...p, lonAdj: p.deg + offset };
  });

  const setHoverFromPointer = (event: React.PointerEvent<SVGGElement>, planet: V4ChartPlanet, isOuter: boolean) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoveredPlanet({ planet, x: event.clientX - rect.left, y: event.clientY - rect.top, isOuter });
  };

  const setHoverFromSvgPoint = (planet: V4ChartPlanet, x: number, y: number, isOuter: boolean) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoveredPlanet({ planet, x: (x / 800) * rect.width, y: (y / 800) * rect.height, isOuter });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* UI Toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
         <button 
           onClick={() => setHouseMode("natal")}
           style={{
             background: houseMode === "natal" ? "var(--v4-ink)" : "transparent",
             color: houseMode === "natal" ? "var(--v4-bg)" : "var(--v4-ink-soft)",
             border: `1px solid ${houseMode === "natal" ? "var(--v4-ink)" : "var(--v4-border)"}`,
             padding: "0.5rem 1rem",
             borderRadius: "var(--radius-full, 9999px)",
             fontFamily: "var(--font-mono, monospace)",
             fontSize: "0.75rem",
             textTransform: "uppercase",
             letterSpacing: "0.05em",
             cursor: "pointer",
             transition: "all 0.2s"
           }}
         >
           Natal Houses
         </button>
         <button 
           onClick={() => setHouseMode("relocated")}
           style={{
             background: houseMode === "relocated" ? "var(--v4-ink)" : "transparent",
             color: houseMode === "relocated" ? "var(--v4-bg)" : "var(--v4-ink-soft)",
             border: `1px solid ${houseMode === "relocated" ? "var(--v4-ink)" : "var(--v4-border)"}`,
             padding: "0.5rem 1rem",
             borderRadius: "var(--radius-full, 9999px)",
             fontFamily: "var(--font-mono, monospace)",
             fontSize: "0.75rem",
             textTransform: "uppercase",
             letterSpacing: "0.05em",
             cursor: "pointer",
             transition: "all 0.2s"
           }}
         >
           Relocated Houses
         </button>
      </div>

      <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
        <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "100%", maxHeight: "80vh" }}>
          <defs>
            {stdPlanets.map((p) => (
              <filter key={p.p} id={`glow-${p.p}`} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feFlood floodColor={p.color} floodOpacity="1" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
            <filter id="glow-lines" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ══ BACKGROUND WHEEL ══ */}
          <g id="bg-wheel" style={{ transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}>
            {activeCusps.length === 12 && activeCusps.map((cusp, i) => {
              const next = activeCusps[(i + 1) % 12];
              const signIdx = Math.floor(cusp / 30) % 12;
              const elem = SIGNS[signIdx]?.elem || "fire";
              return (
                <path
                  key={`house-wedge-${i}`}
                  d={houseSectorPath(cusp, next, activeAsc, R.houseOuterOuter, R.inner)}
                  fill={HOUSE_ELEM_FILL[elem]}
                />
              );
            })}

            <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" />
            <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" />
            {/* Split ring lines */}
            <circle cx={CX} cy={CY} r={R.houseOuterInner} fill="none" stroke={c.circleInner} strokeWidth="0.8" opacity="0.6" />
            <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" />

            {SIGNS.map((s) => {
              const mid = svgXY(s.lon + 15, R.glyphs, activeAsc);
              const divFrom = svgXY(s.lon, R.outer, activeAsc);
              const divTo   = svgXY(s.lon, R.zodiacInner, activeAsc);
              return (
                <g key={s.name}>
                  <path
                    d={zodiacSectorPath(s.lon, activeAsc)}
                    fill={ELEM_FILL[s.elem]}
                    stroke={ELEM_STROKE[s.elem]}
                    strokeWidth="0.5"
                  />
                  <g
                    transform={`translate(${mid.x - 10}, ${mid.y - 10})`}
                    style={{ color: c.glyphFill }}
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
              const from = svgXY(lon, R.outer, activeAsc);
              const to   = svgXY(lon, innerR, activeAsc);
              return (
                <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isMajor ? c.tickMajor : c.tick}
                  strokeWidth={isMajor ? 1.2 : 0.5} />
              );
            })}

            {activeCusps.length === 12 && activeCusps.map((cusp, i) => {
              const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
              const from = svgXY(cusp, R.zodiacInner, activeAsc);
              const to   = svgXY(cusp, R.inner, activeAsc);
              return (
                <line key={i}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isAxis ? isAxisColor : isLineColor}
                  strokeWidth={isAxis ? 2.5 : 1.2}
                  strokeDasharray={isAxis ? undefined : "6 4"}
                />
              );
            })}

            {/* Inner Ring Labels */}
            {activeCusps.length === 12 && ([
              { label: "ASC", idx: 0 },
              { label: "DSC", idx: 6 },
              { label: "MC",  idx: 9 },
              { label: "IC",  idx: 3 },
            ] as const).map(({ label, idx }) => {
              const pt = svgXY(activeCusps[idx], R.inner - 18, activeAsc);
              return (
                <text key={label} x={pt.x} y={pt.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="10" fill={houseMode === "natal" ? c.axisLabelNatal : c.axisLabelRelo}
                  fontFamily="var(--font-mono, monospace)" letterSpacing="1"
                  fontWeight="600"
                >
                  {label}
                </text>
              );
            })}
          </g>

          {/* INNER TRACK PLANETS (Natal) */}
          <g id="inner-planets">
            {renderPlanets.map((p) => {
              const pt    = svgXY(p.lonAdj, R.planetsInner, activeAsc);
              const deg   = Math.floor(p.deg % 30);
              const isHovered = hoveredPlanet?.planet.p === p.p && !hoveredPlanet?.isOuter;
              return (
                <g
                  key={`inner-${p.p}`}
                  role="button"
                  tabIndex={0}
                  onPointerEnter={(event) => setHoverFromPointer(event, p, false)}
                  onPointerLeave={() => setHoveredPlanet(null)}
                  style={{ cursor: "zoom-in", outline: "none", transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}
                >
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "28" : "22"} fill={p.color} opacity={isHovered ? "0.15" : "0.05"} />
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "21" : "16"} fill={p.color} opacity={isHovered ? "0.1" : "0.0"} />
                  <circle cx={pt.x} cy={pt.y} r="14" fill={c.planetBgInner} stroke={p.color} strokeWidth={isHovered ? "2" : "1"} opacity="1" />
                  <text
                    x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central"
                    fontSize="14" fill={p.color} fontFamily="var(--font-secondary, serif)"
                  >
                    {p.glyph}
                  </text>
                  <text
                    x={pt.x} y={pt.y + 22} textAnchor="middle" dominantBaseline="central"
                    fontSize="7" fill={p.color} fontFamily="var(--font-mono, monospace)" fontWeight="600" opacity="0.8"
                  >
                    {deg}°
                  </text>
                </g>
              );
            })}
          </g>

          {/* OUTER TRACK PLANETS (Relocated/Natal duplicated) */}
          <g id="outer-planets">
            {renderPlanets.map((p) => {
              const pt    = svgXY(p.lonAdj, R.planetsOuter, activeAsc);
              const pinPt = svgXY(p.deg, R.zodiacInner - 5, activeAsc);
              const deg   = Math.floor(p.deg % 30);
              const isHovered = hoveredPlanet?.planet.p === p.p && hoveredPlanet?.isOuter;
              return (
                <g
                  key={`outer-${p.p}`}
                  role="button"
                  tabIndex={0}
                  onPointerEnter={(event) => setHoverFromPointer(event, p, true)}
                  onPointerLeave={() => setHoveredPlanet(null)}
                  style={{ cursor: "zoom-in", outline: "none", transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}
                >
                  <line
                    x1={pt.x} y1={pt.y} x2={pinPt.x} y2={pinPt.y}
                    stroke={p.color} strokeWidth={isHovered ? "1.4" : "0.8"} opacity={isHovered ? "0.85" : "0.35"}
                  />
                  <circle cx={pinPt.x} cy={pinPt.y} r="2.8" fill={p.color} opacity="0.9" />
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "34" : "28"} fill={p.color} opacity={isHovered ? "0.18" : "0.08"} />
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "27" : "22"} fill={p.color} opacity={isHovered ? "0.1" : "0.05"} />
                  <circle cx={pt.x} cy={pt.y} r="20" fill={c.planetBgOuter} stroke={p.color} strokeWidth={isHovered ? "3" : "2"} />
                  <text
                    x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central"
                    fontSize="20" fill={p.color} fontFamily="var(--font-secondary, serif)"
                  >
                    {p.glyph}
                  </text>
                  <text
                    x={pt.x} y={pt.y + 34} textAnchor="middle" dominantBaseline="central"
                    fontSize="9" fill={p.color} fontFamily="var(--font-mono, monospace)" fontWeight="600" opacity="0.9"
                  >
                    {deg}°
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {hoveredPlanet ? (
          <div
            role="status"
            style={{
              position: "absolute",
              left: `min(calc(100% - 320px), ${hoveredPlanet.x + 18}px)`,
              top: `max(0px, ${hoveredPlanet.y - 18}px)`,
              zIndex: 20,
              width: "300px",
              pointerEvents: "none",
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-lg)",
            }}
          >
             <div style={{ marginBottom: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-y2k-blue)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {hoveredPlanet.isOuter ? "Relocated Placement" : "Natal Placement"}
             </div>
             <PlanetPlacementHoverContent
              planet={hoveredPlanet.planet.p.replace(/<[^>]*>/g, '')}
              sign={hoveredPlanet.planet.plain.split(' ')[0]}
              degree={Math.floor(hoveredPlanet.planet.deg % 30).toString() + "°"}
              house={(() => {
                // House is derived from whichever ASC the active layer uses.
                // If the planet is on the relocated (outer) ring, use the
                // relocated ASC; otherwise the natal ASC.
                const ascLon = hoveredPlanet.isOuter
                  ? (relocatedAnglesDeg?.ASC ?? relocatedCuspsDeg[0] ?? 0)
                  : (natalAnglesDeg?.ASC ?? natalCuspsDeg[0] ?? 0);
                let offset = hoveredPlanet.planet.deg - ascLon;
                if (offset < 0) offset += 360;
                return Math.floor(offset / 30) + 1;
              })()}
              implication={hoveredPlanet.planet.plain}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
