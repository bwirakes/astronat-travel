"use client";

/**
 * /mockup/couples — Couples Reading mockup, magazine-style.
 *
 * Layout:
 *   1. Header  — /reading-style: city + dates left, coherence + verdict right
 *   2. Intro   — single drop-cap paragraph synthesising goals / cautions / windows
 *   3. Goal comparison — 9 LIFE_EVENTS, side-by-side bars
 *   4. Deep Dive — your chart, partner's chart, synastry grid (with details)
 *   5. Verdict — TimingTab-style headline + Best Windows
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";
import { BAND_CONFIG, type Verdict } from "@/app/components/ScoreRing";

// ═══════════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════════

const YOU = { name: "Jo", initial: "JO" };
const PARTNER = { name: "Sam", initial: "SA" };

const DESTINATION = "Lisbon";
const DATE_RANGE = "AUG 27 — SEP 6, 2026";

const SCORES = {
  you: 78,
  partner: 64,
  delta: 14,
  coherence: 72,
};

type GoalId = "love" | "career" | "community" | "relocation" | "growth";
const SELECTED_GOALS: GoalId[] = ["love", "career"];

type EventScore = { event: string; you: number; partner: number };
const EVENT_SCORES: EventScore[] = [
  { event: "Identity & Self-Discovery",   you: 71, partner: 58 },
  { event: "Wealth & Financial Growth",   you: 64, partner: 49 },
  { event: "Home, Family & Roots",        you: 52, partner: 81 },
  { event: "Romance & Love",              you: 82, partner: 76 },
  { event: "Health, Routine & Wellness",  you: 60, partner: 68 },
  { event: "Partnerships & Marriage",     you: 79, partner: 72 },
  { event: "Career & Public Recognition", you: 86, partner: 41 },
  { event: "Friendship & Networking",     you: 55, partner: 63 },
  { event: "Spirituality & Inner Peace",  you: 48, partner: 70 },
];

const GOAL_TO_EVENTS: Record<GoalId, string[]> = {
  love:       ["Romance & Love", "Partnerships & Marriage"],
  career:     ["Career & Public Recognition", "Wealth & Financial Growth"],
  community:  ["Friendship & Networking"],
  relocation: ["Home, Family & Roots", "Identity & Self-Discovery"],
  growth:     ["Spirituality & Inner Peace", "Identity & Self-Discovery"],
};
const GOAL_LABEL: Record<GoalId, string> = {
  love: "love and connection",
  career: "career and visibility",
  community: "community and networks",
  relocation: "home and belonging",
  growth: "growth and expansion",
};

// Deep Dive — chart data
const YOUR_PLANETS = [
  { planet: "Sun", longitude: 144.92 }, { planet: "Moon", longitude: 200.48 },
  { planet: "Mercury", longitude: 158.88 }, { planet: "Venus", longitude: 99.26 },
  { planet: "Mars", longitude: 10.91 }, { planet: "Jupiter", longitude: 63.85 },
  { planet: "Saturn", longitude: 266.06 }, { planet: "Uranus", longitude: 267.19 },
  { planet: "Neptune", longitude: 277.69 }, { planet: "Pluto", longitude: 219.99 },
];
const PARTNER_PLANETS = [
  { planet: "Sun", longitude: 95.4 }, { planet: "Moon", longitude: 12.6 },
  { planet: "Mercury", longitude: 88.1 }, { planet: "Venus", longitude: 110.5 },
  { planet: "Mars", longitude: 305.7 }, { planet: "Jupiter", longitude: 178.2 },
  { planet: "Saturn", longitude: 224.4 }, { planet: "Uranus", longitude: 245.0 },
  { planet: "Neptune", longitude: 290.1 }, { planet: "Pluto", longitude: 230.8 },
];
const CUSPS = [32.64, 62.33, 90.84, 119.64, 150.15, 181.91, 212.64, 242.33, 270.84, 299.64, 330.15, 1.91];

// Deep Dive — standout relocated placements per partner
type Placement = { planet: string; sign: string; degree: string; house: string; note: string };
const YOUR_STANDOUT: Placement[] = [
  { planet: "Sun",      sign: "Leo",      degree: "24°55′", house: "10H Career",   note: "MC-conjunct in Lisbon — public visibility runs hot." },
  { planet: "Venus",    sign: "Cancer",   degree: "9°15′",  house: "9H Travel",    note: "Venus-on-the-9th asks for romance with movement, not nesting." },
  { planet: "Saturn",   sign: "Sag",      degree: "26°03′", house: "1H Identity",  note: "Saturn rising tightens the body — sleep, structure, fewer plans." },
];
const PARTNER_STANDOUT: Placement[] = [
  { planet: "Moon",     sign: "Aries",    degree: "12°36′", house: "4H Home",      note: "Moon on the IC — Sam will feel 'home' here faster than you." },
  { planet: "Jupiter",  sign: "Virgo",    degree: "28°12′", house: "9H Travel",    note: "Lucky 9th — long walks, language pickup, low-key opportunity." },
  { planet: "Mars",     sign: "Aquarius", degree: "5°42′",  house: "3H Voice",     note: "Mars in 3H — argues fast, recovers faster. Don't take the heat personally." },
];

// Synastry aspects with one-line plain-English meaning
type Aspect = { p1: string; p2: string; aspect: string; orb: number; meaning: string };
const SYNASTRY_HARMONIOUS: Aspect[] = [
  { p1: "Venus", p2: "Sun",     aspect: "trine",   orb: 1.2, meaning: "Easy attraction. The baseline 'I like being around you' aspect." },
  { p1: "Moon",  p2: "Venus",   aspect: "sextile", orb: 2.1, meaning: "Domestic warmth. The cooking-together, sharing-blankets aspect." },
  { p1: "Sun",   p2: "Jupiter", aspect: "trine",   orb: 3.4, meaning: "Mutual encouragement. You make each other braver." },
];
const SYNASTRY_TENSE: Aspect[] = [
  { p1: "Mars",    p2: "Saturn", aspect: "square",     orb: 0.8, meaning: "Pace mismatch. You push, they brake. Productive if you split roles." },
  { p1: "Mercury", p2: "Mars",   aspect: "opposition", orb: 1.6, meaning: "Conversations escalate fast. Choose channels (talk vs. text) deliberately." },
];

const BEST_WINDOWS = [
  "Apr 12–28 2026 — Venus over Lisbon's geodetic ASC",
  "May 9–22 2026 — Jupiter trine your composite Sun",
  "Sep 4–17 2026 — New Moon on Sam's IC",
];

const AVOID_WINDOWS = [
  "Jul 18–25 2026 — Mars square composite Saturn (logistical friction)",
];

// ═══════════════════════════════════════════════════════════════
// SCORE → VERDICT helpers
// ═══════════════════════════════════════════════════════════════

function getVerdict(score: number): Verdict {
  if (score >= 80) return "highlyProductive";
  if (score >= 65) return "productive";
  if (score >= 50) return "mixed";
  if (score >= 35) return "challenging";
  return "hostile";
}

function verdictForCoherence(score: number) {
  if (score >= 70) return { label: "Strong window",     tone: "good"  as const, rationale: "the sky is broadly supportive of what you two are going there to do" };
  if (score >= 55) return { label: "Open window",       tone: "good"  as const, rationale: "more support than friction across this stretch" };
  if (score >= 45) return { label: "Mixed window",      tone: "mixed" as const, rationale: "real potential, but it'll need some care to land cleanly" };
  if (score >= 30) return { label: "Tight window",      tone: "hard"  as const, rationale: "more friction than support — bring patience and right-size your asks" };
  return                { label: "Challenging window",  tone: "hard"  as const, rationale: "the sky is pressing hard against this — better windows exist nearby" };
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function MockupCouplesPage() {
  const [tab, setTab] = useState<"you" | "partner" | "synastry">("you");

  const sortedEvents = sortEventsByGoals(EVENT_SCORES, SELECTED_GOALS);
  const priorityEventNames = new Set(SELECTED_GOALS.flatMap((g) => GOAL_TO_EVENTS[g]));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <TopStrip />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px) var(--space-3xl)" }}>
        <Hero />
        <MagazineIntro events={sortedEvents} priority={priorityEventNames} />
        <GoalComparison events={sortedEvents} priority={priorityEventNames} />
        <VerdictBlock />
        <DeepDive tab={tab} onTab={setTab} />
        <GeodeticSummary />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOP STRIP — "← ALL READINGS · LISBON"
// ═══════════════════════════════════════════════════════════════

function TopStrip() {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--surface-border)",
        padding: "var(--space-md) clamp(16px, 4vw, 32px)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-md)",
      }}
    >
      <button
        type="button"
        style={{
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <ArrowLeft size={14} />
        ALL READINGS
      </button>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>·</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.22em", color: "var(--text-primary)", textTransform: "uppercase" }}>
        {DESTINATION} · COUPLES
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §1 HERO — /reading style: city + dates left, score + verdict right
// ═══════════════════════════════════════════════════════════════

function Hero() {
  const cohCfg = BAND_CONFIG[getVerdict(SCORES.coherence)];

  return (
    <>
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "clamp(16px, 2.4vw, 28px)",
          padding: "clamp(24px, 4vw, 40px) 0 clamp(16px, 2vw, 22px) 0",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(40px, 5.5vw, 72px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            {DESTINATION}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
            }}
          >
            {DATE_RANGE} · WITH {PARTNER.name.toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", fontFamily: "var(--font-primary)" }}>
            <span style={{ fontSize: "clamp(44px, 5.5vw, 72px)", lineHeight: 1, color: cohCfg.ring }}>
              {SCORES.coherence}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-tertiary)" }}>/100</span>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${cohCfg.ring}`,
              color: cohCfg.ring,
              background: `color-mix(in oklab, ${cohCfg.ring} 6%, transparent)`,
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            COHERENCE · {cohCfg.label}
          </span>
        </div>
      </section>

      <ScoresStrip />
    </>
  );
}

// "By the numbers" deck — three cells: YOU · Δ MACRO · SAM
function ScoresStrip() {
  const youCfg     = BAND_CONFIG[getVerdict(SCORES.you)];
  const partnerCfg = BAND_CONFIG[getVerdict(SCORES.partner)];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "var(--space-sm)",
        padding: "var(--space-lg) 0",
        borderBottom: "1px solid var(--surface-border)",
      }}
    >
      <ScoreCell label="YOU"     score={SCORES.you}     suffix="/100" verdictLabel={youCfg.label}     verdictColor={youCfg.ring} />
      <DeltaCell />
      <ScoreCell label={PARTNER.name.toUpperCase()} score={SCORES.partner} suffix="/100" verdictLabel={partnerCfg.label} verdictColor={partnerCfg.ring} />
    </section>
  );
}

function ScoreCell({ label, score, suffix, verdictLabel, verdictColor }: { label: string; score: number; suffix: string; verdictLabel: string; verdictColor: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
        <span style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1, color: "var(--text-primary)" }}>
          {score}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{suffix}</span>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: verdictColor }}>
        {verdictLabel}
      </span>
    </div>
  );
}

function DeltaCell() {
  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        background: "color-mix(in oklab, var(--text-primary) 3%, transparent)",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>
        Δ MACRO
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
        <span style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1, color: "var(--text-primary)" }}>
          {SCORES.delta}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)" }}>pts apart</span>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
        between you
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §2 MAGAZINE INTRO — drop-cap paragraph synthesising the spread
// ═══════════════════════════════════════════════════════════════

function MagazineIntro({ events, priority }: { events: EventScore[]; priority: Set<string> }) {
  const priorityEvents = events.filter((e) => priority.has(e.event));
  const ranked = [...priorityEvents].sort((a, b) => (b.you + b.partner) - (a.you + a.partner));
  const topPicks = ranked.slice(0, 3).map((e) => stripAmpersand(e.event));
  const cautions = ranked.slice(-1).map((e) => stripAmpersand(e.event));
  const goals = SELECTED_GOALS.join(" and ");
  const bold: React.CSSProperties = { fontWeight: 700, color: "var(--text-primary)" };

  return (
    <section
      style={{
        position: "relative",
        padding: "var(--space-2xl) 0 var(--space-xl) 0",
        borderBottom: "1px solid var(--surface-border)",
        marginBottom: "var(--space-xl)",
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.22em", color: "var(--color-y2k-blue)", marginBottom: "var(--space-md)" }}>
        THE READ
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)" }}>
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "clamp(80px, 11vw, 140px)",
            lineHeight: 0.75,
            color: "var(--color-y2k-blue)",
            letterSpacing: "-0.04em",
            flexShrink: 0,
          }}
        >
          B
        </span>
        <p
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "clamp(1.1rem, 1.7vw, 1.35rem)",
            lineHeight: 1.5,
            color: "var(--text-secondary)",
            margin: 0,
            maxWidth: "62ch",
            paddingTop: "0.6rem",
          }}
        >
          ased on shared goals in <span style={bold}>{goals}</span>, {DESTINATION} supports{" "}
          <span style={bold}>
            {topPicks.slice(0, -1).join(", ")}{topPicks.length > 1 ? ", and " : ""}{topPicks.slice(-1)}
          </span>{" "}
          most. Friction concentrates in <span style={bold}>{cautions.join(", ")}</span>.
          Target <span style={bold}>{shortenWindow(BEST_WINDOWS[0])}</span> for the strongest window;
          skip <span style={bold}>{shortenWindow(AVOID_WINDOWS[0])}</span>.
        </p>
      </div>
    </section>
  );
}

function stripAmpersand(s: string): string {
  // "Romance & Love" → "Romance"; "Career & Public Recognition" → "Career"
  return s.split(" &")[0];
}
function shortenWindow(s: string): string {
  // "Apr 12–28 2026 — Venus over …" → "Apr 12–28"
  const dash = s.indexOf(" — ");
  return dash > 0 ? s.slice(0, dash) : s;
}

// ═══════════════════════════════════════════════════════════════
// §3 GOAL COMPARISON — 9 LIFE_EVENTS, side-by-side bars
// ═══════════════════════════════════════════════════════════════

function GoalComparison({ events, priority }: { events: EventScore[]; priority: Set<string> }) {
  // Top 3 only — priority events first, then highest combined score from the rest if needed.
  const topThree = events.slice(0, 3);

  return (
    <section style={{ marginBottom: "var(--space-xl)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--text-tertiary)", marginBottom: "0.4rem" }}>
            TOP 3 GOALS · COMPARED
          </div>
          <h2 style={{ fontFamily: "var(--font-secondary)", fontSize: "clamp(1.5rem, 3vw, 2rem)", margin: 0 }}>
            Goal scores at {DESTINATION}
          </h2>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {SELECTED_GOALS.map((g) => (
            <span
              key={g}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--color-y2k-blue)",
                border: "1px solid var(--color-y2k-blue)",
                borderRadius: 20,
                padding: "0.25rem 0.6rem",
              }}
            >
              {g}
            </span>
          ))}
        </div>
      </header>

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
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--text-tertiary)" }}>YOU</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--text-tertiary)" }}>{PARTNER.name.toUpperCase()}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--text-tertiary)", minWidth: "2rem", textAlign: "right" }}>Δ</span>
      </div>

      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {topThree.map((e, i) => (
          <EventRow key={e.event} ev={e} pinned={priority.has(e.event)} divider={i < topThree.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function EventRow({ ev, pinned, divider }: { ev: EventScore; pinned: boolean; divider: boolean }) {
  const youCfg     = BAND_CONFIG[getVerdict(ev.you)];
  const partnerCfg = BAND_CONFIG[getVerdict(ev.partner)];
  const delta = Math.abs(ev.you - ev.partner);
  const showDelta = delta >= 15;

  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(180px, 1.2fr) 1fr 1fr auto",
        alignItems: "center",
        gap: "var(--space-md)",
        padding: "var(--space-sm) var(--space-md)",
        borderBottom: divider ? "1px solid var(--surface-border)" : "none",
        background: pinned ? "var(--surface)" : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
        {pinned && (
          <span aria-hidden style={{ width: 4, height: 24, background: "var(--color-y2k-blue)", flexShrink: 0 }} />
        )}
        <span style={{ fontFamily: "var(--font-secondary)", fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
          {ev.event}
        </span>
      </div>
      <BarCell score={ev.you} color={youCfg.ring} />
      <BarCell score={ev.partner} color={partnerCfg.ring} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          letterSpacing: "0.15em",
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
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <div style={{ flex: 1, height: 8, background: "var(--bg)", border: "1px solid var(--surface-border)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: "100%", background: color, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 600, minWidth: "1.8rem", textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

function sortEventsByGoals(events: EventScore[], goals: GoalId[]): EventScore[] {
  const priority = goals.flatMap((g) => GOAL_TO_EVENTS[g]);
  const seen = new Set<string>();
  const head: EventScore[] = [];
  for (const name of priority) {
    if (seen.has(name)) continue;
    const found = events.find((e) => e.event === name);
    if (found) { head.push(found); seen.add(name); }
  }
  const tail = events.filter((e) => !seen.has(e.event));
  return [...head, ...tail];
}

// ═══════════════════════════════════════════════════════════════
// §4 DEEP DIVE — wheel + standout placements + stat strip
// ═══════════════════════════════════════════════════════════════

function DeepDive({ tab, onTab }: { tab: "you" | "partner" | "synastry"; onTab: (t: "you" | "partner" | "synastry") => void }) {
  const tabs: Array<{ id: "you" | "partner" | "synastry"; label: string }> = [
    { id: "you",      label: `For ${YOU.name}` },
    { id: "partner",  label: `For ${PARTNER.name}` },
    { id: "synastry", label: "Between you" },
  ];

  return (
    <section style={{ marginBottom: "var(--space-xl)", borderTop: "1px solid var(--surface-border)", paddingTop: "var(--space-xl)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--text-tertiary)", marginBottom: "0.4rem" }}>
            RELOCATED CHARTS
          </div>
          <h2 style={{ fontFamily: "var(--font-secondary)", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", margin: 0 }}>
            How {DESTINATION} makes you feel
          </h2>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {tabs.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "0.6rem 1rem",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "var(--radius-md)",
                  background: active ? "var(--text-primary)" : "transparent",
                  color: active ? "var(--bg)" : "var(--text-secondary)",
                  fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)" }}>
        <AnimatePresence mode="wait">
          {tab === "you" && (
            <motion.div key="you" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <ChartTab
                who="YOU"
                planets={YOUR_PLANETS}
                standout={YOUR_STANDOUT}
                macroScore={SCORES.you}
                element="Air-heavy"
                modality="Fixed-leaning"
              />
            </motion.div>
          )}

          {tab === "partner" && (
            <motion.div key="partner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <ChartTab
                who={PARTNER.name.toUpperCase()}
                planets={PARTNER_PLANETS}
                standout={PARTNER_STANDOUT}
                macroScore={SCORES.partner}
                element="Water-anchored"
                modality="Cardinal"
              />
            </motion.div>
          )}

          {tab === "synastry" && (
            <motion.div key="synastry" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <SynastryTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ChartTab({
  who, planets, standout, macroScore, element, modality,
}: {
  who: string;
  planets: typeof YOUR_PLANETS;
  standout: Placement[];
  macroScore: number;
  element: string;
  modality: string;
}) {
  const cfg = BAND_CONFIG[getVerdict(macroScore)];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-xl)" }} className="dd-grid">
      <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
        <NatalMockupWheel isDark planets={planets as any} cusps={CUSPS} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-sm)" }}>
          <StatCell label="MACRO" value={`${macroScore}/100`} accent={cfg.ring} />
          <StatCell label="ELEMENT" value={element} />
          <StatCell label="MODALITY" value={modality} />
        </div>

        {/* Standout placements */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--color-y2k-blue)", marginBottom: "var(--space-sm)" }}>
            STANDOUT PLACEMENTS AT {DESTINATION.toUpperCase()}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
            {standout.map((p, i) => (
              <li
                key={p.planet}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(80px, auto) 1fr",
                  gap: "var(--space-md)",
                  padding: "var(--space-sm) 0",
                  borderTop: i === 0 ? "1px solid var(--surface-border)" : "none",
                  borderBottom: "1px solid var(--surface-border)",
                  alignItems: "baseline",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-secondary)", fontSize: "1.05rem", color: "var(--text-primary)" }}>
                    {p.planet}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-tertiary)" }}>
                    {p.sign} · {p.degree}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", color: "var(--color-y2k-blue)", marginBottom: "0.2rem" }}>
                    {p.house.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                    {p.note}
                  </div>
                </div>
              </li>
            ))}
          </ul>
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

function StatCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ padding: "var(--space-sm) var(--space-md)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--text-tertiary)", marginBottom: "0.3rem" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", color: accent ?? "var(--text-primary)", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function SynastryTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, maxWidth: "62ch", lineHeight: 1.55 }}>
        Three harmonious cross-aspects keep the baseline warm. Two tense ones —
        productive friction if you fight on the right thing (logistics, not taste).
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-md)" }} className="aspect-grid">
        <AspectColumn title="Harmonious" color="var(--color-acqua)"       items={SYNASTRY_HARMONIOUS} />
        <AspectColumn title="Tense"      color="var(--color-spiced-life)" items={SYNASTRY_TENSE} />
      </div>
      <style jsx>{`
        @media (min-width: 880px) {
          .aspect-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function AspectColumn({ title, color, items }: { title: string; color: string; items: Aspect[] }) {
  return (
    <div style={{ border: `1px solid ${color}`, borderRadius: "var(--radius-md)", padding: "var(--space-md)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color, fontWeight: 700, marginBottom: "var(--space-sm)" }}>
        {title.toUpperCase()}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
        {items.map((a, i) => (
          <li
            key={i}
            style={{
              padding: "var(--space-sm) 0",
              borderTop: i === 0 ? "1px solid var(--surface-border)" : "none",
              borderBottom: "1px solid var(--surface-border)",
              display: "flex",
              flexDirection: "column",
              gap: "0.3rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-md)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 600 }}>
                {a.p1} {a.aspect} {PARTNER.name}'s {a.p2}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color, whiteSpace: "nowrap" }}>
                orb {a.orb.toFixed(1)}°
              </span>
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              {a.meaning}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §5 GEODETIC SUMMARY — "Who you are in this place"
// Two simple stat cards, ASC + MC + one-line note per partner.
// ═══════════════════════════════════════════════════════════════

const GEODETIC = {
  you:     { ascSign: "Cancer", ascDeg: 14, mcSign: "Aries",       mcDeg: 2,
             note: "This city puts your private life on the table — IC pressure on a Cancer rising." },
  partner: { ascSign: "Pisces", ascDeg: 8,  mcSign: "Sagittarius", mcDeg: 26,
             note: "Lisbon dissolves the career angle into vision territory — Jupiter-coloured MC." },
  summary: "Both ASCs land in water — the felt language of the place is shared. The MCs sit roughly 90° apart, so your public ambitions point in different directions here.",
};

function GeodeticSummary() {
  return (
    <section style={{ marginBottom: "var(--space-xl)", borderTop: "1px solid var(--surface-border)", paddingTop: "var(--space-xl)" }}>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--text-tertiary)", marginBottom: "0.4rem" }}>
          GEODETIC · WHERE THE LAND MEETS YOUR CHART
        </div>
        <h2 style={{ fontFamily: "var(--font-secondary)", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", margin: 0 }}>
          Who you are in {DESTINATION}
        </h2>
      </div>

      <p
        style={{
          fontFamily: "var(--font-secondary)",
          fontSize: "clamp(1rem, 1.5vw, 1.15rem)",
          lineHeight: 1.5,
          color: "var(--text-secondary)",
          margin: "0 0 var(--space-lg) 0",
          maxWidth: "62ch",
        }}
      >
        {GEODETIC.summary}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-md)" }} className="geo-grid">
        <GeoCard
          who={YOU.name.toUpperCase()}
          ascSign={GEODETIC.you.ascSign}    ascDeg={GEODETIC.you.ascDeg}
          mcSign={GEODETIC.you.mcSign}      mcDeg={GEODETIC.you.mcDeg}
          note={GEODETIC.you.note}
        />
        <GeoCard
          who={PARTNER.name.toUpperCase()}
          ascSign={GEODETIC.partner.ascSign} ascDeg={GEODETIC.partner.ascDeg}
          mcSign={GEODETIC.partner.mcSign}   mcDeg={GEODETIC.partner.mcDeg}
          note={GEODETIC.partner.note}
        />
      </div>
      <style jsx>{`
        @media (min-width: 720px) {
          .geo-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function GeoCard({ who, ascSign, ascDeg, mcSign, mcDeg, note }: {
  who: string; ascSign: string; ascDeg: number; mcSign: string; mcDeg: number; note: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>
        {who}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <GeoLine label="GEO ASC" sign={ascSign} deg={ascDeg} />
        <GeoLine label="GEO MC"  sign={mcSign}  deg={mcDeg}  />
      </div>
      <p style={{ margin: 0, fontFamily: "var(--font-secondary)", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
        {note}
      </p>
    </div>
  );
}

function GeoLine({ label, sign, deg }: { label: string; sign: string; deg: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid var(--surface-border)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.2rem", color: "var(--text-primary)" }}>
        {sign} {deg}°
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §3 VERDICT (Timings) — TimingTab pattern + Best/Avoid windows
// ═══════════════════════════════════════════════════════════════

function VerdictBlock() {
  const v = verdictForCoherence(SCORES.coherence);
  const accent =
    v.tone === "good"  ? "var(--sage)" :
    v.tone === "mixed" ? "var(--gold)" :
                         "var(--color-spiced-life)";
  const topGoal = SELECTED_GOALS[0];
  const goalLabel = topGoal ? GOAL_LABEL[topGoal] : null;

  return (
    <section style={{ borderTop: "1px solid var(--surface-border)", paddingTop: "var(--space-xl)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "var(--space-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: 700,
          }}
        >
          {v.label} · {SCORES.coherence}/100
        </div>
        <p
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "clamp(1.15rem, 1.9vw, 1.4rem)",
            lineHeight: 1.3,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.01em",
            maxWidth: "62ch",
          }}
        >
          {goalLabel
            ? <>For your <span style={{ color: accent, fontWeight: 600 }}>{goalLabel}</span> goals, {v.rationale}.</>
            : <>{v.rationale.charAt(0).toUpperCase() + v.rationale.slice(1)}.</>}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-lg)" }} className="windows-grid">
        <WindowList title="BEST WINDOWS" color="var(--color-planet-jupiter)" items={BEST_WINDOWS} />
        <WindowList title="AVOID"        color="var(--color-spiced-life)"     items={AVOID_WINDOWS} />
      </div>
      <style jsx>{`
        @media (min-width: 720px) {
          .windows-grid { grid-template-columns: 2fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function WindowList({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--text-tertiary)", marginBottom: "var(--space-sm)" }}>
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {items.map((w, i) => (
          <li key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <span style={{ color, marginTop: "0.15rem" }}>●</span>
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
