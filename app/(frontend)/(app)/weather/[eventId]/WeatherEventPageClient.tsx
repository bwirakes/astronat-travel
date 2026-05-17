"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
    Calendar, MapPin, ChevronDown, Skull, DollarSign, Newspaper,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header-context";
import { ReadingsAtlasMap } from "@/app/components/ReadingsAtlasMap";
import SignIcon from "@/app/components/SignIcon";
import PlanetIcon from "@/app/components/PlanetIcon";
import { tierAccent, tierLabel } from "@/app/lib/geodetic/weather-predictions";
import { triggersForWindow } from "@/app/lib/geodetic/weather-triggers";
import type { GeodeticMatrixResponse, GeodeticRiskTier, GeodeticWeatherEvent } from "@/app/lib/geodetic/weather-types";
import { eventHasMappableLocation, weatherEventToAtlasPin } from "../weather-map-pins";
import { EventGlyph } from "./components/EventGlyphs";
import {
    ActionPrompt, AlertLabel, SeverityBar, WarningSign,
    alertLevelFor, alertWordFor,
} from "./components/WeatherIndicators";
import { parseEventLocation } from "./event-location";

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_SECONDARY = "var(--font-secondary, serif)";
const FONT_MONO = "var(--font-mono, monospace)";

// ─── Plain-language vocabulary ─────────────────────────────────────────────

const TYPE_PLAIN: Record<string, { word: string; verbose: string }> = {
    flood:          { word: "Flood",       verbose: "heavy rain and flooding" },
    wildfire:       { word: "Wildfire",    verbose: "wildfire risk" },
    storm_cyclone:  { word: "Big Storm",   verbose: "a big storm or cyclone" },
    earthquake:     { word: "Earthquake",  verbose: "earthquake or seismic activity" },
    heatwave:       { word: "Heat Wave",   verbose: "very hot weather" },
    tornado:        { word: "Tornado",     verbose: "tornado risk" },
    winter_storm:   { word: "Winter Storm", verbose: "snow, ice, or freezing weather" },
    compound:       { word: "Compound",    verbose: "many weather problems together" },
};

function plainTypeFor(type: string): { word: string; verbose: string } {
    return TYPE_PLAIN[type] ?? { word: type, verbose: type };
}

