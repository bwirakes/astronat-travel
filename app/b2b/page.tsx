import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/app/components/Navbar';
import { ArrowRight, Sparkles, Shield, Compass, Clock, Users, Moon, Sun, AlertCircle, FileText } from 'lucide-react';
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
    desc: 'Every market has a geodetic signature — a fixed zodiacal frequency determined by its longitude on Earth. When that frequency harmonises with your incorporation chart, markets open, brands resonate, and revenue follows. When it conflicts, even brilliant products struggle against invisible structural resistance. We overlay your company\'s chart against the geodetic equivalent maps of target territories, identifying cities and countries where your Sun, Jupiter, Venus, and Midheaven lines land in positions of natural authority and reception.', 
    tag: 'Geodetic Equivalents · ACG Mapping · Territory Scoring', 
    bg: 'var(--bg-raised)', 
    text: 'var(--text-primary)' 
  },
  { 
    num: '02', 
    title: 'Market Timing', 
    desc: 'The same market, entered six months apart, can produce radically different outcomes. Planetary transits to your incorporation chart create windows of expansionary momentum — the difference between launching into a headwind and launching with a full planetary tailwind. We map Jupiter and Venus transits for growth amplification, identify Saturn ingresses that demand structural discipline, and flag eclipse activations on your chart angles. Launch dates, signing days, and partnership windows become precision instruments, not calendar guesses.', 
    tag: 'Planetary Transits · Eclipse Cycles · Ingress Windows', 
    bg: 'var(--color-charcoal)', 
    text: '#fcfaf1' 
  },
  { 
    num: '03', 
    title: 'Risk Mitigation', 
    desc: 'Not all markets that look attractive on paper are astrologically clear. Saturn lines through your key midpoints indicate structural friction — regulatory headwinds, partnership breakdowns, brand perception challenges. Mars-Pluto activations over geodetic meridians signal volatility and forced-change cycles that can turn a promising expansion into a crisis management exercise. We produce a red-flag report for every territory under consideration: what the chart shows, when the risk windows activate, and how to structure entry to route around the pressure points.', 
    tag: 'Saturn Lines · Mars-Pluto Corridors · Eclipse Red Flags', 
    bg: 'var(--color-acqua)', 
    text: '#111b2e' 
  },
  { 
    num: '04', 
    title: 'Team Relocation & Exec Placement', 
    desc: 'Where your key people live and work shapes their performance in ways conventional HR analytics cannot capture. An executive operating on their Jupiter line closes more deals, commands greater authority, and attracts opportunities organically. The same executive on their Saturn line may be capable — but chronically blocked. We map your leadership team\'s astrocartography alongside your company chart, identifying power line alignments between individual executives and your key territories — so your best people are deployed where their charts give them a structural advantage.', 
    tag: 'Executive ACG · Power Line Alignment · Team Deployment', 
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
      'Incorporation Chart Analysis — Full natal chart of your business entity',
      'Single-Market Geodetic Report — One target country, in full',
      '12-Month Transit Window — Optimal entry and avoidance periods',
      'Top 3 City Rankings — Within the target market',
      'Written Report + 60-min Debrief Call'
    ],
    glyph: '♑',
    primary: false
  },
  {
    tier: 'Tier 02 — Growth',
    name: 'Multi-Market Intelligence',
    tagline: 'For scaling companies evaluating 3–5 markets simultaneously',
    from: 'SGD 5,800',
    includes: [
      'Incorporation Chart Analysis — Full natal and relocated chart study',
      '3–5 Market Geodetic Reports — Comparative scoring across territories',
      '24-Month Transit Forecast — Eclipse and ingress cycle map',
      'Risk Flag Summary — Red-zone territories and timing alerts',
      '2 Executive Chart Reviews — Power line deployment assessment',
      'Full Report + 90-min Strategy Session',
      '30-Day Follow-Up Access — Email Q&A post-delivery'
    ],
    glyph: '♃',
    primary: true
  },
  {
    tier: 'Tier 03 — Enterprise',
    name: 'Full Spectrum Advisory',
    tagline: 'For enterprise clients requiring ongoing astrological intelligence',
    from: 'By Engagement',
    includes: [
      'All Tier 01 & 02 Deliverables',
      'Unlimited Market Coverage — Global territory scoring',
      'Full Leadership Team Mapping — Entire C-suite ACG review',
      'Quarterly Forecast Updates — Transit and eclipse briefings',
      'Retainer Advisory Access — Monthly strategy calls',
      'Board Presentation — Available on request',
      'Full NDA & Confidentiality Protocol'
    ],
    glyph: '♅',
    primary: false
  }
];

