"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import DashboardLayout from "@/app/components/DashboardLayout";
import { ChartWheel, type NatalData } from "@/app/components/ChartWheel";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import { AcgMap } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import PlanetIcon from "@/app/components/PlanetIcon";
import AspectIcon from "@/app/components/AspectIcon";
import { essentialDignityLabel } from "@/app/lib/dignity";
import { PlanetHoverCard } from "@/app/components/ui/planet-hover-card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";
import { SectionHeader } from "@/app/components/ui/section-header";
import { PLANET_DOMAINS, HOUSE_DOMAINS, getOrdinal } from "@/app/lib/astro-wording";



// ── Mock data for ?demo=true ───────────────────────────────────

const DEMO_NATAL: NatalData = {
  sun:     { longitude: 144.92 },
  moon:    { longitude: 200.47 },
  mercury: { longitude: 158.89 },
  venus:   { longitude: 99.26 },
  mars:    { longitude: 10.91 },
  jupiter: { longitude: 63.85 },
  saturn:  { longitude: 266.06 },
  uranus:  { longitude: 267.19 },
  neptune: { longitude: 277.69 },
  pluto:   { longitude: 219.99 },
  chiron:  { longitude: 101.45 },
  houses: [32.64, 62.33, 90.84, 119.64, 150.15, 181.91, 212.64, 242.33, 270.84, 299.64, 330.15, 1.91],
};

const MOCK_PLANETS = [
  { planet: "Ascendant",  sign: "Taurus",      house: 1,  degree: "2° 38′",  dignity: null, isAngle: true },
  { planet: "Sun",        sign: "Leo",         house: 4,  degree: "24° 55′", dignity: "DOMICILE", isAngle: false },
  { planet: "Moon",       sign: "Libra",       house: 6,  degree: "20° 28′", dignity: null, isAngle: false },
  { planet: "Mercury",    sign: "Virgo",       house: 5,  degree: "8° 53′",  dignity: "DOMICILE", isAngle: false },
  { planet: "Venus",      sign: "Cancer",      house: 3,  degree: "9° 15′",  dignity: null, isAngle: false },
  { planet: "Mars",       sign: "Aries",       house: 12, degree: "10° 54′", dignity: "DOMICILE", isAngle: false },
  { planet: "Jupiter",    sign: "Gemini",      house: 2,  degree: "3° 51′",  dignity: "DETRIMENT", isAngle: false },
  { planet: "Saturn",     sign: "Sagittarius", house: 8,  degree: "26° 03′", dignity: null, isAngle: false },
  { planet: "Uranus",     sign: "Sagittarius", house: 8,  degree: "27° 11′", dignity: null, isAngle: false },
  { planet: "Neptune",    sign: "Capricorn",   house: 9,  degree: "7° 41′",  dignity: null, isAngle: false },
  { planet: "Pluto",      sign: "Scorpio",     house: 7,  degree: "9° 59′",  dignity: "DOMICILE", isAngle: false },
  { planet: "MC",         sign: "Capricorn",   house: 10, degree: "29° 38′", dignity: null, isAngle: true },
];

const MOCK_ASPECTS = [
  { aspect: "Sun sextile Moon",       orb: "4° 27′", type: "Sextile",     verdict: 82 },
  { aspect: "Sun trine Saturn",       orb: "1° 08′", type: "Trine",       verdict: 95 },
  { aspect: "Sun trine Uranus",       orb: "2° 16′", type: "Trine",       verdict: 91 },
  { aspect: "Mercury sextile Venus",   orb: "0° 23′", type: "Sextile",     verdict: 98 },
  { aspect: "Mercury trine Neptune",   orb: "1° 12′", type: "Trine",       verdict: 95 },
  { aspect: "Mercury sextile Pluto",   orb: "1° 06′", type: "Sextile",     verdict: 96 },
  { aspect: "Venus square Mars",       orb: "1° 39′", type: "Square",      verdict: 43 },
  { aspect: "Venus opposition Neptune",orb: "1° 34′", type: "Opposition",  verdict: 44 },
  { aspect: "Venus trine Pluto",       orb: "0° 44′", type: "Trine",       verdict: 97 },
  { aspect: "Mars square Neptune",     orb: "3° 13′", type: "Square",      verdict: 37 },
  { aspect: "Saturn conjunction Uranus",orb: "1° 08′", type: "Conjunction",verdict: 85 },
  { aspect: "Neptune sextile Pluto",   orb: "2° 18′", type: "Sextile",     verdict: 91 },
];

