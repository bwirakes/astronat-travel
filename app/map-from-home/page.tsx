import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/app/components/Navbar';
import { ArrowRight, Sparkles } from 'lucide-react';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/app/components/ui/accordion';
import Footer from '@/app/components/Footer';

const WORKSHOP_MODULES = [
  { num: '01', title: 'Identify Your Lines', desc: 'No astrology background needed — I will teach you the fundamentals, and then some. Discover your most supportive planetary lines globally.', bg: 'var(--color-charcoal)', text: '#fcfaf1', glyph: '♀' },
  { num: '02', title: 'Remote Activation', desc: 'Remote activation techniques that work from where you live. You’ll learn how to work with planetary themes energetically and practically.', bg: 'var(--bg-raised)', text: 'var(--text-primary)', glyph: '♃' },
  { num: '03', title: 'Evaluating Charts', desc: 'Learn how to properly evaluate your relocated charts. Be truly confident in your knowledge with my comprehensive breakdown.', bg: 'var(--color-y2k-blue)', text: '#fcfaf1', glyph: '♄' },
  { num: '04', title: 'Local Space', desc: 'Bring supportive energy into your local neighbourhood. Learn how to see local space lines from where you live.', bg: 'var(--bg-raised)', text: 'var(--text-primary)', glyph: '♅' },
  { num: '05', title: 'Spiritual Modalities', desc: 'My proprietary blend of astrocartography + spiritual methodologies (like human design and numerology) to maximize the effects.', bg: 'var(--color-charcoal)', text: '#fcfaf1', glyph: '♆' },
  { num: '06', title: 'Travel Trackers', desc: 'The AstroNat travel worksheet trackers for guided application. Walk away with a clear and robust system you can use again and again.', bg: 'var(--color-black)', text: '#fcfaf1', glyph: '♇' },
];

const WHAT_YOU_GET = [
  'A 5-module workshop with lifetime access to course updates, quizzes, case studies',
  'Step-by-step local space & remote activation techniques, supported by solid Astrocartography principles',
  'Practical checklists that integrate your lines into your life seamlessly',
  'My specific remedies for you to thrive on challenging Astrocartography lines (super unique!)',
  'My proprietary blend of other spiritual modalities to give you the best chance of thriving where you are now',
  'My Astrocartography travel tracker worksheets to help you apply the methods expertly'
];

const FAQ_ITEMS = [
  { q: "Is this workshop for everyone?", a: "Absolutely! Everyone should have access to such knowledge to improve their current living conditions. The concepts are applicable to everyone regardless of nationality, race or ethnicity." },
  { q: "Will this change my circumstances overnight?", a: "This is not a magic spell or instant fix. Your natal chart will always be the dominant influence. Remote activation works by shifting how you interact with energy, opportunities, and environments over time. Many people notice subtle but meaningful changes in clarity, ease, and momentum shortly after—but results depend on consistent engagement and practice." },
  { q: "Do I need to travel or move to benefit from this workshop?", a: "Not at all! This workshop is specifically designed for people who can’t or don’t want to relocate right now. You’ll learn practical ways to work with supportive planetary lines from anywhere in the world—without packing up your life or booking a flight." },
  { q: "Do I need to understand astrology or astrocartography beforehand?", a: "Not at all. Everything is explained in simple, accessible language. You don’t need to know how to read charts or maps in advance—this workshop walks you through what matters and how to apply it." },
  { q: "Can remote activation replace moving to a better location?", a: "Remote activation is not a replacement for relocation—it’s a powerful alternative. For many people, it helps reduce challenging energies where they are and call in supportive ones until moving becomes possible (or no longer necessary)." },
  { q: "What if I live on a “challenging” line right now?", a: "That’s actually one of the best reasons to invest in this course. You’ll learn ways to soften, balance, and consciously work with difficult energies rather than feeling stuck or drained by them. You don’t have to fight your location—you can work with it wherever you are right now." },
  { q: "Will I need my exact birth time?", a: "A reasonably accurate birth time is helpful, but not always required. If birth time uncertainty applies to you, you’ll still gain value from understanding planetary themes and activation principles." },
  { q: "What are your cancellation & refund policies?", a: "All my courses and workshops should be purchased only when you feel aligned with my teachings. You have lifetime access to all updates, videos, case studies, live calls & worksheets. This should be a heart-led decision, there are no refunds for any courses." }
];

