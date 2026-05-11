"use client";

import { TIER_PALETTE, tierCounts, worstTier, type Tier, type GWCityForecast } from "@/app/lib/geodetic-weather-types";

interface Props {
    cities: GWCityForecast[];
    windowDays: number;
    startDate: string;
    endDate: string;
}

function buildEditorialSentence(worst: Tier, counts: Record<Tier, number>, cityLabel: string): string {
    const severeLike = counts.Severe + counts.Extreme;
    const steady = counts.Unsettled + counts.Turbulent;
    const calm = counts.Calm;

    if (worst === "Calm") {
        return `${cityLabel} holds quiet the whole window. Nothing in the current sky is stamping this longitude hard. A steady read.`;
    }
    if (worst === "Extreme") {
        return `${cityLabel} hits Extreme inside the window. The rest of the stretch runs through Turbulent and Severe before and after. Watch the marked dates closely.`;
    }
    if (severeLike === 0) {
        return `${cityLabel} cycles between ${calm > steady ? "Calm and Unsettled" : "Unsettled and Turbulent"} across the window. No Severe days, but the pressure is uneven.`;
    }
    return `${severeLike === 1 ? "One day" : `${severeLike} days`} in this window read Severe. The rest holds between Unsettled and Turbulent. Watch the marked dates — the sky is stamping this longitude there, and not evenly.`;
}

export function VerdictSlab({ cities, windowDays, startDate, endDate }: Props) {
    const allDays = cities.flatMap((c) => c.days);
    const worst = worstTier(allDays);
    const counts = tierCounts(allDays);
    const palette = TIER_PALETTE[worst];

    const primaryLabel = cities[0]?.label ?? "Location";
    const windowLabel = `${startDate} → ${endDate}`;
    const sentence = buildEditorialSentence(worst, counts, primaryLabel.split(",")[0]);

    return (
        <section
            style={{
                position: "relative",
                background: palette.bg,
                color: palette.text,
                padding: "clamp(2rem, 4vw, 4rem) clamp(1.25rem, 3vw, 3rem)",
                overflow: "hidden",
                clipPath: "var(--cut-xl)",
            }}
        >
            {/* SLOOP SCRIPT overlap */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    fontFamily: "var(--font-display-alt-2)",
                    fontSize: "clamp(8rem, 16vw, 14rem)",
                    color: palette.accent,
                    opacity: 0.18,
                    top: "8%",
                    right: "-4%",
                    pointerEvents: "none",
                    lineHeight: 0.65,
                    zIndex: 0,
                }}
            >
                ahead
            </span>

            <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "clamp(1.5rem, 3vw, 3rem)", alignItems: "end" }}
                 className="grid-cols-1 md:grid-cols-2">
                {/* Left column — giant verdict */}
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.65rem",
                            letterSpacing: "0.3em",
                            color: palette.accent,
                            fontWeight: 700,
                            marginBottom: "1rem",
                            textTransform: "uppercase",
                        }}
                    >
                        The verdict ahead
                    </div>
                    <h1
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(5rem, 14vw, 12rem)",
                            lineHeight: 0.82,
                            color: palette.text,
                            textTransform: "uppercase",
                            letterSpacing: "-0.04em",
                            margin: 0,
                            wordBreak: "break-word",
                        }}
                    >
                        {worst}
                    </h1>
                </div>

                {/* Right column — kicker + sentence + stats */}
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6rem",
                            letterSpacing: "0.22em",
                            color: palette.accent,
                            fontWeight: 700,
                            textTransform: "uppercase",
                        }}
                    >
                        {cities.map((c) => c.label.split(",")[0]).join(" · ")} · NEXT {windowDays} DAYS · {windowLabel}
                    </div>
                    <p
                        style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "clamp(1.05rem, 1.6vw, 1.35rem)",
                            lineHeight: 1.4,
                            color: palette.text,
                            margin: 0,
                        }}
                    >
                        {sentence}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {(["Severe", "Turbulent", "Unsettled", "Calm", "Extreme"] as Tier[])
                            .filter((t) => counts[t] > 0)
                            .map((t) => (
                                <div
                                    key={t}
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.18em",
                                        padding: "0.35rem 0.7rem",
                                        background: "transparent",
                                        border: `1.5px solid ${palette.accent}`,
                                        color: palette.text,
                                        clipPath: "var(--cut-sm)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    {counts[t]} {t}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
