"use client";

import React from "react";
import { PLANETS } from "../data";
import { useScrollSection } from "../hooks/useScrollSection";

function PlanetSection({ planet, index }: { planet: typeof PLANETS[0]; index: number }) {
  const { ref, isInView } = useScrollSection<HTMLElement>(`planet-${planet.id}` as any);
  
  // ASTRO-BRAND alternating rhythm
  const isDarkCard = index % 3 !== 0; // Alternates lightly
  const bgClasses = [
    "bg-[var(--color-eggshell)] text-[var(--color-charcoal)] border-[var(--surface-border)]",
    "bg-[var(--color-charcoal)] text-[var(--color-eggshell)] border-[var(--color-charcoal)]",
    "bg-[var(--color-black)] text-[var(--color-eggshell)] border-[var(--color-black)]"
  ];
  const currentStyle = bgClasses[index % bgClasses.length];

  return (
    <section ref={ref} id={`section-${planet.id}`} className="relative h-[120vh] w-full snap-start">
      <div 
        className={`absolute top-1/2 -translate-y-1/2 w-[90%] max-w-sm lg:max-w-md transition-all duration-700
          left-6 lg:left-32
          ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className={`p-8 md:p-10 rounded-[var(--shape-asymmetric-md)] ${currentStyle} shadow-2xl relative overflow-hidden transition-all duration-700`}>
          
          {/* SLOOP SCRIPT Oversized Overlap Overlay */}
          <span className="absolute top-[20%] right-[-15%] font-display-alt-2 text-[clamp(12rem,25vw,18rem)] leading-[0.5] opacity-[0.85] pointer-events-none mix-blend-hard-light" style={{ color: "var(--color-y2k-blue)" }}>
            {planet.planet.charAt(0)}
          </span>

          <div className="relative z-10 flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: planet.color, boxShadow: `0 0 10px \${planet.color}` }} />
            <h2 className="font-primary text-4xl uppercase tracking-tight">
              {planet.planet}
            </h2>
          </div>

          
          <p className="relative z-10 font-body text-base md:text-lg leading-relaxed opacity-90 mb-4">
            Moved to the <strong>{planet.relocatedHouse} House</strong>
          </p>
          
          <div className="relative z-10 mt-6 pt-6 border-t border-current/20">
            <p className="font-body text-sm leading-relaxed opacity-75 italic">
              {planet.relocatedDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlanetaryShiftStory({ reading }: { reading: any }) {
  // We can use reading.houses to derive planet shifts if needed, 
  // but for now we satisfy the prop requirement.
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
