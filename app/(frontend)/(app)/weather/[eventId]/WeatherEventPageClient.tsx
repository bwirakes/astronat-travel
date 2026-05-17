"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { PageHeader } from "@/components/app/page-header-context";
import { ReadingsAtlasMap } from "@/app/components/ReadingsAtlasMap";
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

    return (
        <>
            <PageHeader title={event.title} backTo="/weather" backLabel="Weather" />
            <div className="weather-event-shell min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
                <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(24px, 5vw, 72px)" }}>
                    <div className="reading-hero-wrap mx-auto" style={{ marginTop: "clamp(20px, 3vw, 36px)" }}>
                        <WeatherHeroBanner event={event} />
                    </div>
                    <div style={{ marginTop: "clamp(24px, 3vw, 40px)" }}>
                        <HeroMetaStrip event={event} />
                    </div>
                    <MapSection event={event} />
                    <section style={section}>
                        <div style={kicker}>The read</div>
                        <h2 style={title}>What the event looks like</h2>
                        <p style={{ ...body, fontSize: "1.05rem", color: "var(--text-primary)" }}>{event.editorialBody}</p>
                        <Timeline event={event} />
                    </section>
                    <details style={details}>
                        <summary style={summary}>Astrological Fingerprint</summary>
                        <div style={{ display: "grid", gap: "1rem", paddingTop: "1rem" }}>
                            <FactorBlock title="Stars and sensitizers" items={factorItems} />
                            <FactorBlock title="Criteria checklist" items={event.criteria.key.split(" · ")} />
                            <FactorBlock title="Geodetic regions" items={event.zones.length ? event.zones : ["Historical row: no forecast geodetic zone attached"]} />
                            <TriggerBlock aspects={triggers.aspects} moons={triggers.moons} />
                            <MethodBlock matrix={matrix} />
                        </div>
                    </details>
                </main>
            </div>
            <style jsx global>{`
                /* Reading-hero parity: the rounded shape at the bottom of the
                   banner emerges into this token. Match the reading shell so
                   the banner reads identically across the two pages. */
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

/**
 * WeatherHeroBanner — mirrors the /reading hero banner pattern (blue gradient,
 * decorative starburst, eggshell PSS pill, verdict pill below). Adapted for
 * weather events: title = event title, pill subscript = "/1.00" since PSS is
 * a 0–1 score (not 0–100 like reading goal scores).
 */
function WeatherHeroBanner({ event }: { event: GeodeticWeatherEvent }) {
    const tier = event.tier;
    const tierColor = tierAccent(tier);
    const typeLabel = TYPE_TOKEN[event.type].label;

    return (
        <div
            className="reading-hero-banner relative overflow-hidden rounded-t-[8px] rounded-b-0 px-[clamp(18px,4vw,44px)] py-[clamp(22px,3.8vw,42px)]"
            style={{
                minHeight: "clamp(186px, 20vw, 244px)",
                background: "linear-gradient(180deg, #0456fb 0%, #0a63ff 100%)",
            }}
        >
            {/* Decorative starburst — mirrors reading banner */}
            <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="absolute right-[clamp(156px,14vw,218px)] top-[clamp(34px,4.4vw,58px)] h-[clamp(20px,2.4vw,34px)] w-[clamp(20px,2.4vw,34px)] max-sm:left-[48px] max-sm:right-auto max-sm:top-[170px] max-sm:h-[22px] max-sm:w-[22px]"
                style={{ color: "#CAF1F0" }}
            >
                <path d="M32 0 L38 25 L64 32 L38 39 L32 64 L26 39 L0 32 L26 25 Z" fill="currentColor" />
            </svg>

            {/* Bottom rounded shape — matches reading banner */}
            <div
                aria-hidden
                className="absolute inset-x-[-18%] bottom-[-47%] h-[64%] rounded-[50%]"
                style={{ background: "var(--reading-tabs-surface)" }}
            />

            {/* Tier accent disc + light cutout (mirrors planet/sun motif from reading) */}
            <div
                aria-hidden
                className="absolute right-[3.4%] bottom-[17%] h-[clamp(26px,3.4vw,44px)] w-[clamp(26px,3.4vw,44px)] rounded-full"
                style={{ background: `color-mix(in oklab, ${tierColor} 84%, #1B1B1B)` }}
            >
                <span
                    className="absolute -right-[18%] -top-[10%] h-[70%] w-[70%] rounded-full"
                    style={{ background: "var(--reading-tabs-surface)" }}
                />
            </div>

            {/* PSS pill (top-right) */}
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
                        color: "#0456fb",
                        fontFamily: FONT_MONO,
                        letterSpacing: "0.18em",
                        fontWeight: 800,
                    }}
                >
                    {tierLabel(tier)}
                </span>
            </div>

            {/* Title + meta on left */}
            <div className="relative z-10 grid min-h-[inherit] grid-cols-1 items-center gap-[18px]">
                <div className="flex min-w-0 flex-col justify-start gap-[10px] self-start pt-[clamp(38px,4.8vw,62px)] max-sm:pt-[28px]">
                    <span
                        className="inline-flex items-baseline leading-[0.86]"
                        style={{
                            color: "#F8F5EC",
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(34px, 5.4vw, 68px)",
                            letterSpacing: "-0.02em",
                            textShadow: "0 2px 0 rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        <span className="min-w-0">{event.title}</span>
                    </span>
                    <span
                        className="inline-flex items-center gap-2"
                        style={{
                            color: "color-mix(in oklab, #F8F5EC 82%, transparent)",
                            fontFamily: FONT_MONO,
                            fontSize: "11px",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                        }}
                    >
                        <span>{event.date}</span>
                        <span aria-hidden>·</span>
                        <span>{typeLabel}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Strip directly under the banner — surfaces the "soft" tags that used to sit
 * inside the old hero (criteria count, source, sourceNote) so they remain
 * accessible without crowding the banner.
 */
function HeroMetaStrip({ event }: { event: GeodeticWeatherEvent }) {
    return (
        <div style={pillRow}>
            <Tag>{event.criteria.met}/{event.criteria.total} criteria</Tag>
            {event.source ? <Tag>Source: {event.source}</Tag> : null}
            {event.sourceNote ? <Tag>{event.sourceNote}</Tag> : null}
        </div>
    );
}

function MapSection({ event }: { event: GeodeticWeatherEvent }) {
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
                    {(event.zones.length ? event.zones : ["Global or historical validation field"]).map((zone) => (
                        <div key={zone} style={{ ...panel, padding: "0.9rem", background: "var(--bg)" }}>
                            <div style={body}>{zone}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Timeline({ event }: { event: GeodeticWeatherEvent }) {
    return (
        <div style={{ ...panel, marginTop: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem", alignItems: "center" }}>
                <div>
                    <div style={kicker}>Phase 1</div>
                    <p style={body}>{event.pair || event.geostress || "Background pressure setter from the source row."}</p>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: tierAccent(event.tier) }} />
                <div>
                    <div style={kicker}>Phase 2</div>
                    <p style={body}>{event.criteria.key.includes("T12") ? "A trigger condition is marked in the criteria key." : "No explicit T12 trigger in this row; read nearby aspects for timing."}</p>
                </div>
            </div>
        </div>
    );
}

function FactorBlock({ title, items }: { title: string; items: string[] }) {
    return (
        <div style={panel}>
            <div style={kicker}>{title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.7rem" }}>
                {items.map((item) => <Tag key={item}>{item}</Tag>)}
            </div>
        </div>
    );
}

function TriggerBlock({ aspects, moons }: ReturnType<typeof triggersForWindow>) {
    return (
        <div style={panel}>
            <div style={kicker}>Phase 2 trigger calendar</div>
            {[...aspects.map((a) => `${a.date} · ${a.bodies} · Weather: ${a.weather} · Conflict: ${a.conflict}`), ...moons.map((m) => `${m.date} · ${m.degree} · ${m.note}`)].map((item) => (
                <p key={item} style={body}>{item}</p>
            ))}
        </div>
    );
}

function MethodBlock({ matrix }: { matrix: GeodeticMatrixResponse }) {
    return (
        <div style={panel}>
            <div style={kicker}>Method notes</div>
            {matrix.sourceCatalog.techniques.sourceNotes.map((note) => <p key={note} style={body}>{note}</p>)}
            <Link href="/weather" style={{ color: "var(--color-y2k-blue)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Back to map
            </Link>
        </div>
    );
}

function Tag({ children, color = "var(--text-secondary)" }: { children: ReactNode; color?: string }) {
    return (
        <span style={{
            display: "inline-flex",
            border: `1px solid ${color}`,
            color,
            borderRadius: 999,
            padding: "0.28rem 0.7rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.58rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
        }}>
            {children}
        </span>
    );
}

const section: CSSProperties = {
    padding: "clamp(32px, 5vw, 64px) 0",
    borderBottom: "1px solid var(--surface-border)",
};

const panel: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    borderRadius: "var(--radius-md)",
    padding: "clamp(1rem, 2vw, 1.35rem)",
};

const details: CSSProperties = {
    ...panel,
    margin: "clamp(32px, 5vw, 64px) 0",
};

const summary: CSSProperties = {
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "0.68rem",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--text-primary)",
    fontWeight: 800,
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
    fontSize: "clamp(2rem, 4vw, 3rem)",
    lineHeight: 1,
    margin: "0.35rem 0 1rem",
};

const body: CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "var(--text-secondary)",
};

const pillRow: CSSProperties = {
    display: "flex",
    gap: "0.45rem",
    alignItems: "center",
    flexWrap: "wrap",
};
