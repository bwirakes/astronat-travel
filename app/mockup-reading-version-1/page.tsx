"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { AcgMap } from "@/app/components/AcgMap";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";

const MOCK_NATAL = {
  sun: { longitude: 45 },
  moon: { longitude: 120 },
  mercury: { longitude: 30 },
  venus: { longitude: 280, retrograde: true },
  mars: { longitude: 15 },
  jupiter: { longitude: 270 },
  saturn: { longitude: 300 },
  uranus: { longitude: 180 },
  neptune: { longitude: 210 },
  pluto: { longitude: 260 },
  chiron: { longitude: 90 },
  houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] as number[]
};

const MOCK_WHEEL_PLANETS = Object.keys(MOCK_NATAL).filter(k => k !== 'houses').map(k => ({
  planet: k.charAt(0).toUpperCase() + k.slice(1),
  // @ts-ignore
  longitude: MOCK_NATAL[k].longitude
}));

const MOCK_RELOCATED_HOUSES = [40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340, 10];

const TRANSIT_WINDOWS = [
  {
    id: 0,
    label: "March 14 - 18 (Net +40 pts)",
    title: "Focus Window: March 14 - 18",
    aspects: [
      { name: "Transiting Jupiter trines Natal Sun", pts: "+45 pts", label: "(Peak Boost)", color: "var(--sage)" },
      { name: "Transiting Jupiter squares Moon", pts: "-20 pts", label: "(Emotional Drag)", color: "var(--color-spiced-life)" },
      { name: "Transiting Jupiter sextiles Mars", pts: "+15 pts", label: "(Action Focus)", color: "var(--color-planet-mars)" },
    ],
    ai: "Avoid signing binding contracts or having major emotional relationship talks during this window (the Moon square clouds emotional clarity). However, it is an extremely potent time for independent action, networking, and creative pitches."
  },
  {
    id: 1,
    label: "April 2 - 5 (Net -15 pts)",
    title: "Caution Window: April 2 - 5",
    aspects: [
      { name: "Transiting Saturn squares Natal Mercury", pts: "-35 pts", label: "(Communication Block)", color: "var(--text-tertiary)" },
      { name: "Transiting Venus trines Natal ASC", pts: "+20 pts", label: "(Social Grace)", color: "var(--color-y2k-blue)" },
    ],
    ai: "Travel delays and communication breakdowns are highly likely due to the Saturn square. Over-communicate your plans and double-check bookings. Socially, you will still be well-received by locals."
  }
];

const VERDICTS: Record<string, { label: string, title: string, color: string, content: string }> = {
  primary: {
    label: "Macro Overview",
    title: "The Astrological Verdict",
    color: "var(--text-primary)",
    content: "“Norway aggressively activates your 10th House of Public Life. You will feel remarkably driven, ambitious, and magnetic in your career pursuits. However, an afflicted 6th House points toward physical burnout. You are here to build your empire, not to rest your body.”"
  },
  career: {
    label: "Highest Energy",
    title: "Career Magnetism (House 10)",
    color: "var(--color-planet-jupiter)",
    content: "The overarching theme of this location is extreme public visibility. Your efforts will be recognized at a magnified scale. If you are seeking a promotion, launching a business, or putting yourself in the limelight, this is a prime destination for generating undeniable momentum."
  },
  burnout: {
    label: "Friction Point",
    title: "The Burnout Risk (House 6)",
    color: "var(--color-planet-saturn)",
    content: "The downside to your 10th House activation is a severe drain on your 6th House of physical health and daily routines. The intense workload will fracture your sleep and eating habits. Extreme discipline regarding rest is required—otherwise, physical exhaustion is inevitable."
  },
  timing: {
    label: "Optimal Action Window",
    title: "Peak Timing: March 14-18",
    color: "var(--color-y2k-blue)",
    content: "This specific five-day window delivers a massive surge of Jupiter energy harmonizing with your natal Sun. It is the absolute optimal time to secure agreements, broadcast major messages, or make significant investments relative to your career."
  }
};

