"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
    Calendar, MapPin, TrendingUp,
    Droplet, Flame, Wind, Sun, Mountain, Globe2, CloudSnow, Tornado,
    ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header-context";
import { ReadingsAtlasMap } from "@/app/components/ReadingsAtlasMap";
import SignIcon from "@/app/components/SignIcon";
import PlanetIcon from "@/app/components/PlanetIcon";
import { tierAccent, tierLabel } from "@/app/lib/geodetic/weather-predictions";
import { triggersForWindow } from "@/app/lib/geodetic/weather-triggers";
import type { GeodeticMatrixResponse, GeodeticWeatherEvent } from "@/app/lib/geodetic/weather-types";
import { weatherEventToAtlasPin } from "../weather-map-pins";

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_MONO = "var(--font-mono, monospace)";

// ─── Plain-language vocabulary ──────────────────────────────────────────────
// Built for a 7th-grade ESL reader: short words, simple grammar, no jargon.

const TYPE_PLAIN: Record<string, { word: string; verbose: string; Icon: typeof Droplet }> = {
    flood:          { word: "Flood",       verbose: "heavy rain and flooding",                Icon: Droplet },
    wildfire:       { word: "Wildfire",    verbose: "wildfire risk",                           Icon: Flame },
    storm_cyclone:  { word: "Big Storm",   verbose: "a big storm or cyclone",                  Icon: Wind },
    earthquake:     { word: "Earthquake",  verbose: "earthquake or seismic activity",          Icon: Mountain },
    heatwave:       { word: "Heat Wave",   verbose: "very hot weather",                        Icon: Sun },
    tornado:        { word: "Tornado",     verbose: "tornado risk",                            Icon: Tornado },
    winter_storm:   { word: "Winter Storm", verbose: "snow, ice, or freezing weather",         Icon: CloudSnow },
    compound:       { word: "Compound",    verbose: "many weather problems together",          Icon: Globe2 },
};

const TIER_PLAIN: Record<string, { word: string; sentence: string }> = {
    critical: { word: "Very High Pressure", sentence: "The chance of trouble is very high. Watch closely." },
    high:     { word: "High Pressure",      sentence: "The chance of trouble is high. Pay attention." },
    moderate: { word: "Some Pressure",      sentence: "There is some risk. Stay aware." },
    watch:    { word: "Watch",              sentence: "Worth watching, but pressure is low." },
    low:      { word: "Low Pressure",       sentence: "Low risk for this event." },
};

function plainTypeFor(type: string): { word: string; verbose: string; Icon: typeof Droplet } {
    return TYPE_PLAIN[type] ?? { word: type, verbose: type, Icon: Globe2 };
}

function plainTierFor(tier: string): { word: string; sentence: string } {
    return TIER_PLAIN[tier] ?? { word: tier, sentence: "" };
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
    if (days > 0)   return { days, label: `In ${days} days` };
    return { days, label: `${Math.abs(days)} days ago` };
}

function friendlyDate(dateStr: string): string {
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
}

