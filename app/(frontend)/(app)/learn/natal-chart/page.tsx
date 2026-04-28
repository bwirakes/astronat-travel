"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header-context";
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ASC = 32.64;
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
// EXAMPLE BIRTH DATA — Jakarta, Aug 17 1988 — Educational Reference
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

const HOUSE_ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.18)",
  earth: "rgba(201,169,110,0.17)",
  air:   "rgba(202,241,240,0.17)",
  water: "rgba(0,253,0,0.12)",
};

// ═══════════════════════════════════════════════════════════════
// EDUCATIONAL PLANET DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const PLANETS = [
  {
    id: "sun", glyph: "☉", planet: "The Sun", sign: "Leo", house: 4,
    dignity: "DOMICILE", color: "#C9A96E",
    keyword: "Identity & Purpose",
    desc: "The Sun is your central identity — the throughline of every choice you make. It describes who you are when you're not performing for anyone. In Leo, its natural home, the Sun burns bright and creative; it needs an audience and finds its purpose through self-expression. Placed in the 4th house, that radiance turns inward: identity and purpose are built from private life, family roots, and the concept of home.",
  },
  {
    id: "moon", glyph: "☽", planet: "The Moon", sign: "Libra", house: 6,
    dignity: null, color: "#CAF1F0",
    keyword: "Emotions & Instinct",
    desc: "Your Moon is what you need to feel safe — before logic, before reason, before you know why. It's the part of you that reacts before you decide. In Libra, safety comes through harmony: conflict feels physically uncomfortable, and beauty in the environment is not a luxury but a necessity. In the 6th house, emotional equilibrium is tied directly to daily rhythm — when routines break down, the inner world follows.",
  },
  {
    id: "mercury", glyph: "☿", planet: "Mercury", sign: "Virgo", house: 5,
    dignity: "DOMICILE", color: "#0456fb",
    keyword: "Mind & Communication",
    desc: "Mercury is your mind's operating system — how you take in information, sort it, and send it back out. In Virgo, its home sign, Mercury is a precision instrument: analytical, methodical, attuned to what's out of place. The weakness is over-analysis; the gift is accuracy. Placed in the 5th house, this sharp mind finds its fullest expression through creative work, play, and the art of making something.",
  },
  {
    id: "venus", glyph: "♀", planet: "Venus", sign: "Cancer", house: 3,
    dignity: null, color: "#E67A7A",
    keyword: "Love & Beauty",
    desc: "Venus is the sensation of walking into a room and immediately feeling welcome. She is the principle of magnetic attraction — what you love, how you love it, and what you believe you deserve to receive. In Cancer, Venus gives love through nurturing and needs emotional safety as the price of entry. In the 3rd house, the love language is words: texts, conversations, the precise phrase that shows someone they've been heard.",
  },
  {
    id: "mars", glyph: "♂", planet: "Mars", sign: "Aries", house: 12,
    dignity: "DOMICILE", color: "#D32F2F",
    keyword: "Drive & Ambition",
    desc: "Mars is your engine — it determines how you pursue what you want and how you fight when something is in your way. In Aries, its home sign, Mars is immediate, fierce, and doesn't deliberate. It acts first. Placed in the 12th house, that power goes underground: the drive is intense, but operates in private. Spiritual motivation, solitary ambition, energy that charges in the dark and delivers when least expected.",
  },
  {
    id: "jupiter", glyph: "♃", planet: "Jupiter", sign: "Gemini", house: 1,
    dignity: "DETRIMENT", color: "#00FD00",
    keyword: "Expansion & Luck",
    desc: "Jupiter is expansion — the planet that says yes and means it. Whatever it touches, it multiples. In Gemini (a challenging placement), Jupiter's abundance scatters: dozens of interests, all genuinely fascinating, none quite completed. The gift is breadth of mind; the growth edge is depth. Placed in the 1st house, this Jupiterian expansiveness is the first thing other people notice — a largeness of presence that makes rooms feel bigger.",
  },
  {
    id: "saturn", glyph: "♄", planet: "Saturn", sign: "Sagittarius", house: 8,
    dignity: null, color: "#909090",
    keyword: "Structure & Karma",
    desc: "Saturn is where you earned everything the hard way. This planet doesn't give — it teaches by withholding until you've proven you understand the lesson. Whatever house Saturn occupies is a department of life that felt slow, difficult, even unfair early on. Come back to it at 30. At 45. The mastery there will be real, because you built it without shortcuts. In Sagittarius, the lesson is philosophical: beliefs must be tested, not inherited. In the 8th house, nothing shared — money, intimacy, power — comes without consequence and accountability.",
  },
  {
    id: "uranus", glyph: "♅", planet: "Uranus", sign: "Sagittarius", house: 8,
    dignity: null, color: "#CAF1F0",
    keyword: "Revolution & Awakening",
    desc: "Uranus is the planet of sudden rupture — the event you didn't see coming that ends up being the most important thing that ever happened to you. It governs liberation, innovation, and the breaking of what no longer serves. As a generational planet, it moves slowly, marking the rebellious spirit of an entire era. Conjunct Saturn in the 8th house, Uranus creates sudden awakenings in the deepest territory: shared resources, psychological transformation, and the places where old power structures must break to let something genuinely new through.",
  },
  {
    id: "neptune", glyph: "♆", planet: "Neptune", sign: "Capricorn", house: 9,
    dignity: null, color: "#CAF1F0",
    keyword: "Intuition & Dreams",
    desc: "Neptune dissolves edges — between self and other, between what's real and what's imagined, between the individual and the divine. It governs spirituality, dreams, and the ache for transcendence that reason can never fully satisfy. As a generational planet, it moves through signs in 14-year arcs, marking the collective longing of an entire generation. In Capricorn, Neptune spiritualizes ambition — success is not just material but meaningful. In the 9th house, faith, philosophy, and long-distance travel all carry a quality of mystical searching.",
  },
  {
    id: "pluto", glyph: "♇", planet: "Pluto", sign: "Scorpio", house: 7,
    dignity: "DOMICILE", color: "#8E24AA",
    keyword: "Transformation & Power",
    desc: "Pluto is the planet that is changing the things you can't see yet. It rules the deep unconscious — the drives so old and automatic that you mistake them for personality. It governs power, obsession, death, and the rebirth that only comes after something has been completely dismantled. In Scorpio, its home sign, Pluto operates at total psychological intensity: nothing is surface, everything is excavation. In the 7th house, this force concentrates entirely in partnerships — the transformative, once-in-a-lifetime bonds that alter who you become.",
  },
];

