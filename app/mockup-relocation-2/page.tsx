"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../components/Navbar";
import { SIGN_PATHS } from "../components/SignIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ASC = 32.64; // ecliptic longitude of Ascendant (houses[0])
const CX = 400;
const CY = 400;
const ROTATION_SHIFT = -105; // degree shift for relocation
const VISUAL_SHIFT = -ROTATION_SHIFT; // to shift lon for calculation

const R = {
  outer:       385,
  zodiacInner: 345,
  houseNums:   316,
  planets:     272,
  inner:       190,
  glyphs:      365,
} as const;

// ═══════════════════════════════════════════════════════════════
// BIRTH DATA
// ═══════════════════════════════════════════════════════════════

const NATAL_LON: Record<string, number> = {
  sun:     144.92,
  moon:    200.48,
  mercury: 158.88,
  venus:    99.26,
  mars:     10.91,
  jupiter:  63.85,
  saturn:  266.06,
  uranus:  267.19,
  neptune: 277.69,
  pluto:   219.99,
};

const HOUSES = [
   32.64,  62.33,  90.84, 119.64, 150.15, 181.91,
  212.64, 242.33, 270.84, 299.64, 330.15,   1.91,
];

// ZODIAC SIGNS
type Element = "fire" | "earth" | "air" | "water";

const SIGNS: { name: string; glyph: string; lon: number; elem: Element }[] = [
  { name: "Aries",       glyph: "♈", lon:   0, elem: "fire"  },
  { name: "Taurus",      glyph: "♉", lon:  30, elem: "earth" },
  { name: "Gemini",      glyph: "♊", lon:  60, elem: "air"   },
  { name: "Cancer",      glyph: "♋", lon:  90, elem: "water" },
  { name: "Leo",         glyph: "♌", lon: 120, elem: "fire"  },
  { name: "Virgo",       glyph: "♍", lon: 150, elem: "earth" },
  { name: "Libra",       glyph: "♎", lon: 180, elem: "air"   },
  { name: "Scorpio",     glyph: "♏", lon: 210, elem: "water" },
  { name: "Sagittarius", glyph: "♐", lon: 240, elem: "fire"  },
  { name: "Capricorn",   glyph: "♑", lon: 270, elem: "earth" },
  { name: "Aquarius",    glyph: "♒", lon: 300, elem: "air"   },
  { name: "Pisces",      glyph: "♓", lon: 330, elem: "water" },
];

const ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.22)",
  earth: "rgba(201,169,110,0.20)",
  air:   "rgba(202,241,240,0.20)",
  water: "rgba(0,253,0,0.13)",
};

const ELEM_STROKE: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.60)",
  earth: "rgba(201,169,110,0.55)",
  air:   "rgba(202,241,240,0.55)",
  water: "rgba(0,253,0,0.45)",
};

