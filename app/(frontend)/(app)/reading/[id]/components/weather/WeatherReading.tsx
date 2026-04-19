"use client";

import { useMemo } from "react";
import AppNavbar from "@/app/components/AppNavbar";
import {
    type GWCityForecast,
    type GWInterpretation,
    type GWPersonalLens,
} from "@/app/lib/geodetic-weather-types";
import { Brief } from "./Brief";
import { BestWindows } from "./BestWindows";
import { WhyThisPlace } from "./WhyThisPlace";
import { GanttTimelineSection } from "./GanttTimelineSection";
import { MovementsSection } from "./MovementsSection";
import { LinesEditorial } from "./LinesEditorial";
import { RulerJourney } from "./RulerJourney";
import { GeodeticLinesSection } from "./GeodeticLinesSection";
import { ConfidenceStrip } from "./ConfidenceStrip";
import { NatalGeography } from "./NatalGeography";
import { Colophon } from "./Colophon";
import MundaneReading from "./mundane/MundaneReading";
import { chartRulerImplication } from "@/app/lib/personal-lens-text";
import { degreeToSign } from "@/app/lib/geodetic-weather-types";

interface WeatherForecastPayload {
    windowDays: number;
    startDate: string;
    endDate: string;
    goalFilter: string | null;
    cities: GWCityForecast[];
    macroScore?: number;
    interpretation?: GWInterpretation;
    mundaneLead?: string | null;
    intent?: "mundane" | "personal";
    natalPlanets?: Array<{ name?: string; planet?: string; longitude: number }>;
    birthDateTimeUTC?: string | null;
    birthLat?: number | null;
    birthLon?: number | null;
    natalAscLon?: number | null;
    personalLens?: GWPersonalLens | null;
    generated?: string;
}

interface Props {
    forecast: WeatherForecastPayload;
    readingId?: string;
}

const DEFAULT_INTERPRETATION: GWInterpretation = {
    titleFlourish: "window",
    verdict: "A mixed window — the dates below are the ones that matter most.",
    hook: "Your AI summary has not run yet for this reading. Click regenerate above to produce a fresh summary, top dates, and narrative. The forecast engine has already graded every day in this window; the sections below surface the daily data even without AI prose.",
    dropLine: "The permanent lines of this city meet a moving sky; what follows is where they interfere.",
    travelWindows: [],
    keyMoments: [],
    advice: {
        bestWindow: "Pick a green stretch from the timeline below.",
        watchWindow: "Skip any rough cluster if you can.",
    },
};

function scoreBand(score: number): string {
    if (score >= 80) return "Highly productive";
    if (score >= 65) return "Productive";
    if (score >= 50) return "Mixed";
    if (score >= 35) return "Challenging";
    return "Hostile";
}

function fmtMonthDayYear(iso: string): string {
    const dt = new Date(iso);
    return dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function fmtCoords(lat: number, lon: number): string {
    return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} · ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
}

/** Deterministic chart-ruler line (no AI). Derived from the lens. */
function renderChartRulerLine(lens: GWPersonalLens, city: string): string {
    const { chartRulerPlanet: ruler, relocatedAscSign: asc, chartRulerNatalHouse: nH, chartRulerRelocatedHouse: rH, chartRulerRelocatedDomain: rDomain } = lens;
    const sameHouse = nH === rH;
    const o = (n: number) => `${n}${ordinalSuffix(n)}`;
    if (sameHouse) {
        return `In ${city} you are still ${asc} rising; your chart ruler, ${ruler}, stays in your ${o(rH)} — ${rDomain}.`;
    }
    return `In ${city} you become ${asc} rising. Your chart ruler, ${ruler}, moves from your natal ${o(nH)} to your relocated ${o(rH)} — ${rDomain}.`;
}