function listWithAnd(items: string[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function WeatherEventPageClient({ event, matrix }: {
    event: GeodeticWeatherEvent;
    matrix: GeodeticMatrixResponse;
}) {
    const triggers = triggersForWindow(event.date);
    const factorItems = [...event.stars, event.pair, event.geostress].filter((item): item is string => Boolean(item));
    const criteriaChips = event.criteria.key.split(" · ").filter(Boolean);
    const parsedZones = (event.zones.length ? event.zones : []).map(parseZone);

    return (
        <>
            <PageHeader title={event.title} backTo="/weather" backLabel="Weather" />
            <div className="weather-event-shell min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
                <div className="banner-wrap">
                    <WeatherHeroBanner event={event} />
                </div>

                <main className="event-main">
                    {/* AT-A-GLANCE — four indicator cards, ESL-readable */}
                    <AtAGlance event={event} zoneCount={parsedZones.length} />

                    {/* PLAIN-ENGLISH SUMMARY — what this means in 7th-grade English */}
                    <PlainEnglishSummary event={event} zones={parsedZones} />

                    {/* MAP + ZONE CARDS — keep visible */}
                    <MapSection event={event} zones={parsedZones} />

                    {/* PHASE TIMELINE — keep visible (visual, easy) */}
                    <section style={section}>
                        <div style={kicker}>Timeline</div>
                        <h2 style={title}>How this unfolds</h2>
                        <Timeline event={event} />
                    </section>

                    {/* ─── COLLAPSIBLE DETAILS ─── Astro/technical content at the END */}
                    <section style={{ ...section, borderBottom: "none" }}>
                        <div style={kicker}>For the curious</div>
                        <h2 style={title}>Astrology detail</h2>
                        <p style={{ ...body, fontSize: "0.9rem", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
                            Open any card to see the astrology behind this prediction.
                            It uses planet names, sign names, and degrees that astrologers track.
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
                                    <ScoreBar event={event} />
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

            <style jsx global>{`
                .weather-event-shell { --reading-tabs-surface: var(--bg); }
                [data-theme="light"] .weather-event-shell { --reading-tabs-surface: var(--color-eggshell); }
            `}</style>
        </>
    );
}

// ─── Banner ─────────────────────────────────────────────────────────────────

function WeatherHeroBanner({ event }: { event: GeodeticWeatherEvent }) {
    const tier = event.tier;
    const tierColor = tierAccent(tier);
    const { Icon: TypeIcon, word: typeWord } = plainTypeFor(event.type);

    return (
        <div
            className="reading-hero-banner relative overflow-hidden rounded-t-[8px] rounded-b-0 max-sm:rounded-t-0"
            style={{
                minHeight: "clamp(200px, 22vw, 260px)",
                background: "linear-gradient(180deg, #0456fb 0%, #0a63ff 100%)",
            }}
        >
            <div className="banner-grid">
                <div className="banner-title-col">
                    {/* TYPE indicator chip — visual + word, top of left column */}
                    <span className="type-indicator">
                        <TypeIcon size={14} strokeWidth={2.25} aria-hidden />
                        <span>{typeWord}</span>
                    </span>
                    <span className="banner-title">{event.title}</span>
                    <span className="banner-meta">{friendlyDate(event.date).toUpperCase()}</span>
                </div>

                <div className="banner-pill-col">
                    <div className="pss-pill">
                        <span className="pss-pill-kicker">PSS</span>
                        <span className="pss-pill-number">{event.pss.toFixed(2)}</span>
                    </div>
                    <span className="verdict-pill">{tierLabel(tier)}</span>
                </div>
            </div>

            {/* Big background event-type icon — replaces abstract starburst */}
            <div className="banner-glyph" aria-hidden>
                <TypeIcon size={200} strokeWidth={1.25} />
            </div>

            <div aria-hidden className="banner-curve" style={{ background: "var(--reading-tabs-surface)" }} />
            <div aria-hidden className="banner-tier-disc" style={{ background: `color-mix(in oklab, ${tierColor} 84%, #1B1B1B)` }}>
                <span style={{ background: "var(--reading-tabs-surface)" }} />
            </div>

            <style jsx>{`
                .banner-grid {
                    position: relative;
                    z-index: 2;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: clamp(16px, 3vw, 40px);
                    align-items: start;
                    padding: clamp(22px, 3.8vw, 42px) clamp(18px, 4vw, 44px);
                    min-height: inherit;
                }
                .banner-title-col {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    align-self: end;
                    padding-top: clamp(38px, 4.8vw, 62px);
                }
                .type-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255,255,255,0.18);
                    color: #F8F5EC;
                    border-radius: 999px;
                    padding: 5px 12px 5px 10px;
                    font-family: ${FONT_MONO};
                    font-size: 10px;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    font-weight: 700;
                    align-self: flex-start;
                    backdrop-filter: blur(6px);
                }
                .banner-title {
                    display: block;
                    color: #F8F5EC;
                    font-family: ${FONT_PRIMARY};
                    font-size: clamp(30px, 5vw, 64px);
                    line-height: 0.92;
                    letter-spacing: -0.02em;
                    text-shadow: 0 2px 0 rgba(0,0,0,0.08);
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }
                .banner-meta {
                    color: color-mix(in oklab, #F8F5EC 82%, transparent);
                    font-family: ${FONT_MONO};
                    font-size: 11px;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
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
                    border-radius: 999px;
                    padding: clamp(10px, 1.2vw, 14px) clamp(20px, 2.2vw, 28px);
                    box-shadow: 0 1px 0 rgba(0,0,0,0.04);
                    display: flex; flex-direction: column; align-items: center;
                    line-height: 1; min-width: clamp(96px, 11vw, 132px);
                }
                .pss-pill-kicker {
                    font-family: ${FONT_MONO}; font-size: clamp(9px, 0.85vw, 11px);
                    letter-spacing: 0.18em; text-transform: uppercase;
                    color: #8a8983; margin-bottom: 4px; font-weight: 700;
                }
                .pss-pill-number {
                    font-family: ${FONT_PRIMARY};
                    font-size: clamp(34px, 4.4vw, 56px);
                    font-variant-numeric: tabular-nums; line-height: 1;
                }
                .verdict-pill {
                    background: #F8F5EC; color: #0456fb;
                    border-radius: 999px; padding: 8px 16px;
                    font-family: ${FONT_MONO};
                    font-size: clamp(11px, 0.95vw, 13px);
                    letter-spacing: 0.18em; text-transform: uppercase; font-weight: 800;
                }
                .banner-glyph {
                    position: absolute;
                    right: -30px; top: 50%;
                    transform: translateY(-50%);
                    color: rgba(202, 241, 240, 0.18);
                    z-index: 1;
                    pointer-events: none;
                }
                .banner-curve {
                    position: absolute;
                    inset-inline: -18%; bottom: -47%;
                    height: 64%; border-radius: 50%; z-index: 0;
                }
                .banner-tier-disc {
                    position: absolute;
                    right: 3.4%; bottom: 17%;
                    width: clamp(26px, 3.4vw, 44px);
                    height: clamp(26px, 3.4vw, 44px);
                    border-radius: 50%; z-index: 1;
                }
                .banner-tier-disc span {
                    position: absolute;
                    right: -18%; top: -10%;
                    width: 70%; height: 70%;
                    border-radius: 50%;
                }
                @media (max-width: 640px) {
                    .banner-grid {
                        grid-template-columns: 1fr;
                        gap: 18px;
                        padding: 20px 18px 32px;
                    }
                    .banner-title-col { padding-top: 8px; align-self: start; order: 2; }
                    .banner-pill-col { order: 1; flex-direction: row; align-items: center; align-self: flex-start; gap: 10px; }
                    .pss-pill { flex-direction: row; align-items: baseline; gap: 8px; }
                    .pss-pill-kicker { margin-bottom: 0; order: 2; }
                    .pss-pill-number { order: 1; font-size: 32px; }
                    .banner-title { font-size: clamp(26px, 7vw, 36px); }
                    .banner-glyph { right: -60px; opacity: 0.6; }
                    .banner-tier-disc { display: none; }
                }
            `}</style>
        </div>
    );
}

// ─── At-a-glance indicator strip ────────────────────────────────────────────

function AtAGlance({ event, zoneCount }: { event: GeodeticWeatherEvent; zoneCount: number }) {
    const dayInfo = daysFromToday(event.date);
    const tierInfo = plainTierFor(event.tier);
    const typeInfo = plainTypeFor(event.type);

    return (
        <section style={{ padding: "clamp(20px, 2.4vw, 32px) 0" }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "0.8rem",
                }}
            >
                <Stat
                    Icon={Calendar}
                    kicker="When"
                    primary={dayInfo.label}
                    secondary={friendlyDate(event.date)}
                />
                <Stat
                    Icon={typeInfo.Icon}
                    kicker="Type"
                    primary={typeInfo.word}
                    secondary={typeInfo.verbose}
                />
                <Stat
                    Icon={MapPin}
                    kicker="Where"
                    primary={zoneCount === 0 ? "Worldwide" : `${zoneCount} ${zoneCount === 1 ? "area" : "areas"}`}
                    secondary={zoneCount === 0 ? "Global / historical row" : "See map below"}
                />
                <Stat
                    Icon={TrendingUp}
                    kicker="Pressure"
                    primary={tierInfo.word}
                    secondary={`PSS ${event.pss.toFixed(2)} of 1.00`}
                    accent={tierAccent(event.tier)}
                />
            </div>
        </section>
    );
}

function Stat({
    Icon, kicker, primary, secondary, accent,
}: {
    Icon: typeof Droplet;
    kicker: string;
    primary: string;
    secondary: string;
    accent?: string;
}) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: accent ? `3px solid ${accent}` : "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: accent ?? "var(--text-tertiary)" }}>
                <Icon size={14} strokeWidth={2.25} aria-hidden />
                <span style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}>{kicker}</span>
            </div>
            <div style={{
                fontFamily: "var(--font-secondary)",
                fontSize: "1.05rem",
                lineHeight: 1.2,
                color: "var(--text-primary)",
            }}>{primary}</div>
            <div style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                color: "var(--text-tertiary)",
                lineHeight: 1.35,
            }}>{secondary}</div>
        </div>
    );
}

