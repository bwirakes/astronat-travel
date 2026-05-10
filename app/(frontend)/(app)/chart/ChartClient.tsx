"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/app/page-header-context";
import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import { AcgMap } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import PlanetIcon from "@/app/components/PlanetIcon";
import AspectIcon from "@/app/components/AspectIcon";
import SignIcon from "@/app/components/SignIcon";
import MonocleSectionHeader from "@/app/components/editorial/MonocleSectionHeader";
import ThickRule from "@/app/components/editorial/ThickRule";
import { essentialDignityLabel } from "@/app/lib/dignity";
import { resolvePlacementImplication, HOUSE_DOMAINS } from "@/app/lib/astro-wording";
import posthog from "posthog-js";


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

function accentForAspect(type: string): string {
  const t = (type || "").toLowerCase();
  if (t === "trine" || t === "sextile") return "var(--sage)";
  if (t === "square" || t === "opposition") return "var(--accent)";
  if (t === "conjunction") return "var(--gold)";
  return "var(--text-tertiary)";
}

function tightnessDots(orb: number | string): number {
  const n = typeof orb === "string" ? parseFloat(orb) : orb;
  if (!Number.isFinite(n)) return 1;
  if (n <= 2) return 3;
  if (n <= 5) return 2;
  return 1;
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

  // Fire chart_viewed once for pre-loaded (SSR) natal data
  useEffect(() => {
    if (!initialNatalData?.planets) return;
    posthog.capture("chart_viewed", {
      chart_type: isMundane ? "mundane" : "natal",
      birth_city: initialNatalData.birth_city ?? null,
      country_slug: countrySlug ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [interpretation, setInterpretation] = useState<Record<string, any> | null>(null);
  const [interpretLoading, setInterpretLoading] = useState(false);
  // Guard: only ever kick off one interpret fetch per page load
  const interpretStartedRef = useRef(false);

  // Wheel-tap handler: scroll the matching planet card into view.
  const handlePlanetClick = (planetName: string) => {
    document.getElementById(`planet-row-${planetName}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (initialNatalData) return;
    if (isMundane && !countrySlug) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const endpoint = isMundane ? `/api/mundane-natal?slug=${countrySlug}` : "/api/natal";

    (async () => {
      try {
        const r = await fetch(endpoint, { signal: controller.signal });
        if (!r.ok) {
          const errBody = await r.json().catch(() => ({}));
          if (r.status === 401) {
            // Component is still mounted (signal not aborted) — safe to redirect
            window.location.href = "/login";
            return;
          }
          throw new Error(errBody.error || `Failed to fetch natal data (HTTP ${r.status})`);
        }

        const data = await r.json();
        if (controller.signal.aborted) return;
        if (!data?.planets) return;

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
            latitude: p.latitude,
          };
        });
        setRealNatal(formatNatal);
        posthog.capture("chart_viewed", {
          chart_type: isMundane ? "mundane" : "natal",
          birth_city: data.birth_city ?? null,
          country_slug: countrySlug ?? null,
        });
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? "Failed to fetch natal data");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [initialNatalData, isMundane, countrySlug]);

  // Fetch interpretation once natal data is available. Streams NDJSON; sections
  // render progressively as each Gemini call completes.
  useEffect(() => {
    if (isMundane || !realNatal) return;
    if (interpretStartedRef.current) return;
    if (interpretation?.placementImplications) return;

    interpretStartedRef.current = true;
    const controller = new AbortController();
    setInterpretLoading(true);

    (async () => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        const res = await fetch("/api/chart/interpret", {
          method: "POST",
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const acc: Record<string, any> = {};

        while (true) {
          if (controller.signal.aborted) break;
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
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("[interpret] stream failed:", err);
      } finally {
        if (!controller.signal.aborted) setInterpretLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  // realNatal identity changes are the trigger; interpretStartedRef guards re-entry
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

  // Map raw aspects by canonical key ("<planet1>-<type>-<planet2>" lowercase, alpha-sorted planets)
  // so the curated aspectGeometry entries can look up orbs and aspect labels for the dot scale.
  const aspectByKey = useMemo(() => {
    const m = new Map<string, typeof realAspects[number]>();
    for (const a of realAspects) {
      const [p1, p2] = [a.planet1 ?? "", a.planet2 ?? ""].map((p: string) => p.toLowerCase()).sort();
      const key = `${p1}-${(a.type ?? "").toLowerCase()}-${p2}`;
      m.set(key, a);
    }
    return m;
  }, [realAspects]);

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
                {/* BANNER — full-width hero, kicker+name on left, Core Identity (Asc/Sun/Moon) ledger on right */}
                <section style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "clamp(24px, 3vw, 40px)",
                  padding: "8px 0 clamp(20px, 2.4vw, 28px)",
                  borderBottom: "1px solid var(--surface-border)",
                  marginBottom: "clamp(40px, 5vw, 64px)",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                    }}>
                      Natal Chart
                    </span>
                    <span style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "clamp(40px, 5.5vw, 72px)",
                      lineHeight: 0.95,
                      letterSpacing: "-0.02em",
                      color: "var(--text-primary)",
                    }}>
                      {profileName} Chart
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--text-tertiary)",
                    }}>
                      {natal?.birth_date || ""}{natal?.birth_city ? ` · ${natal.birth_city}` : ""}
                    </span>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: "clamp(16px, 2.5vw, 28px)",
                  }}>
                    {["Ascendant", "Sun", "Moon"].map((key, i) => {
                      const p = displayPlanets.find(x => x.planet === key);
                      if (!p) return null;
                      const color = PLANET_COLORS[p.planet] || "var(--gold)";
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "stretch", gap: "clamp(16px, 2.5vw, 28px)" }}>
                          {i > 0 && (
                            <span aria-hidden style={{ background: "var(--surface-border)", width: 1, alignSelf: "stretch" }} />
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 700 }}>
                              {key}
                            </span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem" }}>
                              <span style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.5rem, 2.4vw, 1.9rem)", lineHeight: 1, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                                {p.sign}
                              </span>
                              <PlanetIcon planet={p.planet} size={18} color={color} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(350px,400px)] gap-[4rem] lg:gap-[6rem]">

                  {/* LEFT COLUMN: EDITORIAL CONTENT */}
                  <div style={{ display: "flex", flexDirection: "column" }}>

                    {/* THE LEDE — chartEssence prose */}
                    <div className="mb-10">
                      {!isMundane && (interpretation?.chartEssence || interpretLoading) && (
                        <>
                           {interpretation?.chartEssence ? (
                               <div className="flex flex-col gap-6 mb-8">
                                 {interpretation.chartEssence.content.split(/\n{2,}/).map((paragraph: string, idx: number) => (
                                   <p key={idx} style={{ fontFamily: "var(--font-body)", fontSize: "clamp(16px, 1.3vw, 18px)", lineHeight: 1.75, color: "var(--text-primary)", fontWeight: 300, maxWidth: "70ch" }}>
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
                      <MonocleSectionHeader title="Natal Wheel" flush />
                      <div style={{ width: "100%", margin: "0 auto", position: "relative" }}>
                        <NatalMockupWheel isDark={isDark} planets={wheelPlanetsWithMetadata} cusps={natal.houses} onPlanetClick={handlePlanetClick} />
                      </div>
                      <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "1.5rem" }}>
                        Select a planet to explore
                      </div>
                    </div>

                  </div>

                </div>

                {/* FULL WIDTH LOWER SECTIONS */}
                <div className="mt-16">

                    <ThickRule />

                    {/* THE ARCHITECTURE */}
                    {!isMundane && (houseEnergy?.strongHouse || interpretLoading) && (
                      <div>
                        <MonocleSectionHeader index="01" title="The Architecture" />

                        {houseEnergy?.strongHouse ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
                              {/* Power Column */}
                              <div style={{ borderLeft: "2px solid var(--sage)", paddingLeft: "var(--space-md)" }}>
                                  <h3 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.3rem, 2vw, 1.5rem)", fontWeight: 500, letterSpacing: "-0.01em", borderBottom: "1px solid var(--sage)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
                                      Area of Power
                                  </h3>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--sage)", marginBottom: "0.5rem", fontWeight: 700 }}>
                                      H{houseEnergy.strongHouse.houseNumber} · {houseEnergy.strongHouse.plainLabel}
                                  </div>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.75, color: "var(--text-primary)" }}>
                                      {houseEnergy.strongHouse.oneLiner}
                                  </p>
                              </div>
                              {/* Growth Column */}
                              <div style={{ borderLeft: "2px solid var(--gold)", paddingLeft: "var(--space-md)" }}>
                                  <h3 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.3rem, 2vw, 1.5rem)", fontWeight: 500, letterSpacing: "-0.01em", borderBottom: "1px solid var(--gold)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
                                      Area of Growth
                                  </h3>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.5rem", fontWeight: 700 }}>
                                      H{houseEnergy.growthHouse?.houseNumber} · {houseEnergy.growthHouse?.plainLabel}
                                  </div>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.75, color: "var(--text-primary)" }}>
                                      {houseEnergy.growthHouse?.oneLiner}
                                  </p>
                              </div>
                          </div>
                        ) : (
                          <div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading architecture...</div>
                        )}
                      </div>
                    )}

                    {/* SECTION 02 — WHERE EACH PLANET LANDS
                        Card model ported from /reading[id] WhatShifts PlanetShiftCard, but
                        without the natal-vs-relocated shift (chart has one location). */}
                    <div className="mt-16 mb-12">
                      <MonocleSectionHeader
                        index="02"
                        title="Where each planet lands"
                        sub={<>Same ten planets, sorted by the rooms they occupy in your chart. The narrative is the placement, not the planet on its own.</>}
                      />
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-6">
                          {displayPlanets.map(p => {
                            const color = PLANET_COLORS[p.planet] || "var(--text-primary)";
                            const sentence = placementTextByPlanet[p.planet] || "You have a natural ability to process this planet's energy.";
                            const houseDomain = HOUSE_DOMAINS[p.house || 1] ?? "";
                            return (
                              <article
                                key={p.planet}
                                id={`planet-row-${p.planet}`}
                                className="px-6 py-5 border rounded-[8px] flex flex-col"
                                style={{ borderColor: "var(--surface-border)", background: "var(--bg)", gap: "var(--space-md)" }}
                              >
                                {/* Header — glyph + name on left, House position kicker on right */}
                                <header className="flex items-baseline justify-between gap-3 flex-wrap">
                                  <div className="flex items-center gap-[10px]">
                                    <span style={{ color, lineHeight: 1, display: "inline-flex", alignItems: "center" }}>
                                      <PlanetIcon planet={p.planet} size={22} color={color} />
                                    </span>
                                    <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.25rem", lineHeight: 1.1, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                                      {p.planet}
                                    </span>
                                  </div>
                                  <div
                                    className="text-right"
                                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase", color, fontWeight: 700, lineHeight: 1.4 }}
                                  >
                                    H{p.house} · {houseDomain}
                                  </div>
                                </header>

                                {/* Sign chip — small zodiac glyph + sign + degree */}
                                <div
                                  className="rounded-[4px] flex items-center gap-2"
                                  style={{
                                    background: "var(--surface)",
                                    padding: "10px 14px",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.78rem",
                                    letterSpacing: "0.02em",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  <SignIcon sign={p.sign} size={14} color="var(--text-secondary)" />
                                  <span>{p.sign}{p.degree ? ` · ${p.degree}` : ""}</span>
                                </div>

                                <p style={{ fontFamily: "var(--font-body)", fontSize: "13.5px", lineHeight: 1.55, fontWeight: 300, color: "var(--text-secondary)", margin: 0 }}>
                                  {sentence}
                                </p>

                                {p.dignity && (
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 700, marginTop: 2 }}>
                                    Dignity · {p.dignity}
                                  </div>
                                )}
                              </article>
                            );
                          })}
                      </div>
                    </div>

                    {/* SECTION 03 — ASPECT GEOMETRY (curated 2-column split) */}
                    <div style={{ marginTop: "4rem" }}>
                      <MonocleSectionHeader index="03" title="Aspect Geometry" />

                      {/* Editorial intro: prefers new aspectGeometry.intro, falls back to legacy aspectWeaver.content */}
                      {!isMundane && (() => {
                        const intro = interpretation?.aspectGeometry?.intro ?? interpretation?.aspectWeaver?.content;
                        if (intro) {
                          return (
                            <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.75, color: "var(--text-primary)", margin: "0 0 2rem 0", maxWidth: "75ch" }}>
                              {intro}
                            </p>
                          );
                        }
                        if (interpretLoading) {
                          return <div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading aspects...</div>;
                        }
                        return null;
                      })()}

                      {/* Curated 2-column commentary — only when new schema is present */}
                      {!isMundane && interpretation?.aspectGeometry && (
                        <div className="grid grid-cols-1 md:grid-cols-2 mt-6" style={{ gap: "var(--space-xl)" }}>
                          {([
                            { title: "Working For You", accent: "var(--sage)", entries: interpretation.aspectGeometry.workingFor ?? [] },
                            { title: "Pushing You", accent: "var(--accent)", entries: interpretation.aspectGeometry.pushingYou ?? [] },
                          ] as const).map((col) => (
                            <div key={col.title} style={{ borderLeft: `2px solid ${col.accent}`, paddingLeft: "var(--space-md)" }}>
                              <h3 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.3rem, 2vw, 1.5rem)", fontWeight: 500, letterSpacing: "-0.01em", borderBottom: `1px solid ${col.accent}`, paddingBottom: "0.5rem", marginBottom: "var(--space-md)", color: "var(--text-primary)" }}>
                                {col.title}
                              </h3>
                              {col.entries.length === 0 ? (
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-tertiary)", fontStyle: "normal" }}>
                                  No tight aspects in this register — the geometry runs neutral here.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                                  {col.entries.map((entry: { aspectKey: string; headline: string; body: string }) => {
                                    const aspectData = aspectByKey.get(entry.aspectKey);
                                    const dots = aspectData ? tightnessDots(aspectData.orb) : 0;
                                    return (
                                      <div
                                        key={entry.aspectKey}
                                        style={{
                                          padding: "var(--space-md)",
                                          background: "color-mix(in oklab, var(--surface-border) 18%, var(--bg))",
                                          borderRadius: "var(--radius-xs)",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "var(--space-sm)",
                                        }}
                                      >
                                        {/* Headline (serif) + tightness scale */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                          <h4 style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 500, letterSpacing: "-0.01em", margin: 0, color: "var(--text-primary)" }}>
                                            {entry.headline}
                                          </h4>
                                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                                            {aspectData && (
                                              <div className="flex items-center gap-2">
                                                <AspectIcon aspect={aspectData.type} size={14} />
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: col.accent, fontWeight: 700 }}>
                                                  {aspectData.aspect}
                                                </span>
                                              </div>
                                            )}
                                            {aspectData && (
                                              <div className="flex items-center gap-2">
                                                <div style={{ display: "flex", gap: 3 }}>
                                                  {[0, 1, 2].map(idx => (
                                                    <span
                                                      key={idx}
                                                      style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "9999px",
                                                        background: idx < dots ? col.accent : `color-mix(in oklab, ${col.accent} 18%, transparent)`,
                                                      }}
                                                    />
                                                  ))}
                                                </div>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.05em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                                                  Orb {aspectData.orb}°
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {/* AI commentary body */}
                                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.75, color: "var(--text-primary)", margin: 0 }}>
                                          {entry.body}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Legacy fallback: old cached interpretations only have aspectWeaver — show the
                          full aspect grid so users on cached data still see something useful. */}
                      {!isMundane && !interpretation?.aspectGeometry && interpretation?.aspectWeaver && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                          {aspectsToDisplay.map((a, i) => {
                            const accent = accentForAspect(a.type);
                            const dots = tightnessDots(a.orb);
                            return (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "var(--space-xs)",
                                  padding: "var(--space-sm) var(--space-md)",
                                  borderLeft: `2px solid ${accent}`,
                                  background: "color-mix(in oklab, var(--surface-border) 18%, var(--bg))",
                                  borderRadius: "var(--radius-xs)",
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <AspectIcon aspect={a.type} size={18} />
                                  <h4 style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>{a.aspect}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div style={{ display: "flex", gap: 3 }}>
                                    {[0, 1, 2].map(idx => (
                                      <span
                                        key={idx}
                                        style={{
                                          width: 7,
                                          height: 7,
                                          borderRadius: "9999px",
                                          background: idx < dots ? accent : `color-mix(in oklab, ${accent} 18%, transparent)`,
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Orb {a.orb}°
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* THE MAP */}
                    {!isMundane && (
                      <div className="mt-16 mb-12">
                        <MonocleSectionHeader index="04" title="Natal Geography" />
                        {(!isMundane && (interpretation?.naturalAngles || interpretLoading)) ? (
                          <>
                             {interpretation?.naturalAngles ? (
                              <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.75, color: "var(--text-primary)", margin: "0 0 2rem 0", maxWidth: "75ch" }}>
                                {interpretation.naturalAngles.content}
                              </p>
                            ) : (
                               <div className="animate-pulse" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)" }}>Reading geography...</div>
                            )}
                          </>
                        ) : null}
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
                    
                </div>
              </>
            ) : loading ? (
              <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-md)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                  Reading your chart
                </div>
                <div className="animate-pulse" style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.4rem, 2.4vw, 1.8rem)", color: "var(--text-secondary)" }}>
                  Loading natal data…
                </div>
              </div>
            ) : error ? (
              <div style={{ padding: "var(--space-3xl) var(--space-md)", textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent)" }}>
                  Chart unavailable
                </div>
                <div style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.4rem, 2.4vw, 1.8rem)", color: "var(--text-primary)" }}>
                  {error}
                </div>
              </div>
            ) : (
              <div style={{ padding: "var(--space-3xl) var(--space-md)", textAlign: "center", fontFamily: "var(--font-primary)", color: "var(--text-secondary)" }}>
                No natal data available
              </div>
            )}
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
