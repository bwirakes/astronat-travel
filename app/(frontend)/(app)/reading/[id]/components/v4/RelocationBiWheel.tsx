"use client";

import React, { useRef, useState } from "react";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import { getOrdinal } from "@/app/lib/astro-wording";
import { PlanetPlacementHoverContent } from "@/app/components/ui/planet-placement-hover-content";
import type { V4ChartPlanet } from "@/app/lib/reading-viewmodel";
import {
  WHEEL_CX as CX,
  WHEEL_CY as CY,
  NATAL_WHEEL_SIGNS as SIGNS,
  NATAL_WHEEL_ELEM_FILL as ELEM_FILL,
  NATAL_WHEEL_ELEM_STROKE as ELEM_STROKE,
  NATAL_WHEEL_HOUSE_ELEM_FILL as HOUSE_ELEM_FILL,
  natalWheelToRad as toRad,
  natalWheelSvgXY as svgXY,
} from "@/app/lib/natal-wheel-shared";

export { SIGNS, ELEM_FILL, ELEM_STROKE, HOUSE_ELEM_FILL, toRad, svgXY };

export const R = {
  outer:           385,
  zodiacInner:     345,
  planetsOuterOut: 345,
  planetsOuterIn:  275,
  planetsInnerOut: 275,
  planetsInnerIn:  205,
  housesInner:     160,
  planetsOuter:    310,
  planetsInner:    240,
  glyphs:          365,
} as const;

const HOUSE_LABEL_R = (R.planetsInnerIn + R.housesInner) / 2;
const HOUSE_NUM_R = HOUSE_LABEL_R + 4;
const AXIS_LABEL_R = HOUSE_LABEL_R - 8;
const RELOCATED_ANGLE_LINE_INNER_R = R.planetsOuterOut + 4;
const RELOCATED_ANGLE_LINE_OUTER_R = R.outer + 22;
const RELOCATED_ANGLE_LABEL_R = R.outer + 38;
const STAGGER_CLUSTER_ORB = 6;
const RADIAL_LANES = [-10, 10, 0, 8, -8, 12, -12, -4, 4, 0];

type HoveredPlanet = {
  planet: V4ChartPlanet;
  x: number;
  y: number;
  isOuter: boolean;
};

type RelocatedAngleLabel = "ASC" | "DSC" | "IC" | "MC";
type AngleContext = "natal" | "relocated";

type HoveredAngle = {
  label: RelocatedAngleLabel;
  lon: number;
  x: number;
  y: number;
  context: AngleContext;
};

type RenderPlanet = V4ChartPlanet & {
  lonAdj: number;
  radialOffset: number;
  isClustered: boolean;
};

