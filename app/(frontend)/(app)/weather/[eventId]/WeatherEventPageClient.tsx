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
import { eventHasMappableLocation, weatherEventToAtlasPin } from "../weather-map-pins";
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

// ─── Headline + date-range generators ──────────────────────────────────────

/**
 * "Flood Warning in UK / Ghana / Nigeria" — composes type + tier + location
 * into the H1 headline used in the banner. Falls back gracefully for
 * unknown types or unconfident locations.
 */
function headlineFor(event: GeodeticWeatherEvent, location: { label: string }): string {
    const type = typeWordFor(event.type);
    const alert = alertWordFor(event.tier); // WARNING / WATCH / ADVISORY / MONITORING / BACKGROUND
    const titleCaseAlert = alert.charAt(0) + alert.slice(1).toLowerCase();
    return `${type} ${titleCaseAlert} in ${location.label}`;
}

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
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
    const startStr = start.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: sameYear ? undefined : "numeric", timeZone: "UTC",
    });
    const endStr = end.toLocaleDateString("en-US", {
        month: sameMonth ? undefined : "short", day: "numeric", year: "numeric", timeZone: "UTC",
    });
    return `${startStr} — ${endStr}`.toUpperCase();
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
    const headline = headlineFor(event, location);
    const dateRange = dateRangeFor(event);

    return (
        <>
            <PageHeader title={event.title} backTo="/weather" backLabel="Weather" />
            <div className="weather-event-shell min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
                <div className="banner-wrap">
                    <WeatherHeroBanner event={event} headline={headline} dateRange={dateRange} />
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
    event, headline, dateRange,
}: {
    event: GeodeticWeatherEvent;
    headline: string;
    dateRange: string;
}) {
    const verdict = tierLabel(event.tier);

    return (
        <div
            className="reading-hero-banner relative overflow-hidden rounded-t-[8px] rounded-b-0 px-[clamp(18px,4vw,44px)] py-[clamp(22px,3.8vw,42px)]"
            style={{
                minHeight: "clamp(186px, 20vw, 244px)",
                background: "linear-gradient(180deg, #E67A7A 0%, #D26565 100%)",
            }}
        >
            {/* Star — top right of title area */}
            <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="absolute right-[clamp(156px,14vw,218px)] top-[clamp(34px,4.4vw,58px)] h-[clamp(20px,2.4vw,34px)] w-[clamp(20px,2.4vw,34px)] max-sm:left-[48px] max-sm:right-auto max-sm:top-[170px] max-sm:h-[22px] max-sm:w-[22px]"
                style={{ color: "#CAF1F0" }}
            >
                <path d="M32 0 L38 25 L64 32 L38 39 L32 64 L26 39 L0 32 L26 25 Z" fill="currentColor" />
            </svg>

            {/* Bottom rounded curve — emerges into --reading-tabs-surface */}
            <div
                aria-hidden
                className="absolute inset-x-[-18%] bottom-[-47%] h-[64%] rounded-[50%]"
                style={{ background: "var(--reading-tabs-surface)" }}
            />

            {/* Dark planet disc with cutout */}
            <div
                aria-hidden
                className="absolute right-[3.4%] bottom-[17%] h-[clamp(26px,3.4vw,44px)] w-[clamp(26px,3.4vw,44px)] rounded-full"
                style={{ background: "color-mix(in oklab, #1B1B1B 82%, #C9A96E)" }}
            >
                <span
                    className="absolute -right-[18%] -top-[10%] h-[70%] w-[70%] rounded-full"
                    style={{ background: "var(--reading-tabs-surface)" }}
                />
            </div>

            {/* Saturn/sun/comet illustration — same SVG as /reading */}
            <div
                aria-hidden
                className="absolute right-[clamp(18px,4vw,44px)] bottom-[clamp(24px,4.8vw,52px)] z-10 h-[clamp(78px,7vw,104px)] w-[clamp(94px,8.6vw,128px)] max-sm:-right-[2px] max-sm:bottom-[56px] max-sm:scale-[0.72]"
            >
                <svg viewBox="0 0 160 132" className="h-full w-full overflow-visible" fill="none">
                    <path d="M15 22l4.3 9.3 10.2 1.2-7.5 6.8 2 10-8.8-5.1-8.9 5 2.2-10-7.5-6.9 10.2-1.1L15 22z" fill="#C9A96E" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" />
                    <circle cx="113" cy="25" r="13.5" fill="color-mix(in oklab, #CAF1F0 72%, #c7a6ff)" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" />
                    <path d="M98 32c13-17 30-25 45-22" stroke="#C9A96E" strokeWidth="4" strokeLinecap="round" />
                    <path d="M87 35c22 3 42-2 61-14" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" strokeLinecap="round" />
                    <g transform="translate(70 41) rotate(-12)">
                        <circle cx="0" cy="0" r="30" fill="color-mix(in oklab, #1B1B1B 65%, transparent)" stroke="color-mix(in oklab, #1B1B1B 76%, transparent)" strokeWidth="2.5" />
                        <path d="M-21-7c13 6 26 5 43-3" stroke="color-mix(in oklab, #C9A96E 62%, #1B1B1B)" strokeWidth="6" strokeLinecap="round" />
                        <path d="M-20 11c15-9 30-10 44-4" stroke="color-mix(in oklab, #1B1B1B 16%, #F8F5EC)" strokeWidth="5" strokeLinecap="round" />
                        <path d="M-15 22c10-6 20-7 31-1" stroke="color-mix(in oklab, #C9A96E 62%, #1B1B1B)" strokeWidth="5" strokeLinecap="round" />
                        <path d="M-49 13c27 16 75 9 106-13" stroke="#C9A96E" strokeWidth="7" strokeLinecap="round" />
                        <path d="M-51 14c29 19 78 11 110-14" stroke="color-mix(in oklab, #1B1B1B 72%, transparent)" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                    <circle cx="88" cy="103" r="12" fill="color-mix(in oklab, #CAF1F0 78%, #C9A96E)" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" />
                    <path d="M82 101c4-5 8-5 12 0M83 109c4-5 8-5 12 0" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M13 79h12M19 73v12M143 54h11M148.5 48.5v11" stroke="#C9A96E" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
            </div>

            {/* Score pill + verdict pill — top right */}
            <div className="absolute right-[clamp(18px,4vw,44px)] top-[clamp(18px,3vw,36px)] z-20 flex flex-col items-end gap-[10px]">
                <span
                    className="inline-flex items-baseline rounded-full px-[clamp(16px,2vw,26px)] py-[clamp(8px,1vw,12px)] shadow-sm"
                    style={{
                        background: "#F8F5EC",
                        color: "#1B1B1B",
                        fontFamily: FONT_PRIMARY,
                    }}
                >
                    <span className="text-[clamp(38px,5.4vw,72px)] leading-none tabular-nums">
                        {event.pss.toFixed(2)}
                    </span>
                    <span
                        className="ml-1.5 text-[clamp(11px,1vw,14px)]"
                        style={{ fontFamily: FONT_MONO, color: "#8a8983", letterSpacing: "0.08em" }}
                    >
                        PSS
                    </span>
                </span>
                <span
                    className="inline-flex rounded-full px-[14px] py-[6px] text-[10px] uppercase"
                    style={{
                        background: "#F8F5EC",
                        color: "#D26565",
                        fontFamily: FONT_MONO,
                        letterSpacing: "0.18em",
                        fontWeight: 800,
                    }}
                >
                    {verdict}
                </span>
            </div>

            {/* Title + date range — left column */}
            <div className="relative z-10 grid min-h-[inherit] grid-cols-1 items-center gap-[18px]">
                <div className="flex min-w-0 flex-col justify-start gap-[10px] self-start pt-[clamp(38px,4.8vw,62px)] max-sm:pt-[28px]">
                    <span
                        className="inline-flex items-baseline leading-[0.9]"
                        style={{
                            color: "#F8F5EC",
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(36px, 5.4vw, 72px)",
                            textShadow: "0 2px 0 rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        <span className="min-w-0">{headline}</span>
                    </span>
                    <span
                        className="text-[11px] uppercase"
                        style={{
                            color: "color-mix(in oklab, #F8F5EC 82%, transparent)",
                            fontFamily: FONT_MONO,
                            letterSpacing: "0.18em",
                        }}
                    >
                        {dateRange}
                    </span>
                </div>
            </div>
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
        tier === "critical" ? "Watch closely. Check local alerts and news." :
        tier === "high"     ? "Pay attention. Worth following the news." :
        tier === "moderate" ? "Stay aware. Background monitoring is enough." :
                              "Low priority for now.";

    return (
        <section
            style={{
                background: `color-mix(in oklab, ${color} 14%, var(--bg))`,
                border: `1px solid color-mix(in oklab, ${color} 35%, var(--surface-border))`,
                borderLeft: `4px solid ${color}`,
                borderRadius: "var(--radius-md)",
                padding: "0.9rem 1.2rem",
                marginTop: "clamp(20px, 2.4vw, 32px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.8rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <WarningSign tier={tier} size={22} />
                <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.05 }}>
                    <span style={{
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        fontWeight: 800,
                        color,
                        textTransform: "uppercase",
                    }}>{alertWordFor(tier)}</span>
                    <span style={{
                        fontFamily: FONT_MONO,
                        fontSize: 9,
                        letterSpacing: "0.16em",
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginTop: 2,
                    }}>{alertLevelFor(tier)}</span>
                </span>
                <span style={{
                    fontFamily: FONT_BODY,
                    fontSize: "0.92rem",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    marginLeft: 4,
                }}>
                    {typeWord} event with {tier === "critical" ? "the strongest" : tier === "high" ? "a strong" : "a notable"} astro signature.
                </span>
            </div>
            <span style={{
                fontFamily: FONT_MONO,
                fontSize: "0.7rem",
                letterSpacing: "0.06em",
                color,
                fontWeight: 700,
                textTransform: "uppercase",
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
    const [hoveredId, setHoveredId] = useState<string | null>(event.id);
    const pin = weatherEventToAtlasPin(event);
    const verdictLabelForScore = () => tierLabel(event.tier).toUpperCase();

    return (
        <section style={section}>
            <div style={kicker}>Where</div>
            <h2 style={title}>Areas at risk</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ height: "min(58vh, 520px)" }}>
                    <ReadingsAtlasMap
                        pins={[pin]}
                        hoveredId={hoveredId}
                        onHover={(id) => setHoveredId(id ?? event.id)}
                        onSelect={() => undefined}
                        showCounter={{ shown: 1, total: 1 }}
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
