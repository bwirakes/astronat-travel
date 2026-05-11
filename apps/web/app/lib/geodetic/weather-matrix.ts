import {
    ALL_GEODETIC_WEATHER_EVENTS,
    FORECAST_WEATHER_EVENTS,
    tierFromPss,
} from "./weather-predictions";
import { GEODETIC_WEATHER_SOURCE_CATALOG } from "./weather-source";
import type {
    GeodeticHotspot,
    GeodeticMatrixResponse,
    GeodeticRiskTier,
    GeodeticTimeSlice,
    GeodeticWeatherEvent,
} from "./weather-types";

const DEFAULT_RESOLUTION = 1;
const TRIGGER_CRITERIA_PATTERN = /T12|trigger/;

function range360(step: number): number[] {
    const safeStep = Math.max(1, Math.round(step));
    return Array.from({ length: Math.ceil(360 / safeStep) }, (_, i) => i * safeStep).filter((v) => v < 360);
}

function downsample(scores: number[], longitudes: number[]): number[] {
    return longitudes.map((lon) => scores[lon] ?? 0);
}

function phaseSplit(event: GeodeticWeatherEvent, scores: number[]): { phase1: number[]; phase2: number[] } {
    const triggerBoost = TRIGGER_CRITERIA_PATTERN.test(event.criteria.key) ? 0.22 : 0.12;
    const phase2 = scores.map((score) => Number(Math.min(score, triggerBoost * event.pss).toFixed(3)));
    const phase1 = scores.map((score, i) => Number(Math.max(0, score - phase2[i]).toFixed(3)));
    return { phase1, phase2 };
}

function hotspotTier(score: number): Exclude<GeodeticRiskTier, "low"> {
    const tier = tierFromPss(score);
    return tier === "low" ? "watch" : tier;
}

function makeHotspots(events: GeodeticWeatherEvent[], longitudes: number[]): GeodeticHotspot[] {
    const peaks = events
        .filter((event) => event.pss >= 0.55)
        .flatMap((event) => {
            const scores = downsample(event.heatmap, longitudes);
            const max = Math.max(...scores);
            return scores
                .map((score, i) => ({ score, lon: longitudes[i] }))
                .filter((row) => row.score >= Math.max(0.55, max - 0.02))
                .slice(0, 3)
                .map((row) => ({
                    longitude: row.lon,
                    score: Number(row.score.toFixed(3)),
                    tier: hotspotTier(row.score),
                    label: event.title,
                    topFactors: [
                        event.type.replace("_", " "),
                        event.pair ?? "no pair flag",
                        event.geostress ?? "geodetic pressure",
                    ],
                }));
        });

    return peaks.sort((a, b) => b.score - a.score).slice(0, 18);
}

export function buildGeodeticMatrixResponse(params: {
    startDate?: string;
    endDate?: string;
    longitudeResolution?: number;
    includeHistorical?: boolean;
} = {}): GeodeticMatrixResponse {
    const resolution = params.longitudeResolution ?? DEFAULT_RESOLUTION;
    const longitudes = range360(resolution);
    const eventPool = params.includeHistorical ? ALL_GEODETIC_WEATHER_EVENTS : FORECAST_WEATHER_EVENTS;
    const startDate = params.startDate ?? eventPool[0]?.date ?? "2026-02-17";
    const endDate = params.endDate ?? eventPool[eventPool.length - 1]?.date ?? "2026-12-01";
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T00:00:00Z`).getTime();
    const events = eventPool.filter((event) => {
        const t = new Date(`${event.date}T00:00:00Z`).getTime();
        return t >= start && t <= end;
    });

    const timeSlices: GeodeticTimeSlice[] = events.map((event) => {
        const scores = downsample(event.heatmap, longitudes);
        const { phase1, phase2 } = phaseSplit(event, scores);
        return {
            dateUtc: event.date,
            eventId: event.id,
            scores,
            phase1,
            phase2,
        };
    });

    const globalHeatmap = longitudes.map((_, i) => {
        const max = timeSlices.reduce((peak, slice) => Math.max(peak, slice.scores[i] ?? 0), 0);
        return Number(max.toFixed(3));
    });

    return {
        startDate,
        endDate,
        longitudeResolution: resolution,
        longitudes,
        globalHeatmap,
        events,
        sourceCatalog: GEODETIC_WEATHER_SOURCE_CATALOG,
        timeSlices,
        hotspots: makeHotspots(events, longitudes),
    };
}
