"use client";

/**
 * CouplesReadingView — magazine-spread layout for synastry readings.
 *
 * Consumes CouplesVM exclusively; zero direct access to the persisted
 * reading. The view-model does all derivation. Components stay
 * presentational so design iteration doesn't require touching data math.
 *
 * Section order (chapter-opener marks at the top of each):
 *   §01 The Read           — drop-cap intro
 *   §02 Goal Scores        — top 3 LIFE_EVENTS, side-by-side bars
 *   §03 Timings            — verdict + Best/Avoid windows
 *   §04 How <city> Feels   — relocated charts (3 tabs)
 *   §05 Who You Are in <city> — relocated angles per partner
 */

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";
import { EVENT_LABELS, verdictBand, type VerdictBand } from "@/app/lib/verdict";
import type { CouplesVM, PartnerEventScore, ChartTabVM, SynastryAspectVM } from "@/app/lib/couples-viewmodel";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SECTION_GAP = "clamp(56px, 8vw, 104px)";
const PAGE_MAX = 1080;

const BAND_FILL: Record<VerdictBand, string> = {
  peak:  "var(--sage)",
  solid: "var(--color-y2k-blue)",
  mixed: "var(--color-acqua)",
  tight: "var(--gold)",
  hard:  "var(--color-spiced-life)",
};

const ISSUE = "ASTRONAT · COUPLES";

// ═══════════════════════════════════════════════════════════════
// SHELL
// ═══════════════════════════════════════════════════════════════

interface Props {
  vm: CouplesVM;
  paramId?: string;
}

export default function CouplesReadingView({ vm }: Props) {
  const [tab, setTab] = useState<"you" | "partner" | "synastry">("you");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <Colophon issue={ISSUE} />
      <div style={{ maxWidth: PAGE_MAX, margin: "0 auto", padding: "0 clamp(20px, 4vw, 48px) clamp(80px, 8vw, 120px)" }}>
        <Hero hero={vm.hero} />
        <StatLedger ledger={vm.ledger} partnerName={vm.hero.partnerName} />

        <Section index="01" title="The Read" gap={SECTION_GAP}>
          <MagazineIntro intro={vm.intro} destination={vm.hero.destination} />
        </Section>

        <Section index="02" title="Goal Scores" gap={SECTION_GAP}>
          <GoalComparison goals={vm.goals} destination={vm.hero.destination} partnerName={vm.hero.partnerName} />
        </Section>

        <Section index="03" title="Timings" gap={SECTION_GAP}>
          <VerdictBlock timings={vm.timings} />
        </Section>

        <Section index="04" title={`How ${vm.hero.destination} Feels`} gap={SECTION_GAP}>
          <DeepDive deepDive={vm.deepDive} tab={tab} onTab={setTab} destination={vm.hero.destination} />
        </Section>

        <Section index="05" title={`Who You Are in ${vm.hero.destination}`} gap={SECTION_GAP}>
          <GeodeticSummary geodetic={vm.geodetic} youName="You" />
        </Section>

        <CouplesAcademy />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════

function Section({ index, title, gap, children }: { index: string; title: string; gap: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: gap }}>
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "baseline",
          columnGap: "clamp(20px, 3vw, 40px)",
          paddingBottom: "clamp(16px, 2vw, 24px)",
          borderBottom: "1px solid var(--surface-border)",
          marginBottom: "clamp(28px, 4vw, 48px)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "clamp(40px, 6vw, 72px)",
            lineHeight: 0.85,
            color: "var(--color-y2k-blue)",
            letterSpacing: "-0.02em",
          }}
        >
          §{index}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            fontWeight: 500,
            alignSelf: "end",
            paddingBottom: "0.4rem",
          }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Divider() {
  return <span aria-hidden style={{ background: "var(--surface-border)", width: 1, alignSelf: "stretch" }} />;
}

// ═══════════════════════════════════════════════════════════════
// COLOPHON
// ═══════════════════════════════════════════════════════════════