function normalizeDeg(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function circularGap(fromDeg: number, toDeg: number) {
  return normalizeDeg(toDeg - fromDeg);
}

function degreeSignLabel(deg: number) {
  const normalized = normalizeDeg(deg);
  return `${Math.floor(normalized % 30)}° ${SIGNS[Math.floor(normalized / 30) % 12]?.glyph}`;
}

function signNameFromDegree(deg: number) {
  const normalized = normalizeDeg(deg);
  return SIGNS[Math.floor(normalized / 30) % 12]?.name || "Aries";
}

function angleMeaning(label: RelocatedAngleLabel, context: AngleContext) {
  if (context === "natal") {
    switch (label) {
      case "ASC":
        return "Your natal Ascendant describes your baseline presence, body language, and first impression.";
      case "DSC":
        return "Your natal Descendant describes the relationship patterns and people you naturally meet through one-to-one exchange.";
      case "IC":
        return "Your natal IC describes your private foundation, home imprint, roots, and emotional ground.";
      case "MC":
        return "Your natal MC describes your baseline public direction, calling, reputation, and visibility.";
    }
  }

  switch (label) {
    case "ASC":
      return "How this place changes your first impression, body language, and way of entering the room.";
    case "DSC":
      return "How this place changes the kinds of people, clients, and partners you tend to meet.";
    case "IC":
      return "How this place changes your private life, home base, roots, and emotional ground.";
    case "MC":
      return "How this place changes your public direction, visibility, career tone, and reputation.";
  }
}

export function zodiacSectorPath(signLon: number, asc: number): string {
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

export function houseSectorPath(cusp1: number, cusp2: number, asc: number, rOuter: number, rInner: number): string {
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
  const [hoveredPlanet, setHoveredPlanet] = useState<HoveredPlanet | null>(null);
  const [hoveredAngle, setHoveredAngle] = useState<HoveredAngle | null>(null);

  const c = {
    circlePrimary:   "var(--v4-ink)",
    circleSecondary: "var(--v4-ink-soft)",
    circleInner:     "var(--v4-border)",
    glyphFill:       "var(--v4-ink)",
    houseAxisNatal:  "var(--v4-ink)",
    houseLineNatal:  "var(--v4-border)",
    houseAxisRelo:   "var(--color-spiced-life)",
    houseLineRelo:   "var(--color-spiced-life)",
    axisLabelNatal:  "var(--v4-ink-soft)",
    houseNum:        "var(--v4-ink-soft)",
    tick:            "var(--v4-border)",
    tickMajor:       "var(--v4-ink-faint)",
    planetBgInner:   "var(--v4-bg)",
    planetBgOuter:   "var(--v4-bg)",
  };

  const stdPlanets = natalPlanets;
  
  // Zodiac Wheel requires the wheel to be fixed so Natal ASC is exactly 180 (Left)
  const activeAsc = natalAnglesDeg?.ASC ?? natalCuspsDeg[0] ?? 0;

  const housePositionFromCusps = (planetLon: number, cusps: number[]) => {
    if (!cusps || cusps.length !== 12) return null;
    for (let i = 0; i < 12; i++) {
      const cusp = cusps[i];
      const nextCusp = cusps[(i + 1) % 12];
      const span = normalizeDeg(nextCusp - cusp);
      const dist = normalizeDeg(planetLon - cusp);
      if (dist < span || (i === 11 && dist === span)) {
        return { houseIndex: i, fraction: span > 0 ? dist / span : 0 };
      }
    }
    return null;
  };

  const projectRelocatedPlanetToFixedHouses = (planetLon: number) => {
    const relocatedPosition = housePositionFromCusps(planetLon, relocatedCuspsDeg);
    if (relocatedPosition && natalCuspsDeg.length === 12) {
      const natalStart = natalCuspsDeg[relocatedPosition.houseIndex];
      const natalEnd = natalCuspsDeg[(relocatedPosition.houseIndex + 1) % 12];
      const natalSpan = normalizeDeg(natalEnd - natalStart);
      return normalizeDeg(natalStart + natalSpan * relocatedPosition.fraction);
    }

    const relocatedAsc = relocatedAnglesDeg?.ASC ?? relocatedCuspsDeg[0] ?? activeAsc;
    return normalizeDeg(activeAsc + normalizeDeg(planetLon - relocatedAsc));
  };

  // Stagger local clusters in the visual coordinate space without changing the planet's true zodiac degree.
  const staggerPlanets = (
    arr: V4ChartPlanet[],
    visualDegForPlanet: (planet: V4ChartPlanet) => number = (planet) => planet.deg,
  ): RenderPlanet[] => {
    if (arr.length === 0) return [];

    const sorted = arr
      .map((planet, index) => ({ planet, index, deg: normalizeDeg(visualDegForPlanet(planet)) }))
      .sort((a, b) => a.deg - b.deg);

    let largestGapIdx = 0;
    let largestGap = -1;
    for (let i = 0; i < sorted.length; i++) {
      const gap = circularGap(sorted[i].deg, sorted[(i + 1) % sorted.length].deg);
      if (gap > largestGap) {
        largestGap = gap;
        largestGapIdx = i;
      }
    }

    const ordered = [
      ...sorted.slice(largestGapIdx + 1),
      ...sorted.slice(0, largestGapIdx + 1),
    ];

    const clusters: typeof ordered[] = [];
    ordered.forEach((item) => {
      const current = clusters[clusters.length - 1];
      const previous = current?.[current.length - 1];
      if (!current || !previous || circularGap(previous.deg, item.deg) > STAGGER_CLUSTER_ORB) {
        clusters.push([item]);
        return;
      }
      current.push(item);
    });

    const staggered = arr.map((planet) => ({
      ...planet,
      lonAdj: normalizeDeg(visualDegForPlanet(planet)),
      radialOffset: 0,
      isClustered: false,
    }));

    clusters.forEach((cluster) => {
      if (cluster.length === 1) return;

      cluster.forEach((item, clusterIndex) => {
        const step = Math.min(4.5, 18 / Math.max(cluster.length - 1, 1));
        const centeredIndex = clusterIndex - (cluster.length - 1) / 2;
        const cycle = Math.floor(clusterIndex / RADIAL_LANES.length);
        const cycleDirection = clusterIndex % 2 === 0 ? 1 : -1;
        staggered[item.index] = {
          ...staggered[item.index],
          lonAdj: item.planet.deg + centeredIndex * step,
          radialOffset: RADIAL_LANES[clusterIndex % RADIAL_LANES.length] + cycle * 2 * cycleDirection,
          isClustered: true,
        };
      });
    });

    return staggered;
  };

  const innerPlanets = staggerPlanets(stdPlanets);
  const outerPlanets = staggerPlanets(stdPlanets, (planet) => projectRelocatedPlanetToFixedHouses(planet.deg));

  const setHoverFromPointer = (event: React.PointerEvent<SVGGElement>, planet: V4ChartPlanet, isOuter: boolean) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoveredAngle(null);
    setHoveredPlanet({ planet, x: event.clientX - rect.left, y: event.clientY - rect.top, isOuter });
  };

  const setAngleHoverFromPointer = (
    event: React.PointerEvent<SVGGElement>,
    label: RelocatedAngleLabel,
    lon: number,
    context: AngleContext,
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoveredPlanet(null);
    setHoveredAngle({ label, lon, context, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const resolvePlanetHouse = (planet: V4ChartPlanet, isOuter: boolean) => {
    const storedHouse = isOuter ? planet.relocatedHouse : planet.natalHouse;
    if (typeof storedHouse === "number" && storedHouse >= 1 && storedHouse <= 12) return storedHouse;

    const cusps = isOuter ? relocatedCuspsDeg : natalCuspsDeg;
    const ascLon = isOuter
      ? (relocatedAnglesDeg?.ASC ?? relocatedCuspsDeg[0] ?? 0)
      : (natalAnglesDeg?.ASC ?? natalCuspsDeg[0] ?? 0);

    if (!cusps || cusps.length !== 12) {
      return Math.floor(normalizeDeg(planet.deg - ascLon) / 30) + 1;
    }

    for (let i = 0; i < 12; i++) {
      const cusp = cusps[i];
      const nextCusp = cusps[(i + 1) % 12];
      const span = normalizeDeg(nextCusp - cusp);
      const dist = normalizeDeg(planet.deg - cusp);
      if (dist <= span) return i + 1;
    }

    return 1;
  };

  const hoveredPlacement = hoveredPlanet
    ? {
        house: resolvePlanetHouse(hoveredPlanet.planet, hoveredPlanet.isOuter),
        sign: hoveredPlanet.planet.sign || signNameFromDegree(hoveredPlanet.planet.deg),
        degree: hoveredPlanet.planet.degree || `${Math.floor(normalizeDeg(hoveredPlanet.planet.deg) % 30)}°`,
      }
    : null;
  const hoveredImplication = hoveredPlanet?.isOuter && hoveredPlacement
    ? `In the relocated chart, your ${hoveredPlanet.planet.p} stays in ${hoveredPlacement.sign} but lands in your ${getOrdinal(hoveredPlacement.house)} house. The zodiac degree is natal; the house emphasis is what changes in this place.`
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
        <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "100%", maxHeight: "80vh" }}>
          <defs>
            <filter id="glow-house-active" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ══ BACKGROUND WHEEL ══ */}
          <g id="bg-wheel" style={{ transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}>
            
            {/* Natal House Wedges filling the whole inner field (345 down to 160) */}
            {natalCuspsDeg.length === 12 && natalCuspsDeg.map((cusp, i) => {
              const next = natalCuspsDeg[(i + 1) % 12];
              const signIdx = Math.floor(cusp / 30) % 12;
              const elem = SIGNS[signIdx]?.elem || "fire";
              return (
                <path
                  key={`house-wedge-nat-${i}`}
                  d={houseSectorPath(cusp, next, activeAsc, R.zodiacInner, R.housesInner)}
                  fill={HOUSE_ELEM_FILL[elem]}
                />
              );
            })}

            {/* Zodiac Rim Outer Wedges (385 to 345) */}
            {SIGNS.map((s) => {
              const mid = svgXY(s.lon + 15, R.glyphs, activeAsc);
              const divFrom = svgXY(s.lon, R.outer, activeAsc);
              const divTo   = svgXY(s.lon, R.zodiacInner, activeAsc);
              return (
                <g key={`sign-${s.name}`}>
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
            
            {/* Concentric Boundary Rings */}
            <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" />
            <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" />
            
            {/* Inner Ring Dividers - Height of 70 for both planets rings */}
            <circle cx={CX} cy={CY} r={R.planetsOuterIn} fill="none" stroke={c.circleInner} strokeWidth="1.2" strokeDasharray="3 3"/>
            <circle cx={CX} cy={CY} r={R.planetsInnerIn} fill="none" stroke={c.circleInner} strokeWidth="1" />
            <circle cx={CX} cy={CY} r={R.housesInner} fill="none" stroke={c.circleInner} strokeWidth="1" />

            {/* 5° tick marks on Zodiac Ring */}
            {Array.from({ length: 72 }, (_, i) => {
              const lon = i * 5;
              const isMajor = lon % 30 === 0;
              const innerR = R.outer - (isMajor ? 11 : 5);
              const from = svgXY(lon, R.outer, activeAsc);
              const to   = svgXY(lon, innerR, activeAsc);
              return (
                <line key={`tick-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isMajor ? c.tickMajor : c.tick}
                  strokeWidth={isMajor ? 1.2 : 0.5} />
              );
            })}

            {/* Natal House Lines (Solid, spanning to center) */}
            {natalCuspsDeg.length === 12 && natalCuspsDeg.map((cusp, i) => {
              const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
              const from = svgXY(cusp, R.zodiacInner, activeAsc);
              const to   = svgXY(cusp, R.housesInner, activeAsc);
              const axisLabel = ({ 0: "ASC", 3: "IC", 6: "DSC", 9: "MC" } as const)[i as 0 | 3 | 6 | 9];
              const isHovered = isAxis && hoveredAngle?.context === "natal" && hoveredAngle.label === axisLabel;
              return (
                <g
                  key={`line-nat-${i}`}
                  role={isAxis ? "button" : undefined}
                  tabIndex={isAxis ? 0 : undefined}
                  onPointerEnter={isAxis && axisLabel ? (event) => setAngleHoverFromPointer(event, axisLabel, cusp, "natal") : undefined}
                  onPointerLeave={isAxis ? () => setHoveredAngle(null) : undefined}
                  style={{ cursor: isAxis ? "zoom-in" : "default", outline: "none" }}
                >
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={isAxis ? c.houseAxisNatal : c.houseLineNatal}
                    strokeWidth={isHovered ? 3 : (isAxis ? 2.2 : 0.9)}
                    opacity={isAxis ? "0.9" : "0.58"}
                  />
                  {isAxis && (
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="transparent"
                      strokeWidth="16"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              );
            })}

            {/* House Numbers 1–12 placed in innermost separate ring! */}
            {natalCuspsDeg.length === 12 && natalCuspsDeg.map((cusp, i) => {
              const next = natalCuspsDeg[(i + 1) % 12];
              const mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
              const pt = svgXY(mid, HOUSE_NUM_R, activeAsc);
              return (
                <text key={`house-num-${i}`} x={pt.x} y={pt.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="13" fill={c.houseNum}
                  fontFamily="var(--font-mono)" fontWeight="650"
                  letterSpacing="0.5"
                >
                  {i + 1}
                </text>
              );
            })}

            {/* ASC / DSC / MC / IC Labels for Natal placed right on the cusp edges! */}
            {natalCuspsDeg.length === 12 && ([
              { label: "ASC", idx: 0 },
              { label: "DSC", idx: 6 },
              { label: "MC",  idx: 9 },
              { label: "IC",  idx: 3 },
            ] as const).map(({ label, idx }) => {
              const pt = svgXY(natalCuspsDeg[idx], AXIS_LABEL_R, activeAsc);
              const isHovered = hoveredAngle?.context === "natal" && hoveredAngle.label === label;
              return (
                <g
                  key={`axis-${label}`}
                  role="button"
                  tabIndex={0}
                  onPointerEnter={(event) => setAngleHoverFromPointer(event, label, natalCuspsDeg[idx], "natal")}
                  onPointerLeave={() => setHoveredAngle(null)}
                  style={{ cursor: "zoom-in", outline: "none" }}
                >
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "16" : "13"} fill="transparent" />
                  <text x={pt.x} y={pt.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={isHovered ? "10.5" : "9.5"} fill={c.houseAxisNatal}
                    fontFamily="var(--font-mono)" letterSpacing="1.4"
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* INNER TRACK PLANETS (Natal) */}
          <g id="inner-planets">
            {innerPlanets.map((p) => {
              const pt    = svgXY(p.lonAdj, R.planetsInner + p.radialOffset, activeAsc);
              const pinPt = svgXY(p.deg, R.housesInner + 5, activeAsc);
              const isHovered = hoveredPlanet?.planet.p === p.p && !hoveredPlanet?.isOuter;
              const markerR = p.isClustered ? 17 : 18;
              return (
                <g
                  key={`inner-${p.p}`}
                  role="button"
                  tabIndex={0}
                  onPointerEnter={(event) => setHoverFromPointer(event, p, false)}
                  onPointerLeave={() => setHoveredPlanet(null)}
                  style={{ cursor: "zoom-in", outline: "none", transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}
                >
                  {/* Stem to center */}
                  <line x1={pt.x} y1={pt.y} x2={pinPt.x} y2={pinPt.y} stroke={p.color} strokeWidth="0.8" opacity="0.15" />
                  
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "28" : "22"} fill={p.color} opacity={isHovered ? "0.15" : "0.05"} />
                  <circle cx={pt.x} cy={pt.y} r={isHovered ? "21" : "16"} fill={p.color} opacity={isHovered ? "0.1" : "0.0"} />
                  <circle cx={pt.x} cy={pt.y} r={markerR} fill={c.planetBgInner} stroke={p.color} strokeWidth={isHovered ? "2.5" : "1.8"} opacity="1" />
                  <text
                    x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={p.isClustered ? "16" : "17"} fill={p.color} fontFamily="var(--font-secondary)" fontWeight="600"
                  >
                    {p.glyph}
                  </text>
                  <text
                    x={pt.x} y={pt.y + 24} textAnchor="middle" dominantBaseline="central"
                    fontSize="8" fill={p.color} fontFamily="var(--font-mono)" fontWeight="700" opacity="0.9"
                  >
                    {degreeSignLabel(p.deg)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* OUTER TRACK PLANETS (Relocated) */}
          <g id="outer-planets">
            {outerPlanets.map((p) => {
              const outerRadialOffset = Math.max(-8, Math.min(p.radialOffset, 8));
              const pt    = svgXY(p.lonAdj, R.planetsOuter + outerRadialOffset, activeAsc);
              const pinPt = svgXY(p.lonAdj, R.zodiacInner - 5, activeAsc);
              const isHovered = hoveredPlanet?.planet.p === p.p && hoveredPlanet?.isOuter;
              const markerR = p.isClustered ? 19 : 20;
              const outerHaloR = p.isClustered ? (isHovered ? 30 : 24) : (isHovered ? 34 : 28);
              const outerHaloInnerR = p.isClustered ? (isHovered ? 24 : 19) : (isHovered ? 27 : 22);
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
                  
                  <circle cx={pt.x} cy={pt.y} r={outerHaloR} fill={p.color} opacity={isHovered ? "0.18" : "0.08"} />
                  <circle cx={pt.x} cy={pt.y} r={outerHaloInnerR} fill={p.color} opacity={isHovered ? "0.1" : "0.05"} />
                  <circle cx={pt.x} cy={pt.y} r={markerR} fill={c.planetBgOuter} stroke={p.color} strokeWidth={isHovered ? "3" : "2"} />
                  <text
                    x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={p.isClustered ? "19" : "20"} fill={p.color} fontFamily="var(--font-secondary)"
                  >
                    {p.glyph}
                  </text>
                  <text
                    x={pt.x} y={pt.y + 34} textAnchor="middle" dominantBaseline="central"
                    fontSize="9" fill={p.color} fontFamily="var(--font-mono)" fontWeight="600" opacity="0.9"
                  >
                    {degreeSignLabel(p.deg)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Relocated angles sit outside the planet rings so the houses can stay fixed. */}
          {relocatedAnglesDeg && (["ASC", "DSC", "IC", "MC"] as const).map((label) => {
            const angleLon = relocatedAnglesDeg[label];
            const from = svgXY(angleLon, RELOCATED_ANGLE_LINE_INNER_R, activeAsc);
            const to = svgXY(angleLon, RELOCATED_ANGLE_LINE_OUTER_R, activeAsc);
            const labelPt = svgXY(angleLon, RELOCATED_ANGLE_LABEL_R, activeAsc);
            const isHovered = hoveredAngle?.label === label;

            return (
              <g
                key={`relocated-angle-${label}`}
                role="button"
                tabIndex={0}
                onPointerEnter={(event) => setAngleHoverFromPointer(event, label, angleLon, "relocated")}
                onPointerLeave={() => setHoveredAngle(null)}
                style={{ cursor: "zoom-in", outline: "none" }}
              >
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={c.houseAxisRelo}
                  strokeWidth={isHovered ? "2.4" : "1.8"}
                  strokeDasharray="5 5"
                  opacity={isHovered ? "1" : "0.9"}
                />
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="transparent"
                  strokeWidth="18"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={from.x} cy={from.y} r={isHovered ? "4.5" : "3"} fill={c.houseAxisRelo} opacity="0.95" />
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fill={c.houseAxisRelo}
                  fontFamily="var(--font-mono)"
                  fontWeight="800"
                  letterSpacing="1.2"
                  pointerEvents="none"
                >
                  R-{label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredPlanet && hoveredPlacement ? (
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
              sign={hoveredPlacement.sign}
              degree={hoveredPlacement.degree}
              house={hoveredPlacement.house}
              implication={hoveredImplication}
              context={hoveredPlanet.isOuter ? "relocated" : "natal"}
            />
          </div>
        ) : null}

        {hoveredAngle ? (
          <div
            role="status"
            style={{
              position: "absolute",
              left: `min(calc(100% - 300px), ${hoveredAngle.x + 18}px)`,
              top: `max(0px, ${hoveredAngle.y - 18}px)`,
              zIndex: 20,
              width: "280px",
              pointerEvents: "none",
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-lg)",
            }}
          >
            <div style={{ marginBottom: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: hoveredAngle.context === "relocated" ? "var(--color-spiced-life)" : "var(--color-y2k-blue)", textTransform: "uppercase", letterSpacing: "1px" }}>
              {hoveredAngle.context === "relocated" ? "Relocated Angle" : "Natal Angle"}
            </div>
            <h4
              style={{
                margin: 0,
                color: "var(--text-primary)",
                fontFamily: "var(--font-primary)",
                fontSize: "1.2rem",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {hoveredAngle.label}
            </h4>
            <div
              style={{
                marginTop: "0.5rem",
                marginBottom: "0.75rem",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {Math.floor(normalizeDeg(hoveredAngle.lon) % 30)}° {signNameFromDegree(hoveredAngle.lon)}
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {angleMeaning(hoveredAngle.label, hoveredAngle.context)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
