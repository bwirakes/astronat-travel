"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import SectionHead from "../../shared/SectionHead";
import TabSection from "../../shared/TabSection";
import { RichText } from "../../shared/ReadingCopy";
import type { V4VM } from "./types";
import { transitOneLiner } from "@/app/lib/transit-copy";
import type { TransitSpan, UniversalSkySpan } from "@/app/lib/window-scoring";
import { PLANET_GLYPH } from "@/app/lib/geodetic-weather-types";
import { templateForSpanShape } from "@/app/lib/universal-sky-templates";
import TimingDateTabs, {
    TRIP_TIMING_TABS,
    RELOCATION_TIMING_TABS,
    rowInTab,
    type TimingTab as TimingDateTab,
} from "./TimingDateTabs";
import { WINDOW_LABELS, WINDOW_RATIONALES, verdictBand, verdictTone } from "@/app/lib/verdict";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/app/components/ui/hover-card";

// ─── Importance ranking (signal vs noise) ────────────────────────────────────
// Personal transits are sorted chronologically in the VM, so we re-rank by a
// quick proxy of significance: outer-planet weight × tightness × goal hit ×
// span width. Mirrors the picker in solveTransitSpans, just narrower.

const PLANET_WEIGHT_LOCAL: Record<string, number> = {
    pluto: 5, neptune: 5, uranus: 5, saturn: 5, jupiter: 4,
    mars: 3, sun: 2, mercury: 1.5, venus: 1.5, moon: 0,
};

const GOAL_TARGETS_LOCAL: Record<string, string[]> = {
    identity: ["sun", "mars", "asc", "jupiter"],
    wealth: ["venus", "jupiter", "saturn"],
    home: ["moon", "ic"],
    romance: ["venus", "moon", "mars"],
    health: ["moon", "mercury", "mars", "saturn"],
    partnerships: ["venus", "moon", "dsc"],
    friendship: ["mercury", "jupiter"],
    spirituality: ["jupiter", "neptune", "moon"],
    love: ["venus", "moon"],
    career: ["sun", "mars", "saturn", "mc"],
    community: ["mercury", "jupiter"],
    growth: ["jupiter", "neptune"],
    relocation: ["moon", "ic"],
    timing: [],
};

function transitImportance(span: TransitSpan, goalIds: string[] = []): number {
    const w = PLANET_WEIGHT_LOCAL[span.transit_planet.toLowerCase()] ?? 1;
    const tightness = Math.max(0.2, 1 - span.peak_orb / 3);
    const goalSet = new Set(goalIds.flatMap((g) => GOAL_TARGETS_LOCAL[g] ?? []));
    const goalBoost = goalSet.has(span.natal_planet.toLowerCase()) ? 1.5 : 1;
    const widthDays = Math.max(1, span.exitDay - span.entryDay);
    const widthFactor = 0.5 + Math.min(1, widthDays / 30);
    return w * tightness * goalBoost * widthFactor;
}

// ─── Plain-English copy for personal transits ───────────────────────────────
// Mirrors the lay-language mapping in universal-sky-templates so the timing
// view reads consistently across personal + sky rows. Voice: Nat — direct,
// 7th-grade, gloss the astro term first.

const ASPECT_VERB_LAY: Record<string, string> = {
    conjunction: "sits on",
    opposition:  "pulls against",
    square:      "presses on",
    trine:       "lifts",
    sextile:     "opens",
    quincunx:    "knocks against",
};

function capWord(s: string): string {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function plainTransitTitle(span: TransitSpan): string {
    const verb = ASPECT_VERB_LAY[span.aspect.toLowerCase()] ?? span.aspect.toLowerCase();
    return `${capWord(span.transit_planet)} ${verb} your natal ${capWord(span.natal_planet)}`;
}

function compactTransitLabel(span: TransitSpan): string {
    return `${capWord(span.transit_planet)} to ${capWord(span.natal_planet)}`;
}

interface Props {
    vm: V4VM;
    copiedTab?: {
        lead?: string;
        plainEnglishSummary?: string;
        guideRows?: Array<{ label: string; body: string }>;
        evidenceCaption?: string;
        nextTabBridge?: string;
    };
}

const FM = "var(--font-mono)";
const FB = "var(--font-body)";
const FP = "var(--font-primary)";

const GANTT_LABEL_COL = "clamp(205px, 21vw, 270px)";
const GANTT_GRID = `${GANTT_LABEL_COL} minmax(0, 1fr)`;
const LEDGER_RULE = "color-mix(in oklab, var(--text-primary) 14%, var(--surface-border))";
const SKY_LEDGER = "color-mix(in oklab, var(--text-primary) 54%, var(--surface-border))";

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        const onChange = () => setMatches(media.matches);
        onChange();
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [query]);

    return matches;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Format an ISO date as "MMM D" (e.g. "Apr 28"). Returns "" if invalid. */
function fmtMonthDay(iso: string | null | undefined): string {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    if (!isFinite(t)) return "";
    return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Add `days` to an ISO date and return "MMM D". */
function fmtAnchorOffset(anchorISO: string | null | undefined, days: number): string {
    if (!anchorISO) return "";
    const t = new Date(anchorISO).getTime();
    if (!isFinite(t)) return "";
    return fmtMonthDay(new Date(t + days * 86_400_000).toISOString());
}

function visibleSpanLabel({
    anchorISO,
    entryISO,
    exactISO,
    exitISO,
    entryDay,
    exactDay,
    exitDay,
    windowStart,
    windowEnd,
    accent,
}: {
    anchorISO: string;
    entryISO: string;
    exactISO: string;
    exitISO: string;
    entryDay: number;
    exactDay: number;
    exitDay: number;
    windowStart: number;
    windowEnd: number;
    accent: string;
}) {
    const startsBefore = entryDay < windowStart;
    const endsAfter = exitDay > windowEnd;
    const visibleStart = startsBefore ? fmtAnchorOffset(anchorISO, windowStart) : fmtMonthDay(entryISO);
    const visibleEnd = endsAfter ? fmtAnchorOffset(anchorISO, windowEnd) : fmtMonthDay(exitISO);
    const exactInWindow = exactDay >= windowStart && exactDay <= windowEnd;

    return (
        <>
            {startsBefore && <span style={{ color: "var(--text-tertiary)" }}>← </span>}
            {visibleStart}
            {" → "}
            {exactInWindow && (
                <>
                    <span style={{ color: accent, fontWeight: 700 }}>{fmtMonthDay(exactISO)}</span>
                    {" → "}
                </>
            )}
            {visibleEnd}
            {endsAfter && <span style={{ color: "var(--text-tertiary)" }}> →</span>}
        </>
    );
}

// ─── Verdict headline ───────────────────────────────────────────────────────

const GOAL_LABEL_SHORT: Record<string, string> = {
    identity: "identity and confidence",
    wealth: "wealth and resources",
    home: "home and roots",
    romance: "romance and love",
    health: "health and routine",
    partnerships: "partnership and commitment",
    friendship: "friendship and networks",
    spirituality: "spiritual clarity",
    love: "love and connection",
    career: "career and visibility",
    community: "community and networks",
    growth: "growth and expansion",
    relocation: "home and belonging",
    timing: "this trip",
};

function verdictForScore(score: number): { label: string; tone: "good" | "mixed" | "hard"; rationale: string } {
    const band = verdictBand(score);
    const tone = verdictTone(band);
    const toneTag: "good" | "mixed" | "hard" =
        tone === "lift" ? "good" : tone === "neutral" ? "mixed" : "hard";
    return { label: WINDOW_LABELS[band], tone: toneTag, rationale: WINDOW_RATIONALES[band] };
}

function VerdictHeadline({ vm }: { vm: V4VM }) {
    const score = vm.travelWindows[0]?.score;
    if (typeof score !== "number") return null;

    const v = verdictForScore(score);
    const goal = vm.goalIds[0];
    const goalLabel = goal ? GOAL_LABEL_SHORT[goal] : null;

    const accent =
        v.tone === "good"  ? "var(--sage)" :
        v.tone === "mixed" ? "var(--gold)" :
                             "var(--color-spiced-life)";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontFamily: FM, fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>
                {v.label} · {score}/100
            </div>
            <p style={{
                fontFamily: FB,
                fontSize: "17px",
                lineHeight: 1.6,
                fontWeight: 300,
                color: "var(--text-secondary)",
                margin: 0,
                maxWidth: "62ch",
            }}>
                {goalLabel && goal !== "timing"
                    ? <>For your <span style={{ color: accent, fontWeight: 600 }}>{goalLabel}</span> goals, {v.rationale}.</>
                    : <>{v.rationale.charAt(0).toUpperCase()}{v.rationale.slice(1)}.</>
                }
            </p>
        </div>
    );
}

