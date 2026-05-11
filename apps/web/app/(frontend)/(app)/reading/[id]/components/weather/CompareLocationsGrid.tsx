"use client";

import { TIER_PALETTE, tierCounts, worstTier, type GWCityForecast } from "@/app/lib/geodetic-weather-types";
import { TierPill } from "./TierPill";

export function CompareLocationsGrid({ cities }: { cities: GWCityForecast[] }) {
    return (
        <section>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: 0, color: "var(--text-primary)" }}>
                    Same window, different places
                </h3>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                    {cities.length} locations
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
                    gap: "1rem",
                }}
            >
                {cities.map((c) => {
                    const worst = worstTier(c.days);
                    const palette = TIER_PALETTE[worst];
                    const counts = tierCounts(c.days);

                    return (
                        <div
                            key={c.label}
                            style={{
                                background: palette.bg,
                                color: palette.text,
                                padding: "1.25rem 1.5rem",
                                clipPath: "var(--cut-lg)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.85rem",
                                minHeight: "280px",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: palette.accent, fontWeight: 700, textTransform: "uppercase" }}>
                                    {c.label.split(",")[0]}
                                </div>
                                <TierPill tier={worst} size="sm" />
                            </div>

                            <div
                                style={{
                                    fontFamily: "var(--font-primary)",
                                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                                    lineHeight: 0.85,
                                    letterSpacing: "-0.03em",
                                    textTransform: "uppercase",
                                    color: palette.text,
                                }}
                            >
                                {worst}
                            </div>

                            {/* Mini strip */}
                            <div style={{ display: "flex", gap: "1px", marginTop: "0.3rem" }} aria-hidden>
                                {c.days.map((d, i) => {
                                    const p = TIER_PALETTE[d.severity];
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                height: "42px",
                                                background: p.bg,
                                                outline: `1px solid ${p.accent}`,
                                            }}
                                            title={d.severity}
                                        />
                                    );
                                })}
                            </div>

                            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "auto" }}>
                                {(["Severe", "Turbulent", "Unsettled", "Calm", "Extreme"] as const)
                                    .filter((t) => counts[t] > 0)
                                    .map((t) => (
                                        <span
                                            key={t}
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "0.55rem",
                                                padding: "0.25rem 0.5rem",
                                                border: `1px solid ${palette.accent}`,
                                                letterSpacing: "0.15em",
                                                textTransform: "uppercase",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {counts[t]} {t.slice(0, 3)}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
