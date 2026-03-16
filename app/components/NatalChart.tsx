"use client";

/**
 * NatalChart.tsx
 * Renders a full astrology wheel using @astrodraw/astrochart.
 * dynamically imports the library to avoid SSR issues with SVG/window APIs.
 */

import { useMemo, useEffect, useRef, useState, useId } from "react";
import { PLANET_COLORS } from "../lib/planet-data";
import PlanetIcon from "./PlanetIcon";

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
    birthDate?: string;   // YYYY-MM-DD
    birthTime?: string;   // HH:MM
    birthPlace?: string;  // city / place name
    cusps?: number[];     // 12 house cusp longitudes (Placidus)
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

export default function NatalChart({ natalPlanets, sunSign, name, birthDate, birthTime, birthPlace, cusps }: Props) {
    const planets = useMemo(
        () => (natalPlanets && natalPlanets.length > 0 ? natalPlanets : MOCK_NATAL),
        [natalPlanets]
    );

    const isMock = !natalPlanets || natalPlanets.length === 0;

    /** Format date for display: "1990-11-06" → "6 Nov 1990" */
    const formattedDate = useMemo(() => {
        if (!birthDate) return null;
        try {
            return new Date(birthDate + "T12:00:00").toLocaleDateString("en-GB",
                { day: "numeric", month: "short", year: "numeric" });
        } catch { return birthDate; }
    }, [birthDate]);

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
        // Use provided Placidus cusps if available.
        // Fallback: derive from ASC planet or planet closest to H1 position.
        let chartCusps = cusps;
        if (!chartCusps || chartCusps.length !== 12) {
            // Try to find ASC from planets (some backends expose it)
            const ascPlanet = planets.find(p => p.planet === "ASC" || p.planet === "Ascendant");
            const ascLon = ascPlanet?.longitude ?? planets[0]?.longitude ?? 0;
            // Equal-house cusps anchored at the Ascendant
            chartCusps = Array.from({ length: 12 }, (_, i) => (ascLon + i * 30) % 360);
        }

        const chartData = {
            planets: planets.reduce((acc, p) => {
                acc[p.planet] = [p.longitude];
                return acc;
            }, {} as Record<string, number[]>),
            cusps: chartCusps,
        };

        const settings = {
            SYMBOL_SCALE: 1.2,
            COLOR_BACKGROUND: "transparent",
            POINTS_COLOR: "var(--text-primary)",
            POINTS_TEXT_SIZE: 8,
            SIGNS_COLOR: "var(--text-primary)",
            CIRCLE_COLOR: "var(--surface-border)",
            LINE_COLOR: "var(--surface-border)",
            MARGIN: 36,
            ADD_CLICK_AREA: false,
            CUSPS_FONT_SIZE: 9,
            CUSPS_FONT_COLOR: "var(--text-tertiary)",
            SYMBOL_AXIS_FONT_COLOR: "var(--text-primary)",
            COLOR_ARIES: "var(--accent)",
            COLOR_TAURUS: "var(--gold)",
            COLOR_GEMINI: "var(--cyan)",
            COLOR_CANCER: "var(--sage)",
            COLOR_LEO: "var(--accent)",
            COLOR_VIRGO: "var(--gold)",
            COLOR_LIBRA: "var(--cyan)",
            COLOR_SCORPIO: "var(--sage)",
            COLOR_SAGITTARIUS: "var(--accent)",
            COLOR_CAPRICORN: "var(--gold)",
            COLOR_AQUARIUS: "var(--cyan)",
            COLOR_PISCES: "var(--sage)",
            COLORS_SIGNS: [
                "var(--accent)", "var(--gold)", "var(--cyan)", "var(--sage)",
                "var(--accent)", "var(--gold)", "var(--cyan)", "var(--sage)",
                "var(--accent)", "var(--gold)", "var(--cyan)", "var(--sage)"
            ],
            ASPECTS: {
                conjunction: { degree: 0, orbit: 10, color: 'transparent' },
                square: { degree: 90, orbit: 8, color: 'var(--amber)' },
                trine: { degree: 120, orbit: 8, color: 'var(--cyan)' },
                opposition: { degree: 180, orbit: 10, color: 'var(--accent)' }
            }
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
                    const radix = chart.radix(chartData);
                    radix.addPointsOfInterest( {"As":[chartCusps[0]],"Ic":[chartCusps[3]],"Ds":[chartCusps[6]],"Mc":[chartCusps[9]]} );
                    radix.aspects();
                } else {
                    const AstroNs = astroModule.default || astroModule;
                    const chart = new AstroNs.Chart(chartId, 400, 400, settings);
                    const radix = chart.radix(chartData);
                    radix.addPointsOfInterest( {"As":[chartCusps[0]],"Ic":[chartCusps[3]],"Ds":[chartCusps[6]],"Mc":[chartCusps[9]]} );
                    radix.aspects();
                }

                // Add tooltips and minutes after chart renders
                setTimeout(() => {
                    const container = containerRef.current;
                    if (!container) return;
                    const svg = container.querySelector('svg');
                    if (!svg) return;

                    // 1. Tooltips: find all <g> elements with planet/sign IDs
                    const allGroups = svg.querySelectorAll('g[id]');
                    allGroups.forEach(g => {
                        const id = g.getAttribute('id') || '';
                        // Extract name from patterns like "{chartId}-radix-points-Sun"
                        const pointsMatch = id.match(/-points-(\w+)$/);
                        const signsMatch = id.match(/-signs-(\w+)$/);
                        const name = pointsMatch?.[1] || signsMatch?.[1];
                        if (name && !g.querySelector('title')) {
                            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
                            title.textContent = name;
                            g.prepend(title);
                        }
                    });

                    // 2. Minutes: find <text> elements that show the integer degree
                    //    AstroChart outputs the degree text right after the planet symbol group.
                    //    Walk all <text> nodes inside the points wrapper and match to our planet data.
                    const textsInSvg = svg.querySelectorAll('text');
                    const planetsByDeg = new Map(planets.map(p => [Math.floor(p.longitude % 30).toString(), p]));
                    
                    textsInSvg.forEach(textEl => {
                        const content = textEl.textContent?.trim();
                        if (!content || content.includes("'") || content.includes('°')) return; // already processed
                        // Check if this is a plain degree number
                        const num = parseInt(content, 10);
                        if (isNaN(num) || num < 0 || num > 29) return;
                        
                        // Match to a planet by proximity (degree within sign)
                        const matchedPlanet = planetsByDeg.get(content);
                        if (matchedPlanet) {
                            const mins = Math.floor((matchedPlanet.degree % 1) * 60);
                            textEl.textContent = `${num}°${mins.toString().padStart(2, '0')}'`;
                            // Remove from map so we don't double-match  
                            planetsByDeg.delete(content);
                        }
                    });
                }, 200);
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
            gap: "0.5rem",
        }}>
            {/* Birth details metadata bar */}
            {(birthDate || birthTime || birthPlace) && (
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem 1.25rem",
                    justifyContent: "center",
                    width: "100%",
                    padding: "0.5rem",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: "0.25rem",
                }}>
                    {birthDate && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Born</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", fontVariant: "small-caps" }}>{formattedDate ?? birthDate}</span>
                        </div>
                    )}
                    {birthTime && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Time</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>{birthTime}</span>
                        </div>
                    )}
                    {birthPlace && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Place</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>{birthPlace}</span>
                        </div>
                    )}
                </div>
            )}

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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "16px",
                            height: "16px",
                        }}>
                            <PlanetIcon 
                                planet={p.planet} 
                                color={PLANET_COLORS[p.planet] || "var(--text-secondary)"} 
                                size={14} 
                            />
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                            {p.sign.slice(0, 3)} {Math.floor(p.degree)}°{Math.round((p.degree % 1) * 60).toString().padStart(2, '0')}'
                            {p.retrograde ? <span style={{ color: "var(--amber)", fontSize: "0.6rem", marginLeft: "2px" }}>Rx</span> : null}
                            {" "}
                            <span style={{ color: "var(--text-tertiary)" }}>H{p.house}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
