"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// ── Birth Data: Jakarta, August 17, 1988, 10:15 PM WIB (15:15 UTC) ──────
// Verified via astro engine API at http://139.59.112.132
// Natal planets: Sun 144.92° Leo, Moon 200.48° Libra, Venus 99.26° Cancer,
// Mars 10.91° Aries, Jupiter 63.85° Gemini, Saturn 266.06° Sag,
// Neptune 277.69° Cap, Pluto 219.99° Scorpio
// GMST=194.96°, RAMC=301.81°

interface AcgLineConfig {
  id: string;
  planet: string;
  angle: string;
  color: string;
  glow: string;
  path: string;
  distance: string;
  importance: "exact" | "major" | "moderate" | "wide";
  description: string;
}

// ── Map Projection (calibrated from sea-map-dark.png visual landmarks) ───
// Image shows: Sumatra west coast ~92°E (left), Papua ~142°E (right)
//              Thailand/Vietnam ~25°N (top), N. Australia ~-22°S (bottom)
// Formula: x = ((lon - 92) / 50) * 1000
//          y = ((25  - lat) / 47) * 1000
// Cross-checks:
//   Jakarta  (106.845°E, -6.208°S) → SVG (297, 664) ✓ on NW Java coast
//   Singapore (103.8°E,   1.35°N)  → SVG (236, 503) ✓ at tip of peninsular
//   Manila   (120.98°E,  14.6°N)   → SVG (580, 221) ✓ Philippines
//   Darwin   (130.8°E,  -12.4°S)   → SVG (776, 796) ✓ N. Australia

const JAKARTA_X = 285;
const JAKARTA_Y = 638;

// ── ACG Lines — systematically computed ─────────────────────────
// Birth: Jakarta 106.845°E, -6.208°S | Aug 17 1988 15:15 UTC
// Verified via astro engine API at http://139.59.112.132
// Map projection: lon 92–142°E, lat 25°N to -22°S → SVG 0–1000 × 0–1000
//
// Lines visible in map window, sorted by distance from Jakarta:
//   1. Pluto  DSC  820km  lon=114.26°E  curve
//   2. Moon   DSC  1328km lon=94.83°E   curve (enters from left)
//   3. Sun    IC   2807km lon=132.24°E  vertical
//   4. Jupiter ASC 3584km lon=139.27°E  curve (far right)

