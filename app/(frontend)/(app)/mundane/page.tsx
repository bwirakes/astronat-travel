"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ThemeToggle from "@/app/components/ThemeToggle";
import { COUNTRY_CHARTS, type CountryChart } from "@/lib/astro/mundane-charts";
import { MundaneCard } from "@/app/components/MundaneCard";
import { ChartWheel, type NatalData } from "@/app/components/ChartWheel";

// ── Mock Synastry Data ───────────────────────────────────────

const MOCK_SYNASTRY = [
  { description: "Sun conjunct Country Sun", harmonyScore: 88 },
  { description: "Moon trine Country Saturn", harmonyScore: 72 },
  { description: "Venus square Country Mars", harmonyScore: 45 },
  { description: "Jupiter sextile Country MC", harmonyScore: 92 },
];

// ── Helpers ────────────────────────────────────────────────────

function getCountryNatal(country: CountryChart): NatalData {
  // In a real app, we'd fetch from /api/natal
  // For demo, we return stable mock data derived from founding
  return {
    sun: { longitude: 143 },
    moon: { longitude: 228 },
    mercury: { longitude: 156 },
    venus: { longitude: 108 },
    mars: { longitude: 280 },
    jupiter: { longitude: 252 },
    saturn: { longitude: 335 },
    uranus: { longitude: 295 },
    neptune: { longitude: 282 },
    pluto: { longitude: 219 },
    houses: [296, 350, 30, 56, 75, 94, 116, 170, 210, 236, 255, 274],
  };
}

// ── Verdict Label (Simple version for Mundane) ────────────────

function VerdictLabel({ score }: { score: number }) {
  const color = score > 80 ? 'var(--sage)' : score > 60 ? 'var(--color-y2k-blue)' : 'var(--color-spiced-life)';
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
      color, border: `1px solid ${color}`,
      padding: '0.2rem 0.6rem', borderRadius: '20px',
      textTransform: 'uppercase'
    }}>
      {score}% Harmony
    </span>
  );
}

// ── Mundane Client Component ─────────────────────────────────

function MundaneClient() {
  const searchParams = useSearchParams();
  const initialCountry = searchParams.get("country");
  
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialCountry);

  const filteredCountries = COUNTRY_CHARTS.filter((c: CountryChart) => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountry = COUNTRY_CHARTS.find((c: CountryChart) => c.slug === selectedSlug);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem clamp(1.25rem, 3vw, 3rem)",
        borderBottom: "1px solid var(--surface-border)",
        maxWidth: "1400px", width: "100%", margin: "0 auto",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <Image src="/logo-stacked.svg" alt="ASTRONAT" width={110} height={36} priority className="brand-logo" />
        </div>
        <ThemeToggle />
      </header>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "var(--space-lg) clamp(1.25rem, 3vw, 3rem) var(--space-3xl)" }}>
        
        {/* Back Button (if selected) */}
        {selectedSlug && (
          <button 
            onClick={() => setSelectedSlug(null)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px',
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              color: 'var(--text-secondary)', background: 'none', border: 'none',
              cursor: 'pointer', marginBottom: 'var(--space-md)', padding: 0
            }}
          >
            <ChevronLeft size={14} /> BACK TO EXPLORE
          </button>
        )}

        {/* Page Titles */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <span style={{
            display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "0.3rem 0.8rem", border: "1px solid currentColor", borderRadius: "20px",
            marginBottom: "var(--space-sm)", color: 'var(--color-acqua)'
          }}>MUNDANE ASTROLOGY</span>
          <h1 style={{
            fontFamily: "var(--font-primary)", fontSize: "clamp(2.5rem, 6vw, 4rem)",
            textTransform: "uppercase", lineHeight: 0.85, marginBottom: "var(--space-xs)",
          }}>
            {selectedCountry ? selectedCountry.name : "Country Charts"}
          </h1>
          {!selectedCountry && (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: '500px' }}>
              Explore the birth charts of nations and see how your personal energy resonates with the countries you visit.
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selectedCountry ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ 
                background: 'var(--surface)', border: '1px solid var(--surface-border)', 
                borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)',
                marginBottom: 'var(--space-lg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.5rem', margin: 0 }}>Natal Chart</h2>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                            {selectedCountry.note}
                        </p>
                    </div>
                    <span style={{ fontSize: '2.5rem' }}>{selectedCountry.flag}</span>
                </div>
                
                <ChartWheel natal={getCountryNatal(selectedCountry)} size={420} />
              </div>

              <div style={{ 
                background: 'var(--surface)', border: '1px solid var(--surface-border)', 
                borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)'
              }}>
                 <h3 style={{ 
                    fontFamily: 'var(--font-body)', fontSize: '0.75rem', 
                    textTransform: 'uppercase', letterSpacing: '0.12em', 
                    color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' 
                }}>
                    YOUR RESONANCE WITH {selectedCountry.name.toUpperCase()}
                 </h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {MOCK_SYNASTRY.map((a, i) => (
                        <div key={i} style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.75rem 0', borderBottom: i < MOCK_SYNASTRY.length - 1 ? '1px solid var(--surface-border)' : 'none'
                        }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600 }}>{a.description}</span>
                            <VerdictLabel score={a.harmonyScore} />
                        </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 'var(--space-xl)' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
                <input 
                  type="text" 
                  placeholder="Search countries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '0.8rem 1rem 0.8rem 3rem',
                    background: 'var(--surface)', border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-body)',
                    color: 'var(--text-primary)', outline: 'none'
                  }}
                />
              </div>

              {/* Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: 'var(--space-md)' 
              }}>
                {filteredCountries.map((c) => (
                  <MundaneCard 
                    key={c.slug} 
                    country={c} 
                    onClick={() => setSelectedSlug(c.slug)} 
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        .brand-logo { filter: invert(1) brightness(1.2); }
        [data-theme="light"] .brand-logo { filter: none; }
      `}</style>
    </div>
  );
}

export default function MundanePage() {
  return (
    <Suspense fallback={<div>Loading Mundane Astrology...</div>}>
      <MundaneClient />
    </Suspense>
  );
}
