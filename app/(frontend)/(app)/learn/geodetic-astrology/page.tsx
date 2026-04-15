"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const REGIONS = [
  { id: "r1", name: "0° Longitude (Greenwich)", desc: "The 'Aries' of the world. Represents new beginnings, pioneering spirits, and the global center of time." },
  { id: "r2", name: "90° East (Cancer)", desc: "The emotional and nurturing heart of the Eastern hemisphere. Historically deep connections to lineage and family structure." },
  { id: "r3", name: "180° (Libra)", desc: "The point of partnership and diplomacy. Where East meets West and global balance is negotiated." }
];

export default function GeodeticLearnPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!wrapperRef.current) return;
    
    // Boundary Reveal
    ScrollTrigger.create({
      trigger: "#section-geodetic",
      start: "top 60%",
      onEnter: () => {
         gsap.to(".geo-meridian", { height: "100%", opacity: 1, duration: 2, ease: "power4.out" });
         gsap.fromTo("#geo-content", { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 1 });
      }
    });

  }, { scope: wrapperRef });

  return (
    <div ref={wrapperRef} className="bg-[var(--bg)] text-[var(--text-primary)] font-body min-h-screen transition-colors duration-300">
      <Navbar activeHref="/learn" />

      {/* Hero */}
      <section className="h-[80vh] flex items-center justify-center px-6">
        <LearnIntroCard 
          category="Mundane Astrology"
          title={<>Geodetic <br/><span className="text-[var(--color-spiced-life)] italic lowercase">Astrology</span></>}
          description="Geodetic astrology maps the 360 degrees of the zodiac directly onto the 360 degrees of Earth's longitude. It reveals how the stars influence specific cities."
        />
      </section>

      {/* Meridian Visualization */}
      <section id="section-geodetic" className="min-h-screen relative flex flex-col md:flex-row items-center justify-between px-12 md:px-24 py-20 bg-white/5">
        <div className="absolute left-1/2 top-0 w-px h-0 bg-[var(--color-y2k-blue)] geo-meridian opacity-0 hidden md:block shadow-[0_0_20px_rgba(4,86,251,0.5)]" />
        
        <div className="w-full md:w-1/2 pr-0 md:pr-20 mb-16 md:mb-0 relative z-10">
           <div className="font-primary text-5xl md:text-7xl uppercase leading-none mb-10">
             The Global <br/><span className="text-[var(--color-y2k-blue)]">Meridian.</span>
           </div>
           <p className="text-xl opacity-70 leading-relaxed font-body">
             In the Geodetic system, 0° Longitude (Greenwich) is locked to 0° Aries. As the world turns, every coordinate on Earth is assigned a specific zodiacal degree for its Ascendant and Midheaven.
           </p>
        </div>

        <div id="geo-content" className="w-full md:w-1/2 opacity-0 relative z-10">
           <Accordion type="single" collapsible className="w-full border-white/10">
             {REGIONS.map(r => (
               <AccordionItem key={r.id} value={r.id} className="border-white/10">
                 <AccordionTrigger className="font-primary text-2xl uppercase hover:no-underline py-6">
                   {r.name}
                 </AccordionTrigger>
                 <AccordionContent className="text-white/60 leading-relaxed pb-8">
                   {r.desc}
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
        </div>
      </section>

      {/* Outro */}
      <section className="h-screen flex items-center justify-center px-6">
        <LearnOutroCard 
          title={<>Heaven <br/>On Earth</>}
          description="Why do you feel like a different person in London vs. Bali? Geodetic astrology proves that space is as important as time."
          buttonHref="/learn/constellations"
          buttonText="Explore The Constellations"
        />
      </section>
    </div>
  );
}
