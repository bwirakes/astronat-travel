"use client";

import React, { useMemo } from "react";
import type { HouseScore } from "@/app/lib/house-matrix";
import { useScrollSection } from "../hooks/useScrollSection";

// Helper for bar colors based on score
function barColor(score: number): string {
  if (score >= 85) return "var(--sage)";
  if (score >= 70) return "rgba(123,158,135,0.8)";
  if (score >= 55) return "var(--cyan)";
  if (score >= 40) return "var(--text-tertiary)";
  if (score >= 25) return "var(--amber)";
  return "var(--accent)";
}

interface PlanetaryShiftStoryProps {
  houses: HouseScore[];
  destination: string;
}

function PlanetSection({ 
  h, 
  index, 
  total 
}: { 
  h: HouseScore & { narrativeIndex: number }; 
  index: number;
  total: number;
}) {
  const { ref, isInView } = useScrollSection<HTMLElement>(`planet-${(h.rulerPlanet || "unknown").toLowerCase()}` as any);
  
  // ASTRO-BRAND alternating rhythm (strictly as requested)
  // narrativeIndex 0 → Eggshell bg / Charcoal text
  // narrativeIndex 1 → Charcoal bg / Eggshell text
  // narrativeIndex 2 → Black bg / Eggshell text
  // narrativeIndex 3 → Charcoal bg / Eggshell text
  const getStyles = (idx: number) => {
    switch (idx) {
      case 0:
        return {
          background: "var(--color-eggshell)",
          color: "var(--color-charcoal)",
          border: "var(--surface-border)"
        };
      case 1:
        return {
          background: "var(--color-charcoal)",
          color: "var(--color-eggshell)",
          border: "var(--color-charcoal)"
        };
      case 2:
        return {
          background: "var(--color-black)",
          color: "var(--color-eggshell)",
          border: "var(--color-black)"
        };
      case 3:
      default:
        return {
          background: "var(--color-charcoal)",
          color: "var(--color-eggshell)",
          border: "var(--color-charcoal)"
        };
    }
  };

  const currentStyle = getStyles(h.narrativeIndex);
  const scoreColor = barColor(h.score);

  return (
    <section ref={ref} id={`house-${h.house}`} className="relative h-[120vh] w-full snap-start">
      <div 
        className={`absolute top-1/2 -translate-y-1/2 w-[90%] max-w-sm lg:max-w-md transition-all duration-700
          left-6 lg:left-32
          ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div 
          className="p-8 md:p-10 rounded-[var(--shape-asymmetric-md)] shadow-2xl relative overflow-hidden transition-all duration-700"
          style={{ 
            background: currentStyle.background, 
            color: currentStyle.color,
            border: `1px solid ${currentStyle.border}`
          }}
        >
          {/* Progress pill tag at top-right */}
          <div className="absolute top-6 right-6 flex items-center justify-center">
            <span className="font-mono text-[0.6rem] px-3 py-1 border border-current rounded-[20px] uppercase tracking-widest opacity-60">
              {h.narrativeIndex + 1} OF {total}
            </span>
          </div>

          {/* SLOOP SCRIPT Oversized Overlap Overlay */}
          <span 
            className="absolute top-[20%] right-[-15%] font-display-alt-2 text-[clamp(12rem,25vw,18rem)] leading-[0.5] opacity-[0.85] pointer-events-none mix-blend-hard-light" 
            style={{ color: "var(--color-y2k-blue)" }}
          >
            {(h.rulerPlanet || "S").charAt(0)}
          </span>

          <div className="relative z-10 flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-3">
               <span className="font-mono text-[0.6rem] px-2 py-0.5 border border-current rounded-[20px] uppercase">
                 H{h.house}
               </span>
               <span className="font-mono text-[0.6rem] px-2 py-0.5 rounded-[20px] text-white font-bold" style={{ backgroundColor: scoreColor }}>
                 {h.score}/100
               </span>
            </div>
            <h2 className="font-primary text-[clamp(2rem,5vw,4rem)] uppercase tracking-tight leading-[0.9]">
              {h.sphere}
            </h2>
          </div>

          <div className="relative z-10">
            <p className="font-body text-base md:text-lg leading-relaxed opacity-90">
              {h.rulerPlanet} in {h.relocatedSign} · {h.rulerCondition}
            </p>
          </div>
          
          <div className="relative z-10 mt-6 pt-6 border-t border-current/20">
            <p className="font-body text-sm leading-relaxed opacity-75 italic">
              Activation in the {h.sphere.toLowerCase()} sector intensifies due to the relocated gravity at this destination.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlanetaryShiftStory({ houses, destination }: PlanetaryShiftStoryProps) {
  const narrativeHouses = useMemo(() => {
    return [...houses]
      .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
      .slice(0, 4)
      .map((h, i) => ({ ...h, narrativeIndex: i }));
  }, [houses]);

  if (!narrativeHouses.length) return null;

  return (
    <>
      {narrativeHouses.map((h, i) => (
        <PlanetSection 
          key={`${h.house}-${i}`} 
          h={h} 
          index={i} 
          total={narrativeHouses.length}
        />
      ))}
    </>
  );
}
