"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavbar from "@/app/components/AppNavbar";
import { BackButton } from "@/components/app/back-button";
import { ScoreRing, getVerdict } from "@/app/components/ScoreRing";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";
import UpsellCelebrationCard from "@/app/components/UpsellCelebrationCard";

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Reading View — 3-stage progressive disclosure.
//
// Prefers the new `reading.teacherReading` payload (written by lib/ai/prompts/
// teacher-reading.ts via /api/readings/generate). Falls back to a legacy
// derivation from aiInsights+narrative for readings written before the prompt
// rewrite landed.
// ─────────────────────────────────────────────────────────────────────────────

type Stage = "summary" | "signals" | "report";
type SignalTab = "transits" | "events" | "natal";
type Tone = "supportive" | "challenging" | "neutral";

const TONE_STYLE: Record<Tone, { color: string; label: string }> = {
  supportive: { color: "var(--color-acqua)", label: "GOOD" },
  challenging: { color: "var(--color-spiced-life)", label: "WATCH" },
  neutral: { color: "var(--text-tertiary)", label: "STEADY" },
};

interface TeacherView {
  summary: {
    headline: string;
    theRead: string;
    leanInto: string[];
    goEasy: string[];
    whereYoullFeelIt: string[];
  };
  signals: {
    weather: Array<{ title: string; body: string; datesRange: string; tone: Tone }>;
    moments: Array<{ title: string; body: string; tone: Tone }>;
    chart: Array<{ title: string; body: string }>;
  };
  longRead: {
    thePlace?: { title: string; content: string };
    yourTiming?: { title: string; content: string };
    biggerPicture?: { title: string; content: string };
    howYouChangeHere?: { title: string; content: string };
    theCall?: { title: string; content: string };
  };
}

/** Read the new teacherReading payload directly. */
function fromTeacherReading(tr: any): TeacherView {
  return {
    summary: {
      headline: tr.summary?.headline ?? "",
      theRead: tr.summary?.theRead ?? "",
      leanInto: Array.isArray(tr.summary?.leanInto) ? tr.summary.leanInto : [],
      goEasy: Array.isArray(tr.summary?.goEasy) ? tr.summary.goEasy : [],
      whereYoullFeelIt: Array.isArray(tr.summary?.whereYoullFeelIt) ? tr.summary.whereYoullFeelIt : [],
    },
    signals: {
      weather: Array.isArray(tr.signals?.weather) ? tr.signals.weather : [],
      moments: Array.isArray(tr.signals?.moments) ? tr.signals.moments : [],
      chart: Array.isArray(tr.signals?.chart) ? tr.signals.chart : [],
    },
    longRead: {
      thePlace: tr.longRead?.thePlace,
      yourTiming: tr.longRead?.yourTiming,
      biggerPicture: tr.longRead?.biggerPicture,
      howYouChangeHere: tr.longRead?.howYouChangeHere,
      theCall: tr.longRead?.theCall,
    },
  };
}

/**
 * Legacy fallback for readings written before the prompt rewrite. Maps the
 * old aiInsights + narrative shape onto the teacher view. Only used when
 * `reading.teacherReading` is absent.
 */
