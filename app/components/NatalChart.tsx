"use client";

/**
 * NatalChart.tsx
 * Renders a full astrology wheel using @astrodraw/astrochart.
 * dynamically imports the library to avoid SSR issues with SVG/window APIs.
 */

import { useMemo, useEffect, useRef, useState, useId } from "react";
import { PLANET_GLYPHS, PLANET_COLORS, SIGN_GLYPHS } from "../lib/planet-data";

interface NatalPlanet {
    planet: string;
    sign: string;
    degree: number;      // 0-29 within sign
    longitude: number;   // 0-359 ecliptic longitude
    retrograde: boolean;
    house: number;       // 1-12
}

interface Props {
    natalPlanets: NatalPlanet[];
    sunSign?: string | null;
    name?: string;
}

// Mock natal data for demonstration when engine is offline
const MOCK_NATAL: NatalPlanet[] = [
    { planet: "Sun", sign: "Scorpio", degree: 14, longitude: 224, retrograde: false, house: 8 },
    { planet: "Moon", sign: "Aquarius", degree: 7, longitude: 307, retrograde: false, house: 11 },
    { planet: "Mercury", sign: "Scorpio", degree: 2, longitude: 212, retrograde: false, house: 7 },
    { planet: "Venus", sign: "Libra", degree: 21, longitude: 201, retrograde: false, house: 7 },
    { planet: "Mars", sign: "Capricorn", degree: 18, longitude: 288, retrograde: false, house: 10 },
    { planet: "Jupiter", sign: "Virgo", degree: 5, longitude: 155, retrograde: false, house: 5 },
    { planet: "Saturn", sign: "Pisces", degree: 28, longitude: 358, retrograde: false, house: 12 },
    { planet: "Uranus", sign: "Capricorn", degree: 12, longitude: 282, retrograde: false, house: 9 },
    { planet: "Neptune", sign: "Capricorn", degree: 14, longitude: 284, retrograde: true, house: 9 },
    { planet: "Pluto", sign: "Scorpio", degree: 22, longitude: 232, retrograde: false, house: 8 },
];

export default function NatalChart({ natalPlanets, sunSign, name }: Props) {
    const planets = useMemo(
        () => (natalPlanets && natalPlanets.length > 0 ? natalPlanets : MOCK_NATAL),
        [natalPlanets]
    );

    const isMock = !natalPlanets || natalPlanets.length === 0;

    // Unique ID for the chart wrapper since AstroChart mounts by ID
    const chartIdPrefix = useId().replace(/:/g, ""); // Safe for HTML IDs
    const chartId = `astro-chart-${chartIdPrefix}`;
    const containerRef = useRef<HTMLDivElement>(null);

    // Track rendering status
    const [renderError, setRenderError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear old chart if reacting hooks trigger multiple times
        containerRef.current.innerHTML = "";

        // Prepare data for AstroChart
        const chartData = {
            planets: planets.reduce((acc, p) => {
                acc[p.planet] = [p.longitude];
                return acc;
            }, {} as Record<string, number[]>),
            // Default 12-house equal system cusps
            cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
        };

        const settings = {
            SYMBOL_SCALE: 1,
            // Styling to match Astro Nat theme
            COLOR_BACKGROUND: "transparent",
            POINTS_COLOR: "#fafafa",
            SIGNS_COLOR: "rgba(255, 255, 255, 0.4)",
            CIRCLE_COLOR: "rgba(255, 255, 255, 0.15)",
            LINE_COLOR: "rgba(255, 255, 255, 0.15)",
            MARGIN: 10, // tighter margin
            ADD_CLICK_AREA: false
        };

        const loadChart = async () => {
            try {
                // Dynamically import to bypass Next.js SSR issues
                const astroModule: any = await import("@astrodraw/astrochart");

                let ChartClass = null;
                if (astroModule.default && astroModule.default.Chart) {
                    ChartClass = astroModule.default.Chart;
                } else if (astroModule.Chart) {
                    ChartClass = astroModule.Chart;
                } else if (typeof astroModule.default === 'function') {
                    ChartClass = astroModule.default;
                } else {
                    setRenderError("AstroChart engine not found");
                    return;
                }

                // Initialise and render
                if (typeof ChartClass === "function") {
                    const chart = new ChartClass(chartId, 400, 400, settings);
                    chart.radix(chartData);
                } else {
                    const AstroNs = astroModule.default || astroModule;
                    const chart = new AstroNs.Chart(chartId, 400, 400, settings);
                    chart.radix(chartData);
                }
            } catch (err: any) {
                console.error("[NatalChart] failed to render chart:", err);
                setRenderError("Error rendering chart graphic.");
            }
        };

        loadChart();

    }, [planets]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem", // tight spacing to fix Problem A
        }}>
            {/* Label */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500,
                marginTop: "0.5rem"
            }}>
                <span style={{ color: "var(--gold)", fontFamily: "serif", fontSize: "0.85rem" }}>
                    {sunSign ? SIGN_GLYPHS[sunSign] : "☽"}
                </span>
                Natal Chart{name ? ` · ${name}` : ""}
                {isMock && (
                    <span style={{
                        fontSize: "0.6rem",
                        color: "var(--gold)",
                        background: "var(--gold-soft)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        border: "1px solid rgba(250,218,94,0.2)",
                        letterSpacing: "0.06em",
                    }}>
                        SAMPLE
                    </span>
                )}
            </div>

            {renderError && (
                <div style={{ fontSize: "0.8rem", color: "var(--accent)", padding: "2rem" }}>
                    {renderError}
                </div>
            )}

            {/* AstroChart Canvas mounts here */}
            <div
                id={chartId}
                ref={containerRef}
                aria-label="Natal chart wheel"
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    aspectRatio: "1",
                    display: renderError ? "none" : "block",
                    opacity: 0.95 // subtle blend
                }}
            />

            {/* ── Planet Legend ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "0.4rem 0.8rem",
                width: "100%",
                marginTop: "0.25rem", // reduced to help fix Problem A
            }}>
                {planets.map((p) => (
                    <div key={p.planet} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        color: "var(--text-tertiary)",
                    }}>
                        <span style={{
                            fontFamily: "serif",
                            fontSize: "0.85rem",
                            color: PLANET_COLORS[p.planet] || "var(--text-secondary)",
                            lineHeight: 1,
                        }}>
                            {PLANET_GLYPHS[p.planet]}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                            {p.sign.slice(0, 3)} {Math.round(p.degree)}°
                            {p.retrograde ? <span style={{ color: "var(--accent)", fontSize: "0.6rem" }}> Rx</span> : null}
                            {" "}
                            <span style={{ color: "var(--text-tertiary)" }}>H{p.house}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
