"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import { ChartWheel, type NatalData } from "../components/ChartWheel";
import { AcgMap } from "../components/AcgMap";

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
  { planet: "Sun",        sign: "Leo",         house: 5,  degree: "23° 00′", dignity: "DOMICILE" },
  { planet: "Moon",       sign: "Scorpio",      house: 8,  degree: "18° 00′", dignity: null },
  { planet: "Mercury",    sign: "Virgo",        house: 6,  degree: "6° 00′",  dignity: "DOMICILE" },
  { planet: "Venus",      sign: "Cancer",       house: 4,  degree: "18° 00′", dignity: null },
  { planet: "Mars",       sign: "Capricorn",    house: 10, degree: "10° 00′", dignity: "EXALTED" },
  { planet: "Jupiter",    sign: "Sagittarius",  house: 9,  degree: "12° 00′", dignity: "DOMICILE" },
  { planet: "Saturn",     sign: "Pisces",       house: 12, degree: "5° 00′",  dignity: "DETRIMENT" },
  { planet: "Uranus",     sign: "Aquarius",     house: 11, degree: "5° 00′",  dignity: "DOMICILE" },
  { planet: "Neptune",    sign: "Capricorn",    house: 10, degree: "22° 00′", dignity: null },
  { planet: "Pluto",      sign: "Scorpio",      house: 8,  degree: "9° 00′",  dignity: "DOMICILE" },
  { planet: "Chiron",     sign: "Libra",        house: 7,  degree: "10° 00′", dignity: null },
  { planet: "North Node", sign: "Libra",        house: 7,  degree: "12° 55′", dignity: null },
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

type Tab = "wheel" | "map" | "planets" | "aspects";

// ── Dignity pill ───────────────────────────────────────────────

function DignityPill({ dignity }: { dignity: string }) {
  const isPositive = dignity === "DOMICILE" || dignity === "EXALTED";
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "0.45rem",
      padding: "0.12rem 0.4rem", borderRadius: "var(--radius-full)",
      letterSpacing: "0.08em",
      background: isPositive ? "rgba(90,158,120,0.15)" : "rgba(196,98,45,0.15)",
      color: isPositive ? "var(--sage)" : "var(--color-spiced-life)",
    }}>{dignity}</span>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function ChartPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [tab, setTab] = useState<Tab>("wheel");

  // In real mode this would fetch from Supabase + /api/natal
  const natal = isDemo ? DEMO_NATAL : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem clamp(1.25rem, 3vw, 3rem)",
        borderBottom: "1px solid var(--surface-border)",
        maxWidth: "1400px", width: "100%", margin: "0 auto",
      }}>
        <Image src="/logo-stacked.svg" alt="ASTRONAT" width={110} height={36} priority className="onboarding-logo" />
        <ThemeToggle />
      </header>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "var(--space-lg) clamp(1.25rem, 3vw, 3rem) var(--space-3xl)" }}>

        {/* Page Header */}
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <span style={{
            display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "0.3rem 0.8rem", border: "1px solid currentColor", borderRadius: "20px",
            marginBottom: "var(--space-sm)",
          }}>NATAL CHART</span>
          <h1 style={{
            fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 5vw, 3rem)",
            textTransform: "uppercase", lineHeight: 0.9, marginBottom: "var(--space-xs)",
          }}>
            Your Chart
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Leo Sun · Scorpio Moon · Aries Rising
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "var(--space-xl)", overflowX: "auto", paddingBottom: "4px" }}>
          {(["wheel", "map", "planets", "aspects"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "0.4rem 1.1rem", borderRadius: "var(--radius-full)",
                border: "1px solid var(--surface-border)",
                background: tab === t ? "var(--color-y2k-blue)" : "transparent",
                color: tab === t ? "white" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >{t}</button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {/* ── WHEEL TAB ── */}
          {tab === "wheel" && (
            <motion.div key="wheel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {natal ? (
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-lg)",
                }}>
                  <ChartWheel natal={natal} size={480} />
                </div>
              ) : (
                <div style={{
                  padding: "var(--space-3xl)", textAlign: "center",
                  background: "var(--surface)", border: "1px solid var(--surface-border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)", color: "var(--text-secondary)",
                }}>
                  Connect Supabase to view your natal chart.{" "}
                  <a href="/chart?demo=true" style={{ color: "var(--color-y2k-blue)" }}>Try demo mode →</a>
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
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
              }}>
                <AcgMap 
                    natal={natal!} 
                    interactive 
                    onLocationClick={(lat, lon) => console.log("Map click:", lat, lon)}
                />
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

          {/* ── PLANETS TAB ── */}
          {tab === "planets" && (
            <motion.div key="planets"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                background: "var(--surface)", border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-sm)", overflow: "hidden",
              }}>
                {/* Header row */}
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 0.7fr 1fr 1.2fr",
                  padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--surface-border)",
                  fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--text-tertiary)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  <span>Planet</span><span>Sign</span><span>H</span><span>Degree</span><span></span>
                </div>
                {MOCK_PLANETS.map((p, i) => (
                  <motion.div key={p.planet}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      display: "grid", gridTemplateColumns: "2fr 1.5fr 0.7fr 1fr 1.2fr",
                      padding: "0.55rem 0.75rem", alignItems: "center",
                      borderBottom: i < MOCK_PLANETS.length - 1 ? "1px solid var(--surface-border)" : "none",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{p.planet}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem" }}>{p.sign}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{p.house}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-secondary)" }}>{p.degree}</span>
                    <span>{p.dignity && <DignityPill dignity={p.dignity} />}</span>
                  </motion.div>
                ))}
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
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                {MOCK_ASPECTS.map((a, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.55rem 0.75rem",
                      background: "var(--surface)", border: "1px solid var(--surface-border)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: ASPECT_COLORS[a.type] || "var(--text-tertiary)",
                      }} />
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{a.aspect}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)" }}>{a.orb}</span>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                        padding: "0.12rem 0.5rem", borderRadius: "var(--radius-full)",
                        border: `1px solid ${ASPECT_COLORS[a.type] || "var(--surface-border)"}`,
                        color: ASPECT_COLORS[a.type] || "var(--text-secondary)",
                      }}>{a.type.toUpperCase()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style jsx global>{`
        .onboarding-logo { filter: invert(1) brightness(1.2); display: block; }
        [data-theme="light"] .onboarding-logo { filter: none; }
      `}</style>
    </div>
  );
}