function daysFromToday(dateStr: string): { days: number; label: string } {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const target = new Date(`${dateStr}T00:00:00Z`);
    const diffMs = target.getTime() - today.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return { days, label: "Today" };
    if (days === 1) return { days, label: "Tomorrow" };
    if (days === -1) return { days, label: "Yesterday" };
    if (days > 0)   return { days, label: relativeLabel(days, "from now") };
    return { days, label: relativeLabel(-days, "ago") };
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

function friendlyDate(dateStr: string): string {
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
}

function shortDate(dateStr: string): string {
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
    }).toUpperCase();
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

    return (
        <>
            <PageHeader title={event.title} backTo="/weather" backLabel="Weather" />
            <div className="weather-event-shell min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
                <div className="banner-wrap">
                    <WeatherHeroBanner event={event} location={location} />
                </div>

                <main className="event-main">
                    {/* ALERT STRIP — the one-line decision summary */}
                    <AlertStrip tier={event.tier} typeWord={plainTypeFor(event.type).word} isHistorical={isHistorical} />

                    {/* 4 AT-A-GLANCE CARDS — visually differentiated */}
                    <AtAGlance event={event} location={location} isHistorical={isHistorical} />

                    {/* NARRATIVE — plain prose, no pull-quote treatment */}
                    <NarrativeSection event={event} location={location} isHistorical={isHistorical} />

                    {/* WHERE — map (forecasts) OR outcome card (historical without map) */}
                    {canShowMap ? (
                        <MapSection event={event} location={location} />
                    ) : isHistorical && (event.deaths || event.damageBillions || event.source) ? (
                        <OutcomeSection event={event} location={location} />
                    ) : null}

                    {/* TIMELINE — 3-phase indicator */}
                    <TimelineSection event={event} />

                    {/* COLLAPSIBLES — hardcore astrology */}
                    <section style={{ ...section, borderBottom: "none" }}>
                        <div style={kicker}>For the curious</div>
                        <h2 style={title}>Astrology detail</h2>
                        <p style={{ ...body, fontSize: "0.9rem", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
                            Open any card to see the astrology behind this prediction.
                        </p>

                        <div style={{ display: "grid", gap: "0.6rem" }}>
                            <Collapsible
                                summary="The full astrology read"
                                badge={`${event.editorialBody.length} chars`}
                            >
                                <p style={{ ...body, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.7 }}>
                                    <AstroBody text={event.editorialBody} />
                                </p>
                            </Collapsible>

                            <Collapsible
                                summary="Why this scored what it did"
                                badge={`${event.criteria.met} of ${event.criteria.total} criteria`}
                            >
                                <div style={{ display: "grid", gap: "0.75rem" }}>
                                    <CriteriaSummary event={event} />
                                    <CriteriaChecklistBlock chips={criteriaChips} />
                                </div>
                            </Collapsible>

                            <Collapsible
                                summary="Stars and sensitizers"
                                badge={`${factorItems.length} items`}
                            >
                                <FactorList items={factorItems} />
                            </Collapsible>

                            <Collapsible
                                summary="Trigger calendar"
                                badge={`${triggers.aspects.length + triggers.moons.length} events nearby`}
                            >
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
        </>
    );
}

// ─── Hero banner (spiced life) ──────────────────────────────────────────────

function WeatherHeroBanner({
    event, location,
}: {
    event: GeodeticWeatherEvent;
    location: ReturnType<typeof parseEventLocation>;
}) {
    const tier = event.tier;
    const typeWord = plainTypeFor(event.type).word;

    return (
        <div
            className="reading-hero-banner relative overflow-hidden rounded-t-[8px] rounded-b-0 max-sm:rounded-t-0"
            style={{
                minHeight: "clamp(220px, 24vw, 300px)",
                background: "linear-gradient(180deg, #E67A7A 0%, #D26565 100%)",
                color: "#F8F5EC",
            }}
        >
            <div className="banner-grid">
                {/* LEFT — warning badge → title → meta */}
                <div className="banner-title-col">
                    {/* NOAA-style alert tag */}
                    <span className="banner-alert">
                        <WarningSign tier={tier} size={18} />
                        <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.05 }}>
                            <span style={{
                                fontFamily: FONT_MONO,
                                fontSize: 12,
                                letterSpacing: "0.2em",
                                fontWeight: 800,
                                color: "#F8F5EC",
                                textTransform: "uppercase",
                            }}>
                                {alertWordFor(tier)}
                            </span>
                            <span style={{
                                fontFamily: FONT_MONO,
                                fontSize: 10,
                                letterSpacing: "0.16em",
                                color: "rgba(248,245,236,0.78)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                marginTop: 2,
                            }}>
                                {alertLevelFor(tier)}
                            </span>
                        </span>
                    </span>

                    <h1 className="banner-title">{event.title}</h1>

                    {/* Type chip + location chip + date row */}
                    <div className="banner-meta-row">
                        <span className="meta-chip">
                            <EventGlyph type={event.type} size={14} strokeWidth={2} />
                            <span>{typeWord}</span>
                        </span>
                        <span className="meta-chip">
                            <MapPin size={12} strokeWidth={2.25} aria-hidden />
                            <span>{location.label}</span>
                        </span>
                        <span className="meta-date">
                            {shortDate(event.date)}
                        </span>
                    </div>
                </div>

                {/* RIGHT — score pill stack */}
                <div className="banner-pill-col">
                    <div className="pss-pill">
                        <span className="pss-pill-kicker">PSS</span>
                        <span className="pss-pill-number">{event.pss.toFixed(2)}</span>
                        <SeverityBar pss={event.pss} tier={tier} segments={10} width={108} />
                    </div>
                    <span className="verdict-pill">{tierLabel(tier)}</span>
                </div>
            </div>

            {/* HERO GLYPH — large event-type SVG watermark (60% opacity, behind content) */}
            <div className="banner-glyph" aria-hidden>
                <EventGlyph type={event.type} size={260} strokeWidth={1.5} />
            </div>

            <style jsx>{`
                .banner-grid {
                    position: relative;
                    z-index: 2;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: clamp(16px, 3vw, 40px);
                    align-items: start;
                    padding: clamp(24px, 3.8vw, 42px) clamp(20px, 4vw, 44px);
                    min-height: inherit;
                }
                .banner-title-col {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    align-self: end;
                    padding-top: clamp(8px, 1.4vw, 12px);
                }
                .banner-alert {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    align-self: flex-start;
                    background: rgba(0, 0, 0, 0.16);
                    border: 1px solid rgba(248,245,236,0.32);
                    border-radius: 4px;
                    padding: 8px 12px 8px 10px;
                    backdrop-filter: blur(6px);
                }
                .banner-title {
                    color: #F8F5EC;
                    font-family: ${FONT_PRIMARY};
                    font-size: clamp(28px, 4.6vw, 60px);
                    line-height: 0.96;
                    letter-spacing: -0.02em;
                    text-shadow: 0 2px 0 rgba(0,0,0,0.08);
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    margin: 0;
                    font-weight: 400;
                }
                .banner-meta-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                }
                .meta-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255,255,255,0.16);
                    color: #F8F5EC;
                    border-radius: 999px;
                    padding: 5px 12px 5px 9px;
                    font-family: ${FONT_MONO};
                    font-size: 10px;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    font-weight: 700;
                    backdrop-filter: blur(6px);
                }
                .meta-date {
                    color: rgba(248,245,236,0.76);
                    font-family: ${FONT_MONO};
                    font-size: 10px;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    font-weight: 700;
                    margin-left: 4px;
                }
                .banner-pill-col {
                    position: relative;
                    z-index: 3;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 8px;
                    align-self: start;
                }
                .pss-pill {
                    background: #F8F5EC; color: #1B1B1B;
                    border-radius: 18px;
                    padding: 12px 18px 14px;
                    box-shadow: 0 1px 0 rgba(0,0,0,0.04);
                    display: flex; flex-direction: column; align-items: center;
                    gap: 4px;
                    line-height: 1; min-width: 140px;
                }
                .pss-pill-kicker {
                    font-family: ${FONT_MONO}; font-size: 10px;
                    letter-spacing: 0.2em; text-transform: uppercase;
                    color: #8a8983; font-weight: 800;
                }
                .pss-pill-number {
                    font-family: ${FONT_PRIMARY};
                    font-size: clamp(34px, 4.4vw, 56px);
                    font-variant-numeric: tabular-nums;
                    line-height: 1;
                    margin: 2px 0 6px;
                }
                .verdict-pill {
                    background: #F8F5EC; color: #D26565;
                    border-radius: 999px; padding: 8px 18px;
                    font-family: ${FONT_MONO};
                    font-size: 12px;
                    letter-spacing: 0.2em; text-transform: uppercase; font-weight: 800;
                }
                .banner-glyph {
                    position: absolute;
                    right: -40px; bottom: -40px;
                    color: rgba(248, 245, 236, 0.22);
                    z-index: 0;
                    pointer-events: none;
                }
                @media (max-width: 640px) {
                    .banner-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                        padding: 20px 18px 28px;
                    }
                    .banner-title-col { order: 2; align-self: start; gap: 12px; }
                    .banner-pill-col { order: 1; flex-direction: row; align-items: center; align-self: flex-start; gap: 10px; }
                    .pss-pill { flex-direction: row; align-items: baseline; gap: 8px; padding: 10px 16px; min-width: 0; }
                    .pss-pill-kicker { order: 2; }
                    .pss-pill-number { order: 1; font-size: 32px; margin: 0; }
                    .pss-pill :global([role="img"]) { display: none; }
                    .banner-title { font-size: clamp(26px, 7vw, 36px); }
                    .banner-glyph { right: -60px; bottom: -80px; opacity: 0.7; }
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
                <AlertLabel tier={tier} compact />
                <span style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.92rem",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                }}>
                    {typeWord} event with {tier === "critical" ? "the strongest" : tier === "high" ? "a strong" : "a notable"} astro signature.
                </span>
            </div>
            <span style={{
                fontFamily: FONT_MONO,
                fontSize: "0.7rem",
                letterSpacing: "0.06em",
                color: color,
                fontWeight: 700,
                textTransform: "uppercase",
            }}>
                → {action}
            </span>
        </section>
    );
}

// ─── At-a-glance cards (visually differentiated) ───────────────────────────

function AtAGlance({
    event, location, isHistorical,
}: {
    event: GeodeticWeatherEvent;
    location: ReturnType<typeof parseEventLocation>;
    isHistorical: boolean;
}) {
    const dayInfo = daysFromToday(event.date);
    const typeInfo = plainTypeFor(event.type);
    const color = tierAccent(event.tier);

    return (
        <section style={{ padding: "clamp(20px, 2.4vw, 32px) 0" }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "0.8rem",
                }}
            >
                {/* WHEN card — calendar icon, neutral border */}
                <Stat
                    kicker="When"
                    primary={dayInfo.label}
                    secondary={friendlyDate(event.date)}
                    Icon={Calendar}
                    accent="var(--text-tertiary)"
                />

                {/* TYPE card — event glyph (via EventGlyph dispatcher), type-color border */}
                <StatWithGlyph
                    kicker="Type"
                    primary={typeInfo.word}
                    secondary={typeInfo.verbose}
                    eventType={event.type}
                    accent={color}
                />

                {/* WHERE card — pin icon, blue accent (because location is informational) */}
                <Stat
                    kicker="Where"
                    primary={location.label}
                    secondary={location.detail ?? "see map below"}
                    Icon={MapPin}
                    accent="var(--color-y2k-blue, #0456fb)"
                />

                {/* ACTION card — eye icon, tier color, full-width on mobile */}
                <div
                    style={{
                        background: `color-mix(in oklab, ${color} 8%, var(--surface))`,
                        border: "1px solid var(--surface-border)",
                        borderLeft: `3px solid ${color}`,
                        borderRadius: "var(--radius-md)",
                        padding: "0.85rem 1rem",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{
                            fontFamily: FONT_MONO,
                            fontSize: 10,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color,
                        }}>Action</span>
                    </div>
                    <ActionPrompt tier={event.tier} isHistorical={isHistorical} />
                </div>
            </div>
        </section>
    );
}

function Stat({
    Icon, kicker, primary, secondary, accent, iconStrokeWidth,
}: {
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    kicker: string;
    primary: string;
    secondary: string;
    accent: string;
    iconStrokeWidth?: number;
}) {
    return (
        <StatShell accent={accent}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: accent }}>
                <Icon size={14} strokeWidth={iconStrokeWidth ?? 2.25} />
                <StatKicker text={kicker} />
            </div>
            <StatPrimary text={primary} />
            <StatSecondary text={secondary} />
        </StatShell>
    );
}

/** Same shape as Stat but uses the EventGlyph dispatcher for the icon —
 *  separated so the dynamic component lookup happens inside a stable
 *  component reference, not a `const` assigned during render. */
function StatWithGlyph({
    eventType, kicker, primary, secondary, accent,
}: {
    eventType: string;
    kicker: string;
    primary: string;
    secondary: string;
    accent: string;
}) {
    return (
        <StatShell accent={accent}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: accent }}>
                <EventGlyph type={eventType} size={14} strokeWidth={2} />
                <StatKicker text={kicker} />
            </div>
            <StatPrimary text={primary} />
            <StatSecondary text={secondary} />
        </StatShell>
    );
}

function StatShell({ accent, children }: { accent: string; children: ReactNode }) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: `3px solid ${accent}`,
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
            }}
        >
            {children}
        </div>
    );
}

function StatKicker({ text }: { text: string }) {
    return (
        <span style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 700,
        }}>{text}</span>
    );
}

function StatPrimary({ text }: { text: string }) {
    return (
        <div style={{
            fontFamily: FONT_SECONDARY,
            fontSize: "1.05rem",
            lineHeight: 1.2,
            color: "var(--text-primary)",
        }}>{text}</div>
    );
}

function StatSecondary({ text }: { text: string }) {
    return (
        <div style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            color: "var(--text-tertiary)",
            lineHeight: 1.35,
        }}>{text}</div>
    );
}

// ─── Narrative (plain prose, no pull-quote) ────────────────────────────────

function NarrativeSection({
    event, location, isHistorical,
}: {
    event: GeodeticWeatherEvent;
    location: ReturnType<typeof parseEventLocation>;
    isHistorical: boolean;
}) {
    const typeInfo = plainTypeFor(event.type);
    const dayInfo = daysFromToday(event.date);
    const friendly = friendlyDate(event.date);

    const opener = isHistorical
        ? `${typeInfo.verbose.charAt(0).toUpperCase() + typeInfo.verbose.slice(1)} hit ${location.label} on ${friendly}.`
        : `A ${typeInfo.verbose} event is forecast for ${location.label} on ${friendly} (${dayInfo.label.toLowerCase()}).`;

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
            <div
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.2rem 1.35rem",
                    fontFamily: "var(--font-body)",
                    fontSize: "1.02rem",
                    lineHeight: 1.7,
                    color: "var(--text-primary)",
                }}
            >
                <p style={{ margin: 0 }}>{opener}</p>
                <p style={{ margin: "0.6rem 0 0" }}>{tierLine}</p>
                {outcomeLine ? <p style={{ margin: "0.6rem 0 0" }}>{outcomeLine}</p> : null}
            </div>
        </section>
    );
}

// ─── Outcome section (historical events without map) ──────────────────────

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

    return (
        <section style={section}>
            <div style={kicker}>Where + outcome</div>
            <h2 style={title}>Confirmed impact in {location.label}</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                gap: "0.75rem",
            }}>
                {items.map(({ Icon, label, value }) => (
                    <div
                        key={label}
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--surface-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "1.2rem 1.1rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-tertiary)" }}>
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
                            fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                            lineHeight: 1.05,
                            color: "var(--text-primary)",
                        }}>{value}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Map section ──────────────────────────────────────────────────────────

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
                    <div style={{ ...panel, padding: "1rem" }}>
                        <div style={body}>Impact area: <b style={{ color: "var(--text-primary)" }}>{location.label}</b>.</div>
                    </div>
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
            ...panel,
            padding: "1rem",
            borderLeft: `3px solid ${tierAccent(tier)}`,
        }}>
            <div style={{
                fontFamily: FONT_SECONDARY,
                fontSize: "1.05rem",
                lineHeight: 1.2,
                color: "var(--text-primary)",
                marginBottom: 6,
                display: "flex", alignItems: "center", gap: 6,
            }}>
                <MapPin size={14} strokeWidth={2.25} aria-hidden style={{ color: tierAccent(tier) }} />
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
            sublabel: "Background pressure sets in",
            description: (
                <AstroBody text={event.pair || event.geostress || "Background pressure setter from the source row."} />
            ),
        },
        {
            label: "Trigger",
            sublabel: "Peak window",
            description: event.criteria.key.includes("T12")
                ? "A clear trigger is marked in the criteria — this is when the event most likely peaks."
                : "No explicit T12 trigger in the row. Read the nearby aspects calendar for timing.",
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
                .timeline-wrap {
                    position: relative;
                    padding: 1.2rem 0;
                }
                .timeline-line {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 36px;
                    height: 2px;
                    border-radius: 1px;
                }
                .timeline-grid {
                    position: relative;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }
                .timeline-phase {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 1rem;
                }
                .timeline-dot-row {
                    display: flex;
                    justify-content: center;
                    position: relative;
                    z-index: 1;
                }
                .timeline-dot {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid var(--bg);
                    margin-top: 28px;
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

// ─── Criteria summary (used inside the "Why this scored" collapsible) ──────

function CriteriaSummary({ event }: { event: GeodeticWeatherEvent }) {
    const pct = event.criteria.total > 0 ? event.criteria.met / event.criteria.total : 0;
    return (
        <div style={panel}>
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
            <SeverityBar pss={pct} tier={event.tier} segments={Math.max(event.criteria.total, 10)} />
        </div>
    );
}

// ─── Collapsible ───────────────────────────────────────────────────────────

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
                    fontFamily: "var(--font-body)",
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

// ─── Fingerprint blocks ────────────────────────────────────────────────────

function FactorList({ items }: { items: string[] }) {
    if (items.length === 0) {
        return <p style={body}>No stars or sensitizers attached to this row.</p>;
    }
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
                Each chip is one piece of astrology evidence the model found.
                More chips means stronger signal.
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
    if (items.length === 0) {
        return <p style={body}>No nearby triggers in the catalog window.</p>;
    }
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
                    fontFamily: "var(--font-mono)",
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

const panel: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    borderRadius: "var(--radius-md)",
    padding: "clamp(1rem, 2vw, 1.35rem)",
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
