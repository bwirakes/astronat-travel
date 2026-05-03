"use client";

/**
 * /mockup/couples — Couples Reading mockup, magazine spread.
 *
 * Editorial moves drawn from the Monocle-foundation pass + actual print grammar:
 *   - chapter-opener section marks (large §-numeral, tracked title, hairline)
 *   - typographic stat ledger (no card chrome — hairlines only)
 *   - generous vertical rhythm between sections, tight rhythm within
 *   - numbered TOC for Deep Dive tabs
 *   - colophon strip at the top
 *   - couples-flavored Academy footer
 *   - verdict.ts as the single label dictionary
 */

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";
import {
  verdictBand,
  verdictTone,
  type VerdictBand,
  HERO_LABELS,
  EVENT_LABELS,
  WINDOW_LABELS,
  WINDOW_RATIONALES,
} from "@/app/lib/verdict";

// ═══════════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════════

const YOU = { name: "Jo" };
const PARTNER = { name: "Sam" };

const DESTINATION = "Lisbon";
const DATE_RANGE = "AUG 27 — SEP 6, 2026";
const ISSUE = "NO. 03 · COUPLES EDITION · MAY 2026";

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

const GEODETIC = {
  you:     { ascSign: "Cancer", ascDeg: 14, mcSign: "Aries",       mcDeg: 2,
             note: "This city puts your private life on the table — IC pressure on a Cancer rising." },
  partner: { ascSign: "Pisces", ascDeg: 8,  mcSign: "Sagittarius", mcDeg: 26,
             note: "Lisbon dissolves the career angle into vision territory — Jupiter-coloured MC." },
  summary: "Both ASCs land in water — the felt language of the place is shared. The MCs sit roughly 90° apart, so your public ambitions point in different directions here.",
};

// ═══════════════════════════════════════════════════════════════
// VERDICT helpers — band → color, drawing from verdict.ts vocabulary
// ═══════════════════════════════════════════════════════════════

const BAND_FILL: Record<VerdictBand, string> = {
  peak:  "var(--sage)",
  solid: "var(--color-y2k-blue)",
  mixed: "var(--color-acqua)",
  tight: "var(--gold)",
  hard:  "var(--color-spiced-life)",
};

const TONE_ACCENT: Record<ReturnType<typeof verdictTone>, string> = {
  lift:    "var(--sage)",
  neutral: "var(--gold)",
  press:   "var(--color-spiced-life)",
};

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

const SECTION_GAP = "clamp(56px, 8vw, 104px)";
const PAGE_MAX = 1080;

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
      <Colophon />
      <div style={{ maxWidth: PAGE_MAX, margin: "0 auto", padding: "0 clamp(20px, 4vw, 48px) clamp(80px, 8vw, 120px)" }}>
        <Hero />
        <StatLedger />

        <Section index="01" title="The Read" gap={SECTION_GAP}>
          <MagazineIntro events={sortedEvents} priority={priorityEventNames} />
        </Section>

        <Section index="02" title="Goal Scores" gap={SECTION_GAP}>
          <GoalComparison events={sortedEvents} priority={priorityEventNames} />
        </Section>

        <Section index="03" title="Timings" gap={SECTION_GAP}>
          <VerdictBlock />
        </Section>

        <Section index="04" title={`How ${DESTINATION} Feels`} gap={SECTION_GAP}>
          <DeepDive tab={tab} onTab={setTab} />
        </Section>

        <Section index="05" title={`Who You Are in ${DESTINATION}`} gap={SECTION_GAP}>
          <GeodeticSummary />
        </Section>

        <CouplesAcademy />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════

/** Chapter-opener section mark — large §-numeral, tracked title, hairline.
 *  This is the editorial weight that PR #35's inline SectionHead can't carry
 *  at the top-of-section level. The big numeral signals a real department
 *  break, not a subsection. */
function Section({
  index, title, gap, children,
}: { index: string; title: string; gap: string; children: ReactNode }) {
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

// ═══════════════════════════════════════════════════════════════
// COLOPHON — top strip + issue line
// ═══════════════════════════════════════════════════════════════

function Colophon() {
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
      <button
        type="button"
        style={{
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
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
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        ASTRONAT · {ISSUE}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO — destination + verdict + macro-texture watermark
// ═══════════════════════════════════════════════════════════════

function Hero() {
  const cohBand = verdictBand(SCORES.coherence);
  const cohColor = TONE_ACCENT[verdictTone(cohBand)];
  const cohLabel = HERO_LABELS[cohBand];

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
          {DATE_RANGE} · WITH {PARTNER.name.toUpperCase()}
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
          {DESTINATION}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem", position: "relative", zIndex: 1 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--text-tertiary)" }}>
          COHERENCE
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", fontFamily: "var(--font-primary)" }}>
          <span style={{ fontSize: "clamp(56px, 8vw, 96px)", lineHeight: 1, color: cohColor, letterSpacing: "-0.02em" }}>
            {SCORES.coherence}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-tertiary)" }}>/100</span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: cohColor,
            fontWeight: 600,
          }}
        >
          {cohLabel}
        </span>
      </div>
    </section>
  );
}

