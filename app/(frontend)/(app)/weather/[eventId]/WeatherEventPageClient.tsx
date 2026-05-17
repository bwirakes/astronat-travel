"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { PageHeader } from "@/components/app/page-header-context";
import { ReadingsAtlasMap } from "@/app/components/ReadingsAtlasMap";
import SignIcon from "@/app/components/SignIcon";
import PlanetIcon from "@/app/components/PlanetIcon";
import {
    TYPE_TOKEN,
    tierAccent,
    tierLabel,
} from "@/app/lib/geodetic/weather-predictions";
import { triggersForWindow } from "@/app/lib/geodetic/weather-triggers";
import type { GeodeticMatrixResponse, GeodeticWeatherEvent } from "@/app/lib/geodetic/weather-types";
import { weatherEventToAtlasPin } from "../weather-map-pins";

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_MONO = "var(--font-mono, monospace)";

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
                {/* Banner section is full-bleed on mobile, contained on desktop. */}
                <div className="banner-wrap">
                    <WeatherHeroBanner event={event} />
                </div>

                <main className="event-main">
                    {/* Criteria chips strip directly under the banner — promoted out of the old
                        meta strip and the fingerprint <details> collapse so the criteria
                        breakdown is the FIRST thing visible. */}
                    <CriteriaStrip event={event} chips={criteriaChips} />

                    <MapSection event={event} zones={parsedZones} />

                    <section style={section}>
                        <div style={kicker}>The read</div>
                        <h2 style={title}>What the event looks like</h2>
                        <p style={{ ...body, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                            <AstroBody text={event.editorialBody} />
                        </p>
                        <Timeline event={event} />
                    </section>

                    {/* Astrological Fingerprint — promoted out of <details> collapse.
                        Renders as inline cards so the data is visible by default. */}
                    <section style={section}>
                        <div style={kicker}>Astrological fingerprint</div>
                        <h2 style={title}>Why this scores {event.pss.toFixed(2)}</h2>
                        <div style={{ display: "grid", gap: "1rem" }}>
                            <FactorBlock title="Stars and sensitizers" items={factorItems} />
                            <CriteriaChecklistBlock chips={criteriaChips} />
                            <TriggerBlock aspects={triggers.aspects} moons={triggers.moons} />
                            <MethodBlock matrix={matrix} />
                        </div>
                    </section>
                </main>
            </div>

            <style jsx>{`
                /* The banner-wrap controls full-bleed escape. On mobile (< 640px)
                   we let the banner span the full viewport width by setting margin
                   to 0 and padding to 0. On desktop the banner sits inside the
                   1180px content max-width with normal horizontal padding. */
                .banner-wrap {
                    margin-top: clamp(16px, 2.4vw, 28px);
                    max-width: 1180px;
                    margin-left: auto;
                    margin-right: auto;
                    padding: 0 clamp(24px, 5vw, 72px);
                }
                @media (max-width: 640px) {
                    .banner-wrap {
                        max-width: 100%;
                        padding: 0;
                        margin-top: 0;
                    }
                }
                .event-main {
                    max-width: 1180px;
                    margin: 0 auto;
                    padding: 0 clamp(24px, 5vw, 72px);
                }
            `}</style>

            <style jsx global>{`
                .weather-event-shell {
                    --reading-tabs-surface: var(--bg);
                }
                [data-theme="light"] .weather-event-shell {
                    --reading-tabs-surface: var(--color-eggshell);
                }
            `}</style>
        </>
    );
}

// ─── Banner ─────────────────────────────────────────────────────────────────

/**
 * WeatherHeroBanner — Reading-banner pattern adapted for weather events.
 *
 * Layout: CSS grid with reserved column for the PSS pill stack so the title
 * never clips behind it. On mobile, the pill stack moves above the title
 * (single-column grid). PSS pill uses Option A — stacked kicker above number,
 * verdict pill below.
 */