// ─── Window framing — Nat's voice, two short paragraphs ─────────────────────
// Sits above the Gantt header. Para 1 explains what the bars are. Para 2
// names the loudest 1–2 things shaping this period. Direct, no jargon.

function WindowFraming({ vm }: { vm: V4VM }) {
    const isRelocation = vm.timeline.grain === "month";

    const para1 = isRelocation
        ? "Here's the year ahead at this place. Outer planets — Saturn, Jupiter, the slow ones — move through your chart for months at a time. Most pass quietly. A few set the tone. Each bar shows when one transit enters, peaks, and clears."
        : "Here's the next 90 days, slowed down. Outer planets sweep across your natal chart for weeks at a time, and a few set the tone for the whole stretch. Each bar is one transit — when it enters orb (close enough to count), when it's exact, when it clears.";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxWidth: "62ch", marginTop: "var(--space-xl)" }}>
            <p style={{ fontFamily: FB, fontSize: "16px", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0, fontWeight: 300 }}>
                {para1}
            </p>
        </div>
    );
}

// ─── §1 Field Summary ────────────────────────────────────────────────────────

/** Relocation-grain field summary: 12 monthly bars across the year ahead at
 *  the new place. Mirrors the daily-grain renderer below in structure (lead +
 *  bar strip + footer) but reads monthlySeries / monthlyHighlights and labels
 *  things by month name. The user's anchor month is highlighted in y2k-blue
 *  with a "Move" tag; strongest/hardest months get sage/coral peak markers. */
function MonthlyFieldSummary({ vm }: { vm: V4VM }) {
    const { monthlySeries, monthlyHighlights, travelDateISO } = vm;
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    if (!monthlySeries.length) return null;

    const max = Math.max(...monthlySeries.map(m => m.score), 1);

    // Anchor: the calendar month containing travelDateISO.
    const anchorMonthISO = travelDateISO
        ? new Date(Date.UTC(
            new Date(travelDateISO).getUTCFullYear(),
            new Date(travelDateISO).getUTCMonth(),
            1,
        )).toISOString().slice(0, 10)
        : null;
    const anchorIdx = anchorMonthISO
        ? monthlySeries.findIndex(m => m.monthISO === anchorMonthISO)
        : -1;
    const anchorMonth = anchorIdx >= 0 ? monthlySeries[anchorIdx] : null;
    const anchorPct = anchorIdx >= 0
        ? (anchorIdx / Math.max(1, monthlySeries.length - 1)) * 100
        : null;
    const anchorNearLeft  = anchorPct !== null && anchorPct < 15;
    const anchorNearRight = anchorPct !== null && anchorPct > 85;

    const strongestSet = new Set(monthlyHighlights.strongest.map(m => m.monthISO));
    const hardestSet   = new Set(monthlyHighlights.hardest.map(m => m.monthISO));

    const top = monthlyHighlights.strongest[0];
    const hard = monthlyHighlights.hardest[0];

    const seriesStartT = new Date(monthlySeries[0].monthISO).getTime();
    const seriesSpan = Math.max(
        1,
        new Date(monthlySeries[monthlySeries.length - 1].monthISO).getTime() - seriesStartT,
    );
    const markerPct = (monthISO: string): number | null => {
        const t = new Date(monthISO).getTime();
        if (!isFinite(t)) return null;
        return Math.max(0, Math.min(100, ((t - seriesStartT) / seriesSpan) * 100));
    };

    const startLabel = monthlySeries[0].monthLabel.split(" ")[0];
    const endLabel   = monthlySeries[monthlySeries.length - 1].monthLabel.split(" ")[0];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            <p style={{ fontFamily: FB, fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                {top
                    ? <>The strongest month is <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{top.monthLabel}</strong> at <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{top.score}/100</strong>{hard
                        ? <>; the hardest is <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{hard.monthLabel}</strong> at <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{hard.score}/100</strong>.</>
                        : <>. The rest of the year holds steady around it.</>}</>
                    : <>The next 12 months at this place.</>}
            </p>

            <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)", padding: "var(--space-md) var(--space-md) var(--space-sm)" }}>
                {/* Top label — sits over the anchor month bar */}
                {anchorMonth && anchorPct !== null && (
                    <div style={{ position: "relative", height: 28, marginBottom: 4 }}>
                        <div style={{
                            position: "absolute",
                            left: `${anchorPct}%`,
                            top: 0,
                            transform: "translateX(-50%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "2px",
                            whiteSpace: "nowrap",
                        }}>
                            <span style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-y2k-blue)", fontWeight: 700 }}>
                                Move · {anchorMonth.monthLabel.split(" ")[0]}
                            </span>
                            <span style={{ fontSize: "0.6rem", color: "var(--color-y2k-blue)", lineHeight: 1 }}>▼</span>
                        </div>
                    </div>
                )}

                <div
                    style={{ position: "relative", display: "flex", gap: "4px", alignItems: "flex-end", height: 56, width: "100%" }}
                    role="img"
                    aria-label="12-month score strip"
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {/* Floating hover tooltip */}
                    {hoveredIdx !== null && monthlySeries[hoveredIdx] && (() => {
                        const m = monthlySeries[hoveredIdx];
                        const pct = (hoveredIdx / Math.max(1, monthlySeries.length - 1)) * 100;
                        const tipColor =
                            m.score >= 75 ? "var(--sage)" :
                            m.score >= 55 ? "var(--gold)" :
                                            "var(--color-spiced-life)";
                        return (
                            <div style={{
                                position: "absolute",
                                left: `${pct}%`,
                                bottom: "calc(100% + 10px)",
                                transform: `translateX(${pct < 15 ? "0" : pct > 85 ? "-100%" : "-50%"})`,
                                zIndex: 30,
                                background: "var(--color-charcoal)",
                                color: "var(--color-eggshell)",
                                borderRadius: "var(--radius-sm)",
                                padding: "0.5rem 0.75rem",
                                whiteSpace: "nowrap",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                                display: "flex",
                                alignItems: "baseline",
                                gap: "0.7rem",
                                pointerEvents: "none",
                            }}>
                                <span style={{ fontFamily: FM, fontSize: "0.7rem", letterSpacing: "0.06em", color: "var(--color-eggshell)", fontWeight: 600 }}>
                                    {m.monthLabel}
                                </span>
                                <span style={{ fontFamily: FM, fontSize: "0.78rem", color: tipColor, fontWeight: 700 }}>
                                    {m.score}/100
                                </span>
                            </div>
                        );
                    })()}

                    {/* Strongest month markers (sage triangles) */}
                    {monthlyHighlights.strongest.map((m, i) => {
                        const pct = markerPct(m.monthISO);
                        if (pct === null) return null;
                        return (
                            <div
                                key={`pk-${i}`}
                                title={`Strong · ${m.monthLabel} · ${m.score}/100`}
                                style={{
                                    position: "absolute",
                                    left: `${pct}%`,
                                    top: -2,
                                    transform: "translateX(-50%)",
                                    width: 0,
                                    height: 0,
                                    borderLeft:  "5px solid transparent",
                                    borderRight: "5px solid transparent",
                                    borderTop:   "6px solid var(--sage)",
                                    zIndex: 3,
                                    pointerEvents: "auto",
                                }}
                            />
                        );
                    })}
                    {/* Hardest month marker (coral triangle) — only when spread justifies one */}
                    {monthlyHighlights.hardest.map((m, i) => {
                        const pct = markerPct(m.monthISO);
                        if (pct === null) return null;
                        return (
                            <div
                                key={`vl-${i}`}
                                title={`Watch · ${m.monthLabel} · ${m.score}/100`}
                                style={{
                                    position: "absolute",
                                    left: `${pct}%`,
                                    top: -2,
                                    transform: "translateX(-50%)",
                                    width: 0,
                                    height: 0,
                                    borderLeft:  "5px solid transparent",
                                    borderRight: "5px solid transparent",
                                    borderTop:   "6px solid var(--color-spiced-life)",
                                    zIndex: 3,
                                    pointerEvents: "auto",
                                }}
                            />
                        );
                    })}

                    {monthlySeries.map((m, idx) => {
                        const h = Math.max(6, (m.score / max) * 100);
                        const isAnchor = m.monthISO === anchorMonthISO;
                        const isStrongest = strongestSet.has(m.monthISO);
                        const isHardest = hardestSet.has(m.monthISO);
                        const isHovered = hoveredIdx === idx;
                        const color = isAnchor
                            ? "var(--color-y2k-blue)"
                            : m.score >= 75
                            ? "var(--sage)"
                            : m.score >= 55
                            ? "var(--gold)"
                            : "var(--color-spiced-life)";
                        return (
                            <div
                                key={m.monthISO}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                style={{
                                    flex: 1,
                                    minWidth: 4,
                                    height: `${h}%`,
                                    background: color,
                                    opacity: isAnchor ? 1 : isHovered ? 0.95 : isStrongest || isHardest ? 0.85 : 0.65,
                                    borderRadius: 2,
                                    outline: isAnchor ? "2px solid var(--color-y2k-blue)"
                                        : isHovered ? "1px solid var(--text-primary)"
                                        : undefined,
                                    outlineOffset: isAnchor ? 1 : isHovered ? 1 : undefined,
                                    position: isAnchor ? "relative" : undefined,
                                    zIndex: isAnchor ? 1 : isHovered ? 2 : undefined,
                                    cursor: "default",
                                    transition: "opacity 100ms ease",
                                }}
                            />
                        );
                    })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-xs)", fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                    <span style={{ visibility: anchorNearLeft ? "hidden" : "visible" }}>{startLabel}</span>
                    <span style={{ visibility: anchorNearRight ? "hidden" : "visible" }}>{endLabel}</span>
                </div>
            </div>
        </div>
    );
}

