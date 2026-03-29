"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";

const MOCK_PLANETS = [
  { planet: "Sun", sign: "Leo", house: 5, degree: "22° 34'", dignity: "DOMICILE" },
  { planet: "Moon", sign: "Scorpio", house: 8, degree: "14° 11'", dignity: null },
  { planet: "Mercury", sign: "Virgo", house: 6, degree: "8° 45'", dignity: "DOMICILE" },
  { planet: "Venus", sign: "Cancer", house: 4, degree: "1° 22'", dignity: null },
  { planet: "Mars", sign: "Libra", house: 7, degree: "28° 03'", dignity: "DETRIMENT" },
  { planet: "Jupiter", sign: "Sagittarius", house: 9, degree: "15° 50'", dignity: "DOMICILE" },
  { planet: "Saturn", sign: "Pisces", house: 12, degree: "6° 18'", dignity: null },
  { planet: "Uranus", sign: "Aquarius", house: 11, degree: "0° 44'", dignity: "DOMICILE" },
  { planet: "Neptune", sign: "Capricorn", house: 10, degree: "24° 30'", dignity: null },
  { planet: "Pluto", sign: "Sagittarius", house: 9, degree: "29° 02'", dignity: null },
  { planet: "North Node", sign: "Libra", house: 7, degree: "12° 55'", dignity: null },
  { planet: "Chiron", sign: "Libra", house: 7, degree: "20° 41'", dignity: null },
];

const MOCK_ASPECTS = [
  { aspect: "Sun trine Jupiter", orb: "6° 44'", type: "Harmonious" },
  { aspect: "Moon square Mars", orb: "3° 52'", type: "Tension" },
  { aspect: "Venus square Saturn", orb: "4° 56'", type: "Tension" },
  { aspect: "Mercury sextile Uranus", orb: "2° 01'", type: "Harmonious" },
  { aspect: "Jupiter conjunct Pluto", orb: "0° 48'", type: "Conjunction" },
  { aspect: "Moon trine Neptune", orb: "1° 19'", type: "Harmonious" },
];

export default function ChartPage() {
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

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "var(--space-lg) clamp(1.25rem, 3vw, 3rem) var(--space-3xl)" }}>
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <span style={{
            display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "0.3rem 0.8rem", border: "1px solid currentColor", borderRadius: "20px",
            marginBottom: "var(--space-sm)",
          }}>NATAL CHART</span>
          <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 5vw, 3rem)", textTransform: "uppercase", lineHeight: 0.9, marginBottom: "var(--space-xs)" }}>
            Your Chart
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Leo Sun · Scorpio Moon · Aries Rising
          </p>
        </div>

        {/* Planet Positions Table */}
        <section style={{ marginBottom: "var(--space-2xl)" }}>
          <h4 style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>
            PLANET POSITIONS
          </h4>
          <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1.5fr 0.7fr 1fr 1fr",
              padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--surface-border)",
              fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--text-tertiary)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              <span>Planet</span><span>Sign</span><span>House</span><span>Degree</span><span></span>
            </div>
            {MOCK_PLANETS.map((p, i) => (
              <motion.div key={p.planet}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 0.7fr 1fr 1fr",
                  padding: "0.55rem 0.75rem", alignItems: "center",
                  borderBottom: i < MOCK_PLANETS.length - 1 ? "1px solid var(--surface-border)" : "none",
                }}>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{p.planet}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem" }}>{p.sign}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{p.house}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-secondary)" }}>{p.degree}</span>
                <span>{p.dignity && (
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.45rem",
                    padding: "0.12rem 0.4rem", borderRadius: "var(--radius-full)",
                    letterSpacing: "0.08em",
                    background: p.dignity === "DOMICILE" || p.dignity === "EXALTED"
                      ? "rgba(90,158,120,0.15)" : "rgba(196,98,45,0.15)",
                    color: p.dignity === "DOMICILE" || p.dignity === "EXALTED"
                      ? "var(--sage)" : "var(--color-spiced-life)",
                  }}>{p.dignity}</span>
                )}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Major Aspects */}
        <section style={{ marginBottom: "var(--space-2xl)" }}>
          <h4 style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>
            MAJOR ASPECTS
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {MOCK_ASPECTS.map((a, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.5rem 0.75rem", background: "var(--surface)",
                border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: a.type === "Harmonious" ? "var(--sage)"
                      : a.type === "Tension" ? "var(--color-spiced-life)" : "var(--color-y2k-blue)",
                  }} />
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{a.aspect}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)" }}>{a.orb}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.5rem", padding: "0.12rem 0.4rem",
                    borderRadius: "var(--radius-full)", border: "1px solid var(--surface-border)",
                    color: a.type === "Harmonious" ? "var(--sage)"
                      : a.type === "Tension" ? "var(--color-spiced-life)" : "var(--color-y2k-blue)",
                  }}>{a.type.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .onboarding-logo { filter: invert(1) brightness(1.2); display: block; }
        [data-theme="light"] .onboarding-logo { filter: none; }
      `}</style>
    </div>
  );
}