function Colophon({ issue }: { issue: string }) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--surface-border)",
        padding: "var(--space-md) clamp(20px, 4vw, 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-md)",
      }}
    >
      <a
        href="/readings"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
        }}
      >
        <ArrowLeft size={14} />
        ALL READINGS
      </a>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        {issue}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════

function Hero({ hero }: { hero: CouplesVM["hero"] }) {
  return (
    <section
      style={{
        position: "relative",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "clamp(20px, 3vw, 40px)",
        padding: "clamp(40px, 6vw, 80px) 0 clamp(24px, 3vw, 36px) 0",
        isolation: "isolate",
      }}
    >
      <SynastryWatermark />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0, position: "relative", zIndex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          {hero.dateRange} · WITH {hero.partnerName.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "clamp(56px, 8vw, 112px)",
            lineHeight: 0.9,
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
          }}
        >
          {hero.destination}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem", position: "relative", zIndex: 1 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--text-tertiary)" }}>
          COHERENCE
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", fontFamily: "var(--font-primary)" }}>
          <span style={{ fontSize: "clamp(56px, 8vw, 96px)", lineHeight: 1, color: hero.coherence.accent, letterSpacing: "-0.02em" }}>
            {hero.coherence.score}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-tertiary)" }}>/100</span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: hero.coherence.accent,
            fontWeight: 600,
          }}
        >
          {hero.coherence.label}
        </span>
      </div>
    </section>
  );
}

function SynastryWatermark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 100"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.045,
        pointerEvents: "none",
        zIndex: 0,
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="80"  cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="120" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="80"  cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <circle cx="120" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <line x1="38" y1="50" x2="162" y2="50" stroke="currentColor" strokeWidth="0.25" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT LEDGER
// ═══════════════════════════════════════════════════════════════

function StatLedger({ ledger, partnerName }: { ledger: CouplesVM["ledger"]; partnerName: string }) {
  return (
    <section
      style={{
        borderTop: "1px solid var(--surface-border)",
        borderBottom: "1px solid var(--surface-border)",
        padding: "clamp(24px, 3.5vw, 40px) 0",
        display: "grid",
        gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
        alignItems: "stretch",
        gap: "clamp(16px, 2.5vw, 32px)",
      }}
    >
      <LedgerColumn name="YOU" score={ledger.you.score} label={ledger.you.label} accent={ledger.you.accent} />
      <Divider />
      <LedgerColumn name="Δ MACRO" score={ledger.delta} label="POINTS APART" accent="var(--text-tertiary)" suffix="pts" />
      <Divider />
      <LedgerColumn name={partnerName.toUpperCase()} score={ledger.partner.score} label={ledger.partner.label} accent={ledger.partner.accent} align="right" />
    </section>
  );
}

function LedgerColumn({
  name, score, label, accent, align = "left", suffix = "/100",
}: {
  name: string; score: number; label: string; accent: string; align?: "left" | "right"; suffix?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--text-tertiary)" }}>
        {name}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
        <span style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {score}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{suffix}</span>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: accent }}>
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §01 THE READ
// ═══════════════════════════════════════════════════════════════

