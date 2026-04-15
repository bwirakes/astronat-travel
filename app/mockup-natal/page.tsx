"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import { SIGN_PATHS } from "@/app/components/SignIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ASC = 32.64; // ecliptic longitude of Ascendant (houses[0])
const CX = 400;
const CY = 400;

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

// ═══════════════════════════════════════════════════════════════
// ZODIAC SIGNS
// ═══════════════════════════════════════════════════════════════

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

// House wedge fills (inner chart area, softer but visible)
const HOUSE_ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.18)",
  earth: "rgba(201,169,110,0.17)",
  air:   "rgba(202,241,240,0.17)",
  water: "rgba(0,253,0,0.12)",
};

// ═══════════════════════════════════════════════════════════════
// PLANET SEQUENCE
// ═══════════════════════════════════════════════════════════════

const PLANETS = [
  {
    id: "sun", glyph: "☉", planet: "Sun", sign: "Leo", house: 4,
    dignity: "DOMICILE", color: "#C9A96E",
    desc: "Core identity, ego, life purpose. Sun in Leo — its natural home — in the 4th house spotlights your private life, roots, and home. You shine brightest in intimate environments.",
  },
  {
    id: "moon", glyph: "☽", planet: "Moon", sign: "Libra", house: 6,
    dignity: null, color: "#CAF1F0",
    desc: "Emotions, instincts, inner world. A Libra Moon in the 6th house seeks harmony, balance, and aesthetic grace in daily routines, work, and acts of service.",
  },
  {
    id: "mercury", glyph: "☿", planet: "Mercury", sign: "Virgo", house: 5,
    dignity: "DOMICILE", color: "#0456fb",
    desc: "Communication, thinking. Mercury in Virgo (5th house) gives you a razor-sharp, analytical mind applied playfully to creative projects and self-expression.",
  },
  {
    id: "venus", glyph: "♀", planet: "Venus", sign: "Cancer", house: 3,
    dignity: null, color: "#E67A7A",
    desc: "Love, beauty, values. Venus in Cancer nurtures through communication. Your 3rd house placement makes you emotionally attuned right down to your daily interactions.",
  },
  {
    id: "mars", glyph: "♂", planet: "Mars", sign: "Aries", house: 12,
    dignity: "DOMICILE", color: "#D32F2F",
    desc: "Drive, ambition. Domicile Mars in Aries in the hidden 12th house — a ferocious inner drive that operates powerfully behind the scenes and in spiritual matters.",
  },
  {
    id: "jupiter", glyph: "♃", planet: "Jupiter", sign: "Gemini", house: 1,
    dignity: "DETRIMENT", color: "#00FD00",
    desc: "Expansion, luck. Jupiter in Gemini in your 1st house projects a larger-than-life, relentlessly curious, and highly communicative persona into the world.",
  },
  {
    id: "saturn", glyph: "♄", planet: "Saturn", sign: "Sagittarius", house: 8,
    dignity: null, color: "#909090",
    desc: "Structure, karma, limits. Saturn in Sagittarius in the 8th house structures your approach to deep transformation, shared resources, and existential questions.",
  },
  {
    id: "uranus", glyph: "♅", planet: "Uranus", sign: "Sagittarius", house: 8,
    dignity: null, color: "#0456fb",
    desc: "Revolution, sudden change. Uranus conjunct Saturn in the 8th brings radical awakenings to your psychological depths and financial structures.",
  },
  {
    id: "neptune", glyph: "♆", planet: "Neptune", sign: "Capricorn", house: 9,
    dignity: null, color: "#CAF1F0",
    desc: "Intuition, dreams. Neptune in Capricorn (9th house) spiritualises your long-term visions, blending pragmatic ambition with high philosophical ideals.",
  },
  {
    id: "pluto", glyph: "♇", planet: "Pluto", sign: "Scorpio", house: 7,
    dignity: "DOMICILE", color: "#8E24AA",
    desc: "Transformation, power. Domicile Pluto in the 7th house — powerful, transformative intensity and relentless authenticity in all close partnerships.",
  },
];

