import React from "react";
import type { V4VM } from "../HundredOneReadingView";

const FM = "var(--font-mono)";
const FB = "var(--font-body)";

export function WindowsList({ vm, limit }: { vm: V4VM, limit?: number }) {
    if (vm.travelType !== "trip") return null;
    const primary = vm.travelWindows[0];
    if (!primary) return null;

    const normalizeDates = (d: string) => d.replace(/[\s\-\–\—,]+/g, '').toLowerCase().replace(/\d{4}$/, '');
    
    // AI-written plain-English window notes, keyed by date range string.
    const aiWindows: { dates: string; note: string }[] =
        (vm.tabs.timing as any)?.aiWindows ?? [];
    const aiNoteForDates = (dates: string): string | undefined => {
        const norm = normalizeDates(dates);
        return aiWindows.find(w => normalizeDates(w.dates) === norm)?.note;
    };

    let rows = vm.travelWindows.map((w, i) => {
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
        <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((r, i) => {
                const accent =
                    r.kind === "your"  ? "var(--color-y2k-blue)" :
                    r.kind === "best"  ? "var(--sage)" :
                                         "var(--color-spiced-life)";
                return (
                    <div
                        key={i}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(140px, 0.9fr) minmax(0, 2.4fr) auto",
                            columnGap: "var(--space-lg)",
                            alignItems: "baseline",
                            padding: "1rem 0",
                            borderBottom: "1px solid var(--surface-border)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, display: "inline-block", flexShrink: 0, alignSelf: "center" }} />
                            <span style={{ fontFamily: FM, fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 600 }}>
                                {r.label}
                            </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: 0 }}>
                            <span style={{ fontFamily: "var(--font-secondary, var(--font-primary))", fontSize: "1.15rem", color: "var(--text-primary)", lineHeight: 1.2, letterSpacing: "-0.005em" }}>
                                {r.dates}
                            </span>
                            <span style={{ fontFamily: FB, fontSize: "0.88rem", lineHeight: 1.5, color: "var(--text-secondary)" }}>
                                {r.drivers}
                            </span>
                        </div>
                        <span style={{ fontFamily: FM, fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
                            {r.score}<span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>/100</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