const PLANETS = [
  {
    id: "sun", glyph: "☉", planet: "Sun", sign: "Leo", natalHouse: 4, relocatedHouse: 1,
    dignity: "DOMICILE", color: "#C9A96E",
    natalDesc: "In Jakarta, your Sun sat deep in the 4th house, emphasizing private life, roots, and home.",
    relocatedDesc: "Moved to the 1st House! In London, your core identity shines brightly and visibly. You take on a powerful public presence and leadership roles.",
  },
  {
    id: "moon", glyph: "☽", planet: "Moon", sign: "Libra", natalHouse: 6, relocatedHouse: 3,
    dignity: null, color: "#CAF1F0",
    natalDesc: "A Libra Moon in the 6th house seeks harmony and aesthetic grace in daily routines.",
    relocatedDesc: "Moved to the 3rd House! Your emotional life is now inextricably tied to communication, writing, and local community. You'll find comfort in transit and conversation.",
  },
  {
    id: "mercury", glyph: "☿", planet: "Mercury", sign: "Virgo", natalHouse: 5, relocatedHouse: 2,
    dignity: "DOMICILE", color: "#0456fb",
    natalDesc: "Mercury in the 5th house channeled your razor-sharp mind into creative, playful projects.",
    relocatedDesc: "Moved to the 2nd House! Your intellect becomes your greatest asset. Expect to successfully monetize your ideas and become highly strategic about personal resources.",
  },
  {
    id: "venus", glyph: "♀", planet: "Venus", sign: "Cancer", natalHouse: 3, relocatedHouse: 12,
    dignity: null, color: "#E67A7A",
    natalDesc: "Venus in the 3rd house deeply nurtured your daily interactions and local routines.",
    relocatedDesc: "Moved to the 12th House! Love and aesthetics become more private and spiritual. You may find peace in solitude or behind-the-scenes artistry.",
  },
  {
    id: "mars", glyph: "♂", planet: "Mars", sign: "Aries", natalHouse: 12, relocatedHouse: 9,
    dignity: "DOMICILE", color: "#D32F2F",
    natalDesc: "Mars in the 12th house operated powerfully but hidden, driving you from behind the scenes.",
    relocatedDesc: "Moved to the 9th House! Your drive is fully unleashed outward. You will aggressively pursue higher knowledge, expansive travel, and bravely publish your beliefs.",
  },
  {
    id: "jupiter", glyph: "♃", planet: "Jupiter", sign: "Gemini", natalHouse: 1, relocatedHouse: 10,
    dignity: "DETRIMENT", color: "#00FD00",
    natalDesc: "Jupiter in your 1st house projected a larger-than-life, relentlessly curious persona.",
    relocatedDesc: "Moved to the 10th House (Angular)! Massive career expansion. Your reputation grows exponentially in this city, offering huge professional opportunities.",
  },
  {
    id: "saturn", glyph: "♄", planet: "Saturn", sign: "Sagittarius", natalHouse: 8, relocatedHouse: 5,
    dignity: null, color: "#909090",
    natalDesc: "Saturn in the 8th house structured your approach to deep transformation and shared resources.",
    relocatedDesc: "Moved to the 5th House! You now take a serious, structured approach to romance, children, and creative self-expression. Fun requires discipline here.",
  },
  {
    id: "uranus", glyph: "♅", planet: "Uranus", sign: "Sagittarius", natalHouse: 8, relocatedHouse: 5,
    dignity: null, color: "#0456fb",
    natalDesc: "Uranus conjunct Saturn brought radical awakenings to your psychological depths.",
    relocatedDesc: "Moved to the 5th House! Creative rebellion. Expect sudden, electric shifts in your dating life and fiercely independent artistic projects.",
  },
  {
    id: "neptune", glyph: "♆", planet: "Neptune", sign: "Capricorn", natalHouse: 9, relocatedHouse: 6,
    dignity: null, color: "#CAF1F0",
    natalDesc: "Neptune in the 9th spiritualized your long-term visions and high philosophical ideals.",
    relocatedDesc: "Moved to the 6th House! A shift toward holistic routines. Your daily work and health regimens become deeply intuitive, though you must guard against burnout.",
  },
  {
    id: "pluto", glyph: "♇", planet: "Pluto", sign: "Scorpio", natalHouse: 7, relocatedHouse: 4,
    dignity: "DOMICILE", color: "#8E24AA",
    natalDesc: "Pluto in the 7th house brought transformative, relentless intensity to your close partnerships.",
    relocatedDesc: "Moved to the 4th House (Angular)! A massive shift. Transformation now happens at your roots. In London, your concept of 'home' undergoes profound psychological renovation.",
  },
];

const PLANET_LON_OFFSET: Record<string, number> = { saturn: -2.5, uranus: 2.5 };

// ═══════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function svgXY(lon: number, r: number) {
  const angle = toRad(180 - (lon - ASC));
  return {
    x: parseFloat((CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((CY + r * Math.sin(angle)).toFixed(3)),
  };
}

function zodiacSectorPath(signLon: number): string {
  const p1 = svgXY(signLon, R.outer);
  const p2 = svgXY(signLon + 30, R.outer);
  const p3 = svgXY(signLon + 30, R.zodiacInner);
  const p4 = svgXY(signLon, R.zodiacInner);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.outer} ${R.outer} 0 0 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 0 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

function getAspect(lon1: number, lon2: number) {
  let d = Math.abs(lon1 - lon2);
  if (d > 180) d = 360 - d;
  if (Math.abs(d - 120) < 8)  return { type: "Trine",       color: "#00FD00" };
  if (Math.abs(d - 90)  < 8)  return { type: "Square",      color: "#E67A7A" };
  if (Math.abs(d - 180) < 10) return { type: "Opposition",  color: "#888888" };
  if (Math.abs(d - 60)  < 6)  return { type: "Sextile",     color: "#CAF1F0" };
  if (d < 8)                   return { type: "Conjunction", color: "#0456fb" };
  return null;
}

const ALL_ASPECTS = (() => {
  const acc = [];
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const p1 = PLANETS[i], p2 = PLANETS[j];
      const lon1 = NATAL_LON[p1.id], lon2 = NATAL_LON[p2.id];
      const asp = getAspect(lon1, lon2);
      if (!asp) continue;
      // Draw aspects between their relocated visual positions
      const pt1 = svgXY(lon1 + VISUAL_SHIFT, R.inner);
      const pt2 = svgXY(lon2 + VISUAL_SHIFT, R.inner);
      const length = parseFloat(Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y).toFixed(3));
      acc.push({ id: `${p1.id}-${p2.id}`, planetA: p1.id, planetB: p2.id, ...asp, x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y, length });
    }
  }
  return acc;
})();

