"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, MapPin, Calendar, Compass } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "../../components/ThemeToggle";
import { ScoreRing, getVerdict, BAND_CONFIG } from "../../components/ScoreRing";
import { COUNTRY_CHARTS, type CountryChart } from "../../../lib/mundane-charts";

const MOCK_READING = {
  destination: "Tokyo, Japan",
  travelDate: "2026-05-12",
  travelType: "trip" as const,
  macroScore: 87,
  houses: [
    { house: 1, name: "Identity", score: 82, planet: "Mercury", sign: "Gemini", line: "ASC", insight: "Strong communicative energy amplifies your presence here.", tag: "PERSONAL" },
    { house: 2, name: "Resources", score: 65, planet: "Venus", sign: "Taurus", line: "—", insight: "Financial stability but no major gains indicated.", tag: "PERSONAL" },
    { house: 3, name: "Communication", score: 91, planet: "Mercury", sign: "Gemini", line: "MC", insight: "Exceptional environment for writing, learning, and short journeys.", tag: "PERSONAL" },
    { house: 4, name: "Home & Roots", score: 58, planet: "Moon", sign: "Cancer", line: "IC", insight: "Mixed domestic energy — good for visits, less ideal for relocation.", tag: "PERSONAL" },
    { house: 5, name: "Creativity", score: 78, planet: "Sun", sign: "Leo", line: "—", insight: "Creative self-expression thrives. Romance favored.", tag: "PERSONAL" },
    { house: 6, name: "Work & Health", score: 70, planet: "Mars", sign: "Virgo", line: "—", insight: "Productive daily routines. Watch for overwork.", tag: "MUNDANE" },
    { house: 7, name: "Partnerships", score: 88, planet: "Venus", sign: "Libra", line: "DSC", insight: "Excellent for forming meaningful partnerships and collaborations.", tag: "PERSONAL" },
    { house: 8, name: "Transformation", score: 45, planet: "Pluto", sign: "Scorpio", line: "—", insight: "Deep psychological work possible but can be intense.", tag: "MUNDANE" },
    { house: 9, name: "Exploration", score: 95, planet: "Jupiter", sign: "Sagittarius", line: "MC", insight: "Peak energy for travel, higher learning, and expansion.", tag: "PERSONAL" },
    { house: 10, name: "Career", score: 84, planet: "Saturn", sign: "Capricorn", line: "MC", insight: "Strong career advancement potential. Authority recognized.", tag: "PERSONAL" },
    { house: 11, name: "Community", score: 72, planet: "Uranus", sign: "Aquarius", line: "—", insight: "Innovative social connections. Group endeavors favored.", tag: "MUNDANE" },
    { house: 12, name: "Spirituality", score: 60, planet: "Neptune", sign: "Pisces", line: "—", insight: "Intuition heightened but boundaries may blur.", tag: "GEODETIC" },
  ],
  transitWindows: [
    { start: "2026-05-01", end: "2026-05-18", transit: "Jupiter trine natal Sun", type: "PERSONAL", recommendation: "Peak window — book flights for this period." },
    { start: "2026-06-10", end: "2026-06-28", transit: "Venus conjunct natal MC", type: "PERSONAL", recommendation: "Career meetings and creative projects thrive." },
    { start: "2026-08-01", end: "2026-08-15", transit: "Mars square natal Moon", type: "MUNDANE", recommendation: "Avoid: emotional tension peaks. Postpone if possible." },
    { start: "2026-09-20", end: "2026-10-05", transit: "Mercury trine natal Jupiter", type: "PERSONAL", recommendation: "Excellent for negotiations and learning opportunities." },
  ],
  planetaryLines: [
    { planet: "Jupiter", line: "MC", distance: "78 km", tier: "Strong" },
    { planet: "Venus", line: "DSC", distance: "156 km", tier: "Moderate" },
    { planet: "Sun", line: "ASC", distance: "243 km", tier: "Moderate" },
    { planet: "Saturn", line: "IC", distance: "412 km", tier: "Weak" },
    { planet: "Mars", line: "MC", distance: "580 km", tier: "Out of range" },
  ],
};

function VerdictLabel({ score }: { score: number }) {
  const v = getVerdict(score);
  const cfg = BAND_CONFIG[v];
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "0.65rem",
      letterSpacing: "0.08em", textTransform: "uppercase",
      color: cfg.color,
    }}>{cfg.label}</span>
  );
}

