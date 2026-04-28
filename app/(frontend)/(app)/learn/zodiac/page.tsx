"use client";

import React from "react";
import { LearnIntroCard, LearnSectionCard, LearnOutroCard } from "@/app/components/learn/ScrollytellingCards";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import SignIcon from "@/app/components/SignIcon";

import { PageHeader } from "@/components/app/page-header-context";
const SIGNS = [
  { name: "Aries", dates: "Mar 21 — Apr 19", symbol: "♈", mod: "Cardinal Fire", desc: "Aries doesn't ask permission. It moves first and figures out the plan midway. The first sign of the zodiac, it carries the energy of pure beginning — the sprint before strategy, the spark before the fire. Aries people are rarely the ones who hesitate; the gift is momentum, the growth edge is learning that not everything needs to be a fight." },
  { name: "Taurus", dates: "Apr 20 — May 20", symbol: "♉", mod: "Fixed Earth", desc: "Taurus builds slowly and keeps what it builds. Fixed earth: it holds its position the way a mountain holds its shape. This is the sign that understands that the finest things \u2014 food, beauty, trust, security \u2014 are not rushed. The shadow is stubbornness; the gift is loyalty so consistent it becomes a form of love." },
  { name: "Gemini", dates: "May 21 — Jun 20", symbol: "♊", mod: "Mutable Air", desc: "Gemini processes the world through conversation, comparison, and the relentless accumulation of new angles on every question. There is no final Gemini opinion \u2014 only the latest, most interesting one. This is a sign of extraordinary range and flexibility of mind. The weakness is distraction; the gift is the ability to understand almost anyone." },
  { name: "Cancer", dates: "Jun 21 — Jul 22", symbol: "♋", mod: "Cardinal Water", desc: "Cancer doesn't love casually. When this sign commits \u2014 to a person, a place, a memory \u2014 it holds on with both hands. Cardinal water: it initiates through feeling, moves toward what needs protecting. The shell is real, and it exists for a reason. Getting past it is a privilege. Inside is a fierceness of care that most people only encounter once." },
  { name: "Leo", dates: "Jul 23 — Aug 22", symbol: "♌", mod: "Fixed Fire", desc: "Leo needs to be seen, and there is nothing shallow about that need. It is the sign of the creative self \u2014 the part of the psyche that requires an audience not out of vanity, but because expression is how it confirms it exists. At its best, Leo's visibility is generous: it shines light on everyone nearby. At its lowest, it's a spotlight held only inward." },
  { name: "Virgo", dates: "Aug 23 — Sep 22", symbol: "♍", mod: "Mutable Earth", desc: "Virgo sees what's wrong. Not because it's negative, but because its mind is calibrated to precision \u2014 the variable that doesn't fit, the detail that undermines the whole. This is the sign of mastery through iteration: getting it right, then getting it more right. The trap is perfectionism that prevents completion; the gift is work that lasts because it was done correctly." },
  { name: "Libra", dates: "Sep 23 — Oct 22", symbol: "♎", mod: "Cardinal Air", desc: "Libra experiences injustice physically \u2014 imbalance is not just an idea but a wrongness in the body. This is the sign of justice, partnership, and the belief that there is a right way for things to be arranged. Libra moves toward beauty and harmony because beauty is not aesthetic luxury but evidence that things are in their proper order." },
  { name: "Scorpio", dates: "Oct 23 — Nov 21", symbol: "♏", mod: "Fixed Water", desc: "Scorpio does not do the surface. It finds the thing beneath the thing \u2014 the wound under the story, the motive behind the gesture. Fixed water: it holds its emotional charge the way a deep lake holds cold. Scorpio doesn't forgive easily, but it doesn't forget either. That memory is how it protects the people it decides to love." },
  { name: "Sagittarius", dates: "Nov 22 — Dec 21", symbol: "♐", mod: "Mutable Fire", desc: "Sagittarius is the sign of the horizon. It aims, it travels, it philosophizes \u2014 and then it aims again. This is the sign that genuinely believes things can be better, bigger, more meaningful than they are right now, and it moves toward that belief with unusual speed. The weakness is restlessness and the perpetual sense that the answer is one country further. The gift is the optimism that makes the search worthwhile." },
  { name: "Capricorn", dates: "Dec 22 — Jan 19", symbol: "♑", mod: "Cardinal Earth", desc: "Capricorn doesn't sprint \u2014 it climbs. Cardinal earth: it initiates through structure, moves toward summit. The reputation of this sign as 'cold' or 'ambitious' misses what's actually there: a deep respect for what is real, what lasts, and what takes actual work to achieve. Capricorn is the sign of earned authority. Whatever it builds is built to outlast it." },
  { name: "Aquarius", dates: "Jan 20 — Feb 18", symbol: "♒", mod: "Fixed Air", desc: "Aquarius is the sign of the future that hasn't arrived yet. Fixed air: it holds ideas with the intensity others reserve for emotions. This is the sign that identifies the problem with the way things currently are, and refuses to stop identifying it until something changes. The weakness is detachment \u2014 loving humanity while struggling with specific humans. The gift is a vision of what's possible that others can't always see yet." },
  { name: "Pisces", dates: "Feb 19 — Mar 20", symbol: "♓", mod: "Mutable Water", desc: "Pisces absorbs. It takes in the emotional atmosphere of every room, every person, every piece of music \u2014 and it responds. The most permeable of the signs, Pisces has the unique capacity to genuinely understand perspectives that are nothing like its own, which makes it the most compassionate and the most susceptible to losing itself in the process. The practice is boundary. The gift is the ability to love without conditions." }
];


export default function ZodiacGlossaryPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] font-body min-h-screen transition-colors duration-300">
      
      
      <PageHeader backTo="/learn" backLabel="Academy" />
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
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 mb-1">{s.mod}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-30 text-[var(--color-y2k-blue)]">{s.dates}</span>
                  </div>
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