// ─── Plain English summary ──────────────────────────────────────────────────

function PlainEnglishSummary({ event, zones }: { event: GeodeticWeatherEvent; zones: ParsedZone[] }) {
    const tierInfo = plainTierFor(event.tier);
    const typeInfo = plainTypeFor(event.type);
    const dayInfo = daysFromToday(event.date);
    const friendly = friendlyDate(event.date);
    const areas = zones.map((z) => z.primary);
    const areaSummary = areas.length === 0
        ? "This event applies worldwide or to a historical case."
        : `Main areas: ${listWithAnd(areas.slice(0, 3))}${areas.length > 3 ? `, plus ${areas.length - 3} more` : ""}.`;

    const tenseVerb = dayInfo.days < 0 ? "happened" : "is expected";

    const sentences: string[] = [
        `This ${tenseVerb} on ${friendly} (${dayInfo.label.toLowerCase()}).`,
        `It is a ${typeInfo.verbose} event.`,
        tierInfo.sentence,
        areaSummary,
    ];

    return (
        <section style={section}>
            <div style={kicker}>What this means</div>
            <h2 style={title}>In plain English</h2>
            <div
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderLeft: `3px solid ${tierAccent(event.tier)}`,
                    borderRadius: "var(--radius-md)",
                    padding: "1.1rem 1.25rem",
                    fontFamily: "var(--font-body)",
                    fontSize: "1.02rem",
                    lineHeight: 1.65,
                    color: "var(--text-primary)",
                }}
            >
                {sentences.map((s, i) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : "0.55rem 0 0" }}>{s}</p>
                ))}
            </div>
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