const PLANET_LON_OFFSET: Record<string, number> = {
  saturn: -2.5,
  uranus:  2.5,
};

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
  const p1 = svgXY(signLon,      R.outer);
  const p2 = svgXY(signLon + 30, R.outer);
  const p3 = svgXY(signLon + 30, R.zodiacInner);
  const p4 = svgXY(signLon,      R.zodiacInner);
  return [`M ${p1.x} ${p1.y}`, `A ${R.outer} ${R.outer} 0 0 0 ${p2.x} ${p2.y}`, `L ${p3.x} ${p3.y}`, `A ${R.zodiacInner} ${R.zodiacInner} 0 0 1 ${p4.x} ${p4.y}`, `Z`].join(" ");
}

function houseSectorPath(cusp1: number, cusp2: number): string {
  const spanDeg = ((cusp2 - cusp1) + 360) % 360;
  const largeArc = spanDeg > 180 ? 1 : 0;
  const p1 = svgXY(cusp1, R.zodiacInner);
  const p2 = svgXY(cusp2, R.zodiacInner);
  const p3 = svgXY(cusp2, R.inner);
  const p4 = svgXY(cusp1, R.inner);
  return [`M ${p1.x} ${p1.y}`, `A ${R.zodiacInner} ${R.zodiacInner} 0 ${largeArc} 0 ${p2.x} ${p2.y}`, `L ${p3.x} ${p3.y}`, `A ${R.inner} ${R.inner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`, `Z`].join(" ");
}

