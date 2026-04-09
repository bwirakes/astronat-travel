import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/app/components/Navbar';
import { ArrowRight, Sparkles, Shield, Compass, Clock, Users } from 'lucide-react';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/app/components/ui/accordion';
import Footer from '@/app/components/Footer';

// --- Constants ---
const STATS = [
  { n: '40+', label: 'Countries Mapped', bg: 'var(--bg-raised)' },
  { n: '12+', label: 'Years Practising', bg: 'var(--color-acqua)', color: '#111b2e' },
  { n: 'CIA', label: 'Faculty Affiliated', bg: 'var(--color-y2k-blue)', color: '#fcfaf1' },
  { n: 'NDA', label: 'Full Confidentiality', bg: 'var(--color-spiced-life)', color: '#111b2e' }
];

const PILLARS = [
  { 
    num: '01', 
    title: 'Location Intelligence', 
    desc: 'Every market has a geodetic signature — a fixed zodiacal frequency. When it harmonises with your chart, markets open, brands resonate, and revenue follows.', 
    tag: 'Geodetic Equivalents · ACG Mapping', 
    bg: 'var(--bg-raised)', 
    text: 'var(--text-primary)' 
  },
  { 
    num: '02', 
    title: 'Market Timing', 
    desc: 'Planetary transits create windows of expansionary momentum. Launch dates and partnership windows become precision instruments, not calendar guesses.', 
    tag: 'Transits · Eclipse Cycles · Ingress', 
    bg: 'var(--color-charcoal)', 
    text: '#fcfaf1' 
  },
  { 
    num: '03', 
    title: 'Risk Mitigation', 
    desc: 'Saturn lines signal structural friction — regulatory headwinds or brand perception challenges. We flag volatility before it becomes a crisis.', 
    tag: 'Saturn Lines · Mars-Pluto Corridors', 
    bg: 'var(--color-acqua)', 
    text: '#111b2e' 
  },
  { 
    num: '04', 
    title: 'Team Relocation', 
    desc: 'Where your key people live shapes their performance. We identify power line alignments so your best people are deployed where they have a structural advantage.', 
    tag: 'Executive ACG · Team Deployment', 
    bg: 'var(--color-y2k-blue)', 
    text: '#fcfaf1' 
  }
];

const PACKAGES = [
  {
    tier: 'Tier 01 — Entry',
    name: 'Market Reconnaissance',
    tagline: 'For founders entering their first international market',
    from: 'SGD 2,400',
    includes: [
      'Incorporation Chart Analysis',
      'Single-Market Geodetic Report',
      '12-Month Transit Window',
      'Top 3 City Rankings',
      'Written Report + 60-min Debrief'
    ],
    glyph: '♑',
    primary: false
  },
  {
    tier: 'Tier 02 — Growth',
    name: 'Multi-Market Intelligence',
    tagline: 'For scaling companies evaluating 3–5 markets',
    from: 'SGD 5,800',
    includes: [
      'Full Natal & Relocated Study',
      '3–5 Market Geodetic Reports',
      '24-Month Transit Forecast',
      'Risk Flag Summary & Timing Alerts',
      '2 Executive Chart Reviews',
      'Full Strategy Session',
      '30-Day Follow-Up Access'
    ],
    glyph: '♃',
    primary: true
  },
  {
    tier: 'Tier 03 — Enterprise',
    name: 'Full Spectrum Advisory',
    tagline: 'For enterprise clients requiring ongoing intelligence',
    from: 'Engagement-Based',
    includes: [
      'All Tier 01 & 02 Deliverables',
      'Unlimited Market Coverage',
      'C-Suite ACG Review',
      'Quarterly Briefing Updates',
      'Retainer Advisory Access',
      'Board Presentations',
      'Full NDA Protocol'
    ],
    glyph: '♅',
    primary: false
  }
];

const PROCESS_STEPS = [
  { n: '01', title: 'Secure Brief', body: 'Submit incorporation details under full NDA.' },
  { n: '02', title: 'Chart Build', body: 'We construct ACG and geodetic overlays.' },
  { n: '03', title: 'Analysis', body: 'Each market is scored for resonance and risk.' },
  { n: '04', title: 'Report', body: 'Formatted for board and executive review.' },
  { n: '05', title: 'Debrief', body: 'Live briefing to walk through next actions.' }
];

