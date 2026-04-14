"use client";

import React from "react";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { AstronatCard } from "@/app/components/ui/astronat-card";

export default function MaleficBeneficLearnPage() {
  return (
    <div className="bg-black text-white font-body min-h-screen">
      <Navbar activeHref="/learn" />
      
      <section className="h-screen flex items-center justify-center">
        <LearnIntroCard 
          category="Planetary Camps"
          title={<>The Great <br/><span className="text-[var(--color-y2k-blue)] italic lowercase">Divide.</span></>}
          description="In traditional astrology, planets are divided by their essential nature: those that bring ease (Benefic) and those that bring challenge (Malefic)."
        />
      </section>

      <section className="py-32 px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
         {/* Benefics */}
         <div className="flex flex-col gap-12">
            <div className="font-primary text-5xl uppercase text-[var(--color-acqua)]">The Benefics</div>
            <p className="opacity-70 leading-relaxed text-lg italic">"The soft landing, the abundance, the easy yes."</p>
            
            <AstronatCard variant="glass" shape="organic" className="p-10 border-[var(--color-acqua)]/20">
               <h3 className="font-primary text-3xl mb-4 text-[var(--color-acqua)]">Venus & Jupiter</h3>
               <p className="opacity-80">These planets expand, nurture, and harmonize. They represent the areas of life where you receive blessings without struggle.</p>
            </AstronatCard>

            <div className="w-full h-80 bg-[var(--color-acqua)]/10 rounded-[var(--shape-organic-1)] flex items-center justify-center text-4xl overflow-hidden opacity-50 grayscale hover:grayscale-0 transition-all">
                {/* Visual Placeholder for editorial photo */}
                [ PASTEL EDITORIAL ]
            </div>
         </div>

         {/* Malefics */}
         <div className="flex flex-col gap-12">
            <div className="font-primary text-5xl uppercase text-[var(--color-spiced-life)]">The Malefics</div>
            <p className="opacity-70 leading-relaxed text-lg italic">"The strict teacher, the severance, the hard no."</p>
            
            <AstronatCard variant="charcoal" shape="cut-md" className="p-10 border-[var(--color-spiced-life)]/20">
               <h3 className="font-primary text-3xl mb-4 text-[var(--color-spiced-life)]">Mars & Saturn</h3>
               <p className="opacity-80">These planets cut, restrict, and challenge. They are not 'evil', but they create the friction necessary for growth and mastery.</p>
            </AstronatCard>

            <div className="w-full h-80 bg-[var(--color-spiced-life)]/10 rounded-[var(--shape-asymmetric-md)] flex items-center justify-center text-4xl overflow-hidden opacity-50 grayscale hover:grayscale-0 transition-all">
                {/* Visual Placeholder for editorial photo */}
                [ DARK EDITORIAL ]
            </div>
         </div>
      </section>

      <section className="h-screen flex items-center justify-center">
        <LearnOutroCard 
          title={<>Balance of <br/>Forces</>}
          description="Every chart needs both. Too much ease prevents growth; too much friction prevents survival. The goal is integration."
          buttonHref="/learn/zodiac"
          buttonText="Explore the Zodiac"
        />
      </section>
    </div>
  );
}