function deriveTeacher(reading: any, narrative: any): TeacherView {
  const ai = reading?.aiInsights || {};
  const verdict = narrative?.verdict || {};
  const transits: any[] = reading?.transitWindows || [];
  const planets: any[] = reading?.natalPlanets || [];

  const headline =
    (ai.primary?.title && ai.primary.title !== "The Astrological Verdict"
      ? ai.primary.title
      : null) || `A read for ${String(reading?.destination || "your destination").split(",")[0]}.`;

  const theRead =
    ai.primary?.content && !/evaluating relocation matrix/i.test(ai.primary.content)
      ? ai.primary.content
      : "Your reading is being put together — highlights and the long version will populate as it arrives.";

  const moments: TeacherView["signals"]["moments"] = [];
  if (ai.highest?.content) moments.push({ title: ai.highest.title, body: ai.highest.content, tone: "supportive" });
  if (ai.vulnerable?.content) moments.push({ title: ai.vulnerable.title, body: ai.vulnerable.content, tone: "challenging" });
  if (ai.timing?.content) moments.push({ title: ai.timing.title, body: ai.timing.content, tone: "supportive" });

  const weather: TeacherView["signals"]["weather"] = transits.slice(0, 3).map((t) => ({
    title: t.title || t.label || "Transit window",
    body: t.ai || t.recommendation || "A window worth watching.",
    datesRange: t.date || t.label || "",
    tone: "neutral" as Tone,
  }));

  const chart: TeacherView["signals"]["chart"] = [planets[0], planets[1], planets.find((_, i) => i > 1)]
    .filter(Boolean)
    .map((p: any) => ({
      title: `Your ${p.name || p.planet} in ${p.sign || ""}`.trim(),
      body: `${p.name || p.planet} is one of the placements doing real work in this reading.`,
    }));

  return {
    summary: {
      headline,
      theRead,
      leanInto: Array.isArray(verdict.bestWindows) ? verdict.bestWindows : [],
      goEasy: Array.isArray(verdict.datesAvoid) ? verdict.datesAvoid : [],
      whereYoullFeelIt: Array.isArray(verdict.bestHouses) ? verdict.bestHouses : [],
    },
    signals: { weather, moments, chart },
    longRead: {
      thePlace: narrative?.permanentMap,
      yourTiming: narrative?.personalTiming,
      biggerPicture: narrative?.collectiveClimate,
      howYouChangeHere: narrative?.relocatedChart,
      theCall: narrative?.verdict,
    },
  };
}

