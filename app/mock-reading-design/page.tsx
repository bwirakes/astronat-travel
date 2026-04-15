"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import RelocatedWheelInteractive from "./components/RelocatedWheelInteractive";
import { PlanetaryShiftStory } from "./components/PlanetaryShiftStory";
import { GeographicACGMapLines, GeographicBackgroundMap } from "./components/GeographicACGMap";
import { FinalReportSummary } from "./components/FinalReportSummary";
import { useAnimationMachine } from "./AnimationMachine";
import Navbar from "@/app/components/Navbar";
import { AstroPill } from "@/app/components/ui/astro-pill";

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
    <div className="relative transition-colors duration-700 h-screen overflow-y-auto snap-y snap-proximity theme-transition" 
         style={{ 
           backgroundColor: isDark ? "var(--color-black)" : "var(--color-eggshell)", 
           color: isDark ? "var(--color-eggshell)" : "var(--color-charcoal)" 
         }}>
      
      {/* ═══ GLOBAL NAVBAR ═══ */}
      <Navbar />

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
          <div className={`max-w-2xl mt-12 p-12 relative z-10 shadow-2xl transition-colors duration-700
            ${isDark 
              ? "bg-[var(--color-charcoal)] border-t border-[var(--color-charcoal)]" 
              : "bg-white border-t border-[var(--surface-border)]"
            }`}
            style={{ clipPath: "var(--cut-lg)" }}
          >
            {/* Editorial Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden mix-blend-overlay">
              <span className="font-display-alt whitespace-nowrap" style={{ fontSize: "clamp(12rem, 30vw, 24rem)", lineHeight: 0.8 }}>
                LONDON
              </span>
            </div>

            <div className={`relative z-20 inline-flex items-center gap-3 px-4 py-2 rounded-full border mb-8
              ${isDark ? "border-[var(--color-planet-sun)]/40 bg-[var(--color-planet-sun)]/10 text-[var(--color-planet-sun)]" : "border-[var(--color-y2k-blue)]/30 bg-[var(--color-y2k-blue)]/5 text-[var(--color-y2k-blue)]"}`}>
               <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
               <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">Relocation Reading Engine</span>
            </div>
            
            <h1 className="relative z-20 font-primary text-5xl md:text-7xl leading-[0.85] tracking-tight uppercase mb-6" style={{ textShadow: isDark ? "0 4px 40px rgba(0,0,0,0.8)" : "none" }}>
              The London<br />Shift
            </h1>

            <p className="font-body text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
              Scroll down to witness how your planetary energies realign geographically. We calculate exact angular offsets and Geographic paths tailored to your birth chart.
            </p>
          </div>
        </section>

        {/* PLANET SHIFTS */}
        <div className="relative pb-60">
           <PlanetaryShiftStory reading={{ destination: "London, UK", houses: [] }} />
        </div>

        {/* MAP SECTIONS */}
        <GeographicACGMapLines reading={{ destination: "London, UK", destinationLat: 51.5072, destinationLon: -0.1276 }} />

        {/* FINAL REPORT */}
        <FinalReportSummary reading={null} />

      </div>

      {/* SKIP BUTTON (Contextually Aware) */}
      {showSkip && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
          <a href={skipHref}>
            <AstroPill
              shape="cut"
              size="md"
              variant="ghost"
              style={{ backdropFilter: "blur(8px)", background: "var(--surface)", color: "var(--text-primary)" }}
            >
              {skipText} →
            </AstroPill>
          </a>
        </div>
      )}
    </div>
  );
}
