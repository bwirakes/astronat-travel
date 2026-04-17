"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Cake } from "lucide-react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";
import { ScoreRing, getVerdict, BAND_CONFIG } from "@/app/components/ScoreRing";

const MOCK_RESULTS = [
  { name: "Bali, Indonesia", score: 91, verdict: "Peak energy for spiritual growth and creative expansion." },
  { name: "Tokyo, Japan", score: 87, verdict: "Career and communication lines strongly activated." },
  { name: "Lisbon, Portugal", score: 79, verdict: "Relationships and community connections thrive here." },
  { name: "Barcelona, Spain", score: 72, verdict: "Mixed career energy but excellent for personal growth." },
  { name: "Berlin, Germany", score: 64, verdict: "Solid intellectual stimulation. Watch for isolation." },
];

function BirthdayContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(!isDemo);
  const [results, setResults] = useState(MOCK_RESULTS);

  useEffect(() => {
    if (!isDemo) {
      handleYearChange(currentYear);
    } else {
      setResults(MOCK_RESULTS);
      setLoading(false);
    }
  }, [isDemo]);

  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    setLoading(true);
    
    if (isDemo) {
      setTimeout(() => {
        setResults(year === currentYear ? MOCK_RESULTS : MOCK_RESULTS.map(r => ({ ...r, score: Math.max(30, r.score + Math.floor(Math.random() * 20 - 10)) })));
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch("/api/birthday/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year })
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Birthday Optimizer"
      kicker="SOLAR RETURN"
      backLabel="Home"
      backHref="/dashboard"
      paddingTop="var(--space-lg)"
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative" }}>
        {/* Decorative element */}
        <div style={{ position: "absolute", top: "-2rem", right: "-2rem", opacity: 0.04, pointerEvents: "none" }}>
          <Cake size={200} strokeWidth={0.5} />
        </div>

        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "var(--space-lg)" }}>
          Find where to be on your birthday to set the year&apos;s themes.
        </p>

        {/* Year Selector */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "var(--space-lg)" }}>
          {[currentYear, currentYear + 1].map(year => (
            <button key={year} onClick={() => handleYearChange(year)} style={{
              borderRadius: "var(--radius-full)",
              padding: "0.5rem 1.5rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              background: selectedYear === year ? "var(--color-y2k-blue)" : "transparent",
              border: "1px solid var(--surface-border)",
              color: selectedYear === year ? "white" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}>{year}</button>
          ))}
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", opacity: loading ? 0.3 : 1, transition: "opacity 0.3s" }}>
          {results.map((city, i) => {
            const v = getVerdict(city.score);
            const cfg = BAND_CONFIG[v];
            return (
              <motion.div key={city.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--space-md)",
                  padding: "var(--space-md)",
                  background: "var(--surface)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: i === 0 ? "var(--shape-asymmetric-md)" : "var(--radius-md)",
                }}
              >
                <span style={{ fontFamily: "var(--font-primary)", fontSize: "2.5rem", color: "var(--text-tertiary)", width: "2.5rem", flexShrink: 0, lineHeight: 1, textAlign: "center" }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.3rem", marginBottom: "0.15rem" }}>{city.name}</h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    {city.verdict}
                  </p>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: cfg.color, marginTop: "0.2rem", display: "inline-block" }}>
                    {cfg.label} — {city.score}/100
                  </span>
                </div>
                <div style={{ transform: "scale(0.4)", transformOrigin: "right center", flexShrink: 0, marginLeft: "-30px" }}>
                  <ScoreRing score={city.score} verdict={v} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BirthdayClient() {
  return (
    <Suspense fallback={null}>
      <BirthdayContent />
    </Suspense>
  );
}