const PROCESS_STEPS = [
  { n: '01', title: 'Secure Brief', body: 'Submit your incorporation details and strategic objectives under full NDA.' },
  { n: '02', title: 'Chart Construction', body: 'We build your company\'s natal chart, ACG map, and geodetic equivalent overlay.' },
  { n: '03', title: 'Territory Analysis', body: 'Each target market is scored across location resonance, transit windows, and risk flags.' },
  { n: '04', title: 'Intelligence Report', body: 'A structured written deliverable formatted for board presentation and executive review.' },
  { n: '05', title: 'Strategy Debrief', body: 'A live briefing session to walk through findings and map next strategic actions.' }
];

export default function B2BLandingPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen relative overflow-hidden font-body transition-colors duration-300">
      {/* ── NAV ── */}
      <Navbar hideAuth={true} />

      {/* MAIN HERO */}
      {/* pt-32 on mobile clears the fixed navbar while keeping editorial gap */}
      <section className="pt-32 pb-14 md:pt-40 md:pb-24 relative overflow-hidden">
        {/* Background grid - consistent with home */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)]"
          style={{ backgroundSize: "60px 60px" }}
        />

        <div className="absolute right-[-10vw] top-1/2 -translate-y-1/2 w-[min(580px,48vw)] h-[min(580px,48vw)] opacity-10 pointer-events-none mix-blend-multiply flex items-center justify-center z-0 hidden lg:flex animate-[spin_100s_linear_infinite]">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="100" cy="100" r="96" stroke="var(--color-y2k-blue)" strokeWidth=".6"/>
            <ellipse cx="100" cy="100" rx="56" ry="96" stroke="var(--color-y2k-blue)" strokeWidth=".4"/>
            <ellipse cx="100" cy="100" rx="96" ry="28" stroke="var(--color-y2k-blue)" strokeWidth=".4"/>
            <ellipse cx="100" cy="100" rx="96" ry="58" stroke="var(--color-y2k-blue)" strokeWidth=".3"/>
            <line x1="4" y1="100" x2="196" y2="100" stroke="var(--color-y2k-blue)" strokeWidth=".4"/>
            <line x1="100" y1="4" x2="100" y2="196" stroke="var(--color-y2k-blue)" strokeWidth=".4"/>
            <line x1="4" y1="60" x2="196" y2="60" stroke="var(--color-y2k-blue)" strokeWidth=".25"/>
            <line x1="4" y1="140" x2="196" y2="140" stroke="var(--color-y2k-blue)" strokeWidth=".25"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-12 md:gap-14">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-px bg-[var(--color-y2k-blue)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-y2k-blue)]">
                Corporate Intelligence · B2B & VIP Services
              </span>
            </div>
            
            <h1 className="font-secondary leading-[0.88] tracking-tight text-[var(--text-primary)] mb-6"
                style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}>
              <span className="block mb-1 text-[var(--color-spiced-life)]" 
                    style={{ fontFamily: "var(--font-display-alt-2)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 400 }}>
                Cosmic Due Diligence
              </span>
              The Stars Know <br />
              Where Your <em className="italic font-medium text-[var(--color-y2k-blue)]">Business</em>
              <br />
              Belongs.
            </h1>

            <p className="text-xs font-light text-[var(--text-secondary)] leading-[1.65] max-w-sm mb-8 opacity-80">
              Your company&apos;s incorporation chart is the most overlooked strategic asset in your boardroom. Every territory you expand into, every executive you relocate — the timing and geography are already encoded in your founding data.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href="#"
                className="bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--color-charcoal)]"
                style={{ borderRadius: "var(--radius-none)" }}
              >
                Request Briefing →
              </Link>
              <Link
                href="#packages"
                className="border border-[var(--surface-border)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--color-charcoal)] hover:text-[var(--color-eggshell)]"
                style={{ borderRadius: "var(--radius-none)" }}
              >
                View Packages
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative w-full aspect-[4/5] md:aspect-auto md:h-[620px] overflow-hidden rounded-[2rem]">
              <Image
                src="/nat-1.jpg"
                alt="Natalia — AstroNat Founder"
                fill
                priority
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <div className="max-w-7xl mx-auto px-6 pt-5 mb-10 border-t border-[var(--surface-border)] relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="font-secondary text-3xl font-semibold text-[var(--text-primary)] leading-none">
                {s.n}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mt-2">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTRO ── */}
      <section className="py-16 md:py-24 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_2.5fr] gap-8 md:gap-20 items-center">
           <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">The Premise</div>
           <p className="font-secondary text-2xl md:text-4xl leading-snug text-[var(--text-primary)]">
             Your incorporation chart is a living strategic document. Astrocartography and geodetic astrology decode{" "}
             <em className="italic font-semibold text-[var(--color-y2k-blue)]">which territories, timing windows, and team configurations</em>{" "}
             align with the celestial blueprint of your business.
           </p>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16 border-b border-[var(--surface-border)] pb-4">
             <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">The Framework</div>
                <h2 className="font-primary text-3xl md:text-5xl uppercase leading-none text-[var(--text-primary)]">Four Intelligence <br /><span className="text-[var(--color-y2k-blue)] font-secondary italic normal-case">Pillars</span></h2>
             </div>
             <p className="hidden md:block font-body text-sm leading-relaxed opacity-80 text-[var(--text-secondary)] max-w-sm">
               Each pillar maps a distinct dimension of your company's cosmic footprint — from which cities carry your brand's natural authority, to which quarters carry structural tailwinds, to where your best people will perform at their peak.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {PILLARS.map((p, i) => (
                 <div key={i} className="p-10 md:p-12 min-h-[360px] flex flex-col rounded-[2rem]" style={{ background: p.bg, color: p.text }}>
                   <div className="font-primary text-5xl mb-8 leading-none opacity-40 shrink-0" style={{ color: p.text }}>{p.num}</div>
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
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
             <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">Engagement Options</div>
             <h2 className="font-primary text-4xl md:text-6xl uppercase leading-[0.9] text-[var(--text-primary)]">Service Tiers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {PACKAGES.map((pkg, i) => (
               <div key={i} className={`relative p-8 border flex flex-col h-full bg-[var(--bg)] ${pkg.primary ? 'border-[var(--color-y2k-blue)] shadow-[8px_8px_0px_var(--color-y2k-blue)]' : 'border-[var(--surface-border)]'} rounded-[2rem]`}>
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
                  
                  <Link href="#" className={`w-full py-4 text-center font-mono text-[9px] uppercase tracking-widest transition-colors ${pkg.primary ? 'bg-[var(--color-y2k-blue)] text-white hover:bg-[var(--color-charcoal)]' : 'bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-y2k-blue)]'}`}>
                    Enquire About {pkg.tier.split(' ')[1]} <ArrowRight size={12} className="inline-block ml-1 opacity-50" />
                  </Link>
                  
                  <div className="absolute -bottom-6 -right-2 font-primary text-8xl opacity-5 pointer-events-none select-none text-[var(--text-primary)]">{pkg.glyph}</div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIP RETAINER ── */}
      <section className="border-y border-[var(--surface-border)] bg-[var(--bg)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
           <div className="flex flex-col py-16 md:py-24 px-6 lg:pl-[max(1.5rem,calc((100vw-80rem)/2))] lg:pr-16">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-spiced-life)] mb-4">VIP Access</div>
              <h2 className="font-primary text-4xl md:text-6xl uppercase leading-[0.9] mb-8 text-[var(--text-primary)]">
                 <span className="font-secondary italic normal-case text-3xl md:text-4xl text-[var(--color-spiced-life)] mb-2 block tracking-normal">Private Retainer</span>
                 The Inner <span className="font-secondary italic lowercase text-[var(--color-y2k-blue)]">Circle.</span>
              </h2>
              <p className="text-sm md:text-base opacity-80 leading-relaxed text-[var(--text-secondary)]">
                For founders, C-suite executives, and family offices who require astrological intelligence woven permanently into their strategic operating rhythm. This is not a one-time report — it is an <strong className="text-[var(--text-primary)] font-semibold">ongoing advisory relationship</strong> where cosmic intelligence becomes part of how you make decisions, year-round.
              </p>
              <br />
              <p className="text-sm md:text-base opacity-80 leading-relaxed mb-12 text-[var(--text-secondary)]">
                Retained clients receive direct access to Nat for time-sensitive queries — a board vote, an acquisition window, a key hire. Think of it as having a strategist on retainer who reads the market not just through economics, but through the sky above it.
              </p>
              
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-6 text-[var(--text-secondary)] border-b border-[var(--surface-border)] pb-2 flex-shrink-0">What's Included Monthly</div>
              <div className="flex flex-col gap-6 mb-12">
                 {[
                   { icon: <Moon size={20}/>, t: 'Monthly Celestial Briefing', d: 'Upcoming planetary activations on your company and personal charts — framed as actionable strategic intelligence, not astrological jargon.' },
                   { icon: <Sun size={20}/>, t: 'Real-Time Electional Support', d: 'Direct access to Nat for time-sensitive decisions: signing dates, launch windows, offer deadlines, travel itineraries.' },
                   { icon: <AlertCircle size={20}/>, t: 'Eclipse & Ingress Alerts', d: 'Advance notice of high-impact celestial events hitting your chart angles or geodetic meridians — with recommended response strategies.' },
                   { icon: <Compass size={20}/>, t: 'Quarterly Deep-Dive Call', d: '90-minute strategy session reviewing the prior quarter and mapping the next — business chart, personal chart, and geopolitical overlay.' },
                   { icon: <FileText size={20}/>, t: 'New Territory Assessments', d: 'Up to two new market evaluations per quarter, delivered as concise intelligence memos.' }
                 ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="text-[var(--color-y2k-blue)] shrink-0 mt-1">{item.icon}</div>
                       <div>
                          <h4 className="font-primary text-sm font-semibold mb-1 text-[var(--text-primary)] tracking-widest uppercase">{item.t}</h4>
                          <p className="text-[13px] opacity-70 leading-relaxed text-[var(--text-secondary)]">{item.d}</p>
                       </div>
                    </div>
                 ))}
              </div>
              
              <Link href="#" 
                    style={{ backgroundColor: 'var(--color-acqua)', color: 'var(--color-charcoal)' }}
                    className="self-start px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-widest rounded-full hover:opacity-80 transition-opacity">
                 Apply for Private Retainer <ArrowRight size={14} className="inline-block flex-shrink-0" />
              </Link>
           </div>
           
           <div className="bg-[var(--color-charcoal)] flex flex-col pt-16 md:pt-32 pb-16 px-6 lg:pr-[max(1.5rem,calc((100vw-80rem)/2))] lg:pl-16 border-l border-[var(--surface-border)] relative">
              <div className="sticky top-24">
                 <div className="font-mono text-[10px] uppercase tracking-widest text-[#567a83] mb-8 opacity-80">Investment</div>
                 <div className="mb-4">
                   <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2 text-white">Monthly Retainer</div>
                   <div className="font-primary text-5xl md:text-7xl font-semibold leading-none text-white">
                     <sup className="text-2xl font-normal opacity-90 pr-1">SGD</sup>3,200
                   </div>
                   <div className="font-body text-xs opacity-50 mt-4 font-light text-white leading-relaxed max-w-[280px]">Minimum 6-month engagement · Annual rate available</div>
                 </div>
                 
                 <div className="flex items-center gap-3 mt-8 mb-10 font-mono text-[9px] uppercase tracking-widest text-white/50 max-w-[240px] leading-relaxed">
                   <div className="w-2 h-2 rounded-full bg-[#3fb950] shrink-0 mt-0.5"></div>
                   <span>Limited to 4 active retainer clients at any time</span>
                 </div>
                 
                 <Link href="#" 
                       style={{ backgroundColor: 'var(--color-acqua)', color: 'var(--color-charcoal)' }}
                       className="w-full text-center py-5 px-6 font-semibold font-mono text-[10px] uppercase tracking-widest transition-opacity hover:opacity-80 mb-24 block">
                    Apply for Private Retainer
                 </Link>

                 <div className="mt-20 border-t border-white/10 w-full pt-8">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-y2k-blue)] shrink-0 mb-2">Regional MD, Financial Services</p>
                    <div className="font-mono text-[9px] text-[#fcfaf1] opacity-50 mb-8 lowercase">Southeast Asia · Retainer Client</div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-16 md:py-24 border-t border-[var(--surface-border)] bg-[var(--bg-raised)]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16 max-w-lg mx-auto">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">How It Works</div>
              <h2 className="font-primary text-4xl md:text-5xl uppercase text-[var(--text-primary)]">From Brief to <br /><span className="font-secondary italic lowercase text-[var(--color-y2k-blue)]">Intelligence</span></h2>
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


      {/* ── DISCLAIMER ── */}
      <section className="bg-[var(--surface)] border-y border-[var(--surface-border)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
           <div className="font-mono text-[9px] uppercase tracking-widest opacity-40 shrink-0 text-[var(--text-tertiary)]">Important Note</div>
           <p className="text-[10px] opacity-50 italic leading-relaxed text-[var(--text-secondary)]">
             Astrocartography and geodetic astrology are <strong className="font-semibold text-[var(--text-primary)]">pattern-recognition and timing frameworks</strong>, not financial advice, investment counsel, or legal guidance. All corporate intelligence reports are provided for strategic reflection and decision-support purposes only. Clients retain full responsibility for their business decisions. <strong className="font-semibold text-[var(--text-primary)]">All client information is held in strict confidence under NDA.</strong>
           </p>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="py-24 md:py-32 bg-[var(--color-y2k-blue)] overflow-hidden border-t border-white/5 relative">
         <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-10 pointer-events-none animate-[spin_80s_linear_infinite] z-0 hidden lg:block">
           <svg viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="96" stroke="#F8F5EC" strokeWidth=".5"/><ellipse cx="100" cy="100" rx="56" ry="96" stroke="#F8F5EC" strokeWidth=".4"/><ellipse cx="100" cy="100" rx="96" ry="28" stroke="#F8F5EC" strokeWidth=".3"/><ellipse cx="100" cy="100" rx="96" ry="58" stroke="#F8F5EC" strokeWidth=".3"/><line x1="4" y1="100" x2="196" y2="100" stroke="#F8F5EC" strokeWidth=".35"/><line x1="100" y1="4" x2="100" y2="196" stroke="#F8F5EC" strokeWidth=".35"/></svg>
         </div>
         <div className="absolute top-[80%] right-[-100px] -translate-y-1/2 w-[700px] h-[700px] opacity-10 pointer-events-none animate-[spin_80s_reverse_linear_infinite] z-0">
           <svg viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="96" stroke="#F8F5EC" strokeWidth=".5"/><ellipse cx="100" cy="100" rx="56" ry="96" stroke="#F8F5EC" strokeWidth=".4"/><ellipse cx="100" cy="100" rx="96" ry="28" stroke="#F8F5EC" strokeWidth=".3"/><ellipse cx="100" cy="100" rx="96" ry="58" stroke="#F8F5EC" strokeWidth=".3"/><line x1="4" y1="100" x2="196" y2="100" stroke="#F8F5EC" strokeWidth=".35"/><line x1="100" y1="4" x2="100" y2="196" stroke="#F8F5EC" strokeWidth=".35"/></svg>
         </div>

         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 gap-12 items-center relative z-10 text-center">
            <div className="flex flex-col items-center justify-center">
               <div className="font-secondary text-5xl md:text-7xl lowercase italic text-[var(--color-spiced-life)] block mb-4">Ready?</div>
               <h2 className="font-primary text-5xl md:text-6xl lg:text-7xl uppercase leading-[0.85] mb-8 text-[#fcfaf1]">
                 Your Company's Chart <br/> Is Already Telling You <br/> <span className="font-primary normal-case tracking-normal text-[#fcfaf1]">Where To Go.</span>
               </h2>
               <p className="text-sm md:text-base opacity-70 leading-relaxed mb-12 text-[#fcfaf1] max-w-lg mx-auto">The question is whether you're listening. Let's read it together — and turn celestial intelligence into your most unconventional competitive advantage.</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="#" className="btn-primary bg-[#fcfaf1] text-[#111b2e] px-10 py-5 font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--color-acqua)] border-none text-center">
                     Request a Corporate Briefing <ArrowRight size={14} className="inline-block ml-1" />
                  </Link>
                  <Link href="#" className="btn-secondary border-white/30 text-[#fcfaf1] px-10 py-5 font-mono text-[10px] uppercase tracking-widest hover:border-white text-center">
                    Download Service Overview
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer variant="b2b" />
    </div>
  );
}