function WeatherHeroBanner({ event }: { event: GeodeticWeatherEvent }) {
    const tier = event.tier;
    const tierColor = tierAccent(tier);
    const typeLabel = TYPE_TOKEN[event.type].label;

    return (
        <div
            className="reading-hero-banner relative overflow-hidden rounded-t-[8px] rounded-b-0 max-sm:rounded-t-0"
            style={{
                minHeight: "clamp(186px, 20vw, 244px)",
                background: "linear-gradient(180deg, #0456fb 0%, #0a63ff 100%)",
            }}
        >
            <div className="banner-grid">
                {/* LEFT COLUMN — title + meta */}
                <div className="banner-title-col">
                    <span className="banner-title">{event.title}</span>
                    <span className="banner-meta">
                        <span>{event.date}</span>
                        <span aria-hidden>·</span>
                        <span>{typeLabel}</span>
                    </span>
                </div>

                {/* RIGHT COLUMN — PSS pill stack (Option A) */}
                <div className="banner-pill-col">
                    <div className="pss-pill">
                        <span className="pss-pill-kicker">PSS</span>
                        <span className="pss-pill-number">{event.pss.toFixed(2)}</span>
                    </div>
                    <span className="verdict-pill">{tierLabel(tier)}</span>
                </div>
            </div>

            {/* Decorative starburst */}
            <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="banner-star"
                style={{ color: "#CAF1F0" }}
            >
                <path d="M32 0 L38 25 L64 32 L38 39 L32 64 L26 39 L0 32 L26 25 Z" fill="currentColor" />
            </svg>

            {/* Bottom rounded shape — same as /reading */}
            <div
                aria-hidden
                className="banner-curve"
                style={{ background: "var(--reading-tabs-surface)" }}
            />

            {/* Tier accent disc */}
            <div
                aria-hidden
                className="banner-tier-disc"
                style={{ background: `color-mix(in oklab, ${tierColor} 84%, #1B1B1B)` }}
            >
                <span style={{ background: "var(--reading-tabs-surface)" }} />
            </div>

            <style jsx>{`
                .banner-grid {
                    position: relative;
                    z-index: 1;
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
                .banner-title {
                    display: block;
                    color: #F8F5EC;
                    font-family: ${FONT_PRIMARY};
                    font-size: clamp(30px, 5vw, 64px);
                    line-height: 0.92;
                    letter-spacing: -0.02em;
                    text-shadow: 0 2px 0 rgba(0,0,0,0.08);
                    /* Always wraps within its grid column. No more clipping. */
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }
                .banner-meta {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: color-mix(in oklab, #F8F5EC 82%, transparent);
                    font-family: ${FONT_MONO};
                    font-size: 11px;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                }
                .banner-pill-col {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 8px;
                    align-self: start;
                }
                .pss-pill {
                    background: #F8F5EC;
                    color: #1B1B1B;
                    border-radius: 999px;
                    padding: clamp(10px, 1.2vw, 14px) clamp(20px, 2.2vw, 28px);
                    box-shadow: 0 1px 0 rgba(0,0,0,0.04);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    line-height: 1;
                    min-width: clamp(96px, 11vw, 132px);
                }
                .pss-pill-kicker {
                    font-family: ${FONT_MONO};
                    font-size: clamp(9px, 0.85vw, 11px);
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: #8a8983;
                    margin-bottom: 4px;
                    font-weight: 700;
                }
                .pss-pill-number {
                    font-family: ${FONT_PRIMARY};
                    font-size: clamp(34px, 4.4vw, 56px);
                    font-variant-numeric: tabular-nums;
                    line-height: 1;
                }
                .verdict-pill {
                    background: #F8F5EC;
                    color: #0456fb;
                    border-radius: 999px;
                    padding: 8px 16px;
                    font-family: ${FONT_MONO};
                    font-size: clamp(11px, 0.95vw, 13px);
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    font-weight: 800;
                }
                .banner-star {
                    position: absolute;
                    right: clamp(160px, 16vw, 240px);
                    top: clamp(28px, 3.8vw, 48px);
                    height: clamp(20px, 2.4vw, 32px);
                    width: clamp(20px, 2.4vw, 32px);
                    z-index: 1;
                }
                .banner-curve {
                    position: absolute;
                    inset-inline: -18%;
                    bottom: -47%;
                    height: 64%;
                    border-radius: 50%;
                    z-index: 0;
                }
                .banner-tier-disc {
                    position: absolute;
                    right: 3.4%;
                    bottom: 17%;
                    width: clamp(26px, 3.4vw, 44px);
                    height: clamp(26px, 3.4vw, 44px);
                    border-radius: 50%;
                    z-index: 1;
                }
                .banner-tier-disc span {
                    position: absolute;
                    right: -18%;
                    top: -10%;
                    width: 70%;
                    height: 70%;
                    border-radius: 50%;
                }
                /* MOBILE — stack pill above title; banner gets full bleed via parent wrapper. */
                @media (max-width: 640px) {
                    .banner-grid {
                        grid-template-columns: 1fr;
                        gap: 18px;
                        padding: 20px 18px 28px;
                    }
                    .banner-title-col {
                        padding-top: 8px;
                        align-self: start;
                        order: 2;
                    }
                    .banner-pill-col {
                        order: 1;
                        flex-direction: row;
                        align-items: center;
                        align-self: flex-start;
                        gap: 10px;
                    }
                    .pss-pill {
                        flex-direction: row;
                        align-items: baseline;
                        gap: 8px;
                    }
                    .pss-pill-kicker {
                        margin-bottom: 0;
                        order: 2;
                    }
                    .pss-pill-number {
                        order: 1;
                        font-size: 32px;
                    }
                    .banner-title {
                        font-size: clamp(26px, 7vw, 36px);
                    }
                    .banner-star,
                    .banner-tier-disc { display: none; }
                }
            `}</style>
        </div>
    );
}