function DailyFieldSummary({ vm }: { vm: V4VM }) {
    const { dailySeries, timingPercentile, travelWindows, travelDateISO, rangeHighlights } = vm;
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [nowTime] = useState(() => Date.now());
    if (!dailySeries.length || !travelWindows[0]) return null;
    const userScore = travelWindows[0].score;

    const seriesStartT = new Date(dailySeries[0].iso).getTime();
    const seriesSpan   = Math.max(1, new Date(dailySeries[dailySeries.length - 1].iso).getTime() - seriesStartT);
    const markerPct = (iso: string): number | null => {
        const t = new Date(iso).getTime();
        if (!isFinite(t)) return null;
        return Math.max(0, Math.min(100, ((t - seriesStartT) / seriesSpan) * 100));
    };

    const max = Math.max(...dailySeries.map(d => d.score), 1);
    const anchor = dailySeries.find(d => d.isAnchor);
    const startDate = fmtMonthDay(dailySeries[0]?.iso);
    const endDate   = fmtMonthDay(dailySeries[dailySeries.length - 1]?.iso);
    const anchorDate = anchor ? fmtMonthDay(anchor.iso) : "";

    const daysToTrip = travelDateISO
        ? Math.round((new Date(travelDateISO).getTime() - nowTime) / 86_400_000)
        : null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            <p style={{ fontFamily: FB, fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                {daysToTrip !== null && daysToTrip > 0 && (
                    <>You&rsquo;re <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{daysToTrip} {daysToTrip === 1 ? "day" : "days"}</strong> out from this trip. </>
                )}
                Your dates score <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{userScore}/100</strong>
                {" — "}
                {timingPercentile >= 50
                    ? `better than ${timingPercentile}% of days in this 90-day window.`
                    : `in the lower ${100 - timingPercentile}% of days in this 90-day window.`}
            </p>

            {/* 90-day bar strip */}
            {(() => {
                const anchorIdx = dailySeries.findIndex(d => d.isAnchor);
                const anchorPct = anchorIdx >= 0 ? (anchorIdx / Math.max(1, dailySeries.length - 1)) * 100 : null;
                const anchorNearLeft  = anchorPct !== null && anchorPct < 15;
                const anchorNearRight = anchorPct !== null && anchorPct > 85;

                return (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)", padding: "var(--space-md) var(--space-md) var(--space-sm)" }}>
                        {/* Top label — sits directly over the anchor bar */}
                        {anchorPct !== null && (
                            <div style={{ position: "relative", height: 28, marginBottom: 4 }}>
                                <div style={{
                                    position: "absolute",
                                    left: `${anchorPct}%`,
                                    top: 0,
                                    transform: "translateX(-50%)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "2px",
                                    whiteSpace: "nowrap",
                                }}>
                                    <span style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-y2k-blue)", fontWeight: 700 }}>
                                        Trip · {anchorDate}
                                    </span>
                                    <span style={{ fontSize: "0.6rem", color: "var(--color-y2k-blue)", lineHeight: 1 }}>▼</span>
                                </div>
                            </div>
                        )}

                        <div
                            style={{ position: "relative", display: "flex", gap: "2px", alignItems: "flex-end", height: 48, width: "100%" }}
                            role="img"
                            aria-label="90-day score strip"
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            {/* Floating hover tooltip */}
                            {hoveredIdx !== null && dailySeries[hoveredIdx] && (() => {
                                const d = dailySeries[hoveredIdx];
                                const pct = (hoveredIdx / Math.max(1, dailySeries.length - 1)) * 100;
                                const tipColor =
                                    d.score >= 75 ? "var(--sage)" :
                                    d.score >= 55 ? "var(--gold)" :
                                                    "var(--color-spiced-life)";
                                return (
                                    <div style={{
                                        position: "absolute",
                                        left: `${pct}%`,
                                        bottom: "calc(100% + 10px)",
                                        transform: `translateX(${pct < 15 ? "0" : pct > 85 ? "-100%" : "-50%"})`,
                                        zIndex: 30,
                                        background: "var(--color-charcoal)",
                                        color: "var(--color-eggshell)",
                                        borderRadius: "var(--radius-sm)",
                                        padding: "0.5rem 0.75rem",
                                        whiteSpace: "nowrap",
                                        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: "0.7rem",
                                        pointerEvents: "none",
                                    }}>
                                        <span style={{ fontFamily: FM, fontSize: "0.7rem", letterSpacing: "0.06em", color: "var(--color-eggshell)", fontWeight: 600 }}>
                                            {fmtMonthDay(d.iso)}
                                        </span>
                                        <span style={{ fontFamily: FM, fontSize: "0.78rem", color: tipColor, fontWeight: 700 }}>
                                            {d.score}/100
                                        </span>
                                    </div>
                                );
                            })()}
                            {/* Peak / valley markers — small colored ticks at the top of the bar strip.
                                Replaces the chunky §2 Range Cards. */}
                            {rangeHighlights.good.map((w, i) => {
                                const pct = markerPct(w.centerISO);
                                if (pct === null) return null;
                                return (
                                    <div
                                        key={`pk-${i}`}
                                        title={`Open · ${fmtMonthDay(w.centerISO)} · ${w.score}/100`}
                                        style={{
                                            position: "absolute",
                                            left: `${pct}%`,
                                            top: -2,
                                            transform: "translateX(-50%)",
                                            width: 0,
                                            height: 0,
                                            borderLeft:  "5px solid transparent",
                                            borderRight: "5px solid transparent",
                                            borderTop:   "6px solid var(--sage)",
                                            zIndex: 3,
                                            pointerEvents: "auto",
                                        }}
                                    />
                                );
                            })}
                            {rangeHighlights.bad.map((w, i) => {
                                const pct = markerPct(w.centerISO);
                                if (pct === null) return null;
                                return (
                                    <div
                                        key={`vl-${i}`}
                                        title={`Watch · ${fmtMonthDay(w.centerISO)} · ${w.score}/100`}
                                        style={{
                                            position: "absolute",
                                            left: `${pct}%`,
                                            top: -2,
                                            transform: "translateX(-50%)",
                                            width: 0,
                                            height: 0,
                                            borderLeft:  "5px solid transparent",
                                            borderRight: "5px solid transparent",
                                            borderTop:   "6px solid var(--color-spiced-life)",
                                            zIndex: 3,
                                            pointerEvents: "auto",
                                        }}
                                    />
                                );
                            })}
                            {dailySeries.map((d, idx) => {
                                const h = Math.max(6, (d.score / max) * 100);
                                const isUser = d.isAnchor;
                                const isHovered = hoveredIdx === idx;
                                const color = isUser
                                    ? "var(--color-y2k-blue)"
                                    : d.score >= 75
                                    ? "var(--sage)"
                                    : d.score >= 55
                                    ? "var(--gold)"
                                    : "var(--color-spiced-life)";
                                return (
                                    <div
                                        key={d.iso}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        style={{
                                            flex: 1,
                                            minWidth: 2,
                                            height: `${h}%`,
                                            background: color,
                                            opacity: isUser ? 1 : isHovered ? 0.95 : 0.65,
                                            borderRadius: 1,
                                            outline: isUser ? "2px solid var(--color-y2k-blue)"
                                                : isHovered ? "1px solid var(--text-primary)"
                                                : undefined,
                                            outlineOffset: isUser ? 1 : isHovered ? 1 : undefined,
                                            position: isUser ? "relative" : undefined,
                                            zIndex: isUser ? 1 : isHovered ? 2 : undefined,
                                            cursor: "default",
                                            transition: "opacity 100ms ease",
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Footer — only the bookend dates. Hide the side that's too close to the anchor. */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-xs)", fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                            <span style={{ visibility: anchorNearLeft ? "hidden" : "visible" }}>{startDate}</span>
                            <span style={{ visibility: anchorNearRight ? "hidden" : "visible" }}>{endDate}</span>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function FieldSummary({ vm }: { vm: V4VM }) {
    // Relocation readings render a 12-month strip from monthlySeries instead
    // of 90 daily bars from dailySeries. Same visual primitive — fewer, wider
    // bars; month labels in the tooltip; "Move" anchor instead of "Trip."
    if (vm.timeline.grain === "month") {
        return <MonthlyFieldSummary vm={vm} />;
    }

    return <DailyFieldSummary vm={vm} />;
}

// ─── Transit Gantt ───────────────────────────────────────────────────────────

function planetGlyph(name: string): string {
    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return PLANET_GLYPH[key] ?? "✦";
}

function TimingHoverContent({
    accent,
    eyebrow,
    title,
    meta,
    domain,
    body,
}: {
    accent: string;
    eyebrow: string;
    title: string;
    meta: ReactNode;
    domain?: string;
    body?: ReactNode;
}) {
    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
                <h4 style={{
                    fontFamily: FP,
                    fontSize: "1.15rem",
                    textTransform: "uppercase",
                    color: "var(--text-primary)",
                    letterSpacing: "0.02em",
                    margin: 0,
                    lineHeight: 1,
                }}>
                    {title}
                </h4>
            </div>
            <div style={{
                fontFamily: FM,
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-tertiary)",
                marginBottom: "0.75rem",
            }}>
                {eyebrow} | {meta}
            </div>
            {domain && (
                <div style={{
                    fontFamily: FM,
                    fontSize: "0.6rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: accent,
                    marginBottom: "0.5rem",
                }}>
                    {domain}
                </div>
            )}
            {body && (
                <p style={{
                    fontFamily: FB,
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                    color: "var(--text-secondary)",
                    margin: 0,
                }}>
                    {body}
                </p>
            )}
        </>
    );
}

function TimingHoverCard({
    children,
    accent,
    eyebrow,
    title,
    meta,
    domain,
    body,
}: {
    children: ReactElement;
    accent: string;
    eyebrow: string;
    title: string;
    meta: ReactNode;
    domain?: string;
    body?: ReactNode;
}) {
    return (
        <HoverCard openDelay={140} closeDelay={120}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent
                sideOffset={8}
                className="planet-hover-card-pop"
                style={{ zIndex: 9999, width: "320px" }}
            >
                <TimingHoverContent
                    accent={accent}
                    eyebrow={eyebrow}
                    title={title}
                    meta={meta}
                    domain={domain}
                    body={body}
                />
            </HoverCardContent>
        </HoverCard>
    );
}

function GanttRow({
    span,
    windowStart,
    windowEnd,
    anchorISO,
    todayDay,
    compact = false,
    headline = false,
}: {
    span: TransitSpan;
    windowStart: number;
    windowEnd: number;
    anchorISO: string;
    todayDay: number | null;
    compact?: boolean;
    /** When true, render at full prominence (top tier). When false, render
     *  smaller and muted — these are the "background" rows below the fold. */
    headline?: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const range = windowEnd - windowStart;
    const toPct = (day: number) => ((day - windowStart) / range) * 100;

    const clampedEntry = Math.max(windowStart, span.entryDay);
    const clampedExit  = Math.min(windowEnd, span.exitDay);
    if (clampedEntry >= clampedExit) return null;

    const entryPct = toPct(clampedEntry);
    const widthPct = toPct(clampedExit) - entryPct;

    const accent = span.benefic
        ? "color-mix(in oklab, var(--sage) 84%, var(--text-primary))"
        : "color-mix(in oklab, var(--color-spiced-life) 88%, var(--text-primary))";
    const accentSoft = span.benefic
        ? "var(--sage-soft)"
        : "color-mix(in oklab, var(--color-spiced-life) 24%, transparent)";
    const meaning = transitOneLiner(span);
    const titleLay = plainTransitTitle(span);
    const chartLabel = compactTransitLabel(span);
    const toneLabel = span.benefic ? "Lift" : "Friction";

    // Row size scales with tier — headliners get the full treatment; backdrop
    // rows shrink so the eye isn't fighting equal-weight noise.
    const rowPad = compact ? "1rem 0" : headline ? "0.95rem 0" : "0.65rem 0";
    const trackHeight = compact ? 28 : headline ? 30 : 22;
    const barHeight = headline ? 9 : 7;
    const titleSize = compact ? "1.18rem" : headline ? "1.08rem" : "0.95rem";
    const subSize = compact ? "0.72rem" : headline ? "0.72rem" : "0.66rem";

    const row = (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: compact ? "minmax(0, 1fr)" : GANTT_GRID,
                gap: compact ? "0.75rem" : "var(--space-lg)",
                alignItems: compact ? "stretch" : "center",
                padding: rowPad,
                borderTop: `1px solid ${LEDGER_RULE}`,
                cursor: "zoom-in",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Row label — chart receipt only; interpretation lives in hover. */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", minWidth: 0 }}>
                <span style={{
                    fontFamily: FP,
                    fontSize: headline ? "1.15rem" : "0.95rem",
                    color: accent,
                    flexShrink: 0,
                    lineHeight: 1,
                    transform: "translateY(0.1rem)",
                    width: "1.1rem",
                    textAlign: "center",
                }}>
                    {planetGlyph(span.transit_planet)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                    {!compact && (
                        <div style={{
                            fontFamily: FM,
                            fontSize: "0.56rem",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "var(--text-tertiary)",
                            fontWeight: 700,
                            marginBottom: "0.22rem",
                            lineHeight: 1.65,
                        }}>
                            <span style={{ color: accent }}>{toneLabel}</span>
                            <span> · natal · {span.aspect.toLowerCase()}</span>
                        </div>
                    )}
                    <div style={{
                        display: compact ? "flex" : "block",
                        alignItems: compact ? "flex-start" : undefined,
                        justifyContent: compact ? "space-between" : undefined,
                        gap: compact ? "0.75rem" : undefined,
                    }}>
                    <div style={{
                        fontFamily: FP,
                        fontSize: titleSize,
                        fontWeight: 500,
                        color: headline ? "var(--text-primary)" : "var(--text-secondary)",
                        lineHeight: 1.08,
                    }}>
                        {chartLabel}
                        {span.retrograde && (
                            <span style={{ marginLeft: 4, fontFamily: FM, fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 500 }}>℞</span>
                        )}
                    </div>
                        {compact && (
                            <span style={{
                                fontFamily: FM,
                                fontSize: "0.54rem",
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: accent,
                                border: `1px solid ${accentSoft}`,
                                borderRadius: "999px",
                                padding: "0.18rem 0.42rem 0.16rem",
                                lineHeight: 1,
                                flexShrink: 0,
                                transform: "translateY(0.05rem)",
                            }}>
                                {toneLabel}
                            </span>
                        )}
                    </div>
                    {compact && (
                        <div style={{
                            fontFamily: FM,
                            fontSize: "0.54rem",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "var(--text-tertiary)",
                            fontWeight: 700,
                            marginTop: "0.42rem",
                            lineHeight: 1.45,
                        }}>
                            Natal · {span.aspect.toLowerCase()}
                        </div>
                    )}
                    <div style={{
                        fontFamily: FM,
                        fontSize: subSize,
                        letterSpacing: "0.06em",
                        color: "var(--text-tertiary)",
                        marginTop: "0.32rem",
                        lineHeight: 1.7,
                    }}>
                        {visibleSpanLabel({
                            anchorISO,
                            entryISO: span.entryISO,
                            exactISO: span.exactISO,
                            exitISO: span.exitISO,
                            entryDay: span.entryDay,
                            exactDay: span.exactDay,
                            exitDay: span.exitDay,
                            windowStart,
                            windowEnd,
                            accent,
                        })}
                    </div>
                </div>
            </div>

            {/* Bar track — overflow visible so tooltip can extend out */}
            <div style={{
                position: "relative",
                height: trackHeight,
                overflow: "visible",
                marginLeft: compact ? "1.85rem" : 0,
            }}>
                <div style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    height: 1,
                    background: LEDGER_RULE,
                    opacity: 0.9,
                }} />
                {/* TODAY line */}
                {todayDay !== null && todayDay >= windowStart && todayDay <= windowEnd && (
                    <div style={{
                        position: "absolute",
                        left: `${toPct(todayDay)}%`,
                        top: -20,
                        bottom: -20,
                        width: 2,
                        background: "var(--color-y2k-blue)",
                        opacity: 0.55,
                        zIndex: 2,
                    }} />
                )}

                {/* Bar — single solid pill, no tick or text inside */}
                <div style={{
                    position: "absolute",
                    left: `${entryPct}%`,
                    width: `${widthPct}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: barHeight,
                    borderRadius: barHeight / 2,
                    background: accent,
                    opacity: hovered ? 1 : headline ? 0.95 : 0.72,
                    transition: "opacity 150ms ease, transform 150ms ease",
                    boxShadow: hovered ? `0 0 0 2px ${accentSoft}` : "none",
                }} />
            </div>
        </div>
    );

    return (
        <TimingHoverCard
            accent={accent}
            eyebrow={`${span.transit_planet}${span.retrograde ? " ℞" : ""} ${span.aspect} natal ${span.natal_planet}`}
            title={titleLay}
            meta={<>{fmtMonthDay(span.entryISO)} → {fmtMonthDay(span.exactISO)} → {fmtMonthDay(span.exitISO)} · {span.peak_orb.toFixed(1)}° orb</>}
            domain="Personal transit"
            body={meaning}
        >
            {row}
        </TimingHoverCard>
    );
}

// ─── Universal sky row (location-agnostic) ───────────────────────────────────
// Same date scale as GanttRow above, but visually distinguished so readers can
// see at a glance what's happening overhead vs. their personal transits.
//
//   - Muted accent (slate/violet for sky vs sage/spiced for personal)
//   - Dashed left border on the label cell
//   - Zero-width spans (ingresses, stations) render as a thin pin instead of a pill
//   - Tooltip shows the universal-sky-span shape (entry/exact/exit + dignity/sign)

function fmtSkyKindLabel(kind: UniversalSkySpan["kind"]): string {
    switch (kind) {
        case "retrograde":  return "Retrograde";
        case "ingress":     return "Ingress";
        case "station":     return "Station";
        case "eclipse":     return "Eclipse";
        case "sky-aspect":  return "Aspect";
        case "node-aspect": return "Node aspect";
    }
}

function SkyGanttRow({
    span,
    windowStart,
    windowEnd,
    todayDay,
    compact = false,
    headline = false,
}: {
    span: UniversalSkySpan;
    windowStart: number;
    windowEnd: number;
    todayDay: number | null;
    compact?: boolean;
    headline?: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const range = windowEnd - windowStart;
    const toPct = (day: number) => ((day - windowStart) / range) * 100;

    const clampedEntry = Math.max(windowStart, span.entryDay);
    const clampedExit  = Math.min(windowEnd, span.exitDay);
    if (clampedEntry > clampedExit) return null;

    const isZeroWidth = span.entryDay === span.exitDay;
    const entryPct = toPct(clampedEntry);
    const widthPct = isZeroWidth ? 0 : toPct(clampedExit) - entryPct;

    // Sky rows stay neutral by default so universal events do not read as
    // personal lift/friction.
    const accent = SKY_LEDGER;

    const kindLabel = fmtSkyKindLabel(span.kind);
    const layCopy = templateForSpanShape({
        kind: span.kind,
        planet: span.planet,
        sign: span.sign,
        dignity: span.dignity,
        aspectType: span.aspectType,
        secondaryPlanet: span.secondaryPlanet,
    });

    const rowPad = compact ? "1rem 0" : headline ? "0.95rem 0" : "0.65rem 0";
    const trackHeight = compact ? 28 : headline ? 30 : 22;
    const barHeight = headline ? 9 : 7;
    const titleSize = compact ? "1.18rem" : headline ? "1.08rem" : "0.95rem";

    const row = (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: compact ? "minmax(0, 1fr)" : GANTT_GRID,
                gap: compact ? "0.75rem" : "var(--space-lg)",
                alignItems: compact ? "stretch" : "center",
                padding: rowPad,
                borderTop: `1px solid ${LEDGER_RULE}`,
                cursor: "zoom-in",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Row label — event receipt only; reading lives in hover. */}
            <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                minWidth: 0,
            }}>
                <span style={{
                    fontFamily: FP,
                    fontSize: headline ? "1.15rem" : "0.95rem",
                    color: accent,
                    flexShrink: 0,
                    opacity: 0.85,
                    lineHeight: 1,
                    transform: "translateY(0.1rem)",
                    width: "1.1rem",
                    textAlign: "center",
                }}>
                    {planetGlyph(span.planet)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                    {!compact && (
                        <div style={{
                            fontFamily: FM,
                            fontSize: "0.55rem",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: accent,
                            fontWeight: 700,
                            marginBottom: "0.22rem",
                            lineHeight: 1.65,
                        }}>
                            Sky · {kindLabel}
                        </div>
                    )}
                    <div style={{
                        display: compact ? "flex" : "block",
                        alignItems: compact ? "flex-start" : undefined,
                        justifyContent: compact ? "space-between" : undefined,
                        gap: compact ? "0.75rem" : undefined,
                    }}>
                    <div style={{
                        fontFamily: FP,
                        fontSize: titleSize,
                        fontWeight: 500,
                        color: headline ? "var(--text-primary)" : "var(--text-secondary)",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        lineHeight: 1.08,
                    }}>
                        {span.label}
                    </div>
                        {compact && (
                            <span style={{
                                fontFamily: FM,
                                fontSize: "0.54rem",
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: accent,
                                border: `1px solid ${LEDGER_RULE}`,
                                borderRadius: "999px",
                                padding: "0.18rem 0.42rem 0.16rem",
                                lineHeight: 1,
                                flexShrink: 0,
                                transform: "translateY(0.05rem)",
                            }}>
                                Sky
                            </span>
                        )}
                    </div>
                    {compact && (
                        <div style={{
                            fontFamily: FM,
                            fontSize: "0.54rem",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "var(--text-tertiary)",
                            fontWeight: 700,
                            marginTop: "0.42rem",
                            lineHeight: 1.45,
                        }}>
                            {kindLabel}
                        </div>
                    )}
                    <div style={{
                        fontFamily: FM,
                        fontSize: compact ? "0.72rem" : headline ? "0.72rem" : "0.66rem",
                        letterSpacing: "0.06em",
                        color: "var(--text-tertiary)",
                        marginTop: "0.32rem",
                        lineHeight: 1.7,
                    }}>
                        {isZeroWidth
                            ? fmtMonthDay(span.exactISO)
                            : <>{fmtMonthDay(span.entryISO)} → <span style={{ color: accent, fontWeight: 600 }}>{fmtMonthDay(span.exactISO)}</span> → {fmtMonthDay(span.exitISO)}</>}
                    </div>
                </div>
            </div>

            {/* Bar track */}
            <div style={{
                position: "relative",
                height: trackHeight,
                overflow: "visible",
                marginLeft: compact ? "1.85rem" : 0,
            }}>
                <div style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    height: 1,
                    background: LEDGER_RULE,
                    opacity: 0.9,
                }} />
                {/* TODAY line */}
                {todayDay !== null && todayDay >= windowStart && todayDay <= windowEnd && (
                    <div style={{
                        position: "absolute",
                        left: `${toPct(todayDay)}%`,
                        top: -20,
                        bottom: -20,
                        width: 2,
                        background: "var(--color-y2k-blue)",
                        opacity: 0.55,
                        zIndex: 2,
                    }} />
                )}

                {isZeroWidth ? (
                    /* Zero-width pin — for ingresses and station moments */
                    <div style={{
                        position: "absolute",
                        left: `${entryPct}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 2,
                        height: headline ? 24 : 18,
                        background: accent,
                        opacity: hovered ? 1 : headline ? 0.9 : 0.7,
                        borderRadius: 1,
                        transition: "opacity 150ms ease",
                    }} />
                ) : (
                    /* Wide bar — solid neutral for universal sky events. */
                    <div style={{
                        position: "absolute",
                        left: `${entryPct}%`,
                        width: `${widthPct}%`,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: barHeight,
                        borderRadius: barHeight / 2,
                        background: accent,
                        opacity: hovered ? 1 : headline ? 0.78 : 0.58,
                        transition: "opacity 150ms ease, box-shadow 150ms ease",
                        boxShadow: hovered ? `0 0 0 1px ${LEDGER_RULE}` : "none",
                    }} />
                )}
            </div>
        </div>
    );

    return (
        <TimingHoverCard
            accent={accent}
            eyebrow={`Sky · ${span.label}`}
            title={layCopy.title}
            meta={isZeroWidth
                ? fmtMonthDay(span.exactISO)
                : <>{fmtMonthDay(span.entryISO)} → {fmtMonthDay(span.exactISO)} → {fmtMonthDay(span.exitISO)}{span.dignity && span.dignity !== "neutral" ? ` · ${span.dignity}` : ""}</>}
            domain="Universal sky"
            body={<>{layCopy.body}<span style={{ display: "block", marginTop: "0.45rem", color: "var(--text-tertiary)" }}>Affects everyone, independent of where you are.</span></>}
        >
            {row}
        </TimingHoverCard>
    );
}

// Trip-grain (week) gantt: active tab domain, with "All" spanning -7d → +90d.
const TRIP_DAY_MARKERS = [-7, 0, 15, 30, 45, 60, 75, 90];

// Relocation-grain (month) gantt: active tab domain, with "All" spanning the year.
// Markers every 60 days = 7 ticks, which keeps the axis readable without
// overlapping labels at typical container widths.
const RELO_DAY_MARKERS = [0, 60, 120, 180, 240, 300, 360];

function markersForTimingTab(tab: TimingDateTab, isRelocation: boolean, compact = false): number[] {
    if (isRelocation) {
        if (tab.id === "all") return compact ? [0, 180, 360] : RELO_DAY_MARKERS;

        const [start, end] = tab.range;
        if (compact) return [start, end];

        const markers = [start];
        for (let day = Math.ceil((start + 1) / 30) * 30; day < end; day += 30) {
            markers.push(day);
        }
        if (markers[markers.length - 1] !== end) markers.push(end);
        return markers;
    }

    if (tab.id === "all") return compact ? [-7, 0, 90] : TRIP_DAY_MARKERS;
    if (tab.id === "now") return compact ? [-7, 0, 30] : [-7, 0, 15, 30];

    const [start, end] = tab.range;
    return compact ? [start, end] : [start, Math.round((start + end) / 2), end];
}

type EventLayer = "natal" | "sky";

function EventLayerToggle({
    activeLayer,
    onChange,
    natalCount,
    skyCount,
    compact = false,
}: {
    activeLayer: EventLayer;
    onChange: (layer: EventLayer) => void;
    natalCount: number;
    skyCount: number;
    compact?: boolean;
}) {
    const layers: Array<{ id: EventLayer; label: string; count: number; hint: string }> = [
        { id: "natal", label: "Natal", count: natalCount, hint: "Personal transits to your birth chart" },
        { id: "sky", label: "Sky", count: skyCount, hint: "Universal events affecting everyone" },
    ];

    return (
        <div
            role="tablist"
            aria-label="Timing event layer"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.22rem",
                padding: "0.25rem",
                background: "color-mix(in oklab, var(--surface) 72%, var(--bg))",
                border: `1px solid ${LEDGER_RULE}`,
                borderRadius: "var(--radius-sm)",
                width: compact ? "100%" : "fit-content",
            }}
        >
            <span style={{
                fontFamily: FM,
                fontSize: "0.56rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                fontWeight: 700,
                whiteSpace: "nowrap",
                padding: "0 0.42rem",
                flexShrink: 0,
            }}>
                Layer
            </span>
            {layers.map((layer) => {
                const active = layer.id === activeLayer;
                const disabled = layer.count === 0;
                return (
                    <button
                        key={layer.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={`${layer.label} events: ${layer.hint}`}
                        disabled={disabled}
                        onClick={() => onChange(layer.id)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: FM,
                            fontSize: "0.62rem",
                            letterSpacing: "0.13em",
                            textTransform: "uppercase",
                            fontWeight: active ? 700 : 500,
                            padding: compact ? "0.55rem 0.42rem 0.5rem" : "0.48rem 0.68rem 0.43rem",
                            borderWidth: 1,
                            borderStyle: "solid",
                            borderRadius: "calc(var(--radius-sm) - 2px)",
                            borderColor: active
                                ? "color-mix(in oklab, var(--color-y2k-blue) 34%, var(--surface-border))"
                                : "transparent",
                            background: active
                                ? "color-mix(in oklab, var(--color-y2k-blue) 7%, var(--surface))"
                                : "transparent",
                            color: disabled
                                ? "var(--text-tertiary)"
                                : active
                                  ? "var(--color-y2k-blue)"
                                  : "var(--text-secondary)",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.45 : 1,
                            whiteSpace: "nowrap",
                            flex: compact ? 1 : "0 0 auto",
                            textAlign: "center",
                            transition: "background 150ms ease, color 150ms ease, border-color 150ms ease, opacity 150ms ease",
                        }}
                    >
                        {layer.label}
                        <span style={{
                            marginLeft: "0.32rem",
                            fontSize: "0.58rem",
                            color: "inherit",
                            opacity: active ? 0.72 : 0.58,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                        }}>
                            {layer.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function TransitGantt({ vm }: { vm: V4VM }) {
    const { transitSpans, travelDateISO } = vm;
    const universalSkySpans = vm.universalSkySpans ?? [];
    const isRelocation = vm.timeline.grain === "month";
    const isCompact = useMediaQuery("(max-width: 760px)");
    const [activeLayerState, setActiveLayer] = useState<EventLayer>(() =>
        transitSpans.length > 0 ? "natal" : "sky",
    );
    const activeLayer: EventLayer =
        activeLayerState === "natal" && transitSpans.length === 0 && universalSkySpans.length > 0
            ? "sky"
            : activeLayerState;

    // Date-bucket tabs above the Gantt. Filter rows by overlap with the
    // active bucket. Default to "Now" / "Mo 1-3" so users see the most
    // imminent items first; "All" stays available for the wide view.
    const dateTabs: TimingDateTab[] = isRelocation ? RELOCATION_TIMING_TABS : TRIP_TIMING_TABS;
    const [activeTabId, setActiveTabId] = useState<string>(dateTabs[0].id);
    const [nowTime] = useState(() => Date.now());
    const activeTab = dateTabs.find((t) => t.id === activeTabId) ?? dateTabs[dateTabs.length - 1];

    if ((!transitSpans.length && !universalSkySpans.length) || !travelDateISO) return null;

    const filteredTransitSpans = transitSpans.filter((s) => rowInTab(s.entryDay, s.exitDay, activeTab));
    const filteredSkySpans = universalSkySpans.filter((s) => rowInTab(s.entryDay, s.exitDay, activeTab));
    const visibleTransitSpans = activeLayer === "natal" ? filteredTransitSpans : [];
    const visibleSkySpans = activeLayer === "sky" ? filteredSkySpans : [];

    // Signal vs noise: rank the selected layer by importance and split into
    // tiers. Interpretive copy stays in hover so the timeline remains scannable.
    const rankedTransits = [...visibleTransitSpans]
        .map((s) => ({ s, score: transitImportance(s, vm.goalIds) }))
        .sort((a, b) => b.score - a.score);
    const headlineTransits = rankedTransits.slice(0, 3).map((x) => x.s);
    const backdropTransits = rankedTransits.slice(3).map((x) => x.s);

    const rankedSky = [...visibleSkySpans].sort(
        (a, b) => (b.severity ?? 0) - (a.severity ?? 0),
    );
    const headlineSky = rankedSky.slice(0, 3);
    const backdropSky = rankedSky.slice(3);

    const hasBackdrop = backdropTransits.length + backdropSky.length > 0;

    // Per-tab counts for the segment-control labels — gives users a sense
    // of where the action is before they switch.
    const tabCounts: Record<string, number> = {};
    for (const tab of dateTabs) {
        const personal = transitSpans.filter((s) => rowInTab(s.entryDay, s.exitDay, tab)).length;
        const sky = universalSkySpans.filter((s) => rowInTab(s.entryDay, s.exitDay, tab)).length;
        tabCounts[tab.id] = activeLayer === "natal" ? personal : sky;
    }

    const [WINDOW_START, WINDOW_END] = activeTab.range;
    const WINDOW_RANGE = WINDOW_END - WINDOW_START;
    const DAY_MARKERS = markersForTimingTab(activeTab, isRelocation, isCompact);
    const anchorLabel = isRelocation ? "MOVE" : "TRIP";
    const formatTick = (d: number): string => {
        if (d === 0) return anchorLabel;
        if (isRelocation) {
            const months = Math.round(d / 30);
            return `+${months}mo`;
        }
        return d < 0 ? `${d}d` : `+${d}d`;
    };

    const anchorTime = new Date(travelDateISO).getTime();
    const todayDay = isFinite(anchorTime)
        ? Math.round((nowTime - anchorTime) / 86_400_000)
        : null;

    return (
        <div style={{
            background: "color-mix(in oklab, var(--surface) 56%, transparent)",
            borderTop: `1px solid ${LEDGER_RULE}`,
            borderBottom: `1px solid ${LEDGER_RULE}`,
            borderRadius: "var(--radius-sm)",
            padding: isCompact ? "0.85rem 0 0" : "clamp(1rem, 2vw, 1.35rem) 0 0",
            overflow: "visible",
        }}>
                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: isCompact ? "0.6rem" : "var(--space-md)",
                    flexWrap: "wrap",
                    margin: isCompact
                        ? "0 0.85rem 1rem"
                        : "0 clamp(1rem, 2vw, 1.35rem) var(--space-lg)",
                }}>
                    {/* Date-range tabs — filter rows by overlap with the active bucket */}
                    <TimingDateTabs
                        tabs={dateTabs}
                        activeTabId={activeTabId}
                        onTabChange={setActiveTabId}
                        counts={tabCounts}
                        compact={isCompact}
                    />
                    <EventLayerToggle
                        activeLayer={activeLayer}
                        onChange={setActiveLayer}
                        natalCount={transitSpans.length}
                        skyCount={universalSkySpans.length}
                        compact={isCompact}
                    />
                </div>

                {/* Day-marker header */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isCompact ? "minmax(0, 1fr)" : GANTT_GRID,
                    gap: isCompact ? "0.55rem" : "var(--space-lg)",
                    margin: isCompact ? "0 0.85rem" : "0 clamp(1rem, 2vw, 1.35rem)",
                    paddingBottom: isCompact ? "0.75rem" : "0.7rem",
                    borderBottom: `1px solid ${LEDGER_RULE}`,
                }}>
                    <div style={{
                        fontFamily: FM,
                        fontSize: isCompact ? "0.56rem" : "0.58rem",
                        letterSpacing: isCompact ? "0.18em" : "0.2em",
                        textTransform: "uppercase",
                        color: "var(--text-tertiary)",
                        fontWeight: 700,
                        alignSelf: "end",
                        paddingBottom: "0.1rem",
                    }}>
                        Ephemeris
                    </div>
                    <div style={{ position: "relative", height: isCompact ? 34 : 38 }}>
                        {DAY_MARKERS.map((d, i) => {
                            const align = i === 0 ? "flex-start" : i === DAY_MARKERS.length - 1 ? "flex-end" : "center";
                            const transform = i === 0 ? "none" : i === DAY_MARKERS.length - 1 ? "translateX(-100%)" : "translateX(-50%)";
                            const pct = ((d - WINDOW_START) / WINDOW_RANGE) * 100;
                            return (
                                <div
                                    key={d}
                                    style={{
                                        position: "absolute",
                                        left: `${pct}%`,
                                        transform,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: align,
                                        gap: "2px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: FM,
                                            fontSize: isCompact ? "0.62rem" : "0.68rem",
                                            fontWeight: 600,
                                            letterSpacing: isCompact ? "0.03em" : "0.06em",
                                            color: "var(--text-secondary)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {fmtAnchorOffset(travelDateISO, d)}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: FM,
                                            fontSize: isCompact ? "0.58rem" : "0.66rem",
                                            letterSpacing: isCompact ? "0.12em" : "0.16em",
                                            textTransform: "uppercase",
                                            color: "var(--text-tertiary)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {formatTick(d)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tier 1 — Headlines. The 3-5 most consequential rows in
                    this window get full prominence. */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    margin: isCompact ? "0 0.85rem" : "0 clamp(1rem, 2vw, 1.35rem)",
                }}>
                    {(headlineTransits.length > 0 || headlineSky.length > 0) && (
                        <div style={{
                            fontFamily: FM,
                            fontSize: isCompact ? "0.58rem" : "0.6rem",
                            letterSpacing: isCompact ? "0.18em" : "0.2em",
                            textTransform: "uppercase",
                            color: "var(--text-tertiary)",
                            fontWeight: 700,
                            padding: isCompact ? "0.9rem 0 0.3rem" : "0.85rem 0 0.25rem",
                        }}>
                            What matters most here
                        </div>
                    )}
                    {headlineTransits.map((span, i) => (
                        <GanttRow
                            key={`hl-${span.transit_planet}|${span.natal_planet}|${span.aspect}|${i}`}
                            span={span}
                            windowStart={WINDOW_START}
                            windowEnd={WINDOW_END}
                            anchorISO={travelDateISO}
                            todayDay={todayDay}
                            compact={isCompact}
                            headline
                        />
                    ))}
                    {headlineSky.map((span, i) => (
                        <SkyGanttRow
                            key={span.key ?? `hl-sky|${span.kind}|${span.planet}|${span.exactISO}|${i}`}
                            span={span}
                            windowStart={WINDOW_START}
                            windowEnd={WINDOW_END}
                            todayDay={todayDay}
                            compact={isCompact}
                            headline
                        />
                    ))}

                    {visibleTransitSpans.length === 0 && visibleSkySpans.length === 0 && (
                        <div style={{
                            padding: "var(--space-md) 0",
                            fontFamily: FB,
                            fontSize: "0.85rem",
                            color: "var(--text-tertiary)",
                            fontStyle: "italic",
                            textAlign: "center",
                        }}>
                            No {activeLayer === "natal" ? "natal" : "sky"} events in this date range. Try another tab.
                        </div>
                    )}

                    {/* Tier 2 — Backdrop. Lower-importance rows tucked into a
                        disclosure so the headlines breathe. */}
                    {hasBackdrop && (
                        <details style={{ marginTop: "0.25rem" }}>
                            <summary style={{
                                fontFamily: FM,
                                fontSize: "0.65rem",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: "var(--text-tertiary)",
                                fontWeight: 600,
                                padding: "0.65rem 0",
                                cursor: "pointer",
                                listStyle: "none",
                                borderTop: `1px dashed ${LEDGER_RULE}`,
                            }}>
                                Additional ({backdropTransits.length + backdropSky.length} more) ▾
                            </summary>
                            <div style={{ paddingTop: "0.3rem" }}>
                                {backdropTransits.map((span, i) => (
                                    <GanttRow
                                        key={`bd-${span.transit_planet}|${span.natal_planet}|${span.aspect}|${i}`}
                                        span={span}
                                        windowStart={WINDOW_START}
                                        windowEnd={WINDOW_END}
                                        anchorISO={travelDateISO}
                                        todayDay={todayDay}
                                        compact={isCompact}
                                    />
                                ))}
                                {backdropSky.map((span, i) => (
                                    <SkyGanttRow
                                        key={span.key ?? `bd-sky|${span.kind}|${span.planet}|${span.exactISO}|${i}`}
                                        span={span}
                                        windowStart={WINDOW_START}
                                        windowEnd={WINDOW_END}
                                        todayDay={todayDay}
                                        compact={isCompact}
                                    />
                                ))}
                            </div>
                        </details>
                    )}
                </div>

                <div style={{
                    marginTop: "var(--space-md)",
                    padding: isCompact
                        ? "0.8rem 0.85rem 1rem"
                        : "0.75rem clamp(1rem, 2vw, 1.35rem) 0.9rem",
                    borderTop: `1px solid ${LEDGER_RULE}`,
                    display: "flex",
                    gap: isCompact ? "0.7rem 1rem" : "var(--space-md)",
                    flexWrap: "wrap",
                    alignItems: "center",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{ width: 16, height: 5, borderRadius: 3, background: "var(--sage)", opacity: 0.65 }} />
                        <span style={{ fontFamily: FM, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Lift</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{ width: 16, height: 5, borderRadius: 3, background: "var(--color-spiced-life)", opacity: 0.65 }} />
                        <span style={{ fontFamily: FM, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Friction</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{
                            width: 16,
                            height: 5,
                            borderRadius: 3,
                            background: SKY_LEDGER,
                            opacity: 0.7,
                        }} />
                        <span style={{ fontFamily: FM, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Sky (everyone)</span>
                    </div>
                    {todayDay !== null && todayDay >= WINDOW_START && todayDay <= WINDOW_END && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <div style={{ width: 1, height: 12, background: "var(--color-y2k-blue)", opacity: 0.7 }} />
                            <span style={{ fontFamily: FM, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-y2k-blue)" }}>Today</span>
                        </div>
                    )}
                    <span style={{
                        fontFamily: FB,
                        fontSize: "0.66rem",
                        fontStyle: "italic",
                        color: "var(--text-tertiary)",
                        marginLeft: isCompact ? 0 : "auto",
                        width: isCompact ? "100%" : "auto",
                        textAlign: isCompact ? "left" : "right",
                    }}>
                        {isCompact ? "Tap any bar for detail" : "Hover any bar for detail"}
                    </span>
                </div>
            </div>
    );
}

// ─── Compact alternates list ─────────────────────────────────────────────────

// ─── Top travel windows ──────────────────────────────────────────────────────

import { WindowsList } from "../parts/WindowsList";

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function TimingTab({ vm, copiedTab }: Props) {
    const isRelocation = vm.timeline.grain === "month";
    const hasGoodOrBad = vm.rangeHighlights.good.length + vm.rangeHighlights.bad.length > 0;
    // Trip alternates appear when we have ranked nearby weeks. Relocation
    // alternates appear when we have ranked arrival months — index 0 is the
    // user's anchor month, so length > 1 means there are alternates to show.
    const showAlternates = isRelocation
        ? vm.travelWindows.length > 1
        : vm.travelType === "trip" && hasGoodOrBad;

    const tabLead = copiedTab?.lead?.trim() || "";
    const tabIntro = copiedTab?.plainEnglishSummary || undefined;
    const advice = vm.tabs.timing?.activationAdvice ?? [];
    const mainWindow = vm.travelWindows[0];
    const timingGuideRows = [
        {
            label: "Green-light window",
            badgeVariant: "timing-window" as const,
            body: advice[0]
                || (mainWindow ? `${mainWindow.dates} has the most lift. Put the plans you care about most inside this stretch.` : "Use the clearest window for the focused part of the trip."),
        },
        {
            label: "Keep an eye here",
            badgeVariant: "timing-watch" as const,
            body: advice[2] || "Treat these like weather-check days: keep promises smaller, add buffer, and avoid overbooking.",
        },
        {
            label: "How to pace it",
            badgeVariant: "timing-pace" as const,
            body: advice[1] || "Book the important thing first, then leave open space around it for rest, changes, and recovery.",
        },
    ];

    return (
        <TabSection
            kicker="Timing"
            title="When to use what this place offers."
            lead={tabLead}
            intro={tabIntro}
            guideRows={timingGuideRows}
            preserveGuideLabels
        >
            {/* Verdict — one deterministic sentence carries the intro role */}
            <VerdictHeadline vm={vm} />

            {/* §1 — Top travel windows (trip) / Best months to arrive (relocation) */}
            {showAlternates && (
                <>
                    <SectionHead
                        index="01"
                        title={isRelocation ? "Best months to arrive" : "Top travel windows"}
                        tooltip={isRelocation
                            ? "Each candidate is scored by your first 90 days at the new place if you arrived then — front-weighted because the early weeks dominate whether the move sticks."
                            : "Comparable nearby windows ranked by score. Use these if your dates are flexible. ↑Δ marks how much each beats your selected window."}
                    />
                    <WindowsList vm={vm} />
                </>
            )}

            {/* §2 — Transit Gantt. Framing prose sits above the SectionHead
                so readers know how to read the chart before they meet the
                section title. SectionHead is flush so we don't stack two
                vertical breaks on top of each other. */}
            <WindowFraming vm={vm} />
            <div style={{ marginTop: "var(--space-md)" }}>
                <SectionHead
                    index={showAlternates ? "02" : "01"}
                    title={isRelocation
                        ? "Slow transits across the year ahead"
                        : "What's pressing on you during the window"}
                    tooltip={isRelocation
                        ? "Outer-planet transits resolve over months, not days. Each bar is one transit's full active range; hover for the lived-experience reading."
                        : "Slow-moving transits that actually shape this stretch. Hover any bar for the lived-experience reading and what to do with it."}
                    flush
                />
            </div>
            <TransitGantt vm={vm} />

            {/* §3 — 90-day field (trip) / 12-month forecast (relocation) */}
            <SectionHead
                index={showAlternates ? "03" : "02"}
                title={isRelocation
                    ? "The next 12 months at this place"
                    : "The 90-day field around your trip"}
                tooltip={isRelocation
                    ? "What each month at this place actually feels like, taken on its own. Sage = lift, gold = mixed, coral = friction. Blue is your move month."
                    : "Each bar is one day. Taller, sage and gold = more support. Red = friction. Blue is your trip; green ▼ marks open stretches, red ▼ marks rougher ones."}
            />
            <FieldSummary vm={vm} />

            {/* AI Closing Verdict */}
            {vm.tabs.timing?.closingVerdict && (
                <div 
                    className="mt-[clamp(64px,8vw,96px)] pt-[clamp(48px,6vw,64px)] border-t"
                    style={{ borderColor: "var(--surface-border)" }}
                >
                    <h4 
                        className="m-0 mb-4 text-[11px] tracking-[0.2em] uppercase"
                        style={{ fontFamily: FM, color: "var(--text-tertiary)" }}
                    >
                        Final Verdict
                    </h4>
                    <p 
                        className="m-0 leading-[1.25] tracking-[-0.01em] [text-wrap:balance]"
                        style={{ 
                            fontFamily: FP, 
                            fontSize: "clamp(26px, 3vw, 36px)",
                            color: "var(--text-primary)" 
                        }}
                    >
                        <RichText>{vm.tabs.timing.closingVerdict}</RichText>
                    </p>
                </div>
            )}

        </TabSection>
    );
}
