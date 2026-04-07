"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";

// Mockup components for editorial scrollytelling
import RelocatedWheelInteractive from "../../mock-reading-design/components/RelocatedWheelInteractive";
import { PlanetaryShiftStory } from "./components/PlanetaryShiftStory";
import { GeographicACGMapLines, GeographicBackgroundMap } from "../../mock-reading-design/components/GeographicACGMap";
import { FinalReportSummary } from "../../mock-reading-design/components/FinalReportSummary";
import { useAnimationMachine } from "../../mock-reading-design/AnimationMachine";
import DashboardLayout from "../../components/DashboardLayout";
import { AstroPill } from "../../components/ui/astro-pill";

// Feature Toggles (Modularized Steps)
const SHOW_PLANETARY_SHIFT = false; // Step 1: Relocated Wheel & Planetary Shifts
const SHOW_GEOGRAPHIC_MAP = false;  // Step 2: ACG Map Lines
const SHOW_FINAL_REPORT = true;     // Step 3: Final Report Summary

export default function ReadingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  const wheelOpacity = useAnimationMachine((s) => s.wheelOpacity);
  const activeView = useAnimationMachine((s) => s.activeView);

  const isDemo = searchParams.get('demo') === 'true';

  // Theme observer from mockup
  useEffect(() => {
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
        // Skip Supabase call for demo
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
            travelDate: data.reading_date,
            travelType: (data.details as any).travelType || "trip",
            macroScore: data.reading_score,
            houses: (data.details as any).houses || [],
            transitWindows: (data.details as any).transitWindows || [],
            planetaryLines: ((data.details as any).planetaryLines || []).map((l: any) => {
                let d = l.distance_km;
                if (d === undefined && typeof l.distance === 'string') {
                    d = parseInt(l.distance.replace(/\\D/g, ""), 10);
                } else if (d === undefined && typeof l.distance === 'number') {
                    d = l.distance;
                }
                return {
                    ...l,
                    planet: l.planet,
                    angle: l.angle || l.line || "",
                    distance_km: d || 0,
                    is_paran: l.is_paran || false
                };
            }),
            aiInsights: (data.details as any).aiInsights || {},
         });
      } else {
         console.warn("Failed to fetch reading:", error);
      }
      setLoading(false);
    }
    
    fetchReading();
  }, [params.id, supabase, isDemo]);

  if (loading || !reading) {
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

  // Skip logic from mockup
  let skipHref = "#section-map-intro";
  let skipText = "Skip to Map";
  let showSkip = SHOW_PLANETARY_SHIFT || SHOW_GEOGRAPHIC_MAP;

  if (activeView.startsWith("map") || activeView.startsWith("acg")) {
    skipHref = "#section-report";
    skipText = "Skip to Verdict";
  } else if (activeView === "report" || (!SHOW_PLANETARY_SHIFT && !SHOW_GEOGRAPHIC_MAP)) {
    showSkip = false;
  }

  return (
    <DashboardLayout maxWidth="1000px" backLabel="Home">
      
      {/* Set the color based on dark mode correctly */}
      <style jsx global>{`
        body {
          background-color: ${isDark ? "var(--color-charcoal)" : "var(--color-eggshell)"};
          color: ${isDark ? "var(--color-eggshell)" : "var(--color-charcoal)"};
        }
      `}</style>

      {/* ═══ FIXED BACKGROUNDS ═══ */}
      <div id="interactive-backgrounds" className="fixed inset-0 z-0 pointer-events-none">
        {SHOW_PLANETARY_SHIFT && (
          <div 
            id="wheel-container" 
            className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[12%] transition-opacity duration-1000"
            style={{ opacity: wheelOpacity }}
          >
            <div style={{ width: "min(70vh, 574px)", aspectRatio: "1" }}>
              <RelocatedWheelInteractive isDark={isDark} />
            </div>
          </div>
        )}
        {SHOW_GEOGRAPHIC_MAP && <GeographicBackgroundMap />}
      </div>

      {/* ═══ SCROLLING CONTENT FOREGROUND ═══ */}
      <div className="relative z-20">
        <div className="h-0" id="top" />

        {/* INTRO BLOCKED OUT FOR NOW
        <section id="section-intro" className="relative min-h-screen flex items-center justify-center px-6 text-center snap-start">
          <div className={`max-w-2xl mt-12 p-12 relative z-10 transition-colors duration-700
            ${isDark 
              ? "bg-[var(--color-charcoal)] border-t border-[var(--color-charcoal)]" 
              : "bg-white border-t border-[var(--surface-border)]"
            }`}
            style={{ clipPath: "var(--cut-lg)" }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden mix-blend-overlay">
              <span className="font-display-alt whitespace-nowrap" style={{ fontSize: "clamp(12rem, 30vw, 24rem)", lineHeight: 0.8 }}>
                {reading.destination.split(',')[0].toUpperCase()}
              </span>
            </div>

            <div className={`relative z-20 inline-flex items-center gap-3 px-4 py-2 rounded-full border mb-8
              ${isDark ? "border-[var(--color-planet-sun)]/40 bg-[var(--color-planet-sun)]/10 text-[var(--color-planet-sun)]" : "border-[var(--color-y2k-blue)]/30 bg-[var(--color-y2k-blue)]/5 text-[var(--color-y2k-blue)]"}`}>
               <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
               <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold">{reading.travelType === 'trip' ? 'Short Trip' : 'Relocation'} Reading Engine</span>
            </div>
            
            <h1 className="relative z-20 font-primary text-5xl md:text-7xl leading-[0.85] tracking-tight uppercase mb-6" style={{ textShadow: isDark ? "0 4px 40px rgba(0,0,0,0.8)" : "none" }}>
              The {reading.destination.split(',')[0]}<br />Shift
            </h1>

            <p className="font-body text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
              Scroll down to witness how your planetary energies realign geographically. We calculate exact angular offsets and Geographic paths tailored to your birth chart.
            </p>
          </div>
        </section>
        */}

        {/* PLANET SHIFTS */}
        {SHOW_PLANETARY_SHIFT && (
          <div className="relative pb-60">
             <PlanetaryShiftStory houses={reading.houses} destination={reading.destination} />
          </div>
        )}

        {/* MAP SECTIONS */}
        {SHOW_GEOGRAPHIC_MAP && (
          <GeographicACGMapLines reading={reading} />
        )}

        {/* FINAL REPORT */}
        {SHOW_FINAL_REPORT && (
          <FinalReportSummary reading={reading} />
        )}

      </div>

      {/* SKIP BUTTON */}
      {showSkip && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
          <a href={skipHref}>
            <AstroPill
              shape="cut"
              size="md"
              variant="ghost"
              style={{ backdropFilter: "blur(8px)", background: "var(--surface)", color: "var(--text-primary)" }}
            >
              {skipText} →
            </AstroPill>
          </a>
        </div>
      )}
    </DashboardLayout>
  );
}
