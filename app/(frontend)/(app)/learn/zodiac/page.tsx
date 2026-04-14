"use client";

import React from "react";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import SignIcon from "@/app/components/SignIcon";

const SIGNS = [
  { name: "Aries", symbol: "♈", mod: "Cardinal Fire", desc: "The Pioneer. Independent, energetic, and courageous." },
  { name: "Taurus", symbol: "♉", mod: "Fixed Earth", desc: "The Builder. Stable, sensual, and persistent." },
  { name: "Gemini", symbol: "♊", mod: "Mutable Air", desc: "The Messenger. Curious, adaptable, and clever." },
  { name: "Cancer", symbol: "♋", mod: "Cardinal Water", desc: "The Nurturer. Intuitive, protective, and emotional." },
  { name: "Leo", symbol: "♌", mod: "Fixed Fire", desc: "The Sovereign. Creative, confident, and dramatic." },
  { name: "Virgo", symbol: "♍", mod: "Mutable Earth", desc: "The Analyst. Precise, systematic, and helpful." },
  { name: "Libra", symbol: "♎", mod: "Cardinal Air", desc: "The Diplomat. Balanced, aesthetic, and relational." },
  { name: "Scorpio", symbol: "♏", mod: "Fixed Water", desc: "The Alchemist. Intense, powerful, and transformative." },
  { name: "Sagittarius", symbol: "♐", mod: "Mutable Fire", desc: "The Explorer. Optimistic, philosophical, and free." },
  { name: "Capricorn", symbol: "♑", mod: "Cardinal Earth", desc: "The Architect. Responsible, disciplined, and ambitious." },
  { name: "Aquarius", symbol: "♒", mod: "Fixed Air", desc: "The Visionary. Progressive, unique, and humanitarian." },
  { name: "Pisces", symbol: "♓", mod: "Mutable Water", desc: "The Dreamer. Compassionate, artistic, and spiritual." }
];

export default function ZodiacGlossaryPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] font-body min-h-screen transition-colors duration-300">
      <Navbar activeHref="/learn" />
      
      <section className="pt-48 pb-24 px-6 text-center">
        <LearnIntroCard 
          category="Visual Glossary"
          title={<>The <br/><span className="text-[var(--color-y2k-blue)] italic lowercase">Zodiac</span></>}
          description="The 12 signs are the 'how' of astrology. They describe the style and modality through which planetary energy is expressed."
        />
      </section>

      <section className="px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
          {SIGNS.map(s => (
            <AstronatCard key={s.name} variant="surface" shape="asymmetric-md" className="p-8 group">
               <div className="flex justify-between items-start mb-8">
                  <div className="text-[var(--text-primary)] group-hover:text-[var(--color-y2k-blue)] group-hover:scale-110 transition-all duration-500">
                    <SignIcon sign={s.name} size={40} />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">{s.mod}</span>
               </div>
               <h3 className="font-primary text-3xl uppercase mb-2 group-hover:text-[var(--color-y2k-blue)] transition-colors">{s.name}</h3>
               <p className="text-sm opacity-60 leading-relaxed font-body">{s.desc}</p>
            </AstronatCard>
          ))}
      </section>

      <section className="h-[60vh] flex items-center justify-center">
        <LearnOutroCard 
          title={<>The Wheel <br/>Complete</>}
          description="Every chart contains all 12 signs. Even if you have no planets in a sign, it still rules a specific area of your life."
          buttonHref="/learn/viewing-the-stars"
          buttonText="Final: View the Stars"
        />
      </section>
    </div>
  );
}