const B2B_FAQ = [
  { 
    q: 'What data is required for a corporate brief?', 
    a: 'We require the date, time, and city of incorporation for your legal entity. If your brand has undergone a major pivot, rebranding, or acquisition, those dates are also constructive for mapping the current trajectory.' 
  },
  { 
    q: 'How do you handle confidentiality?', 
    a: 'All corporate engagements are conducted under a strict Mutual Non-Disclosure Agreement (MNDA). We never disclose client identities, target territories, or internal relocation strategies.' 
  },
  { 
    q: 'Does this replace traditional market research?', 
    a: 'No. Our intelligence serves as a high-level strategic overlay. We identify the "when" and "where" of least structural resistance, which your team can then validate with boots-on-the-ground research and economic modeling.' 
  },
  { 
    q: 'How far in advance can you forecast strategic cycles?', 
    a: 'Using outer planet transits (Saturn, Jupiter, Uranus, and Neptune), we provide high-confidence strategic mapping for 3–5 year windows, identifying periods of expansion, consolidation, and regulatory risk.' 
  }
];

export default function B2BLandingPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen relative overflow-hidden font-body transition-colors duration-300">
      {/* ── NAV ── */}
      <Navbar hideAuth={true} />

      {/* MAIN HERO */}
      <section className="pt-6 pb-12 md:pt-10 md:pb-20">
        <div className="max-w-5xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-16 items-center">
          <div className="relative z-10 flex flex-col justify-center h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-0.5 bg-[var(--color-y2k-blue)]" />
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-y2k-blue)]">Corporate Intelligence</span>
            </div>
            
            <div className="relative">
              <h1 className="font-primary text-4xl md:text-6xl lg:text-7xl font-semibold leading-[0.9] uppercase text-[var(--text-primary)]">
                The Stars Know <br /> 
                Where Business <br/> 
                <span className="text-[var(--color-y2k-blue)] font-secondary italic normal-case">Belongs.</span>
              </h1>
            </div>

            <div className="mt-10 space-y-6">
                <p className="font-body text-sm md:text-base leading-relaxed opacity-90 text-[var(--text-secondary)] max-w-xl">
                Your incorporation chart is a strategic asset. Every market expansion, executive relocation, and launch window is encoding in your data. We decode it.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="#" className="btn btn-primary text-center px-8 py-4 uppercase text-[10px] tracking-widest w-full sm:w-auto">
                      Request a Briefing <ArrowRight size={14} />
                  </Link>
                  <Link href="#packages" className="btn btn-secondary text-center px-8 py-4 uppercase text-[10px] tracking-widest w-full sm:w-auto">
                      View Service Tiers
                  </Link>
                </div>
            </div>
          </div>
          
          <div className="relative h-full flex flex-col justify-center">
            <div className="relative w-full aspect-[4/5] rounded-[var(--shape-organic-1)] overflow-hidden shadow-2xl">
              <Image src="/nat-1.jpg" alt="Natalia - Founder" fill className="object-cover" priority />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[var(--surface-border)] border border-[var(--surface-border)] overflow-hidden">
             {STATS.map((stat, i) => (
                <div key={i} className="p-8 flex flex-col items-center justify-center text-center py-12" style={{ background: stat.bg, color: stat.color || 'inherit' }}>
                   <span className="font-primary text-3xl md:text-4xl font-semibold mb-1">{stat.n}</span>
                   <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-60">{stat.label}</span>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="py-16 md:py-24 border-b border-[var(--surface-border)]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_3.5fr] gap-8 md:gap-16">
           <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-y2k-blue)]">The Premise</div>
           <p className="font-secondary text-xl md:text-3xl leading-snug text-[var(--text-primary)]">
             Astrocartography and geodetic astrology decode <strong className="font-semibold italic text-[var(--color-y2k-blue)]">territories, timing windows, and team configurations</strong> that align with the celestial blueprint of your business.
           </p>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16 border-b border-[var(--surface-border)] pb-4">
             <h2 className="font-primary text-3xl md:text-5xl uppercase leading-none text-[var(--text-primary)]">Intelligence Pillars</h2>
             <span className="font-mono text-xs opacity-40 italic text-[var(--text-secondary)]">Decoding the corporate footprint</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--surface-border)] border border-[var(--surface-border)]">
            {PILLARS.map((p, i) => (
               <div key={i} className="p-10 md:p-12 min-h-[360px] flex flex-col" style={{ background: p.bg, color: p.text }}>
                  <div className="font-primary text-5xl opacity-10 mb-8 leading-none" style={{ color: p.text }}>{p.num}</div>
                  <h3 className="font-secondary text-2xl md:text-3xl mb-4 leading-tight lowercase" style={{ color: p.text }}>{p.title}</h3>
                  <p className="font-body text-sm leading-relaxed opacity-80 flex-1" style={{ color: p.text }}>{p.desc}</p>
                  <div className="font-mono text-[9px] uppercase tracking-widest mt-8 border-t pt-4" style={{ color: p.text, borderColor: i % 2 === 1 ? 'rgba(252,250,241,0.1)' : 'rgba(17,27,46,0.1)' }}>
                    {p.tag}
                  </div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section id="packages" className="py-16 md:py-24 bg-[var(--bg-raised)] scroll-mt-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16">
             <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">Engagement Options</div>
             <h2 className="font-primary text-4xl md:text-6xl uppercase leading-[0.9] text-[var(--text-primary)]">Service Tiers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGES.map((pkg, i) => (
               <div key={i} className={`relative p-8 border flex flex-col h-full bg-[var(--bg)] ${pkg.primary ? 'border-[var(--color-y2k-blue)] shadow-[8px_8px_0px_var(--color-y2k-blue)]' : 'border-[var(--surface-border)]'}`} style={{ borderRadius: '2px' }}>
                  {pkg.primary && <div className="absolute top-0 right-0 bg-[var(--color-spiced-life)] text-white text-[8px] uppercase tracking-widest px-3 py-1 font-mono">Popular</div>}
                  
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] opacity-40 mb-2 text-[var(--text-tertiary)]">{pkg.tier}</div>
                  <h3 className="font-secondary text-2xl md:text-3xl border-b border-[var(--surface-border)] pb-4 mb-4 leading-none text-[var(--text-primary)]">{pkg.name}</h3>
                  <p className="text-[10px] leading-relaxed opacity-60 mb-8 italic text-[var(--text-secondary)]">{pkg.tagline}</p>
                  
                  <div className="mb-8">
                     <span className="block font-mono text-[8px] uppercase opacity-30 mb-1 text-[var(--text-tertiary)]">Starting from</span>
                     <span className="font-primary text-3xl font-semibold text-[var(--text-primary)]">{pkg.from}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-12 flex-1">
                    {pkg.includes.map(inc => (
                       <li key={inc} className="text-xs opacity-80 flex items-start gap-2 text-[var(--text-secondary)]">
                          <span className="text-[var(--color-spiced-life)]">✦</span> {inc}
                       </li>
                    ))}
                  </ul>
                  
                  <Link href="#" className={`w-full py-4 text-center font-mono text-[9px] uppercase tracking-widest transition-colors ${pkg.primary ? 'bg-[var(--color-y2k-blue)] text-white' : 'bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-y2k-blue)]'}`}>
                    Enquire Selection <ArrowRight size={12} className="inline-block ml-1 opacity-50" />
                  </Link>
                  
                  <div className="absolute -bottom-6 -right-2 font-primary text-8xl opacity-5 pointer-events-none select-none text-[var(--text-primary)]">{pkg.glyph}</div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIP RETAINER ── */}
      <section className="py-16 md:py-32">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-20 items-center">
           <div className="flex flex-col justify-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-spiced-life)] mb-4">Elite Access</div>
              <h2 className="font-primary text-4xl md:text-6xl uppercase leading-[0.9] mb-8 text-[var(--text-primary)]"> Private <br/> <span className="font-secondary italic lowercase">Retainer.</span></h2>
              <p className="text-sm md:text-base opacity-80 leading-relaxed mb-12 max-w-lg text-[var(--text-secondary)]">For founders and family offices who require intelligence woven into their strategic operating rhythm. An ongoing relationship where cosmic insight becomes a calibrated strategic tool.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-t border-[var(--surface-border)] pt-12">
                 {[
                   { icon: <Clock size={20}/>, t: 'Electional Support', d: 'Direct access for time-sensitive windows: launches, hires, signings.' },
                   { icon: <Shield size={20}/>, t: 'Full Confidentiality', d: 'Dedicated support strictly under NDA for the C-suite and board.' },
                   { icon: <Compass size={20}/>, t: 'Quarterly Deep Dives', d: '90-min sessions mapping the next cycles against corporate goals.' },
                   { icon: <Users size={20}/>, t: 'Team Deployments', d: 'Advisory on executive relocations and mission-critical placements.' }
                 ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="text-[var(--color-y2k-blue)] shrink-0">{item.icon}</div>
                       <div>
                          <h4 className="font-mono text-[10px] uppercase tracking-widest mb-1 text-[var(--text-primary)]">{item.t}</h4>
                          <p className="text-xs opacity-60 leading-relaxed text-[var(--text-secondary)]">{item.d}</p>
                       </div>
                    </div>
                 ))}
              </div>
              
              <Link href="#" className="btn btn-primary self-start px-8 py-5 uppercase text-[11px] tracking-widest bg-[var(--color-spiced-life)] border-none">
                 Apply for Private Retainer <ArrowRight size={14} />
              </Link>
           </div>
           
           <div className="flex flex-col gap-6">
              <div className="relative aspect-[4/5] rounded-[var(--shape-asymmetric-md)] overflow-hidden shadow-xl">
                 <Image src="/nat-2.jpg" alt="Natalia — Corporate Advisor" fill className="object-cover" />
              </div>
              <div className="bg-[var(--bg-raised)] p-6 border-l-2 border-[var(--color-spiced-life)]">
                 <p className="font-secondary text-base leading-relaxed italic mb-4 text-[var(--text-primary)]">"We delayed our office launch by six weeks based on Nat's analysis. The regulatory headwinds she flagged materialised precisely on schedule."</p>
                 <div className="font-mono text-[8px] uppercase tracking-widest opacity-60 text-[var(--text-tertiary)]">— Managing Director, Financial Services</div>
              </div>
           </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-16 md:py-24 border-t border-[var(--surface-border)] bg-[var(--bg-raised)]">
        <div className="max-w-5xl mx-auto px-6">
           <div className="text-center mb-16">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4 uppercase">Deployment</div>
              <h2 className="font-primary text-4xl md:text-5xl uppercase text-[var(--text-primary)]">The Process</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-5 gap-8 overflow-hidden relative">
              <div className="absolute top-8 left-0 right-0 h-px bg-[var(--color-y2k-blue)] opacity-10 md:block hidden" />
              
              {PROCESS_STEPS.map((step, i) => (
                 <div key={i} className="relative text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border border-[var(--color-y2k-blue)] bg-[var(--bg)] flex items-center justify-center font-primary text-xl mb-6 relative z-10 text-[var(--color-y2k-blue)]">
                       {step.n}
                    </div>
                    <h4 className="font-mono text-[10px] uppercase tracking-widest mb-2 text-[var(--text-primary)]">{step.title}</h4>
                    <p className="text-[10px] opacity-60 leading-relaxed px-4 text-[var(--text-secondary)]">{step.body}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 border-t border-[var(--surface-border)]">
        <div className="max-w-5xl mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
              <div>
                 <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">Strategic FAQ</div>
                 <h2 className="font-primary text-4xl uppercase leading-none text-[var(--text-primary)]">Intelligence <br/> Logistics</h2>
                 <p className="mt-6 text-xs opacity-50 leading-relaxed text-[var(--text-secondary)] max-w-[220px]">Common questions regarding corporate data, NDAs, and methodology.</p>
              </div>
              
              <div>
                 <Accordion type="single" collapsible variant="editorial">
                    {B2B_FAQ.map((item, i) => (
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

      {/* ── DISCLAIMER ── */}
      <section className="bg-[var(--surface)] border-y border-[var(--surface-border)] py-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
           <div className="font-mono text-[9px] uppercase tracking-widest opacity-40 shrink-0 text-[var(--text-tertiary)]">Important Note</div>
           <p className="text-[10px] opacity-50 italic leading-relaxed text-[var(--text-secondary)]">
             Corporate intelligence reports are provided for strategic reflection and decision-support purposes only. They do not constitute financial, investment, or legal guidance. Clients retain full responsibility for their business outcomes. All work is conducted under strict confidentiality.
           </p>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="py-16 md:py-24 bg-[var(--color-charcoal)] overflow-hidden border-t border-white/5">
         <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <div className="text-left">
               <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#fcfaf1] opacity-60 mb-6">Strategic Partnership</div>
               <h2 className="font-primary text-5xl md:text-7xl uppercase leading-[0.85] mb-8 text-[#fcfaf1]">
                 Believe <br/> The Sky <br/> <span className="font-secondary italic lowercase text-[var(--color-spiced-life)] font-normal">Exists.</span>
               </h2>
               <p className="text-sm opacity-70 leading-relaxed mb-10 text-[#fcfaf1] max-w-md">Turn cosmic intelligence into your most unconventional competitive advantage. Brief us on your next move.</p>
               <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="#" className="btn-primary bg-[#fcfaf1] text-[#111b2e] px-10 py-5 font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--color-acqua)] border-none text-center">
                     Request a Briefing
                  </Link>
                  <Link href="/" className="btn-secondary border-white/20 text-[#fcfaf1] px-10 py-5 font-mono text-[10px] uppercase tracking-widest hover:border-white text-center">
                    ← Back to Site
                  </Link>
               </div>
            </div>
            
            <div className="relative aspect-[square] lg:aspect-[4/5] rounded-[var(--shape-asymmetric-md)] overflow-hidden">
               <Image src="/nat-3.jpg" alt="Natalia — AstroNat Founder" fill className="object-cover" />
            </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer variant="b2b" />
    </div>
  );
}
