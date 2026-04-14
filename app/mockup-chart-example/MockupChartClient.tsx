"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { ChartAiInterpreter } from "@/app/components/ChartAiInterpreter";

// ── Mock data for ?demo=true ───────────────────────────────────

const DEMO_NATAL: NatalData = {
  sun:     { longitude: 143 },
  moon:    { longitude: 228 },
  mercury: { longitude: 156 },
  venus:   { longitude: 108 },
  mars:    { longitude: 280 },
  jupiter: { longitude: 252 },
  saturn:  { longitude: 335 },
  uranus:  { longitude: 295 },
  neptune: { longitude: 282 },
  pluto:   { longitude: 219 },
  chiron:  { longitude: 190 },
  houses: [296, 350, 30, 56, 75, 94, 116, 170, 210, 236, 255, 274],
};

const MOCK_PLANETS = [
  { planet: "Ascendant",  sign: "Aries",       house: 1,  degree: "12° 30′", dignity: null, isAngle: true },
  { planet: "Sun",        sign: "Leo",         house: 5,  degree: "23° 00′", dignity: "DOMICILE", isAngle: false },
  { planet: "Moon",       sign: "Scorpio",     house: 8,  degree: "18° 00′", dignity: null, isAngle: false },
  { planet: "Mercury",    sign: "Virgo",       house: 6,  degree: "6° 00′",  dignity: "DOMICILE", isAngle: false },
  { planet: "Venus",      sign: "Cancer",      house: 4,  degree: "18° 00′", dignity: null, isAngle: false },
  { planet: "Mars",       sign: "Capricorn",   house: 10, degree: "10° 00′", dignity: "EXALTED", isAngle: false },
  { planet: "Jupiter",    sign: "Sagittarius", house: 9,  degree: "12° 00′", dignity: "DOMICILE", isAngle: false },
  { planet: "Saturn",     sign: "Pisces",      house: 12, degree: "5° 00′",  dignity: "DETRIMENT", isAngle: false },
  { planet: "Uranus",     sign: "Aquarius",    house: 11, degree: "5° 00′",  dignity: "DOMICILE", isAngle: false },
  { planet: "Neptune",    sign: "Capricorn",   house: 10, degree: "22° 00′", dignity: null, isAngle: false },
  { planet: "Pluto",      sign: "Scorpio",     house: 8,  degree: "9° 00′",  dignity: "DOMICILE", isAngle: false },
  { planet: "Chiron",     sign: "Libra",       house: 7,  degree: "10° 00′", dignity: null, isAngle: false },
  { planet: "North Node", sign: "Libra",       house: 7,  degree: "12° 55′", dignity: null, isAngle: false },
  { planet: "MC",         sign: "Capricorn",   house: 10, degree: "28° 10′", dignity: null, isAngle: true },
];

const MOCK_ASPECTS = [
  { aspect: "Sun trine Jupiter",       orb: "6° 44′", type: "Trine",       verdict: 84 },
  { aspect: "Moon conjunct Pluto",     orb: "1° 08′", type: "Conjunction", verdict: 62 },
  { aspect: "Venus square Saturn",     orb: "4° 56′", type: "Square",      verdict: 38 },
  { aspect: "Mercury sextile Uranus",  orb: "2° 01′", type: "Sextile",     verdict: 79 },
  { aspect: "Mars trine Sun",          orb: "3° 00′", type: "Trine",       verdict: 88 },
  { aspect: "Moon trine Neptune",      orb: "1° 19′", type: "Trine",       verdict: 77 },
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



// ── Main Page ─────────────────────────────────────────────────

export default function ChartPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [tab, setTab] = useState<Tab>("overview");
  const [computedLines, setComputedLines] = useState<{planet: string, angle: string, distance_km: number}[]>([]);
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(!isDemo);
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
  const [realNatal, setRealNatal] = useState<any>(null);
  const [realPlanets, setRealPlanets] = useState<any[]>([]);
  const [realAspects, setRealAspects] = useState<any[]>([]);

  useEffect(() => {
    if (!isDemo) {
      setLoading(true);
      fetch("/api/natal")
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
                  birth_city: data.birth_city,
                  birth_date: data.birth_date,
                  birth_time: data.birth_time,
                  birth_lon: data.birth_lon,
                  profile_time: data.profile_time
                };
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
  const profileName = isDemo ? "Brandy's" : "Your";

  const remainingPlanets = displayPlanets.filter(x => !["Ascendant", "Sun", "Moon"].includes(x.planet));

  return (
    <DashboardLayout maxWidth="980px" backLabel="Home">


        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "clamp(1rem, 3vw, 2rem)", overflowX: "auto", paddingBottom: "4px" }}>
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

                  {/* AI INTERPRETER MOCKUP */}
                  <ChartAiInterpreter />

                  <div className="grid grid-cols-12 gap-y-16 md:gap-8 lg:gap-10 items-start mb-16">
                    
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

                  {/* BOTTOM ACCORDIONS (Full Width) */}
                  <div style={{ width: "100%", marginTop: "var(--space-2xl)" }}>
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
              <ChartAiInterpreter tab="map" />
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
                    highlightCity={DEMO_CITY}
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
                            destination={isDemo ? "Jakarta" : DEMO_CITY.name}
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
              <ChartAiInterpreter tab="aspects" />
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


    </DashboardLayout>
  );
}
