"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, Suspense, type ReactElement } from "react";
import { createClient } from "@/lib/supabase/client";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";
import { hasV4TeacherReading } from "@/app/lib/reading-viewmodel";
import { AstroAppLoader } from "@/app/components/ui/app-loader-shell";

function LoadingWeatherReading(): ReactElement {
  return <AstroAppLoader label="Loading weather reading..." />;
}

function LoadingReading(): ReactElement {
  return <AstroAppLoader label="Loading reading..." />;
}

function LoadingCouplesReading(): ReactElement {
  return <AstroAppLoader label="Loading couples reading..." />;
}

function normalizeRouteId(rawId: string | string[] | undefined): string {
  if (typeof rawId === "string") return rawId;
  if (Array.isArray(rawId)) return rawId[0] ?? "";
  return "";
}

const WeatherReading = dynamic(() => import("./components/weather/WeatherReading"), {
  loading: LoadingWeatherReading,
});

const HundredOneReadingView = dynamic(() => import("./components/v4/HundredOneReadingView"), {
  loading: LoadingReading,
});

const CouplesReadingRouteView = dynamic(() => import("./components/couples/CouplesReadingRouteView"), {
  loading: LoadingCouplesReading,
});

const DEFAULT_AI_INSIGHTS = {
  primary: { label: "MACRO OVERVIEW", title: "The Astrological Verdict", content: "Evaluating relocation matrix..." },
  highest: { label: "HIGHEST ENERGY", title: "Peak Resonance", content: "Evaluating relocation matrix..." },
  vulnerable: { label: "FRICTION POINT", title: "Vulnerability Score", content: "Evaluating relocation matrix..." },
  timing: { label: "OPTIMAL ACTION WINDOW", title: "Peak Timing", content: "Evaluating relocation matrix..." }
};

function ReadingContent(): ReactElement | null {
  const params = useParams<{ id?: string | string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const readingId = normalizeRouteId(params.id);

  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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

  useEffect(() => {
    let active = true;

    async function fetchReading() {
      setLoading(true);
      setNotFound(false);
      
      if (isDemo) {
        const mockId = readingId || "1";
        const mockData = MOCK_READING_DETAILS[mockId] || MOCK_READING_DETAILS["1"];
        if (!active) return;
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
      if (!active) return;
      if (!user) {
        setLoading(false);
        return;
      }

      let data: any;
      let error: any;

      if (readingId.length > 30) {
        const res = await supabase
          .from('readings')
          .select('*')
          .eq('id', readingId)
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

      if (!active) return;
      
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
            // Geodetic / parans / live transits — needed by the V4 viewmodel's
            // deriveGeodetic and deriveParans. Without these, vm.geodetic
            // returns null and every teacher-copy section on the place-field
            // tab gets gated off even when the LLM emitted them.
            geodeticBand: d.geodeticBand,
            activeGeoTransits: d.activeGeoTransits,
            parans: d.parans,
            geodeticEngineVersion: d.geodeticEngineVersion,
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
            partnerNatalCusps: d.partnerNatalCusps,
            partnerEventScores: d.partnerEventScores,
            userEventScores: d.userEventScores,
            synastryAspects: d.synastryAspects,
            houseComparison: d.houseComparison,
            scoreDelta: d.scoreDelta,
            recommendation: d.recommendation,
            narrative: d.narrative,
            weatherForecast: d.weatherForecast,
            couplesReading: d.couplesReading,
            bestWindows: d.bestWindows,
            avoidWindows: d.avoidWindows,
            bestWindowScores: d.bestWindowScores,
            avoidWindowScores: d.avoidWindowScores,
            // Universal sky — pass through so PlaceFieldTab §03 and the
            // TimingTab Gantt sky rows can render. Optional for back-compat
            // with cached readings that predate these fields.
            universalSky: d.universalSky,
            universalSkySpans: d.universalSkySpans,
            eventScores: d.eventScores,
         });
      } else {
         console.warn("Failed to fetch reading:", error);
         setNotFound(true);
      }
      setLoading(false);
    }
    
    fetchReading();
    return () => { active = false; };
  }, [readingId, supabase, isDemo]);

  // Fetch narrative separately — streaming NDJSON, sections arrive progressively.
  // Skipped when the new teacherReading payload is present (new pipeline already
  // produced the long-form copy in a single AI call with the shared voice).
  useEffect(() => {
    if (!reading || isDemo || readingId.length < 30) return;
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
        const res = await fetch(`/api/readings/${readingId}/narrative`, { method: 'POST' });
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
  }, [reading, readingId, isDemo]);

  useEffect(() => {
    if (!loading && (notFound || !reading)) {
      router.replace("/readings");
    }
  }, [loading, notFound, reading, router]);

  if (loading) {
    return <AstroAppLoader label="Computing chart matrix..." />;
  }

  if (notFound || !reading) {
    return null;
  }

  const isSynastry = reading.category === "synastry";
  // Geodetic weather readings live under category "mundane" (enum constraint)
  // and are discriminated by the presence of details.weatherForecast.
  const isWeather = !!reading.weatherForecast;

  if (isWeather) {
    return <WeatherReading forecast={reading.weatherForecast} readingId={readingId || undefined} />;
  }

  if (isSynastry) {
    return (
      <CouplesReadingRouteView
        reading={reading}
        narrative={narrative}
        paramId={readingId || undefined}
      />
    );
  }

  return (
    <HundredOneReadingView
      reading={reading}
      narrative={narrative}
      narrativeLoading={narrativeLoading}
      showUpsell={showUpsell}
      paramId={readingId || undefined}
    />
  );
}

export default function ReadingPage(): ReactElement {
  return (
    <Suspense fallback={null}>
      <ReadingContent />
    </Suspense>
  );
}
