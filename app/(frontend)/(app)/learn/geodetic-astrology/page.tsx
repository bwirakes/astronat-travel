"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { WORLD_MAP_PATH } from "@/app/components/worldMapPath";
import { SIGN_PATHS } from "@/app/components/SignIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

import { GEODETIC_ZONES, ELEMENT_COLORS, projectLon, projectLat } from "@/app/geodetic/data/geodeticZones";

import { PageHeader } from "@/components/app/page-header-context";
// ═══════════════════════════════════════════════════════════════
// WORLD MAP COMPONENT
// ═══════════════════════════════════════════════════════════════

function GeodeticWorldMap({ activeZoneId }: { activeZoneId: string | null }) {
  const isDark = true; // always dark for this map

  return (
    <svg
      viewBox="0 0 1000 500"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <PageHeader backTo="/learn" backLabel="Academy" />
      <defs>
        {GEODETIC_ZONES.map(z => (
          <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.5" />
            <stop offset="100%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.05" />
          </linearGradient>
        ))}
      </defs>

      {/* World Map Landmass */}
      <path
        d={WORLD_MAP_PATH}
        fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(27,27,27,0.12)"}
        stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(27,27,27,0.3)"}
        strokeWidth="0.5"
      />

      {/* Geodetic Zone Bands */}
      {GEODETIC_ZONES.map(z => {
        const x1 = projectLon(z.startLon);
        const x2 = projectLon(z.startLon + 30);
        const isActive = activeZoneId === z.id;
        const elem = ELEMENT_COLORS[z.elem];

        return (
          <g key={z.id}>
            {/* Zone fill */}
            <rect
              x={Math.min(x1, x2)}
              y={0}
              width={Math.abs(x2 - x1)}
              height={500}
              fill={isActive ? elem.fill.replace("0.15", "0.35") : elem.fill}
              stroke={elem.stroke}
              strokeWidth={isActive ? 1.5 : 0.5}
              strokeDasharray={isActive ? "none" : "4 4"}
              style={{ transition: "all 0.5s ease" }}
              opacity={isActive ? 1 : 0.4}
            />

            {/* Sign glyph at zone center */}
            <g
              transform={`translate(${(x1 + x2) / 2 - 8}, 20)`}
              opacity={isActive ? 1 : 0.2}
              style={{ transition: "opacity 0.5s ease", color: elem.stroke }}
              dangerouslySetInnerHTML={{ __html: SIGN_PATHS[z.sign] }}
            />

            {/* Meridian line at zone start */}
            <line
              x1={x1} y1={0} x2={x1} y2={500}
              stroke={elem.stroke}
              strokeWidth={isActive ? 1.5 : 0.5}
              opacity={isActive ? 0.9 : 0.25}
              style={{ transition: "all 0.5s ease" }}
            />

            {/* Longitude label */}
            <text
              x={x1 + 4}
              y={490}
              fontSize="7"
              fill={elem.stroke}
              fontFamily="var(--font-mono)"
              opacity={isActive ? 0.9 : 0.3}
              style={{ transition: "opacity 0.5s ease" }}
            >
              {z.startLon >= 0 ? `${z.startLon}°E` : `${Math.abs(z.startLon)}°W`}
            </text>
          </g>
        );
      })}

      {/* Equator */}
      <line x1="0" y1={projectLat(0)} x2="1000" y2={projectLat(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="6 4" />
      <text x="4" y={projectLat(0) - 4} fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">EQUATOR</text>

      {/* Tropics */}
      <line x1="0" y1={projectLat(23.5)} x2="1000" y2={projectLat(23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
      <line x1="0" y1={projectLat(-23.5)} x2="1000" y2={projectLat(-23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function GeodeticLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    // Intro card
    const introCard = document.getElementById("intro-card");
    if (introCard) {
      gsap.set(introCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: "#section-intro",
        start: "top 80%",
        onEnter:     () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }),
        onLeave:     () => gsap.to(introCard, { autoAlpha: 0, y: -30, duration: 0.4 }),
        onEnterBack: () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.6 }),
        onLeaveBack: () => gsap.to(introCard, { autoAlpha: 0, y: 30, duration: 0.4 }),
      });
    }

    // Zone sections — set active zone on scroll
    GEODETIC_ZONES.forEach((zone) => {
      const sectionEl = document.getElementById(`section-${zone.id}`);
      const cardEl = document.getElementById(`card-${zone.id}`);
      if (!sectionEl || !cardEl) return;

      gsap.set(cardEl, { autoAlpha: 0, x: -40 });

      ScrollTrigger.create({
        trigger: sectionEl,
        start: "top 55%",
        end: "bottom 45%",
        onEnter: () => {
          setActiveZoneId(zone.id);
          gsap.to(cardEl, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out" });
        },
        onLeave:     () => gsap.to(cardEl, { autoAlpha: 0, x: -20, duration: 0.4 }),
        onEnterBack: () => {
          setActiveZoneId(zone.id);
          gsap.to(cardEl, { autoAlpha: 1, x: 0, duration: 0.6 });
        },
        onLeaveBack: () => gsap.to(cardEl, { autoAlpha: 0, x: -20, duration: 0.4 }),
      });
    });

    // Outro
    const outroCard = document.getElementById("outro-card");
    if (outroCard) {
      gsap.set(outroCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: "#section-outro",
        start: "top 60%",
        onEnter:     () => gsap.to(outroCard, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }),
        onEnterBack: () => gsap.to(outroCard, { autoAlpha: 1, y: 0, duration: 0.6 }),
        onLeaveBack: () => gsap.to(outroCard, { autoAlpha: 0, y: 30, duration: 0.4 }),
      });
    }
  }, { scope: wrapperRef });

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ backgroundColor: isDark ? "#000000" : "var(--color-eggshell)", transition: "background-color 0.6s ease" }}
    >
      <div className="relative z-10">

        {/* INTRO SECTION */}
        <section id="section-intro" className="relative min-h-screen flex items-center justify-center px-6 py-32 pt-32">
          <div id="intro-card" className="max-w-2xl text-center">
            <div className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-6 px-4 py-2 border border-[var(--color-y2k-blue)]/30 rounded-full backdrop-blur-md" style={{ background: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}>
              Mundane Astrology
            </div>
            <h1
              className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)", textShadow: isDark ? "0 4px 40px rgba(0,0,0,0.8)" : "none" }}
            >
              Geodetic<br /><span style={{ color: "var(--color-spiced-life)" }}>Astrology</span>
            </h1>
            <div
              className="p-6 md:p-8 backdrop-blur-xl max-w-xl mx-auto"
              style={{
                background: isDark ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.70)",
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--shape-asymmetric-lg)",
              }}
            >
              <p className="font-body text-base md:text-lg leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
                Unlike Astrocartography — which is <strong style={{ color: "var(--text-primary)" }}>personal</strong>, calculated from your specific birth data — Geodetic Astrology is baked into the Earth itself. The same zodiac zone that shapes London shapes every person who has ever lived there, regardless of when they were born.
              </p>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                The system is simple: 0° Aries locks to 0° Greenwich. Every 30° of longitude east becomes the next zodiac sign. The result: every city on Earth has a permanent, fixed zodiacal frequency — a character built into the land itself. Scroll to explore all 12 zones.
              </p>
            </div>
          </div>
        </section>

        {/* FIXED WORLD MAP — stays fullscreen behind all content */}
        <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none" style={{ top: "72px" }}>
          {/* Map fills the right ~60% of the viewport on desktop, full width on mobile */}
          <div className="w-full h-full relative">
            <GeodeticWorldMap activeZoneId={activeZoneId} />
            {/* Active zone badge — bottom right */}
            {activeZoneId && (() => {
              const zone = GEODETIC_ZONES.find(z => z.id === activeZoneId);
              if (!zone) return null;
              const elem = ELEMENT_COLORS[zone.elem];
              return (
                <div
                  className="absolute bottom-6 right-6 flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full pointer-events-none"
                  style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${elem.stroke}` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: elem.stroke }} />
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: elem.stroke }}>
                    {zone.sign} · {zone.startLon >= 0 ? `${zone.startLon}°E` : `${Math.abs(zone.startLon)}°W`}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="relative z-10">
            {GEODETIC_ZONES.map((zone) => {
              const elemStyle = ELEMENT_COLORS[zone.elem];
              return (
                <section
                  key={zone.id}
                  id={`section-${zone.id}`}
                  className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20"
                >
                  <div id={`card-${zone.id}`} className="w-full max-w-lg">
                    <div
                      className="p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden"
                      style={{
                        background: isDark ? "rgba(8,8,8,0.90)" : "rgba(255,255,255,0.85)",
                        border: `1px solid ${elemStyle.stroke}`,
                        borderRadius: "var(--shape-asymmetric-md)",
                        boxShadow: isDark ? `0 20px 60px rgba(0,0,0,0.7), 0 0 40px ${elemStyle.fill}` : `0 20px 60px rgba(0,0,0,0.08)`,
                      }}
                    >
                      {/* Decorative glyph watermark */}
                      <div
                        className="absolute -top-4 -right-4 text-[8rem] leading-none pointer-events-none select-none opacity-[0.07]"
                        style={{ fontFamily: "var(--font-primary)", color: elemStyle.stroke }}
                      >
                        {zone.glyph}
                      </div>

                      <div className="relative z-10">
                        {/* Zone header */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: elemStyle.stroke }} />
                          <div className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: elemStyle.stroke }}>
                            {zone.startLon >= 0 ? `${zone.startLon}°E` : `${Math.abs(zone.startLon)}°W`} — {zone.startLon + 30 >= 0 ? `${zone.startLon + 30}°E` : `${Math.abs(zone.startLon + 30)}°W`}
                          </div>
                        </div>

                        <h2 className="font-primary text-4xl md:text-5xl uppercase tracking-tight leading-none mb-1" style={{ color: "var(--text-primary)" }}>
                          {zone.sign}
                        </h2>
                        <div className="font-secondary text-lg italic mb-5" style={{ color: elemStyle.stroke }}>
                          {zone.keyword}
                        </div>

                        {/* Cities pill tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {zone.cities.map(city => (
                            <span
                              key={city}
                              className="font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border"
                              style={{ borderColor: elemStyle.stroke, color: elemStyle.stroke, opacity: 0.7 }}
                            >
                              {city}
                            </span>
                          ))}
                        </div>

                        <p className="font-body text-sm md:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {zone.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
        </div>

        {/* OUTRO */}
        <section id="section-outro" className="relative min-h-screen flex items-center justify-center px-6 py-32">
          <div id="outro-card" className="max-w-2xl text-center w-full">
            <div
              className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] mb-6 px-4 py-2 border rounded-full backdrop-blur-md"
              style={{ color: "var(--sage)", borderColor: "rgba(0,253,0,0.3)", background: "rgba(0,253,0,0.05)" }}
            >
              12 Zones Mapped
            </div>
            <h2
              className="font-primary text-5xl md:text-[5.5rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              Heaven<br />On Earth
            </h2>
            <div
              className="p-6 md:p-8 border backdrop-blur-2xl max-w-xl mx-auto"
              style={{
                background: isDark ? "rgba(10,10,10,0.9)" : "rgba(255,255,255,0.7)",
                borderColor: "var(--surface-border)",
                borderRadius: "var(--shape-organic-1)",
                boxShadow: isDark ? "0 0 80px rgba(4,86,251,0.1)" : "none",
              }}
            >
              <p className="font-body text-base md:text-lg leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                Why do you feel like a fundamentally different person in one city versus another? Geodetic astrology offers one concrete answer: every coordinate on Earth is permanently tuned to a zodiacal frequency, regardless of who is visiting.
              </p>
              <p className="font-body text-sm leading-relaxed mb-8" style={{ color: "var(--text-tertiary)" }}>
                This isn't mysticism — it's geometry. The zodiac belt is overlaid on longitude, and the city you're standing in already has a sign. The question is whether that sign resonates with the rest of your chart, or works against it.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/learn"
                  className="inline-flex items-center justify-center px-6 py-4 border font-mono uppercase text-xs font-bold rounded-full hover:opacity-70 transition-all"
                  style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
                >
                  ← Back to Learn
                </Link>
                <Link
                  href="/learn/houses"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-y2k-blue)] text-white font-mono uppercase text-xs font-bold rounded-full hover:opacity-80 transition-all hover:scale-105"
                >
                  Next: The 12 Houses →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