function ordinalSuffix(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

/** Format an ecliptic longitude as "Sign 25°" — the city-frame copy. */
function fmtSignDegree(lon: number | null | undefined): string | null {
    if (lon == null || Number.isNaN(lon)) return null;
    const { sign, deg } = degreeToSign(lon);
    return `${sign} ${Math.round(deg)}°`;
}

export default function WeatherReading({ forecast, readingId }: Props) {
    // ── Dispatcher: mundane vs personal ──────────────────────────────────
    if (forecast.intent === "mundane") {
        return <MundaneReading forecast={forecast} />;
    }

    const city = forecast.cities[0];
    const days = city.days;

    const macroScore = useMemo(
        () =>
            typeof forecast.macroScore === "number"
                ? forecast.macroScore
                : Math.round(
                      days.reduce((a, d) => a + (d.score ?? 60), 0) /
                          Math.max(1, days.length),
                  ),
        [days, forecast.macroScore],
    );

    const interpretation = forecast.interpretation ?? DEFAULT_INTERPRETATION;
    const cityPrimary = city.label.split(",")[0].trim();
    const cityFull = city.label;
    const travelWindows = interpretation.travelWindows ?? [];

    const dateRangeLabel = `${fmtMonthDayYear(forecast.startDate)} — ${fmtMonthDayYear(forecast.endDate)}`;
    const generatedLabel = forecast.generated
        ? fmtMonthDayYear(forecast.generated)
        : fmtMonthDayYear(new Date().toISOString());

    const chartRulerLine = forecast.personalLens
        ? renderChartRulerLine(forecast.personalLens, cityPrimary)
        : null;
    const chartRulerImplicationLine = forecast.personalLens
        ? chartRulerImplication(forecast.personalLens, cityPrimary)
        : null;
    const geodeticFrame = (() => {
        const mc = fmtSignDegree(forecast.personalLens?.cityGeodeticMcLon);
        const asc = fmtSignDegree(forecast.personalLens?.cityGeodeticAscLon);
        if (!mc || !asc) return null;
        return { mcLabel: mc, ascLabel: asc };
    })();

    return (
        <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
            <AppNavbar />

            <div style={{ padding: "clamp(1rem, 2.5vw, 2rem)" }}>
                <div
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* 01 — Brief */}
                    <Brief
                        cityPrimary={cityPrimary.toUpperCase()}
                        cityFull={cityFull}
                        titleFlourish={interpretation.titleFlourish || "window"}
                        coordsLabel={fmtCoords(city.lat, city.lon)}
                        windowCount={travelWindows.length}
                        windowDays={forecast.windowDays}
                        dateRangeLabel={dateRangeLabel}
                        generatedLabel={generatedLabel}
                        score={macroScore}
                        scoreBand={scoreBand(macroScore).toUpperCase()}
                        chartRulerLine={chartRulerLine}
                        chartRulerImplicationLine={chartRulerImplicationLine}
                        geodeticFrame={geodeticFrame}
                        readingId={readingId}
                    />

                    {/* 01b — Confidence strip (rule of three) */}
                    <ConfidenceStrip days={days} lens={forecast.personalLens} />

                    {/* 02 — Best travel windows */}
                    <div style={{ padding: "clamp(1.5rem, 3vw, 2.5rem) 0" }}>
                        <BestWindows windows={travelWindows} />
                    </div>

                    {/* 03 — Why this place, this season */}
                    <WhyThisPlace
                        hook={interpretation.hook || DEFAULT_INTERPRETATION.hook}
                        dropLine={interpretation.dropLine}
                    />

                    {/* 04 — Timeline (Gantt) */}
                    <div
                        style={{
                            padding: "clamp(2.5rem, 5vw, 4rem) 0",
                            borderTop: "1px solid var(--surface-border)",
                        }}
                    >
                        <GanttTimelineSection days={days} startDate={forecast.startDate} />
                    </div>

                    {/* 05 — Movements */}
                    <MovementsSection movements={interpretation.keyMoments ?? []} />

                    {/* 06 — § 1 The geodetic reading (ACG lines) */}
                    <LinesEditorial
                        natalPlanets={forecast.natalPlanets ?? []}
                        birthDateTimeUTC={forecast.birthDateTimeUTC ?? null}
                        birthLon={forecast.birthLon ?? null}
                        destinationLat={city.lat}
                        destinationLon={city.lon}
                        cityPrimary={cityPrimary}
                    />

                    {/* 07 — § 2 The ruler travels (chart-ruler relocation) */}
                    {forecast.personalLens && (
                        <RulerJourney
                            lens={forecast.personalLens}
                            cityPrimary={cityPrimary}
                            rulerJourneyChain={interpretation.rulerJourneyChain}
                        />
                    )}

                    {/* 08 — § 3 Where your planets land (PDF principle 3) */}
                    {forecast.personalLens?.natalPlanetGeography && (
                        <NatalGeography
                            lens={forecast.personalLens}
                            cityPrimary={cityPrimary}
                        />
                    )}

                    {/* 09 — § 4 Geodetic lens (permanent zones) */}
                    <div
                        style={{
                            padding: "clamp(2.5rem, 5vw, 4rem) 0",
                            borderTop: "1px solid var(--surface-border)",
                        }}
                    >
                        <GeodeticLinesSection
                            destinationLat={city.lat}
                            destinationLon={city.lon}
                            cityPrimary={cityPrimary}
                        />
                    </div>

                    {/* Colophon */}
                    <Colophon
                        cityLabel={city.label}
                        lat={city.lat}
                        lon={city.lon}
                        generated={forecast.generated}
                        windowDays={forecast.windowDays}
                        endDate={forecast.endDate}
                    />
                </div>
            </div>
        </div>
    );
}