// Slight angular separation for near-conjunct Saturn/Uranus (1.13° apart)
const PLANET_LON_OFFSET: Record<string, number> = {
  saturn: -2.5,
  uranus:  2.5,
};

// ═══════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function svgXY(lon: number, r: number) {
  const angle = toRad(180 - (lon - ASC));
  return {
    x: parseFloat((CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((CY + r * Math.sin(angle)).toFixed(3)),
  };
}

/**
 * SVG arc path for one 30° zodiac sector
 * Outer arc: sweep=0 (counter-clockwise, decreasing svgAngle)
 * Inner arc: sweep=1 (clockwise back)
 */
function zodiacSectorPath(signLon: number): string {
  const p1 = svgXY(signLon,      R.outer);
  const p2 = svgXY(signLon + 30, R.outer);
  const p3 = svgXY(signLon + 30, R.zodiacInner);
  const p4 = svgXY(signLon,      R.zodiacInner);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.outer} ${R.outer} 0 0 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 0 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

/** Arc path for a house wedge between two cusp longitudes (inner chart area) */
function houseSectorPath(cusp1: number, cusp2: number): string {
  // Handle cusp2 < cusp1 wraparound (e.g. house 12: 1.91° → 32.64°)
  const spanDeg = ((cusp2 - cusp1) + 360) % 360;
  const largeArc = spanDeg > 180 ? 1 : 0;
  const p1 = svgXY(cusp1, R.zodiacInner);
  const p2 = svgXY(cusp2, R.zodiacInner);
  const p3 = svgXY(cusp2, R.inner);
  const p4 = svgXY(cusp1, R.inner);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R.zodiacInner} ${R.zodiacInner} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R.inner} ${R.inner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    `Z`,
  ].join(" ");
}

// ═══════════════════════════════════════════════════════════════
// ASPECT COMPUTATION
// ═══════════════════════════════════════════════════════════════

interface AspectEntry {
  id: string;
  planetA: string;
  planetB: string;
  type: string;
  color: string;
  x1: number; y1: number;
  x2: number; y2: number;
  length: number;
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

const ALL_ASPECTS: AspectEntry[] = (() => {
  const acc: AspectEntry[] = [];
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const p1 = PLANETS[i], p2 = PLANETS[j];
      const lon1 = NATAL_LON[p1.id], lon2 = NATAL_LON[p2.id];
      const asp = getAspect(lon1, lon2);
      if (!asp) continue;
      const pt1 = svgXY(lon1, R.inner);
      const pt2 = svgXY(lon2, R.inner);
      const length = parseFloat(Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y).toFixed(3));
      acc.push({ id: `${p1.id}-${p2.id}`, planetA: p1.id, planetB: p2.id, ...asp, x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y, length });
    }
  }
  return acc;
})();

// ═══════════════════════════════════════════════════════════════
// NATAL WHEEL SVG COMPONENT
// ═══════════════════════════════════════════════════════════════

