"use client";

import { useMemo } from "react";
import AppNavbar from "@/app/components/AppNavbar";
import {
    type GWCityForecast,
    type GWInterpretation,
} from "@/app/lib/geodetic-weather-types";
import { Brief } from "./Brief";
import { BestWindows } from "./BestWindows";
import { WhyThisPlace } from "./WhyThisPlace";
import { GanttTimelineSection } from "./GanttTimelineSection";
import { MovementsSection } from "./MovementsSection";
import { LinesEditorial } from "./LinesEditorial";
import { GeodeticLinesSection } from "./GeodeticLinesSection";
import { TimingDecisions } from "./TimingDecisions";
import { Colophon } from "./Colophon";

interface WeatherForecastPayload {
    windowDays: number;
    startDate: string;
    endDate: string;
    goalFilter: string | null;
    cities: GWCityForecast[];
    macroScore?: number;
    interpretation?: GWInterpretation;
    natalPlanets?: Array<{ name?: string; planet?: string; longitude: number }>;
    birthDateTimeUTC?: string | null;
    birthLon?: number | null;
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

export default function WeatherReading({ forecast, readingId }: Props) {
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
                    {/* ─── 01 · BRIEF ─────────────────────────────── */}
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
                        readingId={readingId}
                    />

                    {/* ─── 02 · BEST TRAVEL WINDOWS ──────────────── */}
                    <div style={{ padding: "clamp(1.5rem, 3vw, 2.5rem) 0" }}>
                        <BestWindows windows={travelWindows} />
                    </div>

                    {/* ─── 03 · WHY THIS PLACE, THIS SEASON ──────── */}
                    <WhyThisPlace
                        hook={interpretation.hook || DEFAULT_INTERPRETATION.hook}
                        dropLine={interpretation.dropLine}
                    />

                    {/* ─── 04 · WHEN THE SKY OPENS (Gantt) ───────── */}
                    <div
                        style={{
                            padding: "clamp(2.5rem, 5vw, 4rem) 0",
                            borderTop: "1px solid var(--surface-border)",
                        }}
                    >
                        <GanttTimelineSection days={days} startDate={forecast.startDate} />
                    </div>

                    {/* ─── 05 · MOVEMENTS ────────────────────────── */}
                    <MovementsSection movements={interpretation.keyMoments ?? []} />

                    {/* ─── 06 · § 1 — THE GEODETIC READING ───────── */}
                    <LinesEditorial
                        natalPlanets={forecast.natalPlanets ?? []}
                        birthDateTimeUTC={forecast.birthDateTimeUTC ?? null}
                        birthLon={forecast.birthLon ?? null}
                        destinationLat={city.lat}
                        destinationLon={city.lon}
                        cityPrimary={cityPrimary}
                    />

                    {/* ─── 07 · § 2 — THE GEODETIC LENS (permanent) */}
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

                    {/* ─── 08 · § 3 + § 4 — TIMING + FRAMEWORK ───── */}
                    <TimingDecisions />

                    {/* ─── COLOPHON ──────────────────────────────── */}
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
