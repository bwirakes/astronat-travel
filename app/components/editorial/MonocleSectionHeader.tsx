"use client";

/**
 * Heavy-weight chapter header in the Monocle direction. Renders a 3px
 * solid bar above a filled tile carrying the title — used for top-level
 * chapter divisions (e.g. "The Architecture", "Aspect Geometry") that
 * deserve more weight than {@link SectionHead}'s hairline rule.
 *
 * Extracted from chart/ChartClient so couples and any future editorial
 * surface can adopt the same chapter chrome without re-rolling it.
 */
export default function MonocleSectionHeader({ title }: { title: string }) {
    return (
        <div className="mb-6">
            <div className="w-full h-[3px] bg-[var(--text-primary)] mb-[2px]" />
            <div
                className="py-2 px-3 border-b border-[var(--text-primary)]"
                style={{ background: "color-mix(in srgb, var(--surface-border) 40%, transparent)" }}
            >
                <h2
                    className="m-0"
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "0.02em",
                    }}
                >
                    {title}
                </h2>
            </div>
        </div>
    );
}
