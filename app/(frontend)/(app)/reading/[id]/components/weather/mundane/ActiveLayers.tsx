"use client";

import type { GeodeticWeatherResult } from "@/app/lib/geodetic-weather-types";

interface Props {
    days: GeodeticWeatherResult[];
}

const LAYER_LABEL: Record<string, string> = {
    "angle-transit": "Angle-transits",
    paran: "Parans",
    station: "Stations",
    eclipse: "Eclipses",
    "world-point": "World points",
    "late-degree": "Late-degrees",
    configuration: "Configurations",
    ingress: "Ingresses",
    "severity-modifier": "Severity modifiers",
};

const LAYER_ORDER = [
    "angle-transit",
    "paran",
    "station",
    "eclipse",
    "world-point",
    "late-degree",
    "configuration",
    "ingress",
    "severity-modifier",
];

function fmtDay(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

/**
 * Deterministic layer-by-layer table. Aggregates engine output across
 * all days in the window. Zero AI.
 */
export function ActiveLayers({ days }: Props) {
    const stats: Record<string, {
        count: number;
        peakSeverity: string;
        peakDate: string;
        topLabel: string;
    }> = {};

    for (const d of days) {
        for (const e of d.events ?? []) {
            if (!stats[e.layer]) {
                stats[e.layer] = { count: 0, peakSeverity: d.severity, peakDate: d.dateUtc, topLabel: e.label };
            }
            stats[e.layer].count += 1;
            // Track the peak-severity day for this layer
            const currentRank = tierRank(stats[e.layer].peakSeverity);
            const thisRank = tierRank(d.severity);
            if (thisRank > currentRank) {
                stats[e.layer].peakSeverity = d.severity;
                stats[e.layer].peakDate = d.dateUtc;
                stats[e.layer].topLabel = e.label;
            }
        }
    }

    const active = LAYER_ORDER.filter((l) => stats[l]);
    if (active.length === 0) {
        return null;
    }

    return (
        <section
            aria-label="Active layers"
            style={{
                padding: "clamp(2.5rem, 5vw, 4rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(1.25rem, 2.5vw, 1.75rem)",
            }}
        >
            <div>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.28em",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginBottom: "0.5rem",
                    }}
                >
                    C · Active layers
                </div>
                <h2
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                        margin: 0,
                        color: "var(--text-primary)",
                    }}
                >
                    What the sky is doing, by layer.
                </h2>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                        minWidth: 520,
                    }}
                >
                    <thead>
                        <tr>
                            {["Layer", "Days firing", "Peak severity", "Top contributor"].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        textAlign: "left",
                                        padding: "0.5rem 0.75rem",
                                        borderBottom: "1px solid var(--surface-border)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.58rem",
                                        letterSpacing: "0.22em",
                                        color: "var(--text-tertiary)",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {active.map((l) => {
                            const s = stats[l];
                            return (
                                <tr key={l}>
                                    <td style={cellStyle}>{LAYER_LABEL[l] ?? l}</td>
                                    <td style={cellStyle}>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{s.count}</span>
                                    </td>
                                    <td style={{ ...cellStyle, color: tierColor(s.peakSeverity) }}>
                                        {s.peakSeverity}{" "}
                                        <span style={{ color: "var(--text-tertiary)", fontSize: "0.8em" }}>
                                            ({fmtDay(s.peakDate)})
                                        </span>
                                    </td>
                                    <td style={{ ...cellStyle, color: "var(--text-secondary)" }}>{s.topLabel}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

const cellStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    borderBottom: "1px dashed var(--surface-border)",
    verticalAlign: "top",
};

function tierRank(t: string): number {
    return ["Calm", "Unsettled", "Turbulent", "Severe", "Extreme"].indexOf(t);
}

function tierColor(t: string): string {
    return {
        Calm: "var(--sage)",
        Unsettled: "var(--color-y2k-blue)",
        Turbulent: "var(--gold)",
        Severe: "var(--color-spiced-life)",
        Extreme: "#7a1b1b",
    }[t] ?? "var(--text-primary)";
}
