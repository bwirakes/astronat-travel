"use client";

import { useEffect, useRef } from "react";
import type { Chart as AstroChartType } from "@astrodraw/astrochart";

// ── Types ──────────────────────────────────────────────────────

export interface NatalPoint {
  longitude: number;
  retrograde?: boolean;
}

export interface NatalData {
  sun: NatalPoint;
  moon: NatalPoint;
  mercury: NatalPoint;
  venus: NatalPoint;
  mars: NatalPoint;
  jupiter: NatalPoint;
  saturn: NatalPoint;
  uranus: NatalPoint;
  neptune: NatalPoint;
  pluto: NatalPoint;
  chiron?: NatalPoint;
  houses: number[]; // 12 house cusp degrees
}

// ── Data adapter: our format → AstroChart format ──────────────

function toAstroChartFormat(natal: NatalData) {
  const planets: Record<string, number[]> = {
    Sun:     [natal.sun.longitude],
    Moon:    [natal.moon.longitude],
    Mercury: [natal.mercury.longitude],
    Venus:   [natal.venus.longitude],
    Mars:    [natal.mars.longitude],
    Jupiter: [natal.jupiter.longitude],
    Saturn:  [natal.saturn.longitude],
    Uranus:  [natal.uranus.longitude],
    Neptune: [natal.neptune.longitude],
    Pluto:   [natal.pluto.longitude],
  };

  if (natal.chiron) {
    planets["Chiron"] = [natal.chiron.longitude];
  }

  return {
    planets,
    cusps: natal.houses as [number, number, number, number, number, number, number, number, number, number, number, number],
  };
}

// ── CSS variable resolver ──────────────────────────────────────

function resolveVar(token: string, fallback = "#888888"): string {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return val || fallback;
}

// ── ChartWheel Component ───────────────────────────────────────

interface ChartWheelProps {
  natal: NatalData;
  size?: number;
}

export function ChartWheel({ natal, size = 480 }: ChartWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Stable ID per mount
  const idRef = useRef(`astronat-wheel-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous chart
    container.innerHTML = "";
    container.id = idRef.current;

    (async () => {
      const { Chart } = await import("@astrodraw/astrochart");

      // Resolve CSS tokens to hex at render time (SSR-safe)
      const fg      = resolveVar("--text-primary",       "#1a1a1a");
      const fgSub   = resolveVar("--text-secondary",     "#555555");
      const fgMuted = resolveVar("--text-tertiary",      "#999999");
      const border  = resolveVar("--surface-border",     "#dddddd");
      const blue    = resolveVar("--color-y2k-blue",     "#3B82F6");
      const sage    = resolveVar("--sage",               "#5A9E78");
      const mars    = resolveVar("--color-planet-mars",  "#D94F3D");
      const spiced  = resolveVar("--color-spiced-life",  "#C4622D");
      const acqua   = resolveVar("--color-acqua",        "#5CC8C8");

      const chart = new (Chart as any)(idRef.current, size, size, {
        // ── Size & scale ─────────────────────────────
        SYMBOL_SCALE: 1.4,           // larger planet glyphs
        POINTS_TEXT_SIZE: 9,         // degree / retrograde label

        // ── Colours ──────────────────────────────────
        COLOR_BACKGROUND: "transparent",
        POINTS_COLOR:  fg,           // all planet symbols
        SIGNS_COLOR:   fgSub,        // zodiac sign glyphs
        CIRCLE_COLOR:  border,
        LINE_COLOR:    border,
        CUSPS_FONT_COLOR: fgMuted,
        SYMBOL_AXIS_FONT_COLOR: fgMuted,

        // ── Aspects: 8 types ─────────────────────────
        ASPECTS: {
          conjunction:  { degree:   0, orbit: 10, color: blue    },
          semisextile:  { degree:  30, orbit:  3, color: acqua   },
          sextile:      { degree:  60, orbit:  5, color: sage     },
          square:       { degree:  90, orbit:  8, color: mars     },
          trine:        { degree: 120, orbit:  8, color: sage     },
          quincunx:     { degree: 150, orbit:  3, color: spiced   },
          opposition:   { degree: 180, orbit: 10, color: spiced   },
          semisquare:   { degree:  45, orbit:  3, color: mars     },
        },
      } as any);

      const radix = chart.radix(toAstroChartFormat(natal));
      // Draw aspect lines inside the wheel
      radix.aspects();
    })();

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [natal, size]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: size,
        aspectRatio: "1 / 1",
        margin: "0 auto",
      }}
    >
      {/* AstroChart injects the SVG into this div */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
