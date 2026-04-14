"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { AstronatCard } from "@/app/components/ui/astronat-card";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const MAP_DATA = [
  { id: "lines", title: "Planetary Lines", desc: "Where a planet's energy is strongest on Earth. Crossing a Sun line might bring fame; crossing a Saturn line might bring hard work." },
  { id: "crossings", title: "Parans", desc: "Intersection points where two planetary lines cross, creating a powerful cocktail of combined energy." }
];

const ANGLES = [
  { id: "ac", name: "Ascendant (AC)", desc: "The line of self and first impressions. Projects your personality outward. living near an AC line is the most personally felt of all four angles." },
  { id: "ic", name: "Imum Coeli (IC)", desc: "The line of home and belonging. Deep roots and private life. Marked by home, family, and ancestral depth." },
  { id: "dc", name: "Descendant (DC)", desc: "The line of partnerships and others. How you relate and attract romantic or business allies." },
  { id: "mc", name: "Midheaven (MC)", desc: "The line of career and public legacy. Where the world sees you. Career, reputation, and visibility are spotlit here." }
];

export default function AstrocartographyLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!wrapperRef.current) return;

    // Intro Fade
    const introCard = document.getElementById("intro-card");
    if(introCard) {
      gsap.fromTo(introCard, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1 });
    }

    // Map section reveal
    ScrollTrigger.create({
      trigger: "#section-map",
      start: "top 60%",
      onEnter: () => {
        gsap.to(".map-line", { strokeDashoffset: 0, opacity: 0.6, duration: 2, stagger: 0.2 });
        gsap.fromTo("#card-map", { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.8 });
      }
    });

  }, { scope: wrapperRef });

  return (
    <div ref={wrapperRef} className="bg-[var(--bg)] text-[var(--text-primary)] font-body min-h-screen transition-colors duration-300">
      <Navbar activeHref="/learn" />

      {/* Hero */}
      <section id="section-intro" className="min-h-screen py-32 flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center grayscale opacity-10 pointer-events-none" style={{ backgroundImage: "url('/moody-landscape.jpg')" }} />
        <LearnIntroCard 
          category="Personal Geography"
          title={<>Astro <br/><span className="text-[var(--color-acqua)] italic lowercase">Cartography</span></>}
          description="Astrocartography maps your natal chart onto the globe, revealing exactly where your planetary power is strongest on Earth."
        />
      </section>

      {/* Interactive Map Visual */}
      <section id="section-map" className="min-h-screen relative flex items-center justify-center py-20 bg-black/40">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           {/* Placeholder for SVG map lines */}
           <svg viewBox="0 0 1000 500" className="w-full h-full">
              <path d="M 200 100 Q 400 300 800 100" className="map-line" fill="none" stroke="var(--color-y2k-blue)" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000" />
              <path d="M 100 400 Q 500 200 900 400" className="map-line" fill="none" stroke="var(--color-acqua)" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000" />
              <path d="M 300 0 L 300 500" className="map-line" fill="none" stroke="var(--color-spiced-life)" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000" />
           </svg>
        </div>

        <AstronatCard id="card-map" variant="glass" shape="organic" className="p-12 md:p-16 max-w-2xl text-center relative z-10 opacity-0">
           <h2 className="font-primary text-5xl uppercase mb-8">The Angle of Power</h2>
           <p className="text-lg opacity-80 leading-relaxed mb-10">
             Not all lines are created equal. Every planetary line on your map corresponds to one of the four angles of your chart.
           </p>

           <Tabs defaultValue="ac" className="w-full">
             <TabsList className="bg-white/5 border border-white/10 p-1 mb-8">
               {ANGLES.map(a => (
                 <TabsTrigger key={a.id} value={a.id} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2">
                   {a.id}
                 </TabsTrigger>
               ))}
             </TabsList>
             {ANGLES.map(a => (
               <TabsContent key={a.id} value={a.id} className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                  <h4 className="font-primary text-3xl mb-4 text-[var(--color-y2k-blue)]">{a.name}</h4>
                  <p className="opacity-70 text-sm leading-relaxed">{a.desc}</p>
               </TabsContent>
             ))}
           </Tabs>
        </AstronatCard>
      </section>

      {/* Outro */}
      <section className="h-screen flex items-center justify-center px-6">
        <LearnOutroCard 
          title={<>Find Your <br/>Place</>}
          description="Moving to an AC line might revitalize your health, while building a business on an MC line could accelerate your career path."
          buttonHref="/learn/geodetic-astrology"
          buttonText="Explore Geodetic Astrology"
        />
      </section>
    </div>
  );
}
