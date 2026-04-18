"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavbar from "@/app/components/AppNavbar";
import { BackButton } from "@/components/app/back-button";
import { ScoreRing, getVerdict } from "@/app/components/ScoreRing";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK "teacher" reading — shape proposed in the action plan.
// This payload is what /api/readings/generate should return (details.teacherReading)
// once the prompt/schema rewrite lands.
// ─────────────────────────────────────────────────────────────────────────────
const MOCK = {
  destination: "Tokyo, Japan",
  travelDate: "2026-05-12",
  macroScore: 87,
  macroVerdict: "highlyProductive" as const,

  summary: {
    headline:
      "Tokyo is asking you to show up. The week rewards work, introductions, and the kind of conversations that change a year.",
    howItWasScored:
      "Two things are lifting this week. Your Sun sits right on Tokyo's career axis — the sort of alignment that amplifies anything you do in public here, so if there's a pitch, a shoot, a first meeting, this is the city and the week for it. Mercury is also moving through the part of your chart that rules partnerships while you're there, which is why meetings and introductions land cleaner than they would at home. There's one softer note: Saturn brushes your Moon mid-trip. Plan one quiet night in the middle of the visit and the rest of the week opens right up.",
    bestWindows: ["May 10 – May 15", "May 22 – May 24"],
    datesToAvoid: ["May 18 – May 19"],
    bestHouses: [
      { house: 10, label: "Career & Status" },
      { house: 7, label: "Partnerships" },
    ],
  },

  signals: {
    transits: [
      {
        title: "Mars trine your natal Sun",
        why: "Your physical energy is unusually high for five days. Use it — long walks, early mornings, hard conversations.",
        driver: "Transiting Mars 18° Leo △ Natal Sun 20° Sagittarius, orb 2.1°",
        datesRange: "May 10 – May 15",
        impact: "supportive" as const,
      },
      {
        title: "Mercury conjunct 7th house ruler",
        why: "Conversations land clean. Meetings, pitches, and introductions are at peak clarity.",
        driver: "Transiting Mercury ☌ relocated 7H ruler (Venus) at 8° Gemini",
        datesRange: "May 12 – May 14",
        impact: "supportive" as const,
      },
      {
        title: "Saturn square natal Moon",
        why: "One heavy emotional day. Keep the schedule light, skip the late dinner.",
        driver: "Transiting Saturn 28° Pisces □ Natal Moon 27° Scorpio, orb 0.8°",
        datesRange: "May 18 – May 19",
        impact: "challenging" as const,
      },
    ],
    events: [
      {
        title: "Career peak",
        driver: "Sun/MC line · 12km",
        body: "This is the single strongest signal in the reading. Your public-facing identity is amplified here — if you're pitching, filming, or presenting, schedule it in this window.",
        impact: "supportive" as const,
      },
      {
        title: "Relationship spotlight",
        driver: "H7 score 91 · ruler in mutual reception",
        body: "Partnerships light up. Good week for a first meeting with a collaborator or to deepen an existing bond — the chart amplifies reciprocity, not control.",
        impact: "supportive" as const,
      },
      {
        title: "Emotional drag",
        driver: "Saturn □ Moon · exact May 19",
        body: "A single friction point. Not a red flag for the trip — just the one day to not over-book.",
        impact: "challenging" as const,
      },
    ],
    natal: [
      {
        placement: "Sun 20° Sagittarius (H10 relocated)",
        role: "Why the score is high",
        body: "Your natal Sun snaps to the 10th house when relocated to Tokyo. Your identity and the city's career axis are aligned — this is the dominant signal.",
      },
      {
        placement: "Venus 18° Cancer (H7 relocated)",
        role: "Why partnerships activate",
        body: "Venus rules your relocated 7th. Tokyo puts your relational planet in the house of others — people seek you out here more than at home.",
      },
      {
        placement: "Moon 27° Scorpio (H11 relocated)",
        role: "Where the friction lands",
        body: "The Moon in a fixed water sign is the tender spot Saturn hits mid-trip. Knowing which placement is under pressure is how you plan around it.",
      },
    ],
  },

  report: {
    permanentMap: {
      title: "Tokyo's permanent map",
      content:
        "Tokyo sits on a stack of planetary lines that favor performance and public presence. The Sun/MC line runs 12km west of Shibuya, which means anyone visiting this city is stepping into a career-amplifying zone by geography alone. For you specifically, your natal Sun is conjunct that line — a rare alignment that doesn't happen in most cities you'll ever visit.",
    },
    personalTiming: {
      title: "Your window",
      content:
        "Your travel dates sit inside two supportive transits (Mars-Sun, Mercury-Venus) and one challenging one (Saturn-Moon). The supportive signals outnumber the drag 2:1 and last longer in orb, which is why the score reads 87. The Saturn square is precise but short — a two-day window in the middle of the trip.",
    },
    collectiveClimate: {
      title: "The wider climate",
      content:
        "Jupiter continues its transit through Gemini, which flavors the late-spring mood globally: curiosity, media, short trips. That climate compounds with Tokyo's specific alignments — a city that rewards attention to detail and conversation.",
    },
    relocatedChart: {
      title: "Your chart at this latitude",
      content:
        "When you relocate to Tokyo, your ASC shifts from Virgo (home chart) to Aries. Your 7th house cusp moves to Libra, putting Venus as its ruler — Venus is exalted in your natal chart, which is why partnerships score so high in this city.",
    },
    countryChart: {
      title: "Japan's chart",
      content:
        "Japan's 1952 sovereignty chart has its Sun at 8° Taurus, which sits square your natal Mercury. This often shows up as productive friction — you'll be forced to slow down and pay attention to detail, which can either frustrate or sharpen you depending on how you receive it.",
    },
    verdict: {
      title: "The call",
      content:
        "Book the trip. Front-load meetings and presentations into May 10–15. Keep May 18–19 open on your calendar — not blocked, just light. This is a strong reading, not a perfect one, and the single friction point is short enough to plan around.",
    },
  },
};

