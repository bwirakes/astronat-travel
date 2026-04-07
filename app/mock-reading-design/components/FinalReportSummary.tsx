"use client";

import React from "react";
import Link from "next/link";
import { ScoreRing } from "@/app/components/ScoreRing";
import HouseMatrixCard from "@/app/components/HouseMatrixCard";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import ActiveTransitsCard from "@/app/components/ActiveTransitsCard";
import GeodeticGridCard from "@/app/components/GeodeticGridCard";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";
import { useScrollSection } from "../hooks/useScrollSection";
import PlanetIcon from "@/app/components/PlanetIcon";
import AspectIcon from "@/app/components/AspectIcon";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import { PlanetHoverCard } from "@/app/components/ui/planet-hover-card";
import { AcgMap } from "@/app/components/AcgMap";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";

const DEMO_NATAL = {
  sun:     { longitude: 143 },
  moon:    { longitude: 228 },
  mercury: { longitude: 156 },
  venus:   { longitude: 108 },
  mars:    { longitude: 280 },
  jupiter: { longitude: 252 },
  saturn:  { longitude: 335 },
  uranus:  { longitude: 295 },
  neptune: { longitude: 282 },
  pluto:   { longitude: 219 },
  chiron:  { longitude: 190 },
  houses: [296, 350, 30, 56, 75, 94, 116, 170, 210, 236, 255, 274],
};

