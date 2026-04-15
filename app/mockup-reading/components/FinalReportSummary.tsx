"use client";

import React from "react";
import Link from "next/link";
import { ScoreRing } from "@/app/components/ScoreRing";
import VerdictCard from "@/app/components/VerdictCard";
import TripScoreCard from "@/app/components/TripScoreCard";
import HouseMatrixCard from "@/app/components/HouseMatrixCard";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import ActiveTransitsCard from "@/app/components/ActiveTransitsCard";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";
import { useScrollSection } from "../hooks/useScrollSection";

function getVerdict(score: number) {
  if (score >= 80) return "highlyProductive";
  if (score >= 65) return "productive";
  if (score >= 50) return "mixed";
  if (score >= 35) return "challenging";
  return "hostile";
}

export function FinalReportSummary() {
  const reading = MOCK_READING_DETAILS["1"];
  const verdict = getVerdict(reading.macroScore);
  
  const { ref } = useScrollSection<HTMLElement>("report", "0px 0px -50% 0px");

  return (
    <section ref={ref} id="section-report" className="relative min-h-screen w-full z-30 pt-32 pb-24 transition-colors duration-1000 bg-black/40 backdrop-blur-md snap-start">
      <div className="max-w-[900px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h1 className="font-primary text-5xl md:text-7xl uppercase tracking-tight mb-6 drop-shadow-2xl text-white">
            London Final Verdict
          </h1>
          <div className="flex items-center justify-center gap-4 mb-12">
            <ScoreRing score={reading.macroScore} verdict={verdict} />
            <div className="text-left">
              <div className="font-mono text-sm uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Overall Trip Score</div>
              <VerdictCard summary={(reading.aiInsights as any)?.summary || {verdict: "excellent", headline: "Incredible Growth Potential", bestWindows: [], avoidWindows: []}} loading={false} destination={reading.destination} />
            </div>
          </div>
        </div>

        <div className="space-y-16">
          <TripScoreCard 
            summary={(reading.aiInsights as any)?.summary || {verdict: "excellent", headline: "Incredible Growth Potential", bestWindows: [], avoidWindows: []}} 
            loading={false} 
            destination={reading.destination} 
            tripScore={reading.macroScore} 
            acgScore={80} 
            mundaneScore={85} 
          />
          
          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-6 border-b border-[var(--surface-border)] pb-2">
              Relocated House Placements
            </h4>
            <HouseMatrixCard matrix={{ macroScore: reading.macroScore, houses: reading.houses } as any} loading={false} />
          </div>
          
          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-6 border-b border-[var(--surface-border)] pb-2">
              Geographic Line Influences
            </h4>
            <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-[var(--radius-sm)] p-6 md:p-8">
              <AcgLinesCard planetLines={reading.planetaryLines as any} natalPlanets={[] as any} birthCity="Jakarta" destination={reading.destination} />
            </div>
          </div>

          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-6 border-b border-[var(--surface-border)] pb-2">
              Timing & Transits
            </h4>
            <ActiveTransitsCard transits={[] as any} travelDate={reading.travelDate} />
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-[var(--surface-border)] text-center">
          <Link href="/flow" className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--text-primary)] text-[var(--bg)] font-mono uppercase text-sm font-bold tracking-widest rounded-full hover:scale-105 transition-all">
            Plan Another Trip
          </Link>
        </div>
      </div>
    </section>
  );
}