function MagazineIntro({ intro, destination }: { intro: CouplesVM["intro"]; destination: string }) {
  const goalsLine = intro.goals.join(" and ");
  const bold: React.CSSProperties = { fontWeight: 700, color: "var(--text-primary)" };
  const introLetter = "B"; // matches the deterministic opener "Based on…"

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(16px, 2.5vw, 32px)" }}>
      <span
        aria-hidden
        style={{
          fontFamily: "var(--font-primary)",
          fontSize: "clamp(96px, 13vw, 168px)",
          lineHeight: 0.72,
          color: "var(--color-y2k-blue)",
          letterSpacing: "-0.05em",
          flexShrink: 0,
          marginTop: "-0.05em",
        }}
      >
        {introLetter}
      </span>
      <p
        style={{
          fontFamily: "var(--font-secondary)",
          fontSize: "clamp(1.15rem, 1.8vw, 1.45rem)",
          lineHeight: 1.55,
          color: "var(--text-secondary)",
          margin: 0,
          maxWidth: "60ch",
          paddingTop: "0.7rem",
        }}
      >
        ased on shared goals in <span style={bold}>{goalsLine}</span>, {destination} supports{" "}
        {intro.topPicks.length === 0 ? (
          <span style={bold}>your shared picks</span>
        ) : (
          <span style={bold}>
            {intro.topPicks.slice(0, -1).join(", ")}{intro.topPicks.length > 1 ? ", and " : ""}{intro.topPicks.slice(-1)}
          </span>
        )}{" "}
        most.{" "}
        {intro.cautions.length > 0 && (
          <>Friction concentrates in <span style={bold}>{intro.cautions.join(", ")}</span>. </>
        )}
        {intro.bestWindowShort && (
          <>Target <span style={bold}>{intro.bestWindowShort}</span> for the strongest window
          {intro.avoidWindowShort ? "; " : "."} </>
        )}
        {intro.avoidWindowShort && (
          <>skip <span style={bold}>{intro.avoidWindowShort}</span>.</>
        )}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §02 GOAL COMPARISON
// ═══════════════════════════════════════════════════════════════

function GoalComparison({
  goals, destination: _destination, partnerName,
}: { goals: CouplesVM["goals"]; destination: string; partnerName: string }) {
  void _destination;
  return (
    <>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          margin: "0 0 clamp(20px, 3vw, 32px)",
          maxWidth: "62ch",
        }}
      >
        Top three goals from your selection — <strong style={{ color: "var(--text-primary)" }}>{goals.selectedGoals.join(" and ")}</strong>.
        Bars are colored by each partner&apos;s individual verdict band.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(180px, 1.2fr) 1fr 1fr auto",
          alignItems: "center",
          gap: "var(--space-md)",
          padding: "0 var(--space-md) var(--space-sm)",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <span />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>YOU</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>{partnerName.toUpperCase()}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)", minWidth: "2rem", textAlign: "right" }}>Δ</span>
      </div>

      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {goals.topThree.map((e, i) => (
          <EventRow key={e.event} ev={e} pinned={goals.priority.has(e.event)} divider={i < goals.topThree.length - 1} />
        ))}
      </ol>
    </>
  );
}

function EventRow({ ev, pinned, divider }: { ev: PartnerEventScore; pinned: boolean; divider: boolean }) {
  const youBand     = verdictBand(ev.you);
  const partnerBand = verdictBand(ev.partner);
  const delta = Math.abs(ev.you - ev.partner);
  const showDelta = delta >= 15;

  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(180px, 1.2fr) 1fr 1fr auto",
        alignItems: "center",
        gap: "var(--space-md)",
        padding: "var(--space-md)",
        borderBottom: divider ? "1px solid var(--surface-border)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
        {pinned && (
          <span aria-hidden style={{ width: 3, height: 28, background: "var(--color-y2k-blue)", flexShrink: 0 }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-secondary)", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
            {ev.event}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.18em", color: "var(--text-tertiary)" }}>
            {EVENT_LABELS[youBand]} · {EVENT_LABELS[partnerBand]}
          </span>
        </div>
      </div>
      <BarCell score={ev.you}     color={BAND_FILL[youBand]} />
      <BarCell score={ev.partner} color={BAND_FILL[partnerBand]} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.18em",
          color: showDelta ? "var(--gold)" : "var(--text-tertiary)",
          minWidth: "2.5rem",
          textAlign: "right",
        }}
      >
        {showDelta ? `Δ${delta}` : "—"}
      </span>
    </li>
  );
}