const ACG_LINES: AcgLineConfig[] = [
  {
    id: "pluto-dsc",
    planet: "Pluto",
    angle: "DSC",
    color: "var(--color-planet-mars)",
    glow: "rgba(180,40,40,0.7)",
    // Pluto DSC — crosses 114.26°E (svgX=445) at Jakarta latitude.
    // Projection: x=((lon-92)/50)*1000, y=((25-lat)/47)*1000
    path: "M 257 -43 L 261 -32 L 264 -21 L 267 -11 L 271 0 L 274 11 L 277 21 L 280 32 L 283 43 L 287 53 L 290 64 L 293 74 L 296 85 L 299 96 L 302 106 L 305 117 L 308 128 L 311 138 L 314 149 L 317 160 L 320 170 L 322 181 L 325 191 L 328 202 L 331 213 L 334 223 L 337 234 L 340 245 L 342 255 L 345 266 L 348 277 L 351 287 L 353 298 L 356 309 L 359 319 L 362 330 L 364 340 L 367 351 L 370 362 L 372 372 L 375 383 L 378 394 L 380 404 L 383 415 L 386 426 L 388 436 L 391 447 L 394 457 L 396 468 L 399 479 L 402 489 L 404 500 L 407 511 L 410 521 L 412 532 L 415 543 L 418 553 L 420 564 L 423 574 L 426 585 L 428 596 L 431 606 L 434 617 L 436 628 L 439 638 L 441 649 L 444 660 L 447 670 L 450 681 L 452 691 L 455 702 L 458 713 L 460 723 L 463 734 L 466 745 L 468 755 L 471 766 L 474 777 L 477 787 L 480 798 L 482 809 L 485 819 L 488 830 L 491 840 L 494 851 L 496 862 L 499 872 L 502 883 L 505 894 L 508 904 L 511 915 L 514 926 L 517 936 L 520 947 L 523 957 L 526 968 L 529 979 L 532 989 L 535 1000 L 538 1011 L 541 1021 L 544 1032 L 548 1043",
    distance: "820 km",
    importance: "major",
    description:
      "Pluto's Descendant line is the closest ACG line to Jakarta on this map — it sweeps through eastern Java and Kalimantan. The Descendant governs partnerships, attraction, and who you draw into your life. Pluto here means your relationships in this region are intensely transformative: deep, sometimes obsessive bonds that fundamentally reshape who you are. At 820km, this is within the major orb.",
  },
  {
    id: "moon-dsc",
    planet: "Moon",
    angle: "DSC",
    color: "var(--color-acqua)",
    glow: "rgba(202,241,240,0.7)",
    // Moon DSC — crosses 94.83°E (svgX=57) at Jakarta latitude. Enters from left edge.
    path: "M -43 -43 L -41 -32 L -40 -21 L -38 -11 L -36 0 L -34 11 L -33 21 L -31 32 L -29 43 L -28 53 L -26 64 L -24 74 L -23 85 L -21 96 L -20 106 L -18 117 L -16 128 L -15 138 L -13 149 L -12 160 L -10 170 L -9 181 L -7 191 L -6 202 L -4 213 L -3 223 L -1 234 L 0 245 L 2 255 L 3 266 L 5 277 L 6 287 L 8 298 L 9 309 L 11 319 L 12 330 L 14 340 L 15 351 L 16 362 L 18 372 L 19 383 L 21 394 L 22 404 L 24 415 L 25 426 L 26 436 L 28 447 L 29 457 L 31 468 L 32 479 L 33 489 L 35 500 L 36 511 L 38 521 L 39 532 L 40 543 L 42 553 L 43 564 L 45 574 L 46 585 L 47 596 L 49 606 L 50 617 L 52 628 L 53 638 L 55 649 L 56 660 L 57 670 L 59 681 L 60 691 L 62 702 L 63 713 L 65 723 L 66 734 L 67 745 L 69 755 L 70 766 L 72 777 L 73 787 L 75 798 L 76 809 L 78 819 L 79 830 L 81 840 L 82 851 L 84 862 L 85 872 L 87 883 L 88 894 L 90 904 L 91 915 L 93 926 L 95 936 L 96 947 L 98 957 L 99 968 L 101 979 L 102 989 L 104 1000 L 106 1011 L 107 1021 L 109 1032 L 111 1043",
    distance: "1,329 km",
    importance: "moderate",
    description:
      "The Moon Descendant sweeps along Sumatra's western coast and enters this map from the left edge. The Moon on your DSC means you attract nurturing, emotionally intuitive people near these longitudes — partners who feel like home. At 1,329km from Jakarta, this is a moderate background influence. You feel it most in western Sumatra and the Andaman Islands.",
  },
  {
    id: "sun-ic",
    planet: "Sun",
    angle: "IC",
    color: "var(--gold)",
    glow: "rgba(201,169,110,0.8)",
    // Sun IC — vertical at 132.24°E, svgX = ((132.24-92)/50)*1000 = 805
    path: "M 805 0 L 805 1000",
    distance: "2,807 km",
    importance: "wide",
    description:
      "The Sun IC line falls at 132°E, running through the Maluku Islands and Papua. The IC is your deepest private self and roots. The Sun here means this longitude is where your core identity feels most anchored as a home base. At 2,807km east of Jakarta, it's a wide influence — travel to Ambon or Jayapura to feel it fully.",
  },
  {
    id: "jupiter-asc",
    planet: "Jupiter",
    angle: "ASC",
    color: "var(--sage)",
    glow: "rgba(0,253,0,0.6)",
    // Jupiter ASC — crosses 139.27°E (svgX=945) at Jakarta latitude. Sweeps through far eastern Indonesia.
    path: "M 673 -43 L 678 -32 L 683 -21 L 688 -11 L 692 0 L 697 11 L 702 21 L 706 32 L 711 43 L 716 53 L 720 64 L 725 74 L 729 85 L 733 96 L 738 106 L 742 117 L 746 128 L 751 138 L 755 149 L 759 160 L 763 170 L 768 181 L 772 191 L 776 202 L 780 213 L 784 223 L 788 234 L 792 245 L 796 255 L 800 266 L 805 277 L 809 287 L 812 298 L 816 309 L 820 319 L 824 330 L 828 340 L 832 351 L 836 362 L 840 372 L 844 383 L 848 394 L 852 404 L 856 415 L 859 426 L 863 436 L 867 447 L 871 457 L 875 468 L 879 479 L 882 489 L 886 500 L 890 511 L 894 521 L 898 532 L 902 543 L 905 553 L 909 564 L 913 574 L 917 585 L 921 596 L 925 606 L 928 617 L 932 628 L 936 638 L 940 649 L 944 660 L 948 670 L 952 681 L 955 691 L 959 702 L 963 713 L 967 723 L 971 734 L 975 745 L 979 755 L 983 766 L 987 777 L 991 787 L 995 798 L 999 809 L 1003 819 L 1007 830 L 1011 840 L 1015 851 L 1019 862 L 1024 872 L 1028 883 L 1032 894 L 1036 904 L 1040 915 L 1045 926 L 1049 936 L 1053 947 L 1058 957",
    distance: "3,584 km",
    importance: "wide",
    description:
      "Jupiter's Ascendant curve sweeps through Papua and the far eastern archipelago. Jupiter on the ASC is the most beloved line in astrocartography — it radiates luck, expansion, generosity, and magnetism. At 3,584km from Jakarta this is a distant influence, but travelling to Papua or northern Australia would place you directly on this golden curve.",
  },
];

