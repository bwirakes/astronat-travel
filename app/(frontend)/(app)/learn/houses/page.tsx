"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import { NatalWheelSVG } from "@/app/components/natal/NatalWheelSVG";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import { LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import SignIcon from "@/app/components/SignIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// HOUSES DATA
// ═══════════════════════════════════════════════════════════════

const HOUSES_DATA = [
  {
    id: 1,
    name: "I",
    keyword: "Identity",
    ruling: "Self · Physical Body · First Impressions",
    desc: "The mask you wear when you walk into a room — your body, your brand, your first move. This is the house of beginnings and raw energy you lead with.",
    naturalSign: "Aries",
    naturalRuler: "Mars",
    rulerGlyph: "♂",
  },
  {
    id: 2,
    name: "II",
    keyword: "Values",
    ruling: "Money · Possessions · Self-Worth",
    desc: "What you own, what you earn, and more crucially — what you believe you deserve. Security is built here, one brick at a time.",
    naturalSign: "Taurus",
    naturalRuler: "Venus",
    rulerGlyph: "♀",
  },
  {
    id: 3,
    name: "III",
    keyword: "Mind",
    ruling: "Siblings · Short Travel · Communication",
    desc: "The chattering monkey: your siblings, your neighborhood, your texts and your commute. The mind runs the local circuits of daily life.",
    naturalSign: "Gemini",
    naturalRuler: "Mercury",
    rulerGlyph: "☿",
  },
  {
    id: 4,
    name: "IV",
    keyword: "Home",
    ruling: "Roots · Family · Mother · Private Life",
    desc: "The emotional bedrock. Your roots, your parents, the private face nobody else sees. This is what you carry when everything else is stripped away.",
    naturalSign: "Cancer",
    naturalRuler: "Moon",
    rulerGlyph: "☽",
  },
  {
    id: 5,
    name: "V",
    keyword: "Joy",
    ruling: "Creativity · Romance · Children · Pleasure",
    desc: "Pleasure for pleasure's sake. Love affairs, art, children, gambling, the sheer drama of being alive. Here you play.",
    naturalSign: "Leo",
    naturalRuler: "Sun",
    rulerGlyph: "☉",
  },
  {
    id: 6,
    name: "VI",
    keyword: "Duty",
    ruling: "Health · Daily Routine · Service · Pets",
    desc: "The unglamorous engine: your health rituals, your work ethic, the to-do list. Mastery lives in the unglamorous details perfected over time.",
    naturalSign: "Virgo",
    naturalRuler: "Mercury",
    rulerGlyph: "☿",
  },
  {
    id: 7,
    name: "VII",
    keyword: "Others",
    ruling: "Marriage · Partnerships · Open Enemies",
    desc: "The mirror. Your long-term partners and your open rivals — those who complete or oppose you. What you seek in others, you lack in yourself.",
    naturalSign: "Libra",
    naturalRuler: "Venus",
    rulerGlyph: "♀",
  },
  {
    id: 8,
    name: "VIII",
    keyword: "Death",
    ruling: "Sex · Transformation · Shared Resources",
    desc: "Sex, inheritance, taxes, obsession, rebirth. The territory you must cross to transform. Nothing returns from the 8th house unchanged.",
    naturalSign: "Scorpio",
    naturalRuler: "Pluto",
    rulerGlyph: "♇",
  },
  {
    id: 9,
    name: "IX",
    keyword: "Wisdom",
    ruling: "Higher Education · Long Travel · Religion",
    desc: "The horizon expander: foreign lands, higher philosophy, publishing, the search for meaning. Belief systems and the stories we live by.",
    naturalSign: "Sagittarius",
    naturalRuler: "Jupiter",
    rulerGlyph: "♃",
  },
  {
    id: 10,
    name: "X",
    keyword: "Stature",
    ruling: "Career · Public Life · Father · Legacy",
    desc: "The summit. Your career, your public reputation, your legacy — what history will record. The world watches this house.",
    naturalSign: "Capricorn",
    naturalRuler: "Saturn",
    rulerGlyph: "♄",
  },
  {
    id: 11,
    name: "XI",
    keyword: "Community",
    ruling: "Friends · Hopes · Social Systems",
    desc: "Your tribe, your dreams, your network. The future you're building alongside others. Progress lives here — collective, collaborative, radical.",
    naturalSign: "Aquarius",
    naturalRuler: "Uranus",
    rulerGlyph: "♅",
  },
  {
    id: 12,
    name: "XII",
    keyword: "Solitude",
    ruling: "Hidden Things · Dreams · Institutions",
    desc: "The blind spot. Retreat, dreams, institutions, and the karma you carry but cannot see. The well from which unconscious forces draw.",
    naturalSign: "Pisces",
    naturalRuler: "Neptune",
    rulerGlyph: "♆",
  },
];

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function HousesLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);
  const [activeHouse, setActiveHouse] = useState<number | null>(null);

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

    // Wheel fade-in
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

    // Per-house scroll triggers
    HOUSES_DATA.forEach((h, i) => {
      const section = document.getElementById(`section-house-${h.id}`);
      const card    = document.getElementById(`card-house-${h.id}`);
      if (!section || !card) return;

      gsap.set(card, { autoAlpha: 0, y: 50 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 62%",
        end: "bottom 20%",

        onEnter: () => {
          setActiveHouse(h.id);
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
        },
        onLeave: () => {
          gsap.to(card, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" });
        },
        onEnterBack: () => {
          setActiveHouse(h.id);
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
        },
        onLeaveBack: () => {
          setActiveHouse(i > 0 ? HOUSES_DATA[i - 1].id : null);
          gsap.to(card, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" });
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
      onLeaveBack: () => {
        setActiveHouse(HOUSES_DATA[HOUSES_DATA.length - 1].id);
        gsap.to("#outro-card", { autoAlpha: 0, y: 30, duration: 0.4 });
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
        <div style={{ width: "min(80vh, 720px, 90vw)", aspectRatio: "1" }}>
          <NatalWheelSVG isDark={isDark} activeHouse={activeHouse} />
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
                Learn · The 12 Houses
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
              Physical Geometry
            </div>
            <h1
              className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              The 12<br />Houses.
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
                While signs are <em>how</em> energy moves, the 12 houses are <em>where</em> it happens. They divide the sky into the 12 distinct arenas of your existence — from identity to solitude.
              </p>
              <div className="mt-6 animate-bounce opacity-40 text-[var(--text-tertiary)] font-mono text-[9px] uppercase tracking-[0.4em]">
                Scroll to Begin
              </div>
            </div>
          </div>
        </section>

        {/* HOUSE SECTIONS */}
        {HOUSES_DATA.map((h, i) => {
          const isLeft = i % 2 === 0;
          return (
            <section
              key={h.id}
              id={`section-house-${h.id}`}
              className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20"
            >
              <div
                id={`card-house-${h.id}`}
                className={`w-full max-w-lg ${isLeft ? "mr-auto" : "ml-auto"}`}
              >
                <AstronatCard
                  variant="black"
                  shape="cut-md"
                  className="p-8 md:p-12 relative overflow-hidden"
                  style={{
                    boxShadow: isDark
                      ? "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(4,86,251,0.08)"
                      : "0 20px 60px rgba(0,0,0,0.10)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.10)"
                      : "1px solid rgba(27,27,27,0.12)",
                  }}
                >
                  {/* Watermark number */}
                  <span
                    style={{
                      position: "absolute",
                      fontFamily: "var(--font-primary)",
                      fontSize: "14rem",
                      color: "rgba(4,86,251,1)",
                      opacity: 0.04,
                      top: "-15%",
                      right: isLeft ? "-5%" : "auto",
                      left: isLeft ? "auto" : "-5%",
                      lineHeight: 1,
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  >
                    {h.id}
                  </span>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-5">
                      {/* House symbol glyph badge */}
                      <div
                        className="shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: "52px",
                          height: "52px",
                          border: "1.5px solid rgba(4,86,251,0.8)",
                          backgroundColor: "rgba(4,86,251,0.10)",
                          boxShadow: "0 0 18px rgba(4,86,251,0.25)",
                        }}
                      >
                        <span
                          className="font-secondary leading-none"
                          style={{
                            color: "rgba(4,86,251,1)",
                            fontSize: h.name.length > 3 ? "0.7rem" : h.name.length > 2 ? "0.85rem" : "1rem",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {h.name}
                        </span>
                      </div>
                      <h2
                        className="font-primary text-5xl md:text-6xl uppercase tracking-tight leading-none"
                        style={{ color: "var(--color-eggshell)" }}
                      >
                        House {h.id}
                      </h2>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: "var(--color-y2k-blue)",
                          color: "#fff",
                        }}
                      >
                        {h.keyword}
                      </span>
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5"
                        style={{
                          borderColor: "rgba(255,255,255,0.15)",
                          color: "rgba(255,255,255,0.65)",
                        }}
                      >
                        <SignIcon sign={h.naturalSign} size={10} color="currentColor" />
                        {h.naturalSign}
                      </span>
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5"
                        style={{
                          borderColor: "rgba(255,255,255,0.15)",
                          color: "rgba(255,255,255,0.65)",
                        }}
                      >
                        <span style={{ fontSize: "11px", lineHeight: 1 }}>{h.rulerGlyph}</span>
                        {h.naturalRuler}
                      </span>
                    </div>

                    {/* Ruling domains */}
                    <p
                      className="font-mono text-[10px] uppercase tracking-[0.15em] mb-4"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {h.ruling}
                    </p>

                    {/* Description */}
                    <p
                      className="font-body text-base leading-relaxed"
                      style={{ color: "rgba(248,245,236,0.75)" }}
                    >
                      {h.desc}
                    </p>
                  </div>
                </AstronatCard>
              </div>
            </section>
          );
        })}

        {/* EDITORIAL BLOG / FAQ SECTION */}
        <section 
          className="relative w-full py-32 px-6 md:px-12 lg:px-20 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] transition-colors duration-500"
          style={{ 
            backgroundColor: "var(--bg)", 
            color: "var(--text-primary)",
            borderTop: "1px solid var(--surface-border)"
          }}
        >
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-20">
              <div className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] mb-4 text-[var(--color-y2k-blue)]">
                Applied Astrology
              </div>
              <h2 className="font-primary text-5xl md:text-7xl uppercase tracking-tight leading-[0.9]">
                The Mechanics of the Houses
              </h2>
            </div>

            {/* FAQ 1: Empty Houses */}
            <div className="mb-20 pt-10" style={{ borderTop: "1px solid var(--surface-border)" }}>
              <h3 className="font-secondary text-2xl md:text-3xl mb-6">1. The Empty House Myth</h3>
              <p className="font-body text-lg md:text-xl leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                An empty house is not a dead house. Just because there are no planets sitting in your 7th House of Relationships or your 2nd House of Finances doesn't mean you're destined to die alone or broke. 
              </p>
              <p className="font-body text-lg md:text-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Think of an empty house like an empty room in an apartment. The room still exists, and you still use it. To understand what happens in that room, you have to look at the <em>landlord</em> of the room. In astrology, the landlord is the ruling planet of the sign on the cusp.
              </p>
            </div>

            {/* FAQ 2: House Rulers */}
            <div className="mb-20 pt-10" style={{ borderTop: "1px solid var(--surface-border)" }}>
              <h3 className="font-secondary text-2xl md:text-3xl mb-6">2. Follow the Landlord</h3>
              <p className="font-body text-lg md:text-xl leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                Every house is governed by a zodiac sign, and every sign has a ruling planet. If your 10th House starts in Aries, then Mars is the landlord. The affairs of the 10th House (career, legacy, reputation) are entirely outsourced to wherever Mars is living in your chart.
              </p>
              <p className="font-body text-lg md:text-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                If the landlord is in a strong, cozy position, the affairs of that house run smoothly. If the landlord is struggling, there's a leak in the ceiling of that house that you'll have to deal with—even if the room is empty.
              </p>
            </div>

            {/* Persona Case Study */}
            <div className="mb-10 pt-10" style={{ borderTop: "1px solid var(--surface-border)" }}>
              <h3 className="font-secondary text-2xl md:text-3xl mb-6">3. Case Study: Alex's Career</h3>
              <div 
                className="p-8 rounded-[var(--shape-asymmetric-md)] mb-8 shadow-sm transition-colors duration-500"
                style={{ 
                  backgroundColor: "var(--bg-raised)",
                  border: "1px solid var(--surface-border)"
                }}
              >
                <p className="font-body text-lg leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  Let's say <strong>Alex</strong> has an empty 10th House (Career & Public Life) with Aries on the cusp.
                </p>
                <ul className="list-disc list-inside mt-4 font-body text-base space-y-2 ml-2" style={{ color: "var(--text-secondary)" }}>
                  <li><strong>The House:</strong> 10th House (Career)</li>
                  <li><strong>The Sign:</strong> Aries (Action, Conflict)</li>
                  <li><strong>The Ruler:</strong> Mars (The Warrior)</li>
                </ul>
              </div>
              <p className="font-body text-lg md:text-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                To understand Alex's career path, we must find their Mars. Next, we locate Mars sitting in their <strong>3rd House of Communication</strong>. What does this mean? 
              </p>
              <p className="font-body text-lg md:text-xl leading-relaxed mt-6" style={{ color: "var(--text-secondary)" }}>
                It means Alex's public reputation (10th) is inexorably linked to how they speak, write, or debate (3rd) with aggressive, pioneering force (Aries). They might be a controversial journalist, a fiercely local politician, or a viral podcaster. The house was empty, but the career is loud. You just had to trace the thread.
              </p>
            </div>
          </div>
        </section>

        {/* OUTRO / CTA */}
        <section 
          id="section-outro" 
          className="relative min-h-[70vh] flex items-center justify-center px-6 transition-colors duration-500"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <LearnOutroCard
            title={<>The Sky<br />Sections</>}
            description="Every chart has 12 houses. Some are active and full of planets, while others are silent stages waiting for transits to pass through and activate them."
            buttonHref="/learn/natal-chart"
            buttonText="Learn: Your Natal Chart"
          />
        </section>

      </div>
    </div>
  );
}