// ═══════════════════════════════════════════════════════════════
// ASPECT COMPUTATION
// ═══════════════════════════════════════════════════════════════

interface AspectEntry {
  id: string; planetA: string; planetB: string;
  type: string; color: string;
  x1: number; y1: number; x2: number; y2: number;
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
// NATAL WHEEL SVG
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
      <PageHeader backTo="/learn" backLabel="Academy" />
      <defs>
        {PLANETS.map((p) => (
          <filter key={p.id} id={`glow-${p.id}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feFlood floodColor={p.color} floodOpacity="1" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        <filter id="glow-lines" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g id="bg-wheel" opacity={isDark ? "0.55" : "0.9"}>
        {/* House wedge fills */}
        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          const signIdx = Math.floor(cusp / 30) % 12;
          const elem = SIGNS[signIdx].elem;
          return <path key={`hw-${i}`} d={houseSectorPath(cusp, next)} fill={HOUSE_ELEM_FILL[elem]} />;
        })}

        <circle cx={CX} cy={CY} r={R.outer} fill="none" stroke={c.circlePrimary} strokeWidth="1.8" filter="url(#glow-lines)" />
        <circle cx={CX} cy={CY} r={R.zodiacInner} fill="none" stroke={c.circleSecondary} strokeWidth="1.2" filter="url(#glow-lines)" />
        <circle cx={CX} cy={CY} r={R.inner} fill="none" stroke={c.circleInner} strokeWidth="1" filter="url(#glow-lines)" />

        {SIGNS.map((s) => {
          const mid = svgXY(s.lon + 15, R.glyphs);
          const divFrom = svgXY(s.lon, R.outer);
          const divTo   = svgXY(s.lon, R.zodiacInner);
          return (
            <g key={s.name}>
              <path d={zodiacSectorPath(s.lon)} fill={ELEM_FILL[s.elem]} stroke={ELEM_STROKE[s.elem]} strokeWidth="0.5" />
              <g transform={`translate(${mid.x - 10}, ${mid.y - 10})`} style={{ color: c.glyphFill }} filter="url(#glow-lines)" dangerouslySetInnerHTML={{ __html: SIGN_PATHS[s.name] }} />
              <line x1={divFrom.x} y1={divFrom.y} x2={divTo.x} y2={divTo.y} stroke={ELEM_STROKE[s.elem]} strokeWidth="1.2" />
            </g>
          );
        })}

        {Array.from({ length: 72 }, (_, i) => {
          const lon = i * 5;
          const isMajor = lon % 30 === 0;
          const innerR = R.outer - (isMajor ? 11 : 5);
          const from = svgXY(lon, R.outer);
          const to   = svgXY(lon, innerR);
          return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={isMajor ? c.tickMajor : c.tick} strokeWidth={isMajor ? 1.2 : 0.5} />;
        })}

        {HOUSES.map((cusp, i) => {
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          const from = svgXY(cusp, R.zodiacInner);
          const to   = svgXY(cusp, R.inner);
          return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={isAxis ? c.houseAxis : c.houseLine} strokeWidth={isAxis ? 2.5 : 1.2} strokeDasharray={isAxis ? undefined : "6 4"} filter={isAxis ? "url(#glow-lines)" : undefined} />;
        })}

        {([{ label: "ASC", idx: 0 }, { label: "DSC", idx: 6 }, { label: "MC", idx: 9 }, { label: "IC", idx: 3 }] as const).map(({ label, idx }) => {
          const pt = svgXY(HOUSES[idx], R.zodiacInner - 24);
          return <text key={label} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="11" fill={c.axisLabel} fontFamily="var(--font-mono)" letterSpacing="2" filter="url(#glow-lines)" fontWeight="600">{label}</text>;
        })}

        {HOUSES.map((cusp, i) => {
          const next = HOUSES[(i + 1) % 12];
          let mid = next >= cusp ? (cusp + next) / 2 : ((cusp + next + 360) / 2) % 360;
          const pt = svgXY(mid, R.houseNums);
          return <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="14" fill={c.houseNum} fontFamily="var(--font-mono)" fontWeight="600">{i + 1}</text>;
        })}
      </g>

      {/* Aspect lines */}
      <g id="aspect-lines">
        {ALL_ASPECTS.map((asp) => (
          <line key={asp.id} id={`aspect-${asp.id}`} x1={asp.x1} y1={asp.y1} x2={asp.x2} y2={asp.y2} stroke={asp.color} strokeWidth="1.2" opacity="0" strokeDasharray={asp.length} strokeDashoffset={asp.length} />
        ))}
      </g>

      {/* Planet markers */}
      {PLANETS.map((p) => {
        const lon = NATAL_LON[p.id];
        const lonAdj = lon + (PLANET_LON_OFFSET[p.id] ?? 0);
        const pt    = svgXY(lonAdj, R.planets);
        const pinPt = svgXY(lon, R.zodiacInner - 5);
        const deg   = Math.floor(lon % 30);
        return (
          <g key={p.id} id={`planet-${p.id}`} opacity="0" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}>
            <line x1={pt.x} y1={pt.y} x2={pinPt.x} y2={pinPt.y} stroke={p.color} strokeWidth="0.8" opacity="0.35" />
            <circle cx={pinPt.x} cy={pinPt.y} r="2.8" fill={p.color} opacity="0.9" />
            <circle cx={pt.x} cy={pt.y} r="28" fill={p.color} opacity="0.08" />
            <circle cx={pt.x} cy={pt.y} r="22" fill={p.color} opacity="0.05" />
            <circle cx={pt.x} cy={pt.y} r="20" fill={c.planetBg} stroke={p.color} strokeWidth="1.8" />
            <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize="20" fill={p.color} fontFamily="var(--font-secondary)" filter={`url(#glow-${p.id})`}>{p.glyph}</text>
            <text x={pt.x} y={pt.y + 34} textAnchor="middle" dominantBaseline="central" fontSize="9" fill={p.color} fontFamily="var(--font-mono)" fontWeight="600" opacity="0.9">{deg}°</text>
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function NatalLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };
    checkTheme();
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    gsap.fromTo("#bg-wheel", { opacity: 0 }, { opacity: 0.6, duration: 2.5, ease: "power2.out" });

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

    PLANETS.forEach((p) => {
      const section = document.getElementById(`section-${p.id}`);
      const card    = document.getElementById(`card-${p.id}`);
      if (!section || !card) return;

      const myAspects = ALL_ASPECTS.filter((a) => a.planetA === p.id || a.planetB === p.id);
      gsap.set(card, { autoAlpha: 0, y: 50 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 62%",
        end: "bottom 20%",
        onEnter: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          gsap.to(`#planet-${p.id}`, { opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.7)", transformOrigin: "center center" });
          myAspects.forEach((a, i) => {
            gsap.to(`#aspect-${a.id}`, { opacity: 0.55, strokeDashoffset: 0, duration: 1.4, delay: i * 0.08, ease: "power3.out" });
          });
        },
        onLeave:     () => gsap.to(card, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" }),
        onEnterBack: () => {
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
          gsap.to(`#planet-${p.id}`, { opacity: 1, scale: 1, duration: 0.4 });
          myAspects.forEach((a) => gsap.to(`#aspect-${a.id}`, { opacity: 0.55, strokeDashoffset: 0, duration: 0.6 }));
        },
        onLeaveBack: () => {
          gsap.to(card, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" });
          gsap.to(`#planet-${p.id}`, { opacity: 0, scale: 0, duration: 0.4, ease: "power2.in" });
          myAspects.forEach((a) => gsap.to(`#aspect-${a.id}`, { opacity: 0, strokeDashoffset: a.length, duration: 0.4 }));
        },
      });
    });

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
      {/* Fixed Background Wheel */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: "min(100vh, 820px)", aspectRatio: "1" }}>
          <NatalWheelSVG isDark={isDark} />
        </div>
      </div>
      {/* Scrolling Content */}
      <div className="relative z-20">

        {/* INTRO */}
        <section id="section-intro" className="relative h-screen flex items-center justify-center px-6 pt-24">
          <div id="intro-card" className="max-w-2xl text-center">
            <div className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-6 px-4 py-2 border border-[var(--color-y2k-blue)]/30 rounded-full backdrop-blur-md bg-white/5">
              Astrology 101 · Natal Charts
            </div>
            <h1
              className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              The Cosmic<br />Blueprint
            </h1>
            <div
              className="p-6 md:p-8 rounded-[var(--shape-asymmetric-lg)] backdrop-blur-xl max-w-xl mx-auto"
              style={{
                background: isDark ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.70)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <p className="font-body text-base md:text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your natal chart is a photograph of the sky taken the moment you were born. It doesn't predict your fate — it describes your <strong style={{ color: "var(--text-primary)" }}>raw material</strong>. Below, an example chart from Jakarta, August 17 1988 — scroll through each planet to learn what it governs, how the sign colors it, and which house of life it operates in.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {[{ label: "Trine", color: "#00FD00" }, { label: "Square", color: "#E67A7A" }, { label: "Opposition", color: "#888888" }, { label: "Conjunction", color: "#0456fb" }].map(asp => (
                  <div key={asp.label} className="flex items-center gap-1.5">
                    <div className="w-6 h-px" style={{ backgroundColor: asp.color }} />
                    <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>{asp.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PLANET SECTIONS */}
        {PLANETS.map((p, i) => {
          const isLeft = i % 2 === 0;
          return (
            <section key={p.id} id={`section-${p.id}`} className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20">
              <div id={`card-${p.id}`} className={`w-full max-w-lg ${isLeft ? "mr-auto" : "ml-auto"}`}>
                <div
                  className="p-6 md:p-8 rounded-[var(--shape-asymmetric-md)] backdrop-blur-2xl relative overflow-hidden"
                  style={{
                    background: isDark ? "rgba(8,8,8,0.88)" : "rgba(255,255,255,0.82)",
                    border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(27,27,27,0.10)",
                    boxShadow: isDark ? `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${p.color}14` : `0 20px 60px rgba(0,0,0,0.08), 0 0 40px ${p.color}22`,
                  }}
                >
                  {/* Decorative watermark */}
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
                    {p.planet.replace("The ", "").charAt(0)}
                  </span>

                  <div className="relative z-10">
                    {/* Kicker */}
                    <div className="font-mono text-[9px] uppercase tracking-[0.25em] mb-3" style={{ color: p.color }}>{p.keyword}</div>

                    {/* Planet name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 12px ${p.color}` }} />
                      <h2 className="font-primary text-5xl md:text-6xl uppercase tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
                        {p.planet}
                      </h2>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border" style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}>
                        {p.sign}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border" style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}>
                        House {p.house}
                      </span>
                      {p.dignity && (
                        <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: p.color, color: isDark ? "#000" : "#fff", opacity: 0.9 }}>
                          {p.dignity}
                        </span>
                      )}
                    </div>

                    <p className="font-body text-sm md:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
              10 Planets Mapped
            </div>
            <h2
              className="font-primary text-5xl md:text-[5.5rem] leading-[0.85] tracking-tight uppercase mb-8"
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
              <p className="font-body text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
                Every planetary position, sign, and house placement interlocks. The aspect lines you've seen are the conversation — the areas where different parts of the psyche speak to each other. No planet is an island.
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
