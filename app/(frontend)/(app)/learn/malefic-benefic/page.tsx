"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import {
  NatalWheelSVG,
  R,
  svgXY,
  type WheelPlanet,
} from "@/app/components/natal/NatalWheelSVG";
import { AstronatCard } from "@/app/components/ui/astronat-card";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// PLANETARY DATA & GEOMETRY
// ═══════════════════════════════════════════════════════════════

const PLANETS = [
  {
    id: "venus",
    name: "Venus",
    role: "Lesser Benefic",
    glyph: "♀",
    lon: 45,
    color: "#CAF1F0",
    desc: "Venus is the sensation of walking into a room and immediately feeling welcome. She is the principle of magnetic attraction — how you draw things in without strain, where beauty seems to follow you naturally. Her blessings are personal and immediate: love that flows easily, art that comes through you, the ease of being liked. Look at Venus to understand both what you love, and more importantly, what you believe you deserve to receive.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    role: "Greater Benefic",
    glyph: "♃",
    lon: 135,
    color: "#C9A96E",
    desc: "Jupiter is the planet of the open door. He expands whatever he touches: opportunities multiply, people are generous, the path forward is visible. His gifts are macro-level and life-changing — not the small comfort of Venus, but the large reorientation: a new philosophy, a windfall, a mentor who arrives at exactly the right time. Wherever Jupiter sits in your chart is where the universe is most likely to say yes.",
  },
  {
    id: "mars",
    name: "Mars",
    role: "Lesser Malefic",
    glyph: "♂",
    lon: 225,
    color: "#D32F2F",
    desc: "Mars is the contractor. He tears down walls, forces renovations, and sends bills you didn't see coming. As the Lesser Malefic, he creates friction — arguments, impulsive decisions, accidents, confrontations. But this is not cruelty; it's clearing. The territory Mars burns through is the territory that was already dead. Energy concentrated here builds the capacity for decisive, independent action.",
  },
  {
    id: "saturn",
    name: "Saturn",
    role: "Greater Malefic",
    glyph: "♄",
    lon: 315,
    color: "#909090",
    desc: "Saturn is the Greater Malefic — not because he is evil, but because his lessons are slow, heavy, and arrive without apology. He brings restriction, cold boundaries, and the kind of discipline that can only come from having no other option. His timeline is decades, not months. But what Saturn builds, nothing dismantles. The mastery you earn in the house Jupiter helps effortlessly is shallow. The mastery you earn in the house Saturn rules is permanent.",
  }
];

// Flatten all planets for the wheel
const WHEEL_PLANETS: WheelPlanet[] = PLANETS.map(p => ({
  id: p.id,
  glyph: p.glyph,
  color: p.color,
  lon: p.lon,
}));