type Stage = "summary" | "signals" | "report";
type SignalTab = "transits" | "events" | "natal";

const IMPACT_STYLE = {
  supportive: { color: "var(--color-acqua)", label: "SUPPORTIVE" },
  challenging: { color: "var(--color-spiced-life)", label: "FRICTION" },
  neutral: { color: "var(--text-tertiary)", label: "NEUTRAL" },
} as const;

export default function MockupReadingsV1() {
  const [activeStage, setActiveStage] = useState<Stage>("summary");
  const [signalTab, setSignalTab] = useState<SignalTab>("transits");
  const [reportOpen, setReportOpen] = useState(false);

  const stageRefs = {
    summary: useRef<HTMLDivElement>(null),
    signals: useRef<HTMLDivElement>(null),
    report: useRef<HTMLDivElement>(null),
  };

  // Sticky rail — track which stage is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveStage(visible.target.getAttribute("data-stage") as Stage);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    Object.values(stageRefs).forEach((r) => r.current && observer.observe(r.current));
    return () => observer.disconnect();
  }, []);

  const jumpTo = (stage: Stage) => {
    stageRefs[stage].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const destinationShort = MOCK.destination.split(",")[0];

  return (
    <div className="min-h-screen w-full max-w-full bg-[var(--bg)] text-[var(--text-primary)] relative font-body overflow-x-hidden box-border">
      <AppNavbar />

      {/* Sticky stage rail */}
      <div
        className="sticky top-[60px] z-40 backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <div
          className="mx-auto px-6 md:px-10 lg:px-16 py-4 flex items-center justify-between gap-6 overflow-x-auto"
          style={{ maxWidth: "1240px" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] whitespace-nowrap">
            {destinationShort} · {MOCK.travelDate}
          </div>
          <div className="flex gap-1 md:gap-2">
            {(
              [
                { id: "summary" as Stage, label: "The read" },
                { id: "signals" as Stage, label: "The sky" },
                { id: "report" as Stage, label: "Long version" },
              ]
            ).map((s, i) => (
              <button
                key={s.id}
                onClick={() => jumpTo(s.id)}
                className={`font-mono text-[10px] uppercase tracking-[0.18em] px-3 md:px-4 py-1.5 rounded-full border transition-colors ${
                  activeStage === s.id
                    ? "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] border-[var(--surface-border)] hover:border-[var(--text-primary)]"
                }`}
              >
                {String(i + 1).padStart(2, "0")} · {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="relative mx-auto px-6 md:px-10 lg:px-16 pt-4 md:pt-6 pb-10 md:pb-16"
        style={{ maxWidth: "1240px" }}
      >
        <div className="mb-4 md:mb-6">
          <BackButton href="/readings" label="All readings" />
        </div>

        {/* ───────────────────────────── STAGE 1 — SUMMARY ─────────────────── */}
        <motion.section
          ref={stageRefs.summary}
          data-stage="summary"
          id="summary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5 }}
          className="scroll-mt-32"
          style={{ paddingBottom: "clamp(56px, 8vw, 112px)" }}
        >
          {/* Hero: title left, ring right — compact */}
          <header
            className="grid items-end gap-6 md:gap-12"
            style={{
              gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
            }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-medium">
                § 01 — A read for {destinationShort} · {MOCK.travelDate}
              </div>
              <h1
                className="font-primary uppercase mt-3"
                style={{
                  fontSize: "clamp(44px, 6.5vw, 88px)",
                  lineHeight: "0.9",
                  letterSpacing: "-0.025em",
                }}
              >
                {destinationShort}
              </h1>
              <p
                className="font-secondary text-[var(--text-primary)] mt-4 max-w-[640px]"
                style={{
                  fontSize: "clamp(18px, 1.9vw, 24px)",
                  lineHeight: "1.3",
                  letterSpacing: "-0.005em",
                  textWrap: "pretty" as any,
                }}
              >
                {MOCK.summary.headline}
              </p>
            </div>
            <div className="flex md:justify-end">
              <ScoreRing score={MOCK.macroScore} verdict={getVerdict(MOCK.macroScore)} />
            </div>
          </header>

          {/* Highlights — borderless magazine grid, right below hero */}
          <div
            className="mt-8 md:mt-10 pt-6 md:pt-8 border-t"
            style={{ borderColor: "var(--surface-border)" }}
          >
            <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-medium">
                The highlights
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                May 10 — May 24, 2026
              </div>
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1px",
                background: "var(--surface-border)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <SummaryCard
                heading="Lean in"
                accent="var(--color-planet-jupiter)"
                items={MOCK.summary.bestWindows}
              />
              <SummaryCard
                heading="Go easy"
                accent="var(--color-planet-saturn)"
                items={MOCK.summary.datesToAvoid}
              />
              <SummaryCard
                heading="Where you'll feel it"
                accent="var(--color-y2k-blue)"
                items={MOCK.summary.bestHouses.map(
                  (h) => `${h.label}`,
                )}
              />
            </div>
          </div>

          {/* The read — human interpretation, below the highlights */}
          <div
            className="mt-10 md:mt-14 grid gap-8 md:gap-16"
            style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)" }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-medium">
                The read
              </div>
              <div
                className="font-primary mt-3 text-[var(--text-secondary)]"
                style={{
                  fontSize: "clamp(22px, 2.2vw, 28px)",
                  lineHeight: "1.15",
                  letterSpacing: "-0.01em",
                }}
              >
                In plain English.
              </div>
            </div>
            <p
              className="text-[16px] md:text-[17px] text-[var(--text-secondary)]"
              style={{
                lineHeight: "1.7",
                textWrap: "pretty" as any,
                maxWidth: "680px",
              }}
            >
              {MOCK.summary.howItWasScored}
            </p>
          </div>

          <div className="flex justify-center mt-14 md:mt-20">
            <button
              onClick={() => jumpTo("signals")}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex flex-col items-center gap-3"
            >
              <span>See what&apos;s happening in the sky</span>
              <span className="text-base opacity-70">↓</span>
            </button>
          </div>
        </motion.section>

        {/* ───────────────────────────── STAGE 2 — SIGNALS ─────────────────── */}
        <motion.section
          ref={stageRefs.signals}
          data-stage="signals"
          id="signals"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5 }}
          className="scroll-mt-32 border-t"
          style={{
            borderColor: "var(--surface-border)",
            paddingTop: "clamp(64px, 10vw, 128px)",
            paddingBottom: "clamp(64px, 10vw, 128px)",
          }}
        >
          {/* Section head — split grid 1.2fr/1fr */}
          <header
            className="grid gap-10 md:gap-16 mb-12 md:mb-16 items-end"
            style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)" }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-medium">
                § 02 — What&apos;s happening
              </div>
              <h2
                className="font-primary mt-4"
                style={{
                  fontSize: "clamp(32px, 4.2vw, 56px)",
                  lineHeight: "1.02",
                  letterSpacing: "-0.015em",
                }}
              >
                The sky, while you&apos;re there.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.65] text-[var(--text-secondary)] max-w-[440px]">
              Three layers, in plain English. Each note has a collapsible line of chart-talk for anyone who wants the mechanics.
            </p>
          </header>

          {/* Tab nav */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {(
              [
                { id: "transits" as SignalTab, label: "The weather", n: "01" },
                { id: "events" as SignalTab, label: "The moments", n: "02" },
                { id: "natal" as SignalTab, label: "Your chart", n: "03" },
              ]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setSignalTab(t.id)}
                className={`font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-4 md:px-6 py-4 border transition-all duration-200 flex items-center justify-between gap-3 ${
                  signalTab === t.id
                    ? "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)] font-bold"
                    : "bg-transparent text-[var(--text-secondary)] border-[var(--surface-border)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                }`}
                style={{ borderRadius: "2px" }}
              >
                <span className="opacity-50">{t.n}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            className="bg-[var(--surface)] border p-6 md:p-10 lg:p-14"
            style={{
              borderColor: "var(--surface-border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <AnimatePresence mode="wait">
              {signalTab === "transits" && (
                <motion.div
                  key="transits"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col"
                >
                  {MOCK.signals.transits.map((t, i) => (
                    <SignalItem
                      key={i}
                      index={i}
                      title={t.title}
                      impact={t.impact}
                      meta={t.datesRange}
                      body={t.why}
                      driver={t.driver}
                    />
                  ))}
                </motion.div>
              )}

              {signalTab === "events" && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col"
                >
                  {MOCK.signals.events.map((e, i) => (
                    <SignalItem
                      key={i}
                      index={i}
                      title={e.title}
                      impact={e.impact}
                      meta={e.driver}
                      body={e.body}
                    />
                  ))}
                </motion.div>
              )}

              {signalTab === "natal" && (
                <motion.div
                  key="natal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    className="grid gap-10 md:gap-16 items-center mb-10 md:mb-14 pb-10 md:pb-14 border-b"
                    style={{
                      gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                      borderColor: "var(--surface-border)",
                    }}
                  >
                    <div className="max-w-[420px] w-full mx-auto">
                      <NatalMockupWheel
                        isDark={true}
                        planets={[]}
                        cusps={[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        The parts of you lighting up
                      </div>
                      <p className="text-[17px] leading-[1.55] text-[var(--text-secondary)] max-w-[440px]">
                        Only three spots in your chart are really doing the talking this week. Here&apos;s who they are and why they&apos;re loud right now.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {MOCK.signals.natal.map((n, i) => (
                      <SignalItem
                        key={i}
                        index={i}
                        title={n.placement}
                        impact="neutral"
                        meta={n.role}
                        body={n.body}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-center mt-16 md:mt-24">
            <button
              onClick={() => {
                setReportOpen(true);
                setTimeout(() => jumpTo("report"), 150);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex flex-col items-center gap-3"
            >
              <span>Read the long version</span>
              <span className="text-base opacity-70">↓</span>
            </button>
          </div>
        </motion.section>

        {/* ───────────────────────────── STAGE 3 — REPORT ──────────────────── */}
        <motion.section
          ref={stageRefs.report}
          data-stage="report"
          id="report"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5 }}
          className="scroll-mt-32 border-t"
          style={{
            borderColor: "var(--surface-border)",
            paddingTop: "clamp(64px, 10vw, 128px)",
            paddingBottom: "clamp(80px, 12vw, 160px)",
          }}
        >
          <header
            className="grid gap-10 md:gap-16 mb-12 items-end"
            style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)" }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-medium">
                § 03 — The long read
              </div>
              <h2
                className="font-primary mt-4"
                style={{
                  fontSize: "clamp(32px, 4.2vw, 56px)",
                  lineHeight: "1.02",
                  letterSpacing: "-0.015em",
                }}
              >
                For the plane ride in.
              </h2>
            </div>
            <div className="flex md:justify-end">
              <button
                onClick={() => setReportOpen((v) => !v)}
                className="font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-80 transition-opacity"
              >
                {reportOpen ? "Close" : "Read the whole thing"}
              </button>
            </div>
          </header>

          <AnimatePresence initial={false}>
            {reportOpen && (
              <motion.div
                key="report-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col">
                  <ReportBlock index="01" {...MOCK.report.permanentMap} />
                  <ReportBlock index="02" {...MOCK.report.personalTiming} />
                  <ReportBlock index="03" {...MOCK.report.collectiveClimate} />
                  <ReportBlock index="04" {...MOCK.report.relocatedChart} />
                  <ReportBlock index="05" {...MOCK.report.countryChart} />

                  <div
                    className="bg-[var(--surface)] border p-8 md:p-14 mt-10 md:mt-16"
                    style={{
                      borderColor: "var(--color-y2k-blue)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-bold mb-4">
                      § 06 — Verdict
                    </div>
                    <h3
                      className="font-primary mb-6"
                      style={{
                        fontSize: "clamp(28px, 3.6vw, 44px)",
                        lineHeight: "1.05",
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {MOCK.report.verdict.title}
                    </h3>
                    <p className="text-[18px] md:text-[20px] leading-[1.55] text-[var(--text-secondary)] max-w-[720px]">
                      {MOCK.report.verdict.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small building blocks
// ─────────────────────────────────────────────────────────────────────────────
function SummaryCard({
  heading,
  accent,
  items,
}: {
  heading: string;
  accent: string;
  items: string[];
}) {
  return (
    <div
      className="p-6 md:p-8 flex flex-col gap-4"
      style={{
        background: "var(--bg)",
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold"
        style={{ color: accent }}
      >
        {heading}
      </div>
      <div
        className="h-[2px] w-full"
        style={{ background: accent, opacity: 0.5 }}
      />
      <ul className="flex flex-col gap-3 font-mono text-[13px]">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-[var(--text-primary)]"
          >
            <span
              className="font-mono text-[10px] opacity-60 shrink-0 mt-1"
              style={{ color: accent }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="leading-[1.5]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalItem({
  index,
  title,
  impact,
  meta,
  body,
  driver,
}: {
  index: number;
  title: string;
  impact: keyof typeof IMPACT_STYLE;
  meta: string;
  body: string;
  driver?: string;
}) {
  const style = IMPACT_STYLE[impact];
  return (
    <div
      className="grid gap-6 md:gap-10 py-8 md:py-10 first:pt-0 last:pb-0"
      style={{
        gridTemplateColumns: "72px minmax(0, 1fr) minmax(0, 180px)",
        borderTop: index === 0 ? "none" : "1px dotted var(--surface-border)",
      }}
    >
      <div
        className="font-primary"
        style={{
          fontSize: "48px",
          lineHeight: "0.9",
          color: style.color,
          letterSpacing: "-0.04em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="min-w-0">
        <h4
          className="font-primary mb-2"
          style={{
            fontSize: "clamp(22px, 2.4vw, 30px)",
            lineHeight: "1.1",
            letterSpacing: "-0.01em",
            textWrap: "balance" as any,
          }}
        >
          {title}
        </h4>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)] mb-4">
          {meta}
        </div>
        <p
          className="text-[15px] text-[var(--text-secondary)]"
          style={{ lineHeight: "1.65", textWrap: "pretty" as any }}
        >
          {body}
        </p>
        {driver && (
          <details className="mt-4 group">
            <summary className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors inline-block">
              Show chart language →
            </summary>
            <div
              className="mt-3 pl-4 border-l font-mono text-[12px] text-[var(--text-secondary)]"
              style={{ borderColor: style.color }}
            >
              {driver}
            </div>
          </details>
        )}
      </div>

      <div className="flex md:justify-end items-start">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap"
          style={{ color: style.color }}
        >
          {style.label}
        </span>
      </div>
    </div>
  );
}

function ReportBlock({
  index,
  title,
  content,
}: {
  index: string;
  title: string;
  content: string;
}) {
  return (
    <div
      className="grid gap-8 md:gap-16 py-12 md:py-16 border-t first:border-t-0"
      style={{
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
        borderColor: "var(--surface-border)",
      }}
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-bold mb-3">
          § {index}
        </div>
        <h3
          className="font-primary"
          style={{
            fontSize: "clamp(26px, 3vw, 36px)",
            lineHeight: "1.05",
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h3>
      </div>
      <p
        className="text-[17px] md:text-[18px] text-[var(--text-secondary)] max-w-[640px]"
        style={{ lineHeight: "1.6", textWrap: "pretty" as any }}
      >
        {content}
      </p>
    </div>
  );
}
