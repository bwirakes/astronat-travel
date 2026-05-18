import type { CSSProperties, ReactNode } from "react";

type ReadingTone = "blue" | "acqua" | "spiced" | "gold" | "neutral";

const TONE_STYLES: Record<ReadingTone, CSSProperties> = {
    blue: {
        background: "var(--color-y2k-blue)",
        color: "var(--text-on-y2k-blue)",
    },
    acqua: {
        background: "var(--reading-chip-acqua)",
        color: "var(--color-charcoal)",
    },
    spiced: {
        background: "var(--reading-chip-spiced)",
        color: "var(--color-charcoal)",
    },
    gold: {
        background: "var(--gold)",
        color: "var(--color-charcoal)",
    },
    neutral: {
        background: "color-mix(in oklab, var(--text-primary) 8%, transparent)",
        color: "var(--text-primary)",
    },
};

export function ReadingTonePill({
    tone = "neutral",
    children,
    className = "",
}: {
    tone?: ReadingTone;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em] ${className}`}
            style={{ fontFamily: "var(--font-mono)", ...TONE_STYLES[tone] }}
        >
            {children}
        </span>
    );
}