function BarCell({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg)", borderTop: "1px solid var(--surface-border)", borderBottom: "1px solid var(--surface-border)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: "100%", background: color, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600, minWidth: "1.8rem", textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// §03 TIMINGS
// ═══════════════════════════════════════════════════════════════

function VerdictBlock({ timings }: { timings: CouplesVM["timings"] }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", margin: "0 0 clamp(36px, 5vw, 56px)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: timings.accent,
            fontWeight: 700,
          }}
        >
          {timings.label} · {timings.coherenceScore}/100
        </div>
        <p
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "clamp(1.4rem, 2.6vw, 2rem)",
            lineHeight: 1.2,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.015em",
            maxWidth: "60ch",
          }}
        >
          {capitalizeFirst(timings.rationale)}.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(28px, 4vw, 48px)" }} className="windows-grid">
        <WindowList title="BEST WINDOWS" color="var(--color-planet-jupiter)" items={timings.bestWindows} />
        {timings.avoidWindows.length > 0 && (
          <WindowList title="AVOID" color="var(--color-spiced-life)" items={timings.avoidWindows} />
        )}
      </div>
      <style jsx>{`
        @media (min-width: 720px) {
          .windows-grid { grid-template-columns: 2fr 1fr !important; }
        }
      `}</style>
    </>
  );
}

