"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { SIGN_PATHS } from "@/app/components/SignIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & MATH (Portable from NatalMockupWheel)
// ═══════════════════════════════════════════════════════════════

const ASC = 32.64; 
const CX = 400; const CY = 400;
const R = {
  outer: 385, zodiacInner: 345, houseNums: 316, planets: 272, inner: 190, glyphs: 365,
};

const NATAL_LON: Record<string, number> = {
  sun: 144.92, moon: 200.48, mercury: 158.88, venus: 99.26, mars: 10.91,
  jupiter: 63.85, saturn: 266.06, uranus: 267.19, neptune: 277.69, pluto: 219.99,
};

// Official Planet Colors from lib/planet-data.ts / globals.css
const BRAND_PLANET_COLORS: Record<string, string> = {
  sun: "var(--color-planet-sun)",
  moon: "var(--color-planet-moon)",
  mercury: "var(--color-planet-mercury)",
  venus: "var(--color-planet-venus)",
  mars: "var(--color-planet-mars)",
  jupiter: "var(--color-planet-jupiter)",
  saturn: "var(--color-planet-saturn)",
  uranus: "var(--color-planet-uranus)",
  neptune: "var(--color-planet-neptune)",
  pluto: "var(--color-planet-pluto)",
};

const HOUSES_CUSPS = [
  32.64, 62.33, 90.84, 119.64, 150.15, 181.91,
  212.64, 242.33, 270.84, 299.64, 330.15, 1.91,
];

const SIGNS = [
  { name: "Aries", lon: 0, elem: "fire" }, { name: "Taurus", lon: 30, elem: "earth" },
  { name: "Gemini", lon: 60, elem: "air" }, { name: "Cancer", lon: 90, elem: "water" },
  { name: "Leo", lon: 120, elem: "fire" }, { name: "Virgo", lon: 150, elem: "earth" },
  { name: "Libra", lon: 180, elem: "air" }, { name: "Scorpio", lon: 210, elem: "water" },
  { name: "Sagittarius", lon: 240, elem: "fire" }, { name: "Capricorn", lon: 270, elem: "earth" },
  { name: "Aquarius", lon: 300, elem: "air" }, { name: "Pisces", lon: 330, elem: "water" },
];

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function svgXY(lon: number, r: number) {
  const angle = toRad(180 - (lon - ASC));
  return {
    x: parseFloat((CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((CY + r * Math.sin(angle)).toFixed(3)),
  };
}

// Planar definitions for the scrollytelling
const LEARN_STEPS = [
  {
    id: "sun", planet: "Sun", glyph: "☉", color: BRAND_PLANET_COLORS.sun,
    title: "The Central Star",
    desc: "Your Sun represents your core identity, your ego, and your primary life purpose. It is the 'I AM' of your life.",
    detail: "In this chart, the Sun is in Leo in the 4th House. This person shines brightest within their private emotional foundation and home life."
  },
  {
    id: "moon", planet: "Moon", glyph: "☽", color: BRAND_PLANET_COLORS.moon,
    title: "The Emotional Tide",
    desc: "The Moon rules your instincts, your habits, and your internal emotional safety. It is how you react when the lights go out.",
    detail: "A Libra Moon in the 6th House seeks beauty and social harmony through daily labor and acts of calculated service."
  },
  {
    id: "saturn", planet: "Saturn", glyph: "♄", color: BRAND_PLANET_COLORS.saturn,
    title: "The Great Taskmaster",
    desc: "Saturn represent boundaries, time, karma, and the hard work required to build something lasting.",
    detail: "Saturn in Sagittarius in the 8th House demands deep psychological mastery and strict discipline regarding shared resources."
  }
];

function NatalWheelSVG({ isDark }: { isDark: boolean }) {
  const c = isDark 
    ? { line: "rgba(255,255,255,0.2)", text: "rgba(255,255,255,0.4)" }
    : { line: "rgba(0,0,0,0.1)", text: "rgba(0,0,0,0.3)" };

  return (
    <svg viewBox="0 0 800 800" className="w-full h-full overflow-visible">
      {/* Structural Wheel */}
      <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.line} strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.line} strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.line} strokeWidth="1" />
      
      {/* Signs */}
      {SIGNS.map(s => {
        const mid = svgXY(s.lon + 15, R.glyphs);
        return (
          <g key={s.name} opacity="0.3">
             <g 
               transform={`translate(${mid.x - 10}, ${mid.y - 10})`} 
               dangerouslySetInnerHTML={{ __html: SIGN_PATHS[s.name] }}
               className="fill-current text-white/20"
             />
          </g>
        )
      })}

      {/* House Lines */}
      {HOUSES_CUSPS.map((cusp, i) => {
        const p1 = svgXY(cusp, R.zodiacInner);
        const p2 = svgXY(cusp, R.inner);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={c.line} strokeWidth="0.5" strokeDasharray="4 4" />
      })}

      {/* Active Planets */}
      {LEARN_STEPS.map(p => {
        const lon = NATAL_LON[p.id];
        const pt = svgXY(lon, R.planets);
        const pin = svgXY(lon, R.zodiacInner);
        return (
          <g key={p.id} id={`planet-${p.id}`} opacity="0" transform="scale(0.5)" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}>
            <line x1={pt.x} y1={pt.y} x2={pin.x} y2={pin.y} stroke={p.color} strokeWidth="1" opacity="0.4" />
            <circle cx={pt.x} cy={pt.y} r="20" fill="black" stroke={p.color} strokeWidth="2" />
            <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="22" fill={p.color} fontFamily="var(--font-secondary)">
              {p.glyph}
            </text>
          </g>
        )
      })}
    </svg>
  );
}

