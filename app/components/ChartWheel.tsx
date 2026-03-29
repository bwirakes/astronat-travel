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

      const chart = new (Chart as any)(idRef.current, size, size, {
        // ── Background ───────────────────────────────
        PAPER_COLOR: "transparent",
        // ── Circles & lines ──────────────────────────
        CIRCLE_COLOR: resolveVar("--surface-border", "#333"),
        LINE_COLOR: resolveVar("--surface-border", "#333"),
        // ── Text ─────────────────────────────────────
        SIGNS_COLOR: resolveVar("--text-secondary", "#aaa"),
        NUMBERS_COLOR: resolveVar("--text-tertiary", "#666"),
        POINTS_COLOR: resolveVar("--text-primary", "#fff"),
        // ── Planet colors → brand tokens ─────────────
        PLANETS_COLOR: {
          Sun:     resolveVar("--gold",                "#F5C842"),
          Moon:    resolveVar("--color-acqua",         "#5CC8C8"),
          Mercury: resolveVar("--color-y2k-blue",      "#3B82F6"),
          Venus:   resolveVar("--color-spiced-life",   "#C4622D"),
          Mars:    resolveVar("--color-planet-mars",   "#D94F3D"),
          Jupiter: resolveVar("--sage",                "#5A9E78"),
          Saturn:  resolveVar("--text-tertiary",       "#666"),
          Uranus:  resolveVar("--color-y2k-blue",      "#3B82F6"),
          Neptune: resolveVar("--color-acqua",         "#5CC8C8"),
          Pluto:   resolveVar("--color-planet-mars",   "#D94F3D"),
          Chiron:  resolveVar("--text-secondary",      "#aaa"),
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