const IMPORTANCE_STYLES: Record<string, { bg: string; label: string }> = {
  exact:    { bg: "bg-white text-black font-bold",                             label: "EXACT ORB • <200km" },
  major:    { bg: "bg-[var(--color-y2k-blue)] text-white",                     label: "MAJOR ORB • <1000km" },
  moderate: { bg: "bg-white/10 text-white border border-white/30",             label: "MODERATE ORB • <2000km" },
  wide:     { bg: "bg-white/5 text-white/60 border border-white/10",           label: "WIDE ORB • >2000km" },
};

export default function AcgMockupPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    // Initialize all lines as hidden
    lineRefs.current.forEach((path) => {
      if (!path) return;
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    });

    // Individual ScrollTrigger per section — much more reliable than a single timeline
    ACG_LINES.forEach((line, i) => {
      const sectionEl = document.getElementById(`section-${line.id}`);
      const cardEl = document.getElementById(`card-${line.id}`);
      const pathEl = lineRefs.current[i];
      if (!sectionEl || !cardEl || !pathEl) return;

      const len = pathEl.getTotalLength();

      // LINE: Draw when scrolling into section, stays drawn after
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

      // CARD: Simple fade in/out tied to section visibility
      gsap.set(cardEl, { autoAlpha: 0, y: 50 });

      ScrollTrigger.create({
        trigger: sectionEl,
        start: "top 70%",
        end: "bottom 30%",
        onEnter: () => gsap.to(cardEl, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }),
        onLeave: () => gsap.to(cardEl, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" }),
        onEnterBack: () => gsap.to(cardEl, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }),
        onLeaveBack: () => gsap.to(cardEl, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" }),
      });
    });

    // Intro card
    const introCard = document.getElementById("intro-card");
    if (introCard) {
      gsap.set(introCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: "#section-intro",
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }),
        onLeave: () => gsap.to(introCard, { autoAlpha: 0, y: -30, duration: 0.4 }),
        onEnterBack: () => gsap.to(introCard, { autoAlpha: 1, y: 0, duration: 0.6 }),
        onLeaveBack: () => gsap.to(introCard, { autoAlpha: 0, y: 30, duration: 0.4 }),
      });
    }

    // Outro card
    const outroCard = document.getElementById("outro-card");
    if (outroCard) {
      gsap.set(outroCard, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: "#section-outro",
        start: "top 60%",
        onEnter: () => gsap.to(outroCard, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }),
        onEnterBack: () => gsap.to(outroCard, { autoAlpha: 1, y: 0, duration: 0.6 }),
        onLeaveBack: () => gsap.to(outroCard, { autoAlpha: 0, y: 30, duration: 0.4 }),
      });
    }
  }, { scope: wrapperRef });

  return (
    <div ref={wrapperRef} className="relative bg-[var(--color-black)] overflow-hidden">

      {/* ═══ FIXED BACKGROUND ═══ */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/sea-map-dark.png"
          alt="Southeast Asia dark cartography"
          fill
          className={`object-cover transition-all duration-700 ease-[var(--ease-cinematic)] ${isMobile ? "object-left" : "object-center"}`}
          priority
        />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* SVG layer for lines + Jakarta pin */}
        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none transition-all duration-700 ease-[var(--ease-cinematic)]"
          preserveAspectRatio={isMobile ? "xMinYMid slice" : "xMidYMid slice"}
        >
          {/* Jakarta pin */}
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

      {/* ═══ NAVBAR ═══ */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-auto">
        <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <Navbar
            activeHref="/mockup-acg"
            centerContent={
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                ACG 101 • Jakarta • Aug 17 1988
              </span>
            }
          />
        </div>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="relative z-20">

        {/* INTRO */}
        <section id="section-intro" className="relative h-screen flex items-center justify-center px-6">
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
            <div className="p-6 md:p-8 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl max-w-xl mx-auto">
              <p className="font-body text-base md:text-lg text-white/80 leading-relaxed mb-4">
                Born in <strong className="text-white">Jakarta, August 17, 1988 at 10:15 PM</strong>.
                Your natal planets project lines across the globe. Scroll down to reveal each line as it crosses Southeast Asia, and learn what it means for your life.
              </p>
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider">
                {ACG_LINES.length} planetary lines • Distance from Jakarta • Influence ratings
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
              <div
                id={`card-${line.id}`}
                className={`w-full max-w-lg ${isLeft ? "mr-auto" : "ml-auto"}`}
              >
                <div className="p-6 md:p-8 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">

                  {/* Planet name + angle */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: line.color, boxShadow: `0 0 12px ${line.glow}` }}
                    />
                    <h2 className="font-primary text-4xl md:text-5xl uppercase tracking-tight text-white leading-none">
                      {line.planet}
                    </h2>
                    <span
                      className="font-mono text-sm uppercase tracking-wider px-3 py-1 rounded-md border"
                      style={{ color: line.color, borderColor: line.color }}
                    >
                      {line.angle}
                    </span>
                  </div>

                  {/* Angle explanation */}
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-3">
                    {line.angle === "MC" && "Midheaven — Career, Public Visibility, Legacy"}
                    {line.angle === "IC" && "Imum Coeli — Home, Roots, Inner Foundation"}
                    {line.angle === "ASC" && "Ascendant — Identity, Physical Self, First Impressions"}
                    {line.angle === "DSC" && "Descendant — Partnerships, Marriage, Others"}
                  </div>

                  <p className="font-body text-sm md:text-base text-white/80 leading-relaxed mb-5">
                    {line.description}
                  </p>

                  {/* Distance + Importance */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md ${imp.bg}`}>
                      {imp.label}
                    </span>
                    <span className="font-mono text-sm text-white/90 tracking-wider">
                      Distance: <strong style={{ color: line.color }}>{line.distance}</strong>
                    </span>
                  </div>

                  {/* Line type */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                    <svg width="40" height="12" viewBox="0 0 40 12" className="shrink-0">
                      {(line.angle === "MC" || line.angle === "IC") ? (
                        <line x1="0" y1="6" x2="40" y2="6" stroke={line.color} strokeWidth="2.5"
                          strokeDasharray={line.angle === "IC" ? "6 4" : "none"} />
                      ) : (
                        <path d="M0 10 C10 2, 30 2, 40 10" fill="none" stroke={line.color} strokeWidth="2.5"
                          strokeDasharray={line.angle === "DSC" ? "4 3" : "none"} />
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
              Your Map<br />Is Drawn
            </h2>
            <div className="p-6 md:p-8 rounded-2xl bg-black/70 border border-[var(--color-y2k-blue)]/30 backdrop-blur-xl max-w-xl mx-auto">
              <p className="font-body text-base md:text-lg text-white/80 leading-relaxed mb-6">
                You have now seen {ACG_LINES.length} key planetary lines crossing Southeast Asia for someone born in Jakarta on August 17, 1988. The Sun IC line runs directly through your birthplace — permanently anchoring your roots. Jupiter MC beckons east toward Sulawesi. Venus and Moon DSC wrap through the archipelago.
              </p>
              <p className="font-body text-sm text-white/50 leading-relaxed mb-6">
                In a real reading, we compute all 40+ lines (10 planets × 4 angles), calculate haversine distances to any destination, factor in active transits and timing windows, and generate a comprehensive personalized travel recommendation.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-y2k-blue)] text-white font-mono uppercase text-sm font-bold rounded-full hover:bg-[var(--color-y2k-blue)]/80 transition-all hover:scale-105 pointer-events-auto"
              >
                Get Your Full Reading
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