export default function NatalLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    // Fixed background setup
    gsap.set(".wheel-bg", { opacity: 0 });
    gsap.to(".wheel-bg", { opacity: 0.35, duration: 2, ease: "power2.out" });

    // Reveal Steps
    LEARN_STEPS.forEach(step => {
       ScrollTrigger.create({
         trigger: `#section-${step.id}`,
         start: "top 65%",
         end: "bottom 35%",
         onEnter: () => {
           gsap.to(`#planet-${step.id}`, { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)" });
           gsap.fromTo(`#card-${step.id}`, { autoAlpha: 0, x: -60, y: 20 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, ease: "power3.out" });
         },
         onLeave: () => {
            gsap.to(`#card-${step.id}`, { autoAlpha: 0, x: -40, duration: 0.4 });
         },
         onEnterBack: () => {
            gsap.to(`#card-${step.id}`, { autoAlpha: 1, x: 0, y: 0, duration: 0.6 });
         },
         onLeaveBack: () => {
           gsap.to(`#planet-${step.id}`, { opacity: 0, scale: 0.5, duration: 0.5 });
           gsap.to(`#card-${step.id}`, { autoAlpha: 0, x: -40, duration: 0.4 });
         }
       });
    });

  }, { scope: wrapperRef });

  return (
    <div ref={wrapperRef} className="bg-[var(--bg)] text-[var(--text-primary)] font-body min-h-screen transition-colors duration-300">
      <Navbar activeHref="/learn" />
      
      {/* Fixed Wheel Background */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none wheel-bg">
        <div className="w-[85vh] h-[85vh]">
          <NatalWheelSVG isDark={true} />
        </div>
      </div>

      <div className="relative z-10">
        <section id="section-intro" className="h-screen flex items-center justify-center">
          <LearnIntroCard 
            category="The Foundation"
            title={<>The <span className="text-[var(--color-y2k-blue)] italic lowercase">Natal Chart</span></>}
            description="A natal chart is a mathematical snapshot of the heavens at the exact moment of your birth. It is the unique blueprint of your potential."
          />
        </section>

        {LEARN_STEPS.map(step => (
          <section key={step.id} id={`section-${step.id}`} className="min-h-screen flex items-center px-12 md:px-24 py-32">
            <div id={`card-${step.id}`} className="opacity-0">
               <LearnSectionCard 
                 title={step.title}
                 description={step.desc}
               />
               <div className="mt-12 border-l-2 border-[var(--color-y2k-blue)] pl-10 max-w-2xl">
                 <p className="font-secondary text-2xl md:text-3xl text-[var(--color-eggshell)]/70 italic leading-relaxed">
                   {step.detail}
                 </p>
               </div>
            </div>
          </section>
        ))}

        <section id="section-outro" className="h-screen flex items-center justify-center">
           <LearnOutroCard 
             title={<>The Full <br/><span className="italic text-[var(--color-y2k-blue)]">Cosmic Map</span></>}
             description="Every planet in your chart tells a different story. When combined, they form the complex narrative of who you are."
             buttonHref="/learn/houses"
             buttonText="Next: The 12 Houses"
           />
        </section>
      </div>
    </div>
  );
}
