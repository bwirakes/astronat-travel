import React from "react";
import type { V4VM } from "../tabs/types";
import { RichText } from "../../shared/ReadingCopy";

const FM = "var(--font-mono)";
const FB = "var(--font-body)";

function scoreTone(score: number): "good" | "moderate" | "hard" {
    if (score >= 70) return "good";
    if (score >= 55) return "moderate";
    return "hard";
}

export function WindowsList({ vm, limit }: { vm: V4VM, limit?: number }) {
    const primary = vm.travelWindows[0];
    if (!primary) return null;

    const normalizeDates = (d: string) => d.replace(/[\s\-\–\—,]+/g, '').toLowerCase().replace(/\d{4}$/, '');

    // AI-written plain-English window notes, keyed by date range string.
    // Trip readings get matches via the date-range key. Relocation readings
    // use month labels ("October 2026") which won't match the trip-shaped AI
    // notes — they fall through to the deterministic driver string instead.
    const aiWindows = vm.tabs.timing?.aiWindows ?? [];
    const aiNoteForDates = (dates: string): string | undefined => {
        const norm = normalizeDates(dates);
        return aiWindows.find(w => normalizeDates(w.dates) === norm)?.note;
    };

    let rows = vm.travelWindows.map((w, i) => {
        // Index 0 is always the user's anchor (trip dates / move month).
        // For trips, "Worst window" is a flavor sentinel from buildRangeHighlights.
        // For relocations there's no "worst" — alternates are all strong-by-rank.
        let kind: "your" | "best" | "worst" = "best";
        if (i === 0) kind = "your";
        else if (w.flavor === "Worst window") kind = "worst";

        return {
            kind,
            label: w.flavorTitle || w.flavor,
            dates: w.dates,
            score: w.score,
            drivers: aiNoteForDates(w.dates) || w.note,
        };
    });

    if (limit) {
        rows = rows.slice(0, limit);
    }

    return (
        <div className="reading-card reading-card--accent" style={{ display: "flex", flexDirection: "column", padding: "0 clamp(1rem, 2vw, 1.35rem)" }}>
            {rows.map((r, i) => {
                const tone = scoreTone(r.score);
                const scoreLabel =
                    tone === "good" ? "Good" :
                    tone === "moderate" ? "Moderate" :
                    "Hard";
                const label =
                    r.kind === "your" ? "Your dates" :
                    r.kind === "worst" ? `Watch ${i}` :
                    `Window ${i}`;
                return (
                    <div
                        className={`travel-window-row travel-window-row--${tone}`}
                        key={i}
                    >
                        <div className="travel-window-label" style={{ fontFamily: FM }}>
                            <span className="travel-window-dot" aria-hidden="true" />
                            <span>
                                {label}
                            </span>
                        </div>
                        <div className="travel-window-copy">
                            <span className="travel-window-dates">
                                {r.dates}
                            </span>
                            <span className="travel-window-note" style={{ fontFamily: FB }}>
                                <RichText>{r.drivers}</RichText>
                            </span>
                        </div>
                        <span className="travel-window-score" aria-label={`${scoreLabel} importance score: ${r.score} out of 100`}>
                            <span>{r.score}</span><span>/100</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