// ─── Criteria chip strip ──────────────────────────────────────────────────

/**
 * CriteriaStrip — the most cited content (which techniques fired) promoted
 * directly under the banner. The criteria.key string is already "·"-delimited;
 * splitting on it yields one chip per technique. Each chip is rendered with a
 * mono monospace label.
 */
function CriteriaStrip({ event, chips }: { event: GeodeticWeatherEvent; chips: string[] }) {
    return (
        <section style={{ padding: "clamp(20px, 2.6vw, 32px) 0" }}>
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                marginBottom: 12,
            }}>
                <span style={{
                    ...chipStrong,
                    background: tierAccent(event.tier),
                    color: "#1B1B1B",
                    borderColor: tierAccent(event.tier),
                }}>
                    {event.criteria.met}/{event.criteria.total} criteria
                </span>
                {event.source ? <Tag>Source: {event.source}</Tag> : null}
                {event.sourceNote ? <Tag>{event.sourceNote}</Tag> : null}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {chips.map((chip) => (
                    <span key={chip} style={chipMono}>
                        <AstroBody text={chip} />
                    </span>
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
// Aspect glyphs render as text since there are no in-house SVGs for them.
const ASPECT_BY_GLYPH: Record<string, string> = {
    "☌": "conj", "□": "sq", "☍": "opp",
};
const GLYPH_RE = /([♈-♓]|[☿♀♂♃♄♅♆♇]|[☌□☍])/g;

/**
 * AstroBody — walks the editorial body, replacing Unicode astro glyphs with
 * in-house SVG components (SignIcon / PlanetIcon) so they don't fall back to
 * emoji rendering. Aspect glyphs (☌ □ ☍) get a small superscript-style mono
 * abbreviation since there's no equivalent SVG.
 */
function AstroBody({ text }: { text: string }) {
    const parts = text.split(GLYPH_RE);
    return (
        <>
            {parts.map((part, i) => {
                if (!part) return null;
                if (ZODIAC_BY_GLYPH[part]) {
                    return (
                        <SignIcon
                            key={i}
                            sign={ZODIAC_BY_GLYPH[part]}
                            size={14}
                            className="inline-block align-middle mx-0.5"
                        />
                    );
                }
                if (PLANET_BY_GLYPH[part]) {
                    return (
                        <PlanetIcon
                            key={i}
                            planet={PLANET_BY_GLYPH[part]}
                            size={14}
                            className="inline-block align-middle mx-0.5"
                        />
                    );
                }
                if (ASPECT_BY_GLYPH[part]) {
                    return (
                        <span
                            key={i}
                            style={{
                                fontFamily: FONT_MONO,
                                fontSize: "0.7em",
                                padding: "0 0.2em",
                                color: "var(--text-tertiary)",
                                letterSpacing: "0.04em",
                            }}
                        >
                            {ASPECT_BY_GLYPH[part]}
                        </span>
                    );
                }
                return <Fragment key={i}>{part}</Fragment>;
            })}
        </>
    );
}

// ─── Zone parsing ─────────────────────────────────────────────────────────

interface ParsedZone {
    primary: string;
    subtitle: string | null;
}

/**
 * parseZone — splits a raw zone string like
 *   "UK / Ghana / Nigeria (0°E — Sa☌Ne world point)"
 * into { primary: "UK / Ghana / Nigeria", subtitle: "0°E — Sa☌Ne world point" }.
 */
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
            <h2 style={title}>Geodetic zones</h2>
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
                        <div style={body}>Global or historical validation field.</div>
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
            }}>
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

// ─── Timeline ─────────────────────────────────────────────────────────────

function Timeline({ event }: { event: GeodeticWeatherEvent }) {
    return (
        <div style={{ ...panel, marginTop: "1rem" }}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: "1rem",
                alignItems: "center",
            }}>
                <div>
                    <div style={kicker}>Phase 1</div>
                    <p style={body}>
                        <AstroBody text={event.pair || event.geostress || "Background pressure setter from the source row."} />
                    </p>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: tierAccent(event.tier) }} />
                <div>
                    <div style={kicker}>Phase 2</div>
                    <p style={body}>
                        {event.criteria.key.includes("T12")
                            ? "A trigger condition is marked in the criteria key."
                            : "No explicit T12 trigger in this row; read nearby aspects for timing."}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Fingerprint subsections ──────────────────────────────────────────────

