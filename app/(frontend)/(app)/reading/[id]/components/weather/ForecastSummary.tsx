"use client";

import {
    BUCKET_COPY,
    tierToBucket,
    type GWCityForecast,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    city: GWCityForecast;
    windowDays: number;
    startDate: string;
    endDate: string;
}

function fmtShort(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ForecastSummary({ city, windowDays, startDate, endDate }: Props) {
    const counts = { good: 0, mixed: 0, rough: 0 };
    for (const d of city.days) counts[tierToBucket(d.severity)]++;
    const total = city.days.length;
    const goodPct = total ? counts.good / total : 0;
    const roughPct = total ? counts.rough / total : 0;

    let headline: string;
    let lede: string;

    if (goodPct >= 0.7) {
        headline = "Mostly smooth";
        lede = `Over the next ${windowDays} days in ${city.label.split(",")[0]}, the sky stays steady. ${counts.good} good days, ${counts.mixed} mixed, ${counts.rough} to watch.`;
    } else if (roughPct >= 0.3) {
        headline = "A rough stretch";
        lede = `${counts.rough} of the next ${windowDays} days in ${city.label.split(",")[0]} read rough. If the plan is flexible, shift it.`;
    } else {
        headline = "A mixed window";
        lede = `${counts.good} good · ${counts.mixed} mixed · ${counts.rough} rough in the next ${windowDays} days for ${city.label.split(",")[0]}.`;
    }

    // Segmented proportion bar — how the window breaks down at a glance.
    const segments = (["good", "mixed", "rough"] as const).map((k) => ({
        k,
        pct: (counts[k] / Math.max(1, total)) * 100,
    }));

    return (
        <section
            style={{
                position: "relative",
                background: "var(--color-black)",
                color: "var(--color-eggshell)",
                padding: "clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 3vw, 3rem)",
                clipPath: "var(--cut-xl)",
                overflow: "hidden",
            }}
        >
            <div
                className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr]"
                style={{
                    position: "relative",
                    zIndex: 1,
                    gap: "clamp(1.5rem, 3vw, 3rem)",
                    alignItems: "end",
                }}
            >
                {/* Left — city kicker + giant headline */}
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.65rem",
                            letterSpacing: "0.3em",
                            color: "var(--color-acqua)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginBottom: "1rem",
                        }}
                    >
                        {city.label} · {fmtShort(startDate)} → {fmtShort(endDate)} · {total} days
                    </div>
                    <h1
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(2.5rem, 9vw, 8rem)",
                            lineHeight: 0.9,
                            letterSpacing: "-0.035em",
                            margin: 0,
                            color: "var(--color-eggshell)",
                            textTransform: "uppercase",
                            wordBreak: "normal",
                            overflowWrap: "normal",
                            hyphens: "none",
                        }}
                    >
                        {headline.split(" ").map((w, i, arr) => (
                            <span key={i} style={{ whiteSpace: "nowrap" }}>
                                {w}{i < arr.length - 1 ? " " : "."}
                            </span>
                        ))}
                    </h1>
                </div>

                {/* Right — lede + segmented bar + three pill tags */}
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <p
                        style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)",
                            lineHeight: 1.45,
                            color: "var(--color-eggshell)",
                            margin: 0,
                            maxWidth: "42ch",
                        }}
                    >
                        {lede}
                    </p>

                    {/* Segmented proportion bar */}
                    <div
                        role="img"
                        aria-label={`${counts.good} good, ${counts.mixed} mixed, ${counts.rough} rough days`}
                        style={{
                            display: "flex",
                            gap: "3px",
                            height: "18px",
                            clipPath: "var(--cut-sm)",
                        }}
                    >
                        {segments.map((s) => (
                            <div
                                key={s.k}
                                style={{
                                    flex: s.pct,
                                    background: BUCKET_COPY[s.k].accent,
                                    minWidth: s.pct > 0 ? "6px" : 0,
                                }}
                                title={`${BUCKET_COPY[s.k].short} · ${counts[s.k]}`}
                            />
                        ))}
                    </div>

                    {/* Three pill tags — mono, borderline y2k */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {(["good", "mixed", "rough"] as const).map((b) => {
                            const c = BUCKET_COPY[b];
                            return (
                                <span
                                    key={b}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.45rem",
                                        padding: "0.35rem 0.85rem",
                                        border: `1px solid ${c.accent}`,
                                        borderRadius: "999px",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.62rem",
                                        letterSpacing: "0.2em",
                                        color: "var(--color-eggshell)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    <span
                                        aria-hidden
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 2,
                                            background: c.accent,
                                            display: "inline-block",
                                        }}
                                    />
                                    {counts[b]} {c.short}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
