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

// --- Constants ---
const TECHNIQUES = [
  { num: '01', title: 'Geodetic Ascendant & Midheaven', desc: 'Every location has a fixed Ascendant and Midheaven that belong to the earth, not to any individual.', bg: 'var(--color-charcoal)', text: '#fcfaf1', glyph: 'AC' },
  { num: '02', title: 'Geodetic Equivalents', desc: 'Your natal planets each have a "geodetic equivalent" — the longitude where that planet sits.', bg: 'var(--bg-raised)', text: 'var(--text-primary)', glyph: '♀' },
  { num: '03', title: 'Outer Planet Transits', desc: 'Tracking when slow-moving outer planets station on or transit the geodetic angles of a city or nation.', bg: 'var(--color-y2k-blue)', text: '#fcfaf1', glyph: '♄' },
  { num: '04', title: 'Local Space Combined', desc: 'Layering geodetic techniques with local space astrology creates a multi-dimensional map.', bg: 'var(--bg-raised)', text: 'var(--text-primary)', glyph: '∗' },
  { num: '05', title: 'Geodetic Returns', desc: 'A Solar Return relocated to a place that activates your geodetic angles can intensify the themes.', bg: 'var(--color-charcoal)', text: '#fcfaf1', glyph: '☽' },
  { num: '06', title: 'Ingress Charts', desc: 'Casting an Aries Ingress, or other seasonal chart for a specific city is a foundational technique.', bg: 'var(--color-black)', text: '#fcfaf1', glyph: '♈' },
];

const MUNDANE_CYCLES = [
  { glyph: '♃♄', name: 'Jupiter–Saturn (~20 yrs)', desc: 'The "great chronocrator" cycle. Historically correlated with political regime changes and economic paradigm shifts.' },
  { glyph: '♄♇', name: 'Saturn–Pluto (~35 yrs)', desc: 'Associated with periods of structural hard reset — austerity, authoritarian pressure, and disassembly.' },
  { glyph: '♆♇', name: 'Neptune–Pluto (~493 yrs)', desc: 'The longest observable outer planet cycle. Correlated with civilisation-level transformations.' }
];

const FAQ_ITEMS = [
  { q: 'What is the difference between geodetic astrology and astrocartography?', a: 'Astrocartography (ACG) is a personal system: it projects your natal planets onto the globe based on where each planet was rising, setting, or culminating at your birth. Geodetic astrology is impersonal and fixed — it assigns zodiac degrees to longitudes based on a permanent rule (0° Aries = Greenwich).' },
  { q: 'Is geodetic astrology actually accurate? What does the evidence say?', a: 'There is a significant body of case studies showing striking correlations between outer planet transits to geodetic angles and major collective events. It is a powerful heuristic for pattern recognition.' }
];

const CTA_OPTIONS = [
  { tag: 'Most popular', title: 'ACG Deep Dive — includes geodetic overlay', primary: true },
  { tag: 'Self-study', title: 'Geodetic & Mundane Intensive Course', primary: false },
  { tag: 'Free resource', title: 'Research Notes — cycle analysis', primary: false }
];

const FOOTER_COLUMNS = [
  { title: 'Services', links: ['ACG Deep Dive', 'Travel Electional', 'Geodetic Reading'] },
  { title: 'Learn', links: ['Travel Intensive', 'Geodetic Course', 'Research Notes'] },
  { title: 'Connect', links: ['Instagram', 'YouTube', 'Contact'] }
];

