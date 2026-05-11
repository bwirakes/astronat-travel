"use client";

import type { GeodeticWeatherResult } from "@/app/lib/geodetic-weather-types";
import { LinesSection } from "./LinesSection";
import { GeodeticLinesSection } from "./GeodeticLinesSection";
import { GanttTimelineSection } from "./GanttTimelineSection";

interface Props {
    natalPlanets: Array<{ name?: string; planet?: string; longitude: number }>;
    birthDateTimeUTC: string | null;
    birthLon: number | null;
    destinationLat: number;
    destinationLon: number;
    cityPrimary: string;
    days: GeodeticWeatherResult[];
    startDate: string;
}

/**
 * The final power-user section. Three sub-sections stacked:
 *   1. ACG lines — your time-sensitive planetary lines over this city
 *   2. Geodetic lines — the permanent zodiac column this city sits in
 *   3. Transit windows — the Gantt of what's moving across the forecast
 *
 * All three share a single top-level "04 · The detail" kicker + H2 so the
 * reader reads them as one bundled appendix rather than three separate
 * sections. Each sub-section carries its own smaller heading inside.
 */
export function DetailsBundle({
    natalPlanets,
    birthDateTimeUTC,
    birthLon,
    destinationLat,
    destinationLon,
    cityPrimary,
    days,
    startDate,
}: Props) {
    return (
        <section
            aria-label="Technical details"
            style={{
                padding: "clamp(2.5rem, 5vw, 4.5rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(2rem, 4vw, 3rem)",
            }}
        >
            <header style={{ maxWidth: "820px" }}>
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
                    04 · The detail
                </div>
                <h2
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(2rem, 5vw, 4rem)",
                        lineHeight: 0.95,
                        letterSpacing: "-0.02em",
                        margin: "0 0 0.9rem",
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        textWrap: "balance",
                    }}
                >
                    The{" "}
                    <span
                        style={{
                            fontFamily: "var(--font-display-alt-2)",
                            color: "var(--color-y2k-blue)",
                            textTransform: "lowercase",
                            letterSpacing: 0,
                            fontSize: "1em",
                        }}
                    >
                        proof
                    </span>{" "}
                    underneath
                </h2>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.55,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "62ch",
                        textWrap: "pretty",
                        fontWeight: 300,
                    }}
                >
                    Geodetic weather runs on two lenses. The ACG lens below is <em>time-sensitive</em> — your planetary lines crossing this city at this moment. The Geodetic lens is <em>permanent</em> — the zodiac projected onto earth, fixed forever. The transit timeline aggregates both into the window you&apos;re planning against.
                </p>
            </header>

            {/* Sub-section 1 — ACG lines (time-sensitive) */}
            <LinesSection
                natalPlanets={natalPlanets}
                birthDateTimeUTC={birthDateTimeUTC}
                birthLon={birthLon}
                destinationLat={destinationLat}
                destinationLon={destinationLon}
                cityPrimary={cityPrimary}
            />

            {/* Sub-section 2 — Geodetic lines (permanent) */}
            <GeodeticLinesSection
                destinationLat={destinationLat}
                destinationLon={destinationLon}
                cityPrimary={cityPrimary}
            />

            {/* Sub-section 3 — Gantt transit timeline */}
            <GanttTimelineSection days={days} startDate={startDate} />
        </section>
    );
}
