"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import RelocatedWheelInteractive from "./components/RelocatedWheelInteractive";
import { PlanetaryShiftStory } from "./components/PlanetaryShiftStory";
import { GeographicACGMapLines, GeographicBackgroundMap } from "./components/GeographicACGMap";
import { FinalReportSummary } from "./components/FinalReportSummary";
import { useAnimationMachine } from "./AnimationMachine";

export default function MockupReadingPage() {
  const [isDark, setIsDark] = useState(true);
  const wheelOpacity = useAnimationMachine((s) => s.wheelOpacity);
  const activeView = useAnimationMachine((s) => s.activeView);

  let skipHref = "#section-map-intro";
  let skipText = "Skip to Map";
  let showSkip = true;

  if (activeView.startsWith("map") || activeView.startsWith("acg")) {
    skipHref = "#section-report";
    skipText = "Skip to Verdict";
  } else if (activeView === "report") {
    showSkip = false;
  }

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };
    
    checkTheme();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") checkTheme();
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative transition-colors duration-700 h-screen overflow-y-auto snap-y snap-proximity" style={{ backgroundColor: isDark ? "#080808" : "var(--bg)" }}>
      
      {/* ═══ FIXED BACKGROUNDS ═══ */}
      <div id="interactive-backgrounds" className="fixed inset-0 z-0 pointer-events-none">
        {/* WHEEL BACKGROUND */}
        <div 
          id="wheel-container" 
          className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[12%] transition-opacity duration-1000"
          style={{ opacity: wheelOpacity }}
        >
          <div style={{ width: "min(70vh, 574px)", aspectRatio: "1" }}>
            <RelocatedWheelInteractive isDark={isDark} />
          </div>
        </div>

        {/* MAP BACKGROUND */}
        <GeographicBackgroundMap />
      </div>

      {/* ═══ SCROLLING CONTENT FOREGROUND ═══ */}
      <div className="relative z-20">
        <div className="h-0" id="top" />

        <section id="section-intro" className="relative min-h-screen flex items-center justify-center px-6 text-center snap-start">
          <div className="max-w-2xl mt-12 bg-black/40 p-12 rounded-[var(--shape-asymmetric-lg)] backdrop-blur-xl border border-white/10 shadow-2xl">

            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[var(--color-planet-sun)]/30 bg-[var(--color-planet-sun)]/10 text-[var(--color-planet-sun)] mb-8">
               <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
               <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">Relocation Reading Engine</span>
            </div>
            
            <h1 className="font-primary text-5xl md:text-7xl leading-[0.85] tracking-tight uppercase mb-6" style={{ color: "var(--text-primary)", textShadow: "0 4px 40px rgba(0,0,0,0.8)" }}>
              The London<br />Shift
            </h1>
            <p className="font-body text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
              Scroll down to witness how your planetary energies realign geographically. We calculate exact angular offsets and Geographic paths tailored to your birth chart.
            </p>
          </div>
        </section>

        {/* PLANET SHIFTS */}
        <div className="relative pb-60">
           <PlanetaryShiftStory />
        </div>

        {/* MAP SECTIONS */}
        <GeographicACGMapLines />

        {/* FINAL REPORT */}
        <FinalReportSummary />

      </div>

      {/* SKIP BUTTON (Contextually Aware) */}
      {showSkip && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
          <a href={skipHref} className="px-6 py-3 bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--surface-border)] rounded-full text-xs font-mono uppercase tracking-widest text-[#fff] hover:bg-[#fff] hover:text-black transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2">
            <span>{skipText}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      )}
    </div>
  );
}
