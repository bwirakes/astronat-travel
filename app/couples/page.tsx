"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, AlertTriangle } from "lucide-react";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";
import { ScoreRing, getVerdict, BAND_CONFIG } from "../components/ScoreRing";

const MOCK_RESULT = {
  userScore: 87,
  partnerScore: 62,
  compositeScore: 75,
  destination: "Tokyo, Japan",
  partnerName: "Luna",
  userBreakdown: [
    { house: "H1 Identity", score: 82, detail: "Mercury in Gemini on ASC" },
    { house: "H7 Partnerships", score: 88, detail: "Venus conjunct DSC" },
    { house: "H10 Career", score: 84, detail: "Jupiter conjunct MC" },
  ],
  partnerBreakdown: [
    { house: "H1 Identity", score: 41, detail: "Saturn square ASC" },
    { house: "H7 Partnerships", score: 76, detail: "Moon trine DSC" },
    { house: "H10 Career", score: 70, detail: "Sun sextile MC" },
  ],
};

export default function CouplesPage() {
  const [step, setStep] = useState<"input" | "result">("input");
  const [partnerName, setPartnerName] = useState("Luna");
  const [loading, setLoading] = useState(false);

  const handleCompare = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("result");
    }, 800);
  };

  const scoreDiff = Math.abs(MOCK_RESULT.userScore - MOCK_RESULT.partnerScore);

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
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <span style={{
            display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "0.3rem 0.8rem", border: "1px solid currentColor", borderRadius: "20px",
            marginBottom: "var(--space-sm)",
          }}>SYNASTRY</span>
          <h1 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 5vw, 3rem)", textTransform: "uppercase", lineHeight: 0.9, marginBottom: "var(--space-xs)" }}>
            Couples & Family
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Compare destination scores for you and your partner.
          </p>
        </div>

        {step === "input" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <section style={{ background: "var(--surface)", padding: "var(--space-lg)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                PARTNER&apos;S CHART
              </span>
              <div className="input-group" style={{ marginTop: "1rem" }}>
                <label className="input-label">Partner&apos;s name</label>
                <input className="input-field" type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                <div className="input-group">
                  <label className="input-label">Date of birth</label>
                  <input className="input-field" type="date" defaultValue="1996-03-22" />
                </div>
                <div className="input-group">
                  <label className="input-label">Time of birth</label>
                  <input className="input-field" type="time" defaultValue="09:15" />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: "0.75rem" }}>
                <label className="input-label">City of birth</label>
                <input className="input-field" type="text" defaultValue="Melbourne, Australia" />
              </div>
              <div className="input-group" style={{ marginTop: "0.75rem" }}>
                <label className="input-label">Destination to compare</label>
                <input className="input-field" type="text" defaultValue="Tokyo, Japan" />
              </div>
              <button className="btn btn-primary" style={{ borderRadius: "var(--shape-asymmetric-md)", marginTop: "1.5rem" }}
                onClick={handleCompare} disabled={loading}>
                {loading ? "Calculating..." : "Compare Scores →"}
              </button>
            </section>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ textAlign: "center", marginBottom: "var(--space-md)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>
                DESTINATION: {MOCK_RESULT.destination.toUpperCase()}
              </span>
            </div>

            {/* 3-column score header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "var(--space-xs)", marginBottom: "var(--space-lg)" }}>
              {/* You */}
              <div style={{ background: "var(--color-charcoal)", clipPath: "var(--cut-md)", padding: "var(--space-md)", textAlign: "center", color: "var(--color-eggshell)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "rgba(255,255,255,0.6)" }}>YOU</span>
                <div style={{ transform: "scale(0.6)", transformOrigin: "center" }}>
                  <ScoreRing score={MOCK_RESULT.userScore} verdict={getVerdict(MOCK_RESULT.userScore)} />
                </div>
              </div>

              {/* Together */}
              <div style={{ background: "var(--color-y2k-blue)", clipPath: "var(--cut-md)", padding: "var(--space-md)", textAlign: "center", color: "white" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "rgba(255,255,255,0.7)" }}>TOGETHER</span>
                <div style={{ transform: "scale(0.7)", transformOrigin: "center" }}>
                  <ScoreRing score={MOCK_RESULT.compositeScore} verdict={getVerdict(MOCK_RESULT.compositeScore)} />
                </div>
              </div>

              {/* Partner */}
              <div style={{ background: "var(--color-charcoal)", clipPath: "var(--cut-md)", padding: "var(--space-md)", textAlign: "center", color: "var(--color-eggshell)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "rgba(255,255,255,0.6)" }}>{partnerName.toUpperCase()}</span>
                <div style={{ transform: "scale(0.6)", transformOrigin: "center" }}>
                  <ScoreRing score={MOCK_RESULT.partnerScore} verdict={getVerdict(MOCK_RESULT.partnerScore)} />
                </div>
              </div>
            </div>

            {/* Conflict callout */}
            {scoreDiff > 20 && (
              <div style={{
                padding: "var(--space-md)", background: "var(--surface)",
                border: "1px solid var(--color-spiced-life)", borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-lg)", display: "flex", alignItems: "flex-start", gap: "0.5rem",
              }}>
                <AlertTriangle size={16} color="var(--color-spiced-life)" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                <div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--color-spiced-life)", letterSpacing: "0.08em" }}>NOTABLE DIFFERENCE</span>
                  <p style={{ marginTop: "0.3rem", fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.3rem 0 0" }}>
                    This destination scores much better for one of you. Consider the highlighted house differences below.
                  </p>
                </div>
              </div>
            )}

            {/* Individual breakdowns */}
            {[
              { label: "Your Analysis", data: MOCK_RESULT.userBreakdown },
              { label: `${partnerName}'s Analysis`, data: MOCK_RESULT.partnerBreakdown },
            ].map((section) => (
              <section key={section.label} style={{ marginBottom: "var(--space-lg)" }}>
                <h4 style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: "var(--space-xs)" }}>
                  {section.label} — {MOCK_RESULT.destination}
                </h4>
                {section.data.map((row) => {
                  const cfg = BAND_CONFIG[getVerdict(row.score)];
                  return (
                    <div key={row.house} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.5rem 0.75rem", background: "var(--surface)", border: "1px solid var(--surface-border)",
                      borderRadius: "var(--radius-sm)", marginBottom: "0.3rem",
                    }}>
                      <div>
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8rem" }}>{row.house}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--text-tertiary)", marginLeft: "0.4rem" }}>{row.detail}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: cfg.color }}>{row.score}</span>
                    </div>
                  );
                })}
              </section>
            ))}

            <button onClick={() => setStep("input")} className="btn" style={{
              background: "var(--surface)", border: "1px solid var(--surface-border)",
              borderRadius: "var(--shape-asymmetric-md)", padding: "0.7rem 1.5rem",
            }}>
              ← Compare another partner
            </button>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        .onboarding-logo { filter: invert(1) brightness(1.2); display: block; }
        [data-theme="light"] .onboarding-logo { filter: none; }
      `}</style>
    </div>
  );
}
