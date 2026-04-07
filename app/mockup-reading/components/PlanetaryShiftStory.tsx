"use client";

import React from "react";
import { PLANETS } from "../data";
import { useScrollSection } from "../hooks/useScrollSection";

function PlanetSection({ planet, index }: { planet: typeof PLANETS[0]; index: number }) {
  const { ref, isInView } = useScrollSection<HTMLElement>(`planet-${planet.id}` as any);

  return (
    <section ref={ref} id={`section-${planet.id}`} className="relative h-[120vh] w-full snap-start">
      <div 
        className={`absolute top-1/2 -translate-y-1/2 w-[90%] max-w-sm lg:max-w-md transition-all duration-700
          left-6 lg:left-32
          ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="p-6 md:p-8 rounded-[var(--shape-asymmetric-sm)] bg-[var(--surface)]/80 border border-[var(--surface-border)] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: planet.color, boxShadow: `0 0 10px \${planet.color}` }} />
            <h2 className="font-primary text-3xl uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
              {planet.planet}
            </h2>
          </div>
          <p className="font-body text-base md:text-lg leading-relaxed text-[var(--text-secondary)]">
            Moved to the <strong className="text-[var(--text-primary)]">{planet.relocatedHouse} House</strong>
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--surface-border)]">
            <p className="font-body text-sm leading-relaxed text-[var(--text-tertiary)] italic">
              {planet.relocatedDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlanetaryShiftStory() {
  return (
    <>
      <section className="relative h-screen w-full flex items-center justify-center pointer-events-none sticky top-0 -z-10">
         <div id="intro-card" className="max-w-md text-center p-8">
            {/* The main intro is handled outside or can live here, we leave it blank to match the original structure */}
         </div>
      </section>

      {PLANETS.map((p, i) => (
        <PlanetSection key={p.id} planet={p} index={i} />
      ))}
      
      <FinalChartReveal />
    </>
  );
}

function FinalChartReveal() {
  const { ref, isInView } = useScrollSection<HTMLElement>("final-chart");
  
  return (
    <section ref={ref} id="section-final-chart" className="relative h-[120vh] w-full snap-start">
      <div 
        className={`absolute top-1/2 -translate-y-1/2 w-[90%] max-w-sm lg:max-w-md transition-all duration-700
          left-6 lg:left-32
          ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="p-8 md:p-10 rounded-[var(--shape-asymmetric-sm)] bg-[var(--surface)]/80 border border-[var(--color-y2k-blue)]/50 backdrop-blur-xl shadow-[0_0_40px_rgba(4,86,251,0.15)] relative overflow-hidden">
          {/* Subtle gradient flash */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-y2k-blue)]/10 to-transparent pointer-events-none" />
          
          <h2 className="font-primary text-4xl uppercase tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
            Chart Complete
          </h2>
          <p className="font-body text-base leading-relaxed text-[var(--text-secondary)] mb-6">
            Your London relocated matrix is entirely assembled. Notice the profound shift in geometric gravity compared to your natal chart.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--color-planet-jupiter)]/30 bg-[var(--color-planet-jupiter)]/10 text-[var(--color-planet-jupiter)]">
             <span className="font-mono text-[10px] uppercase tracking-widest font-bold">System Status: Relocated</span>
          </div>
        </div>
      </div>
    </section>
  );
}
