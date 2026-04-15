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

const CONSTELLATIONS = [
  { id: "leo", name: "Leo", dots: [{x: 100, y: 100}, {x: 150, y: 80}, {x: 200, y: 120}, {x: 180, y: 180}, {x: 120, y: 160}], desc: "The Lion. A symbol of royalty, courage, and the burning heart of summer." },
  { id: "aquarius", name: "Aquarius", dots: [{x: 400, y: 300}, {x: 450, y: 280}, {x: 480, y: 320}, {x: 420, y: 350}], desc: "The Water Bearer. Representing the pouring out of knowledge and collective consciousness." }
];

export default function ConstellationsLearnPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animate star connections
    gsap.from(".star-path", {
      strokeDasharray: 1000,
      strokeDashoffset: 1000,
      duration: 3,
      stagger: 0.5,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: "#star-svg",
        start: "top 80%"
      }
    });

    gsap.from(".star-dot", {
        scale: 0,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "back.out(2)",
        scrollTrigger: {
            trigger: "#star-svg",
            start: "top 80%"
        }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-[#050505] text-white font-body min-h-screen overflow-x-hidden">
      <Navbar activeHref="/learn" />
      
      <section className="h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(4,86,251,0.15),transparent)]" />
        <LearnIntroCard 
          category="Celestial Geometry"
          title={<>The <span className="text-[var(--gold)] italic lowercase">Constellations</span></>}
          description="Beyond the zodiac signs lie the actual star clusters. They are the mythic backdrop of our astronomical history."
        />
      </section>

      <section className="min-h-screen py-32 px-12 md:px-24 flex flex-col items-center">
        <svg id="star-svg" viewBox="0 0 800 500" className="w-full max-w-4xl h-auto mb-20 overflow-visible">
           {CONSTELLATIONS.map((c, ci) => (
             <g key={c.id}>
                <path 
                  className="star-path"
                  d={`M ${c.dots.map(d => `${d.x} ${d.y}`).join(" L ")} Z`}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="0.5"
                  strokeDasharray="1000"
                  strokeDashoffset="0"
                  opacity="0.4"
                />
                {c.dots.map((d, di) => (
                  <circle key={di} className="star-dot" cx={d.x} cy={d.y} r="2" fill="white" style={{ filter: "drop-shadow(0 0 5px white)" }} />
                ))}
             </g>
           ))}
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl w-full">
           {CONSTELLATIONS.map(c => (
             <LearnSectionCard key={c.id} title={c.name} description={c.desc} />
           ))}
        </div>
      </section>

      <section className="h-screen flex items-center justify-center">
        <LearnOutroCard 
          title={<>Mapped <br/>Stories</>}
          description="Every culture has seen different shapes in the same stars. We use the 88 modern constellations recognized by astronomy."
          buttonHref="/learn/aspects"
          buttonText="Explore Aspects"
        />
      </section>
    </div>
  );
}
