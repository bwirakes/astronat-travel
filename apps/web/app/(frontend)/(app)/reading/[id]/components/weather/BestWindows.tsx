"use client";

import type { GWTravelWindow } from "@/app/lib/geodetic-weather-types";

interface Props {
    windows: GWTravelWindow[];
}

function accentForRank(rank: string): string {
    const r = rank.toLowerCase();
    if (r.includes("best")) return "var(--color-spiced-life)";
    if (r.includes("meet") || r.includes("people")) return "var(--gold)";
    return "var(--color-y2k-blue)";
}

export function BestWindows({ windows }: Props) {
    const sorted = [...(windows ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return (
        <section
            aria-label="Best travel windows"
            style={{ display: "flex", flexDirection: "column", gap: "clamp(1rem, 2vw, 1.5rem)" }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "1rem",
                }}
            >
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.28em",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    Best travel windows
                </div>
            </div>

            {sorted.length === 0 ? (
                <div
                    style={{
                        padding: "clamp(1.5rem, 3vw, 2rem)",
                        border: "1px dashed var(--surface-border)",
                        borderRadius: "var(--radius-md)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                        color: "var(--text-secondary)",
                        textAlign: "center",
                    }}
                >
                    Click <strong>Regenerate</strong> above to populate travel windows for this reading.
                </div>
            ) : (
                <div
                    className="grid grid-cols-1 md:grid-cols-3"
                    style={{
                        border: "1px solid var(--surface-border)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--surface)",
                        overflow: "hidden",
                    }}
                >
                    {sorted.slice(0, 3).map((w, i) => {
                        const accent = accentForRank(w.rank);
                        const isLast = i === sorted.slice(0, 3).length - 1;
                        return (
                            <article
                                key={i}
                                style={{
                                    padding: "clamp(1.25rem, 2.5vw, 1.75rem)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.6rem",
                                    borderRight: isLast ? "none" : "1px solid var(--surface-border)",
                                }}
                            >
                                {/* rank + score row */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.45rem",
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "0.58rem",
                                            letterSpacing: "0.22em",
                                            color: accent,
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span
                                            aria-hidden
                                            style={{
                                                width: 7,
                                                height: 7,
                                                borderRadius: "50%",
                                                background: accent,
                                            }}
                                        />
                                        {w.rank}
                                    </div>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-primary)",
                                            fontSize: "1.75rem",
                                            color: "var(--color-spiced-life)",
                                            lineHeight: 1,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {Math.round(w.score)}
                                    </span>
                                </div>

                                {/* date range */}
                                <h3
                                    style={{
                                        fontFamily: "var(--font-primary)",
                                        fontSize: "clamp(1.35rem, 2.5vw, 1.75rem)",
                                        lineHeight: 1.1,
                                        letterSpacing: "-0.01em",
                                        margin: 0,
                                        color: "var(--text-primary)",
                                        fontWeight: 400,
                                    }}
                                >
                                    {w.dates}
                                </h3>

                                {/* nights */}
                                <div
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.58rem",
                                        letterSpacing: "0.22em",
                                        color: "var(--text-tertiary)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    {w.nights} {w.nights === 1 ? "night" : "nights"}
                                </div>

                                {/* bar */}
                                <div
                                    style={{
                                        height: 3,
                                        background: "var(--surface-border)",
                                        borderRadius: 2,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.max(0, Math.min(100, w.score))}%`,
                                            height: "100%",
                                            background: accent,
                                            transition: "width 0.4s ease",
                                        }}
                                    />
                                </div>

                                {/* note */}
                                <p
                                    style={{
                                        fontFamily: "var(--font-body)",
                                        fontSize: "0.95rem",
                                        lineHeight: 1.5,
                                        color: "var(--text-secondary)",
                                        margin: 0,
                                        textWrap: "pretty",
                                        fontWeight: 300,
                                    }}
                                >
                                    {w.note}
                                </p>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
