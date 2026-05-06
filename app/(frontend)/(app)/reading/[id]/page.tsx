"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";
import { hasV4TeacherReading } from "@/app/lib/reading-viewmodel";
import { toCouplesViewModel } from "@/app/lib/couples-viewmodel";
import WeatherReading from "./components/weather/WeatherReading";
import HundredOneReadingView from "./components/v4/HundredOneReadingView";
import CouplesReadingView from "./components/couples/CouplesReadingView";

function ReadingContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  const [mounted, setMounted] = useState(false);
  const [narrative, setNarrative] = useState<any>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  const isDemo = searchParams.get('demo') === 'true';

  // Fetch access state once the reading resolves — only show the upsell to
  // authenticated, non-subscribed users who have already consumed their free reading.
  useEffect(() => {
    if (isDemo || !reading) return;
    let active = true;
    fetch('/api/access')
      .then(r => r.json())
      .then(a => {
        if (!active) return;
        if (a?.authenticated && !a.hasSubscription && a.freeUsed) setShowUpsell(true);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isDemo, reading]);

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

  const DEFAULT_AI_INSIGHTS = {
    primary: { label: "MACRO OVERVIEW", title: "The Astrological Verdict", content: "Evaluating relocation matrix..." },
    highest: { label: "HIGHEST ENERGY", title: "Peak Resonance", content: "Evaluating relocation matrix..." },
    vulnerable: { label: "FRICTION POINT", title: "Vulnerability Score", content: "Evaluating relocation matrix..." },
    timing: { label: "OPTIMAL ACTION WINDOW", title: "Peak Timing", content: "Evaluating relocation matrix..." }
  };

  useEffect(() => {
    async function fetchReading() {
      setLoading(true);
      
      if (isDemo) {
        const mockId = typeof params.id === 'string' ? params.id : "1";
        const mockData = MOCK_READING_DETAILS[mockId] || MOCK_READING_DETAILS["1"];
        setReading({
          ...mockData,
          destination: mockData.destination || "Unknown Destination",
          destinationLat: mockData.destinationLat || 37.7749,
          destinationLon: mockData.destinationLon || -122.4194,
          planetaryLines: mockData.planetaryLines || [],
          relocatedCusps: mockData.relocatedCusps || [],
          aiInsights: mockData.aiInsights || DEFAULT_AI_INSIGHTS
        });
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let data: any;
      let error: any;

      if (typeof params.id === 'string' && params.id.length > 30) {
        const res = await supabase
          .from('readings')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();
        data = res.data;
        error = res.error;
      } else {
        // Short/invalid ID — fetch the user's most recent reading instead of any user's.
        const res = await supabase
          .from('readings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        data = res.data;
        error = res.error;
      }
      
      if (data && data.details) {
         const d = data.details as any;
         setReading({
            category: data.category || "astrocartography",
            destination: d.destination || "Unknown Destination",
            destinationLat: d.destinationLat || 37.7749,
            destinationLon: d.destinationLon || -122.4194,
            travelDate: d.travelDate
              || (typeof data.reading_date === "string"
                ? data.reading_date.slice(0, 10)
                : new Date(data.reading_date).toISOString().slice(0, 10)),
            travelType: d.travelType || "trip",
            macroScore: d.macroScore || data.reading_score || 0,
            macroVerdict: d.macroVerdict || "Mixed",
            houses: d.houses || [],
            transitWindows: d.transitWindows || [],
            planetaryLines: d.planetaryLines || [],
            acgLines: d.acgLines || [],
            userPlanetaryLines: d.userPlanetaryLines || [],
            natalPlanets: d.natalPlanets || [],
            relocatedCusps: d.relocatedCusps || [],
            natalCusps: d.natalCusps || [],
            natalAngles: d.natalAngles,
            birth: d.birth,
            birthDate: d.birth?.date || d.birthDate,
            birthTime: d.birth?.time || d.birthTime,
            birthLat: d.birth?.lat ?? d.birthLat,
            birthLon: d.birth?.lon ?? d.birthLon,
            teacherReading: d.teacherReading,
            aiInsights: d.aiInsights || DEFAULT_AI_INSIGHTS,
            // Synastry-only fields (undefined for astrocartography)
            partnerName: d.partnerName,
            userMacroScore: d.userMacroScore,
            userMacroVerdict: d.userMacroVerdict,
            userHouses: d.userHouses,
            partnerMacroScore: d.partnerMacroScore,
            partnerMacroVerdict: d.partnerMacroVerdict,
            partnerHouses: d.partnerHouses,
            partnerPlanetaryLines: d.partnerPlanetaryLines,
            partnerNatalPlanets: d.partnerNatalPlanets,
            partnerRelocatedCusps: d.partnerRelocatedCusps,
            partnerEventScores: d.partnerEventScores,
            userEventScores: d.userEventScores,
            synastryAspects: d.synastryAspects,
            houseComparison: d.houseComparison,
            scoreDelta: d.scoreDelta,
            recommendation: d.recommendation,
            narrative: d.narrative,
            weatherForecast: d.weatherForecast,
            couplesReading: d.couplesReading,
         });
      } else {
         console.warn("Failed to fetch reading:", error);
         setNotFound(true);
      }
      setLoading(false);
    }
    
    fetchReading();
  }, [params.id, supabase, isDemo]);

  // Fetch narrative separately — streaming NDJSON, sections arrive progressively.
  // Skipped when the new teacherReading payload is present (new pipeline already
  // produced the long-form copy in a single AI call with the shared voice).
  useEffect(() => {
    if (!reading || isDemo || typeof params.id !== 'string' || params.id.length < 30) return;
    if (reading.weatherForecast) return;
    if (reading.teacherReading) {
      if (!hasV4TeacherReading(reading.teacherReading)) {
        console.info("[reading-page] teacherReading is incomplete for V4; using deterministic V4 fallbacks.");
      }
      return;
    }

    if (reading.narrative) {
      setNarrative(reading.narrative);
      return;
    }

    let cancelled = false;
    setNarrativeLoading(true);
    setNarrative(null);

    (async () => {
      try {
        const res = await fetch(`/api/readings/${params.id}/narrative`, { method: 'POST' });
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const accumulated: Record<string, any> = {};

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.section && msg.data) {
                accumulated[msg.section] = msg.data;
                setNarrative({ ...accumulated });
              } else if (msg.done) {
                setNarrativeLoading(false);
              } else if (msg.error) {
                console.warn('Narrative partial error:', msg.error);
              }
            } catch {
              console.warn('Failed to parse NDJSON line:', line);
            }
          }
        }
      } catch (err) {
        console.error('Narrative stream failed:', err);
      } finally {
        if (!cancelled) setNarrativeLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [reading, params.id, isDemo]);

  if (!mounted || loading) {
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

  if (notFound || !reading) {
    router.replace("/readings");
    return null;
  }

  const isSynastry = reading.category === "synastry";
  // Geodetic weather readings live under category "mundane" (enum constraint)
  // and are discriminated by the presence of details.weatherForecast.
  const isWeather = !!reading.weatherForecast;

  if (isWeather) {
    return <WeatherReading forecast={reading.weatherForecast} readingId={typeof params.id === "string" ? params.id : undefined} />;
  }

  if (isSynastry) {
    const reshaped = { ...reading, narrative };
    return <CouplesReadingView vm={toCouplesViewModel(reshaped)} paramId={typeof params.id === 'string' ? params.id : undefined} />;
  }

  return (
    <HundredOneReadingView
      reading={reading}
      narrative={narrative}
      narrativeLoading={narrativeLoading}
      showUpsell={showUpsell}
      paramId={typeof params.id === 'string' ? params.id : undefined}
    />
  );
}

export default function ReadingPage() {
  return (
    <Suspense fallback={null}>
      <ReadingContent />
    </Suspense>
  );
}
