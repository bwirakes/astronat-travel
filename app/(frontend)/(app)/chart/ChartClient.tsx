"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import { PageHeader } from "@/components/app/page-header-context";
import type { NatalData } from "@/app/components/ChartWheel";
import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import { TeaserCard } from "./chart-aux-ui";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import { AcgMap } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import PlanetIcon from "@/app/components/PlanetIcon";
import AspectIcon from "@/app/components/AspectIcon";
import { essentialDignityLabel } from "@/app/lib/dignity";
import { HOUSE_DOMAINS, HOUSE_DESCRIPTIONS, resolvePlacementImplication } from "@/app/lib/astro-wording";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/app/components/ui/hover-card";
import { PlanetPlacementHoverContent } from "@/app/components/ui/planet-placement-hover-content";





type Tab = "overview" | "map" | "aspects";

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function signFromLongitude(longitude: number) {
  return ZODIAC_SIGNS[Math.floor((((longitude % 360) + 360) % 360) / 30)] || "Aries";
}

function houseFromLongitude(longitude: number, cusps?: number[]) {
  if (!cusps || cusps.length !== 12) return 1;
  const lon = ((longitude % 360) + 360) % 360;

  for (let i = 0; i < cusps.length; i++) {
    const start = ((cusps[i] % 360) + 360) % 360;
    const end = ((cusps[(i + 1) % 12] % 360) + 360) % 360;
    const isInside = start <= end
      ? lon >= start && lon < end
      : lon >= start || lon < end;

    if (isInside) return i + 1;
  }

  return 1;
}

function isNodePlacement(planetName: string) {
  const normalized = planetName.toLowerCase();
  return normalized.includes("node") || normalized === "true node";
}

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

function MonocleSectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <div className="w-full h-[3px] bg-[var(--text-primary)] mb-[2px]" />
      <div className="py-2 px-3 border-b border-[var(--text-primary)]" style={{ background: "color-mix(in srgb, var(--surface-border) 40%, transparent)" }}>
        <h2 className="m-0" style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.02em" }}>{title}</h2>
      </div>
    </div>
  );
}