export default function GeodeticMundanePage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen relative overflow-hidden font-body transition-colors duration-300">
      {/* ── NAV ── */}
      <Navbar hideAuth={true} />

      {/* ── PAGE HERO ── */}
      <section className="border-b border-[var(--surface-border)] pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="max-w-5xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center relative">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-0.5 bg-[var(--color-y2k-blue)]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-y2k-blue)]">Locational Intelligence</span>
            </div>
            
            <div className="relative">
              <span className="absolute font-display-alt-2 text-5xl md:text-7xl lg:text-7xl text-[var(--color-spiced-life)] leading-[0.5] -top-8 -left-5 z-[-1] pointer-events-none opacity-80">The world</span>
              <h1 className="font-primary text-4xl md:text-5xl lg:text-6xl font-semibold leading-[0.95] uppercase text-[var(--text-primary)]">
                Where the <br /> 
                <span className="text-[var(--color-y2k-blue)]">Sky</span><br/> Meets the Earth
              </h1>
            </div>

            <div className="mt-8 space-y-4">
                <p className="font-body text-sm md:text-base leading-relaxed opacity-90 text-[var(--text-secondary)] max-w-lg">
                For centuries, the most rigorous branch of the tradition has been turned outward — tracking the astrology of <strong className="font-secondary italic font-normal text-lg md:text-xl text-[var(--text-primary)]">nations, places, and collective turning points.</strong> Geodetic and mundane astrology are where mathematics meets geography.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="#" className="btn-primary text-center px-6 py-3 font-mono uppercase text-[9px] tracking-widest rounded-[var(--shape-asymmetric-md)] w-full sm:w-auto hover:bg-[var(--color-info)]">
                    Book a Reading <ArrowRight size={12} className="inline-block ml-1" />
                </Link>
                <Link href="#" className="btn-secondary text-center px-6 py-3 font-mono uppercase text-[9px] tracking-widest rounded-[var(--shape-asymmetric-md)] w-full sm:w-auto">
                    Explore the Course
                </Link>
                </div>
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="w-full aspect-square relative overflow-hidden" style={{ clipPath: 'var(--cut-lg)' }}>
                 <Image 
                    src="/nat-1.jpg" 
                    alt="Natalia - Founder of AstroNat" 
                    fill 
                    className="object-cover"
                    priority
                 />
            </div>
          </div>
        </div>
      </section>

      {/* ── INTRO QUOTE ── */}
      <section className="bg-[var(--color-charcoal)] border-b border-[var(--surface-border)] py-12 md:py-20">
        <div className="max-w-4xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-[1fr_3.5fr] gap-6 md:gap-12">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#fcfaf1] opacity-60 pt-1">
            Perspectives
          </div>
          <p className="font-secondary text-xl md:text-2xl lg:text-3xl leading-snug font-normal text-[#fcfaf1]">
            "Mundane astrology is the oldest branch of the tradition. Geodetic astrology is one of its most precise tools — mapping the zodiac onto longitude, so that <strong className="text-[var(--color-y2k-blue)] font-normal italic lowercase">every degree corresponds to a longitude.</strong>"
          </p>
        </div>
      </section>

      {/* ── EXPLAINER: GEODETIC ── */}
      <section className="bg-[var(--bg)] py-12 md:py-20">
        <div className="max-w-5xl mx-auto w-full px-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-[var(--text-primary)] pb-3 mb-10 gap-2">
             <h2 className="font-primary text-2xl md:text-4xl lg:text-5xl uppercase leading-none text-[var(--text-primary)]">The Geodetic Template</h2>
             <span className="font-mono text-[9px] tracking-widest shrink-0 mb-1 text-[var(--text-secondary)]">01 / 04</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
             <div>
               <h3 className="font-secondary text-xl md:text-2xl mb-3 text-[var(--text-primary)]">A zodiac fixed to the globe</h3>
               <p className="font-body text-sm md:text-base leading-relaxed mb-4 opacity-90 text-[var(--text-secondary)]">
                 Geodetic astrology is a system in which 0° Aries is permanently anchored to the <strong className="font-secondary italic font-semibold text-[var(--text-primary)]">Greenwich Meridian (0° longitude)</strong>. Each degree of the tropical zodiac corresponds to one degree of geographical longitude.
               </p>
               <p className="font-body text-sm md:text-base leading-relaxed mb-8 opacity-90 text-[var(--text-secondary)]">
                 The result is a static planetary map of the world — a collective natal chart baked into the earth itself.
               </p>
               
               <h3 className="font-secondary text-xl md:text-2xl mb-3 text-[var(--text-primary)]">Geodetic equivalents</h3>
               <p className="font-body text-sm md:text-base leading-relaxed opacity-90 text-[var(--text-secondary)]">
                 Your natal planets fall on a specific geodetic longitude. It reveals places where you feel a particular planetary energy more acutely.
               </p>
             </div>
             
             <div className="flex flex-col">
               <div className="bg-[var(--color-charcoal)] p-5 md:p-6 relative overflow-hidden" style={{ clipPath: 'var(--cut-md)' }}>
                  <div className="font-mono text-[8px] tracking-widest uppercase mb-4 opacity-60 text-[#fcfaf1]">The Geodetic Pivot — 0° Aries</div>
                  <div className="w-full h-[200px] md:h-[240px] relative bg-black rounded-[var(--radius-sm)] overflow-hidden border border-white/5">
                      <svg viewBox="0 0 480 240" className="w-full h-full preserve-aspect-ratio text-white opacity-80">
                          <rect width="480" height="240" fill="none"/>
                          <path d="M30,60 Q50,50 65,70 Q70,90 60,120 Q55,150 65,180 Q55,195 45,190 Q35,175 40,150 Q30,130 25,100 Z" fill="rgba(4,86,251,0.2)" stroke="var(--color-y2k-blue)" />
                          <path d="M180,40 Q210,35 220,55 Q225,80 215,100 Q220,125 210,160 Q200,195 190,195 Q175,185 175,160 Q165,130 170,100 Q165,70 175,50 Z" fill="rgba(4,86,251,0.2)" stroke="var(--color-y2k-blue)"/>
                          <line x1="240" y1="0" x2="240" y2="240" stroke="var(--color-spiced-life)" strokeWidth="1" strokeDasharray="4,4"/>
                          <text x="248" y="20" fill="var(--color-spiced-life)" fontSize="8" fontFamily="var(--font-mono)">0° ARIES</text>
                      </svg>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 mt-4 gap-3">
                  {[
                    { n: '1°', label: 'Zod = 1° Long' },
                    { n: '360°', label: 'Global Map' },
                    { n: '12', label: 'Signs mapped' }
                  ].map((fact, i) => (
                     <div key={i} className="border border-[var(--surface-border)] p-3 md:p-4 bg-[var(--bg-raised)]" style={{ clipPath: 'var(--cut-sm)' }}>
                        <div className="font-primary text-xl md:text-2xl text-[var(--color-y2k-blue)] leading-none">{fact.n}</div>
                        <div className="font-mono text-[8px] uppercase opacity-60 mt-1 text-[var(--text-tertiary)]">{fact.label}</div>
                     </div>
                  ))}
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── TECHNIQUE CARDS ── */}
      <section className="bg-[var(--bg-raised)] py-12 md:py-20 border-y border-[var(--surface-border)]">
         <div className="max-w-5xl mx-auto w-full px-6">
           <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-dotted border-[var(--color-y2k-blue)] pb-3 mb-10 gap-2">
             <h2 className="font-primary text-2xl md:text-4xl lg:text-5xl uppercase leading-none text-[var(--text-primary)]">Techniques</h2>
             <span className="font-mono text-[9px] tracking-widest shrink-0 mb-1 text-[var(--text-secondary)]">02 / 04</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TECHNIQUES.map((card, i) => (
               <div key={i} className="relative overflow-hidden min-h-[300px] flex flex-col p-5 md:p-6" style={{ 
                  background: card.bg, color: card.text,
                  border: card.bg.includes('--bg') ? '1px solid var(--surface-border)' : 'none',
                  clipPath: 'var(--cut-md)'
               }}>
                  <div className="font-mono text-[8px] mb-4 opacity-50 uppercase tracking-tighter" style={{ color: card.text }}>{card.num} — research</div>
                  <h4 className="font-secondary text-lg md:text-xl mb-3 leading-snug font-normal lowercase capitalize" style={{ color: card.text }}>{card.title}</h4>
                  <p className="font-body text-xs md:text-sm leading-relaxed opacity-80 flex-1" style={{ color: card.text }}>{card.desc}</p>
                  <Link href="#" className={`font-mono text-[9px] uppercase tracking-widest mt-4 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity`} style={{ color: card.text }}>
                     Go Deep <ArrowRight size={10} />
                  </Link>
                  
                  <div className="absolute -bottom-2 right-2 font-secondary text-7xl opacity-5 pointer-events-none" style={{ color: card.text }}>
                     {card.glyph}
                  </div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MUNDANE SECTION ── */}
      <section className="bg-[#111b2e] py-12 md:py-20">
         <div className="max-w-5xl mx-auto w-full px-6">
           <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-white/20 pb-3 mb-10 gap-2">
             <h2 className="font-primary text-2xl md:text-4xl lg:text-5xl uppercase leading-none text-white">Mundane Cycles</h2>
             <span className="font-mono text-[9px] tracking-widest shrink-0 mb-1 text-white/60">03 / 04</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16">
             <div className="flex flex-col justify-center">
               <h3 className="font-secondary text-xl md:text-2xl mb-4 text-[#fcfaf1]">The astrology of the collective</h3>
               <p className="font-body text-sm md:text-base leading-relaxed mb-8 opacity-80 text-[#fcfaf1]">
                 Mundane astrology reveals the invisible architecture of the times we live in — nations, governments, and cultural resets.
               </p>
               
               <div className="flex flex-col">
                 {MUNDANE_CYCLES.map((cycle, i) => (
                    <div key={i} className="flex gap-4 py-5 border-t border-white/10">
                       <div className="font-secondary text-xl text-[var(--color-acqua)] leading-none shrink-0">{cycle.glyph}</div>
                       <div>
                          <div className="font-body font-semibold text-[10px] md:text-xs tracking-widest uppercase mb-1 text-[#fcfaf1]">{cycle.name}</div>
                          <div className="text-xs md:text-sm opacity-70 leading-relaxed text-balance text-[#fcfaf1]">{cycle.desc}</div>
                       </div>
                    </div>
                 ))}
               </div>
             </div>
             
             <div>
                <div className="w-full aspect-[4/5] relative rounded-[var(--shape-asymmetric-lg)] overflow-hidden">
                    <Image 
                        src="/nat-2.jpg" 
                        alt="Natalia Researching Mundane Cycles" 
                        fill 
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                        <div className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-80 mb-3 flex items-center gap-2 text-white">
                            <Sparkles size={12} className="text-[var(--color-spiced-life)]" /> Case Study
                        </div>
                        <h4 className="font-secondary text-lg md:text-xl font-normal mb-3 leading-tight text-white capitalize">Active cycles</h4>
                        <p className="text-xs opacity-90 leading-relaxed mb-6 text-white">Tracking outer planet ingresses with geodetic overlays for the coming decade.</p>
                        
                        <Link href="#" className="inline-flex items-center gap-2 bg-white text-black px-5 py-3 font-mono uppercase text-[9px] tracking-widest hover:bg-[#fcfaf1] transition-colors">
                            Read the Notes <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── INTERSECTION SECTION ── */}
      <section className="bg-[var(--color-spiced-life)] py-12 md:py-20">
        <div className="max-w-5xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
           <div className="flex flex-col justify-center text-[#111b2e]">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-60 mb-4 text-[#111b2e]">Synthesis</div>
              <div className="relative mb-6">
                 <span className="font-display-alt-2 text-3xl md:text-5xl text-[#fcfaf1] leading-[0.6] block">In tandem</span>
                 <h2 className="font-primary text-3xl md:text-4xl lg:text-5xl uppercase leading-[0.9] text-[#111b2e]">
                   Geodetic <br/>+ Mundane
                 </h2>
              </div>
              
              <p className="text-sm md:text-base leading-relaxed opacity-90 max-w-xl mb-8 text-[#111b2e]">
                 Inherency meet timing. Geodetic techniques tell you how a location is <em>wired</em>. Mundane cycles tell you <em>when</em> those wires activate.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                <Link href="#" className="bg-[#111b2e] text-[#fcfaf1] hover:bg-black py-3 px-6 font-mono text-[9px] uppercase tracking-widest text-center shadow-lg">
                    Request Intelligence Reading <ArrowRight size={12} className="inline-block ml-1" />
                </Link>
                
                <div className="hidden sm:block">
                   <svg viewBox="0 0 160 160" className="w-20 h-20 opacity-40">
                     <circle cx="65" cy="65" r="45" fill="none" stroke="#111b2e" strokeWidth="0.5"/>
                     <circle cx="95" cy="65" r="45" fill="none" stroke="#111b2e" strokeWidth="0.5"/>
                     <circle cx="80" cy="95" r="45" fill="none" stroke="#111b2e" strokeWidth="0.5"/>
                   </svg>
                </div>
              </div>
           </div>
           
           <div className="relative w-full aspect-[4/3] rounded-[var(--shape-asymmetric-md)] overflow-hidden">
               <Image 
                src="/nat-3.jpg" 
                alt="Natalia at a Geodetic Power Spot" 
                fill 
                className="object-cover" 
               />
           </div>
        </div>
      </section>
      

      {/* ── FAQ ── */}
      <section className="bg-[var(--bg)] py-12 md:py-20 border-t border-[var(--surface-border)]">
         <div className="max-w-5xl mx-auto w-full px-6">
           <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-[var(--text-primary)] pb-3 mb-10 gap-2">
             <h2 className="font-primary text-2xl md:text-4xl lg:text-5xl uppercase leading-none text-[var(--text-primary)]">Intelligence FAQ</h2>
             <span className="font-mono text-[9px] tracking-widest shrink-0 mb-1 text-[var(--text-secondary)]">04 / 04</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-10">
             <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50 mb-4 text-[var(--text-tertiary)]">Reference</div>
                <div className="flex flex-col gap-6">
                   <p className="text-xs opacity-60 leading-relaxed text-[var(--text-secondary)] max-w-[200px]">
                     Deep-dive into the methodology of Geodetic and Mundane frameworks.
                   </p>
                   <div className="w-12 h-0.5 bg-[var(--color-y2k-blue)]" />
                </div>
             </div>
             
             <div className="flex flex-col">
                <Accordion type="single" collapsible variant="editorial">
                   {FAQ_ITEMS.map((item, i) => (
                      <AccordionItem key={i} value={`item-${i}`} showIndex={i + 1}>
                         <AccordionTrigger className="text-left font-secondary text-lg md:text-xl font-normal lowercase capitalize">
                            {item.q}
                         </AccordionTrigger>
                         <AccordionContent className="pb-8">
                            <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-2xl text-[var(--text-secondary)]">
                               {item.a}
                            </p>
                         </AccordionContent>
                      </AccordionItem>
                   ))}
                </Accordion>
             </div>
          </div>
         </div>
      </section>
      
      {/* ── CTA STRIP ── */}
      <section className="bg-[#111b2e] py-16 md:py-24 text-white">
         <div className="max-w-4xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-white">
           <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50 mb-4 lowercase text-white">Synthesis</div>
              <h2 className="font-primary text-4xl md:text-5xl lg:text-6xl leading-[1] uppercase mb-6 text-white font-semibold">
                 Map your <br/>collective <br/> <span className="text-[var(--color-spiced-life)] font-secondary italic lowercase capitalize">Context.</span>
              </h2>
              <p className="opacity-70 text-sm md:text-base leading-relaxed max-w-sm mb-8 text-white">Understand why certain cities call you through both personal and mundane activation.</p>
           </div>
           
           <div className="flex flex-col gap-3">
              {CTA_OPTIONS.map((cta, i) => (
                 <Link key={i} href="#" className={`flex items-center justify-between p-5 transition-transform hover:-translate-y-0.5 block ${cta.primary ? 'bg-[var(--color-y2k-blue)] border-none' : 'bg-white/5 border border-white/10'}`} style={{ borderRadius: 'var(--radius-sm)' }}>
                    <div>
                       <div className="font-mono text-[8px] uppercase tracking-[0.15em] opacity-80 mb-1 flex items-center gap-1 text-white">
                          {cta.primary && <Sparkles size={10} />} {cta.tag}
                       </div>
                       <div className="font-secondary text-base ml-1 text-white">{cta.title}</div>
                    </div>
                    <ArrowRight size={18} className="opacity-50 shrink-0 text-white" />
                 </Link>
              ))}
           </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
