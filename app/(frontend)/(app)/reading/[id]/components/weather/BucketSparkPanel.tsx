"use client";

import type { GWBreakdown } from "@/app/lib/geodetic-weather-types";

const BUCKETS: Array<{ key: keyof GWBreakdown; label: string; polarity: "mal" | "ben" }> = [
    { key: "bucketAngle", label: "SKY ON THE AXIS", polarity: "mal" },
    { key: "bucketParan", label: "LATITUDE CROSSINGS", polarity: "ben" },
    { key: "bucketStation", label: "STALLED ENERGY", polarity: "mal" },
    { key: "bucketIngress", label: "SEASONAL FIELD", polarity: "mal" },
    { key: "bucketEclipse", label: "DETONATOR", polarity: "mal" },
    { key: "bucketLate", label: "FINAL DEGREES", polarity: "mal" },
    { key: "bucketConfig", label: "GEOMETRIC PATTERN", polarity: "mal" },
];

export function BucketSparkPanel({
    breakdown,
    highlightLayer,
}: {
    breakdown: GWBreakdown;
    highlightLayer?: string;
}) {
    const layerToBucket: Record<string, keyof GWBreakdown> = {
        "angle-transit": "bucketAngle",
        "paran": "bucketParan",
        "station": "bucketStation",
        "ingress": "bucketIngress",
        "eclipse": "bucketEclipse",
        "late-degree": "bucketLate",
        "configuration": "bucketConfig",
    };
    const activeBucket = highlightLayer ? layerToBucket[highlightLayer] : undefined;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: "var(--color-y2k-blue)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: "0.25rem",
                }}
            >
                Bucket read
            </div>

            {BUCKETS.map((b) => {
                const raw = breakdown[b.key] ?? 0;
                const pct = Math.max(0, Math.min(100, raw));
                const isActive = activeBucket === b.key;
                const fill = b.polarity === "ben" ? "var(--sage)" : "var(--color-spiced-life)";
                return (
                    <div key={b.key} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.55rem",
                                letterSpacing: "0.18em",
                                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                            }}
                        >
                            <span>{b.label}</span>
                            <span>{raw}</span>
                        </div>
                        <div
                            style={{
                                height: "8px",
                                background: "var(--surface-border)",
                                position: "relative",
                                overflow: "hidden",
                                clipPath: "var(--cut-sm)",
                                outline: isActive ? "1px solid var(--text-primary)" : "none",
                            }}
                        >
                            <div
                                style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    background: fill,
                                    transition: "width 0.4s ease",
                                }}
                            />
                        </div>
                    </div>
                );
            })}

            {breakdown.tierShift !== 0 && (
                <div
                    style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.18em",
                        color: "var(--color-eggshell)",
                        background: "var(--color-charcoal)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        clipPath: "var(--cut-sm)",
                    }}
                >
                    TIER SHIFTED {breakdown.tierShift > 0 ? "UP" : "DOWN"} ×{Math.abs(breakdown.tierShift)}
                </div>
            )}
        </div>
    );
}
