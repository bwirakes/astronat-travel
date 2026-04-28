"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";
import UpsellCelebrationCard from "@/app/components/UpsellCelebrationCard";
import { PageHeader } from "@/components/app/page-header-context";
import { ScoreRing, getVerdict } from "@/app/components/ScoreRing";
import { hasV4TeacherReading } from "@/app/lib/reading-viewmodel";
import WeatherReading from "./components/weather/WeatherReading";
import HundredOneReadingView from "./components/v4/HundredOneReadingView";

const HOUSE_LABELS: Record<number, string> = {
  1: "Identity",
  2: "Resources",
  3: "Communication",
  4: "Home",
  5: "Romance",
  6: "Work & Health",
  7: "Partnerships",
  8: "Intimacy",
  9: "Expansion",
  10: "Career",
  11: "Community",
  12: "Unseen",
};

const RECOMMENDATION_STYLE: Record<string, { bg: string; border: string; label: string }> = {
  go: { bg: "rgba(46, 196, 182, 0.12)", border: "var(--color-acqua)", label: "GO" },
  caution: { bg: "rgba(255, 180, 60, 0.12)", border: "var(--gold)", label: "CAUTION" },
  avoid: { bg: "rgba(255, 60, 60, 0.12)", border: "var(--color-spiced-life)", label: "RECONSIDER" },
};

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
            partnerNatalPlanets: d.partnerNatalPlanets,
            partnerRelocatedCusps: d.partnerRelocatedCusps,
            synastryAspects: d.synastryAspects,
            houseComparison: d.houseComparison,
            scoreDelta: d.scoreDelta,
            recommendation: d.recommendation,
            narrative: d.narrative,
            weatherForecast: d.weatherForecast,
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
    return <SynastryReadingView reading={reading} narrative={narrative} narrativeLoading={narrativeLoading} showUpsell={showUpsell} paramId={typeof params.id === 'string' ? params.id : undefined} />;
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