export default function MapFromHomePage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen relative overflow-hidden font-body transition-colors duration-300">
      <Navbar hideAuth={true} />

      {/* ── PAGE HERO ── */}
      <section className="border-b border-[var(--surface-border)] pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center relative">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-0.5 bg-[var(--color-spiced-life)]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-spiced-life)]">Workshop</span>
            </div>
            
            <div className="relative">
              <span className="absolute font-secondary text-[12rem] md:text-[18rem] text-[var(--text-primary)] leading-[0.5] -top-12 -right-4 md:-right-10 z-[-1] pointer-events-none opacity-[0.04]">♄</span>
              <h1 className="font-primary text-4xl md:text-6xl lg:text-7xl font-semibold leading-[0.9] uppercase text-[var(--text-primary)]">
                Map From <br /> 
                <span className="text-[var(--color-spiced-life)] block mt-1">Home!</span>
              </h1>
            </div>

            <div className="mt-6 space-y-3">
                <p className="font-body text-xs md:text-base leading-relaxed opacity-90 text-[var(--text-secondary)] max-w-lg">
                Astrocartography shows you where your energy <strong className="font-secondary italic font-normal text-base md:text-xl text-[var(--text-primary)]">naturally flows, expands, contracts, and thrives</strong> around the world.
                </p>
                <div className="space-y-3 text-xs md:text-base leading-relaxed opacity-90 text-[var(--text-secondary)] max-w-lg mt-3 border-l-2 border-[var(--color-y2k-blue)] pl-4">
                    <p>Most people think: <strong>“I have to move there to feel better”</strong></p>
                    <p>But your life doesn't support that now. Work, family, and budgets keep you stuck. Passport is not strong.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Link href="#buy" className="btn-primary text-center px-6 py-4 font-mono uppercase text-[10px] tracking-widest rounded-[var(--shape-asymmetric-md)] w-full sm:w-auto hover:bg-[var(--color-info)]">
                    Enroll Now ($397) <ArrowRight size={14} className="inline-block ml-1 -translate-y-0.5" />
                </Link>
                </div>
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="w-full aspect-[4/5] relative overflow-hidden bg-black rounded-[2rem]">
                 <Image 
                    src="/astronat-hero.jpg" 
                    alt="Map From Home Workshop - AstroNat" 
                    fill 
                    className="object-cover opacity-90 transition-opacity duration-700 hover:opacity-100"
                    priority
                 />
            </div>
          </div>
        </div>
      </section>

      {/* ── THE TRUTH SECTION ── */}
      <section className="bg-[var(--color-charcoal)] border-b border-[var(--surface-border)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto w-full px-6 flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/3 w-full shrink-0">
             <div className="w-full aspect-[4/5] relative overflow-hidden rounded-[2rem]">
                <Image src="/nat-1.jpg" alt="Editorial Astrocartography" fill className="object-cover" />
             </div>
          </div>
          <div className="md:w-2/3 w-full text-[#fcfaf1]">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-acqua)] mb-4">
              Here's the truth...
            </div>
            <h2 className="font-primary text-3xl md:text-5xl uppercase leading-[0.9] mb-6 text-white">
               You can live that life, right where you are now.
            </h2>
            <div className="space-y-4 font-body text-sm md:text-base opacity-90 text-pretty [&_p]:text-white">
               <p>You <em className="italic text-[var(--color-acqua)]">don’t have to uproot your whole life</em> to work with powerful planetary lines — even the ones that pull you toward places you’ve never visited.</p>
               <p className="font-semibold text-lg font-secondary lowercase mt-6 mb-2">If you’ve ever felt…</p>
               <ul className="space-y-2 opacity-80 list-disc pl-5">
                  <li className="pl-1">Stuck because travel feels too expensive, too complicated, or simply unrealistic right now</li>
                  <li className="pl-1">Pulled toward places you don’t yet know how to access physically because of logistics (eg: weak passports)</li>
                  <li className="pl-1">Frustrated that your current location feels “off,” but moving isn’t an option</li>
               </ul>
               <p className="font-semibold text-[#fcfaf1] bg-[var(--color-y2k-blue)] inline-block px-3 py-1 mt-4 uppercase tracking-wide text-xs rounded-sm">… then this is MADE for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STUCK BIO SECTION ── */}
      <section className="bg-[var(--color-spiced-life)] py-12 md:py-20 text-[#111b2e] border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
           <div>
              <p className="font-secondary text-2xl md:text-3xl mb-6 leading-tight">This workshop is created to help those who are stuck where they are.</p>
              <ul className="space-y-3 font-body opacity-90 text-sm md:text-base text-pretty list-none">
                 <li>✨ You shouldn’t need to cross borders to feel supported by your natal chart's strengths.</li>
                 <li>✨ You don't need a huge travel or relocation budget to work with your best lines in the world.</li>
                 <li>✨ And you shouldn’t feel “behind” because you have to be realistic about your life.</li>
              </ul>
              <p className="mt-6 font-primary text-lg md:text-xl text-[#fcfaf1] leading-tight">
                 I created this workshop for the average person who needs energetic alignment in their life, <em className="italic text-[#111b2e]">but are only able to move domestically within national borders, without breaking the bank.</em>
              </p>
           </div>
            <div className="relative w-full aspect-square overflow-hidden rounded-[2rem]">
               <Image src="/green_phone.png" alt="Y2K Phone" fill className="object-cover grayscale hover:grayscale-0 transition-opacity duration-700" />
           </div>
        </div>
      </section>

      {/* ── WHY IM TEACHING THIS ── */}
      <section className="bg-[var(--bg-raised)] border-b border-[var(--surface-border)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
          <div className="relative w-full aspect-square md:aspect-[3/4] overflow-hidden rounded-[2rem]">
             <Image src="/nat-2.jpg" alt="Astrocartography Path" fill className="object-cover" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">
              Context
            </div>
            <h2 className="font-primary text-4xl md:text-5xl uppercase leading-[0.9] mb-6 text-[var(--text-primary)]">
               Why I'm teaching this...
            </h2>
            <div className="space-y-4 font-body text-sm md:text-base opacity-90 text-pretty">
               <p>As a Singaporean, and as someone who has lived in a region with vast economic disparities, I’m aware that not everyone has the resources to pack up and move abroad — even if they feel called to another place.</p>
               <p className="font-secondary italic text-2xl text-[var(--text-primary)]">Relocation isn’t always realistic.</p>
               <p>For many people, life is built around <strong>family responsibilities, stable income, visas, caregiving, and practical constraints.</strong></p>
               <p>Astrocartography is often taught from a Western lens — assuming freedom of movement, disposable income, and ample time. That doesn't consider <strong>a large number of people who are doing their best within real-world limitations.</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NERVOUS SYSTEM BIO ── */}
      <section className="bg-[var(--bg-raised)] py-12 md:py-20 text-[var(--text-primary)] border-b border-[var(--surface-border)]">
         <div className="max-w-7xl mx-auto w-full px-6 flex flex-col items-center text-center">
            <h2 className="font-secondary text-3xl md:text-5xl mb-8 leading-tight">This isn't just about moving, it's about...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left w-full max-w-2xl font-body text-sm md:text-base text-pretty">
               <div className="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">
                  ✨ Choosing environments that <strong className="text-[var(--text-primary)]">support your nervous system</strong>
               </div>
               <div className="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">
                  ✨ Building a life that feels <strong className="text-[var(--text-primary)]">grounded and emotionally sustainable</strong>
               </div>
               <div className="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">
                  ✨ Learning to trust that <strong className="text-[var(--text-primary)]">you can change your environment</strong> to bring out the best in you
               </div>
               <div className="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">
                  ✨ You will finally understand <strong className="text-[var(--text-primary)]">how you’re meant to thrive.</strong>
               </div>
            </div>
         </div>
      </section>

      {/* ── COURSE MODULES ── */}
      <section className="bg-[var(--bg-raised)] py-12 md:py-20 border-b border-[var(--surface-border)]">
         <div className="max-w-7xl mx-auto w-full px-6">
           <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-dotted border-[var(--color-spiced-life)] pb-3 mb-10 gap-2">
             <h2 className="font-primary text-2xl md:text-4xl lg:text-5xl uppercase leading-none text-[var(--text-primary)]">In this workshop, you'll learn...</h2>
             <span className="font-mono text-[9px] tracking-widest shrink-0 mb-1 text-[var(--text-secondary)]">Curriculum</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WORKSHOP_MODULES.map((card, i) => (
               <div key={i} className="relative overflow-hidden min-h-[300px] flex flex-col p-6 shadow-sm rounded-[2rem]" style={{ 
                  background: card.bg, color: card.text,
                  border: card.bg.includes('--bg') ? '1px solid var(--surface-border)' : 'none'
               }}>
                  <div className="font-mono text-[9px] mb-4 opacity-50 uppercase tracking-tighter" style={{ color: card.text }}>Module — {card.num}</div>
                  <h4 className="font-secondary text-xl md:text-2xl mb-4 leading-snug font-normal lowercase capitalize" style={{ color: card.text }}>{card.title}</h4>
                  <p className="font-body text-sm leading-relaxed opacity-80 flex-1" style={{ color: card.text }}>{card.desc}</p>
                  
                  <div className="absolute -bottom-4 right-1 font-secondary text-8xl opacity-[0.03] pointer-events-none" style={{ color: card.text }}>
                     {card.glyph}
                  </div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ── */}
      <section className="bg-black py-24 md:py-32">
         <div className="max-w-7xl mx-auto w-full px-6 text-center">
            <h2 className="font-secondary text-3xl md:text-5xl lg:text-6xl text-[#fcfaf1] leading-tight mb-8 lowercase font-normal italic">
               "Our house is our corner of the world. As has often been said, it is our first universe, a real cosmos in every sense of the word."
            </h2>
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[var(--color-y2k-blue)]">
               — Gaston Bachelard
            </div>
         </div>
      </section>

      {/* ── WHY LEARN FROM ME BIO ── */}
      <section className="bg-[var(--color-y2k-blue)] py-16 md:py-24 text-[#fcfaf1]">
         <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <div className="flex flex-col justify-center">
               <div className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-80 mb-4 text-[#fcfaf1]">Authority</div>
               <h2 className="font-primary text-4xl md:text-5xl uppercase leading-[0.9] text-[#fcfaf1] mb-8">
                 Why should you <br/> <span className="text-[var(--color-charcoal)]">learn from me?</span>
               </h2>
               
               <div className="space-y-5 text-sm md:text-base leading-relaxed opacity-90 max-w-xl text-[#fcfaf1] text-pretty">
                  <p>With 6 planets AND the North Node in my 9th house of travel, teaching, publishing, I have <strong>deliberately experimented and travelled</strong> to both supportive and challenging lines to gather this knowledge, and gone through intense and life-altering experiences to gather the knowledge I have. Trust me, I have <em>been through it.</em></p>
                  <p>In true Capricorn fashion, <strong>I transmute all of that</strong> and have <strong>literally gone to the ends of the earth</strong> to bring you my hard-earned wisdom and real-world knowledge!</p>
                  <p>Considerable financial and energetic resources were spent to harness my skills, techniques, and insights so that I can create <strong>the most rigorous and value-added workshops</strong> for you.</p>
               </div>
            </div>
            
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[2rem]">
                <Image 
                 src="/nat-3.jpg" 
                 alt="Natalia - Teaching Astrocartography" 
                 fill 
                 className="object-cover grayscale hover:grayscale-0 transition-opacity duration-1000" 
                />
            </div>
         </div>
      </section>
      
      {/* ── PRODUCT BANNER / CTA STRIP ── */}
      <section id="buy" className="bg-[#fcfaf1] py-16 md:py-24 text-[var(--color-charcoal)] border-t border-[var(--surface-border)]">
         <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-12 items-center">
           <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50 mb-4 text-[var(--color-charcoal)]">Action</div>
              <h2 className="font-primary text-4xl md:text-5xl lg:text-6xl leading-[1] uppercase mb-4 text-[var(--color-charcoal)] font-semibold">
                 What you'll get <br/> in the <br/><span className="text-[var(--color-y2k-blue)]">Workshop.</span>
              </h2>
              <div className="font-secondary text-2xl text-[var(--color-spiced-life)] mb-8">$397 <span className="text-sm opacity-60 ml-2 font-body italic text-[var(--color-charcoal)]">or 2 monthly payments of $199</span></div>
              
              <Link href="https://astronat.podia.com/map-from-home-workshop/buy?offer_id=4918750" className="btn-primary block text-center px-8 py-5 font-mono uppercase text-xs tracking-widest rounded-[2rem] w-full hover:bg-[var(--color-info)] shadow-md">
                 I want in! <ArrowRight size={16} className="inline-block ml-2 -translate-y-0.5" />
              </Link>
           </div>
           
           <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-[var(--surface-border)] shadow-sm">
              <div className="font-secondary text-xl mb-6 lowercase">Everything included:</div>
              <ul className="flex flex-col gap-4">
                 {WHAT_YOU_GET.map((perk, i) => (
                    <li key={i} className="flex gap-4 items-start">
                       <span className="shrink-0 mt-1"><Sparkles size={16} className="text-[var(--color-y2k-blue)]"/></span>
                       <span className="text-sm opacity-80 leading-relaxed font-body">{perk}</span>
                    </li>
                 ))}
              </ul>
           </div>
         </div>
      </section>

      {/* ── DEEP PITCH SECTION ── */}
      <section className="bg-[var(--color-charcoal)] text-[#fcfaf1] py-16 md:py-24 border-t border-white/10">
         <div className="max-w-7xl mx-auto w-full px-6 text-center">
            <h2 className="font-primary text-3xl md:text-5xl uppercase leading-[0.9] text-[var(--color-spiced-life)] mb-10">Get lifetime access to my signature course for only USD $397!</h2>
            <div className="text-left space-y-6 opacity-90 text-sm md:text-base font-body text-pretty [&_p]:text-white">
               <p>👉 This is THE most comprehensive local space & remote activation workshops out there, with modules and tips that I have not seen in other courses. The methods are designed to be used together for compounded results.</p>
               <p>👉 The financial and emotional costs of moving to the wrong city, dating people you are not aligned with or working with business partners from countries which are not your best lines - can be very damaging or traumatic.</p>
               <p>👉 The knowledge and value stay with you for the rest of your life, empowering you to make the best decisions for you and your loved ones.</p>
            </div>
            <div className="mt-10 font-secondary text-xl md:text-2xl italic leading-tight text-center text-[var(--color-acqua)]">
               Invest in the clarity and confidence that you will get from knowing exactly where and how to activate different areas of your life with specific results, both at home and abroad.
            </div>
         </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[var(--bg)] py-16 md:py-24 border-t border-[var(--surface-border)]">
         <div className="max-w-7xl mx-auto w-full px-6">
           <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-[var(--surface-border)] pb-3 mb-12 gap-2">
             <h2 className="font-primary text-4xl md:text-5xl lg:text-6xl uppercase leading-none text-[var(--text-primary)]">Intelligence FAQ</h2>
             <span className="font-mono text-[9px] tracking-widest shrink-0 mb-1 text-[var(--color-y2k-blue)]">Queries</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
             <div>
                <p className="mt-2 text-sm opacity-50 leading-relaxed text-[var(--text-secondary)]">Common questions regarding remote activation, prerequisites, and methodology.</p>
             </div>
             <div>
                <Accordion type="single" collapsible variant="editorial">
                   {FAQ_ITEMS.map((item, i) => (
                      <AccordionItem key={i} value={`item-${i}`} showIndex={i + 1}>
                         <AccordionTrigger className="text-left font-secondary text-lg md:text-xl font-normal lowercase">
                            {item.q}
                         </AccordionTrigger>
                         <AccordionContent className="pb-8 text-[var(--text-secondary)] opacity-80 leading-relaxed text-sm max-w-2xl">
                            {item.a}
                         </AccordionContent>
                      </AccordionItem>
                   ))}
                </Accordion>
             </div>
          </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
