"use client";

import { useState } from "react";
import SectionHead from "../../shared/SectionHead";
import TabSection from "../../shared/TabSection";
import type { V4VM } from "./types";
import { transitOneLiner } from "@/app/lib/transit-copy";
import type { TransitSpan } from "@/app/lib/window-scoring";
import { PLANET_GLYPH } from "@/app/lib/geodetic-weather-types";
import { WINDOW_LABELS, WINDOW_RATIONALES, verdictBand, verdictTone } from "@/app/lib/verdict";

interface Props {
    vm: V4VM;
    copiedTab?: {
        lead?: string;
        plainEnglishSummary?: string;
        evidenceCaption?: string;
        nextTabBridge?: string;
    };
}

const FM = "var(--font-mono)";
const FB = "var(--font-body)";
const FP = "var(--font-primary)";

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

// ─── Verdict headline ───────────────────────────────────────────────────────

const GOAL_LABEL_SHORT: Record<string, string> = {
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

// ─── §1 Field Summary ────────────────────────────────────────────────────────

function FieldSummary({ vm }: { vm: V4VM }) {
    const { dailySeries, timingPercentile, travelWindows, travelDateISO, rangeHighlights } = vm;
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
        ? Math.round((new Date(travelDateISO).getTime() - Date.now()) / 86_400_000)
        : null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            <p style={{ fontFamily: FB, fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                {daysToTrip !== null && daysToTrip > 0 && (
                    <>You're <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{daysToTrip} {daysToTrip === 1 ? "day" : "days"}</strong> out from this trip. </>
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

// ─── Transit Gantt ───────────────────────────────────────────────────────────

function planetGlyph(name: string): string {
    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return PLANET_GLYPH[key] ?? "✦";
}

function GanttRow({
    span,
    windowStart,
    windowEnd,
    todayDay,
}: {
    span: TransitSpan;
    windowStart: number;
    windowEnd: number;
    todayDay: number | null;
}) {
    const [hovered, setHovered] = useState(false);
    const range = windowEnd - windowStart;
    const toPct = (day: number) => ((day - windowStart) / range) * 100;

    const clampedEntry = Math.max(windowStart, span.entryDay);
    const clampedExit  = Math.min(windowEnd, span.exitDay);
    if (clampedEntry >= clampedExit) return null;

    const entryPct = toPct(clampedEntry);
    const widthPct = toPct(clampedExit) - entryPct;

    const accent = span.benefic ? "var(--sage)" : "var(--color-spiced-life)";
    const meaning = transitOneLiner(span);

    // Tooltip horizontal anchor: center over the bar, but clamp so it doesn't
    // overflow the right edge of the track.
    const centerPct = entryPct + widthPct / 2;
    const tooltipLeft = Math.max(22, Math.min(78, centerPct));

    return (
        <div
            style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "var(--space-sm)", alignItems: "center", padding: "0.55rem 0" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Row label */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                <span style={{ fontSize: "1rem", color: accent, flexShrink: 0 }}>{planetGlyph(span.transit_planet)}</span>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FB, fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {span.transit_planet}
                        {span.retrograde && (
                            <span style={{ marginLeft: 4, fontFamily: FM, fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 500 }}>℞</span>
                        )}
                    </div>
                    <div style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {span.aspect} {span.natal_planet}
                    </div>
                </div>
            </div>

            {/* Bar track — overflow visible so tooltip can extend out */}
            <div style={{ position: "relative", height: 24, overflow: "visible" }}>
                {/* TODAY line */}
                {todayDay !== null && todayDay >= windowStart && todayDay <= windowEnd && (
                    <div style={{
                        position: "absolute",
                        left: `${toPct(todayDay)}%`,
                        top: -4,
                        bottom: -4,
                        width: 1,
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
                    height: 12,
                    borderRadius: 6,
                    background: accent,
                    opacity: hovered ? 1 : 0.65,
                    transition: "opacity 150ms ease, transform 150ms ease",
                    boxShadow: hovered ? `0 2px 8px color-mix(in oklab, ${accent} 40%, transparent)` : "none",
                }} />

                {/* Hover tooltip — astrological context for THIS transit */}
                {hovered && (
                    <div style={{
                        position: "absolute",
                        left: `${tooltipLeft}%`,
                        bottom: "calc(100% + 10px)",
                        transform: "translateX(-50%)",
                        zIndex: 30,
                        background: "var(--color-charcoal)",
                        color: "var(--color-eggshell)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.6rem 0.85rem",
                        minWidth: 240,
                        maxWidth: 320,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.32)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.45rem",
                        pointerEvents: "none",
                    }}>
                        <div style={{ fontFamily: FM, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>
                            {span.transit_planet}{span.retrograde ? " ℞" : ""} {span.aspect} natal {span.natal_planet}
                        </div>
                        <div style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.04em", color: "var(--color-eggshell)", opacity: 0.7 }}>
                            {fmtMonthDay(span.entryISO)} → <span style={{ color: accent, fontWeight: 700, opacity: 1 }}>{fmtMonthDay(span.exactISO)}</span> → {fmtMonthDay(span.exitISO)} · {span.peak_orb.toFixed(1)}° orb
                        </div>
                        {meaning && (
                            <div style={{ fontFamily: FB, fontSize: "0.82rem", lineHeight: 1.45, color: "var(--color-eggshell)", fontStyle: "italic" }}>
                                {meaning}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const WINDOW_START = -7;
const WINDOW_END   = 90;
const WINDOW_RANGE = WINDOW_END - WINDOW_START;
const DAY_MARKERS = [-7, 0, 15, 30, 45, 60, 75, 90];

function TransitGantt({ vm }: { vm: V4VM }) {
    const { transitSpans, travelDateISO } = vm;
    if (!transitSpans.length || !travelDateISO) return null;

    const anchorTime = new Date(travelDateISO).getTime();
    const todayDay = isFinite(anchorTime)
        ? Math.round((Date.now() - anchorTime) / 86_400_000)
        : null;

    return (
        <div style={{
            background: "var(--surface)",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md) var(--space-md) var(--space-sm)",
            paddingTop: "calc(var(--space-md) + 36px)", // headroom for the small tooltip on top row
            overflow: "visible",
        }}>
                {/* Day-marker header */}
                <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                    <div />
                    <div style={{ position: "relative", height: 32 }}>
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
                                            fontSize: "0.68rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.06em",
                                            color: "var(--text-secondary)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {fmtAnchorOffset(travelDateISO, d)}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: FM,
                                            fontSize: "0.66rem",
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: "var(--text-tertiary)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {d === 0 ? "TRIP" : d < 0 ? `${d}d` : `+${d}d`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rows */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {transitSpans.map((span, i) => (
                        <GanttRow
                            key={`${span.transit_planet}|${span.natal_planet}|${span.aspect}|${i}`}
                            span={span}
                            windowStart={WINDOW_START}
                            windowEnd={WINDOW_END}
                            todayDay={todayDay}
                        />
                    ))}
                </div>

                <div style={{ marginTop: "var(--space-sm)", display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{ width: 20, height: 6, borderRadius: 3, background: "var(--sage)", opacity: 0.7 }} />
                        <span style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Supportive</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{ width: 20, height: 6, borderRadius: 3, background: "var(--color-spiced-life)", opacity: 0.7 }} />
                        <span style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Friction</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{ width: 2, height: 12, borderRadius: 1, background: "var(--text-tertiary)", opacity: 0.5 }} />
                        <span style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Exact</span>
                    </div>
                    {todayDay !== null && todayDay >= WINDOW_START && todayDay <= WINDOW_END && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <div style={{ width: 1, height: 12, background: "var(--color-y2k-blue)", opacity: 0.7 }} />
                            <span style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-y2k-blue)" }}>Today</span>
                        </div>
                    )}
                    {transitSpans.some(s => s.retrograde) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span style={{ fontFamily: FM, fontSize: "0.7rem", color: "var(--text-tertiary)" }}>℞</span>
                            <span style={{ fontFamily: FM, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Retrograde — a revisit</span>
                        </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <span style={{ fontFamily: FB, fontSize: "0.66rem", fontStyle: "italic", color: "var(--text-tertiary)" }}>Hover a bar for detail</span>
                    </div>
                </div>
            </div>
    );
}

// ─── Compact alternates list ─────────────────────────────────────────────────

// ─── Top travel windows ──────────────────────────────────────────────────────

import { WindowsList } from "../parts/WindowsList";

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function TimingTab({ vm, copiedTab }: Props) {
    const hasGoodOrBad = vm.rangeHighlights.good.length + vm.rangeHighlights.bad.length > 0;
    const showAlternates = vm.travelType === "trip" && hasGoodOrBad;

    const tabLead = copiedTab?.lead?.trim() || "";
    const tabIntro = copiedTab?.plainEnglishSummary || undefined;

    return (
        <TabSection
            kicker="Timing"
            title="When to use what this place offers."
            lead={tabLead}
            intro={tabIntro}
        >
            {/* Verdict — one deterministic sentence carries the intro role */}
            <VerdictHeadline vm={vm} />

            {/* AI Activation Advice */}
            {vm.tabs.timing?.activationAdvice && vm.tabs.timing.activationAdvice.length > 0 && (
                <div 
                    className="mt-[clamp(32px,4vw,48px)] mb-[clamp(48px,6vw,64px)] p-[clamp(24px,3vw,32px)] rounded-[var(--radius-lg)] border"
                    style={{ 
                        background: "var(--surface)", 
                        borderColor: "var(--surface-border)" 
                    }}
                >
                    <h4 
                        className="m-0 mb-5 text-[11px] tracking-[0.2em] uppercase"
                        style={{ fontFamily: FM, color: "var(--color-y2k-blue)" }}
                    >
                        Strategic Advice
                    </h4>
                    <ul className="flex flex-col gap-[16px] m-0 p-0 list-none">
                        {vm.tabs.timing.activationAdvice.map((advice, i) => (
                            <li key={i} className="flex items-start gap-[12px]">
                                <span 
                                    className="text-[14px] mt-[4px]"
                                    style={{ color: "var(--color-y2k-blue)" }}
                                >
                                    ✦
                                </span>
                                <span 
                                    className="m-0 text-[clamp(16px,1.5vw,18px)] leading-[1.6] [text-wrap:pretty]"
                                    style={{ fontFamily: FB, color: "var(--text-primary)", fontWeight: 400 }}
                                >
                                    {advice}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* §1 — Top travel windows (alternates), trip only */}
            {showAlternates && (
                <>
                    <SectionHead
                        index="01"
                        title="Top travel windows"
                        tooltip="Comparable nearby windows ranked by score. Use these if your dates are flexible. ↑Δ marks how much each beats your selected window."
                    />
                    <WindowsList vm={vm} />
                </>
            )}

            {/* §2 — Transit Gantt */}
            <SectionHead
                index={showAlternates ? "02" : "01"}
                title="What's pressing on you during the window"
                tooltip="Slow-moving transits that actually shape this stretch. Hover any bar for the lived-experience reading and what to do with it."
            />
            <TransitGantt vm={vm} />

            {/* §3 — 90-day field */}
            <SectionHead
                index={showAlternates ? "03" : "02"}
                title="The 90-day field around your trip"
                tooltip="Each bar is one day. Taller, sage and gold = more support. Red = friction. Blue is your trip; green ▼ marks open stretches, red ▼ marks rougher ones."
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
                        {vm.tabs.timing.closingVerdict}
                    </p>
                </div>
            )}

        </TabSection>
    );
}