export default function TeacherReadingView({
  reading,
  narrative,
  narrativeLoading,
  showUpsell,
  paramId,
}: {
  reading: any;
  narrative: any;
  narrativeLoading: boolean;
  showUpsell: boolean;
  paramId?: string;
}) {
  // Prefer the new shape; fall back to legacy derive when absent.
  const view: TeacherView = reading?.teacherReading
    ? fromTeacherReading(reading.teacherReading)
    : deriveTeacher(reading, narrative);

  const destinationShort = String(reading?.destination || "").split(",")[0] || "Destination";
  const travelDate: string =
    reading?.travelDate ||
    (typeof reading?.reading_date === "string" ? reading.reading_date.slice(0, 10) : "");
  const macroScore = Number(reading?.macroScore ?? reading?.reading_score ?? 0);

  const [activeStage, setActiveStage] = useState<Stage>("summary");
  const [signalTab, setSignalTab] = useState<SignalTab>("transits");
  const [reportOpen, setReportOpen] = useState(false);

  const stageRefs = {
    summary: useRef<HTMLDivElement>(null),
    signals: useRef<HTMLDivElement>(null),
    report: useRef<HTMLDivElement>(null),
  };

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

  const hasReport = Object.values(view.longRead).some(Boolean);
  const hasHighlights =
    view.summary.leanInto.length > 0 ||
    view.summary.goEasy.length > 0 ||
    view.summary.whereYoullFeelIt.length > 0;

  // Wheel geometry for the natal tab
  const formattedWheelPlanets = (reading?.natalPlanets || []).map((p: any) => ({
    planet: String(p.name || p.planet || "").charAt(0).toUpperCase() + String(p.name || p.planet || "").slice(1),
    longitude: p.longitude,
  }));
  const cusps =
    Array.isArray(reading?.relocatedCusps) && reading.relocatedCusps.length === 12
      ? reading.relocatedCusps
      : [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

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
            {destinationShort}{travelDate ? ` · ${travelDate}` : ""}
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
          <header
            className="grid items-end gap-6 md:gap-12"
            style={{ gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)" }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-medium">
                § 01 — A read for {destinationShort}{travelDate ? ` · ${travelDate}` : ""}
              </div>
              <h1
                className="font-primary uppercase mt-3"
                style={{ fontSize: "clamp(44px, 6.5vw, 88px)", lineHeight: "0.9", letterSpacing: "-0.025em" }}
              >
                {destinationShort}
              </h1>
              <p
                className="font-secondary text-[var(--text-primary)] mt-4 max-w-[640px]"
                style={{ fontSize: "clamp(18px, 1.9vw, 24px)", lineHeight: "1.3", letterSpacing: "-0.005em", textWrap: "pretty" as any }}
              >
                {view.summary.headline}
              </p>
            </div>
            <div className="flex md:justify-end">
              <ScoreRing score={macroScore} verdict={getVerdict(macroScore)} />
            </div>
          </header>

          {/* Highlights */}
          {hasHighlights ? (
            <div
              className="mt-8 md:mt-10 pt-6 md:pt-8 border-t"
              style={{ borderColor: "var(--surface-border)" }}
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-medium">
                  The highlights
                </div>
                {narrativeLoading && (
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] animate-pulse">
                    streaming…
                  </div>
                )}
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
                {view.summary.leanInto.length > 0 && (
                  <SummaryCard heading="Lean in" accent="var(--color-planet-jupiter)" items={view.summary.leanInto} />
                )}
                {view.summary.goEasy.length > 0 && (
                  <SummaryCard heading="Go easy" accent="var(--color-planet-saturn)" items={view.summary.goEasy} />
                )}
                {view.summary.whereYoullFeelIt.length > 0 && (
                  <SummaryCard heading="Where you'll feel it" accent="var(--color-y2k-blue)" items={view.summary.whereYoullFeelIt} />
                )}
              </div>
            </div>
          ) : narrativeLoading ? (
            <div
              className="mt-8 md:mt-10 pt-6 md:pt-8 border-t font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)] animate-pulse"
              style={{ borderColor: "var(--surface-border)" }}
            >
              Pulling your highlights together…
            </div>
          ) : null}

          {/* The read */}
          {view.summary.theRead && (
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
                  style={{ fontSize: "clamp(22px, 2.2vw, 28px)", lineHeight: "1.15", letterSpacing: "-0.01em" }}
                >
                  In plain English.
                </div>
              </div>
              <p
                className="text-[16px] md:text-[17px] text-[var(--text-secondary)]"
                style={{ lineHeight: "1.7", textWrap: "pretty" as any, maxWidth: "680px" }}
              >
                {view.summary.theRead}
              </p>
            </div>
          )}

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
                style={{ fontSize: "clamp(32px, 4.2vw, 56px)", lineHeight: "1.02", letterSpacing: "-0.015em" }}
              >
                The sky, while you&apos;re there.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.65] text-[var(--text-secondary)] max-w-[440px]">
              Three layers, in plain English. The weather is the timing. The moments are the high-stakes hits. Your chart is what makes the week feel personal.
            </p>
          </header>

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

          <div
            className="bg-[var(--surface)] border p-6 md:p-10 lg:p-14"
            style={{ borderColor: "var(--surface-border)", borderRadius: "var(--radius-lg)" }}
          >
            <AnimatePresence mode="wait">
              {signalTab === "transits" && (
                <motion.div key="transits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="flex flex-col">
                  {view.signals.weather.length === 0 ? (
                    <EmptyRow text="No standout windows in your visit dates." />
                  ) : (
                    view.signals.weather.map((t, i) => (
                      <SignalItem key={i} index={i} title={t.title} tone={t.tone} meta={t.datesRange} body={t.body} />
                    ))
                  )}
                </motion.div>
              )}

              {signalTab === "events" && (
                <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="flex flex-col">
                  {view.signals.moments.length === 0 ? (
                    <EmptyRow text="No standout moments yet." />
                  ) : (
                    view.signals.moments.map((e, i) => (
                      <SignalItem key={i} index={i} title={e.title} tone={e.tone} body={e.body} />
                    ))
                  )}
                </motion.div>
              )}

              {signalTab === "natal" && (
                <motion.div key="natal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <div
                    className="grid gap-10 md:gap-16 items-center mb-10 md:mb-14 pb-10 md:pb-14 border-b"
                    style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", borderColor: "var(--surface-border)" }}
                  >
                    <div className="max-w-[420px] w-full mx-auto">
                      <NatalMockupWheel isDark={true} planets={formattedWheelPlanets as any} cusps={cusps} />
                    </div>
                    <div className="space-y-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        The parts of you lighting up
                      </div>
                      <p className="text-[17px] leading-[1.55] text-[var(--text-secondary)] max-w-[440px]">
                        Only a few spots in your chart are really doing the talking this week. Here&apos;s who they are and why they&apos;re loud right now.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {view.signals.chart.length === 0 ? (
                      <EmptyRow text="Natal details not available for this reading." />
                    ) : (
                      view.signals.chart.map((c, i) => (
                        <SignalItem key={i} index={i} title={c.title} tone="neutral" body={c.body} />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {hasReport && (
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
          )}
        </motion.section>

        {/* ───────────────────────────── STAGE 3 — REPORT ──────────────────── */}
        {hasReport && (
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
                  style={{ fontSize: "clamp(32px, 4.2vw, 56px)", lineHeight: "1.02", letterSpacing: "-0.015em" }}
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
                    {view.longRead.thePlace && <ReportBlock index="01" title={view.longRead.thePlace.title} content={view.longRead.thePlace.content} />}
                    {view.longRead.yourTiming && <ReportBlock index="02" title={view.longRead.yourTiming.title} content={view.longRead.yourTiming.content} />}
                    {view.longRead.biggerPicture && <ReportBlock index="03" title={view.longRead.biggerPicture.title} content={view.longRead.biggerPicture.content} />}
                    {view.longRead.howYouChangeHere && <ReportBlock index="04" title={view.longRead.howYouChangeHere.title} content={view.longRead.howYouChangeHere.content} />}

                    {view.longRead.theCall && (
                      <div
                        className="bg-[var(--surface)] border p-8 md:p-14 mt-10 md:mt-16"
                        style={{ borderColor: "var(--color-y2k-blue)", borderRadius: "var(--radius-lg)" }}
                      >
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-bold mb-4">
                          § 05 — The call
                        </div>
                        <h3
                          className="font-primary mb-6"
                          style={{ fontSize: "clamp(28px, 3.6vw, 44px)", lineHeight: "1.05", letterSpacing: "-0.015em" }}
                        >
                          {view.longRead.theCall.title}
                        </h3>
                        <p className="text-[18px] md:text-[20px] leading-[1.55] text-[var(--text-secondary)] max-w-[720px]">
                          {view.longRead.theCall.content}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {showUpsell && (
          <UpsellCelebrationCard returnTo={paramId ? `/reading/${paramId}` : "/dashboard"} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SummaryCard({ heading, accent, items }: { heading: string; accent: string; items: string[] }) {
  return (
    <div className="p-6 md:p-8 flex flex-col gap-4" style={{ background: "var(--bg)" }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: accent }}>
        {heading}
      </div>
      <div className="h-[2px] w-full" style={{ background: accent, opacity: 0.5 }} />
      <ul className="flex flex-col gap-3 font-mono text-[13px]">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[var(--text-primary)]">
            <span className="font-mono text-[10px] opacity-60 shrink-0 mt-1" style={{ color: accent }}>
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
  tone,
  meta,
  body,
}: {
  index: number;
  title: string;
  tone: Tone;
  meta?: string;
  body: string;
}) {
  const style = TONE_STYLE[tone];
  return (
    <div
      className="grid gap-6 md:gap-10 py-8 md:py-10 first:pt-0 last:pb-0"
      style={{
        gridTemplateColumns: "72px minmax(0, 1fr) minmax(0, 140px)",
        borderTop: index === 0 ? "none" : "1px dotted var(--surface-border)",
      }}
    >
      <div
        className="font-primary"
        style={{ fontSize: "48px", lineHeight: "0.9", color: style.color, letterSpacing: "-0.04em" }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="min-w-0">
        <h4
          className="font-primary mb-2"
          style={{ fontSize: "clamp(22px, 2.4vw, 30px)", lineHeight: "1.1", letterSpacing: "-0.01em", textWrap: "balance" as any }}
        >
          {title}
        </h4>
        {meta && (
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)] mb-4">
            {meta}
          </div>
        )}
        <p className="text-[15px] text-[var(--text-secondary)]" style={{ lineHeight: "1.65", textWrap: "pretty" as any }}>
          {body}
        </p>
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

function ReportBlock({ index, title, content }: { index: string; title: string; content: string }) {
  return (
    <div
      className="grid gap-8 md:gap-16 py-12 md:py-16 border-t first:border-t-0"
      style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", borderColor: "var(--surface-border)" }}
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] font-bold mb-3">
          § {index}
        </div>
        <h3 className="font-primary" style={{ fontSize: "clamp(26px, 3vw, 36px)", lineHeight: "1.05", letterSpacing: "-0.015em" }}>
          {title}
        </h3>
      </div>
      <p className="text-[17px] md:text-[18px] text-[var(--text-secondary)] max-w-[640px]" style={{ lineHeight: "1.6", textWrap: "pretty" as any }}>
        {content}
      </p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="py-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
      {text}
    </div>
  );
}