/** Two overlapping circles + inner Venus rings at low opacity. Macro-texture
 *  behind the hero — never competes with the type. */
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
// STAT LEDGER — typographic stat row, no boxes
// ═══════════════════════════════════════════════════════════════

function StatLedger() {
  const youBand = verdictBand(SCORES.you);
  const partnerBand = verdictBand(SCORES.partner);
  const youAccent = TONE_ACCENT[verdictTone(youBand)];
  const partnerAccent = TONE_ACCENT[verdictTone(partnerBand)];

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
      <LedgerColumn name="YOU"   score={SCORES.you}     label={HERO_LABELS[youBand]}     accent={youAccent} />
      <Divider />
      <LedgerColumn name="Δ MACRO" score={SCORES.delta} label="POINTS APART"             accent="var(--text-tertiary)" suffix="pts" />
      <Divider />
      <LedgerColumn name={PARTNER.name.toUpperCase()} score={SCORES.partner} label={HERO_LABELS[partnerBand]} accent={partnerAccent} align="right" />
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

function Divider() {
  return <span aria-hidden style={{ background: "var(--surface-border)", width: 1, alignSelf: "stretch" }} />;
}

// ═══════════════════════════════════════════════════════════════
// §01 — THE READ (drop-cap intro)
// ═══════════════════════════════════════════════════════════════

function MagazineIntro({ events, priority }: { events: EventScore[]; priority: Set<string> }) {
  const priorityEvents = events.filter((e) => priority.has(e.event));
  const ranked = [...priorityEvents].sort((a, b) => (b.you + b.partner) - (a.you + a.partner));
  const topPicks = ranked.slice(0, 3).map((e) => stripAmpersand(e.event));
  const cautions = ranked.slice(-1).map((e) => stripAmpersand(e.event));
  const goals = SELECTED_GOALS.join(" and ");
  const bold: React.CSSProperties = { fontWeight: 700, color: "var(--text-primary)" };

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
        B
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
        ased on shared goals in <span style={bold}>{goals}</span>, {DESTINATION} supports{" "}
        <span style={bold}>
          {topPicks.slice(0, -1).join(", ")}{topPicks.length > 1 ? ", and " : ""}{topPicks.slice(-1)}
        </span>{" "}
        most. Friction concentrates in <span style={bold}>{cautions.join(", ")}</span>.
        Target <span style={bold}>{shortenWindow(BEST_WINDOWS[0])}</span> for the strongest window;
        skip <span style={bold}>{shortenWindow(AVOID_WINDOWS[0])}</span>.
      </p>
    </div>
  );
}

function stripAmpersand(s: string): string {
  return s.split(" &")[0];
}
function shortenWindow(s: string): string {
  const dash = s.indexOf(" — ");
  return dash > 0 ? s.slice(0, dash) : s;
}

// ═══════════════════════════════════════════════════════════════
// §02 — GOAL COMPARISON (top-3 LIFE_EVENTS, side-by-side bars)
// ═══════════════════════════════════════════════════════════════

function GoalComparison({ events, priority }: { events: EventScore[]; priority: Set<string> }) {
  const topThree = events.slice(0, 3);

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
        Top three goals from your selection — <strong style={{ color: "var(--text-primary)" }}>{SELECTED_GOALS.join(" and ")}</strong>.
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
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)" }}>{PARTNER.name.toUpperCase()}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)", minWidth: "2rem", textAlign: "right" }}>Δ</span>
      </div>

      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {topThree.map((e, i) => (
          <EventRow key={e.event} ev={e} pinned={priority.has(e.event)} divider={i < topThree.length - 1} />
        ))}
      </ol>
    </>
  );
}

function EventRow({ ev, pinned, divider }: { ev: EventScore; pinned: boolean; divider: boolean }) {
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
// §03 — TIMINGS (verdict + Best/Avoid windows)
// ═══════════════════════════════════════════════════════════════

function VerdictBlock() {
  const band = verdictBand(SCORES.coherence);
  const accent = TONE_ACCENT[verdictTone(band)];
  const label = WINDOW_LABELS[band];
  const rationale = WINDOW_RATIONALES[band];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", margin: "0 0 clamp(36px, 5vw, 56px)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: 700,
          }}
        >
          {label} · {SCORES.coherence}/100
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
          {rationale.charAt(0).toUpperCase() + rationale.slice(1)}.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(28px, 4vw, 48px)" }} className="windows-grid">
        <WindowList title="BEST WINDOWS" color="var(--color-planet-jupiter)" items={BEST_WINDOWS} />
        <WindowList title="AVOID"        color="var(--color-spiced-life)"     items={AVOID_WINDOWS} />
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
// §04 — DEEP DIVE ("How Lisbon makes you feel")
// ═══════════════════════════════════════════════════════════════

