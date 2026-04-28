"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";

import { PageHeader } from "@/components/app/page-header-context";
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const CONSTELLATIONS = [
  { id: "aries", name: "Aries", dates: "Mar 21 — Apr 19", dots: [{x: 50, y: 400}, {x: 90, y: 370}, {x: 120, y: 420}], desc: "The Ram. Courageous and pioneering, leading the charge of the astrological year." },
  { id: "taurus", name: "Taurus", dates: "Apr 20 — May 20", dots: [{x: 150, y: 300}, {x: 190, y: 280}, {x: 210, y: 330}, {x: 170, y: 350}], desc: "The Bull. Symbolizing groundedness, earthly delights, and robust endurance." },
  { id: "gemini", name: "Gemini", dates: "May 21 — Jun 20", dots: [{x: 300, y: 400}, {x: 330, y: 370}, {x: 370, y: 420}, {x: 350, y: 460}], desc: "The Twins. Representing duality, quick wit, and the eternal exchange of ideas." },
  { id: "cancer", name: "Cancer", dates: "Jun 21 — Jul 22", dots: [{x: 450, y: 150}, {x: 480, y: 120}, {x: 510, y: 160}], desc: "The Crab. The emotional anchor, offering deep intuition and fierce protection." },
  { id: "leo", name: "Leo", dates: "Jul 23 — Aug 22", dots: [{x: 100, y: 100}, {x: 150, y: 80}, {x: 200, y: 120}, {x: 180, y: 180}, {x: 120, y: 160}], desc: "The Lion. A symbol of royalty, courage, and the burning heart of summer." },
  { id: "virgo", name: "Virgo", dates: "Aug 23 — Sep 22", dots: [{x: 250, y: 80}, {x: 300, y: 50}, {x: 330, y: 110}, {x: 280, y: 130}], desc: "The Maiden. Embodying purity of intention, service, and meticulous perfection." },
  { id: "libra", name: "Libra", dates: "Sep 23 — Oct 22", dots: [{x: 600, y: 100}, {x: 640, y: 80}, {x: 680, y: 130}, {x: 620, y: 150}], desc: "The Scales. Seeking harmony, justice, and the delicate balance of all things." },
  { id: "scorpio", name: "Scorpio", dates: "Oct 23 — Nov 21", dots: [{x: 650, y: 300}, {x: 690, y: 280}, {x: 730, y: 330}, {x: 700, y: 380}, {x: 660, y: 350}], desc: "The Scorpion. Deeply transformative, mysterious, and holding intense emotional power." },
  { id: "sagittarius", name: "Sagittarius", dates: "Nov 22 — Dec 21", dots: [{x: 550, y: 400}, {x: 600, y: 370}, {x: 630, y: 420}, {x: 580, y: 460}], desc: "The Archer. Aiming for truth, expansive wisdom, and boundless exploration." },
  { id: "capricorn", name: "Capricorn", dates: "Dec 22 — Jan 19", dots: [{x: 720, y: 200}, {x: 750, y: 170}, {x: 780, y: 220}, {x: 740, y: 250}], desc: "The Sea-Goat. Representing unyielding ambition, structure, and mastery of time." },
  { id: "aquarius", name: "Aquarius", dates: "Jan 20 — Feb 18", dots: [{x: 400, y: 300}, {x: 450, y: 280}, {x: 480, y: 320}, {x: 420, y: 350}], desc: "The Water Bearer. Representing the pouring out of knowledge and collective consciousness." },
  { id: "pisces", name: "Pisces", dates: "Feb 19 — Mar 20", dots: [{x: 500, y: 250}, {x: 540, y: 220}, {x: 570, y: 280}, {x: 520, y: 300}], desc: "The Fishes. Boundlessly compassionate, swimming through the depths of spirituality." }
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
        trigger: "#constellations-section",
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
            trigger: "#constellations-section",
            start: "top 80%"
        }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-[#050505] text-white font-body min-h-screen overflow-x-hidden">
      
      
      <PageHeader backTo="/learn" backLabel="Academy" />
      <section className="h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(4,86,251,0.15),transparent)]" />
        <LearnIntroCard 
          category="Celestial Geometry"
          title={<>The <span className="text-[var(--gold)] italic lowercase">Constellations</span></>}
          description="Beyond the zodiac signs lie the actual star clusters. They are the mythic backdrop of our astronomical history."
        />
      </section>

      <section id="constellations-section" className="relative min-h-screen py-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-12 md:gap-24">
        {/* Sticky Background / SVG Area */}
        <div className="w-full md:w-1/2 sticky top-32 flex items-center justify-center z-0">
          <svg id="star-svg" viewBox="0 0 800 500" className="w-full h-auto overflow-visible opacity-50 md:opacity-100">
             {CONSTELLATIONS.map((c, ci) => (
               <g key={c.id}>
                  <path 
                    className="star-path"
                    d={`M ${c.dots.map(d => `${d.x} ${d.y}`).join(" L ")} Z`}
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="1.5"
                    strokeDasharray="1000"
                    strokeDashoffset="0"
                    opacity="0.4"
                  />
                  {c.dots.map((d, di) => (
                    <circle key={di} className="star-dot" cx={d.x} cy={d.y} r="3" fill="var(--color-eggshell)" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }} />
                  ))}
               </g>
             ))}
          </svg>
        </div>

        {/* Scrolling Cards Area */}
        <div className="w-full md:w-1/2 flex flex-col gap-32 relative z-10 pt-16 pb-64">
           {CONSTELLATIONS.map(c => (
             <LearnSectionCard key={c.id} category={c.dates} title={c.name} description={c.desc} className="shadow-2xl backdrop-blur-md bg-black/80" />
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
