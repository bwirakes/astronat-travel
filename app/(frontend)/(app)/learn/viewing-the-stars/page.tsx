"use client";

import React from "react";
import Navbar from "@/app/components/Navbar";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { AstronatCard } from "@/app/components/ui/astronat-card";

export default function ViewingTheStarsPage() {
  return (
    <div className="bg-[#050505] text-white font-body min-h-screen">
      <Navbar activeHref="/learn" />
      
      {/* Immersive Backdrop section */}
      <section className="h-screen relative flex items-center justify-center overflow-hidden">
        <div 
           className="absolute inset-0 z-0 bg-cover bg-center grayscale opacity-40 scale-110"
           style={{ backgroundImage: "url('/moody-landscape.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-1" />
        
        <div className="relative z-10 text-center">
          <LearnIntroCard 
            category="Practical Application"
            title={<>Track <br/><span className="text-[var(--gold)] italic lowercase">The Light.</span></>}
            description="Astrology is not just a theory—it is a live event happening above you right now. Here is how to work with it daily."
          />
        </div>
      </section>

      <section className="py-32 px-12 max-w-5xl mx-auto space-y-12">
         <AstronatCard variant="glass" shape="asymmetric-lg" className="p-12 border-white/10">
            <h3 className="font-primary text-4xl uppercase mb-6 text-[var(--gold)]">1. Watch the Moon</h3>
            <p className="opacity-70 text-lg leading-relaxed">
              The moon changes signs every 2.5 days. It is the fastest-moving pointer on the cosmic clock. Notice how your emotional 'weather' shifts as the moon moves through the elements—from Fire (energy) to Earth (grounding) to Air (talkative) to Water (sensitive).
            </p>
         </AstronatCard>

         <AstronatCard variant="glass" shape="organic" className="p-12 border-white/10">
            <h3 className="font-primary text-4xl uppercase mb-6 text-[var(--color-y2k-blue)]">2. Learn Your Transits</h3>
            <p className="opacity-70 text-lg leading-relaxed">
              A transit is when a planet currently in the sky passes over a degree occupied by a planet in your birth chart. These are the windows of opportunity and the portals for growth. 
            </p>
         </AstronatCard>
      </section>

      <section className="h-screen flex items-center justify-center">
        <LearnOutroCard 
          title={<>Begin Your <br/>Journey</>}
          description="You are now equipped with the first principles of the stars. Go forth and read the heavens."
          buttonHref="/dashboard"
          buttonText="Return to Dashboard"
        />
      </section>
    </div>
  );
}
