"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import DashboardLayout from "@/app/components/DashboardLayout";
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
  }, [isDemo]);

  // Fetch interpretation once natal data is available. Streams NDJSON; sections
  // render progressively as each Gemini call completes.
  useEffect(() => {
    if (isDemo || isMundane || !realNatal) return;
    // Never start a second fetch if one already ran this session
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
  }, [realNatal, isDemo, isMundane]);

  // In real mode this would fetch from Supabase + /api/natal
  const natal = isDemo ? DEMO_NATAL : realNatal;
  const rawPlanets = (isDemo ? MOCK_PLANETS : realPlanets.map(p => ({
     planet: p.name,
     sign: p.sign,
     house: p.house,
     degree: `${Math.floor(p.degree_in_sign)}° ${p.degree_minutes.toString().padStart(2, '0')}′`,
     dignity: p.dignity || (p.isAngle ? null : essentialDignityLabel(p.name, p.sign).toUpperCase()),
     isAngle: p.isAngle
  }))).filter((p) => !isNodePlacement(p.planet));

  const aspectsToDisplay = isDemo ? MOCK_ASPECTS : realAspects;

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

  const wheelPlanets: NatalPlanet[] = isDemo ? Object.keys(DEMO_NATAL).filter(k => k !== 'houses').map(k => ({
     planet: k.charAt(0).toUpperCase() + k.slice(1), 
     longitude: (DEMO_NATAL[k as keyof typeof DEMO_NATAL] as {longitude: number}).longitude
  })) : realPlanets
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
    : isDemo
      ? "Brandy's"
      : firstName ? `${firstName}'s` : "Your";
  const birthPlace = {
    lat: isDemo ? DEMO_CITY.lat : natal?.birth_lat,
    lon: isDemo ? DEMO_CITY.lon : natal?.birth_lon,
    name: isDemo ? DEMO_CITY.name : (natal?.birth_city || "Birth place"),
  };

  // remainingPlanets no longer used — full displayPlanets shown in the unified accordion

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
    <>
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

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {natal ? (
              <>
                <div className="chart-overview-grid">
                  {/* ─── LEFT COLUMN ─── */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "clamp(1.5rem, 4vw, 2.5rem)" }}>
                      <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3.5rem)", textTransform: "uppercase", letterSpacing: "0.02em", margin: "0 0 0.75rem 0", lineHeight: 1.1 }}>
                        {profileName.toUpperCase()} BIRTH CHART
                      </h1>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)", display: "flex", gap: "1.25rem", flexWrap: "wrap", opacity: 0.8 }}>
                        <span>{isDemo ? "Aug 17, 1988" : (natal.birth_date || "Unknown")}</span>
                        <span>{isDemo ? "10:15 pm" : (natal.birth_time || "Unknown")}</span>
                        <span>{isDemo ? "Jakarta, Indonesia" : (natal.birth_city || "Unknown")}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>Core Identity</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                        {["Ascendant", "Sun", "Moon"].map(key => {
                          const p = displayPlanets.find(x => x.planet === key);
                          if (!p) return null;
                          const color = PLANET_COLORS[p.planet] || "var(--gold)";
                          
                          return (
                            <HoverCard key={key} openDelay={180} closeDelay={120}>
                              <HoverCardTrigger asChild>
                                <button
                                  type="button"
                                  style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--surface-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "0.85rem",
                                    transition: "all 0.2s ease",
                                    minHeight: "86px",
                                    cursor: "zoom-in",
                                    textAlign: "left",
                                    width: "100%",
                                  }}
                                >
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>{BIG3_LABELS[key]}</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                                    <PlanetIcon planet={p.planet} size={14} color={color} />
                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.sign}</div>
                                  </div>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)" }}>H{p.house}</div>
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent
                                sideOffset={8}
                                className="planet-hover-card-pop"
                                style={{ zIndex: 9999, width: "300px" }}
                              >
                                <PlanetPlacementHoverContent
                                  planet={p.planet}
                                  sign={p.sign}
                                  house={p.house || 1}
                                  degree={p.degree}
                                  implication={placementImplications?.[p.planet]}
                                />
                              </HoverCardContent>
                            </HoverCard>
                          );
                        })}
                      </div>
                    </div>

                    {!isDemo && !isMundane && (interpretation?.chartEssence || interpretLoading) && (
                      <div style={{ marginBottom: "2.5rem" }}>
                        <div style={{ height: "1px", background: "var(--surface-border)", marginBottom: "1.25rem" }} />
                        {interpretation?.chartEssence ? (<p style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0, fontStyle: "italic", fontWeight: 300 }}>{interpretation.chartEssence.content}</p>) : (<div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading...</div>)}
                        <div style={{ height: "1px", background: "var(--surface-border)", marginTop: "1.25rem" }} />
                      </div>
                    )}

                    {!isDemo && !isMundane && (houseEnergy?.strongHouse || interpretLoading) && (
                      <div style={{ marginBottom: "2rem" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>Life Domains</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
                          <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)", padding: "1.1rem" }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--sage)", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>🔥 Your Area of Power</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>H{houseEnergy?.strongHouse?.houseNumber} · {houseEnergy?.strongHouse?.plainLabel}</div>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>{houseEnergy?.strongHouse?.oneLiner}</p>
                          </div>
                          <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)", padding: "1.1rem" }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--color-acqua)", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>🌱 Your Area of Growth</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>H{houseEnergy?.growthHouse?.houseNumber} · {houseEnergy?.growthHouse?.plainLabel}</div>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>{houseEnergy?.growthHouse?.oneLiner}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── RIGHT COLUMN ─── */}
                  <div style={{ position: "sticky", top: "var(--space-md)" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "1rem" }}>Natal Geometry</div>
                    <div style={{ width: "100%", maxWidth: "520px", margin: "0 auto", position: "relative" }}>
                      <NatalMockupWheel isDark={isDark} planets={wheelPlanetsWithMetadata} cusps={natal.houses} onPlanetClick={handlePlanetClick} />
                    </div>
                    <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", letterSpacing: "0.1em", marginTop: "1.5rem", opacity: 0.5 }}>
                      SELECT A PLANET TO EXPLORE ITS MEANING BELOW
                    </div>
                  </div>
                </div>

                {!isMundane && (
                  <div
                    style={{
                      marginTop: "var(--space-xl)",
                      paddingTop: "var(--space-lg)",
                      borderTop: "1px solid var(--surface-border)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "1.25rem",
                    }}
                  >
                    <TeaserCard
                      kicker="Aspect Geometry"
                      title={`${aspectsToDisplay.length} planetary relationships shaping the chart`}
                      cta="See aspects"
                      onClick={() => setTab("aspects")}
                    />
                    <TeaserCard
                      kicker="Natal Geography"
                      title="ACG map and planetary lines from your birth place"
                      cta="See map"
                      onClick={() => setTab("map")}
                    />
                  </div>
                )}

                {/* ─── FULL WIDTH PLANETARY PLACEMENTS (Moved out of grid) ─── */}
                <div style={{ marginTop: "4rem", width: "100%" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--surface-border)" }}>
                    Planetary Placements
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {displayPlanets.map(p => {
                      const color = PLANET_COLORS[p.planet] || "var(--text-primary)";
                      const isOpen = openPlanet === p.planet;
                      const sentence = placementTextByPlanet[p.planet];
                      return (
                        <div key={p.planet} id={`planet-row-${p.planet}`} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                          <button onClick={() => handlePlanetClick(p.planet)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 0", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                            <PlanetIcon planet={p.planet} size={18} color={color} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{p.planet}</span>
                            </div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-tertiary)", textAlign: "right" }}>
                              <span>{p.sign}</span>
                              <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
                              <span>House {p.house}</span>
                            </div>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)", marginLeft: "0.5rem", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                                <div style={{ padding: "0 0 2rem 2.5rem", maxWidth: "800px" }}>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.6, color: "var(--text-primary)", margin: "0 0 0.85rem 0" }}>{sentence}</p>
                                  {HOUSE_DESCRIPTIONS[p.house || 1] && (
                                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text-tertiary)", margin: 0, fontStyle: "italic" }}>
                                      {HOUSE_DESCRIPTIONS[p.house || 1]}
                                    </p>
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
              </>
            ) : (<div style={{ padding: "4rem", textAlign: "center" }}>No natal data available</div>)}
          </motion.div>
        )}

        {tab === "map" && (
          <motion.div key="map" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
             {!isDemo && !isMundane && (interpretation?.naturalAngles || interpretLoading) && (
               <div style={{ marginBottom: "var(--space-lg)", maxWidth: "780px" }}>
                 <InterpretationBlock kicker="Local Power" loading={interpretLoading} section={interpretation?.naturalAngles} fallback="Calculating..." />
               </div>
             )}
             <div style={{ background: "var(--surface)", padding: "var(--space-md)", borderRadius: "var(--radius-md)", border: "1px solid var(--surface-border)" }}>
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
          </motion.div>
        )}

        {tab === "aspects" && (
          <motion.div key="aspects" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
             {!isDemo && !isMundane && (interpretation?.aspectWeaver || interpretLoading) && (
               <div style={{ marginBottom: "var(--space-lg)", maxWidth: "780px" }}>
                 <InterpretationBlock kicker="Pattern Geometry" loading={interpretLoading} section={interpretation?.aspectWeaver} fallback="Reading patterns..." />
               </div>
             )}
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {aspectsToDisplay.map((a, i) => (
                <div key={i} style={{ padding: "1rem", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--surface-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                    <AspectIcon aspect={a.type} size={18} />
                    <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{a.aspect}</h4>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Orb {a.orb} · {a.type}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );  return (
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
