"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/app/page-header-context";
import { COUNTRY_CHARTS, type CountryChart } from "@/lib/astro/mundane-charts";
import { MundaneCard } from "@/app/components/MundaneCard";

function MundaneClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCountries = COUNTRY_CHARTS.filter((c: CountryChart) => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Country Charts" />
      <div style={{ width: "100%", padding: "var(--space-lg) var(--space-md) var(--space-3xl)" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: '500px', marginBottom: 'var(--space-lg)' }}>
          Explore the birth charts of nations and see how your personal energy resonates with the countries you visit.
        </p>

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
      </div>
    </>
  );
}

export default function MundanePage() {
  return (
    <Suspense fallback={<div>Loading Mundane Astrology...</div>}>
      <MundaneClient />
    </Suspense>
  );
}