function FactorBlock({ title, items }: { title: string; items: string[] }) {
    return (
        <div style={panel}>
            <div style={kicker}>{title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.7rem" }}>
                {items.map((item) => (
                    <Tag key={item}>
                        <AstroBody text={item} />
                    </Tag>
                ))}
            </div>
        </div>
    );
}

function CriteriaChecklistBlock({ chips }: { chips: string[] }) {
    return (
        <div style={panel}>
            <div style={kicker}>Criteria checklist</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "0.7rem" }}>
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
    return (
        <div style={panel}>
            <div style={kicker}>Phase 2 trigger calendar</div>
            {[
                ...aspects.map((a) => `${a.date} · ${a.bodies} · Weather: ${a.weather} · Conflict: ${a.conflict}`),
                ...moons.map((m) => `${m.date} · ${m.degree} · ${m.note}`),
            ].map((item) => (
                <p key={item} style={body}><AstroBody text={item} /></p>
            ))}
        </div>
    );
}

function MethodBlock({ matrix }: { matrix: GeodeticMatrixResponse }) {
    return (
        <div style={panel}>
            <div style={kicker}>Method notes</div>
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
                }}
            >
                Back to map
            </Link>
        </div>
    );
}

// ─── Shared atoms ─────────────────────────────────────────────────────────

function Tag({ children, color = "var(--text-secondary)" }: { children: ReactNode; color?: string }) {
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            border: `1px solid ${color}`,
            color,
            borderRadius: 999,
            padding: "0.28rem 0.7rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.58rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
            whiteSpace: "nowrap",
        }}>
            {children}
        </span>
    );
}

const chipMono: CSSProperties = {
    display: "inline-block",
    background: "var(--surface)",
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

const chipStrong: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    background: "var(--text-primary)",
    color: "var(--bg)",
    border: `1px solid var(--text-primary)`,
    borderRadius: 999,
    padding: "0.32rem 0.85rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.62rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 800,
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