// ═══════════════════════════════════════════════════════════════
// SVG COMPONENT (WITH INDIVIDUAL ARCS)
// ═══════════════════════════════════════════════════════════════

function RelocatedWheelIndividualSVG({ isDark }: { isDark: boolean }) {
  const c = {
    circlePrimary:   isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.65)",
    circleSecondary: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.45)",
    circleInner:     isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.30)",
    glyphFill:       isDark ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.75)",
    houseAxis:       isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.85)",
    houseLine:       isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.55)",
    houseNum:        isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.60)",
    axisLabel:       isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.85)",
    planetBg:        isDark ? "rgba(0,0,0,0.88)" : "var(--color-eggshell)",
    tick:            isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",
    tickMajor:       isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.8)",
  };

  return (
    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <defs>
        {PLANETS.map((p) => (
          <filter key={p.id} id={`glow-${p.id}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feFlood floodColor={p.color} floodOpacity="1" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
        {/* Glow for active aspect arcs */}
        {PLANETS.map((p) => (
          <filter key={`glow-arc-${p.id}`} id={`glow-arc-${p.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {/* FIXED HOUSES */}
      <g id="fixed-houses" opacity={isDark ? "0.8" : "1"}>
        {HOUSES.map((cusp, i) => {
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          const from = svgXY(cusp, R.zodiacInner);
          const to   = svgXY(cusp, R.inner);
          return (
            <line key={`house-line-${i}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isAxis ? c.houseAxis : c.houseLine}
              strokeWidth={isAxis ? 2.5 : 1.2}
              strokeDasharray={isAxis ? undefined : "6 4"}
            />
          );
        })}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          let mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
          const pt = svgXY(mid, R.houseNums);
          return (
            <text key={`house-num-${i}`} x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="14" fill={c.houseNum}
              fontFamily="var(--font-mono)" fontWeight="600"
            >
              {i + 1}
            </text>
          );
        })}

        {/* Axis labels: ASC / DSC / MC / IC */}
        {([
          { label: "ASC", idx: 0 },
          { label: "DSC", idx: 6 },
          { label: "MC",  idx: 9 },
          { label: "IC",  idx: 3 },
        ] as const).map(({ label, idx }) => {
          const pt = svgXY(HOUSES[idx], R.zodiacInner - 24);
          return (
            <text key={label} x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="11" fill={c.axisLabel}
              fontFamily="var(--font-mono)" letterSpacing="2"
              fontWeight="600"
            >
              {label}
            </text>
          );
        })}
      </g>

      {/* ZODIAC (Starts Natal: 0deg rotation) */}
      <g id="static-zodiac" style={{ transformOrigin: "400px 400px", transform: "rotate(0deg)" }}>
        {SIGNS.map((s) => {
          const mid = svgXY(s.lon + 15, R.glyphs);
          const divFrom = svgXY(s.lon, R.outer);
          const divTo   = svgXY(s.lon, R.zodiacInner);
          return (
            <g key={s.name}>
              <path
                d={zodiacSectorPath(s.lon)}
                fill={ELEM_FILL[s.elem]} // Note: fill opacity will stack but it's fine
                fillOpacity="0.5"
                stroke={ELEM_STROKE[s.elem]}
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
              <g
                transform={`translate(${mid.x - 10}, ${mid.y - 10})`}
                style={{ color: c.glyphFill }}
                dangerouslySetInnerHTML={{ __html: SIGN_PATHS[s.name] }}
              />
              <line
                x1={divFrom.x} y1={divFrom.y} x2={divTo.x} y2={divTo.y}
                stroke={ELEM_STROKE[s.elem]} strokeWidth="1.2" strokeOpacity="0.4"
              />
            </g>
          );
        })}

        {/* 5° tick marks on outer ring */}
        {Array.from({ length: 72 }, (_, i) => {
          const lon = i * 5;
          const isMajor = lon % 30 === 0;
          const innerR = R.outer - (isMajor ? 11 : 5);
          const from = svgXY(lon, R.outer);
          const to   = svgXY(lon, innerR);
          return (
            <line key={`tick-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isMajor ? c.tickMajor : c.tick}
              strokeWidth={isMajor ? 1.2 : 0.5} />
          );
        })}
      </g>

      {/* STATIC CIRCLES */}
      <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" />
      <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" />
      <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" />

      {/* ASPECT LINES (Hidden initially) */}
      <g id="aspect-lines" opacity="0">
        {ALL_ASPECTS.map((asp) => (
          <line
            key={asp.id}
            id={`aspect-${asp.id}`}
            x1={asp.x1} y1={asp.y1}
            x2={asp.x2} y2={asp.y2}
            stroke={asp.color}
            strokeWidth="1.2"
            opacity="0.8"
            strokeDasharray={asp.length}
            strokeDashoffset={asp.length} // Hidden
          />
        ))}
      </g>

      {/* PLANET ARCS & POSITIONS */}
      <g id="planet-layers">
        {PLANETS.map((p) => {
          const lon = NATAL_LON[p.id] + (PLANET_LON_OFFSET[p.id] ?? 0);
          
          // Initial position on wheel
          const ptGhost    = svgXY(lon, R.planets);
          const ptActive   = svgXY(lon + VISUAL_SHIFT, R.planets);
          
          const sweepFlag = VISUAL_SHIFT > 0 ? 0 : 1; 
          const arcLength = Math.abs(VISUAL_SHIFT) * (Math.PI / 180) * R.planets;

          return (
            <g key={p.id}>
              {/* === TRAJECTORY ARC === */}
              <path
                id={`arc-${p.id}`}
                d={`M ${ptGhost.x} ${ptGhost.y} A ${R.planets} ${R.planets} 0 0 ${sweepFlag} ${ptActive.x} ${ptActive.y}`}
                fill="none"
                stroke={p.color}
                strokeWidth="2"
                strokeDasharray={arcLength}
                strokeDashoffset={arcLength} // Starts fully hidden
                opacity="0"
                filter={`url(#glow-arc-${p.id})`}
              />

              {/* === THE ONE TRUE PLANET === */}
              <g id={`moving-planet-${p.id}`} transform={`translate(${ptGhost.x}, ${ptGhost.y})`}>
                <circle cx="0" cy="0" r="34" fill={p.color} opacity="0.10" />
                <circle cx="0" cy="0" r="24" fill={p.color} opacity="0.25" />
                <circle cx="0" cy="0" r="20" fill={c.planetBg} stroke={p.color} strokeWidth="2.5" />
                <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="22" fill={p.color} fontFamily="var(--font-secondary)" filter={`url(#glow-${p.id})`}>
                  {p.glyph}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function RelocationIndividualPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };
    checkTheme();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => m.attributeName === "data-theme" && checkTheme());
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    // Intro map 
    const introCard = document.getElementById("intro-card");
    if (introCard) {
      gsap.set(introCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: "#section-intro",
        start: "top 80%",
        onEnter: () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }),
        onLeave: () => gsap.to(introCard, { autoAlpha: 0, y: -30, duration: 0.4 }),
        onEnterBack: () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.6 }),
        onLeaveBack: () => gsap.to(introCard, { autoAlpha: 0, y: 30, duration: 0.4 }),
      });
    }

      // Per planet scroll
    PLANETS.forEach((p) => {
      const section = document.getElementById(`section-${p.id}`);
      const card    = document.getElementById(`card-${p.id}`);
      const planetEl= document.getElementById(`moving-planet-${p.id}`);
      if (!section || !card || !planetEl) return;

      gsap.set(card, { autoAlpha: 0, y: 50 });

      // Create an object to track planetary orbital shift purely through JS math
      const lon = NATAL_LON[p.id] + (PLANET_LON_OFFSET[p.id] ?? 0);
      const stateObj = { shift: 0 };
      const updateLocation = () => {
        const pt = svgXY(lon + stateObj.shift, R.planets);
        planetEl.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
      };

      ScrollTrigger.create({
        trigger: section,
        start: "top 50%", // Delayed to hold natal basis longer
        end: "bottom 20%",
        onEnter: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          
          const arcLine = document.getElementById(`arc-${p.id}`);
          const len = arcLine ? (arcLine.getAttribute("stroke-dasharray") || 0) : 0;

          // Fade arc in, draw it, fade it out
          gsap.to(`#arc-${p.id}`, { opacity: 1, duration: 0.1 });
          gsap.fromTo(`#arc-${p.id}`,
            { strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }
          );
          gsap.to(`#arc-${p.id}`, { opacity: 0, delay: 1.6, duration: 0.5 }); 

          // Physically shift the planet mathematically across the screen
          gsap.to(stateObj, { 
             shift: VISUAL_SHIFT, 
             duration: 1.2, 
             ease: "power2.inOut", 
             onUpdate: updateLocation 
          });
        },
        onLeave: () => {
          // Keep planets visible, just hide card
          gsap.to(card, { autoAlpha: 0, y: -30, duration: 0.4 });
        },
        onEnterBack: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6 });
        },
        onLeaveBack: () => {
          gsap.to(card, { autoAlpha: 0, y: 30, duration: 0.4 });
          
          // Revert planet mathematically across the screen to natal position
          gsap.to(stateObj, { 
             shift: 0, 
             duration: 1.0, 
             ease: "power2.inOut", 
             onUpdate: updateLocation 
          });
          
          // Re-draw arc backwards
          const arcLine = document.getElementById(`arc-${p.id}`);
          if (arcLine) {
            const len = arcLine.getAttribute("stroke-dasharray") || 0;
            gsap.to(`#arc-${p.id}`, { opacity: 1, duration: 0.1 });
            gsap.to(`#arc-${p.id}`, { strokeDashoffset: len, duration: 1.0, ease: "power2.inOut", delay: 0.1 });
            gsap.to(`#arc-${p.id}`, { opacity: 0, delay: 1.2, duration: 0.2 });
          }
        },
      });
    });

    // Final Setup Section
    const finalSection = document.getElementById("section-final");
    const finalCard = document.getElementById("final-card");
    if (finalSection && finalCard) {
      gsap.set(finalCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: finalSection,
        start: "top 60%",
        onEnter: () => {
          gsap.to(finalCard, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" });
          // Reveal aspect lines!
          gsap.to("#aspect-lines", { opacity: 1, duration: 1 });
          ALL_ASPECTS.forEach((a, i) => {
             gsap.to(`#aspect-${a.id}`, { strokeDashoffset: 0, duration: 1.4, delay: i * 0.05 });
          });
          // Rotate Zodiac to finally catch up to the planets, aligning the sky!
          gsap.to("#static-zodiac", { rotation: VISUAL_SHIFT, duration: 2.5, ease: "circ.inOut", delay: 0.5 });
        },
        onLeaveBack: () => {
          gsap.to(finalCard, { autoAlpha: 0, y: 30, duration: 0.4 });
          gsap.to("#aspect-lines", { opacity: 0, duration: 0.5 });
          ALL_ASPECTS.forEach((a) => {
             gsap.to(`#aspect-${a.id}`, { strokeDashoffset: a.length, duration: 0.5 });
          });
          gsap.to("#static-zodiac", { rotation: 0, duration: 2.0, ease: "power2.inOut" });
        }
      });
    }

  }, { scope: wrapperRef });

  return (
    <div ref={wrapperRef} className="relative" style={{ backgroundColor: isDark ? "#000000" : "var(--color-eggshell)", transition: "background-color 0.6s ease" }}>
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: "min(70vh, 574px)", aspectRatio: "1" }}>
          <RelocatedWheelIndividualSVG isDark={isDark} />
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full z-50 pointer-events-auto">
        <div style={{ background: isDark ? "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)" : "linear-gradient(to bottom, var(--color-eggshell), rgba(248,245,236,0.4), transparent)" }}>
          <Navbar activeHref="/mockup-relocation-2" centerContent={<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Planet by Planet Shift</span>} />
        </div>
      </div>

      <div className="relative z-20">
        {/* INTRO */}
        <section id="section-intro" className="relative h-screen flex items-center justify-center px-6">
          <div id="intro-card" className="max-w-2xl text-center">
            <div className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-6 px-4 py-2 border border-[var(--color-y2k-blue)]/30 rounded-full backdrop-blur-md bg-white/5">
              Astrolocality Profiles
            </div>
            <h1 className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8" style={{ color: "var(--text-primary)" }}>
              Detailed<br />Shifts
            </h1>
            <div className="p-6 md:p-8 rounded-[var(--shape-asymmetric-lg)] backdrop-blur-xl max-w-xl mx-auto" style={{ background: isDark ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.70)", border: "1px solid var(--surface-border)" }}>
              <p className="font-body text-base md:text-lg leading-relaxed shadow-sm" style={{ color: "var(--text-secondary)" }}>
                Scroll down to see exactly how each part of your cosmic blueprint travels from its <strong style={{ color: "var(--text-primary)" }}>Natal Position</strong> to its newly activated house in <strong style={{ color: "var(--text-primary)" }}>London</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* PLANET SECTIONS */}
        {PLANETS.map((p, i) => {
          const isLeft = i % 2 === 0;
          return (
            <section key={p.id} id={`section-${p.id}`} className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20">
              <div id={`card-${p.id}`} className={`w-full max-w-lg ${isLeft ? "mr-auto" : "ml-auto"}`}>
                <div className="p-6 md:p-8 rounded-[var(--shape-asymmetric-md)] backdrop-blur-2xl relative overflow-hidden"
                  style={{
                    background: isDark ? "rgba(8,8,8,0.88)" : "rgba(255,255,255,0.82)",
                    border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(27,27,27,0.10)",
                    boxShadow: isDark ? `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${p.color}14` : `0 20px 60px rgba(0,0,0,0.08), 0 0 40px ${p.color}22`
                  }}
                >
                  <span style={{ position: "absolute", fontFamily: "var(--font-display-alt-2)", fontSize: "13rem", color: p.color, opacity: 0.06, top: "-15%", right: isLeft ? "-8%" : "auto", left: isLeft ? "auto" : "-8%", pointerEvents: "none", lineHeight: 1, zIndex: 0 }}>
                    {p.planet.charAt(0)}
                  </span>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 12px ${p.color}` }} />
                      <h2 className="font-primary text-5xl md:text-6xl uppercase tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
                        {p.planet}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-dashed opacity-50" style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}>
                        Natal House {p.natalHouse}
                      </span>
                      <span className="text-xs text-white/30">→</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border" style={{ borderColor: p.color, color: "var(--text-primary)", backgroundColor: `${p.color}22` }}>
                        New House {p.relocatedHouse}
                      </span>
                    </div>

                    <div className="mb-4 text-sm opacity-60 font-mono pl-3 border-l-2" style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}>
                      {p.natalDesc}
                    </div>
                    
                    <p className="font-body text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {p.relocatedDesc}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* FINAL ANALYSIS SECTION */}
        <section id="section-final" className="relative min-h-screen flex items-center justify-center px-6 py-20">
          <div id="final-card" className="max-w-xl text-center p-8 rounded-[var(--shape-asymmetric-lg)] backdrop-blur-3xl overflow-hidden relative"
               style={{
                 background: isDark ? "rgba(8,8,8,0.88)" : "rgba(255,255,255,0.85)",
                 border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(27,27,27,0.15)",
                 boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
               }}
          >
            <div className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border rounded-full mb-6"
                 style={{ color: "var(--color-y2k-purple)", borderColor: "var(--color-y2k-purple)" }}>
              The London Sky
            </div>
            <h2 className="font-primary text-5xl md:text-6xl uppercase tracking-tight leading-none mb-6" style={{ color: "var(--text-primary)" }}>
              New Blueprint
            </h2>
            <p className="font-body text-base md:text-lg leading-relaxed shadow-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              With all planets migrated, the Zodiac ring rotates. Your <strong>Ascendant (ASC)</strong>, <strong>Midheaven (MC)</strong>, and exact orbital web align into their final configuration. 
            </p>
          </div>
        </section>

        <div className="h-[20vh]" /> {/* Spacer */}
      </div>
    </div>
  );
}