// ─── Zone parsing ─────────────────────────────────────────────────────────

interface ParsedZone { primary: string; subtitle: string | null }

function parseZone(raw: string): ParsedZone {
    const match = raw.match(/^(.*?)\s*\((.*)\)\s*$/);
    if (!match) return { primary: raw, subtitle: null };
    return { primary: match[1].trim(), subtitle: match[2].trim() };
}

// ─── Map + zone cards ─────────────────────────────────────────────────────

function MapSection({ event, zones }: { event: GeodeticWeatherEvent; zones: ParsedZone[] }) {
    const [hoveredId, setHoveredId] = useState<string | null>(event.id);
    const pin = weatherEventToAtlasPin(event);

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
                    />
                </div>
                {zones.length === 0 ? (
                    <div style={{ ...panel, padding: "0.9rem" }}>
                        <div style={body}>No specific area attached. This row is global or historical.</div>
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "0.75rem",
                    }}>
                        {zones.map((zone, i) => (
                            <ZoneCard key={i} zone={zone} tier={event.tier} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function ZoneCard({ zone, tier }: { zone: ParsedZone; tier: GeodeticWeatherEvent["tier"] }) {
    return (
        <div style={{
            ...panel,
            padding: "1rem",
            borderLeft: `3px solid ${tierAccent(tier)}`,
        }}>
            <div style={{
                fontFamily: "var(--font-secondary)",
                fontSize: "1.05rem",
                lineHeight: 1.2,
                color: "var(--text-primary)",
                marginBottom: 6,
                display: "flex", alignItems: "center", gap: 6,
            }}>
                <MapPin size={14} strokeWidth={2.25} aria-hidden style={{ color: tierAccent(tier) }} />
                {zone.primary}
            </div>
            {zone.subtitle ? (
                <div style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.65rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    lineHeight: 1.5,
                }}>
                    <AstroBody text={zone.subtitle} />
                </div>
            ) : null}
        </div>
    );
}

// ─── Timeline (Phase 1 / Phase 2) ────────────────────────────────────────

function Timeline({ event }: { event: GeodeticWeatherEvent }) {
    const phase2 = event.criteria.key.includes("T12")
        ? "A clear trigger is marked in the criteria."
        : "No specific trigger. Watch nearby aspects for timing.";
    return (
        <div style={{
            ...panel,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "1rem",
            alignItems: "stretch",
            padding: "1rem 1.2rem",
        }}>
            <div>
                <div style={{ ...kicker, color: "var(--text-secondary)" }}>Phase 1 — Build-up</div>
                <p style={{ ...body, marginTop: 4 }}>
                    <AstroBody text={event.pair || event.geostress || "Background pressure setter from the source row."} />
                </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 1, flex: 1, background: "var(--surface-border)" }} />
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: tierAccent(event.tier) }} />
                <div style={{ width: 1, flex: 1, background: "var(--surface-border)" }} />
            </div>
            <div>
                <div style={{ ...kicker, color: "var(--text-secondary)" }}>Phase 2 — Trigger</div>
                <p style={{ ...body, marginTop: 4 }}>{phase2}</p>
            </div>
        </div>
    );
}

// ─── ScoreBar (visualises X of Y criteria met) ────────────────────────────

function ScoreBar({ event }: { event: GeodeticWeatherEvent }) {
    const pct = event.criteria.total > 0 ? event.criteria.met / event.criteria.total : 0;
    return (
        <div style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={kicker}>Criteria met</span>
                <span style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.7rem",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                }}>
                    {event.criteria.met} of {event.criteria.total}
                </span>
            </div>
            <div style={{ height: 6, background: "var(--bg)", border: "1px solid var(--surface-border)" }}>
                <div style={{
                    width: `${pct * 100}%`,
                    height: "100%",
                    background: tierAccent(event.tier),
                }} />
            </div>
        </div>
    );
}

// ─── Collapsible — custom-styled details element ──────────────────────────

function Collapsible({
    summary, badge, children,
}: {
    summary: string;
    badge?: string;
    children: ReactNode;
}) {
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
                }}>
                    {summary}
                </span>
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

// ─── Fingerprint subsections ──────────────────────────────────────────────

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

// ─── Shared atoms ─────────────────────────────────────────────────────────

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