function WindowList({ title, color, items }: { title: string; color: string; items: string[] }) {
  if (items.length === 0) {
    return (
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--text-tertiary)", marginBottom: "var(--space-md)", paddingBottom: "0.5rem", borderBottom: "1px solid var(--surface-border)" }}>
          {title}
        </div>
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
          —
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--text-tertiary)", marginBottom: "var(--space-md)", paddingBottom: "0.5rem", borderBottom: "1px solid var(--surface-border)" }}>
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
        {items.map((w, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: "0.8rem",
              alignItems: "flex-start",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              padding: "0.7rem 0",
              borderBottom: i < items.length - 1 ? "1px solid var(--surface-border)" : "none",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color, marginTop: "0.15rem" }}>●</span>
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §04 DEEP DIVE
// ═══════════════════════════════════════════════════════════════

function DeepDive({
  deepDive, tab, onTab, destination,
}: {
  deepDive: CouplesVM["deepDive"];
  tab: "you" | "partner" | "synastry";
  onTab: (t: "you" | "partner" | "synastry") => void;
  destination: string;
}) {
  const tabs: Array<{ id: "you" | "partner" | "synastry"; label: string }> = [
    { id: "you",      label: "For you" },
    { id: "partner",  label: `For ${deepDive.partnerName}` },
    { id: "synastry", label: "Between you" },
  ];

  return (
    <>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          margin: "0 0 clamp(28px, 4vw, 48px)",
          maxWidth: "62ch",
        }}
      >
        Two relocated charts and the cross-aspects between them. Each entry shows
        what the city activates.
      </p>

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(20px, 3vw, 36px)",
          paddingBottom: "clamp(16px, 2vw, 24px)",
          borderBottom: "1px solid var(--surface-border)",
          marginBottom: "clamp(32px, 4vw, 48px)",
        }}
      >
        {tabs.map((t, i) => {
          const active = t.id === tab;
          const num = String(i + 1).padStart(2, "0");
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "baseline",
                gap: "0.6rem",
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                transition: "color 0.2s",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.22em",
                  color: active ? "var(--color-y2k-blue)" : "var(--text-tertiary)",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {num}
              </span>
              <span
                style={{
                  fontFamily: active ? "var(--font-primary)" : "var(--font-mono)",
                  fontSize: active ? "1.05rem" : "0.7rem",
                  letterSpacing: active ? "-0.01em" : "0.22em",
                  textTransform: active ? "none" : "uppercase",
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>

      <AnimatePresence mode="wait">
        {tab === "you" && (
          <motion.div key="you" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <ChartTab tab={deepDive.you} destination={destination} />
          </motion.div>
        )}
        {tab === "partner" && (
          <motion.div key="partner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <ChartTab tab={deepDive.partner} destination={destination} />
          </motion.div>
        )}
        {tab === "synastry" && (
          <motion.div key="synastry" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <SynastryTab synastry={deepDive.synastry} partnerName={deepDive.partnerName} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChartTab({ tab, destination }: { tab: ChartTabVM; destination: string }) {
  const accent =
    tab.macroScore >= 65 ? "var(--sage)" :
    tab.macroScore >= 50 ? "var(--gold)" : "var(--color-spiced-life)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(32px, 4vw, 56px)" }} className="dd-grid">
      <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
        <NatalMockupWheel isDark planets={tab.planets as any} cusps={tab.cusps} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 3vw, 36px)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            gap: "clamp(12px, 2vw, 24px)",
            paddingBottom: "clamp(16px, 2vw, 24px)",
            borderBottom: "1px solid var(--surface-border)",
          }}
        >
          <FlatStat label="MACRO" value={`${tab.macroScore}/100`} accent={accent} />
          <Divider />
          <FlatStat label="ELEMENT" value={tab.element} />
          <Divider />
          <FlatStat label="MODALITY" value={tab.modality} />
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--text-tertiary)", marginBottom: "var(--space-md)", paddingBottom: "0.5rem", borderBottom: "1px solid var(--surface-border)" }}>
            STANDOUT PLACEMENTS AT {destination.toUpperCase()}
          </div>
          {tab.standout.length === 0 ? (
            <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--text-tertiary)" }}>
              No standout placements at this destination.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
              {tab.standout.map((p, i) => (
                <li
                  key={`${p.planet}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(80px, auto) 1fr",
                    gap: "var(--space-md)",
                    padding: "var(--space-md) 0",
                    borderBottom: i < tab.standout.length - 1 ? "1px solid var(--surface-border)" : "none",
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "var(--font-secondary)", fontSize: "1.05rem", color: "var(--text-primary)" }}>
                      {p.planet}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "var(--text-tertiary)" }}>
                      {p.sign} · {p.degree}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--color-y2k-blue)", marginBottom: "0.25rem" }}>
                      {p.house.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {p.note}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 880px) {
          .dd-grid { grid-template-columns: minmax(320px, 1fr) 1fr !important; align-items: start; }
        }
      `}</style>
    </div>
  );
}

function FlatStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-primary)", fontSize: "1.15rem", color: accent ?? "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.01em" }}>
        {value}
      </div>
    </div>
  );
}

function SynastryTab({ synastry, partnerName }: { synastry: CouplesVM["deepDive"]["synastry"]; partnerName: string }) {
  const hasAny = synastry.harmonious.length > 0 || synastry.tense.length > 0;
  if (!hasAny) {
    return (
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-tertiary)", margin: 0, maxWidth: "62ch" }}>
        No cross-aspects within standard orbs.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 3.5vw, 40px)" }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, maxWidth: "62ch", lineHeight: 1.6 }}>
        Where your charts meet directly. Harmonious aspects are baseline ease;
        tense ones are productive friction if you know what they're about.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(28px, 4vw, 48px)" }} className="aspect-grid">
        <AspectColumn title="Harmonious" tone="lift"  items={synastry.harmonious} partnerName={partnerName} />
        <AspectColumn title="Tense"      tone="press" items={synastry.tense}      partnerName={partnerName} />
      </div>
      <style jsx>{`
        @media (min-width: 880px) {
          .aspect-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function AspectColumn({
  title, tone, items, partnerName,
}: { title: string; tone: "lift" | "press"; items: SynastryAspectVM[]; partnerName: string }) {
  const accent = tone === "lift" ? "var(--color-acqua)" : "var(--color-spiced-life)";
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          letterSpacing: "0.28em",
          color: accent,
          fontWeight: 700,
          marginBottom: "var(--space-md)",
          paddingBottom: "0.5rem",
          borderBottom: `1px solid ${accent}`,
        }}
      >
        {title.toUpperCase()}
      </div>
      {items.length === 0 ? (
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-tertiary)" }}>—</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
          {items.map((a, i) => (
            <li
              key={i}
              style={{
                padding: "var(--space-md) 0",
                borderBottom: i < items.length - 1 ? "1px solid var(--surface-border)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-md)" }}>
                <span style={{ fontFamily: "var(--font-secondary)", fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  {a.p1} {a.aspect} {partnerName}&apos;s {a.p2}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.15em", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                  ORB {a.orb.toFixed(1)}°
                </span>
              </div>
              <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                {a.meaning}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §05 GEODETIC
// ═══════════════════════════════════════════════════════════════

function GeodeticSummary({ geodetic, youName }: { geodetic: CouplesVM["geodetic"]; youName: string }) {
  return (
    <>
      <p
        style={{
          fontFamily: "var(--font-secondary)",
          fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)",
          lineHeight: 1.5,
          color: "var(--text-secondary)",
          margin: "0 0 clamp(28px, 4vw, 48px)",
          maxWidth: "62ch",
        }}
      >
        {geodetic.summary}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
        <GeoRow
          who={youName.toUpperCase()}
          ascSign={geodetic.you.ascSign} ascDeg={geodetic.you.ascDeg}
          mcSign={geodetic.you.mcSign}   mcDeg={geodetic.you.mcDeg}
          note={geodetic.you.note}
          first
        />
        <GeoRow
          who={geodetic.partnerName.toUpperCase()}
          ascSign={geodetic.partner.ascSign} ascDeg={geodetic.partner.ascDeg}
          mcSign={geodetic.partner.mcSign}   mcDeg={geodetic.partner.mcDeg}
          note={geodetic.partner.note}
        />
      </div>
    </>
  );
}

function GeoRow({ who, ascSign, ascDeg, mcSign, mcDeg, note, first }: {
  who: string; ascSign: string; ascDeg: number; mcSign: string; mcDeg: number; note: string; first?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(90px, auto) minmax(160px, auto) 1fr",
        gap: "clamp(20px, 3vw, 40px)",
        alignItems: "baseline",
        padding: "clamp(20px, 3vw, 32px) 0",
        borderTop: first ? "1px solid var(--surface-border)" : "none",
        borderBottom: "1px solid var(--surface-border)",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.28em", color: "var(--text-tertiary)" }}>
        {who}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>ASC</span>
          <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.2rem", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            {ascSign} {ascDeg}°
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>MC</span>
          <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.2rem", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            {mcSign} {mcDeg}°
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontFamily: "var(--font-secondary)", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: "50ch" }}>
        {note}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COUPLES ACADEMY
// ═══════════════════════════════════════════════════════════════

const ACADEMY_ARTICLES = [
  { id: "synastry",  kicker: "FOUNDATION", title: "Synastry, plainly",          time: "9 MIN" },
  { id: "composite", kicker: "ADVANCED",   title: "The composite chart",        time: "12 MIN" },
  { id: "seventh",   kicker: "HOUSES",     title: "What the 7th house wants",   time: "7 MIN" },
  { id: "geo",       kicker: "PLACE",      title: "How a place reshapes you",   time: "10 MIN" },
];

function CouplesAcademy() {
  return (
    <section
      style={{
        marginTop: "clamp(80px, 10vw, 140px)",
        borderTop: "3px solid var(--text-primary)",
        paddingTop: "clamp(24px, 3vw, 36px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "clamp(40px, 5vw, 64px)" }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-primary)",
            fontSize: "clamp(28px, 4.5vw, 44px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          Academy
        </h2>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          See all →
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 0,
        }}
      >
        {ACADEMY_ARTICLES.map((a, i) => (
          <article
            key={a.id}
            style={{
              padding: "0 clamp(16px, 2vw, 24px)",
              borderLeft: i === 0 ? "1px solid var(--surface-border)" : "none",
              borderRight: "1px solid var(--surface-border)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minHeight: 200,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.22em",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              {a.kicker}
            </span>
            <h3
              style={{
                margin: 0,
                fontFamily: "var(--font-primary)",
                fontSize: "clamp(20px, 1.8vw, 26px)",
                color: "var(--text-primary)",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              {a.title}
            </h3>
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "10px", paddingTop: "20px" }}>
              <ArrowRight size={14} strokeWidth={1.25} style={{ color: "var(--text-tertiary)" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.22em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                }}
              >
                ASTRONAT · {a.time}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
