"use client";

import { useMemo, useState } from "react";
import {
    BUCKET_COPY,
    dayCardCopy,
    tierToBucket,
    type Bucket,
    type GeodeticWeatherResult,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    days: GeodeticWeatherResult[];
    onPick: (originalIndex: number) => void;
    /** Currently-selected day — renders a pressed/selected state. */
    selectedIndex: number;
}

type Filter = "priority" | "good" | "rough";

const FILTERS: Array<{ id: Filter; label: string; hint: string }> = [
    { id: "priority", label: "High priority", hint: "The days that actually matter" },
    { id: "good", label: "Green light", hint: "Pick these for important plans" },
    { id: "rough", label: "Red flag", hint: "Consider shifting these" },
];

/**
 * Apply the active filter to the full day list. Always chronological.
 */
function filterDays(
    days: GeodeticWeatherResult[],
    filter: Filter,
): Array<{ day: GeodeticWeatherResult; index: number }> {
    const all = days.map((day, index) => ({ day, index }));
    if (filter === "good") return all.filter((x) => tierToBucket(x.day.severity) === "good");
    if (filter === "rough") return all.filter((x) => tierToBucket(x.day.severity) === "rough");
    // priority: top 4 good + top 4 rough by score, then re-sorted chronologically
    const good = [...all]
        .filter((x) => tierToBucket(x.day.severity) === "good")
        .sort((a, b) => b.day.score - a.day.score)
        .slice(0, 4);
    const rough = [...all]
        .filter((x) => tierToBucket(x.day.severity) === "rough")
        .sort((a, b) => a.day.score - b.day.score)
        .slice(0, 4);
    return [...good, ...rough].sort((a, b) => a.index - b.index);
}

export function BestWorstList({ days, onPick, selectedIndex }: Props) {
    const [filter, setFilter] = useState<Filter>("priority");
    const rows = useMemo(() => filterDays(days, filter), [days, filter]);

    return (
        <section>
            {/* Header */}
            <header
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: "1.25rem",
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.65rem",
                            letterSpacing: "0.25em",
                            color: "var(--color-y2k-blue)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginBottom: "0.35rem",
                        }}
                    >
                        01 · The shortlist
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(2rem, 4vw, 3rem)",
                            lineHeight: 0.9,
                            letterSpacing: "-0.03em",
                            margin: 0,
                            color: "var(--text-primary)",
                            textTransform: "uppercase",
                        }}
                    >
                        Pick your{" "}
                        <span
                            style={{
                                fontFamily: "var(--font-display-alt-2)",
                                color: "var(--color-spiced-life)",
                                textTransform: "none",
                                fontSize: "1.05em",
                                letterSpacing: 0,
                            }}
                        >
                            dates
                        </span>
                    </h2>
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "32ch",
                        textAlign: "right",
                        lineHeight: 1.45,
                    }}
                >
                    Chronological. Each day carries the planetary driver and a practical translation.
                </p>
            </header>

            {/* Filter tabs */}
            <div
                role="tablist"
                aria-label="Filter shortlist"
                style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "1.25rem",
                    flexWrap: "wrap",
                }}
            >
                {FILTERS.map((f) => {
                    const isActive = filter === f.id;
                    return (
                        <button
                            key={f.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setFilter(f.id)}
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.62rem",
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                padding: "0.55rem 0.95rem",
                                background: isActive ? "var(--color-charcoal)" : "transparent",
                                color: isActive ? "var(--color-eggshell)" : "var(--text-secondary)",
                                border: `1px solid ${isActive ? "var(--color-charcoal)" : "var(--surface-border)"}`,
                                clipPath: "var(--cut-sm)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                            }}
                        >
                            {f.label}
                            <span
                                aria-hidden
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: "1.6rem",
                                    padding: "0 0.35rem",
                                    height: "1rem",
                                    background: isActive ? "var(--color-y2k-blue)" : "var(--surface-border)",
                                    color: isActive ? "var(--color-eggshell)" : "var(--text-tertiary)",
                                    borderRadius: "999px",
                                    fontSize: "0.58rem",
                                    fontWeight: 800,
                                }}
                            >
                                {f.id === "priority"
                                    ? filterDays(days, "priority").length
                                    : f.id === "good"
                                    ? days.filter((d) => tierToBucket(d.severity) === "good").length
                                    : days.filter((d) => tierToBucket(d.severity) === "rough").length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <ol
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}
            >
                {rows.length === 0 ? (
                    <li
                        style={{
                            padding: "1.5rem",
                            border: "1px dashed var(--surface-border)",
                            color: "var(--text-tertiary)",
                            fontFamily: "var(--font-body)",
                            fontSize: "0.9rem",
                            fontStyle: "italic",
                            textAlign: "center",
                        }}
                    >
                        Nothing in this filter.
                    </li>
                ) : (
                    rows.map(({ day, index }) => (
                        <DateCard
                            key={day.dateUtc}
                            day={day}
                            originalIndex={index}
                            isSelected={index === selectedIndex}
                            onPick={onPick}
                        />
                    ))
                )}
            </ol>
        </section>
    );
}

function DateCard({
    day,
    originalIndex,
    isSelected,
    onPick,
}: {
    day: GeodeticWeatherResult;
    originalIndex: number;
    isSelected: boolean;
    onPick: (i: number) => void;
}) {
    const bucket: Bucket = tierToBucket(day.severity);
    const copy = BUCKET_COPY[bucket];
    const { driver, impact } = dayCardCopy(day);
    const dt = new Date(day.dateUtc);

    const weekday = dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const month = dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    const dayNum = dt.getUTCDate();

    return (
        <li>
            <button
                onClick={() => onPick(originalIndex)}
                aria-pressed={isSelected}
                style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "72px 1fr auto",
                    gap: "1rem",
                    alignItems: "stretch",
                    textAlign: "left",
                    padding: "0",
                    background: isSelected ? "var(--bg-raised)" : "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderLeft: `4px solid ${copy.accent}`,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    transition: "background 0.15s ease",
                    fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--bg-raised)";
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--surface)";
                }}
            >
                {/* Left — crisp date badge, high-contrast numeric */}
                <div
                    style={{
                        background: "transparent",
                        borderRight: "1px solid var(--surface-border)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0.9rem 0.5rem",
                        gap: "2px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.2em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        {weekday}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "2rem",
                            fontWeight: 800,
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                            color: "var(--text-primary)",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {dayNum}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.2em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        {month}
                    </span>
                </div>

                {/* Middle — three-tier content: driver (kicker) · impact (body) */}
                <div
                    style={{
                        padding: "0.85rem 0.25rem 0.85rem 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.2rem",
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6rem",
                            letterSpacing: "0.18em",
                            color: copy.accent,
                            textTransform: "uppercase",
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                        title={driver}
                    >
                        {driver}
                    </span>
                    <p
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.92rem",
                            lineHeight: 1.4,
                            color: "var(--text-primary)",
                            margin: 0,
                        }}
                    >
                        {impact}
                    </p>
                </div>

                {/* Right — bucket pill + chevron cue */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        padding: "0.85rem 1rem",
                        gap: "0.4rem",
                        minWidth: "90px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.2em",
                            padding: "0.3rem 0.6rem",
                            border: `1px solid ${copy.accent}`,
                            color: copy.accent,
                            textTransform: "uppercase",
                            fontWeight: 800,
                            borderRadius: "999px",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {copy.short}
                    </span>
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.15em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        open →
                    </span>
                </div>
            </button>
        </li>
    );
}
