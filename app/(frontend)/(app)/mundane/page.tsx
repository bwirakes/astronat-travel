"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ThemeToggle from "@/app/components/ThemeToggle";
import { COUNTRY_CHARTS, type CountryChart } from "@/lib/astro/mundane-charts";
import { MundaneCard } from "@/app/components/MundaneCard";

function MundaneClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCountries = COUNTRY_CHARTS.filter((c: CountryChart) => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
            Country Charts
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: '500px' }}>
            Explore the birth charts of nations and see how your personal energy resonates with the countries you visit.
          </p>
        </div>

        <AnimatePresence mode="wait">
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
                    onClick={() => router.push(`/mundane/${c.slug}`)} 
                  />
                ))}
              </div>
            </motion.div>
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
