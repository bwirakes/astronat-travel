"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/app/page-header-context";
import {
    type GWCityForecast,
    type Tier,
} from "@/app/lib/geodetic-weather-types";
import { MundaneBrief } from "./MundaneBrief";
import { PressureTimeline } from "./PressureTimeline";
import { ActiveLayers } from "./ActiveLayers";
import { RiskMatrix } from "./RiskMatrix";
import { Colophon } from "../Colophon";

interface WeatherForecastPayload {
    windowDays: number;
    startDate: string;
    endDate: string;
    goalFilter: string | null;
    cities: GWCityForecast[];
    macroScore?: number;
    /** Single AI sentence — the NOAA-style situation lead. */
    mundaneLead?: string | null;
    generated?: string;
}

interface Props {
    forecast: WeatherForecastPayload;
}

function worstTier(days: Array<{ severity: Tier }>): Tier {
    const order: Tier[] = ["Calm", "Unsettled", "Turbulent", "Severe", "Extreme"];
    let worst: Tier = "Calm";
    for (const d of days) {
        if (order.indexOf(d.severity) > order.indexOf(worst)) worst = d.severity;
    }
    return worst;
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

/**
 * Mundane / weather reading. Frame = NOAA forecast discussion, not magazine.
 * Single AI sentence (situation lead). Everything else is deterministic.
 */
export default function MundaneReading({ forecast }: Props) {
    const city = forecast.cities[0];
    const days = city.days;
    const tier = useMemo(() => worstTier(days), [days]);
    const cityPrimary = city.label.split(",")[0].trim();
    const cityFull = city.label;

    const dateRangeLabel = `${fmtMonthDayYear(forecast.startDate)} — ${fmtMonthDayYear(forecast.endDate)}`;
    const generatedLabel = forecast.generated ? fmtMonthDayYear(forecast.generated) : fmtMonthDayYear(new Date().toISOString());

    const lead =
        forecast.mundaneLead
        || `Geodetic weather report for ${cityPrimary} across ${forecast.windowDays} days — scroll for the pressure gradient and active-layer breakdown.`;

    return (
        <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
            <PageHeader title={cityPrimary} backTo="/readings" backLabel="All readings" />
            <div style={{ padding: "clamp(1rem, 2.5vw, 2rem)" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column" }}>
                    {/* A — Brief */}
                    <MundaneBrief
                        cityFull={cityFull}
                        cityPrimary={cityPrimary}
                        coordsLabel={fmtCoords(city.lat, city.lon)}
                        dateRangeLabel={dateRangeLabel}
                        windowDays={forecast.windowDays}
                        generatedLabel={generatedLabel}
                        tier={tier}
                        situationLead={lead}
                    />

                    {/* B — Pressure timeline */}
                    <div style={{ padding: "clamp(1.5rem, 3vw, 2.5rem) 0" }}>
                        <PressureTimeline days={days} startDate={forecast.startDate} />
                    </div>

                    {/* C — Active layers */}
                    <ActiveLayers days={days} />

                    {/* D — Risk matrix */}
                    <RiskMatrix days={days} goalFilter={forecast.goalFilter} />

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
