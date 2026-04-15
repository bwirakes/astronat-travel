"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ── Example Chart: Jakarta, August 17, 1988, 10:15 PM WIB ──
// Map: Southeast Asia regional (sea-map-dark.png)
// Projection: lon 92–142°E, lat 25°N to -22°S → SVG 0–1000 × 0–1000

interface AcgLineConfig {
  id: string;
  planet: string;
  angle: string;
  color: string;
  glow: string;
  path: string;
  distance: string;
  importance: "exact" | "major" | "moderate" | "wide";
  // Educational description — explains the concept for a learner
  description: string;
  // What this means in principle
  principle: string;
}

const JAKARTA_X = 285;
const JAKARTA_Y = 638;

const ACG_LINES: AcgLineConfig[] = [
  {
    id: "pluto-dsc",
    planet: "Pluto",
    angle: "DSC",
    color: "var(--color-planet-mars)",
    glow: "rgba(180,40,40,0.7)",
    path: "M 257 -43 L 261 -32 L 264 -21 L 267 -11 L 271 0 L 274 11 L 277 21 L 280 32 L 283 43 L 287 53 L 290 64 L 293 74 L 296 85 L 299 96 L 302 106 L 305 117 L 308 128 L 311 138 L 314 149 L 317 160 L 320 170 L 322 181 L 325 191 L 328 202 L 331 213 L 334 223 L 337 234 L 340 245 L 342 255 L 345 266 L 348 277 L 351 287 L 353 298 L 356 309 L 359 319 L 362 330 L 364 340 L 367 351 L 370 362 L 372 372 L 375 383 L 378 394 L 380 404 L 383 415 L 386 426 L 388 436 L 391 447 L 394 457 L 396 468 L 399 479 L 402 489 L 404 500 L 407 511 L 410 521 L 412 532 L 415 543 L 418 553 L 420 564 L 423 574 L 426 585 L 428 596 L 431 606 L 434 617 L 436 628 L 439 638 L 441 649 L 444 660 L 447 670 L 450 681 L 452 691 L 455 702 L 458 713 L 460 723 L 463 734 L 466 745 L 468 755 L 471 766 L 474 777 L 477 787 L 480 798 L 482 809 L 485 819 L 488 830 L 491 840 L 494 851 L 496 862 L 499 872 L 502 883 L 505 894 L 508 904 L 511 915 L 514 926 L 517 936 L 520 947 L 523 957 L 526 968 L 529 979 L 532 989 L 535 1000 L 538 1011 L 541 1021 L 544 1032 L 548 1043",
    distance: "820 km",
    importance: "major",
    principle: "The Descendant (DSC) governs partnerships, marriage, and the qualities we seek in others. A planet on your DSC line describes a transformative force that shapes your most intimate connections in that region.",
    description: "Pluto's Descendant line is the closest line to Jakarta. It sweeps through eastern Java and Kalimantan. At 820km, this is a major orb — you'd feel it throughout the region. Relationships forged near a Pluto DSC tend to be intensely transformative: deep, powerful bonds that fundamentally reshape who you are.",
  },
  {
    id: "moon-dsc",
    planet: "Moon",
    angle: "DSC",
    color: "var(--color-acqua)",
    glow: "rgba(202,241,240,0.7)",
    path: "M -43 -43 L -41 -32 L -40 -21 L -38 -11 L -36 0 L -34 11 L -33 21 L -31 32 L -29 43 L -28 53 L -26 64 L -24 74 L -23 85 L -21 96 L -20 106 L -18 117 L -16 128 L -15 138 L -13 149 L -12 160 L -10 170 L -9 181 L -7 191 L -6 202 L -4 213 L -3 223 L -1 234 L 0 245 L 2 255 L 3 266 L 5 277 L 6 287 L 8 298 L 9 309 L 11 319 L 12 330 L 14 340 L 15 351 L 16 362 L 18 372 L 19 383 L 21 394 L 22 404 L 24 415 L 25 426 L 26 436 L 28 447 L 29 457 L 31 468 L 32 479 L 33 489 L 35 500 L 36 511 L 38 521 L 39 532 L 40 543 L 42 553 L 43 564 L 45 574 L 46 585 L 47 596 L 49 606 L 50 617 L 52 628 L 53 638 L 55 649 L 56 660 L 57 670 L 59 681 L 60 691 L 62 702 L 63 713 L 65 723 L 66 734 L 67 745 L 69 755 L 70 766 L 72 777 L 73 787 L 75 798 L 76 809 L 78 819 L 79 830 L 81 840 L 82 851 L 84 862 L 85 872 L 87 883 L 88 894 L 90 904 L 91 915 L 93 926 L 95 936 L 96 947 L 98 957 L 99 968 L 101 979 L 102 989 L 104 1000 L 106 1011 L 107 1021 L 109 1032 L 111 1043",
    distance: "1,329 km",
    importance: "moderate",
    principle: "The Moon on the DSC means you attract emotionally intuitive, nurturing partners in this region. People feel like home. The Moon is the fastest-moving personal planet — its DSC line often brings emotionally significant relationship encounters.",
    description: "The Moon DSC sweeps along Sumatra's western coast, entering this map from the left edge. At 1,329km from Jakarta, this is a moderate orb — you'd feel it most strongly in western Sumatra and the Andaman Islands. Relationships here tend to feel instinctual, emotionally safe, and deeply familiar.",
  },
  {
    id: "sun-ic",
    planet: "Sun",
    angle: "IC",
    color: "var(--gold)",
    glow: "rgba(201,169,110,0.8)",
    path: "M 805 0 L 805 1000",
    distance: "2,807 km",
    importance: "wide",
    principle: "The Imum Coeli (IC) is the bottom of the chart — it rules home, private life, emotional foundations, and ancestral roots. A Sun IC line means this longitude is where your core identity feels most grounded as a home base.",
    description: "The Sun IC line falls at 132°E running vertically through the Maluku Islands and Papua. The IC is your deepest private self and roots. At 2,807km east of Jakarta, it's a wide influence — you'd need to travel to Ambon or Jayapura to feel it operating fully. Note how this line is vertical (a meridian), unlike the curved DSC lines.",
  },
  {
    id: "jupiter-asc",
    planet: "Jupiter",
    angle: "ASC",
    color: "var(--sage)",
    glow: "rgba(0,253,0,0.6)",
    path: "M 673 -43 L 678 -32 L 683 -21 L 688 -11 L 692 0 L 697 11 L 702 21 L 706 32 L 711 43 L 716 53 L 720 64 L 725 74 L 729 85 L 733 96 L 738 106 L 742 117 L 746 128 L 751 138 L 755 149 L 759 160 L 763 170 L 768 181 L 772 191 L 776 202 L 780 213 L 784 223 L 788 234 L 792 245 L 796 255 L 800 266 L 805 277 L 809 287 L 812 298 L 816 309 L 820 319 L 824 330 L 828 340 L 832 351 L 836 362 L 840 372 L 844 383 L 848 394 L 852 404 L 856 415 L 859 426 L 863 436 L 867 447 L 871 457 L 875 468 L 879 479 L 882 489 L 886 500 L 890 511 L 894 521 L 898 532 L 902 543 L 905 553 L 909 564 L 913 574 L 917 585 L 921 596 L 925 606 L 928 617 L 932 628 L 936 638 L 940 649 L 944 660 L 948 670 L 952 681 L 955 691 L 959 702 L 963 713 L 967 723 L 971 734 L 975 745 L 979 755 L 983 766 L 987 777 L 991 787 L 995 798 L 999 809 L 1003 819 L 1007 830 L 1011 840 L 1015 851 L 1019 862 L 1024 872 L 1028 883 L 1032 894 L 1036 904 L 1040 915 L 1045 926 L 1049 936 L 1053 947 L 1058 957",
    distance: "3,584 km",
    importance: "wide",
    principle: "The Ascendant (ASC) line is the most personally felt in astrocartography. It governs your identity, body, and first impressions. Jupiter on the ASC is the most celebrated line in the field — it radiates expansion, luck, magnetism, and generosity wherever you go.",
    description: "Jupiter's ASC curve sweeps through Papua and the far eastern archipelago. At 3,584km from Jakarta this is a distant influence. To feel Jupiter ASC's full blessing — the sense of being larger-than-life, magnetic, and endlessly welcome — you'd need to travel to Papua, the northern Moluccas, or northern Australia.",
  },
];

