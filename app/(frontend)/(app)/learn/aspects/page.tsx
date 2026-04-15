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
  type WheelAspect,
} from "@/app/components/natal/NatalWheelSVG";
import { AstronatCard } from "@/app/components/ui/astronat-card";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// ASPECT DATA & GEOMETRY
// ═══════════════════════════════════════════════════════════════

const ASPECTS = [
  {
    id: "conjunction",
    name: "Conjunction",
    angle: "0°",
    desc: "When two planets occupy the same degree of the zodiac, they fuse. There's no separation between their energies — no distance to negotiate. This is the most intense of all aspects: amplified, undiluted, and impossible to ignore. A conjunction can be your greatest gift or your biggest blind spot, depending entirely on which planets are merged.",
    type: "Conjunction",
    color: "#0456fb",
    planets: [
      { id: "conj_sun", glyph: "☉", planet: "Sun", color: "#C9A96E", lon: 30, lonOffset: -2 },
      { id: "conj_moon", glyph: "☽", planet: "Moon", color: "#CAF1F0", lon: 30, lonOffset: 2 }
    ]
  },
  {
    id: "sextile",
    name: "Sextile",
    angle: "60°",
    desc: "The sextile is the aspect of the open door. At 60°, planets are compatible and conversational — they help each other without drama. But unlike the trine, this ease isn't automatic. The sextile requires you to notice the opportunity and walk through the door. It rewards conscious effort with disproportionate results.",
    type: "Sextile",
    color: "#CAF1F0",
    planets: [
      { id: "sext_mercury", glyph: "☿", planet: "Mercury", color: "#0456fb", lon: 100 },
      { id: "sext_venus", glyph: "♀", planet: "Venus", color: "#E67A7A", lon: 160 }
    ]
  },
  {
    id: "square",
    name: "Square",
    angle: "90°",
    desc: "The square is the aspect that builds character. At 90°, two planets are in permanent tension — they want incompatible things, and they don't compromise easily. This isn't abstract friction: you feel it as frustration, impasse, and the sense that one part of you is constantly blocking another. But every significant achievement in a chart can usually be traced to a well-worked square.",
    type: "Square",
    color: "#E67A7A",
    planets: [
      { id: "sq_mars", glyph: "♂", planet: "Mars", color: "#D32F2F", lon: 190 },
      { id: "sq_saturn", glyph: "♄", planet: "Saturn", color: "#909090", lon: 280 }
    ]
  },
  {
    id: "trine",
    name: "Trine",
    angle: "120°",
    desc: "The trine is the aspect everyone wants — and sometimes the most dangerous one to have. At 120°, energy flows between planets with zero friction. Gifts arrive naturally. Talent feels inherited, not earned. But because nothing pushes back, these abilities are often left undeveloped — taken for granted until a square or opposition forces the question: are you actually using this? Every trine is a potential waiting to be deliberately chosen.",
    type: "Trine",
    color: "#00FD00",
    planets: [
      { id: "tr_jupiter", glyph: "♃", planet: "Jupiter", color: "#00FD00", lon: 0 },
      { id: "tr_sun", glyph: "☉", planet: "Sun", color: "#C9A96E", lon: 120 }
    ]
  },
  {
    id: "opposition",
    name: "Opposition",
    angle: "180°",
    desc: "The opposition is a tug-of-war. At 180°, two planets sit directly across the chart from each other, and each one pulls in the opposite direction. You feel it as projection — attributing one side of the tension to other people, or to circumstances, rather than recognizing it as an internal split. Integration is the only resolution: not choosing one side over the other, but learning to carry both at once.",
    type: "Opposition",
    color: "#888888",
    planets: [
      { id: "opp_moon", glyph: "☽", planet: "Moon", color: "#CAF1F0", lon: 60 },
      { id: "opp_pluto", glyph: "♇", planet: "Pluto", color: "#8E24AA", lon: 240 }
    ]
  }
];

// Flatten all planets for the wheel
const WHEEL_PLANETS: WheelPlanet[] = ASPECTS.flatMap(a => a.planets);

// Calculate exact aspect lines
const ALL_ASPECTS: WheelAspect[] = ASPECTS.map(a => {
  const p1 = a.planets[0];
  const p2 = a.planets[1];
  const pt1 = svgXY(p1.lon, R.inner);
  const pt2 = svgXY(p2.lon, R.inner);
  const length = parseFloat(Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y).toFixed(3));
  return {
    id: a.id,
    type: a.type,
    color: a.color,
    x1: pt1.x,
    y1: pt1.y,
    x2: pt2.x,
    y2: pt2.y,
    length
  };
});

