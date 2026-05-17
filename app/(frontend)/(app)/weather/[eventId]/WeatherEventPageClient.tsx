"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ChevronDown, Skull, DollarSign, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/app/page-header-context";
import { ReadingsAtlasMap } from "@/app/components/ReadingsAtlasMap";
import SignIcon from "@/app/components/SignIcon";
import PlanetIcon from "@/app/components/PlanetIcon";
import { tierAccent, tierLabel } from "@/app/lib/geodetic/weather-predictions";
import { triggersForWindow } from "@/app/lib/geodetic/weather-triggers";
import type { GeodeticMatrixResponse, GeodeticRiskTier, GeodeticWeatherEvent } from "@/app/lib/geodetic/weather-types";
import { eventHasMappableLocation, weatherEventToAtlasPins } from "../weather-map-pins";
import { ActionPrompt, WarningSign, alertLevelFor, alertWordFor } from "./components/WeatherIndicators";
import {
    ActionBadge, TypeBadge, WhenBadge, WhereBadge,
} from "./components/WeatherGuideRowBadge";
import { parseEventLocation } from "./event-location";

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_SECONDARY = "var(--font-secondary, serif)";
const FONT_MONO = "var(--font-mono, monospace)";
const FONT_BODY = "var(--font-body, system-ui)";

// ─── Vocabulary tables ─────────────────────────────────────────────────────

const TYPE_WORD: Record<string, string> = {
    flood:          "Flood",
    wildfire:       "Wildfire",
    storm_cyclone:  "Big Storm",
    earthquake:     "Earthquake",
    heatwave:       "Heat Wave",
    tornado:        "Tornado",
    winter_storm:   "Winter Storm",
    compound:       "Compound Event",
};
const TYPE_VERBOSE: Record<string, string> = {
    flood:          "heavy rain and flooding",
    wildfire:       "wildfire risk",
    storm_cyclone:  "big storm or cyclone",
    earthquake:     "earthquake or seismic activity",
    heatwave:       "very hot weather",
    tornado:        "tornado risk",
    winter_storm:   "snow, ice, or freezing weather",
    compound:       "many weather problems together",
};

function typeWordFor(type: string): string { return TYPE_WORD[type] ?? type; }
function typeVerboseFor(type: string): string { return TYPE_VERBOSE[type] ?? type; }

// ─── Date-range generator ─────────────────────────────────────────────────

/**
 * "FEB 14 — FEB 24, 2026" — the activation window for this event. Width of
 * the window scales by tier (the more critical, the longer we tell readers
 * to watch). Historical events get a ±2-day window since the event itself
 * was a single day; that conveys "the watch window in retrospect."
 */
function dateRangeFor(event: GeodeticWeatherEvent): string {
    const radiusDays = (() => {
        switch (event.tier) {
            case "critical": return 7;
            case "high":     return 5;
            case "moderate": return 4;
            case "watch":    return 3;
            default:         return 2;
        }
    })();
    const center = new Date(`${event.date}T12:00:00Z`);
    const start = new Date(center); start.setUTCDate(start.getUTCDate() - radiusDays);
    const end = new Date(center); end.setUTCDate(end.getUTCDate() + radiusDays);
    return formatRange(start, end);
}

function formatRange(start: Date, end: Date): string {
    // Hand-formatted to avoid Intl quirks where `month: undefined` produces
    // "DAY: 24"-style output on some locales. Three branches:
    //   sameMonth → "FEB 10 — 24, 2026"
    //   sameYear  → "FEB 10 — MAR 5, 2026"
    //   neither   → "DEC 30, 2025 — JAN 5, 2026"
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const sm = monthNames[start.getUTCMonth()];
    const em = monthNames[end.getUTCMonth()];
    const sd = start.getUTCDate();
    const ed = end.getUTCDate();
    const sy = start.getUTCFullYear();
    const ey = end.getUTCFullYear();

    if (sy === ey && sm === em) return `${sm} ${sd} — ${ed}, ${ey}`;
    if (sy === ey)              return `${sm} ${sd} — ${em} ${ed}, ${ey}`;
    return `${sm} ${sd}, ${sy} — ${em} ${ed}, ${ey}`;
}

function friendlyDate(dateStr: string): string {
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
}

function daysFromToday(dateStr: string): string {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const target = new Date(`${dateStr}T00:00:00Z`);
    const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 0)   return relativeLabel(days, "from now");
    return relativeLabel(-days, "ago");
}