const IMPORTANCE_STYLES: Record<string, { bg: string; label: string }> = {
  exact:    { bg: "bg-white text-black font-bold",                             label: "EXACT ORB · <200km" },
  major:    { bg: "bg-[var(--color-y2k-blue)] text-white",                     label: "MAJOR ORB · <1000km" },
  moderate: { bg: "bg-white/10 text-white border border-white/30",             label: "MODERATE ORB · <2000km" },
  wide:     { bg: "bg-white/5 text-white/60 border border-white/10",           label: "WIDE ORB · >2000km" },
};

const ANGLE_LEGEND = [
  { id: "ASC", label: "Ascendant", desc: "Identity & Physical Self", style: "solid" },
  { id: "MC",  label: "Midheaven", desc: "Career & Public Legacy",   style: "solid" },
  { id: "DSC", label: "Descendant", desc: "Partnerships & Others",   style: "dashed" },
  { id: "IC",  label: "Imum Coeli", desc: "Home & Inner Roots",      style: "dashed" },
];

export default function AcgLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    lineRefs.current.forEach((path) => {
      if (!path) return;
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    });

    ACG_LINES.forEach((line, i) => {
      const sectionEl = document.getElementById(`section-${line.id}`);
      const cardEl = document.getElementById(`card-${line.id}`);
      const pathEl = lineRefs.current[i];
      if (!sectionEl || !cardEl || !pathEl) return;
      const len = pathEl.getTotalLength();

      ScrollTrigger.create({
        trigger: sectionEl,
        start: "top 90%",
        end: "top 30%",
        scrub: 1,
        animation: gsap.fromTo(pathEl,
          { strokeDashoffset: len, opacity: 0 },
          { strokeDashoffset: 0, opacity: 1, ease: "none" }
        ),
      });

      gsap.set(cardEl, { autoAlpha: 0, y: 50 });
      ScrollTrigger.create({
        trigger: sectionEl,
        start: "top 70%",
        end: "bottom 30%",
        onEnter:     () => gsap.to(cardEl, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }),
        onLeave:     () => gsap.to(cardEl, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" }),
        onEnterBack: () => gsap.to(cardEl, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }),
        onLeaveBack: () => gsap.to(cardEl, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" }),
      });
    });

    const introCard = document.getElementById("intro-card");
    if (introCard) {
      gsap.set(introCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: "#section-intro",
        start: "top 80%",
        end: "bottom 20%",
        onEnter:     () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }),
        onLeave:     () => gsap.to(introCard, { autoAlpha: 0, y: -30, duration: 0.4 }),
        onEnterBack: () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.6 }),
        onLeaveBack: () => gsap.to(introCard, { autoAlpha: 0, y: 30, duration: 0.4 }),
      });
    }

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
    <div ref={wrapperRef} className="relative bg-[var(--color-black)] overflow-hidden">

      {/* Fixed Background Map */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/sea-map-dark.png"
          alt="Southeast Asia dark cartography — educational example"
          fill
          className={`object-cover transition-all duration-700 ${isMobile ? "object-left" : "object-center"}`}
          priority
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* SVG line layer */}
        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none transition-all duration-700"
          preserveAspectRatio={isMobile ? "xMinYMid slice" : "xMidYMid slice"}
        >
          {/* Birth city pin */}
          <circle cx={JAKARTA_X} cy={JAKARTA_Y} r="6" fill="var(--color-y2k-blue)" opacity="0.9" />
          <circle cx={JAKARTA_X} cy={JAKARTA_Y} r="12" fill="none" stroke="var(--color-y2k-blue)" strokeWidth="1.5" opacity="0.4">
            <animate attributeName="r" from="12" to="30" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x={JAKARTA_X + 15} y={JAKARTA_Y - 4} fill="var(--color-y2k-blue)" fontSize="13" fontFamily="var(--font-mono)" fontWeight="bold" letterSpacing="0.1em">
            JAKARTA
          </text>

          {/* ACG Lines */}
          {ACG_LINES.map((line, i) => (
            <path
              key={line.id}
              ref={(el) => { lineRefs.current[i] = el; }}
              d={line.path}
              fill="none"
              stroke={line.color}
              strokeWidth={line.importance === "exact" ? 4 : line.importance === "major" ? 3 : 2.5}
              strokeLinecap="round"
              strokeDasharray={line.angle === "IC" || line.angle === "DSC" ? "12 6" : "none"}
              opacity="0"
              style={{ filter: `drop-shadow(0 0 10px ${line.glow})` }}
            />
          ))}
        </svg>
      </div>

      {/* Navbar — standard */}
      <Navbar activeHref="/learn" />

      {/* Scrollable Content */}
      <div className="relative z-20">

        {/* INTRO */}
        <section id="section-intro" className="relative h-screen flex items-center justify-center px-6 pt-24">
          <div id="intro-card" className="max-w-2xl text-center">
            <div className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/40 mb-6 px-4 py-2 border border-white/15 rounded-full backdrop-blur-md bg-black/30">
              Astrocartography 101
            </div>
            <h1
              className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8 text-white"
              style={{ textShadow: "0 4px 40px rgba(0,0,0,0.8)" }}
            >
              Reading<br />Your Map
            </h1>
            <div className="p-6 md:p-8 rounded-[var(--shape-asymmetric-lg)] bg-black/60 border border-white/10 backdrop-blur-xl max-w-xl mx-auto">
              <p className="font-body text-base md:text-lg text-white/80 leading-relaxed mb-6">
                Astrocartography relocates your birth chart across the surface of the Earth. Every planet draws a line. Every line crosses a city. And depending on which planet crosses which angle — identity, partnership, career, or home — that city changes you in a specific, predictable way. Here's how it works, traced through one chart: a person born in Jakarta, August 17, 1988.
              </p>
              {/* Angle Legend */}
              <div className="border-t border-white/10 pt-5">
                <div className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-3">The Four Angles</div>
                <div className="grid grid-cols-2 gap-3">
                  {ANGLE_LEGEND.map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      <svg width="28" height="10" viewBox="0 0 28 10">
                        <line x1="0" y1="5" x2="28" y2="5" stroke="white" strokeWidth="1.5" strokeDasharray={a.style === "dashed" ? "4 3" : "none"} opacity="0.5" />
                      </svg>
                      <div>
                        <div className="font-mono text-[10px] text-white/70 font-bold">{a.id}</div>
                        <div className="font-mono text-[8px] text-white/30 uppercase">{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider mt-4">
                {ACG_LINES.length} planetary lines · Distance from Jakarta · Orb ratings
              </p>
            </div>
          </div>
        </section>

        {/* LINE SECTIONS */}
        {ACG_LINES.map((line, i) => {
          const imp = IMPORTANCE_STYLES[line.importance];
          const isLeft = i % 2 === 0;

          return (
            <section
              key={line.id}
              id={`section-${line.id}`}
              className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 py-20"
            >
              <div id={`card-${line.id}`} className={`w-full max-w-lg ${isLeft ? "mr-auto" : "ml-auto"}`}>
                <div className="p-6 md:p-8 rounded-[var(--shape-asymmetric-md)] bg-black/70 border border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">

                  {/* Planet name + angle */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: line.color, boxShadow: `0 0 12px ${line.glow}` }} />
                    <h2 className="font-primary text-4xl md:text-5xl uppercase tracking-tight text-white leading-none">{line.planet}</h2>
                    <span className="font-mono text-sm uppercase tracking-wider px-3 py-1 rounded-md border" style={{ color: line.color, borderColor: line.color }}>
                      {line.angle}
                    </span>
                  </div>

                  {/* Angle definition */}
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-4">
                    {line.angle === "MC"  && "Midheaven — Career, Public Visibility, Legacy"}
                    {line.angle === "IC"  && "Imum Coeli — Home, Roots, Inner Foundation"}
                    {line.angle === "ASC" && "Ascendant — Identity, Physical Self, First Impressions"}
                    {line.angle === "DSC" && "Descendant — Partnerships, Marriage, Others"}
                  </div>

                  {/* Principle callout */}
                  <div className="mb-4 pl-3 border-l-2" style={{ borderColor: line.color }}>
                    <p className="font-body text-xs text-white/50 italic leading-relaxed">{line.principle}</p>
                  </div>

                  <p className="font-body text-sm md:text-base text-white/80 leading-relaxed mb-5">
                    {line.description}
                  </p>

                  {/* Distance + Importance */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md ${imp.bg}`}>
                      {imp.label}
                    </span>
                    <span className="font-mono text-sm text-white/90 tracking-wider">
                      Distance: <strong style={{ color: line.color }}>{line.distance}</strong>
                    </span>
                  </div>

                  {/* Line type legend */}
                  <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                    <svg width="40" height="12" viewBox="0 0 40 12" className="shrink-0">
                      {(line.angle === "MC" || line.angle === "IC") ? (
                        <line x1="0" y1="6" x2="40" y2="6" stroke={line.color} strokeWidth="2.5" strokeDasharray={line.angle === "IC" ? "6 4" : "none"} />
                      ) : (
                        <path d="M0 10 C10 2, 30 2, 40 10" fill="none" stroke={line.color} strokeWidth="2.5" strokeDasharray={line.angle === "DSC" ? "4 3" : "none"} />
                      )}
                    </svg>
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      {(line.angle === "MC" || line.angle === "IC") ? "Vertical meridian" : "Curved latitude-dependent"}
                      {(line.angle === "IC" || line.angle === "DSC") && " (dashed)"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* OUTRO */}
        <section id="section-outro" className="relative h-screen flex items-center justify-center px-6">
          <div id="outro-card" className="max-w-2xl text-center">
            <h2
              className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8 text-white"
              style={{ textShadow: "0 4px 40px rgba(0,0,0,0.8)" }}
            >
              The Map<br />Is Yours
            </h2>
            <div className="p-6 md:p-8 rounded-[var(--shape-asymmetric-lg)] bg-black/70 border border-[var(--color-y2k-blue)]/30 backdrop-blur-xl max-w-xl mx-auto">
              <p className="font-body text-base md:text-lg text-white/80 leading-relaxed mb-4">
                In a real reading, all 40+ lines (10 planets × 4 angles) are computed across the entire globe. Haversine distances to any destination are calculated, active transits factored in, and a comprehensive travel intelligence report is generated.
              </p>
              <p className="font-body text-sm text-white/50 leading-relaxed mb-6">
                The next topic explores a related system — Geodetic Astrology — which does not use a personal birth chart at all, but instead maps the zodiac directly onto the Earth's longitude.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 px-6 py-3 border font-mono uppercase text-sm font-bold rounded-full hover:opacity-70 transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}
                >
                  ← Back to Learn
                </Link>
                <Link
                  href="/learn/geodetic-astrology"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-y2k-blue)] text-white font-mono uppercase text-sm font-bold rounded-full hover:opacity-80 transition-all hover:scale-105"
                >
                  Next: Geodetic Astrology →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