export default function ReadingPage() {
  const params = useParams();
  const router = useRouter();
  const reading = MOCK_READING;
  const [expandedHouse, setExpandedHouse] = useState<number | null>(null);

  const verdict = getVerdict(reading.macroScore);
  const destinationCountry = COUNTRY_CHARTS.find((c: CountryChart) => reading.destination.includes(c.name));

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
        {/* Back link */}
        <button onClick={() => router.push("/readings?demo=true")} style={{
          background: "none", border: "none", color: "var(--text-tertiary)",
          fontFamily: "var(--font-mono)", fontSize: "0.6rem", cursor: "pointer",
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "var(--space-md)",
          display: "flex", alignItems: "center", gap: "0.3rem",
        }}><ArrowLeft size={12} /> All Readings</button>

        {/* Destination header + Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "var(--space-xs)" }}>
            <MapPin size={14} color="var(--text-tertiary)" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {reading.travelType === "trip" ? "SHORT TRIP" : "RELOCATION"}
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 5vw, 3.5rem)", textTransform: "uppercase", lineHeight: 0.9, marginBottom: "var(--space-sm)" }}>
            {reading.destination}
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            <Calendar size={13} /> {new Date(reading.travelDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div style={{ margin: "var(--space-md) auto 0", display: "inline-block" }}>
            <ScoreRing score={reading.macroScore} verdict={verdict} />
          </div>
        </motion.div>

        {/* House breakdown */}
        <section style={{ marginBottom: "var(--space-2xl)" }}>
          <h4 style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>
            HOUSE ANALYSIS
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {reading.houses.map((h) => {
              const hVerdict = getVerdict(h.score);
              const hCfg = BAND_CONFIG[hVerdict];
              const isOpen = expandedHouse === h.house;
              return (
                <motion.div key={h.house} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: h.house * 0.03 }}
                  style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <button onClick={() => setExpandedHouse(isOpen ? null : h.house)} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.6rem 0.75rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", color: "var(--text-tertiary)", width: "1.5rem" }}>
                        {String(h.house).padStart(2, "0")}
                      </span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{h.name}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                          {h.planet} in {h.sign} {h.line !== "—" && `· ${h.line}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", padding: "0.15rem 0.4rem", border: `1px solid ${hCfg.color}`, borderRadius: "var(--radius-full)", color: hCfg.color }}>{h.tag}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.85rem", color: hCfg.color }}>{h.score}</span>
                      {isOpen ? <ChevronUp size={14} color="var(--text-tertiary)" /> : <ChevronDown size={14} color="var(--text-tertiary)" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 0.75rem 0.6rem", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, borderTop: "1px solid var(--surface-border)", paddingTop: "0.5rem" }}>
                      {h.insight}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Mundane Layer */}
        {destinationCountry && (
          <section style={{ marginBottom: "var(--space-2xl)" }}>
            <span style={{
              display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.55rem",
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "0.2rem 0.6rem", border: "1px solid currentColor", borderRadius: "20px",
              marginBottom: "var(--space-sm)", color: 'var(--color-acqua)'
            }}>MUNDANE LAYER</span>
            <h3 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.5rem', marginTop: '0', textTransform: 'uppercase' }}>
              {destinationCountry.name}'s Chart + Yours
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>COUNTRY SUN</span>
                <p style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.1rem', margin: '0.25rem 0 0' }}>{destinationCountry.sunSign}</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>FOUNDED</span>
                <p style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.1rem', margin: '0.25rem 0 0' }}>{new Date(destinationCountry.founding).getFullYear()}</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>RESONANCE</span>
                <div style={{ marginTop: '0.25rem' }}>
                    <VerdictLabel score={84} />
                </div>
              </div>
            </div>
            <button
              style={{ marginTop: 'var(--space-md)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-y2k-blue)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              onClick={() => router.push(`/mundane?country=${destinationCountry.slug}`)}
            >
              See full country chart &rarr;
            </button>
          </section>
        )}

        {/* Transit Windows */}
        <section style={{ marginBottom: "var(--space-2xl)" }}>
          <h4 style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>
            TRANSIT WINDOWS
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {reading.transitWindows.map((tw, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{tw.transit}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", padding: "0.15rem 0.4rem", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-full)", color: tw.type === "MUNDANE" ? "var(--color-spiced-life)" : "var(--color-y2k-blue)" }}>{tw.type}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  {new Date(tw.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(tw.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{tw.recommendation}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Planetary Lines */}
        <section style={{ marginBottom: "var(--space-2xl)" }}>
          <h4 style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>
            NEAREST PLANETARY LINES
          </h4>
          <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            {reading.planetaryLines.map((pl, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderBottom: i < reading.planetaryLines.length - 1 ? "1px solid var(--surface-border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Compass size={13} color="var(--text-tertiary)" />
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{pl.planet}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--text-tertiary)" }}>{pl.line}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem" }}>{pl.distance}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.05em",
                    color: pl.tier === "Strong" ? "var(--sage)" : pl.tier === "Moderate" ? "var(--gold)" : "var(--text-tertiary)",
                  }}>{pl.tier.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <button className="btn btn-primary" onClick={() => router.push("/flow")} style={{ padding: "0.85rem 2rem" }}>
            Run Another Reading <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .onboarding-logo { filter: invert(1) brightness(1.2); display: block; }
        [data-theme="light"] .onboarding-logo { filter: none; }
      `}</style>
    </div>
  );
}
