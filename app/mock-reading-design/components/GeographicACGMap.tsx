"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ACG_LINES, IMPORTANCE_STYLES } from "../data";
import { useAnimationMachine } from "../AnimationMachine";
import { useScrollSection } from "../hooks/useScrollSection";

const LONDON_X = 782;
const LONDON_Y = 804;

function AcgLineSection({ line, index }: { line: typeof ACG_LINES[0]; index: number }) {
  const { ref, isInView } = useScrollSection<HTMLElement>(`acg-${line.id}` as any);

  const imp = IMPORTANCE_STYLES[line.importance];
  const isLeft = index % 2 === 1;

  return (
    <section ref={ref} id={`section-acg-${line.id}`} className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20 snap-start">
      <div 
        className={`w-full max-w-lg transition-all duration-700 ${isLeft ? "mr-auto" : "ml-auto"}
          ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="p-6 md:p-8 rounded-[var(--shape-asymmetric-sm)] bg-black/70 border border-white/10 backdrop-blur-xl shadow-2xl text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: line.color, boxShadow: `0 0 12px ${line.glow}` }} />
            <h2 className="font-primary text-4xl uppercase tracking-tight text-white leading-none">
              {line.planet}
            </h2>
            <span className="font-mono text-sm uppercase tracking-wider px-3 py-1 rounded-md border" style={{ color: line.color, borderColor: line.color }}>
              {line.angle}
            </span>
          </div>
          <p className="font-body text-sm md:text-base text-white/80 leading-relaxed mb-5">
            {line.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md ${imp.bg}`}>
              {imp.label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function GeographicACGMapLines({ reading }: { reading: any }) {
  const isMobile = false;

  return (
    <>
      <section id="section-map-intro" className="relative min-h-[140vh] w-full flex flex-col items-center justify-center pt-32 pb-40 snap-start">
        <div className="relative z-10 w-full max-w-[800px] mx-auto px-6 text-center">
          
          {/* TEXT BLOCK */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full border mb-8
              border-[var(--color-y2k-blue)]/50 bg-[var(--color-black)] text-[var(--color-y2k-blue)]`}>
               <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
               <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">
                 Geographic Alignment
               </span>
            </div>
            
            <h2 className="font-primary text-5xl md:text-[6rem] leading-[0.85] tracking-tight uppercase mb-8" style={{ color: "var(--text-primary)", textShadow: "0 4px 40px rgba(0,0,0,0.8)" }}>
              Mapping<br />The Lines
            </h2>
            
            <div className="p-8 rounded-[var(--shape-asymmetric-lg)] bg-[var(--color-charcoal)] border-t border-[var(--color-y2k-blue)]/30 backdrop-blur-md shadow-2xl relative z-10 text-[var(--color-eggshell)]">
              <p className="font-body text-lg leading-relaxed opacity-90">
                Astrolocality lines reveal the direct geographic paths where your newly relocated planets hold their maximum strength across the globe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {ACG_LINES.map((line, i) => (
        <AcgLineSection key={line.id} line={line} index={i} />
      ))}
    </>
  );
}

export function GeographicBackgroundMap() {
  const { mapOpacity, activeIndex } = useAnimationMachine();
  
  const LINE_INDICES: Record<string, number> = {
    "pluto-dsc": 6,
    "sun-ic": 7
  };

  return (
    <div 
      id="map-container" 
      className="absolute inset-0 transition-opacity duration-1000"
      style={{ opacity: mapOpacity, pointerEvents: mapOpacity > 0 ? "auto" : "none" }}
    >
      <Image
        src="/london-map-dark.png"
        alt="London and UK dark cartography"
        fill
        className={`object-cover transition-all duration-700 ease-[var(--ease-cinematic)] object-center`}
        priority
      />
      <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full z-10 pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <circle cx={LONDON_X} cy={LONDON_Y} r="6" fill="var(--color-y2k-blue)" opacity="0.9" />
        <circle cx={LONDON_X} cy={LONDON_Y} r="12" fill="none" stroke="var(--color-y2k-blue)" strokeWidth="1.5" opacity="0.4">
          <animate attributeName="r" from="12" to="30" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        
        {ACG_LINES.map((line) => {
          const lineTargetIndex = LINE_INDICES[line.id] ?? 999;
          const isDraw = activeIndex >= lineTargetIndex;

          return (
            <motion.path
              key={line.id}
              className="acg-map-line"
              d={line.path}
              fill="none"
              stroke={line.color}
              strokeWidth={line.importance === "exact" ? 4 : line.importance === "major" ? 3 : 2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: isDraw ? 1 : 0, 
                opacity: isDraw ? 1 : 0 
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