// ═══════════════════════════════════════════════════════════════════════════
// Synastry / Couples reading view — branched from ReadingContent when
// reading.category === "synastry". Renders two scores side-by-side,
// overlap/excitement/friction bands, and a couples verdict card.
// ═══════════════════════════════════════════════════════════════════════════
function SynastryReadingView({
  reading,
  narrative,
  narrativeLoading,
  showUpsell,
  paramId,
}: {
  reading: any;
  narrative: any;
  narrativeLoading: boolean;
  showUpsell: boolean;
  paramId: string | undefined;
}) {
  const [tab, setTab] = useState<"user-natal" | "partner-natal" | "synastry-grid">("user-natal");

  const partnerName: string = reading.partnerName || "Partner";
  const userScore: number = reading.userMacroScore ?? reading.macroScore ?? 0;
  const partnerScore: number = reading.partnerMacroScore ?? 0;
  const scoreDelta: number = reading.scoreDelta ?? Math.abs(userScore - partnerScore);
  const recommendation: string = reading.recommendation || "caution";
  const houseComparison: any[] = Array.isArray(reading.houseComparison) ? reading.houseComparison : [];
  const synastryAspects: any[] = Array.isArray(reading.synastryAspects) ? reading.synastryAspects : [];

  const overlapHouses = houseComparison.filter((h) => h.bucket === "overlap");
  const excitementHouses = houseComparison.filter((h) => h.bucket === "excitement");
  const frictionHouses = houseComparison.filter((h) => h.bucket === "friction");

  const tenseAspects = synastryAspects
    .filter((a) => a.tone === "tense")
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 5);
  const harmoniousAspects = synastryAspects
    .filter((a) => a.tone === "harmonious")
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 5);

  const userPlanetsFormatted = (reading.natalPlanets || []).map((p: any) => ({
    planet: p.name.charAt(0).toUpperCase() + p.name.slice(1),
    longitude: p.longitude,
  }));
  const partnerPlanetsFormatted = (reading.partnerNatalPlanets || []).map((p: any) => ({
    planet: (p.name || p.planet || "").charAt(0).toUpperCase() + (p.name || p.planet || "").slice(1),
    longitude: p.longitude,
  }));
  const equalHousesFallback = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const userChartCusps =
    Array.isArray(reading.relocatedCusps) && reading.relocatedCusps.length === 12
      ? reading.relocatedCusps
      : equalHousesFallback;
  const partnerChartCusps =
    Array.isArray(reading.partnerRelocatedCusps) && reading.partnerRelocatedCusps.length === 12
      ? reading.partnerRelocatedCusps
      : equalHousesFallback;

  const recStyle = RECOMMENDATION_STYLE[recommendation] ?? RECOMMENDATION_STYLE.caution;

  return (
    <div className="min-h-screen w-full max-w-full bg-[var(--bg)] text-[var(--text-primary)] relative font-body overflow-x-hidden box-border">
      <PageHeader
        title={String(reading?.destination || "Reading").split(",")[0]}
        backTo="/readings"
        backLabel="All readings"
      />

      <div className="relative px-4 py-8 md:p-12">
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-10 md:gap-12">

          {/* Header — destination + two-score layout side-by-side */}
          <header className="flex flex-col gap-6 border-b border-[var(--surface-border)] pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] mb-2 px-3 py-1 border border-current rounded-full inline-block">
                  Couples Reading · Synastry
                </div>
                <h1 className="font-primary text-5xl sm:text-6xl md:text-8xl leading-[0.85] uppercase">
                  {String(reading.destination || "").split(",")[0]}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6 mt-4">
              <div className="flex flex-col items-center text-center">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-tertiary)" }}>
                  YOU
                </span>
                <div style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                  <ScoreRing score={userScore} verdict={getVerdict(userScore)} />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 px-2">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.55rem",
                    letterSpacing: "0.15em",
                    color: "var(--text-tertiary)",
                  }}
                >
                  DELTA
                </span>
                <div
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                    color: scoreDelta > 20 ? "var(--color-spiced-life)" : "var(--text-secondary)",
                    lineHeight: 1,
                  }}
                >
                  Δ{Math.round(scoreDelta)}
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-tertiary)" }}>
                  {partnerName.toUpperCase()}
                </span>
                <div style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                  <ScoreRing score={partnerScore} verdict={getVerdict(partnerScore)} />
                </div>
              </div>
            </div>
          </header>

          {/* Recommendation badge */}
          <section
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "var(--radius-md)",
              background: recStyle.bg,
              border: `1px solid ${recStyle.border}`,
            }}
            className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: recStyle.border,
                padding: "0.35rem 0.75rem",
                border: `1px solid ${recStyle.border}`,
                borderRadius: "999px",
                alignSelf: "flex-start",
              }}
            >
              {recStyle.label}
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {narrative?.verdict?.content
                ? narrative.verdict.content.split(".").slice(0, 2).join(".") + "."
                : narrativeLoading
                  ? "Synthesising couples verdict…"
                  : `Composite read across ${houseComparison.length} houses, ${synastryAspects.length} cross-aspects.`}
            </p>
          </section>

          {/* Comparison bands: overlap / excitement / friction */}
          <ComparisonBand
            kind="overlap"
            title="Overlap — Shared Leverage"
            subtitle="Houses where you both score high. Aligned terrain."
            color="var(--color-acqua)"
            narrativeItems={narrative?.verdict?.overlap || []}
            houses={overlapHouses}
            userScore={userScore}
            partnerScore={partnerScore}
            partnerName={partnerName}
          />

          <ComparisonBand
            kind="excitement"
            title="Excitement — Asymmetric Upside"
            subtitle="One of you peaks hard. A solo power move, or a stretch for the other."
            color="var(--gold)"
            narrativeItems={narrative?.verdict?.excitement || []}
            houses={excitementHouses}
            userScore={userScore}
            partnerScore={partnerScore}
            partnerName={partnerName}
          />

          <ComparisonBand
            kind="friction"
            title="Friction — Divergence & Tension"
            subtitle="Houses where you diverge, plus tense cross-aspects in play."
            color="var(--color-spiced-life)"
            narrativeItems={narrative?.verdict?.friction || []}
            houses={frictionHouses}
            userScore={userScore}
            partnerScore={partnerScore}
            partnerName={partnerName}
            tenseAspects={tenseAspects}
          />

          {/* Deep dive: charts + aspects grid */}
          <section className="mt-6 border-t border-[var(--surface-border)] pt-10">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 className="font-secondary text-3xl md:text-4xl">Deep Dive</h2>
              <div className="grid grid-cols-3 md:flex gap-2">
                {[
                  { id: "user-natal" as const, label: "Your chart" },
                  { id: "partner-natal" as const, label: `${partnerName}'s chart` },
                  { id: "synastry-grid" as const, label: "Synastry aspects" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full md:w-auto font-mono text-[10px] md:text-xs uppercase tracking-widest px-3 md:px-5 py-3 md:py-2 rounded-lg border transition-all duration-200 ${
                      tab === t.id
                        ? "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)] font-bold"
                        : "bg-transparent text-[var(--text-secondary)] border-[var(--surface-border)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--surface-border)] p-6 md:p-10" style={{ borderRadius: "var(--radius-lg)" }}>
              <AnimatePresence mode="wait">
                {tab === "user-natal" && (
                  <motion.div key="user-natal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="flex-1 max-w-[500px] w-full mx-auto">
                        <NatalMockupWheel isDark={true} planets={userPlanetsFormatted as any} cusps={userChartCusps} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="font-secondary text-2xl">Your natal blueprint</h4>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          Used as the anchor for the synastry cross-aspects. Your Macro score at {String(reading.destination || "").split(",")[0]}: {userScore}/100.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === "partner-natal" && (
                  <motion.div key="partner-natal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="flex-1 max-w-[500px] w-full mx-auto">
                        <NatalMockupWheel isDark={true} planets={partnerPlanetsFormatted as any} cusps={partnerChartCusps} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="font-secondary text-2xl">{partnerName}&apos;s natal blueprint</h4>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          Macro score at {String(reading.destination || "").split(",")[0]}: {partnerScore}/100.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === "synastry-grid" && (
                  <motion.div key="synastry-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    {synastryAspects.length === 0 ? (
                      <p className="text-[var(--text-tertiary)] font-mono text-xs uppercase tracking-widest">No cross-aspects within orbs.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AspectColumn title="Harmonious" items={harmoniousAspects} color="var(--color-acqua)" partnerName={partnerName} />
                        <AspectColumn title="Tense" items={tenseAspects} color="var(--color-spiced-life)" partnerName={partnerName} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Best windows — only render if AI provided them */}
          {narrativeLoading && !narrative && (
            <section className="border-t border-[var(--surface-border)] pt-12">
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] animate-pulse">
                Synthesising couples verdict…
              </div>
            </section>
          )}

          {narrative?.verdict && (
            <section id="verdict" className="border-t border-[var(--surface-border)] pt-12 pb-20 scroll-mt-6">
              <h2 className="font-secondary text-3xl md:text-4xl mb-8">Verdict</h2>
              <div className="bg-[var(--surface)] border border-[var(--surface-border)] p-6 md:p-10 space-y-6" style={{ borderRadius: "var(--radius-lg)" }}>
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--color-y2k-blue)] font-bold mb-2">
                    Couples Verdict
                  </h3>
                  <h4 className="font-secondary text-2xl text-[var(--text-primary)]">
                    {narrative.verdict.title}
                  </h4>
                </div>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-body">
                  {narrative.verdict.content}
                </p>

                {Array.isArray(narrative.verdict.bestWindows) && narrative.verdict.bestWindows.length > 0 && (
                  <div>
                    <h5 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3 font-bold">Best Windows</h5>
                    <ul className="font-mono text-sm space-y-2">
                      {narrative.verdict.bestWindows.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                          <span className="text-[var(--color-planet-jupiter)] font-bold flex-shrink-0 mt-1">●</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {showUpsell && (
            <UpsellCelebrationCard
              returnTo={paramId ? `/reading/${paramId}` : "/dashboard"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonBand({
  kind,
  title,
  subtitle,
  color,
  narrativeItems,
  houses,
  userScore,
  partnerScore,
  partnerName,
  tenseAspects,
}: {
  kind: "overlap" | "excitement" | "friction";
  title: string;
  subtitle: string;
  color: string;
  narrativeItems: string[];
  houses: { house: number; userScore: number; partnerScore: number; delta: number; avg: number }[];
  userScore: number;
  partnerScore: number;
  partnerName: string;
  tenseAspects?: { planet1: string; planet2: string; aspect: string; orb: number; tone: string }[];
}) {
  // Hide the whole band if there is nothing to show
  const hasHouses = houses.length > 0;
  const hasAspects = (tenseAspects?.length ?? 0) > 0;
  const hasNarrative = narrativeItems.length > 0;
  if (!hasHouses && !hasAspects && !hasNarrative) return null;

  return (
    <section
      style={{
        padding: "1.25rem 1.5rem",
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
        border: `1px solid ${color}`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className="mb-4">
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color, fontWeight: 700, marginBottom: "0.35rem" }}>
          {kind.toUpperCase()}
        </div>
        <h3 className="font-secondary text-xl md:text-2xl text-[var(--text-primary)]">{title}</h3>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">{subtitle}</p>
      </div>

      {/* Narrative lines (from AI) */}
      {hasNarrative && (
        <ul className="space-y-2 mb-5">
          {narrativeItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span style={{ color, marginTop: "0.35rem" }}>●</span>
              <span className="text-[var(--text-secondary)] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* House bars — side-by-side */}
      {hasHouses && (
        <div className="space-y-2">
          {houses.map((h) => (
            <HouseCompareRow
              key={h.house}
              house={h.house}
              userScore={h.userScore}
              partnerScore={h.partnerScore}
              partnerName={partnerName}
              color={color}
            />
          ))}
        </div>
      )}

      {/* Tense aspects (friction band only) */}
      {hasAspects && tenseAspects && (
        <div className="mt-4 space-y-1">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--text-tertiary)" }}>
            TENSE CROSS-ASPECTS
          </div>
          {tenseAspects.map((a, i) => (
            <div key={i} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid var(--surface-border)" }}>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {a.planet1} {a.aspect} {partnerName}&apos;s {a.planet2}
              </span>
              <span className="font-mono text-xs" style={{ color }}>orb {a.orb.toFixed(1)}°</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function HouseCompareRow({
  house,
  userScore,
  partnerScore,
  partnerName,
  color,
}: {
  house: number;
  userScore: number;
  partnerScore: number;
  partnerName: string;
  color: string;
}) {
  const label = `H${house} ${HOUSE_LABELS[house] ?? ""}`.trim();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) 3fr", gap: "0.75rem", alignItems: "center" }}>
      <span className="font-mono text-xs text-[var(--text-secondary)]">{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <ScoreBar label="You" score={userScore} color={color} />
        <ScoreBar label={partnerName} score={partnerScore} color={color} />
      </div>
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", minWidth: "2.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "6px", background: "var(--surface-border)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, Math.max(0, score))}%`, height: "100%", background: color, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 600, minWidth: "2rem", textAlign: "right", color: "var(--text-primary)" }}>
        {Math.round(score)}
      </span>
    </div>
  );
}

function AspectColumn({
  title,
  items,
  color,
  partnerName,
}: {
  title: string;
  items: { planet1: string; planet2: string; aspect: string; orb: number }[];
  color: string;
  partnerName: string;
}) {
  return (
    <div style={{ padding: "1rem", border: `1px solid ${color}`, borderRadius: "var(--radius-sm)", background: "var(--bg)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color, fontWeight: 700, marginBottom: "0.75rem" }}>
        {title.toUpperCase()}
      </div>
      {items.length === 0 ? (
        <p className="text-[var(--text-tertiary)] font-mono text-xs">—</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((a, i) => (
            <li key={i} className="flex justify-between items-center py-1" style={{ borderBottom: i < items.length - 1 ? "1px solid var(--surface-border)" : "none" }}>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {a.planet1} {a.aspect} {partnerName}&apos;s {a.planet2}
              </span>
              <span className="font-mono text-xs" style={{ color }}>orb {a.orb.toFixed(1)}°</span>
            </li>
          ))}
        </ul>
      )}
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
