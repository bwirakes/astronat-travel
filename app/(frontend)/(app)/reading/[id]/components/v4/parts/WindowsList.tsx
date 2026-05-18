import type { V4VM } from "../tabs/types";
import {
    parseTimingHits,
    scoreTone,
    TimingLedgerRow,
    type TimingReceipt,
} from "./TimingLedgerRow";

function isClearTimingNote(note: string | undefined): boolean {
    const text = String(note ?? "");
    if (/\b(pressures|supports|turns up|activating)\b/i.test(text)) return false;
    return /\b(natal|retrograde|square|squares|opposes|opposition|trine|trines|sextile|sextiles|conjoins|conjunct)\b/i.test(text);
}

export function WindowsList({ vm, limit }: { vm: V4VM, limit?: number }) {
    const primary = vm.travelWindows[0];
    if (!primary) return null;

    const normalizeDates = (d: string) => d.replace(/[\s\-\–\—,]+/g, '').toLowerCase().replace(/\d{4}$/, '');

    // Cached-reading bridge only. New teacher readings no longer emit legacy
    // `windows`, but older readings may still carry AI-written notes here.
    // Trip readings get matches via the date-range key. Relocation readings
    // use month labels ("October 2026") which won't match the trip-shaped AI
    // notes — they fall through to the deterministic driver string instead.
    const aiWindows = vm.tabs.timing?.aiWindows ?? [];
    const aiNoteForDates = (dates: string): string | undefined => {
        const norm = normalizeDates(dates);
        return aiWindows.find(w => normalizeDates(w.dates) === norm)?.note;
    };

    type ComparisonRole = "myTime" | "bestTime" | "avoid";
    const byScoreDesc = [...vm.travelWindows].sort((a, b) => b.score - a.score);
    const byScoreAsc = [...vm.travelWindows].sort((a, b) => a.score - b.score);
    const comparisonRows = [
        { role: "myTime" as const, label: "My Time", window: primary },
        { role: "bestTime" as const, label: "Best Time", window: byScoreDesc[0] ?? primary },
        { role: "avoid" as const, label: "Avoid", window: byScoreAsc[0] ?? primary },
    ];
    const comparisonCopy = vm.tabs.timing?.windowComparison;
    const cleanRationale = (value: string | undefined): string | undefined => {
        const text = String(value ?? "").replace(/\s+/g, " ").trim();
        if (!text) return undefined;
        if (/\b(use it for the main plan|plans get help from growth|supports|turns up|pressures|activating)\b/i.test(text)) return undefined;
        return text;
    };
    const receiptEffect = (hit: TimingReceipt | undefined): string => {
        if (!hit) return "The score is useful, but the details still need a practical check";
        if (hit.tone === "watch") return `${hit.receipt} adds pressure`;
        if (hit.tone === "good") return `${hit.receipt} gives support`;
        return `${hit.receipt} makes the timing louder`;
    };
    const fallbackRationale = (
        role: ComparisonRole,
        score: number,
        receipts: TimingReceipt[],
    ): string => {
        const effect = receiptEffect(receipts[0]);
        if (role === "myTime") {
            return score >= 70
                ? `Your dates are usable, but they still need focus. ${effect}, so put your most important plans here.`
                : `Your dates can work only with a simpler plan. ${effect}, so keep extra room in the schedule.`;
        }
        if (role === "bestTime") {
            const bestAction = receipts[0]?.tone === "watch" && /\bSaturn\b/i.test(receipts[0].receipt)
                ? "structure helps your plan"
                : "that pattern helps your plan";
            return score > primary.score
                ? `Higher score, but not automatically easier. ${effect}, so use this only if ${bestAction}.`
                : `Your dates are already the strongest scored option. ${effect}, so keep the plan focused.`;
        }
        return `This is the least clean option in the set. ${effect}, so keep high-stakes plans away from it.`;
    };

    let rows = comparisonRows.map(({ role, label, window }) => {
        const aiNote = aiNoteForDates(window.dates);
        const drivers = aiNote && isClearTimingNote(aiNote) ? aiNote : window.note;
        const receipts = parseTimingHits(drivers);

        return {
            role,
            label,
            dates: window.dates,
            score: window.score,
            drivers,
            receipts,
            rationale: cleanRationale(comparisonCopy?.[role]?.rationale)
                ?? fallbackRationale(role, window.score, receipts),
        };
    });

    if (limit) {
        rows = rows.slice(0, limit);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((r, i) => {
                const tone = r.role === "avoid" ? "hard" : scoreTone(r.score);
                const scoreLabel =
                    tone === "good" ? "Good" :
                    tone === "moderate" ? "Moderate" :
                    "Hard";

                return (
                    <TimingLedgerRow
                        key={`${r.role}-${r.dates}-${i}`}
                        label={r.label}
                        title={r.dates}
                        tone={tone}
                        score={r.score}
                        scoreLabel={scoreLabel}
                        receipts={r.receipts}
                        rationale={r.rationale}
                        fallback={r.receipts.length ? undefined : r.rationale}
                    />
                );
            })}
        </div>
    );
}