const ASPECT_COLORS: Record<string, string> = {
  Trine:       "var(--sage)",
  Sextile:     "var(--sage)",
  Conjunction: "var(--color-y2k-blue)",
  Opposition:  "var(--color-planet-mars)",
  Square:      "var(--color-spiced-life)",
};

const DEMO_CITY = { lat: -6.2088, lon: 106.8456, name: "Jakarta" };

type Tab = "overview" | "map" | "aspects";

// ── Interpretation block (streaming-friendly) ─────────────────

function InterpretationBlock({
  section,
  kicker,
  loading,
  fallback,
  variant = "default",
}: {
  section?: { title: string; content: string } | null;
  kicker: string;
  loading?: boolean;
  fallback?: string;
  variant?: "default" | "hero" | "panel";
}) {
  if (!section) {
    if (!loading) return null;
    return (
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)",
        padding: "1.5rem 0", letterSpacing: "0.1em", textTransform: "uppercase",
      }} className="animate-pulse">
        {fallback ?? "Synthesizing..."}
      </div>
    );
  }

  const titleSize =
    variant === "hero" ? "clamp(1.25rem, 2.2vw, 1.6rem)"
    : variant === "panel" ? "1.05rem"
    : "clamp(1.1rem, 1.8vw, 1.3rem)";
  const bodySize = "0.95rem";

  const wrapperStyle: React.CSSProperties = variant === "panel"
    ? {
        display: "flex", flexDirection: "column", gap: "0.45rem",
        background: "var(--surface)", border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)", padding: "1rem 1.25rem",
      }
    : { display: "flex", flexDirection: "column", gap: "0.5rem" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={wrapperStyle}
    >
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em",
        color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 600,
      }}>
        {kicker}
      </div>
      <h3 style={{
        fontFamily: "var(--font-secondary, var(--font-primary))", fontSize: titleSize,
        margin: 0, lineHeight: 1.2, color: "var(--text-primary)",
      }}>
        {section.title}
      </h3>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: bodySize, lineHeight: 1.55,
        color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap",
      }}>
        {section.content}
      </p>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function ChartPage({ 
  isMundane = false, 
  countrySlug, 
  countryName = "Country",
  initialNatalData = null
}: { 
  isMundane?: boolean, 
  countrySlug?: string, 
  countryName?: string,
  initialNatalData?: any
} = {}) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [tab, setTab] = useState<Tab>("overview");
  const [computedLines, setComputedLines] = useState<{planet: string, angle: string, distance_km: number}[]>([]);
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(!isDemo && !initialNatalData && (!isMundane || !!countrySlug));
  const [error, setError] = useState<string | null>(null);
  
  // Right pane toggle switch
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

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

  // Real data state
  const [realPlanets, setRealPlanets] = useState<any[]>(() => {
     if (initialNatalData && initialNatalData.planets) {
         return [...initialNatalData.planets, ...(initialNatalData.angles || [])];
     }
     return [];
  });
  
  const [realNatal, setRealNatal] = useState<any>(() => {
    if (initialNatalData && initialNatalData.planets) {
        const combined = [...initialNatalData.planets, ...(initialNatalData.angles || [])];
        const formatNatal: any = { 
          houses: initialNatalData.cusps,
          birth_city: initialNatalData.birth_city,
          birth_date: initialNatalData.birth_date,
          birth_time: initialNatalData.birth_time,
          birth_lon: initialNatalData.birth_lon,
          birth_lat: initialNatalData.birth_lat,
          profile_time: initialNatalData.profile_time
        };
        combined.forEach((p: any) => { 
            formatNatal[p.name.toLowerCase()] = { 
                longitude: p.longitude,
                latitude: p.latitude
            }; 
        });
        return formatNatal;
    }
    return null;
  });

  const [realAspects, setRealAspects] = useState<any[]>(initialNatalData ? (initialNatalData.aspects || []) : []);

  const [interpretation, setInterpretation] = useState<Record<string, any> | null>(null);
  const [interpretLoading, setInterpretLoading] = useState(false);

  useEffect(() => {
    if (!isDemo && !initialNatalData) {
      if (isMundane && !countrySlug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const endpoint = isMundane ? `/api/mundane-natal?slug=${countrySlug}` : "/api/natal";
      fetch(endpoint)
        .then(async r => {
          if (!r.ok) {
            const err = await r.json();
            throw new Error(err.error || "Failed to fetch natal data");
          }
          return r.json();
        })
        .then(data => {
            if (data && data.planets) {
                const combined = [...data.planets, ...(data.angles || [])];
                setRealPlanets(combined);
                setRealAspects(data.aspects || []);
                
                const formatNatal: any = {
                  houses: data.cusps,
                  first_name: data.first_name,
                  last_name: data.last_name,
                  birth_city: data.birth_city,
                  birth_date: data.birth_date,
                  birth_time: data.birth_time,
                  birth_lon: data.birth_lon,
                  profile_time: data.profile_time,
                  interpretation: data.interpretation ?? null,
                };
                if (data.interpretation) setInterpretation(data.interpretation);
                combined.forEach((p: any) => { 
                   formatNatal[p.name.toLowerCase()] = { 
                     longitude: p.longitude,
                     latitude: p.latitude
                   }; 
                });
                setRealNatal(formatNatal);
            }
        })
        .catch(err => {
          console.error(err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [isDemo]);

  // Fetch interpretation once natal data is available. Streams NDJSON; sections
  // render progressively as each Gemini call completes.
  useEffect(() => {
    if (isDemo || isMundane || !realNatal) return;
    if (interpretation || interpretLoading) return;
    // If the initial /api/natal fetch already included cached interpretation,
    // we will have set it above — don't re-fetch.
    if (realNatal.interpretation) return;

    let cancelled = false;
    setInterpretLoading(true);
    console.log("[interpret] fetching /api/chart/interpret (no cache)...");

    (async () => {
      try {
        const res = await fetch("/api/chart/interpret", { method: "POST" });
        console.log("[interpret] response status:", res.status);
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const acc: Record<string, any> = {};

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.section && msg.data) {
                acc[msg.section] = msg.data;
                setInterpretation({ ...acc });
              } else if (msg.done) {
                setInterpretLoading(false);
              } else if (msg.error) {
                console.warn("[interpret] partial error:", msg.error);
              }
            } catch {
              console.warn("[interpret] bad NDJSON line:", line);
            }
          }
        }
      } catch (err) {
        console.error("[interpret] stream failed:", err);
      } finally {
        if (!cancelled) setInterpretLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [realNatal, isDemo, isMundane, interpretation, interpretLoading]);

  // In real mode this would fetch from Supabase + /api/natal
  const natal = isDemo ? DEMO_NATAL : realNatal;
  const rawPlanets = isDemo ? MOCK_PLANETS : realPlanets.map(p => ({
     planet: p.name,
     sign: p.sign,
     house: p.house,
     degree: `${Math.floor(p.degree_in_sign)}° ${p.degree_minutes.toString().padStart(2, '0')}′`,
     dignity: p.dignity || (p.isAngle ? null : essentialDignityLabel(p.name, p.sign).toUpperCase()),
     isAngle: p.isAngle
  }));

  const aspectsToDisplay = isDemo ? MOCK_ASPECTS : realAspects;

  // Sort them sequentially by House, matching the Chani editorial table grouping
  const displayPlanets = [...rawPlanets].sort((a, b) => (a.house || 1) - (b.house || 1));

  const wheelPlanets = isDemo ? Object.keys(DEMO_NATAL).filter(k => k !== 'houses').map(k => ({
     planet: k.charAt(0).toUpperCase() + k.slice(1), 
     longitude: (DEMO_NATAL[k as keyof typeof DEMO_NATAL] as {longitude: number}).longitude
  })) : realPlanets.map(p => ({ planet: p.name, longitude: p.longitude, isAngle: p.isAngle }));

  // Date and Profile mock header
  const firstName = (realNatal?.first_name ?? "").trim();
  const profileName = isMundane
    ? countryName
    : isDemo
      ? "Brandy's"
      : firstName ? `${firstName}'s` : "Your";

  const remainingPlanets = displayPlanets.filter(x => !["Ascendant", "Sun", "Moon"].includes(x.planet));

  const content = (
    <>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "var(--space-md)", overflowX: "auto", paddingBottom: "4px" }}>
          {(["overview", "map", "aspects"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "0.4rem 1.1rem", borderRadius: "10px",
                background: tab === t ? "var(--text-primary)" : "transparent",
                color: tab === t ? "var(--bg)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontWeight: tab === t ? 600 : 400
              }}
            >{t}</button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW (WHEEL + EDITORIAL + ACCORDIONS) ── */}
          {tab === "overview" && (
            <motion.div key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {natal ? (
                <>
                  {/* ── FULL WIDTH EDITORIAL HEADER ── */}
                  <div style={{ marginBottom: "clamp(1.5rem, 5vw, 3rem)" }}>
                      <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3.5rem)", textTransform: "uppercase", letterSpacing: "0.02em", margin: "0 0 1rem 0", lineHeight: 1.1 }}>
                        {profileName.toUpperCase()} BIRTH CHART
                      </h1>

                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, display: "grid", gridTemplateColumns: "100px 1fr", gap: "0.4rem" }}>
                          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>Date:</div><div>{isDemo ? "August 17, 1988" : (natal.birth_date || "Unknown")}</div>
                          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>Time:</div><div>{isDemo ? "10:15 pm" : (natal.birth_time || "Unknown")}</div>
                          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>Location:</div><div>{isDemo ? "Jakarta, Indonesia" : (natal.birth_city || "Unknown")}</div>
                      </div>
                  </div>

                  <div className="grid grid-cols-12 gap-y-16 md:gap-8 lg:gap-10 items-start mb-10">
                    
                    {/* LEFT PANE: The Keys To Your Chart */}
                    <div className="col-span-12 md:col-span-6 order-2 md:order-1">
                          <h3 style={{ fontFamily: "var(--font-primary)", fontSize: "1.2rem", letterSpacing: "0.05em", margin: "0 0 1.5rem 0", paddingBottom: "1rem", borderBottom: "2px solid var(--text-primary)" }}>
                              THE KEYS TO {profileName.toUpperCase()} CHART
                          </h3>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                              {["Ascendant", "Sun", "Moon"].map(key => {
                                  const p = displayPlanets.find(x => x.planet === key);
                                  if (!p) return null;
                                  return (
                                      <div key={key}>
                                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                             <PlanetIcon planet={p.planet} size={16} color={PLANET_COLORS[p.planet]} />
                                             <PlanetHoverCard planet={p.planet} sign={p.sign} house={p.house || 1} degree={p.degree}>{p.planet}</PlanetHoverCard> <span style={{ opacity: 0.3, margin: "0 4px" }}>|</span> {p.sign} <span style={{ opacity: 0.3, margin: "0 4px" }}>|</span> {p.degree} <span style={{ opacity: 0.3, margin: "0 4px" }}>|</span> {getOrdinal(p.house || 1)} House
                                          </div>
                                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: PLANET_COLORS[p.planet] || "var(--text-secondary)", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
                                             {PLANET_DOMAINS[p.planet]}
                                          </div>
                                          <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                                             {p.planet === "Ascendant" ? "Ascendant" : p.planet} in {p.sign} in the {getOrdinal(p.house || 1)} House of {HOUSE_DOMAINS[p.house || 1] || "life"}.
                                          </p>
                                      </div>
                                  )
                              })}
                          </div>
                    </div>

                    {/* RIGHT PANE: The Chart / Table Toggle */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }} className="col-span-12 md:col-span-6 order-1 md:order-2">
                      
                      <div style={{ display: "flex", borderBottom: "1px solid var(--surface-border)" }}>
                          <button onClick={() => setViewMode("chart")} style={{
                            padding: "0.5rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em",
                            borderBottom: viewMode === "chart" ? "2px solid var(--text-primary)" : "2px solid transparent",
                            opacity: viewMode === "chart" ? 1 : 0.5
                          }}>CHART</button>
                          <button onClick={() => setViewMode("table")} style={{
                            padding: "0.5rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em",
                            borderBottom: viewMode === "table" ? "2px solid var(--text-primary)" : "2px solid transparent",
                            opacity: viewMode === "table" ? 1 : 0.5
                          }}>TABLE</button>
                      </div>

                      {viewMode === "chart" && (
                          <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto", position: "relative" }}>
                            <NatalMockupWheel isDark={isDark} planets={wheelPlanets as any} cusps={natal.houses} />
                          </div>
                      )}

                      {viewMode === "table" && (
                          <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--surface-border)", color: "var(--text-tertiary)" }}>
                                        <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 400 }}>Planets, angles, nodes</th>
                                        <th style={{ textAlign: "left", padding: "0.5rem 0.5rem", fontWeight: 400 }}>House</th>
                                        <th style={{ textAlign: "left", padding: "0.5rem 0.5rem", fontWeight: 400 }}>Sign</th>
                                        <th style={{ textAlign: "left", padding: "0.5rem 0", fontWeight: 400 }}>Degrees</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayPlanets.map((p, i) => {
                                        const showHouseBorder = i > 0 && displayPlanets[i].house !== displayPlanets[i-1].house;
                                        return (
                                        <tr key={p.planet} style={{ 
                                            borderBottom: "1px solid rgba(150,150,150,0.15)",
                                            borderTop: showHouseBorder ? "1px solid var(--surface-border)" : "none" 
                                        }}>
                                            <td style={{ padding: "0.4rem 0" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <PlanetIcon planet={p.planet} size={14} color={PLANET_COLORS[p.planet]} />
                                                     <PlanetHoverCard planet={p.planet} sign={p.sign} house={p.house || 1} degree={p.degree}>{p.planet}</PlanetHoverCard>
                                                </div>
                                            </td>
                                            <td style={{ padding: "0.4rem 0.5rem", color: "var(--text-secondary)" }}>{p.house}</td>
                                            <td style={{ padding: "0.4rem 0.5rem" }}>{p.sign}</td>
                                            <td style={{ padding: "0.4rem 0", color: "var(--text-tertiary)" }}>{p.degree}</td>
                                        </tr>
                                        )
                                    })}
                                </tbody>
                              </table>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* ── Chart Essence (editorial pull-quote, below the wheel) ── */}
                  {!isDemo && !isMundane && (interpretation?.chartEssence || interpretLoading) && (
                    <div style={{
                      maxWidth: "720px", marginBottom: "var(--space-2xl)",
                      paddingLeft: "clamp(1rem, 3vw, 1.5rem)",
                      borderLeft: "2px solid var(--text-primary)",
                    }}>
                      <InterpretationBlock
                        kicker="Chart Essence"
                        loading={interpretLoading}
                        section={interpretation?.chartEssence}
                        fallback="Synthesizing archetype..."
                      />
                    </div>
                  )}

                  {/* BOTTOM ACCORDIONS (Full Width) */}
                  <div style={{ width: "100%", marginTop: "var(--space-2xl)" }}>

                    {/* ── House Architecture (houses interpretation) ── */}
                    {!isDemo && !isMundane && (interpretation?.houseArchitecture || interpretLoading) && (
                      <div style={{ marginBottom: "var(--space-3xl)", maxWidth: "780px" }}>
                        <InterpretationBlock
                          kicker="House Architecture"
                          loading={interpretLoading}
                          section={interpretation?.houseArchitecture}
                          fallback="Computing house pressures..."
                        />
                      </div>
                    )}

                    {/* The Planets Accordion */}
                    <div style={{ marginBottom: "var(--space-3xl)" }}>
                        <SectionHeader title={`THE PLANETS`} size="sm" />
                        <Accordion type="multiple" variant="default" className="w-full">
                          {remainingPlanets.map(p => {
                             const color = PLANET_COLORS[p.planet] || "var(--text-primary)";
                             return (
                            <AccordionItem value={p.planet} key={p.planet}>
                              <AccordionTrigger
                                meta={`${p.sign} / ${getOrdinal(p.house || 1)} House`}
                              >
                                 <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                   <PlanetIcon planet={p.planet} color={color} size={18} />
                                   <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.02em", color: "var(--text-primary)" }}>
                                      {p.planet}
                                   </span>
                                 </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                 <div style={{ padding: "0 0 2rem 2.25rem", maxWidth: "800px" }}>
                                   <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase", color: color, marginBottom: "0.75rem", letterSpacing: "0.1em" }}>
                                     {PLANET_DOMAINS[p.planet] || `${p.planet} Placements`}
                                   </h4>
                                   <p style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
                                     {p.planet} in {p.sign} in the {getOrdinal(p.house || 1)} House of {HOUSE_DOMAINS[p.house || 1] || "life"}.
                                   </p>
                                 </div>
                              </AccordionContent>
                            </AccordionItem>
                          )})}
                        </Accordion>
                    </div>

                    </div>
                </>
              ) : (
                <div style={{
                  padding: "var(--space-3xl)", textAlign: "center",
                  background: "var(--surface)", border: "1px solid var(--surface-border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-mono)", color: "var(--text-secondary)",
                }}>
                  {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                      <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--text-tertiary)", borderTopColor: "var(--text-primary)", borderRadius: "50%" }}></div>
                      <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>GENERATING NATAL DATA...</span>
                    </div>
                  ) : error ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <span style={{ color: "var(--color-planet-mars)" }}>{error}</span>
                      <Link href="/profile" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>Update your birth info →</Link>
                    </div>
                  ) : (
                    <>
                      Connect Supabase to view your natal chart.{" "}
                      <a href="/chart?demo=true" style={{ color: "var(--text-primary)" }}>Try demo mode →</a>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── MAP TAB ── */}
          {tab === "map" && (
            <motion.div key="map"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Natural Angles (ACG interpretation) ── */}
              {!isDemo && !isMundane && (interpretation?.naturalAngles || interpretLoading) && (
                <div style={{ marginBottom: "var(--space-lg)", maxWidth: "780px" }}>
                  <InterpretationBlock
                    kicker="Natural Angles"
                    loading={interpretLoading}
                    section={interpretation?.naturalAngles}
                    fallback="Reading planetary lines near your birthplace..."
                  />
                </div>
              )}

              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
              }}>
                <AcgMap 
                    natal={natal!}
                    birthDateTimeUTC={natal.profile_time || "1994-08-15T12:00:00Z"}
                    birthLon={natal.birth_lon ?? -74.0060} 
                    highlightCity={isMundane ? { lat: natal.birth_lat || 0, lon: natal.birth_lon || 0, name: natal.birth_city || "" } : DEMO_CITY}
                    interactive 
                    onLocationClick={(lat, lon) => console.log("Map click:", lat, lon)}
                    onLinesCalculated={setComputedLines}
                />

                {/* Distance Table */}
                {computedLines.length > 0 && (
                   <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--surface-border)' }}>
                      <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: 'var(--space-sm)' }}>
                         Local Proximity Impact
                      </h3>
                      <div style={{ width: '100%' }}>
                        <AcgLinesCard 
                            planetLines={computedLines} 
                            natalPlanets={rawPlanets as any}
                            birthCity={isDemo ? "NYC" : (natal.birth_city || "Unknown")}
                            destination={isMundane ? (natal.birth_city || "Country") : (isDemo ? "Jakarta" : DEMO_CITY.name)}
                        />
                      </div>
                   </div>
                )}

                <div style={{ 
                    marginTop: 'var(--space-sm)', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.05em'
                }}>
                    <span>↑ PLANETARY CROSSINGS (ACG)</span>
                    <span>VERTICAL LINES = PEAK POWER</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ASPECTS TAB ── */}
          {tab === "aspects" && (
            <motion.div key="aspects"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Aspect Geometry (aspects interpretation) ── */}
              {!isDemo && !isMundane && (interpretation?.aspectWeaver || interpretLoading) && (
                <div style={{ marginBottom: "var(--space-lg)", maxWidth: "780px" }}>
                  <InterpretationBlock
                    kicker="Aspect Geometry"
                    loading={interpretLoading}
                    section={interpretation?.aspectWeaver}
                    fallback="Reading geometric pressure patterns..."
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                <SectionHeader title="PLANETARY GEOMETRY (ASPECTS)" size="sm" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                          {aspectsToDisplay.map((a, i) => (
                            <motion.div key={i}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              style={{
                                padding: "1rem",
                                background: "var(--surface)",
                                border: "1px solid var(--surface-border)",
                                borderRadius: "var(--radius-sm)",
                                position: "relative"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                <AspectIcon aspect={a.type} size={18} />
                                <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{a.aspect}</h4>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <span style={{ border: "1px solid var(--surface-border)", borderRadius: "3px", padding: "0.15rem 0.4rem", fontSize: "0.6rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                                  {a.type}
                                </span>
                                <span style={{ border: "1px solid var(--surface-border)", borderRadius: "3px", padding: "0.15rem 0.4rem", fontSize: "0.6rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                                  ORB {a.orb}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

    </>
  );

  return (
    <DashboardLayout
      maxWidth="1280px"
      paddingTop="var(--space-md)"
      backLabel={isMundane ? "Explore Mundane" : "Home"}
      backHref={isMundane ? "/mundane" : undefined}
    >
       {content}
    </DashboardLayout>
  );
}
