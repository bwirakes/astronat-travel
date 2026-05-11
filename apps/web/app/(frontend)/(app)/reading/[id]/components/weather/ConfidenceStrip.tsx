"use client";

import { useState } from "react";
import type { GeodeticWeatherResult, GWPersonalLens } from "@/app/lib/geodetic-weather-types";

interface Props {
    days: GeodeticWeatherResult[];
    lens?: GWPersonalLens | null;
}

interface SignalFamily {
    label: string;
    fired: boolean;
    detail: string;
}

/**
 * Engineering realisation of the PDF's "rule of three" (principle 5):
 * count how many independent signal families fire for this reading and
 * surface a single pill that quantifies confidence. ≥3 = green; <3 =
 * yellow with the literal advice "interpret loosely."
 */
export function ConfidenceStrip({ days, lens }: Props) {
    const [open, setOpen] = useState(false);

    // Tally each signal family across the whole window.
    const angleHits = days.reduce(
        (n, d) => n + (d.events?.filter((e) => e.layer === "angle-transit").length ?? 0),
        0,
    );
    const paranHits = days.reduce(
        (n, d) => n + (d.events?.filter((e) => e.layer === "paran").length ?? 0),
        0,
    );
    const lateHits = days.reduce(
        (n, d) => n + (d.events?.filter((e) => e.layer === "late-degree").length ?? 0),
        0,
    );
    const acgLines = lens?.activeAngleLines?.length ?? 0;
    const rulerDisplaced =
        !!lens && lens.chartRulerNatalHouse !== lens.chartRulerRelocatedHouse;
    const worldPoints = lens?.worldPointContacts?.length ?? 0;
    const natalGeoMatches =
        lens?.natalPlanetGeography?.filter((p) => p.angularMatch).length ?? 0;

    const families: SignalFamily[] = [
        {
            label: "Angle transits",
            fired: angleHits > 0,
            detail: `${angleHits} sky-on-axis hit${angleHits === 1 ? "" : "s"} across the window`,
        },
        {
            label: "Paran latitude crossings",
            fired: paranHits > 0,
            detail: `${paranHits} doubled-signature paran${paranHits === 1 ? "" : "s"} at this latitude`,
        },
        {
            label: "Late-degree pressure",
            fired: lateHits > 0,
            detail: `${lateHits} anaretic-zone hit${lateHits === 1 ? "" : "s"}`,
        },
        {
            label: "Natal planets on this city's angles",
            fired: acgLines > 0,
            detail: `${acgLines} natal planet${acgLines === 1 ? "" : "s"} within 5° of MC/IC/ASC/DSC here`,
        },
        {
            label: "Chart-ruler displacement",
            fired: rulerDisplaced,
            detail: rulerDisplaced
                ? `Chart ruler shifts house at this destination`
                : `Chart ruler stays in same house — no displacement`,
        },
        {
            label: "World-point contacts",
            fired: worldPoints > 0,
            detail: `${worldPoints} 8th-harmonic hit${worldPoints === 1 ? "" : "s"} in your natal chart`,
        },
        {
            label: "Natal-planet geography match",
            fired: natalGeoMatches > 0,
            detail: `${natalGeoMatches} natal planet${natalGeoMatches === 1 ? "" : "s"} land${natalGeoMatches === 1 ? "s" : ""} on this longitude`,
        },
    ];

    const firedCount = families.filter((f) => f.fired).length;
    const ok = firedCount >= 3;

    const pillColor = ok ? "var(--sage)" : "var(--gold)";
    const pillBg = ok ? "rgba(0, 253, 0, 0.12)" : "rgba(201, 169, 110, 0.18)";
    const pillText = ok
        ? `${firedCount} independent signatures confirm this window`
        : `Only ${firedCount} signature${firedCount === 1 ? "" : "s"} — interpret loosely`;

    return (
        <section
            aria-label="Rule-of-three confidence"
            style={{
                padding: "clamp(1rem, 2vw, 1.5rem) 0",
                display: "flex",
                flexDirection: "column",
                gap: "0.7rem",
            }}
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    padding: "0.5rem 0.95rem",
                    background: pillBg,
                    color: pillColor,
                    border: `1px solid ${pillColor}`,
                    borderRadius: "999px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    cursor: "pointer",
                }}
                aria-expanded={open}
            >
                <span
                    aria-hidden
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: pillColor,
                    }}
                />
                {pillText}
                <span aria-hidden style={{ opacity: 0.7, marginLeft: "0.2rem" }}>
                    {open ? "▴" : "▾"}
                </span>
            </button>

            {open && (
                <ul
                    style={{
                        listStyle: "none",
                        padding: "0.85rem 1rem",
                        margin: 0,
                        background: "var(--surface)",
                        border: "1px solid var(--surface-border)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.45rem",
                        maxWidth: "640px",
                    }}
                >
                    {families.map((f, i) => (
                        <li
                            key={i}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "16px 1fr",
                                gap: "0.6rem",
                                alignItems: "baseline",
                                fontFamily: "var(--font-body)",
                                fontSize: "0.88rem",
                                lineHeight: 1.45,
                                color: f.fired ? "var(--text-primary)" : "var(--text-tertiary)",
                                fontWeight: 300,
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    color: f.fired ? "var(--sage)" : "var(--text-tertiary)",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.85rem",
                                }}
                            >
                                {f.fired ? "✓" : "·"}
                            </span>
                            <span>
                                <strong style={{ fontWeight: 500 }}>{f.label}.</strong>{" "}
                                {f.detail}.
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