type DeepDiveTab = "acg" | "timing" | "natal" | "relocation" | "geodetic";

export default function MockupReadingVersion1() {
  const [mounted, setMounted] = useState(false);
  const [activeTransit, setActiveTransit] = useState(0);
  const [tab, setTab] = useState<DeepDiveTab>("acg");
  const [activeVerdict, setActiveVerdict] = useState<keyof typeof VERDICTS>("primary");

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const tabs: { id: DeepDiveTab, label: string }[] = [
    { id: "acg", label: "ACG Map" },
    { id: "timing", label: "Transit Timing" },
    { id: "natal", label: "Natal Baseline" },
    { id: "relocation", label: "Relocated Chart" },
    { id: "geodetic", label: "Geodetic Shift" }
  ];

  const handlePillClick = (verdictKey: keyof typeof VERDICTS) => {
    setActiveVerdict(verdictKey);
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-[var(--bg)] text-[var(--text-primary)] relative font-body px-4 py-8 md:p-12 overflow-x-hidden box-border">
      
      {/* Decorative O-Script Overlap */}
      <span style={{
        position: 'absolute', fontFamily: 'var(--font-display-alt-2)',
        fontSize: 'clamp(20rem, 40vw, 40rem)', color: 'var(--color-y2k-blue)',
        opacity: 0.05, top: '-5%', right: '-10%',
        pointerEvents: 'none', lineHeight: '0.8', zIndex: 0
      }}>
        Flow
      </span>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-10 md:gap-12">
        
        {/* Header and Pills Grouping */}
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--surface-border)] pb-6 text-[var(--text-primary)]">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.2em] mb-2 px-3 py-1 border border-current rounded-full inline-block">
                Destination Reading
              </div>
              <h1 className="font-primary text-5xl sm:text-6xl md:text-8xl leading-[0.85] uppercase">
                Norway
              </h1>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <span className="block font-mono text-[var(--color-y2k-blue)] text-sm mb-1 uppercase font-bold tracking-widest">Macro Score</span>
              <span className="font-secondary text-5xl md:text-7xl">79<span className="text-2xl opacity-50">/100</span></span>
            </div>
          </header>

          {/* TL;DR Pills Section (2x2 on mobile) */}
          <section className="grid grid-cols-1 min-[370px]:grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 w-full">
            <button 
            onClick={() => handlePillClick('primary')}
            className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
              activeVerdict === 'primary' ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--surface-border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'primary' ? 'bg-[var(--bg)]' : 'bg-[var(--text-primary)] group-hover:bg-[var(--bg)]'}`} />
            Overall Interpretation
          </button>

          <button 
            onClick={() => handlePillClick('career')}
            className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
              activeVerdict === 'career' ? 'bg-[var(--color-y2k-blue)] text-[var(--bg)] border-[var(--color-y2k-blue)]' : 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)] hover:bg-[var(--color-y2k-blue)] hover:border-[var(--color-y2k-blue)]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'career' ? 'bg-white' : 'bg-[var(--color-planet-jupiter)] group-hover:bg-white'}`} />
            Highest: Career (H10)
          </button>
          
          <button 
            onClick={() => handlePillClick('burnout')}
            className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
              activeVerdict === 'burnout' ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--surface-border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'burnout' ? 'bg-white' : 'bg-[var(--color-planet-saturn)] group-hover:bg-white'}`} />
            Vulnerable: Burnout (H6)
          </button>
          
          <button 
            onClick={() => handlePillClick('timing')}
            className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
              activeVerdict === 'timing' ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--surface-border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'timing' ? 'bg-[var(--color-y2k-blue)]' : 'bg-[var(--color-y2k-blue)]'}`} />
            Peak Timing: Mar 14-18
          </button>
        </section>
        </div>

        {/* Dynamic Verdict Block (Scrollytelling swap) */}
        <section id="verdict-container" className="bg-[var(--surface)] text-[var(--text-primary)] w-full p-5 md:p-12 relative border border-[var(--surface-border)] min-h-[250px] scroll-mt-6 box-border" style={{ borderRadius: 'var(--radius-md)' }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeVerdict}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div 
                className="font-mono text-[10px] uppercase tracking-widest mb-4 font-bold" 
                style={{ color: VERDICTS[activeVerdict].color }}
              >
                {VERDICTS[activeVerdict].label}
              </div>
              <h2 className="font-secondary text-3xl md:text-4xl mb-6">
                {VERDICTS[activeVerdict].title}
              </h2>
              <p className="text-xl md:text-2xl leading-relaxed font-body">
                {VERDICTS[activeVerdict].content}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>


        {/* Deep Dive Analysis with Tabs via ChartClient Inspiration */}
        <section id="deep-dive-matrix" className="mt-16 border-t border-[var(--surface-border)] pt-12 pb-20 scroll-mt-6">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-secondary text-3xl md:text-4xl">Deep Dive Matrix</h2>
            
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 w-full pt-2">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full md:w-auto font-mono text-[10px] md:text-xs uppercase tracking-widest px-3 md:px-5 py-3 md:py-2 rounded-lg border transition-all duration-200 last:col-span-2 md:last:col-span-1 ${
                    tab === t.id 
                      ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)] font-bold shadow-sm' 
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--surface-border)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content wrapped in Motion */}
          <div className="bg-[var(--surface)] border border-[var(--surface-border)] p-6 md:p-10" style={{ borderRadius: "var(--radius-lg)" }}>
            <AnimatePresence mode="wait">
              
              {/* TAB: ACG Map Line Impact */}
              {tab === "acg" && (
                <motion.div key="acg" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="mb-8 overflow-hidden rounded-xl border border-[var(--surface-border)]">
                     <AcgMap 
                       natal={MOCK_NATAL} 
                       compact={true} 
                       highlightCity={{ lat: 60.472, lon: 8.4689, name: "Norway" }} 
                     />
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 mt-6">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-planet-jupiter)] flex-shrink-0 flex items-center justify-center text-[var(--bg)] text-4xl shadow-sm" style={{ clipPath: 'var(--cut-sm)' }}>♃</div>
                    <div>
                      <h4 className="font-secondary text-3xl mb-4 text-[var(--text-primary)]">Jupiter MC Line (120km away)</h4>
                      <div className="space-y-4 text-base text-[var(--text-secondary)] leading-relaxed">
                        <p>
                          <strong className="text-[var(--text-primary)] font-mono text-xs uppercase tracking-widest block mb-1">Natal Context</strong> 
                          Jupiter is technically your weakest planet (debilitated in Capricorn and heavily aspected by Saturn).
                        </p>
                        <p>
                          <strong className="text-[var(--text-primary)] font-mono text-xs uppercase tracking-widest block mb-1">The Verdict</strong> 
                          It is extremely beneficial that this ACG line is pushed 120km away from your exact destination. A direct hit from an afflicted Jupiter on the Midheaven often inflates career promises that fall through. The distance dilutes this chaotic expansion, keeping your goals grounded while still providing a faint glimmer of luck.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: Transit Timing */}
              {tab === "timing" && (
                <motion.div key="timing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                       <h4 className="font-secondary text-2xl md:text-3xl text-[var(--text-primary)]">
                         {TRANSIT_WINDOWS[activeTransit].title}
                       </h4>
                       <p className="text-[var(--text-tertiary)] font-mono text-[10px] uppercase tracking-widest mt-1">Aspect Intensity & Dignity Weighting</p>
                     </div>
                     <select 
                       className="p-3 border border-[var(--surface-border)] rounded-md bg-[var(--bg)] text-[var(--text-primary)] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:border-[var(--text-tertiary)] transition-colors outline-none w-full md:w-auto"
                       value={activeTransit}
                       onChange={e => setActiveTransit(Number(e.target.value))}
                     >
                       {TRANSIT_WINDOWS.map((tw) => (
                         <option key={tw.id} value={tw.id}>{tw.label}</option>
                       ))}
                     </select>
                  </div>
                  
                  <div className="border border-[var(--surface-border)] rounded-md overflow-hidden mb-8">
                    <ul className="font-mono text-xs md:text-sm">
                      {TRANSIT_WINDOWS[activeTransit].aspects.map((asp, i) => (
                        <li key={i} className="flex justify-between p-4 border-b border-[var(--surface-border)] last:border-0 items-center bg-[var(--bg)]">
                          <span style={{ color: asp.color }} className="font-bold tracking-widest uppercase">{asp.name}</span>
                          <div className="text-right">
                            <span className="text-[var(--text-primary)] font-bold block">{asp.pts}</span>
                            <span className="text-[var(--text-tertiary)] font-medium text-[10px]">{asp.label}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[var(--bg)] border border-[var(--surface-border)] text-[var(--text-primary)] p-6 rounded-lg font-mono text-sm leading-relaxed relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-y2k-blue)]" />
                    <strong className="text-[var(--color-y2k-blue)] text-[10px] tracking-widest uppercase block mb-2">AI Synthesizer</strong> 
                    <span className="text-[var(--text-secondary)]">{TRANSIT_WINDOWS[activeTransit].ai}</span>
                  </div>
                </motion.div>
              )}

              {/* TAB: Natal Baseline */}
              {tab === "natal" && (
                <motion.div key="natal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                       <div className="flex-1 max-w-[500px] w-full mx-auto relative group">
                          {/* Use NatalMockupWheel from app/chart */}
                          <NatalMockupWheel isDark={true} planets={MOCK_WHEEL_PLANETS as any} cusps={MOCK_NATAL.houses} />
                       </div>
                       <div className="flex-1 space-y-6">
                          <h4 className="font-secondary text-3xl text-[var(--text-primary)] leading-none">Your Innate Alignments</h4>
                          <p className="text-[var(--text-secondary)] font-medium text-lg leading-snug">Your natal blueprint defines your innate tendencies before relocation influences apply.</p>
                          <ul className="space-y-4 font-mono text-sm text-[var(--text-secondary)] border-t border-[var(--surface-border)] pt-6">
                            <li className="flex gap-4">
                              <strong className="text-[var(--color-y2k-blue)] w-32 flex-shrink-0 uppercase tracking-widest">Focus Planet</strong> 
                              <span className="font-bold text-[var(--text-primary)]">Mars in 12H (Aries)</span>
                            </li>
                            <li className="flex gap-4">
                              <strong className="text-[var(--color-y2k-blue)] w-32 flex-shrink-0 uppercase tracking-widest">Expression</strong> 
                              <span>Subconscious drive, hidden actions, repressed courage.</span>
                            </li>
                          </ul>
                       </div>
                    </div>
                </motion.div>
              )}

              {/* TAB: Relocation Chart */}
              {tab === "relocation" && (
                <motion.div key="relocation" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="flex flex-col md:flex-row gap-12 items-center">
                       <div className="flex-1 max-w-[500px] w-full mx-auto relative group">
                          <div className="absolute inset-0 bg-[var(--color-y2k-blue)] opacity-[0.03] pointer-events-none rounded-full" />
                          {/* Use NatalMockupWheel with shifted houses */}
                          <NatalMockupWheel isDark={true} planets={MOCK_WHEEL_PLANETS as any} cusps={MOCK_RELOCATED_HOUSES} />
                       </div>
                       <div className="flex-1 space-y-6">
                          <h4 className="font-secondary text-3xl text-[var(--color-y2k-blue)] leading-none">The Relocation Factor</h4>
                          <p className="text-[var(--text-secondary)] font-medium text-lg leading-snug">
                            When you travel to Norway, the angles of the earth shift your houses. The planets stay the same, but the areas of life they activate drastically transform.
                          </p>
                          <ul className="space-y-4 font-mono text-sm text-[var(--text-secondary)] border-t border-[var(--surface-border)] pt-6">
                            <li className="flex gap-4">
                              <strong className="text-[var(--color-spiced-life)] w-32 flex-shrink-0 uppercase tracking-widest">Mars Shift</strong> 
                              <span className="font-bold text-[var(--text-primary)]">Moves to 10H (Public Life)</span>
                            </li>
                            <li className="flex gap-4">
                              <strong className="text-[var(--color-y2k-blue)] w-32 flex-shrink-0 uppercase tracking-widest">Expression</strong> 
                              <span>The suppression is naturally lifted; your drive manifests publicly as career ambition.</span>
                            </li>
                          </ul>
                       </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: Geodetic Shifts Map */}
              {tab === "geodetic" && (
                <motion.div key="geodetic" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="flex flex-col gap-8">
                    
                    {/* Geodetic Narrative */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                       <div>
                         <h4 className="font-secondary text-3xl text-[var(--text-primary)] leading-none mb-2">Permanent Earth Alignments</h4>
                         <p className="text-[var(--text-secondary)] font-body text-lg">Geodetic astrology projects the zodiac onto the earth itself (0° Aries at Greenwich). When you travel here, your natal planets physically snap to the country's innate energy grid.</p>
                       </div>
                    </div>

                    {/* Visual Map representing Geodetic */}
                    <div className="overflow-hidden rounded-xl border border-[var(--color-y2k-blue)] border-opacity-50 relative group">
                       <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[var(--color-y2k-blue)]/20 to-transparent pointer-events-none z-10" />
                       {/* using compact=false makes it map-like explicitly */}
                       <AcgMap 
                         natal={MOCK_NATAL} 
                         compact={false} 
                         interactive={false}
                         highlightCity={{ lat: 60.472, lon: 8.4689, name: "Norway MC Anchor" }} 
                       />
                       
                       {/* Overlaying a fake Geodetic Grid line over the map */}
                       <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: '52.3%', width: '1px', background: 'var(--color-y2k-blue)' }}>
                          <span className="absolute top-4 left-2 font-mono text-[10px] text-[var(--color-y2k-blue)] font-bold tracking-widest bg-[var(--bg)] px-2 py-1 rounded-sm border border-[var(--color-y2k-blue)]/30">GEODETIC MC LINE (ARIES)</span>
                       </div>
                    </div>

                    {/* Geodetic Math Synthesis */}
                    <div className="font-mono text-xs space-y-3 bg-[var(--bg)] p-6 rounded-lg border border-[var(--surface-border)] mt-2">
                         <div className="border border-[var(--surface-border)] p-3 text-center bg-[var(--surface)]">
                           <span className="text-[var(--text-tertiary)] block mb-1 text-[10px] uppercase tracking-widest">Natal Origin</span>
                           <span className="text-[var(--text-primary)] font-bold text-sm">Mars in 12H (Aries)</span>
                         </div>
                         <div className="h-4 w-px bg-[var(--color-y2k-blue)] mx-auto opacity-50"></div>
                         <div className="w-6 h-6 rounded-full border border-[var(--color-y2k-blue)] mx-auto flex items-center justify-center text-[10px] text-[var(--color-y2k-blue)] bg-[var(--bg)]">∩</div>
                         <div className="h-4 w-px bg-[var(--color-y2k-blue)] mx-auto opacity-50"></div>
                         <div className="border border-[var(--color-y2k-blue)] p-4 bg-[var(--color-y2k-blue)]/10 text-[var(--color-y2k-blue)] font-bold text-center">
                           <span className="block mb-2 text-white text-[10px] font-normal uppercase tracking-widest">Geodetic Snapping Matrix</span>
                           <span className="text-base tracking-widest">Norway MC (Aries)</span>
                         </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </section>

      </div>
    </div>
  );
}
