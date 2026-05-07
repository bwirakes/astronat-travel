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

export default function WeatherEventPageClient({ event, matrix }: {
    event: GeodeticWeatherEvent;
    matrix: GeodeticMatrixResponse;
}) {
    const triggers = triggersForWindow(event.date);
    const factorItems = [...event.stars, event.pair, event.geostress].filter((item): item is string => Boolean(item));

    return (
        <>
            <PageHeader title={event.title} backTo="/weather" backLabel="Weather" />
            <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)]">
                <main style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(16px, 3vw, 32px)" }}>
                    <Hero event={event} />
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
        </>
    );
}

function Hero({ event }: { event: GeodeticWeatherEvent }) {
    return (
        <section style={{ padding: "clamp(24px, 5vw, 60px) 0", borderBottom: "1px solid var(--surface-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                    <div style={pillRow}>
                        <Tag>{event.date}</Tag>
                        <Tag color={TYPE_TOKEN[event.type].accent}>{TYPE_TOKEN[event.type].label}</Tag>
                        <Tag color={tierAccent(event.tier)}>{tierLabel(event.tier)}</Tag>
                    </div>
                    <h1 style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(2.8rem, 7vw, 6rem)",
                        lineHeight: 0.86,
                        letterSpacing: "-0.04em",
                        textTransform: "uppercase",
                        margin: "1rem 0 0",
                        maxWidth: 920,
                    }}>
                        {event.title}
                    </h1>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ ...kicker, color: tierAccent(event.tier) }}>PSS</div>
                    <div style={{ fontFamily: "var(--font-primary)", fontSize: "4rem", lineHeight: 0.9 }}>{event.pss.toFixed(2)}</div>
                </div>
            </div>
            <PssBar event={event} />
            <div style={{ ...pillRow, marginTop: "1rem" }}>
                {event.source && <Tag>Source: {event.source}</Tag>}
                <Tag>{event.criteria.met}/{event.criteria.total} criteria</Tag>
                {event.sourceNote && <Tag>{event.sourceNote}</Tag>}
            </div>
        </section>
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

function PssBar({ event }: { event: GeodeticWeatherEvent }) {
    return (
        <div style={{ marginTop: "1rem", height: 10, background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
            <div style={{ width: `${event.pss * 100}%`, height: "100%", background: tierAccent(event.tier) }} />
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