// ═══════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function MaleficBeneficLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  // Sync with global data-theme
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };
    checkTheme();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === "data-theme") checkTheme();
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    // Background wheel fade-in
    gsap.fromTo("#bg-wheel", { opacity: 0 }, { opacity: 0.6, duration: 2.5, ease: "power2.out" });

    // Intro card
    gsap.set("#intro-card", { autoAlpha: 0, y: 40 });
    ScrollTrigger.create({
      trigger: "#section-intro",
      start: "top 80%",
      onEnter:     () => gsap.to("#intro-card", { autoAlpha: 1, y: 0,  duration: 0.8, ease: "power3.out" }),
      onLeave:     () => gsap.to("#intro-card", { autoAlpha: 0, y: -30, duration: 0.4 }),
      onEnterBack: () => gsap.to("#intro-card", { autoAlpha: 1, y: 0,  duration: 0.6 }),
      onLeaveBack: () => gsap.to("#intro-card", { autoAlpha: 0, y: 30, duration: 0.4 }),
    });

    // Per-planet scroll triggers
    PLANETS.forEach((p) => {
      const section = document.getElementById(`section-${p.id}`);
      const card    = document.getElementById(`card-${p.id}`);
      if (!section || !card) return;

      gsap.set(card, { autoAlpha: 0, y: 50 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 62%",
        end: "bottom 20%",

        onEnter: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          
          // Reveal planet
          gsap.to(`#planet-${p.id}`, {
            opacity: 1, scale: 1,
            duration: 0.9, ease: "back.out(1.7)",
            transformOrigin: "center center",
          });
        },

        onLeave: () => {
          gsap.to(card, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" });
        },

        onEnterBack: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          gsap.to(`#planet-${p.id}`, { opacity: 1, scale: 1, duration: 0.4 });
        },

        onLeaveBack: () => {
          gsap.to(card, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" });
          // Fade planet out
          gsap.to(`#planet-${p.id}`, { opacity: 0, scale: 0.8, duration: 0.4, ease: "power2.in" });
        },
      });
    });

    // Outro card
    gsap.set("#outro-card", { autoAlpha: 0, y: 40 });
    ScrollTrigger.create({
      trigger: "#section-outro",
      start: "top 60%",
      onEnter: () => {
        gsap.to("#outro-card", { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" });
        // Fade in all 4 planets for the culmination
        PLANETS.forEach(p => {
          gsap.to(`#planet-${p.id}`, { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.2)" });
        });
      },
      onEnterBack: () => gsap.to("#outro-card", { autoAlpha: 1, y: 0, duration: 0.6 }),
      onLeaveBack: () => {
        gsap.to("#outro-card", { autoAlpha: 0, y: 30, duration: 0.4 });
        // Fade them back out so they represent individual states while scrolling back up
        PLANETS.forEach(p => {
          gsap.to(`#planet-${p.id}`, { opacity: 0, scale: 0.8, duration: 0.4 });
        });
      },
    });

  }, { scope: wrapperRef });

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{
        backgroundColor: isDark ? "#000000" : "var(--color-eggshell)",
        transition: "background-color 0.6s ease",
      }}
    >
      {/* ═══ FIXED BACKGROUND WHEEL ═══ */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: "min(100vh, 820px)", aspectRatio: "1" }}>
          <NatalWheelSVG 
            isDark={isDark} 
            planets={WHEEL_PLANETS}
          />
        </div>
      </div>

      {/* ═══ NAVBAR ═══ */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-auto">
        <div
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)"
              : "linear-gradient(to bottom, var(--color-eggshell), rgba(248,245,236,0.4), transparent)",
          }}
        >
          <Navbar
            activeHref="/learn"
            centerContent={
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Learn · Benefic vs Malefic
              </span>
            }
          />
        </div>
      </div>

      {/* ═══ SCROLLING CONTENT ═══ */}
      <div className="relative z-20">

        {/* INTRO */}
        <section id="section-intro" className="relative h-screen flex items-center justify-center px-6">
          <div id="intro-card" className="max-w-2xl text-center">
            <div className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-6 px-4 py-2 border border-[var(--color-y2k-blue)]/30 rounded-full backdrop-blur-md bg-white/5">
              Planetary Designations
            </div>
            <h1
              className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              The Great<br />Divide.
            </h1>
            <div
              className="p-6 md:p-8 rounded-[var(--shape-asymmetric-lg)] backdrop-blur-xl max-w-xl mx-auto"
              style={{
                background: isDark ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.70)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <p
                className="font-body text-base md:text-lg leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Every planet in your chart belongs to one of two camps. The <strong className="text-[var(--color-acqua)] font-medium">Benefics</strong> — Venus and Jupiter — move through your chart like good weather: warmth, ease, and open doors. The <strong className="text-[var(--color-spiced-life)] font-medium">Malefics</strong> — Mars and Saturn — move through like a contractor: tearing down walls, forcing upgrades, and sending bills you didn't see coming. You need both. The contractor is expensive. But you also need a roof.
              </p>
              <div className="mt-6 animate-bounce opacity-40 text-[var(--text-tertiary)] font-mono text-[9px] uppercase tracking-[0.4em]">
                Scroll to Begin
              </div>
            </div>
          </div>
        </section>

        {/* PLANET SECTIONS */}
        {PLANETS.map((p, i) => {
          const isLeft = i % 2 !== 0; // Stagger slightly differently or randomly
          return (
            <section
              key={p.id}
              id={`section-${p.id}`}
              className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20"
            >
              <div
                id={`card-${p.id}`}
                className={`w-full max-w-lg ${isLeft ? "mr-auto" : "ml-auto"}`}
              >
                <AstronatCard
                  variant="black"
                  shape="cut-md"
                  className="p-8 md:p-12 relative overflow-hidden"
                  style={{
                    boxShadow: isDark
                      ? `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${p.color}14`
                      : `0 20px 60px rgba(0,0,0,0.10)`,
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.10)"
                      : "1px solid rgba(27,27,27,0.12)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      fontFamily: "var(--font-secondary)",
                      fontSize: "14rem",
                      color: p.color,
                      opacity: 0.04,
                      top: "-15%",
                      right: isLeft ? "-5%" : "auto",
                      left: isLeft ? "auto" : "-5%",
                      lineHeight: 1,
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  >
                    {p.glyph}
                  </span>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className="shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: "52px",
                          height: "52px",
                          border: `1.5px solid ${p.color}`,
                          backgroundColor: `${p.color}15`,
                          boxShadow: `0 0 18px ${p.color}40`,
                        }}
                      >
                         <span
                           className="font-secondary leading-none"
                           style={{
                             color: p.color,
                             fontSize: "1.4rem",
                             fontWeight: 400,
                           }}
                         >
                           {p.glyph}
                         </span>
                      </div>
                      <div>
                        <span className="block font-mono text-[10px] uppercase tracking-widest opacity-60 mb-1" style={{ color: p.color }}>
                          {p.role}
                        </span>
                        <h2
                          className="font-primary text-5xl md:text-6xl uppercase tracking-tight leading-none"
                          style={{ color: "var(--color-eggshell)" }}
                        >
                          {p.name}
                        </h2>
                      </div>
                    </div>

                    <div className="w-full h-[1px] mb-6" style={{ background: `linear-gradient(to right, ${p.color}40, transparent)` }} />

                    <p
                      className="font-body text-base md:text-lg leading-relaxed"
                      style={{ color: "rgba(248,245,236,0.75)" }}
                    >
                      {p.desc}
                    </p>
                  </div>
                </AstronatCard>
              </div>
            </section>
          );
        })}

        {/* OUTRO */}
        <section id="section-outro" className="relative h-screen flex items-center justify-center px-6">
          <div id="outro-card" className="max-w-2xl text-center w-full">
            <h2
              className="font-primary text-5xl md:text-[5.5rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              Balance of<br />Forces
            </h2>
            <div
              className="p-6 md:p-8 rounded-[var(--shape-organic-1)] border backdrop-blur-2xl max-w-xl mx-auto"
               style={{
                background: isDark ? "rgba(10,10,10,0.9)" : "rgba(255,255,255,0.7)",
                borderColor: "var(--surface-border)",
              }}
            >
              <p
                className="font-body text-base md:text-lg leading-relaxed mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                Every chart requires an equilibrium of both. Too much Benefic influence creates stagnation and weakness; too much Malefic influence prevents survival. The friction of the Malefics is the forge that makes the blessings of the Benefics meaningful.
              </p>
               <a
                href="/learn"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[var(--color-y2k-blue)] text-white font-mono uppercase text-xs font-bold rounded-full hover:opacity-80 transition-all hover:scale-105"
              >
                Return to Directory
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