function DeepDive({ tab, onTab }: { tab: "you" | "partner" | "synastry"; onTab: (t: "you" | "partner" | "synastry") => void }) {
  const tabs: Array<{ id: "you" | "partner" | "synastry"; label: string }> = [
    { id: "you",      label: `For ${YOU.name}` },
    { id: "partner",  label: `For ${PARTNER.name}` },
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

      {/* Numbered TOC tabs — magazine index, not buttons */}
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
                fontFamily: active ? "var(--font-primary)" : "var(--font-mono)",
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
            <ChartTab planets={YOUR_PLANETS} standout={YOUR_STANDOUT} macroScore={SCORES.you} element="Air-heavy" modality="Fixed-leaning" />
          </motion.div>
        )}
        {tab === "partner" && (
          <motion.div key="partner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <ChartTab planets={PARTNER_PLANETS} standout={PARTNER_STANDOUT} macroScore={SCORES.partner} element="Water-anchored" modality="Cardinal" />
          </motion.div>
        )}
        {tab === "synastry" && (
          <motion.div key="synastry" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <SynastryTab />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChartTab({
  planets, standout, macroScore, element, modality,
}: {
  planets: typeof YOUR_PLANETS;
  standout: Placement[];
  macroScore: number;
  element: string;
  modality: string;
}) {
  const band = verdictBand(macroScore);
  const accent = TONE_ACCENT[verdictTone(band)];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(32px, 4vw, 56px)" }} className="dd-grid">
      <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
        <NatalMockupWheel isDark planets={planets as any} cusps={CUSPS} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 3vw, 36px)" }}>
        {/* Stat row — flat, no boxes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            gap: "clamp(12px, 2vw, 24px)",
            paddingBottom: "clamp(16px, 2vw, 24px)",
            borderBottom: "1px solid var(--surface-border)",
          }}
        >
          <FlatStat label="MACRO"    value={`${macroScore}/100`} accent={accent} />
          <Divider />
          <FlatStat label="ELEMENT"  value={element} />
          <Divider />
          <FlatStat label="MODALITY" value={modality} />
        </div>

        {/* Standout placements */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--text-tertiary)", marginBottom: "var(--space-md)", paddingBottom: "0.5rem", borderBottom: "1px solid var(--surface-border)" }}>
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
                  padding: "var(--space-md) 0",
                  borderBottom: i < standout.length - 1 ? "1px solid var(--surface-border)" : "none",
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

function SynastryTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 3.5vw, 40px)" }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, maxWidth: "62ch", lineHeight: 1.6 }}>
        Three harmonious cross-aspects keep the baseline warm. Two tense ones —
        productive friction if you fight on the right thing (logistics, not taste).
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(28px, 4vw, 48px)" }} className="aspect-grid">
        <AspectColumn title="Harmonious" tone="lift"  items={SYNASTRY_HARMONIOUS} />
        <AspectColumn title="Tense"      tone="press" items={SYNASTRY_TENSE} />
      </div>
      <style jsx>{`
        @media (min-width: 880px) {
          .aspect-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function AspectColumn({ title, tone, items }: { title: string; tone: "lift" | "press"; items: Aspect[] }) {
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
                {a.p1} {a.aspect} {PARTNER.name}&apos;s {a.p2}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// §05 — GEODETIC ("Who you are in this place")
// ═══════════════════════════════════════════════════════════════

function GeodeticSummary() {
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
        {GEODETIC.summary}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }} className="geo-grid">
        <GeoRow
          who={YOU.name.toUpperCase()}
          ascSign={GEODETIC.you.ascSign} ascDeg={GEODETIC.you.ascDeg}
          mcSign={GEODETIC.you.mcSign}   mcDeg={GEODETIC.you.mcDeg}
          note={GEODETIC.you.note}
          first
        />
        <GeoRow
          who={PARTNER.name.toUpperCase()}
          ascSign={GEODETIC.partner.ascSign} ascDeg={GEODETIC.partner.ascDeg}
          mcSign={GEODETIC.partner.mcSign}   mcDeg={GEODETIC.partner.mcDeg}
          note={GEODETIC.partner.note}
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
// COUPLES ACADEMY — couples-flavored Learn footer
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
