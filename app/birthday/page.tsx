"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cake, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import { ScoreRing, getVerdict, BAND_CONFIG } from "../components/ScoreRing";

const MOCK_RESULTS = [
  { name: "Bali, Indonesia", score: 91, verdict: "Peak energy for spiritual growth and creative expansion." },
  { name: "Tokyo, Japan", score: 87, verdict: "Career and communication lines strongly activated." },
  { name: "Lisbon, Portugal", score: 79, verdict: "Relationships and community connections thrive here." },
  { name: "Barcelona, Spain", score: 72, verdict: "Mixed career energy but excellent for personal growth." },
  { name: "Berlin, Germany", score: 64, verdict: "Solid intellectual stimulation. Watch for isolation." },
];

export default function BirthdayPage() {
  const router = useRouter();
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem clamp(1.25rem, 3vw, 3rem)",
        borderBottom: "1px solid var(--surface-border)",
        maxWidth: "1400px", width: "100%", margin: "0 auto",
      }}>
        <Image src="/logo-stacked.svg" alt="ASTRONAT" width={110} height={36} priority className="onboarding-logo" />
        <ThemeToggle />
      </header>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--space-lg) clamp(1.25rem, 3vw, 3rem) var(--space-3xl)", position: "relative" }}>
        <button onClick={() => router.push("/home")} style={{
          background: "none", border: "none", color: "var(--text-tertiary)",
          fontFamily: "var(--font-mono)", fontSize: "0.6rem", cursor: "pointer",
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "var(--space-md)",
          display: "flex", alignItems: "center", gap: "0.3rem",
        }}>
          <ArrowLeft size={12} /> Home
        </button>

        {/* Decorative element */}
        <div style={{ position: "absolute", top: "-2rem", right: "-2rem", opacity: 0.04, pointerEvents: "none" }}>
          <Cake size={200} strokeWidth={0.5} />
        </div>

        <div style={{ marginBottom: "var(--space-lg)" }}>
          <span style={{
            display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "0.3rem 0.8rem", border: "1px solid currentColor", borderRadius: "20px",
            marginBottom: "var(--space-sm)",
          }}>SOLAR RETURN</span>
          <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 5vw, 3rem)", textTransform: "uppercase", lineHeight: 0.9, marginBottom: "var(--space-xs)" }}>
            Birthday Optimizer
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Find where to be on your birthday to set the year&apos;s themes.
          </p>
        </div>

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
    </div>
  );
}
