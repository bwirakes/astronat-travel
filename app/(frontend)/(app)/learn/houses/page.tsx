"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { AstronatCard } from "@/app/components/ui/astronat-card";

const HOUSES = [
  { id: "1", name: "I", keyword: "Identity", ruling: "Self, Physical Body, First Impressions", icon: "👤" },
  { id: "2", name: "II", keyword: "Values", ruling: "Money, Possessions, Self-Worth", icon: "💰" },
  { id: "3", name: "III", keyword: "Mind", ruling: "Siblings, Short Travel, Communication", icon: "🗣️" },
  { id: "4", name: "IV", keyword: "Home", ruling: "Roots, Family, Mother, Private Life", icon: "🏠" },
  { id: "5", name: "V", keyword: "Joy", ruling: "Creativity, Romance, Children, Pleasure", icon: "🎭" },
  { id: "6", name: "VI", keyword: "Duty", ruling: "Health, Daily Routine, Service, Pets", icon: "🛠️" },
  { id: "7", name: "VII", keyword: "Others", ruling: "Marriage, Partnerships, Open Enemies", icon: "⚖️" },
  { id: "8", name: "VIII", keyword: "Death", ruling: "Sex, Transformation, Shared Resources", icon: "⚰️" },
  { id: "9", name: "IX", keyword: "Wisdom", ruling: "Higher Education, Long Travel, Religion", icon: "✈️" },
  { id: "10", name: "X", keyword: "Stature", ruling: "Career, Public Life, Father, Legacy", icon: "🏛️" },
  { id: "11", name: "XI", keyword: "Community", ruling: "Friends, Hopes, Social Systems", icon: "👥" },
  { id: "12", name: "XII", keyword: "Solitude", ruling: "Hidden Things, Dreams, Institutions", icon: "🧿" }
];

export default function HousesLearnPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHouse, setActiveHouse] = useState("1");

  useGSAP(() => {
    gsap.from(".house-card", { opacity: 0, scale: 0.95, duration: 0.4, stagger: 0.05, ease: "power2.out" });
  }, { scope: containerRef, dependencies: [activeHouse] });

  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] font-body min-h-screen pb-32 transition-colors duration-300">
      <Navbar activeHref="/learn" />
      
      {/* Intro */}
      <section className="h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
           <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-y2k-blue)] mb-6 block">Physical Geometry</span>
           <h1 className="font-primary text-7xl md:text-[10rem] uppercase leading-[0.7] mb-8 lg:tracking-tighter">
             The 12 <br/><span className="italic text-[var(--color-y2k-blue)]">Houses.</span>
           </h1>
           <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
             While signs are *how* energy moves, the 12 houses are *where* it happens. They are the physical stages of your existence.
           </p>
        </div>
      </section>

      {/* Interactive Houses Grid */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto" ref={containerRef}>
        <Tabs value={activeHouse} onValueChange={setActiveHouse} className="w-full">
           <div className="flex flex-wrap justify-center gap-2 mb-16">
             <TabsList className="bg-transparent h-auto flex flex-wrap justify-center gap-2">
               {HOUSES.map(h => (
                 <TabsTrigger 
                   key={h.id} 
                   value={h.id} 
                   className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-current opacity-40 data-[state=active]:opacity-100 data-[state=active]:bg-[var(--text-primary)] data-[state=active]:text-[var(--bg)] font-mono text-xs transition-all"
                 >
                   {h.name}
                 </TabsTrigger>
               ))}
             </TabsList>
           </div>

           {HOUSES.map(h => (
             <TabsContent key={h.id} value={h.id} className="house-card outline-none">
                <AstronatCard variant="eggshell" shape="cut-md" className="p-12 md:p-24 border-[var(--surface-border)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 font-primary text-[20rem] opacity-[0.03] leading-none pointer-events-none select-none">
                     {h.id}
                   </div>
                   
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                      <div className="text-9xl filter grayscale group-hover:grayscale-0 transition-all">{h.icon}</div>
                      <div className="flex-1 text-center md:text-left">
                         <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-y2k-blue)] mb-4">House of {h.keyword}</div>
                         <h2 className="font-primary text-6xl md:text-8xl uppercase mb-6 leading-none">The {h.id}st House</h2>
                         <p className="text-2xl md:text-3xl font-primary-alt opacity-80 leading-relaxed max-w-xl">
                            {h.ruling}.
                         </p>
                      </div>
                   </div>
                </AstronatCard>
             </TabsContent>
           ))}
        </Tabs>
      </section>

      {/* Outro */}
      <section className="mt-32 px-6">
        <LearnOutroCard 
          title={<>The Sky <br/>Sections</>}
          description="Every chart has 12 houses. Some are active and full of planets, while others are silent stages waiting for transits to pass through."
          buttonHref="/learn/aspects"
          buttonText="Learn: Planetary Aspects"
        />
      </section>
    </div>
  );
}
