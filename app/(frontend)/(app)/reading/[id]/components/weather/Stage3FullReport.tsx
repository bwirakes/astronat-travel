"use client";

import { ArrowLeft } from "lucide-react";
import type { GWCityForecast } from "@/app/lib/geodetic-weather-types";
import { BestWorstList } from "./BestWorstList";
import { CalendarGrid } from "./CalendarGrid";
import { DayDetail } from "./DayDetail";

interface Props {
    city: GWCityForecast;
    selectedIndex: number;
    onSelect: (i: number) => void;
    onBack: () => void;
}

export function Stage3FullReport({ city, selectedIndex, onSelect, onBack }: Props) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            {/* Full shortlist — chronological, filterable */}
            <BestWorstList days={city.days} onPick={onSelect} selectedIndex={selectedIndex} />

            {/* Calendar + sticky day detail */}
            <div
                className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr]"
                style={{ gap: "clamp(1rem, 2.5vw, 2.5rem)", alignItems: "start" }}
            >
                <div style={{ minWidth: 0 }}>
                    <CalendarGrid days={city.days} onSelect={onSelect} selectedIndex={selectedIndex} />
                </div>
                <div style={{ minWidth: 0, position: "sticky", top: "1.5rem" }}>
                    <DayDetail day={city.days[selectedIndex]} cityLabel={city.label} />
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button
                    onClick={onBack}
                    className="btn btn-secondary"
                    style={{
                        padding: "0.75rem 1.1rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <ArrowLeft size={15} /> Back to interpretation
                </button>
            </div>
        </div>
    );
}
