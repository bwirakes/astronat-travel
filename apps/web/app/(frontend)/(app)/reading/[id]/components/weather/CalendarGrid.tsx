"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    BUCKET_COPY,
    tierToBucket,
    type GeodeticWeatherResult,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    days: GeodeticWeatherResult[];
    onSelect: (index: number) => void;
    selectedIndex: number;
}

const DOW_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthPage {
    year: number;
    month: number;
    label: string;
    /** Original-array indices for the days that fall in this month. */
    dayIndices: number[];
}

function buildMonthPages(days: GeodeticWeatherResult[]): MonthPage[] {
    const map = new Map<string, MonthPage>();
    for (let i = 0; i < days.length; i++) {
        const dt = new Date(days[i].dateUtc);
        const y = dt.getUTCFullYear();
        const m = dt.getUTCMonth();
        const key = `${y}-${m}`;
        if (!map.has(key)) {
            map.set(key, {
                year: y,
                month: m,
                label: new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
                dayIndices: [],
            });
        }
        map.get(key)!.dayIndices.push(i);
    }
    return Array.from(map.values());
}

export function CalendarGrid({ days, onSelect, selectedIndex }: Props) {
    const pages = useMemo(() => buildMonthPages(days), [days]);

    // Default page = whichever contains the selected day.
    const initialPage = Math.max(0, pages.findIndex((p) => p.dayIndices.includes(selectedIndex)));
    const [pageIdx, setPageIdx] = useState(initialPage);
    const page = pages[pageIdx] ?? pages[0];

    if (!page) return null;

    const { year, month, label, dayIndices } = page;
    const firstDt = new Date(Date.UTC(year, month, 1));
    const firstDow = (firstDt.getUTCDay() + 6) % 7; // Mon = 0
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    return (
        <section>
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
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
                        02 · The whole window
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
                        Tap a{" "}
                        <span
                            style={{
                                fontFamily: "var(--font-display-alt-2)",
                                color: "var(--color-y2k-blue)",
                                textTransform: "none",
                                fontSize: "1.05em",
                                letterSpacing: 0,
                            }}
                        >
                            day
                        </span>
                    </h2>
                </div>
                <Legend />
            </header>

            {/* Month nav strip */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "0.65rem 0.85rem",
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    clipPath: "var(--cut-md)",
                    marginBottom: "0.85rem",
                }}
            >
                <button
                    onClick={() => setPageIdx((n) => Math.max(0, n - 1))}
                    disabled={pageIdx === 0}
                    aria-label="Previous month"
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: pageIdx === 0 ? "not-allowed" : "pointer",
                        color: pageIdx === 0 ? "var(--text-tertiary)" : "var(--text-primary)",
                        padding: "0.35rem 0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        opacity: pageIdx === 0 ? 0.35 : 1,
                    }}
                >
                    <ChevronLeft size={14} />
                    {pages[pageIdx - 1]?.label.split(" ")[0] ?? "—"}
                </button>

                <div
                    style={{
                        fontFamily: "var(--font-secondary)",
                        fontSize: "clamp(1.25rem, 2vw, 1.75rem)",
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                    }}
                >
                    {label}
                </div>

                <button
                    onClick={() => setPageIdx((n) => Math.min(pages.length - 1, n + 1))}
                    disabled={pageIdx === pages.length - 1}
                    aria-label="Next month"
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: pageIdx === pages.length - 1 ? "not-allowed" : "pointer",
                        color: pageIdx === pages.length - 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                        padding: "0.35rem 0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        opacity: pageIdx === pages.length - 1 ? 0.35 : 1,
                    }}
                >
                    {pages[pageIdx + 1]?.label.split(" ")[0] ?? "—"}
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Day-of-week strip */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "6px",
                    marginBottom: "6px",
                }}
            >
                {DOW_HEADERS.map((h) => (
                    <div
                        key={h}
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.25em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            textAlign: "center",
                            padding: "0.4rem 0",
                            fontWeight: 700,
                        }}
                    >
                        {h}
                    </div>
                ))}
            </div>

            {/* Cell grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "6px",
                }}
            >
                {Array.from({ length: firstDow }).map((_, i) => (
                    <div key={`pad-${i}`} style={{ aspectRatio: "1 / 1", opacity: 0.25 }} aria-hidden>
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "1px dashed var(--surface-border)",
                                clipPath: "var(--cut-sm)",
                            }}
                        />
                    </div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dateNum = i + 1;
                    const srcIdx = dayIndices.find((ix) => new Date(days[ix].dateUtc).getUTCDate() === dateNum);

                    if (srcIdx === undefined) {
                        // Month cell outside the forecast window.
                        return (
                            <div key={dateNum} style={{ aspectRatio: "1 / 1", opacity: 0.5 }}>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        background: "transparent",
                                        border: "1px dashed var(--surface-border)",
                                        clipPath: "var(--cut-sm)",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "flex-start",
                                        padding: "0.4rem 0.5rem",
                                        color: "var(--text-tertiary)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {dateNum}
                                </div>
                            </div>
                        );
                    }

                    const d = days[srcIdx];
                    const bucket = tierToBucket(d.severity);
                    const copy = BUCKET_COPY[bucket];
                    const isSelected = srcIdx === selectedIndex;

                    return (
                        <button
                            key={dateNum}
                            onClick={() => onSelect(srcIdx)}
                            aria-label={`${label.split(" ")[0]} ${dateNum} — ${copy.short}`}
                            aria-pressed={isSelected}
                            style={{
                                aspectRatio: "1 / 1",
                                position: "relative",
                                background: copy.bg,
                                color: "var(--text-primary)",
                                border: `2px solid ${isSelected ? copy.accent : "transparent"}`,
                                clipPath: "var(--cut-md)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                padding: "0.55rem 0.7rem",
                                transition: "transform 0.15s ease, background 0.15s ease",
                                fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-primary)",
                                    fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                                    lineHeight: 1,
                                    letterSpacing: "-0.02em",
                                    color: "var(--text-primary)",
                                }}
                            >
                                {dateNum}
                            </span>

                            {/* Bottom accent row: 3 dots representing top-3 event intensity */}
                            <div style={{ display: "flex", gap: 3, alignItems: "center", alignSelf: "flex-end" }} aria-hidden>
                                {[0, 1, 2].map((k) => (
                                    <span
                                        key={k}
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 1,
                                            background: d.events[k] ? copy.accent : "transparent",
                                            border: `1px solid ${copy.accent}`,
                                            opacity: d.events[k] ? 1 : 0.3,
                                        }}
                                    />
                                ))}
                            </div>

                            {isSelected && (
                                <span
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        top: -6,
                                        right: -6,
                                        width: 14,
                                        height: 14,
                                        background: copy.accent,
                                        borderRadius: "50%",
                                        border: "2px solid var(--bg)",
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function Legend() {
    return (
        <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
            {(["good", "mixed", "rough"] as const).map((b) => {
                const c = BUCKET_COPY[b];
                return (
                    <span
                        key={b}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.2em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        <span
                            aria-hidden
                            style={{ width: 10, height: 10, borderRadius: 2, background: c.accent, display: "inline-block" }}
                        />
                        {c.short}
                    </span>
                );
            })}
        </div>
    );
}