function NatalWheelSVG({ isDark }: { isDark: boolean }) {
  const c = {
    circlePrimary:   isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.85)",
    circleSecondary: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.65)",
    circleInner:     isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.50)",
    glyphFill:       isDark ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.95)",
    houseAxis:       isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.95)",
    houseLine:       isDark ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.75)",
    axisLabel:       isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.85)",
    houseNum:        isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.80)",
    tick:            isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.60)",
    tickMajor:       isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.85)",
    planetBg:        isDark ? "rgba(0,0,0,0.88)" : "var(--color-eggshell)",
  };

  return (
    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <defs>
        {PLANETS.map((p) => (
          <filter key={p.id} id={`glow-${p.id}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feFlood floodColor={p.color} floodOpacity="1" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
        {/* Glow for wheel structure lines */}
        <filter id="glow-lines" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ══ BACKGROUND WHEEL ══ */}
      <g id="bg-wheel" opacity={isDark ? "0.55" : "0.9"}>

        {/* House wedge fills (element-colored) */}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          const signIdx = Math.floor(cusp / 30) % 12;
          const elem = SIGNS[signIdx].elem;
          return (
            <path
              key={`house-wedge-${i}`}
              d={houseSectorPath(cusp, next)}
              fill={HOUSE_ELEM_FILL[elem]}
            />
          );
        })}

        {/* Outer boundary — glowing */}
        <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" filter="url(#glow-lines)" />
        {/* Zodiac inner edge */}
        <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" filter="url(#glow-lines)" />
        {/* Inner sanctum */}
        <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" filter="url(#glow-lines)" />

        {/* Zodiac sectors */}
        {SIGNS.map((s) => {
          const mid = svgXY(s.lon + 15, R.glyphs);
          const divFrom = svgXY(s.lon, R.outer);
          const divTo   = svgXY(s.lon, R.zodiacInner);
          return (
            <g key={s.name}>
              <path
                d={zodiacSectorPath(s.lon)}
                fill={ELEM_FILL[s.elem]}
                stroke={ELEM_STROKE[s.elem]}
                strokeWidth="0.5"
              />
              <g
                transform={`translate(${mid.x - 10}, ${mid.y - 10})`}
                style={{ color: c.glyphFill }}
                filter="url(#glow-lines)"
                dangerouslySetInnerHTML={{ __html: SIGN_PATHS[s.name] }}
              />
              <line
                x1={divFrom.x} y1={divFrom.y} x2={divTo.x} y2={divTo.y}
                stroke={ELEM_STROKE[s.elem]} strokeWidth="1.2"
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
            <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isMajor ? c.tickMajor : c.tick}
              strokeWidth={isMajor ? 1.2 : 0.5} />
          );
        })}

        {/* House cusp lines */}
        {HOUSES.map((cusp, i) => {
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          const from = svgXY(cusp, R.zodiacInner);
          const to   = svgXY(cusp, R.inner);
          return (
            <line key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isAxis ? c.houseAxis : c.houseLine}
              strokeWidth={isAxis ? 2.5 : 1.2}
              strokeDasharray={isAxis ? undefined : "6 4"}
              filter={isAxis ? "url(#glow-lines)" : undefined}
            />
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
              filter="url(#glow-lines)"
              fontWeight="600"
            >
              {label}
            </text>
          );
        })}

        {/* House numbers 1–12 at midpoint of each house */}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          let mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
          const pt = svgXY(mid, R.houseNums);
          return (
            <text key={i} x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="14" fill={c.houseNum}
              fontFamily="var(--font-mono)" fontWeight="600"
            >
              {i + 1}
            </text>
          );
        })}
      </g>

      {/* ══ ASPECT LINES (drawn progressively via GSAP) ══ */}
      <g id="aspect-lines">
        {ALL_ASPECTS.map((asp) => (
          <line
            key={asp.id}
            id={`aspect-${asp.id}`}
            x1={asp.x1} y1={asp.y1}
            x2={asp.x2} y2={asp.y2}
            stroke={asp.color}
            strokeWidth="1.2"
            opacity="0"
            strokeDasharray={asp.length}
            strokeDashoffset={asp.length}
          />
        ))}
      </g>

      {/* ══ PLANET MARKERS (revealed by GSAP on scroll) ══ */}
      {PLANETS.map((p) => {
        const lon = NATAL_LON[p.id];
        const lonAdj = lon + (PLANET_LON_OFFSET[p.id] ?? 0);
        const pt    = svgXY(lonAdj, R.planets);
        const pinPt = svgXY(lon,    R.zodiacInner - 5);
        const deg   = Math.floor(lon % 30);

        return (
          <g key={p.id} id={`planet-${p.id}`} opacity="0" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}>
            {/* Connector from glyph area to zodiac pin */}
            <line
              x1={pt.x} y1={pt.y} x2={pinPt.x} y2={pinPt.y}
              stroke={p.color} strokeWidth="0.8" opacity="0.35"
            />
            {/* Zodiac pin dot */}
            <circle cx={pinPt.x} cy={pinPt.y} r="2.8" fill={p.color} opacity="0.9" />
            {/* Outer glow halo — larger */}
            <circle cx={pt.x} cy={pt.y} r="28" fill={p.color} opacity="0.08" />
            <circle cx={pt.x} cy={pt.y} r="22" fill={p.color} opacity="0.05" />
            {/* Glyph background pill — bigger */}
            <circle cx={pt.x} cy={pt.y} r="20"
              fill={c.planetBg}
              stroke={p.color}
              strokeWidth="1.8"
            />
            {/* Planet glyph — larger */}
            <text
              x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="20" fill={p.color}
              fontFamily="var(--font-secondary)"
              filter={`url(#glow-${p.id})`}
            >
              {p.glyph}
            </text>
            {/* Degree label */}
            <text
              x={pt.x} y={pt.y + 34}
              textAnchor="middle" dominantBaseline="central"
              fontSize="9" fill={p.color}
              fontFamily="var(--font-mono)"
              fontWeight="600"
              opacity="0.9"
            >
              {deg}°
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function NatalMockupPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  // Sync with global data-theme (managed by ThemeToggle in Navbar)
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };

    checkTheme(); // Initial check

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") checkTheme();
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    // BG wheel subtle fade-in on load
    gsap.fromTo("#bg-wheel", { opacity: 0 }, { opacity: 0.6, duration: 2.5, ease: "power2.out" });

    // ── Intro card ──
    const introCard = document.getElementById("intro-card");
    if (introCard) {
      gsap.set(introCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: "#section-intro",
        start: "top 80%",
        onEnter:     () => gsap.to(introCard, { autoAlpha: 1, y: 0,  duration: 0.8, ease: "power3.out" }),
        onLeave:     () => gsap.to(introCard, { autoAlpha: 0, y: -30, duration: 0.4 }),
        onEnterBack: () => gsap.to(introCard, { autoAlpha: 1, y: 0,  duration: 0.6 }),
        onLeaveBack: () => gsap.to(introCard, { autoAlpha: 0, y: 30, duration: 0.4 }),
      });
    }

    // ── Per-planet scroll triggers ──
    PLANETS.forEach((p) => {
      const section = document.getElementById(`section-${p.id}`);
      const card    = document.getElementById(`card-${p.id}`);
      if (!section || !card) return;

      // Aspects belonging to this planet
      const myAspects = ALL_ASPECTS.filter(
        (a) => a.planetA === p.id || a.planetB === p.id
      );

      gsap.set(card, { autoAlpha: 0, y: 50 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 62%",
        end: "bottom 20%",

        onEnter: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          // Reveal planet — scale from 0 with elastic bounce
          gsap.to(`#planet-${p.id}`, {
            opacity: 1, scale: 1,
            duration: 0.9, ease: "back.out(1.7)",
            transformOrigin: "center center",
          });
          // Draw aspect lines
          myAspects.forEach((a, i) => {
            gsap.to(`#aspect-${a.id}`, {
              opacity: 0.55,
              strokeDashoffset: 0,
              duration: 1.4,
              delay: i * 0.08,
              ease: "power3.out",
            });
          });
        },

        onLeave: () => {
          gsap.to(card, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" });
        },

        onEnterBack: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          gsap.to(`#planet-${p.id}`, { opacity: 1, scale: 1, duration: 0.4 });
          myAspects.forEach((a) =>
            gsap.to(`#aspect-${a.id}`, { opacity: 0.55, strokeDashoffset: 0, duration: 0.6 })
          );
        },

        onLeaveBack: () => {
          gsap.to(card, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" });
          // Fade planet out
          gsap.to(`#planet-${p.id}`, { opacity: 0, scale: 0, duration: 0.4, ease: "power2.in" });
          // Retract aspect lines
          myAspects.forEach((a) =>
            gsap.to(`#aspect-${a.id}`, { opacity: 0, strokeDashoffset: a.length, duration: 0.4 })
          );
        },
      });
    });

    // ── Outro card ──
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

      {/* ═══ FIXED BACKGROUND WHEEL ═══ */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: "min(100vh, 820px)", aspectRatio: "1" }}>
          <NatalWheelSVG isDark={isDark} />
        </div>
      </div>

      {/* ═══ NAVBAR ═══ */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-auto">
        <div style={{ background: isDark ? "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)" : "linear-gradient(to bottom, var(--color-eggshell), rgba(248,245,236,0.4), transparent)" }}>
          <Navbar
            activeHref="/mockup-natal"
            centerContent={
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Reading Your Chart · Brandon · Aug 17 1988
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
              Natal Chart
            </div>
            <h1 className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              Your Cosmic<br />Blueprint
            </h1>
            <div
              className="p-6 md:p-8 rounded-[var(--shape-asymmetric-lg)] backdrop-blur-xl max-w-xl mx-auto"
              style={{
                background: isDark ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.70)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <p className="font-body text-base md:text-lg leading-relaxed shadow-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Born in <strong style={{ color: "var(--text-primary)" }}>Jakarta, Indonesia, August 17, 1988</strong>. Your natal chart is a photograph of the heavens at the exact moment you took your first breath. Scroll to unpack each piece of your cosmic DNA.
              </p>
            </div>
          </div>
        </section>

        {/* PLANET SECTIONS */}
        {PLANETS.map((p, i) => {
          const isLeft = i % 2 === 0;
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
                <div
                  className="p-6 md:p-8 rounded-[var(--shape-asymmetric-md)] backdrop-blur-2xl relative overflow-hidden"
                  style={{
                    background: isDark ? "rgba(8,8,8,0.88)" : "rgba(255,255,255,0.82)",
                    border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(27,27,27,0.10)",
                    boxShadow: isDark
                      ? `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${p.color}14`
                      : `0 20px 60px rgba(0,0,0,0.08), 0 0 40px ${p.color}22`,
                  }}
                >
                  {/* Oversized initial watermark */}
                  <span style={{
                    position: "absolute",
                    fontFamily: "var(--font-display-alt-2)",
                    fontSize: "13rem",
                    color: p.color,
                    opacity: 0.06,
                    top: "-15%",
                    right: isLeft ? "-8%" : "auto",
                    left: isLeft ? "auto" : "-8%",
                    pointerEvents: "none",
                    lineHeight: 1,
                    zIndex: 0,
                  }}>
                    {p.planet.charAt(0)}
                  </span>

                  <div className="relative z-10">
                    {/* Planet header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color, boxShadow: `0 0 12px ${p.color}` }}
                      />
                      <h2
                        className="font-primary text-5xl md:text-6xl uppercase tracking-tight leading-none"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {p.planet}
                      </h2>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border"
                        style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
                      >
                        {p.sign}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border"
                        style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
                      >
                        House {p.house}
                      </span>
                      {p.dignity && (
                        <span
                          className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
                          style={{ backgroundColor: p.color, color: "#000", opacity: 0.9 }}
                        >
                          {p.dignity}
                        </span>
                      )}
                    </div>

                    <p className="font-body text-base leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {p.desc}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* OUTRO */}
        <section id="section-outro" className="relative h-screen flex items-center justify-center px-6">
          <div id="outro-card" className="max-w-2xl text-center w-full">
            <div className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--sage)] mb-6 px-4 py-2 border border-[var(--sage)]/30 rounded-full backdrop-blur-md bg-[var(--sage)]/5">
              Chart Complete
            </div>
            <h2 className="font-primary text-5xl md:text-[5.5rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              The Web<br />Is Woven
            </h2>
            <div
              className="p-6 md:p-8 rounded-[var(--shape-organic-1)] border backdrop-blur-2xl max-w-xl mx-auto"
              style={{
                background: isDark ? "rgba(10,10,10,0.9)" : "rgba(255,255,255,0.7)",
                borderColor: "var(--surface-border)",
                boxShadow: isDark ? "0 0 80px rgba(4,86,251,0.15)" : "none",
              }}
            >
              <p className="font-body text-base md:text-lg leading-relaxed mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                Your cosmic blueprint is fully activated. We mapped the exact geometry of your soul using Placidus houses and precise trigonometry — recreating the heavens above Jakarta, Indonesia at the moment of your birth.
              </p>
              <a
                href="/chart?demo=true"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[var(--color-y2k-blue)] text-white font-mono uppercase text-xs font-bold rounded-full hover:opacity-80 transition-all hover:scale-105"
              >
                View Full Chart Analysis
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