function relativeLabel(absDays: number, suffix: string): string {
    if (absDays < 30) return `${absDays} days ${suffix}`;
    if (absDays < 365) {
        const months = Math.round(absDays / 30);
        return `${months} month${months === 1 ? "" : "s"} ${suffix}`;
    }
    const years = Math.floor(absDays / 365);
    const remainder = absDays - years * 365;
    const months = Math.round(remainder / 30);
    if (months === 0) return `${years} year${years === 1 ? "" : "s"} ${suffix}`;
    return `${years} year${years === 1 ? "" : "s"}, ${months} month${months === 1 ? "" : "s"} ${suffix}`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function WeatherEventPageClient({ event, matrix }: {
    event: GeodeticWeatherEvent;
    matrix: GeodeticMatrixResponse;
}) {
    const triggers = triggersForWindow(event.date);
    const factorItems = [...event.stars, event.pair, event.geostress].filter((item): item is string => Boolean(item));
    const criteriaChips = event.criteria.key.split(" · ").filter(Boolean);
    const location = parseEventLocation(event);
    const canShowMap = eventHasMappableLocation(event);
    const isHistorical = event.kind === "historical";
    const dateRange = dateRangeFor(event);
    // Decompose the headline into kicker + location + caption. The location
    // is the page's identity (where the event is); the kicker carries the
    // type+severity; the caption preserves the curated event title.
    const kickerHeadline = `${typeWordFor(event.type).toUpperCase()} ${alertWordFor(event.tier)}`;
    const locationHeadline = location.label;
    const captionHeadline = event.title;

    return (
        <>
            <PageHeader title={event.title} backTo="/weather" backLabel="Weather" />
            <div className="weather-event-shell min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
                <div className="banner-wrap">
                    <WeatherHeroBanner
                        event={event}
                        kickerHeadline={kickerHeadline}
                        locationHeadline={locationHeadline}
                        captionHeadline={captionHeadline}
                        dateRange={dateRange}
                    />
                </div>

                <main className="event-main">
                    <AlertStrip tier={event.tier} typeWord={typeWordFor(event.type)} isHistorical={isHistorical} />

                    <AtAGlance event={event} location={location} isHistorical={isHistorical} />

                    <NarrativeSection event={event} location={location} isHistorical={isHistorical} />

                    {canShowMap ? (
                        <MapSection event={event} location={location} />
                    ) : isHistorical && (event.deaths || event.damageBillions || event.source) ? (
                        <OutcomeSection event={event} location={location} />
                    ) : null}

                    <TimelineSection event={event} />

                    <section style={{ ...section, borderBottom: "none" }}>
                        <div style={kicker}>For the curious</div>
                        <h2 style={title}>Astrology detail</h2>
                        <p style={{ ...body, fontSize: "0.9rem", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
                            Open any card to see the astrology behind this prediction.
                        </p>

                        <div style={{ display: "grid", gap: "0.6rem" }}>
                            <Collapsible summary="The full astrology read" badge={`${event.editorialBody.length} chars`}>
                                <p style={{ ...body, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.7 }}>
                                    <AstroBody text={event.editorialBody} />
                                </p>
                            </Collapsible>
                            <Collapsible summary="Why this scored what it did" badge={`${event.criteria.met} of ${event.criteria.total} criteria`}>
                                <div style={{ display: "grid", gap: "0.75rem" }}>
                                    <CriteriaSummary event={event} />
                                    <CriteriaChecklistBlock chips={criteriaChips} />
                                </div>
                            </Collapsible>
                            <Collapsible summary="Stars and sensitizers" badge={`${factorItems.length} items`}>
                                <FactorList items={factorItems} />
                            </Collapsible>
                            <Collapsible summary="Trigger calendar" badge={`${triggers.aspects.length + triggers.moons.length} events nearby`}>
                                <TriggerBlock aspects={triggers.aspects} moons={triggers.moons} />
                            </Collapsible>
                            <Collapsible summary="How the model works" badge="Method notes">
                                <MethodBlock matrix={matrix} />
                            </Collapsible>
                        </div>
                    </section>
                </main>
            </div>

            <style jsx>{`
                .banner-wrap {
                    margin-top: clamp(16px, 2.4vw, 28px);
                    max-width: 1180px;
                    margin-left: auto;
                    margin-right: auto;
                    padding: 0 clamp(24px, 5vw, 72px);
                }
                @media (max-width: 640px) {
                    .banner-wrap { max-width: 100%; padding: 0; margin-top: 0; }
                }
                .event-main {
                    max-width: 1180px;
                    margin: 0 auto;
                    padding: 0 clamp(24px, 5vw, 72px);
                }
            `}</style>

            <style jsx global>{`
                .weather-event-shell { --reading-tabs-surface: var(--bg); }
                [data-theme="light"] .weather-event-shell { --reading-tabs-surface: var(--color-eggshell); }
            `}</style>
        </>
    );
}

// ─── Hero banner — IDENTICAL shape to /reading, spiced-life background ─────

/**
 * WeatherHeroBanner — direct mirror of /reading's ReadingHeroBanner shape:
 * star at top-right, bottom rounded curve, dark planet-disc with cutout,
 * the saturn/sun/comet illustration motif, eggshell score pill + verdict pill.
 *
 * The ONLY differences from /reading:
 *   • background = spiced-life gradient (#E67A7A → #D26565), not blue
 *   • score subscript = "/PSS" (PSS is 0–1, not 0–100)
 *   • title = "Flood Warning in X / Y / Z" (no flag emoji)
 *
 * Everything else — decoration positions, curve, illustration, verdict
 * pill placement — is verbatim from HundredOneReadingView so the two
 * pages share a single visual identity.
 */
function WeatherHeroBanner({
    event, kickerHeadline, locationHeadline, captionHeadline, dateRange,
}: {
    event: GeodeticWeatherEvent;
    kickerHeadline: string;
    locationHeadline: string;
    captionHeadline: string;
    dateRange: string;
}) {
    const verdict = tierLabel(event.tier);

    return (
        <div
            className="relative overflow-hidden rounded-t-[8px] rounded-b-0 max-sm:rounded-t-0"
            style={{
                minHeight: "clamp(200px, 22vw, 280px)",
                background: "linear-gradient(180deg, #E67A7A 0%, #D26565 100%)",
            }}
        >
            <div className="banner-grid">
                {/* LEFT — kicker → location → caption → date */}
                <div className="banner-title-col">
                    <span className="banner-kicker">{kickerHeadline}</span>
                    <h1 className="banner-headline">{locationHeadline}</h1>
                    <span className="banner-caption">{captionHeadline}</span>
                    <span className="banner-date">{dateRange}</span>
                </div>

                {/* RIGHT — score pill + verdict pill */}
                <div className="banner-pill-col">
                    <span className="pss-pill">
                        <span className="pss-num">{event.pss.toFixed(2)}</span>
                        <span className="pss-suffix">PSS</span>
                    </span>
                    <span className="verdict-pill">{verdict}</span>
                </div>
            </div>

            {/* Decorative star — single element, far top-right corner where it
                doesn't compete with the score pill */}
            <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="banner-star"
                style={{ color: "rgba(248, 245, 236, 0.45)" }}
            >
                <path d="M32 0 L38 25 L64 32 L38 39 L32 64 L26 39 L0 32 L26 25 Z" fill="currentColor" />
            </svg>

            {/* Bottom rounded curve — emerges into --reading-tabs-surface */}
            <div
                aria-hidden
                className="absolute inset-x-[-18%] bottom-[-47%] h-[60%] rounded-[50%]"
                style={{ background: "var(--reading-tabs-surface)", zIndex: 0 }}
            />

            <style jsx>{`
                .banner-grid {
                    position: relative;
                    z-index: 2;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: clamp(20px, 4vw, 56px);
                    align-items: start;
                    padding: clamp(28px, 4vw, 48px) clamp(20px, 4vw, 44px) clamp(40px, 5vw, 60px);
                    min-height: inherit;
                }
                .banner-title-col {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    align-self: stretch;
                    justify-content: center;
                }
                .banner-kicker {
                    display: inline-flex;
                    align-self: flex-start;
                    background: rgba(0,0,0,0.18);
                    border: 1px solid rgba(248,245,236,0.32);
                    color: #F8F5EC;
                    border-radius: 4px;
                    padding: 6px 12px 6px 10px;
                    font-family: ${FONT_MONO};
                    font-size: 11px;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    font-weight: 800;
                }
                .banner-headline {
                    color: #F8F5EC;
                    font-family: ${FONT_PRIMARY};
                    font-size: clamp(36px, 5vw, 64px);
                    line-height: 1;
                    letter-spacing: -0.015em;
                    text-shadow: 0 2px 0 rgba(0,0,0,0.08);
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    margin: 0;
                    font-weight: 400;
                }
                .banner-caption {
                    color: rgba(248,245,236,0.78);
                    font-family: ${FONT_MONO};
                    font-size: 11px;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    font-weight: 700;
                    line-height: 1.4;
                    /* Cap at 2 lines so very long captions don't push the
                       banner height. */
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .banner-date {
                    color: rgba(248,245,236,0.66);
                    font-family: ${FONT_MONO};
                    font-size: 11px;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    font-weight: 700;
                }
                .banner-pill-col {
                    position: relative;
                    z-index: 3;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 10px;
                    align-self: start;
                }
                .pss-pill {
                    display: inline-flex;
                    align-items: baseline;
                    background: #F8F5EC;
                    color: #1B1B1B;
                    border-radius: 999px;
                    padding: clamp(10px, 1.2vw, 14px) clamp(20px, 2.2vw, 28px);
                    box-shadow: 0 1px 0 rgba(0,0,0,0.04);
                    font-family: ${FONT_PRIMARY};
                }
                .pss-num {
                    font-size: clamp(38px, 5vw, 64px);
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }
                .pss-suffix {
                    margin-left: 6px;
                    font-family: ${FONT_MONO};
                    color: #8a8983;
                    font-size: clamp(11px, 0.95vw, 13px);
                    letter-spacing: 0.12em;
                }
                .verdict-pill {
                    background: #F8F5EC;
                    color: #D26565;
                    border-radius: 999px;
                    padding: 7px 16px;
                    font-family: ${FONT_MONO};
                    font-size: clamp(11px, 0.9vw, 12px);
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    font-weight: 800;
                }
                .banner-star {
                    position: absolute;
                    top: clamp(14px, 1.6vw, 22px);
                    right: clamp(14px, 1.6vw, 22px);
                    height: clamp(14px, 1.8vw, 24px);
                    width: clamp(14px, 1.8vw, 24px);
                    z-index: 1;
                }
                @media (max-width: 640px) {
                    .banner-grid {
                        grid-template-columns: 1fr;
                        gap: 18px;
                        padding: 20px 18px 36px;
                    }
                    .banner-title-col { order: 2; gap: 12px; }
                    .banner-pill-col { order: 1; flex-direction: row; align-items: center; align-self: flex-start; gap: 10px; }
                    .pss-pill { padding: 10px 16px; }
                    .pss-num { font-size: 32px; }
                    .banner-headline { font-size: clamp(28px, 8vw, 38px); }
                    .banner-star { display: none; }
                }
            `}</style>
        </div>
    );
}

// ─── Alert strip ────────────────────────────────────────────────────────────

function AlertStrip({
    tier, typeWord, isHistorical,
}: {
    tier: GeodeticRiskTier;
    typeWord: string;
    isHistorical: boolean;
}) {
    const color = tierAccent(tier);
    const action = isHistorical ? "Historical event — see outcome below." :
        tier === "critical" ? "Watch closely. Check local alerts." :
        tier === "high"     ? "Pay attention. Follow the news." :
        tier === "moderate" ? "Stay aware. Background monitoring." :
                              "Low priority for now.";

    // Single horizontal line on desktop; wraps cleanly on mobile.
    // Background uses --surface (neutral) so the callout reads as a distinct
    // section against the spiced-life banner above. Tier color is carried by
    // the left border + alert-level word only.
    return (
        <section
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: `3px solid ${color}`,
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1.1rem",
                marginTop: "clamp(20px, 2.4vw, 32px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.85rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "1 1 auto" }}>
                <WarningSign tier={tier} size={20} />
                <span style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    fontWeight: 800,
                    color,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                }}>{alertLevelFor(tier)}</span>
                <span style={{
                    fontFamily: FONT_BODY,
                    fontSize: "0.92rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    lineHeight: 1.4,
                }}>
                    {typeWord} event with {tier === "critical" ? "the strongest" : tier === "high" ? "a strong" : "a notable"} astro signature.
                </span>
            </div>
            <span style={{
                fontFamily: FONT_MONO,
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                color,
                fontWeight: 700,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
            }}>
                → {action}
            </span>
        </section>
    );
}

// ─── At-a-glance — ReadingGuideRows pattern ────────────────────────────────

/**
 * Mirror of /reading's `ReadingGuideRows` layout: ul with border-t/border-b,
 * 4 columns with vertical dividers, each row is organic-blob badge + mono
 * kicker + body text. No card backgrounds — airy, magazine-style.
 */
function AtAGlance({
    event, location, isHistorical,
}: {
    event: GeodeticWeatherEvent;
    location: ReturnType<typeof parseEventLocation>;
    isHistorical: boolean;
}) {
    const dayLabel = daysFromToday(event.date);
    const tierColor = tierAccent(event.tier);
    const isCritical = event.tier === "critical" || event.tier === "high";

    type Row = {
        kicker: string;
        accent: string;
        badge: ReactNode;
        primary: string;
        secondary: string;
    };

    const rows: Row[] = [
        {
            kicker: "When",
            accent: "var(--amber, var(--gold, #C9A96E))",
            badge: <WhenBadge tone="var(--amber, var(--gold, #C9A96E))" />,
            primary: dayLabel,
            secondary: friendlyDate(event.date),
        },
        {
            kicker: "Type",
            accent: tierColor,
            badge: <TypeBadge eventType={event.type} tone={tierColor} />,
            primary: typeWordFor(event.type),
            secondary: typeVerboseFor(event.type),
        },
        {
            kicker: "Where",
            accent: "var(--color-y2k-blue, #0456fb)",
            badge: <WhereBadge tone="var(--color-y2k-blue, #0456fb)" />,
            primary: location.label,
            secondary: location.detail ?? "see map below",
        },
        {
            kicker: "Action",
            accent: isCritical ? tierColor : "var(--sage)",
            badge: <ActionBadge tone={isCritical ? tierColor : "var(--sage)"} isHistorical={isHistorical} />,
            primary: isHistorical ? "Historical record" :
                event.tier === "critical" ? "Watch closely" :
                event.tier === "high" ? "Pay attention" :
                event.tier === "moderate" ? "Stay aware" : "Note it",
            secondary: isHistorical ? "Past event — see outcome below" :
                event.tier === "critical" ? "Check local news + alerts" :
                event.tier === "high" ? "Worth following the news" :
                event.tier === "moderate" ? "Background monitoring is enough" :
                "Low priority right now",
        },
    ];

    return (
        <section style={{ padding: "clamp(20px, 2.6vw, 32px) 0" }}>
            <ul
                className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-b w-full"
                style={{ borderColor: "var(--surface-border)" }}
            >
                {rows.map((row) => (
                    <li
                        key={row.kicker}
                        className="min-w-0 py-4 md:px-5 md:first:pl-0 md:border-l md:first:border-l-0 lg:border-l lg:first:border-l-0"
                        style={{ borderColor: "var(--surface-border)" }}
                    >
                        <div className="flex items-start gap-3">
                            {row.badge}
                            <div className="min-w-0">
                                <span
                                    className="block mb-1.5 text-[10px] tracking-[0.16em] uppercase"
                                    style={{ fontFamily: FONT_MONO, color: row.accent, fontWeight: 700 }}
                                >
                                    {row.kicker}
                                </span>
                                <span
                                    className="block text-[15px] leading-[1.3]"
                                    style={{ fontFamily: FONT_SECONDARY, color: "var(--text-primary)", marginBottom: 4 }}
                                >
                                    {row.primary}
                                </span>
                                <span
                                    className="block text-[12px] leading-[1.4]"
                                    style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                                >
                                    {row.secondary}
                                </span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Hide unused props on smaller import surface */}
            <span hidden>{Boolean(event)}</span>
        </section>
    );
}

// ─── Narrative ────────────────────────────────────────────────────────────

function NarrativeSection({
    event, location, isHistorical,
}: {
    event: GeodeticWeatherEvent;
    location: ReturnType<typeof parseEventLocation>;
    isHistorical: boolean;
}) {
    const dayInfo = daysFromToday(event.date);
    const friendly = friendlyDate(event.date);

    const opener = isHistorical
        ? `${typeVerboseFor(event.type).charAt(0).toUpperCase() + typeVerboseFor(event.type).slice(1)} hit ${location.label} on ${friendly}.`
        : `A ${typeVerboseFor(event.type)} event is forecast for ${location.label} on ${friendly} (${dayInfo.toLowerCase()}).`;

    const tierLine = event.tier === "critical"
        ? "The model rates this at the highest pressure tier — these are the events worth telling people about."
        : event.tier === "high"
        ? "The model rates this at a high pressure tier — worth paying attention to."
        : "The model rates this at a moderate or watch-only pressure tier.";

    const outcomeLine = (() => {
        if (!isHistorical) return null;
        const parts: string[] = [];
        if (event.deaths) parts.push(`${event.deaths.toLocaleString()} confirmed deaths`);
        if (event.damageBillions) parts.push(`$${event.damageBillions}B in damage`);
        if (parts.length === 0) return null;
        return `Outcome: ${parts.join(", ")}.`;
    })();

    const heading = isHistorical ? "What happened" : "What to expect";

    return (
        <section style={section}>
            <div style={kicker}>The read</div>
            <h2 style={title}>{heading}</h2>
            <div style={{
                fontFamily: FONT_BODY,
                fontSize: "1.02rem",
                lineHeight: 1.7,
                color: "var(--text-primary)",
                maxWidth: "64ch",
            }}>
                <p style={{ margin: 0 }}>{opener}</p>
                <p style={{ margin: "0.65rem 0 0" }}>{tierLine}</p>
                {outcomeLine ? <p style={{ margin: "0.65rem 0 0" }}>{outcomeLine}</p> : null}
            </div>
        </section>
    );
}

// ─── Outcome section ──────────────────────────────────────────────────────

function OutcomeSection({
    event, location,
}: {
    event: GeodeticWeatherEvent;
    location: ReturnType<typeof parseEventLocation>;
}) {
    const items: Array<{ Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; value: string }> = [];
    if (event.deaths != null) {
        items.push({ Icon: Skull, label: "Deaths", value: event.deaths.toLocaleString() });
    }
    if (event.damageBillions != null) {
        items.push({ Icon: DollarSign, label: "Damage", value: `$${event.damageBillions}B` });
    }
    if (event.source) {
        items.push({ Icon: Newspaper, label: "Source", value: event.source });
    }
    if (items.length === 0) return null;

    return (
        <section style={section}>
            <div style={kicker}>Where + outcome</div>
            <h2 style={title}>Confirmed impact in {location.label}</h2>
            <ul
                className="m-0 p-0 list-none grid w-full border-t border-b"
                style={{
                    borderColor: "var(--surface-border)",
                    gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                }}
            >
                {items.map(({ Icon, label, value }, i) => (
                    <li
                        key={label}
                        className="py-5 px-5"
                        style={{
                            borderLeft: i === 0 ? "none" : "1px solid var(--surface-border)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-tertiary)", marginBottom: 10 }}>
                            <Icon size={14} strokeWidth={2} />
                            <span style={{
                                fontFamily: FONT_MONO,
                                fontSize: 10,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}>{label}</span>
                        </div>
                        <div style={{
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)",
                            lineHeight: 1.05,
                            color: "var(--text-primary)",
                        }}>{value}</div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ─── Map ──────────────────────────────────────────────────────────────────

function MapSection({
    event, location,
}: {
    event: GeodeticWeatherEvent;
    location: ReturnType<typeof parseEventLocation>;
}) {
    const pins = weatherEventToAtlasPins(event);
    const [hoveredId, setHoveredId] = useState<string | null>(pins[0]?.id ?? null);
    const verdictLabelForScore = () => tierLabel(event.tier).toUpperCase();

    return (
        <section style={section}>
            <div style={kicker}>Where</div>
            <h2 style={title}>Areas at risk</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ height: "min(58vh, 520px)" }}>
                    <ReadingsAtlasMap
                        pins={pins}
                        hoveredId={hoveredId}
                        onHover={(id) => setHoveredId(id ?? pins[0]?.id ?? null)}
                        onSelect={() => undefined}
                        showCounter={{ shown: pins.length, total: pins.length }}
                        verdictLabelOverride={verdictLabelForScore}
                    />
                </div>
                {event.zones.length > 0 ? (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "0.75rem",
                    }}>
                        {event.zones.map((raw, i) => {
                            const m = raw.match(/^(.*?)\s*\((.*)\)\s*$/);
                            const primary = m ? m[1].trim() : raw;
                            const subtitle = m ? m[2].trim() : null;
                            return <ZoneCard key={i} primary={primary} subtitle={subtitle} tier={event.tier} />;
                        })}
                    </div>
                ) : (
                    <p style={{ ...body, color: "var(--text-primary)" }}>Impact area: <b>{location.label}</b>.</p>
                )}
            </div>
        </section>
    );
}

function ZoneCard({
    primary, subtitle, tier,
}: { primary: string; subtitle: string | null; tier: GeodeticRiskTier }) {
    return (
        <div style={{
            background: "var(--surface)",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            borderLeft: `3px solid ${tierAccent(tier)}`,
        }}>
            <div style={{
                fontFamily: FONT_SECONDARY,
                fontSize: "1.05rem",
                lineHeight: 1.2,
                color: "var(--text-primary)",
                marginBottom: 6,
            }}>
                {primary}
            </div>
            {subtitle ? (
                <div style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.65rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    lineHeight: 1.5,
                }}>
                    <AstroBody text={subtitle} />
                </div>
            ) : null}
        </div>
    );
}

// ─── 3-phase timeline ────────────────────────────────────────────────────

function TimelineSection({ event }: { event: GeodeticWeatherEvent }) {
    const tier = event.tier;
    const color = tierAccent(tier);

    const phases: Array<{ label: string; sublabel: string; description: ReactNode }> = [
        {
            label: "Build-up",
            sublabel: "Background pressure",
            description: <AstroBody text={event.pair || event.geostress || "Background pressure setter from the source row."} />,
        },
        {
            label: "Trigger",
            sublabel: "Peak window",
            description: event.criteria.key.includes("T12")
                ? "A clear trigger is marked in the criteria — this is when the event most likely peaks."
                : "No explicit T12 trigger. Read the nearby aspects calendar for timing.",
        },
        {
            label: "Aftermath",
            sublabel: "What to watch for",
            description: event.kind === "historical"
                ? "Outcome is known. See the impact card above."
                : "After the trigger window passes, watch for the model's tier to drop back as transit pressure releases.",
        },
    ];

    return (
        <section style={section}>
            <div style={kicker}>Timeline</div>
            <h2 style={title}>How this unfolds</h2>
            <div className="timeline-wrap">
                <div className="timeline-line" style={{ background: `linear-gradient(90deg, color-mix(in oklab, ${color} 25%, var(--surface-border)), ${color}, color-mix(in oklab, ${color} 25%, var(--surface-border)))` }} />
                <div className="timeline-grid">
                    {phases.map((phase, i) => (
                        <div key={phase.label} className="timeline-phase">
                            <div className="timeline-dot-row">
                                <div
                                    className="timeline-dot"
                                    style={{
                                        background: color,
                                        boxShadow: i === 1 ? `0 0 0 4px color-mix(in oklab, ${color} 25%, transparent)` : "none",
                                    }}
                                />
                            </div>
                            <div className="timeline-content">
                                <div style={kicker}>Phase {i + 1} · {phase.label}</div>
                                <h4 style={{
                                    fontFamily: FONT_SECONDARY,
                                    fontSize: "1.05rem",
                                    lineHeight: 1.25,
                                    margin: "0.3rem 0 0.5rem",
                                    color: "var(--text-primary)",
                                }}>{phase.sublabel}</h4>
                                <p style={{ ...body, margin: 0, fontSize: "0.85rem" }}>{phase.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .timeline-wrap { position: relative; padding: 1.2rem 0; }
                .timeline-line { position: absolute; left: 0; right: 0; top: 36px; height: 2px; border-radius: 1px; }
                .timeline-grid { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .timeline-phase { display: flex; flex-direction: column; gap: 1rem; }
                .timeline-dot-row { display: flex; justify-content: center; position: relative; z-index: 1; }
                .timeline-dot {
                    width: 16px; height: 16px; border-radius: 50%;
                    border: 2px solid var(--bg); margin-top: 28px;
                }
                .timeline-content {
                    background: var(--surface);
                    border: 1px solid var(--surface-border);
                    border-radius: var(--radius-md);
                    padding: 1rem 1.1rem;
                }
                @media (max-width: 720px) {
                    .timeline-line { display: none; }
                    .timeline-grid { grid-template-columns: 1fr; }
                    .timeline-dot { margin-top: 0; }
                    .timeline-phase { flex-direction: row; gap: 0.8rem; align-items: flex-start; }
                    .timeline-content { flex: 1; }
                }
            `}</style>
        </section>
    );
}

// ─── Astro body renderer ──────────────────────────────────────────────────

const ZODIAC_BY_GLYPH: Record<string, string> = {
    "♈": "Aries", "♉": "Taurus", "♊": "Gemini", "♋": "Cancer",
    "♌": "Leo",   "♍": "Virgo",  "♎": "Libra",  "♏": "Scorpio",
    "♐": "Sagittarius", "♑": "Capricorn", "♒": "Aquarius", "♓": "Pisces",
};
const PLANET_BY_GLYPH: Record<string, string> = {
    "☿": "Mercury", "♀": "Venus", "♂": "Mars", "♃": "Jupiter",
    "♄": "Saturn",  "♅": "Uranus", "♆": "Neptune", "♇": "Pluto",
};
const ASPECT_BY_GLYPH: Record<string, string> = { "☌": "conj", "□": "sq", "☍": "opp" };
const GLYPH_RE = /([♈-♓]|[☿♀♂♃♄♅♆♇]|[☌□☍])/g;

function AstroBody({ text }: { text: string }) {
    const parts = text.split(GLYPH_RE);
    return (
        <>
            {parts.map((part, i) => {
                if (!part) return null;
                if (ZODIAC_BY_GLYPH[part]) {
                    return <SignIcon key={i} sign={ZODIAC_BY_GLYPH[part]} size={14} className="inline-block align-middle mx-0.5" />;
                }
                if (PLANET_BY_GLYPH[part]) {
                    return <PlanetIcon key={i} planet={PLANET_BY_GLYPH[part]} size={14} className="inline-block align-middle mx-0.5" />;
                }
                if (ASPECT_BY_GLYPH[part]) {
                    return (
                        <span key={i} style={{
                            fontFamily: FONT_MONO, fontSize: "0.7em", padding: "0 0.2em",
                            color: "var(--text-tertiary)", letterSpacing: "0.04em",
                        }}>{ASPECT_BY_GLYPH[part]}</span>
                    );
                }
                return <Fragment key={i}>{part}</Fragment>;
            })}
        </>
    );
}

// ─── Criteria summary (uses SeverityBar) ──────────────────────────────────

function CriteriaSummary({ event }: { event: GeodeticWeatherEvent }) {
    const pct = event.criteria.total > 0 ? event.criteria.met / event.criteria.total : 0;
    return (
        <div style={{
            background: "var(--surface)",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.2rem",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={kicker}>Criteria met</span>
                <span style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.78rem",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                }}>
                    {event.criteria.met} of {event.criteria.total}
                </span>
            </div>
            {/* Simple percentage bar */}
            <div style={{
                height: 6,
                background: "var(--bg)",
                border: "1px solid var(--surface-border)",
                borderRadius: 1,
            }}>
                <div style={{
                    width: `${pct * 100}%`,
                    height: "100%",
                    background: tierAccent(event.tier),
                }} />
            </div>
        </div>
    );
}

// ─── Collapsible ──────────────────────────────────────────────────────────

function Collapsible({
    summary, badge, children,
}: { summary: string; badge?: string; children: ReactNode }) {
    return (
        <details
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
            }}
        >
            <summary
                style={{
                    cursor: "pointer",
                    padding: "0.85rem 1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    listStyle: "none",
                    userSelect: "none",
                }}
                className="collapsible-summary"
            >
                <span style={{
                    fontFamily: FONT_BODY,
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: "var(--text-primary)",
                }}>{summary}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    {badge ? (
                        <span style={{
                            fontFamily: FONT_MONO,
                            fontSize: "0.6rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--text-tertiary)",
                            fontWeight: 700,
                        }}>{badge}</span>
                    ) : null}
                    <ChevronDown
                        size={16}
                        strokeWidth={2}
                        aria-hidden
                        className="collapsible-chevron"
                        style={{ color: "var(--text-tertiary)", transition: "transform 0.2s ease" }}
                    />
                </span>
            </summary>
            <div style={{
                padding: "0 1.1rem 1.1rem",
                borderTop: "1px solid var(--surface-border)",
                paddingTop: "1rem",
            }}>
                {children}
            </div>
            <style jsx>{`
                .collapsible-summary::-webkit-details-marker { display: none; }
                details[open] :global(.collapsible-chevron) { transform: rotate(180deg); }
            `}</style>
        </details>
    );
}

// ─── Fingerprint blocks (used inside collapsibles) ────────────────────────

function FactorList({ items }: { items: string[] }) {
    if (items.length === 0) return <p style={body}>No stars or sensitizers attached to this row.</p>;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {items.map((item) => (
                <span key={item} style={chipMono}>
                    <AstroBody text={item} />
                </span>
            ))}
        </div>
    );
}

function CriteriaChecklistBlock({ chips }: { chips: string[] }) {
    return (
        <div>
            <p style={{ ...body, fontSize: "0.85rem", marginBottom: "0.7rem" }}>
                Each chip is one piece of astrology evidence the model found. More chips means stronger signal.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {chips.map((chip) => (
                    <span key={chip} style={chipMono}>
                        <AstroBody text={chip} />
                    </span>
                ))}
            </div>
        </div>
    );
}

function TriggerBlock({ aspects, moons }: ReturnType<typeof triggersForWindow>) {
    const items = [
        ...aspects.map((a) => `${a.date} · ${a.bodies} · Weather: ${a.weather} · Conflict: ${a.conflict}`),
        ...moons.map((m) => `${m.date} · ${m.degree} · ${m.note}`),
    ];
    if (items.length === 0) return <p style={body}>No nearby triggers in the catalog window.</p>;
    return (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((item) => (
                <li key={item} style={{
                    ...body,
                    padding: "0.5rem 0",
                    borderBottom: "1px solid var(--surface-border)",
                }}>
                    <AstroBody text={item} />
                </li>
            ))}
        </ul>
    );
}

function MethodBlock({ matrix }: { matrix: GeodeticMatrixResponse }) {
    return (
        <div style={{ display: "grid", gap: "0.6rem" }}>
            {matrix.sourceCatalog.techniques.sourceNotes.map((note) => (
                <p key={note} style={body}>{note}</p>
            ))}
            <Link
                href="/weather"
                style={{
                    color: "var(--color-y2k-blue)",
                    fontFamily: FONT_MONO,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginTop: 4,
                }}
            >
                Back to map
            </Link>
        </div>
    );
}

// Provide ActionPrompt re-export so it stays in the import graph;
// it's no longer rendered on this page since the ACTION row badge takes
// over, but other surfaces may consume it later.
export { ActionPrompt };

// ─── Shared style atoms ────────────────────────────────────────────────────

const chipMono: CSSProperties = {
    display: "inline-block",
    background: "var(--bg)",
    color: "var(--text-secondary)",
    border: "1px solid var(--surface-border)",
    borderRadius: 6,
    padding: "0.3rem 0.55rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.62rem",
    letterSpacing: "0.04em",
    lineHeight: 1.3,
    fontWeight: 600,
};

const section: CSSProperties = {
    padding: "clamp(28px, 4vw, 56px) 0",
    borderBottom: "1px solid var(--surface-border)",
};

const kicker: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.62rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "var(--text-tertiary)",
    fontWeight: 800,
};

const title: CSSProperties = {
    fontFamily: "var(--font-secondary)",
    fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
    lineHeight: 1.05,
    margin: "0.35rem 0 1.1rem",
};

const body: CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "var(--text-secondary)",
};