function ThickRule() {
    return <div className="w-full h-[2px] bg-[var(--text-primary)] my-8" />;
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
  const [tab, setTab] = useState<Tab>("overview");
  const [computedLines, setComputedLines] = useState<{planet: string, angle: string, distance_km: number}[]>([]);
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(!initialNatalData && (!isMundane || !!countrySlug));
  const [error, setError] = useState<string | null>(null);
  

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
  // Guard: only ever kick off one interpret fetch per page load
  const interpretStartedRef = useRef(false);

  // Which Big Three card is expanded ("Ascendant" | "Sun" | "Moon" | null)
  const [expandedBig3, setExpandedBig3] = useState<string | null>(null);
  // Which planet accordion row is open (driven by wheel tap OR direct accordion tap)
  const [openPlanet, setOpenPlanet] = useState<string | null>(null);

  const handlePlanetClick = (planetName: string) => {
    setOpenPlanet(prev => prev === planetName ? null : planetName);
    // Scroll the accordion into view on mobile
    setTimeout(() => {
      document.getElementById(`planet-row-${planetName}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  useEffect(() => {
    if (!initialNatalData) {
      if (isMundane && !countrySlug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const endpoint = isMundane ? `/api/mundane-natal?slug=${countrySlug}` : "/api/natal";
      fetch(endpoint)
        .then(async r => {
          if (!r.ok) {
            let err = { error: "Failed to fetch natal data" };
            try { err = await r.json(); } catch(e) {}
            return { __error: err.error || "Failed to fetch natal data", status: r.status };
          }
          return r.json();
        })
        .then(data => {
            if (data && data.__error) {
              setError(data.__error);
              if (data.status === 401 && typeof window !== 'undefined') {
                 window.location.href = '/login';
              }
              return;
            }
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
                  birth_lat: data.birth_lat,
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
  }, []);

  // Fetch interpretation once natal data is available. Streams NDJSON; sections
  // render progressively as each Gemini call completes.
  useEffect(() => {
    if (isMundane || !realNatal) return;
    if (interpretStartedRef.current) return;
    // If cached interpretation already covers all sections, skip
    if (interpretation?.placementImplications) return;

    interpretStartedRef.current = true;
    let cancelled = false;
    setInterpretLoading(true);
    console.log("[interpret] fetching /api/chart/interpret...");

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
  // Only re-run when realNatal first becomes available — not on every stream tick
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realNatal, isMundane]);

  // In real mode this would fetch from Supabase + /api/natal
  const natal = realNatal;
  const rawPlanets = realPlanets.map(p => ({
     planet: p.name,
     sign: p.sign,
     house: p.house,
     degree: `${Math.floor(p.degree_in_sign)}° ${p.degree_minutes.toString().padStart(2, '0')}′`,
     dignity: p.dignity || (p.isAngle ? null : essentialDignityLabel(p.name, p.sign).toUpperCase()),
     isAngle: p.isAngle
  })).filter((p) => !isNodePlacement(p.planet));

  const aspectsToDisplay = realAspects;

  // Sort them sequentially by House, matching the Chani editorial table grouping
  const displayPlanets = [...rawPlanets].sort((a, b) => (a.house || 1) - (b.house || 1));
  const planetMetadataByName = new Map(rawPlanets.map((p) => [p.planet, p]));
  const placementImplications = interpretation?.placementImplications as Record<string, string> | undefined;

  const placementTextByPlanet = useMemo(() => {
    const list = [...rawPlanets].sort((a, b) => (a.house || 1) - (b.house || 1));
    const m: Record<string, string> = {};
    for (const p of list) {
      m[p.planet] = resolvePlacementImplication({
        planet: p.planet,
        sign: p.sign,
        house: p.house || 1,
        implication: placementImplications?.[p.planet],
      });
    }
    return m;
  }, [rawPlanets, placementImplications]);

  const wheelPlanets: NatalPlanet[] = realPlanets
    .filter((p) => !isNodePlacement(p.name))
    .map(p => ({ planet: p.name, longitude: p.longitude, isAngle: p.isAngle }));
  const wheelPlanetsWithMetadata: NatalPlanet[] = wheelPlanets.map((p) => {
    const meta = planetMetadataByName.get(p.planet);
    const house = meta?.house || houseFromLongitude(p.longitude, natal?.houses);
    const sign = meta?.sign || signFromLongitude(p.longitude);
    const degree = meta?.degree || `${Math.floor(p.longitude % 30)}°`;

    return {
      ...p,
      sign,
      house,
      degree,
      implication: placementImplications?.[p.planet],
    };
  });

  // Date and Profile mock header
  const firstName = (realNatal?.first_name ?? "").trim();
  const profileName = isMundane
    ? countryName
    : firstName ? `${firstName}'s` : "Your";
  const birthPlace = {
    lat: natal?.birth_lat,
    lon: natal?.birth_lon,
    name: natal?.birth_city || "Birth place",
  };

  // ── Big Three card labels (friendly names)
  const BIG3_LABELS: Record<string, string> = {
    "Ascendant": "Rising Sign",
    "Sun": "Sun Sign",
    "Moon": "Moon Sign",
  };

  // ── House Energy tiles from houseArchitecture (new schema)
  const houseEnergy = interpretation?.houseArchitecture as {
    strongHouse?: { houseNumber: number; plainLabel: string; oneLiner: string };
    growthHouse?: { houseNumber: number; plainLabel: string; oneLiner: string };
  } | null;

  const content = (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem" }}>
      <AnimatePresence mode="wait">
        <motion.div key="main-layout" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {natal ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(350px,400px)] gap-[4rem] lg:gap-[6rem]">
                  
                  {/* LEFT COLUMN: EDITORIAL CONTENT */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    
                    {/* THE LEDE & TITLE */}
                    <div className="mb-10">
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        ASTROLOGICAL BLUEPRINT
                      </div>
                      <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.1, margin: "0 0 0.5rem 0", color: "var(--text-primary)", fontWeight: 400, textTransform: "uppercase" }}>
                        {profileName} Chart
                      </h1>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)", opacity: 0.8, marginBottom: "2rem" }}>
                        <span className="italic">{natal?.birth_date || ""} — {natal?.birth_city || ""}</span>
                      </div>

                      {!isMundane && (interpretation?.chartEssence || interpretLoading) && (
                        <>
                           {interpretation?.chartEssence ? (
                               <div className="flex flex-col gap-6 mb-8">
                                 {interpretation.chartEssence.content.split(/\n+/).map((paragraph: string, idx: number) => (
                                   <p key={idx} style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(18px, 1.6vw, 21px)", lineHeight: 1.6, color: "var(--text-primary)" }}>
                                     {paragraph}
                                   </p>
                                 ))}
                               </div>
                           ) : (
                               <div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading chart essence...</div>
                           )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: SIDEBAR */}
                  <div style={{ position: "sticky", top: "2rem", alignSelf: "start", display: "flex", flexDirection: "column", gap: "3rem" }}>
                      
                    {/* THE CHART WHEEL */}
                    <div>
                      <div style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 600, borderBottom: "2px solid var(--text-primary)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
                        Natal Wheel
                      </div>
                      <div style={{ width: "100%", margin: "0 auto", position: "relative" }}>
                        <NatalMockupWheel isDark={isDark} planets={wheelPlanetsWithMetadata} cusps={natal.houses} onPlanetClick={handlePlanetClick} />
                      </div>
                      <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", letterSpacing: "0.1em", marginTop: "1.5rem", opacity: 0.5 }}>
                        SELECT A PLANET TO EXPLORE ITS MEANING
                      </div>
                    </div>

                    {/* CORE IDENTITY MODULE */}
                    <div style={{ background: "color-mix(in srgb, var(--surface-border) 15%, transparent)", border: "1px solid var(--surface-border)", padding: "1.5rem" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "1rem", borderBottom: "1px solid var(--surface-border)", paddingBottom: "0.5rem" }}>
                        CORE IDENTITY
                      </div>
                      <div className="flex flex-col gap-4">
                        {["Ascendant", "Sun", "Moon"].map(key => {
                          const p = displayPlanets.find(x => x.planet === key);
                          if (!p) return null;
                          const color = PLANET_COLORS[p.planet] || "var(--gold)";
                          
                          return (
                              <div key={key} className="flex items-center justify-between">
                                  <div>
                                      <div style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>{p.sign}</div>
                                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{key}</div>
                                  </div>
                                  <PlanetIcon planet={p.planet} size={24} color={color} />
                              </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>

                {/* FULL WIDTH LOWER SECTIONS */}
                <div className="mt-16">

                    <ThickRule />

                    {/* THE ARCHITECTURE */}
                    {!isMundane && (houseEnergy?.strongHouse || interpretLoading) && (
                      <div className="mt-8 pt-8" style={{ borderTop: "2px solid var(--surface-border)" }}>
                        <MonocleSectionHeader title="The Architecture" />
                        
                        {houseEnergy?.strongHouse ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
                              {/* Power Column */}
                              <div>
                                  <h3 style={{ fontFamily: "var(--font-primary)", fontSize: "1.5rem", fontWeight: 600, borderBottom: "1px solid var(--text-primary)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                                      Area of Power
                                  </h3>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                      H{houseEnergy.strongHouse.houseNumber} · {houseEnergy.strongHouse.plainLabel}
                                  </div>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                                      {houseEnergy.strongHouse.oneLiner}
                                  </p>
                              </div>
                              {/* Growth Column */}
                              <div>
                                  <h3 style={{ fontFamily: "var(--font-primary)", fontSize: "1.5rem", fontWeight: 600, borderBottom: "1px solid var(--text-primary)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                                      Area of Growth
                                  </h3>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                      H{houseEnergy.growthHouse?.houseNumber} · {houseEnergy.growthHouse?.plainLabel}
                                  </div>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                                      {houseEnergy.growthHouse?.oneLiner}
                                  </p>
                              </div>
                          </div>
                        ) : (
                          <div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading architecture...</div>
                        )}
                      </div>
                    )}

                    {/* THE TOOLKIT */}
                    <div className="mb-12">
                      <MonocleSectionHeader title="Planetary Index" />
                      <div className="border-t border-[var(--text-primary)]">
                          {displayPlanets.map(p => {
                            const color = PLANET_COLORS[p.planet] || "var(--text-primary)";
                            const isOpen = openPlanet === p.planet;
                            const sentence = placementTextByPlanet[p.planet] || "You have a natural ability to process this planet's energy.";
                            return (
                              <div key={p.planet} id={`planet-row-${p.planet}`} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                                <button onClick={() => handlePlanetClick(p.planet)} className="w-full flex items-center justify-between py-4 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--surface-border)_20%,transparent)]">
                                  <div className="flex items-center gap-4">
                                      <PlanetIcon planet={p.planet} size={20} color={color} />
                                      <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>{p.planet}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                                          {p.sign} · House {p.house}
                                      </div>
                                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
                                  </div>
                                </button>
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                                      <div className="pb-6 pt-2 pl-10 pr-4 max-w-[65ch]">
                                        <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.6, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>{sentence}</p>
                                        {p.dignity && (
                                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: "0.75rem", letterSpacing: "0.05em" }}>
                                                DIGNITY: {p.dignity}
                                            </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* THE FRICTION (ASPECTS) */}
                      {/* SECTION 4: ASPECT GEOMETRY */}
                      <div style={{ marginTop: "4rem" }}>
                        <MonocleSectionHeader title="Aspect Geometry" />
                        
                        {(!isMundane && (interpretation?.aspectWeaver || interpretLoading)) ? (
                           <>
                           <div className="mb-6">
                            {interpretation?.aspectWeaver ? (
                              <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 2rem 0", maxWidth: "70ch" }}>
                                {interpretation.aspectWeaver.content}
                              </p>
                            ) : (
                               <div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading aspects...</div>
                            )}
                          </div>
                           </>
                        ) : null}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                            {aspectsToDisplay.map((a, i) => (
                                <div key={i} className="flex flex-col py-3 border-b border-[var(--surface-border)]">
                                    <div className="flex items-center gap-3 mb-1">
                                        <AspectIcon aspect={a.type} size={18} />
                                        <h4 style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{a.aspect}</h4>
                                    </div>
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{a.type} · Orb {a.orb}</div>
                                </div>
                            ))}
                        </div>
                      </div>

                    {/* THE MAP */}
                    {!isMundane && (
                      <div className="mb-12">
                        <MonocleSectionHeader title="Natal Geography" />
                        {(!isMundane && (interpretation?.naturalAngles || interpretLoading)) ? (
                          <>
                             {interpretation?.naturalAngles ? (
                              <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 2rem 0", maxWidth: "70ch" }}>
                                {interpretation.naturalAngles.content}
                              </p>
                            ) : (
                               <div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading geography...</div>
                            )}
                          </div>
                        )}
                        <div style={{ background: "color-mix(in srgb, var(--surface-border) 15%, transparent)", padding: "1rem", border: "1px solid var(--surface-border)" }}>
                          <AcgMap
                            natal={natal!}
                            birthDateTimeUTC={natal?.profile_time || ""}
                            birthLat={birthPlace.lat}
                            birthLon={birthPlace.lon}
                            birthCity={birthPlace.name}
                            interactive
                            onLinesCalculated={setComputedLines}
                          />
                          {computedLines.length > 0 && (
                           <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--surface-border)" }}>
                              <AcgLinesCard planetLines={computedLines} natalPlanets={rawPlanets as any} birthCity={birthPlace.name} destination={birthPlace.name} />
                           </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <ThickRule />

                    {/* VERDICT PLACEHOLDER (can be re-added if AI writes one) */}

                </div>
              </>
            ) : (<div style={{ padding: "4rem", textAlign: "center" }}>No natal data available</div>)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
  return (
    <>
      <PageHeader
        title={isMundane ? "Explore Mundane" : "Astro-Nat | Chart Analysis"}
        backTo={isMundane ? "/mundane" : undefined}
        backLabel={isMundane ? "Back to Maps" : undefined}
      />
      <div style={{ width: "100%", padding: "var(--space-md) var(--space-md) var(--space-3xl)" }}>
        {content}
      </div>
    </>
  );
}
