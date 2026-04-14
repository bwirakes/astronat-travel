"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const ASPECTS = [
  { id: "trine", name: "Trine (120°)", desc: "A flow of natural talent and harmony. Energy moves with absolute ease between these planets.", icon: "▲" },
  { id: "square", name: "Square (90°)", desc: "Internal friction that demands action. This is the structural tension that creates growth.", icon: "■" },
  { id: "opposition", name: "Opposition (180°)", desc: "A tug-of-war across the chart. Requires balance and integration of opposites.", icon: "☍" }
];

export default function AspectsLearnPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animate geometric diagrams
    gsap.from(".aspect-icon", {
        rotateY: 180,
        opacity: 0,
        duration: 1.5,
        stagger: 0.3,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".aspect-grid",
            start: "top 70%"
        }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-[var(--color-eggshell)] text-[var(--color-charcoal)] font-body min-h-screen">
      <Navbar activeHref="/learn" />
      
      <section className="h-[80vh] flex items-center justify-center">
        <LearnIntroCard 
          category="Sacred Geometry"
          title={<>Planetary <br/><span className="text-[var(--color-y2k-blue)] italic lowercase">Aspects</span></>}
          description="Aspects are the mathematical angles between planets. They describe the 'dialogue'—how different parts of your psyche interact."
        />
      </section>

      <section className="py-32 px-12 aspect-grid max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
         {ASPECTS.map(a => (
           <div key={a.id} className="flex flex-col items-center text-center">
              <div className="aspect-icon text-8xl mb-10 text-[var(--color-y2k-blue)] font-primary-alt">{a.icon}</div>
              <LearnSectionCard 
                title={a.name}
                description={a.desc}
              />
           </div>
         ))}
      </section>

      <section className="h-screen flex items-center justify-center">
        <LearnOutroCard 
          title={<>The Soul's <br/>Dialogue</>}
          description="A chart without aspects is silent. The angles provide the tension and flow that make human life dynamic."
          buttonHref="/learn/malefic-benefic"
          buttonText="Next: Malefic vs Benefic"
        />
      </section>
    </div>
  );
}
