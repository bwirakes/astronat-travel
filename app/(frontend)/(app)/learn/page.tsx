"use client";

import React from "react";
import Link from "next/link";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import Navbar from "@/app/components/Navbar";
import PlanetIcon from "@/app/components/PlanetIcon";
import SignIcon from "@/app/components/SignIcon";
import { Compass, BookOpen, Layers, Zap, Hexagon, Star } from "lucide-react";

const TOPICS = [
  { 
    id: "natal", title: "Natal Charts", href: "/learn/natal-chart", 
    desc: "The blueprint of your soul at the exact moment of birth.", 
    icon: <PlanetIcon planet="Sun" size={32} />, color: "var(--color-y2k-blue)" 
  },
  { 
    id: "acg", title: "Astrocartography", href: "/learn/astrocartography", 
    desc: "Mapping your personal power lines across the globe.", 
    icon: <Compass className="w-8 h-8" />, color: "var(--color-acqua)" 
  },
  { 
    id: "geodetic", title: "Geodetic Astrology", href: "/learn/geodetic-astrology", 
    desc: "How the stars influence specific cities and nations.", 
    icon: <Layers className="w-8 h-8" />, color: "var(--color-spiced-life)" 
  },
  { 
    id: "constellations", title: "The Constellations", href: "/learn/constellations", 
    desc: "Deep sky geometry and the mythology of the stars.", 
    icon: <Star className="w-8 h-8" />, color: "var(--gold)" 
  },
  { 
    id: "houses", title: "The 12 Houses", href: "/learn/houses", 
    desc: "The 12 physical areas of life where your destiny unfolds.", 
    icon: <Hexagon className="w-8 h-8" />, color: "var(--sage)" 
  },
  { 
    id: "aspects", title: "Planetary Aspects", href: "/learn/aspects", 
    desc: "The dialogue between planets: angles of tension and flow.", 
    icon: <Zap className="w-8 h-8" />, color: "var(--color-acqua)" 
  },
  { 
    id: "archetypes", title: "The Great Divide", href: "/learn/malefic-benefic", 
    desc: "Malefics vs Benefics: Understanding planetary camp physics.", 
    icon: <PlanetIcon planet="Saturn" size={32} />, color: "var(--color-spiced-life)" 
  },
  { 
    id: "zodiac", title: "The Zodiac", href: "/learn/zodiac", 
    desc: "A visual glossary of the 12 signs and their modalities.", 
    icon: <SignIcon sign="Aries" size={32} />, color: "var(--color-y2k-blue)" 
  },
  { 
    id: "practical", title: "Viewing the Stars", href: "/learn/viewing-the-stars", 
    desc: "Practical application: How to work with astrology daily.", 
    icon: <BookOpen className="w-8 h-8" />, color: "var(--gold)" 
  }
];

export default function LearnIndexPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-body pb-32 overflow-x-hidden transition-colors duration-300">
      <Navbar activeHref="/learn" />
      
      {/* Editorial Hero Section */}
      <section className="pt-48 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-block font-mono text-[10px] uppercase tracking-[0.4em] px-5 py-2 border border-current rounded-full mb-10 opacity-60">
          Astronat Academy
        </div>
        <h1 className="font-primary text-7xl md:text-[10rem] leading-[0.75] mb-8 uppercase tracking-tighter">
          Sacred <br/><span className="text-[var(--color-y2k-blue)] italic lowercase">Intelligence.</span>
        </h1>
        <p className="max-w-xl text-lg md:text-xl opacity-80 leading-relaxed mx-auto font-body">
          We don't just read charts; we teach you how the cosmos operates as a physical machine. Master the first principles of the stars through our high-fidelity guides.
        </p>
      </section>

      {/* Topics Grid */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TOPICS.map((topic) => (
            <Link key={topic.id} href={topic.href} className="group">
              <AstronatCard 
                variant="surface" 
                shape="cut-md" 
                className="p-10 h-full flex flex-col justify-between transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-16">
                  <div className="text-[var(--text-primary)] opacity-40 group-hover:opacity-100 group-hover:text-[var(--color-y2k-blue)] transition-all duration-500">
                    {topic.icon}
                  </div>
                  <div className="w-12 h-px bg-current opacity-10 group-hover:w-full group-hover:opacity-5 transition-all" />
                </div>
                <div>
                  <h2 className="font-primary text-4xl uppercase mb-3 tracking-tight">
                    {topic.title}
                  </h2>
                  <p className="text-sm opacity-60 font-body leading-relaxed max-w-[200px]">
                    {topic.desc}
                  </p>
                </div>
              </AstronatCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom Statement Card */}
      <section className="mt-32 px-6 md:px-12 max-w-5xl mx-auto">
        <AstronatCard variant="charcoal" shape="asymmetric-md" className="p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 font-display-alt-2 text-[20rem] leading-[0.5] opacity-5 pointer-events-none text-white">
            *
          </div>
          <h2 className="font-primary text-5xl md:text-7xl uppercase mb-8 leading-none relative z-10">
            For the <br/><span className="italic text-[var(--color-y2k-blue)]">New Era.</span>
          </h2>
          <p className="text-lg opacity-60 max-w-lg mx-auto mb-10 relative z-10 leading-relaxed font-body">
            Our curriculum is built to be statically shared, mathematically sound, and visually premium. No generic horoscopes—just absolute astronomical authority.
          </p>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] relative z-10 text-[var(--gold)]">
            Updated April 14, 2026
          </div>
        </AstronatCard>
      </section>
    </div>
  );
}
