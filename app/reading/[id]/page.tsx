"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";
import { AcgMap } from "@/app/components/AcgMap";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";

type DeepDiveTab = "acg" | "timing" | "natal" | "relocation" | "geodetic";

function ReadingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  
  const [mounted, setMounted] = useState(false);
  const [activeTransit, setActiveTransit] = useState(0);
  const [tab, setTab] = useState<DeepDiveTab>("acg");
  const [activeVerdict, setActiveVerdict] = useState<string>("primary");

  const isDemo = searchParams.get('demo') === 'true';

  // Theme observer
  useEffect(() => {
    setMounted(true);
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };
    
    checkTheme();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") checkTheme();
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function fetchReading() {
      setLoading(true);
      
      if (isDemo) {
        const mockId = typeof params.id === 'string' ? params.id : "1";
        const mockData = MOCK_READING_DETAILS[mockId] || MOCK_READING_DETAILS["1"];
        setReading(mockData);
        setLoading(false);
        return;
      }

      let data: any;
      let error: any;

      if (typeof params.id === 'string' && params.id.length > 30) {
        const res = await supabase.from('readings').select('*').eq('id', params.id).single();
        data = res.data;
        error = res.error;
      } else {
        const res = await supabase.from('readings').select('*').order('created_at', { ascending: false }).limit(1).single();
        data = res.data;
        error = res.error;
      }
      
      if (data && data.details) {
         setReading({
            destination: (data.details as any).destination || "Unknown Destination",
            destinationLat: (data.details as any).destinationLat || 37.7749,
            destinationLon: (data.details as any).destinationLon || -122.4194,
            travelDate: data.reading_date,
            travelType: (data.details as any).travelType || "trip",
            macroScore: (data.details as any).macroScore || data.reading_score || 0,
            macroVerdict: (data.details as any).macroVerdict || "Mixed",
            houses: (data.details as any).houses || [],
            transitWindows: (data.details as any).transitWindows || [],
            planetaryLines: ((data.details as any).planetaryLines || []),
            natalPlanets: (data.details as any).natalPlanets || [],
            relocatedCusps: (data.details as any).relocatedCusps || [],
            aiInsights: (data.details as any).aiInsights || {
                primary: { label: "MACRO OVERVIEW", title: "The Astrological Verdict", content: "Evaluating relocation matrix..." },
                highest: { label: "HIGHEST ENERGY", title: "Peak Resonance", content: "Evaluating relocation matrix..." },
                vulnerable: { label: "FRICTION POINT", title: "Vulnerability Score", content: "Evaluating relocation matrix..." },
                timing: { label: "OPTIMAL ACTION WINDOW", title: "Peak Timing", content: "Evaluating relocation matrix..." }
            },
         });
      } else {
         console.warn("Failed to fetch reading:", error);
      }
      setLoading(false);
    }
    
    fetchReading();
  }, [params.id, supabase, isDemo]);

  if (!mounted || loading || !reading) {
     return (
       <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-charcoal)]">
         <style>{`
           @keyframes spin {
             from { transform: rotate(0deg); }
             to { transform: rotate(360deg); }
           }
         `}</style>
         <img 
           src="/avatar/saturn-monogram.svg" 
           alt="Loading..." 
           style={{ width: '80px', animation: 'spin 3s linear infinite' }}
         />
         <span style={{ 
           fontFamily: 'var(--font-mono)', 
           fontSize: '0.6rem', 
           letterSpacing: '0.2em', 
           textTransform: 'uppercase', 
           marginTop: '1.5rem',
           color: 'var(--color-eggshell)'
         }}>
           Computing Chart Matrix...
         </span>
       </div>
     );
  }

  const tabs: { id: DeepDiveTab, label: string }[] = [
    { id: "acg", label: "ACG Map" },
    { id: "timing", label: "Transit Timing" },
    { id: "natal", label: "Natal Baseline" },
    { id: "relocation", label: "Relocated Chart" },
    { id: "geodetic", label: "Geodetic Shift" }
  ];

  const handlePillClick = (verdictKey: string) => {
    setActiveVerdict(verdictKey);
  };

  const formattedNatal = {
      sun: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'sun') || { longitude: 0 },
      moon: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'moon') || { longitude: 0 },
      mercury: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'mercury') || { longitude: 0 },
      venus: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'venus') || { longitude: 0 },
      mars: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'mars') || { longitude: 0 },
      jupiter: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'jupiter') || { longitude: 0 },
      saturn: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'saturn') || { longitude: 0 },
      uranus: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'uranus') || { longitude: 0 },
      neptune: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'neptune') || { longitude: 0 },
      pluto: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'pluto') || { longitude: 0 },
      chiron: reading.natalPlanets.find((p: any) => p.name.toLowerCase() === 'chiron') || { longitude: 0 },
      houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
  };

  const formattedWheelPlanets = reading.natalPlanets.map((p: any) => ({
      planet: p.name.charAt(0).toUpperCase() + p.name.slice(1),
      longitude: p.longitude
  }));

  const topAcgLine = reading.planetaryLines.length > 0 ? reading.planetaryLines[0] : null;

  const VERDICTS_WITH_COLORS = {
      primary: { ...reading.aiInsights.primary, color: "var(--text-primary)" },
      highest: { ...reading.aiInsights.highest, color: "var(--color-planet-jupiter)" },
      vulnerable: { ...reading.aiInsights.vulnerable, color: "var(--color-planet-saturn)" },
      timing: { ...reading.aiInsights.timing, color: "var(--color-y2k-blue)" }
  } as any;

  const transits = reading.transitWindows || [];
  const safeTransits = transits.length > 0 ? transits : [
    { label: "No exact transits", title: "Window Placeholder", aspects: [] }
  ];

  return (
    <div className="min-h-screen w-full max-w-full bg-[var(--bg)] text-[var(--text-primary)] relative font-body px-4 py-8 md:p-12 overflow-x-hidden box-border">
      
      <span style={{
        position: 'absolute', fontFamily: 'var(--font-display-alt-2)',
        fontSize: 'clamp(20rem, 40vw, 40rem)', color: 'var(--color-y2k-blue)',
        opacity: 0.05, top: '-5%', right: '-10%',
        pointerEvents: 'none', lineHeight: '0.8', zIndex: 0
      }}>
        Flow
      </span>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-10 md:gap-12">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--surface-border)] pb-6 text-[var(--text-primary)]">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.2em] mb-2 px-3 py-1 border border-current rounded-full inline-block">
                Destination Reading
              </div>
              <h1 className="font-primary text-5xl sm:text-6xl md:text-8xl leading-[0.85] uppercase">
                {reading.destination.split(',')[0]}
              </h1>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <span className="block font-mono text-[var(--color-y2k-blue)] text-sm mb-1 uppercase font-bold tracking-widest">Macro Score</span>
              <span className="font-secondary text-5xl md:text-7xl">{reading.macroScore}<span className="text-2xl opacity-50">/100</span></span>
            </div>
          </header>

          <section className="grid grid-cols-1 min-[370px]:grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 w-full">
            <button 
                onClick={() => handlePillClick('primary')}
                className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
                  activeVerdict === 'primary' ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--surface-border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'primary' ? 'bg-[var(--bg)]' : 'bg-[var(--text-primary)] group-hover:bg-[var(--bg)]'}`} />
                {VERDICTS_WITH_COLORS.primary.label}
              </button>

              <button 
                onClick={() => handlePillClick('highest')}
                className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
                  activeVerdict === 'highest' ? 'bg-[var(--color-y2k-blue)] text-[var(--bg)] border-[var(--color-y2k-blue)]' : 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)] hover:bg-[var(--color-y2k-blue)] hover:border-[var(--color-y2k-blue)]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'highest' ? 'bg-white' : 'bg-[var(--color-planet-jupiter)] group-hover:bg-white'}`} />
                {VERDICTS_WITH_COLORS.highest.label}
              </button>
              
              <button 
                onClick={() => handlePillClick('vulnerable')}
                className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
                  activeVerdict === 'vulnerable' ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--surface-border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'vulnerable' ? 'bg-white' : 'bg-[var(--color-planet-saturn)] group-hover:bg-white'}`} />
                {VERDICTS_WITH_COLORS.vulnerable.label}
              </button>
              
              <button 
                onClick={() => handlePillClick('timing')}
                className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer group shadow-sm border ${
                  activeVerdict === 'timing' ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--surface-border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-colors ${activeVerdict === 'timing' ? 'bg-[var(--color-y2k-blue)]' : 'bg-[var(--color-y2k-blue)]'}`} />
                {VERDICTS_WITH_COLORS.timing.label}
              </button>
        </section>
        </div>

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
                style={{ color: VERDICTS_WITH_COLORS[activeVerdict]?.color || 'var(--color-y2k-blue)' }}
              >
                {VERDICTS_WITH_COLORS[activeVerdict]?.label}
              </div>
              <h2 className="font-secondary text-3xl md:text-4xl mb-6">
                {VERDICTS_WITH_COLORS[activeVerdict]?.title}
              </h2>
              <p className="text-xl md:text-2xl leading-relaxed font-body">
                {VERDICTS_WITH_COLORS[activeVerdict]?.content}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>

        <section id="deep-dive-matrix" className="mt-16 border-t border-[var(--surface-border)] pt-12 pb-20 scroll-mt-6">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-secondary text-3xl md:text-4xl">Deep Dive Matrix</h2>
            
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

          <div className="bg-[var(--surface)] border border-[var(--surface-border)] p-6 md:p-10" style={{ borderRadius: "var(--radius-lg)" }}>
            <AnimatePresence mode="wait">
              
              {tab === "acg" && (
                <motion.div key="acg" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="mb-8 overflow-hidden rounded-xl border border-[var(--surface-border)]">
                     <AcgMap 
                       natal={formattedNatal} 
                       compact={true} 
                       highlightCity={{ lat: reading.destinationLat, lon: reading.destinationLon, name: reading.destination.split(',')[0] }} 
                     />
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 mt-6">
                    {topAcgLine ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-[var(--color-planet-jupiter)] flex-shrink-0 flex items-center justify-center text-[var(--bg)] text-4xl shadow-sm" style={{ clipPath: 'var(--cut-sm)' }}>
                                {topAcgLine.planet.charAt(0).toUpperCase()}
                            </div>
                            <div>
                            <h4 className="font-secondary text-3xl mb-4 text-[var(--text-primary)]">{topAcgLine.planet} {topAcgLine.angle || topAcgLine.line} Line ({topAcgLine.distance_km || 0}km away)</h4>
                            <div className="space-y-4 text-base text-[var(--text-secondary)] leading-relaxed">
                                <p>
                                <strong className="text-[var(--text-primary)] font-mono text-xs uppercase tracking-widest block mb-1">Geographic Impact</strong> 
                                This is your closest measurable planetary line. Its energy directly colors your ambient experience in this location.
                                </p>
                            </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h4 className="font-secondary text-3xl mb-4 text-[var(--text-primary)]">Neutral Zone</h4>
                            <div className="space-y-4 text-base text-[var(--text-secondary)] leading-relaxed">
                                <p>This location has no major planetary lines within 1000km. The energy is dictated wholly by your relocated house shifts instead.</p>
                            </div>
                        </div>
                    )}
                  </div>
                </motion.div>
              )}

              {tab === "timing" && (
                <motion.div key="timing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                       <h4 className="font-secondary text-2xl md:text-3xl text-[var(--text-primary)]">
                         {safeTransits[activeTransit]?.title || "Timing Analysis"}
                       </h4>
                       <p className="text-[var(--text-tertiary)] font-mono text-[10px] uppercase tracking-widest mt-1">Aspect Intensity & Dignity Weighting</p>
                     </div>
                     <select 
                       className="p-3 border border-[var(--surface-border)] rounded-md bg-[var(--bg)] text-[var(--text-primary)] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:border-[var(--text-tertiary)] transition-colors outline-none w-full md:w-auto"
                       value={activeTransit}
                       onChange={e => setActiveTransit(Number(e.target.value))}
                     >
                       {safeTransits.map((tw: any, i: number) => (
                         <option key={i} value={i}>{tw.date || tw.label || `Transit Event ${i+1}`}</option>
                       ))}
                     </select>
                  </div>
                  
                  {safeTransits[activeTransit]?.aspects ? (
                      <div className="border border-[var(--surface-border)] rounded-md overflow-hidden mb-8">
                        <ul className="font-mono text-xs md:text-sm">
                        {safeTransits[activeTransit].aspects.map((asp: any, idx: number) => (
                            <li key={idx} className="flex justify-between p-4 border-b border-[var(--surface-border)] last:border-0 items-center bg-[var(--bg)]">
                            <span style={{ color: asp.color || 'var(--text-primary)' }} className="font-bold tracking-widest uppercase">{asp.name || asp.aspect}</span>
                            <div className="text-right">
                                <span className="text-[var(--text-primary)] font-bold block">{asp.pts || asp.influence}</span>
                                <span className="text-[var(--text-tertiary)] font-medium text-[10px]">{asp.label}</span>
                            </div>
                            </li>
                        ))}
                        </ul>
                      </div>
                  ) : (
                      <div className="p-8 text-center text-sm font-mono text-[var(--text-tertiary)] border border-dashed border-[var(--surface-border)] rounded-lg mb-8 uppercase tracking-widest">
                         No Major Aspects Found for this Timeline
                      </div>
                  )}

                  <div className="bg-[var(--bg)] border border-[var(--surface-border)] text-[var(--text-primary)] p-6 rounded-lg font-mono text-sm leading-relaxed relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-y2k-blue)]" />
                    <strong className="text-[var(--color-y2k-blue)] text-[10px] tracking-widest uppercase block mb-2">AI Synthesizer</strong> 
                    <span className="text-[var(--text-secondary)]">{safeTransits[activeTransit]?.ai || VERDICTS_WITH_COLORS.timing.content}</span>
                  </div>
                </motion.div>
              )}

              {tab === "natal" && (
                <motion.div key="natal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                       <div className="flex-1 max-w-[500px] w-full mx-auto relative group">
                          <NatalMockupWheel isDark={true} planets={formattedWheelPlanets as any} cusps={formattedNatal.houses} />
                       </div>
                       <div className="flex-1 space-y-6">
                          <h4 className="font-secondary text-3xl text-[var(--text-primary)] leading-none">Your Innate Alignments</h4>
                          <p className="text-[var(--text-secondary)] font-medium text-lg leading-snug">Your natal blueprint defines your innate tendencies before relocation influences apply.</p>
                       </div>
                    </div>
                </motion.div>
              )}

              {tab === "relocation" && (
                <motion.div key="relocation" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="flex flex-col md:flex-row gap-12 items-center">
                       <div className="flex-1 max-w-[500px] w-full mx-auto relative group">
                          <div className="absolute inset-0 bg-[var(--color-y2k-blue)] opacity-[0.03] pointer-events-none rounded-full" />
                          <NatalMockupWheel isDark={true} planets={formattedWheelPlanets as any} cusps={reading.relocatedCusps.length === 12 ? reading.relocatedCusps : formattedNatal.houses} />
                       </div>
                       <div className="flex-1 space-y-6">
                          <h4 className="font-secondary text-3xl text-[var(--color-y2k-blue)] leading-none">The Relocation Factor</h4>
                          <p className="text-[var(--text-secondary)] font-medium text-lg leading-snug">
                            When you travel to {reading.destination.split(',')[0]}, the angles of the earth shift your houses. The planets stay the same, but the areas of life they activate drastically transform.
                          </p>
                       </div>
                  </div>
                </motion.div>
              )}

              {tab === "geodetic" && (
                <motion.div key="geodetic" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                       <div>
                         <h4 className="font-secondary text-3xl text-[var(--text-primary)] leading-none mb-2">Permanent Earth Alignments</h4>
                         <p className="text-[var(--text-secondary)] font-body text-lg">Geodetic astrology projects the zodiac onto the earth itself (0° Aries at Greenwich). When you travel here, your natal planets physically snap to the country's innate energy grid.</p>
                       </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[var(--color-y2k-blue)] border-opacity-50 relative group">
                       <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[var(--color-y2k-blue)]/20 to-transparent pointer-events-none z-10" />
                       <AcgMap 
                         natal={formattedNatal} 
                         compact={false} 
                         interactive={false}
                         highlightCity={{ lat: reading.destinationLat, lon: reading.destinationLon, name: reading.destination.split(',')[0] }} 
                       />
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

export default function ReadingPage() {
  return (
    <Suspense fallback={null}>
      <ReadingContent />
    </Suspense>
  );
}