// ═══════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AspectsLearnPage() {
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

    // Per-aspect scroll triggers
    ASPECTS.forEach((a) => {
      const section = document.getElementById(`section-${a.id}`);
      const card    = document.getElementById(`card-${a.id}`);
      if (!section || !card) return;

      const p1_id = a.planets[0].id;
      const p2_id = a.planets[1].id;
      const asp_id = a.id;

      gsap.set(card, { autoAlpha: 0, y: 50 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 62%",
        end: "bottom 20%",

        onEnter: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          
          // Reveal planets
          gsap.to([`#planet-${p1_id}`, `#planet-${p2_id}`], {
            opacity: 1, scale: 1,
            duration: 0.9, ease: "back.out(1.7)",
            transformOrigin: "center center",
          });
          
          // Show guides and draw aspect line
          gsap.to(`#aspect-group-${asp_id}`, {
            opacity: 1,
            duration: 0.8,
            delay: 0.1,
            ease: "power2.out",
          });
          gsap.to(`#aspect-${asp_id}`, {
            strokeDashoffset: 0,
            duration: 1.4,
            delay: 0.1,
            ease: "power3.out",
          });
        },

        onLeave: () => {
          gsap.to(card, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" });
        },

        onEnterBack: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          gsap.to([`#planet-${p1_id}`, `#planet-${p2_id}`], { opacity: 1, scale: 1, duration: 0.4 });
          gsap.to(`#aspect-group-${asp_id}`, { opacity: 1, duration: 0.4 });
          gsap.to(`#aspect-${asp_id}`, { strokeDashoffset: 0, duration: 0.6 });
        },

        onLeaveBack: () => {
          gsap.to(card, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" });
          // Fade planets out
          gsap.to([`#planet-${p1_id}`, `#planet-${p2_id}`], { opacity: 0, scale: 0, duration: 0.4, ease: "power2.in" });
          
          // Fade guides out and retract aspect line
          const aspectData = ALL_ASPECTS.find(asp => asp.id === asp_id);
          if (aspectData) {
            gsap.to(`#aspect-group-${asp_id}`, { opacity: 0, duration: 0.4, ease: "power2.in" });
            gsap.to(`#aspect-${asp_id}`, { strokeDashoffset: aspectData.length, duration: 0.4 });
          }
        },
      });
    });

    // Outro card
    gsap.set("#outro-card", { autoAlpha: 0, y: 40 });
    ScrollTrigger.create({
      trigger: "#section-outro",
      start: "top 60%",
      onEnter:     () => gsap.to("#outro-card", { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }),
      onEnterBack: () => gsap.to("#outro-card", { autoAlpha: 1, y: 0, duration: 0.6 }),
      onLeaveBack: () => gsap.to("#outro-card", { autoAlpha: 0, y: 30, duration: 0.4 }),
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
            aspectLines={ALL_ASPECTS}
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
                Learn · Planetary Aspects
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
              Sacred Geometry
            </div>
            <h1
              className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              Planetary<br />Aspects.
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
                Imagine two people in a room. Whether they're collaborating, competing, or ignoring each other entirely depends not on who they are — but on how they're positioned. Aspects work the same way. They're the angular relationships between planets in your chart, and they determine whether your inner forces work <em>together</em> or <em>against</em> each other.
              </p>
              <div className="mt-6 animate-bounce opacity-40 text-[var(--text-tertiary)] font-mono text-[9px] uppercase tracking-[0.4em]">
                Scroll to Begin
              </div>
            </div>
          </div>
        </section>

        {/* ASPECT SECTIONS */}
        {ASPECTS.map((a, i) => {
          const isLeft = i % 2 === 0;
          return (
            <section
              key={a.id}
              id={`section-${a.id}`}
              className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20"
            >
              <div
                id={`card-${a.id}`}
                className={`w-full max-w-lg ${isLeft ? "mr-auto" : "ml-auto"}`}
              >
                <AstronatCard
                  variant="black"
                  shape="cut-md"
                  className="p-8 md:p-12 relative overflow-hidden"
                  style={{
                    boxShadow: isDark
                      ? `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${a.color}14`
                      : `0 20px 60px rgba(0,0,0,0.10)`,
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.10)"
                      : "1px solid rgba(27,27,27,0.12)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      fontFamily: "var(--font-primary)",
                      fontSize: "12rem",
                      color: a.color,
                      opacity: 0.04,
                      top: "-20%",
                      right: isLeft ? "-5%" : "auto",
                      left: isLeft ? "auto" : "-5%",
                      lineHeight: 1,
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  >
                    {a.angle}
                  </span>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className="shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: "52px",
                          height: "52px",
                          border: `1.5px solid ${a.color}`,
                          backgroundColor: `${a.color}15`,
                          boxShadow: `0 0 18px ${a.color}40`,
                        }}
                      >
                         {/* Display icons geometrically? We don't have aspect icons imported, so let's use angle */}
                         <span
                           className="font-secondary leading-none"
                           style={{
                             color: a.color,
                             fontSize: "1rem",
                             fontWeight: 700,
                             letterSpacing: "0.05em",
                           }}
                         >
                           {a.angle}
                         </span>
                      </div>
                      <h2
                        className="font-primary text-5xl md:text-6xl uppercase tracking-tight leading-none"
                        style={{ color: "var(--color-eggshell)" }}
                      >
                        {a.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border"
                        style={{
                          borderColor: "rgba(255,255,255,0.15)",
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        Major Aspect
                      </span>
                    </div>

                    <p
                      className="font-body text-base leading-relaxed"
                      style={{ color: "rgba(248,245,236,0.75)" }}
                    >
                      {a.desc}
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
              The Soul's<br />Dialogue
            </h2>
            <div
              className="p-6 md:p-8 rounded-[var(--shape-organic-1)] border backdrop-blur-2xl max-w-xl mx-auto"
               style={{
                background: isDark ? "rgba(10,10,10,0.9)" : "rgba(255,255,255,0.7)",
                borderColor: "var(--surface-border)",
                boxShadow: isDark ? "0 0 80px rgba(4,86,251,0.15)" : "none",
              }}
            >
              <p
                className="font-body text-base md:text-lg leading-relaxed mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                A chart without aspects is silent. The angles provide the tension and flow that make human life dynamic. Ready to learn the difference between easy and hard placements?
              </p>
               <a
                href="/learn/malefic-benefic"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[var(--color-y2k-blue)] text-white font-mono uppercase text-xs font-bold rounded-full hover:opacity-80 transition-all hover:scale-105"
              >
                Next: Malefic vs Benefic
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
