"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import { ScoreRing, getVerdict } from "../components/ScoreRing";

const MOCK_READINGS = [
  { id: "1", destination: "Tokyo, Japan", score: 87, travelDate: "2026-05-12", travelType: "trip" },
  { id: "2", destination: "Paris, France", score: 62, travelDate: "2026-07-22", travelType: "trip" },
  { id: "3", destination: "Bali, Indonesia", score: 91, travelDate: "2026-09-01", travelType: "relocation" },
];

export default function ReadingsPage() {
  const router = useRouter();

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

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--space-lg) clamp(1.25rem, 3vw, 3rem) var(--space-3xl)" }}>
        <button onClick={() => router.push("/home")} style={{
          background: "none", border: "none", color: "var(--text-tertiary)",
          fontFamily: "var(--font-mono)", fontSize: "0.6rem", cursor: "pointer",
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "var(--space-md)",
          display: "flex", alignItems: "center", gap: "0.3rem",
        }}><ArrowLeft size={12} /> Home</button>

        <div style={{ marginBottom: "var(--space-lg)" }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--text-tertiary)",
          }}>HISTORY</span>
          <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 5vw, 3rem)", textTransform: "uppercase", lineHeight: 0.9, marginTop: "0.3rem" }}>
            Your Readings
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {MOCK_READINGS.map((r, i) => {
            const verdict = getVerdict(r.score);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => router.push(`/reading/${r.id}?demo=true`)}
                style={{
                  background: "var(--surface)", border: "1px solid var(--surface-border)",
                  borderRadius: "var(--shape-asymmetric-md)", padding: "var(--space-sm) var(--space-md)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", transition: "transform 0.15s ease",
                }}
                whileHover={{ y: -2 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                  <div style={{ transform: "scale(0.45)", transformOrigin: "left center", marginRight: "-40px", flexShrink: 0 }}>
                    <ScoreRing score={r.score} verdict={verdict} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9rem" }}>{r.destination}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginTop: "0.1rem" }}>
                      {new Date(r.travelDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} · {r.travelType}
                    </div>
                  </div>
                </div>
                <button style={{
                  background: "transparent", border: "1px solid var(--surface-border)", color: "var(--text-primary)",
                  borderRadius: "var(--radius-full)", padding: "0.35rem 1rem", fontSize: "0.75rem",
                  fontFamily: "var(--font-body)", fontWeight: 500, cursor: "pointer",
                }}>View &rsaquo;</button>
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
          <button className="btn btn-primary" onClick={() => router.push("/flow")} style={{ padding: "0.85rem 2rem" }}>
            + New Reading <ArrowRight size={15} />
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