function getVerdict(score: number) {
  if (score >= 80) return "highlyProductive";
  if (score >= 65) return "productive";
  if (score >= 50) return "mixed";
  if (score >= 35) return "challenging";
  return "hostile";
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"],
        v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function FinalReportSummary({ reading: externalReading }: { reading: any }) {
  const reading = externalReading || MOCK_READING_DETAILS["1"];
  const verdict = getVerdict(reading.macroScore);
  
  const { ref } = useScrollSection<HTMLDivElement>("report", "0px 0px -50% 0px");

  if (!reading || !reading.houses || reading.houses.length === 0) return null;

  const sortedHouses = [...reading.houses].sort((a: any, b: any) => b.score - a.score);
  const bestHouse = sortedHouses[0];

  const wheelPlanets = Object.keys(DEMO_NATAL).filter(k => k !== 'houses').map(k => ({
       planet: k.charAt(0).toUpperCase() + k.slice(1), 
       longitude: (DEMO_NATAL as any)[k].longitude
  }));

  return (
    <div ref={ref} id="section-report" className="relative w-full z-10 pt-4 pb-12 transition-colors duration-1000">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
      <div className="max-w-[1000px] mx-auto px-6 lg:px-12 relative z-10">
        
        {/* OVERSIZED SCRIPT HEADER */}
        <div className="relative mb-16 text-center mt-12">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] font-display-alt-2 text-[15rem] leading-[0.5] text-[var(--color-y2k-blue)] opacity-[0.05] pointer-events-none">
            Verdict
          </span>
          <h1 className="relative font-primary text-6xl md:text-7xl uppercase tracking-tight text-[var(--text-primary)]">
            {reading.destination.split(',')[0]} Final Verdict
          </h1>
        </div>

        {/* HERO SCORERING */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24 bg-[var(--surface)] p-8 rounded-[var(--shape-asymmetric-md)] border border-[var(--surface-border)]">
          <div className="lg:col-span-5 flex justify-center">
            <ScoreRing score={reading.macroScore} verdict={verdict} />
          </div>
          <div className="lg:col-span-7 pt-4 lg:pt-0">
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 bg-transparent border border-current rounded-full inline-block px-3 py-1">
              Overall Trip Score
            </div>
            <h2 className="font-primary text-4xl text-[var(--text-primary)] mb-4">
              {(reading.aiInsights as any)?.summary?.headline || "Incredible Growth Potential"}
            </h2>
            <p className="font-body text-lg text-[var(--text-secondary)] leading-relaxed">
              {(reading.aiInsights as any)?.summary?.verdict || "This city will fundamentally rewire how you approach your career and personal boundaries. It is highly productive but commands intense discipline."}
            </p>
          </div>
        </div>

        {/* INTERLEAVED NARRATIVE */}
        <div className="mb-8">
          <h3 className="font-primary text-4xl md:text-5xl uppercase tracking-tight text-[var(--text-primary)] mb-6 text-center">
            How We Calculate Your Verdict
          </h3>
          <p className="font-body text-[var(--text-secondary)] text-lg leading-relaxed max-w-3xl mx-auto text-center mb-16">
             Your score is built using four advanced astrological techniques. Think of them as building blocks! Here is the sequential story of how your relocated chart—acting as the seed—is influenced by the Earth's environment at this specific destination.
          </p>
        </div>

        <div className="space-y-24">
          
          {/* PILLAR 1 */}
          <div>
            <div className="max-w-[800px] mb-8">
              <h4 className="font-mono text-sm tracking-widest uppercase text-[var(--text-primary)] font-bold mb-2">1. Hellenistic Base & Native Placements</h4>
              <div className="font-mono text-[0.65rem] text-[var(--color-y2k-blue)] uppercase mb-4">The Soil / Relocated Chart</div>
              <p className="font-body text-[var(--text-secondary)] text-base leading-relaxed">
                When you move to a new city, your birth chart rotates like a wheel. Ancient Hellenistic astrology looks at how healthy the "rulers" of your new chart setup are. 
                For example, the ruler of your highest activated {getOrdinal(bestHouse.house)} House is <PlanetHoverCard planet={bestHouse.rulerPlanet} sign={bestHouse.relocatedSign} house={bestHouse.house} degree="0°"><strong><span className="cursor-help border-b border-dashed border-[var(--text-tertiary)]">{bestHouse.rulerPlanet}</span></strong></PlanetHoverCard>. Because it sits in a <strong>{bestHouse.rulerCondition}</strong> state, it provides a very strong foundation. We also check "Hermetic Astrodynes"—if you have personal planets that moved inside these rooms, they act like houseguests bringing their own special talents to the party!
              </p>
            </div>
            
            <div className="w-full">
              <HouseMatrixCard matrix={{ macroScore: reading.macroScore, houses: reading.houses } as any} loading={false} />
            </div>
          </div>

          {/* PILLAR 2 */}
          <div className="pt-24 border-t border-[var(--surface-border)]">
            <div className="max-w-[800px] mb-8">
              <h4 className="font-mono text-sm tracking-widest uppercase text-[var(--text-primary)] font-bold mb-2">2. Astrocartography</h4>
              <div className="font-mono text-[0.65rem] text-[var(--color-y2k-blue)] uppercase mb-4">Geographic Map Lines / The Climate</div>
              <p className="font-body text-[var(--text-secondary)] text-base leading-relaxed">
                There are invisible energy lines crisscrossing the Earth. Think of them like Wi-Fi signals. If you move close to a <PlanetHoverCard planet="Jupiter" sign="Sagittarius" house={9} degree="0°"><strong><span className="cursor-help border-b border-dashed border-[var(--text-tertiary)]">Jupiter</span></strong></PlanetHoverCard> line, your "Wi-Fi" for luck and expansion becomes incredibly strong! We measure exactly how far away you are from these planetary lines to see if your score gets a massive supercharge.
              </p>
            </div>

            <div className="w-full">
              <AcgLinesCard planetLines={reading.planetaryLines as any} natalPlanets={[] as any} birthCity="Jakarta" destination={reading.destination} />
            </div>

            <div className="w-full mt-12 mb-12">
                <AcgMap 
                    natal={DEMO_NATAL}
                    birthDateTimeUTC="1988-08-17T12:00:00Z"
                    birthLon={106.8456}
                    highlightCity={{ lat: 37.7749, lon: -122.4194, name: reading.destination.split(',')[0] }}
                    interactive 
                />
            </div>
          </div>

          {/* PILLAR 3 */}
          <div className="pt-24 border-t border-[var(--surface-border)]">
            <div className="max-w-[800px] mb-8">
              <h4 className="font-mono text-sm tracking-widest uppercase text-[var(--text-primary)] font-bold mb-2">3. Mother Earth's Grid</h4>
              <div className="font-mono text-[0.65rem] text-[var(--color-y2k-blue)] uppercase mb-4">The Geodetic Skeleton</div>
              <p className="font-body text-[var(--text-secondary)] text-base leading-relaxed">
                Separate from the map lines, the Earth has a permanent energetic skeleton called the Geodetic grid. Geographic map lines are a symbolic representation of the four primary Earth angles: the Ascendant (ASC), Fourth House (IC), Descendant (DSC), and Midheaven (MH). They hold the same permanent energetic effect. We check if your personal planets happen to "click" perfectly into these exact angles right where you are standing. It's exactly like finding a matching puzzle piece locked in the ground.
              </p>
            </div>

            <div className="w-full">
              <GeodeticGridCard destination={reading.destination} />
            </div>
          </div>

          {/* PILLAR 4 */}
          <div className="pt-24 border-t border-[var(--surface-border)]">
            <div className="max-w-[800px] mb-8">
              <h4 className="font-mono text-sm tracking-widest uppercase text-[var(--text-primary)] font-bold mb-2">4. The Weather Today</h4>
              <div className="font-mono text-[0.65rem] text-[var(--color-y2k-blue)] uppercase mb-4">Transits & Aspects</div>
              <p className="font-body text-[var(--text-secondary)] text-base leading-relaxed">
                Even the best cities have rainy days! We look at the planets in the sky <i>right now</i> and see what geometric connections (<span className="inline-flex gap-1 items-center px-1 border border-[var(--surface-border)] rounded text-xs opacity-80 mx-1"><AspectIcon aspect="square" size={10} /> aspects</span>) they make to your relocated chart. 
                For example, if the transiting <PlanetHoverCard planet="Mars" sign="Aries" house={1} degree="0°"><strong><span className="cursor-help border-b border-dashed border-[var(--text-tertiary)]">Mars</span></strong></PlanetHoverCard> is making a tense "Square" to your <PlanetHoverCard planet="Uranus" sign="Aquarius" house={11} degree="0°"><strong><span className="cursor-help border-b border-dashed border-[var(--text-tertiary)]">Uranus</span></strong></PlanetHoverCard>, it might temporarily make things feel stressful and lower your score for today. But don't worry, the weather always passes!
              </p>
            </div>

            <div className="w-full bg-transparent">
              <ActiveTransitsCard transits={[] as any} travelDate={reading.travelDate} />
            </div>
          </div>

        </div>
        
        {/* FOOTER NAV */}
        <div className="mt-24 text-center pb-20 border-t border-[var(--surface-border)] pt-12">
          <Link href="/flow" className="inline-block relative overflow-hidden group px-12 py-6 rounded-[var(--shape-asymmetric-lg)] bg-[var(--text-primary)] text-[var(--bg)] font-mono uppercase tracking-[0.2em] text-sm transition-all hover:scale-105">
            <span className="relative z-10 font-bold">Close Reading</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
