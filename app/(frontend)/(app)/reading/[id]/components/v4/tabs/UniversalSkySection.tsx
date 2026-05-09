"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
    UniversalSkyState,
    SkyRetrograde,
    SkyStation,
    SkyIngress,
    SkyAspect,
    SkyNodeAspect,
} from "@/app/lib/universal-sky";
import { rankSkyEvents, deriveSkyVerdict } from "@/app/lib/universal-sky-rank";
import {
    templateForKpiCard,
    templateForVerdictLead,
} from "@/app/lib/universal-sky-templates";
import SectionHead from "../../shared/SectionHead";
import SkyKpiCard from "./SkyKpiCard";

interface Props {
    sky: UniversalSkyState;
    /** §-index to render in the header. */
    sectionIndex?: string;
    /** User's goalIds from /reading/new. First entry is treated as the primary
     *  goal and drives the goal-tied action lines on each KPI card. */
    goalIds?: string[];
    /** ISO travel-window start (defaults to today). Drives "during your trip"
     *  flagging on each event so trip-overlapping events get prioritized. */
    travelStartISO?: string;
    /** ISO travel-window end. For trips, travelStart + 7d is a reasonable
     *  default; for relocations, travelStart + 365d. */
    travelEndISO?: string;
}

// ── Styling — mirrors PlaceFieldTab conventions ───────────────────────────

const KICKER: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.55rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "var(--text-tertiary)",
    fontWeight: 600,
    marginBottom: "0.75rem",
};

const DIVIDER: React.CSSProperties = {
    height: 1,
    background: "var(--surface-border)",
};

const BODY: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "var(--text-secondary)",
    fontWeight: 400,
};

const BODY_MUTED: React.CSSProperties = {
    ...BODY,
    color: "var(--text-tertiary)",
    margin: "0 0 var(--space-md) 0",
    maxWidth: "640px",
};

const VERDICT_HEADLINE: React.CSSProperties = {
    fontFamily: "var(--font-primary)",
    fontSize: "clamp(1.4rem, 2.4vw, 1.75rem)",
    fontWeight: 500,
    lineHeight: 1.2,
    color: "var(--text-primary)",
    margin: "0.4rem 0 0.6rem 0",
    maxWidth: "640px",
};

const VERDICT_LEAD: React.CSSProperties = {
    ...BODY,
    fontSize: "1.02rem",
    color: "var(--text-secondary)",
    margin: "0 0 var(--space-lg) 0",
    maxWidth: "640px",
};

const KPI_GRID: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem",
    marginBottom: "var(--space-lg)",
};

const RAW_DETAILS_SUMMARY: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.7rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "var(--text-tertiary)",
    cursor: "pointer",
    padding: "0.6rem 0",
    listStyle: "none",
    fontWeight: 600,
};

const ROW: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
    padding: "0.65rem 0",
    borderTop: "1px solid var(--surface-border)",
};

const PLANET_LABEL: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    color: "var(--text-primary)",
    fontWeight: 500,
    textTransform: "capitalize",
};

const META: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    color: "var(--text-tertiary)",
};

const PILL_BASE: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.58rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    // Longhand border so per-variant `borderColor` overrides don't clash
    // with the shorthand (React warning otherwise).
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--surface-border)",
    borderRadius: "999px",
    padding: "0.1rem 0.5rem",
    fontWeight: 700,
};

const PILL_NEUTRAL: React.CSSProperties = {
    ...PILL_BASE,
    color: "var(--text-tertiary)",
    background: "transparent",
};

const PILL_FLAGGED: React.CSSProperties = {
    ...PILL_BASE,
    color: "var(--color-spiced-life, #c66)",
    background: "color-mix(in oklab, var(--color-spiced-life, #c66) 8%, transparent)",
    borderColor: "color-mix(in oklab, var(--color-spiced-life, #c66) 40%, var(--surface-border))",
};

const PILL_FAVOURABLE: React.CSSProperties = {
    ...PILL_BASE,
    color: "var(--gold, #b88)",
    background: "color-mix(in oklab, var(--gold, #b88) 8%, transparent)",
    borderColor: "color-mix(in oklab, var(--gold, #b88) 40%, var(--surface-border))",
};

// ── Helpers (used by raw details fallback view) ───────────────────────────

function cap(s: string): string {
    if (!s) return "";
    return s[0].toUpperCase() + s.slice(1);
}

function isDignityFlagged(d: string): boolean { return d === "detriment" || d === "fall"; }
function isDignityFavourable(d: string): boolean { return d === "domicile" || d === "exalted"; }

function fmtAspectSymbol(t: string): string {
    switch (t) {
        case "conjunction": return "☌";
        case "sextile":     return "✶";
        case "square":      return "□";
        case "trine":       return "△";
        case "opposition":  return "☍";
        default:            return "•";
    }
}

function fmtDate(iso: string): string {
    const d = new Date(`${iso}T12:00:00Z`);
    if (!isFinite(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Raw details (collapsible — the old §03 view, kept for power users) ───

function RetrogradeRow({ item }: { item: SkyRetrograde }) {
    const flagged = isDignityFlagged(item.dignity);
    const favourable = isDignityFavourable(item.dignity);
    const dignityStyle = flagged ? PILL_FLAGGED : favourable ? PILL_FAVOURABLE : PILL_NEUTRAL;
    return (
        <div style={ROW}>
            <span style={PLANET_LABEL}>{cap(item.planet)}</span>
            <span style={META}>℞ in {item.sign}</span>
            <span style={dignityStyle}>{item.dignity}</span>
            <span style={PILL_NEUTRAL}>{item.element} · {item.modality}</span>
        </div>
    );
}

function UpcomingRow({
    label, dateLabel, tone,
}: {
    label: string;
    dateLabel: string;
    tone: "ingress" | "station-rx" | "station-direct";
}) {
    const pill = tone === "station-rx" ? PILL_FLAGGED : tone === "station-direct" ? PILL_FAVOURABLE : PILL_NEUTRAL;
    const kindLabel = tone === "ingress" ? "Ingress" : tone === "station-rx" ? "Station Rx" : "Station Direct";
    return (
        <div style={ROW}>
            <span style={pill}>{kindLabel}</span>
            <span style={PLANET_LABEL}>{label}</span>
            <span style={META}>{dateLabel}</span>
        </div>
    );
}

function BigAspectRow({ item }: { item: SkyAspect }) {
    const tone = item.type === "trine" || item.type === "sextile"
        ? PILL_FAVOURABLE
        : item.type === "square" || item.type === "opposition"
            ? PILL_FLAGGED
            : PILL_NEUTRAL;
    return (
        <div style={ROW}>
            <span style={PLANET_LABEL}>{cap(item.p1)}</span>
            <span style={tone}>{fmtAspectSymbol(item.type)} {item.type}</span>
            <span style={PLANET_LABEL}>{cap(item.p2)}</span>
            <span style={META}>orb {item.orb.toFixed(1)}°</span>
        </div>
    );
}

function NodeMaleficRow({ item }: { item: SkyNodeAspect }) {
    return (
        <div style={ROW}>
            <span style={PLANET_LABEL}>{cap(item.planet)}</span>
            <span style={PILL_FLAGGED}>{fmtAspectSymbol(item.type)} {item.type}</span>
            <span style={META}>{item.node === "north" ? "North Node" : "South Node"}</span>
            <span style={META}>orb {item.orb.toFixed(1)}°</span>
        </div>
    );
}

function RawSkyDetails({ sky }: { sky: UniversalSkyState }) {
    const upcoming = [
        ...sky.stations.map((s) => ({ kind: "station" as const, station: s, sortDate: s.dateISO })),
        ...sky.ingresses.map((i) => ({ kind: "ingress" as const, ingress: i, sortDate: i.dateISO })),
    ].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    const hasRx = sky.retrogrades.length > 0;
    const hasUpcoming = upcoming.length > 0;
    const hasBigAspects = sky.aspects.length > 0;
    const maleficNodeAspects = sky.nodeAspects.filter((n) => n.isMalefic);
    const inAnyEclipseWindow = sky.eclipses.inSolarWindow || sky.eclipses.inLunarWindow;

    return (
        <div style={{ marginTop: "var(--space-md)" }}>
            {hasRx && (
                <div style={{ marginTop: "var(--space-md)" }}>
                    <p style={KICKER}>Retrograde now</p>
                    {sky.retrogrades.map((r) => <RetrogradeRow key={r.planet} item={r} />)}
                </div>
            )}
            {hasUpcoming && (
                <div style={{ marginTop: "var(--space-lg)" }}>
                    <p style={KICKER}>Coming up (next 30 days)</p>
                    {upcoming.map((u, i) => {
                        if (u.kind === "station") {
                            const s = (u as { kind: "station"; station: SkyStation }).station;
                            return (
                                <UpcomingRow
                                    key={`s-${s.planet}-${s.dateISO}-${i}`}
                                    label={`${cap(s.planet)} in ${s.sign}`}
                                    dateLabel={fmtDate(s.dateISO)}
                                    tone={s.direction === "retrograde" ? "station-rx" : "station-direct"}
                                />
                            );
                        }
                        const ing = (u as { kind: "ingress"; ingress: SkyIngress }).ingress;
                        return (
                            <UpcomingRow
                                key={`i-${ing.planet}-${ing.dateISO}-${i}`}
                                label={`${cap(ing.planet)} → ${ing.toSign}`}
                                dateLabel={fmtDate(ing.dateISO)}
                                tone="ingress"
                            />
                        );
                    })}
                </div>
            )}
            {hasBigAspects && (
                <div style={{ marginTop: "var(--space-lg)" }}>
                    <p style={KICKER}>Big sky aspects</p>
                    {sky.aspects.map((a, i) => <BigAspectRow key={`${a.p1}-${a.p2}-${i}`} item={a} />)}
                </div>
            )}
            <div style={{ marginTop: "var(--space-lg)" }}>
                <p style={KICKER}>Lunar nodes</p>
                <p style={BODY}>
                    North Node in <strong>{sky.nodes.trueNodeSign}</strong> · South Node in{" "}
                    <strong>{sky.nodes.southNodeSign}</strong>.
                </p>
                {maleficNodeAspects.length > 0 && (
                    <div>
                        <p style={{ ...BODY_MUTED, marginTop: "0.5rem" }}>
                            Malefic hard aspects to the nodal axis:
                        </p>
                        {maleficNodeAspects.map((n, i) => (
                            <NodeMaleficRow key={`${n.planet}-${n.type}-${i}`} item={n} />
                        ))}
                    </div>
                )}
            </div>
            {inAnyEclipseWindow && (
                <div style={{ marginTop: "var(--space-lg)" }}>
                    <p style={KICKER}>Eclipse window</p>
                    <div style={ROW}>
                        <span style={PILL_FLAGGED}>Active</span>
                        <span style={META}>
                            {sky.eclipses.inSolarWindow && "Solar"}
                            {sky.eclipses.inSolarWindow && sky.eclipses.inLunarWindow && " · "}
                            {sky.eclipses.inLunarWindow && "Lunar"}
                        </span>
                    </div>
                    {sky.eclipses.nextEvents.length > 0 && (
                        <p style={{ ...BODY_MUTED, marginTop: "0.5rem" }}>
                            Next:{" "}
                            {sky.eclipses.nextEvents
                                .map((e) => `${cap(e.kind)} eclipse in ${e.sign} (${fmtDate(e.dateISO)})`)
                                .join(" · ")}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main section — verdict + KPI cards (with raw details collapsed) ──────

export default function UniversalSkySection({
    sky,
    sectionIndex = "03",
    goalIds = [],
    travelStartISO,
    travelEndISO,
}: Props) {
    // Default trip window: refDate → refDate + 7d (a typical trip).
    // For relocations, callers should pass travelEndISO = travelStartISO + 365d.
    const startISO = travelStartISO ?? sky.refDateISO;
    const endISO = travelEndISO ?? new Date(
        new Date(`${startISO}T00:00:00Z`).getTime() + 7 * 86_400_000,
    ).toISOString().slice(0, 10);

    const events = rankSkyEvents({
        sky,
        travelStartISO: startISO,
        travelEndISO: endISO,
        maxCards: 4,
    });
    const verdict = deriveSkyVerdict(events);
    const primaryGoalId = goalIds[0];
    const verdictLead = templateForVerdictLead(events, primaryGoalId);

    return (
        <>
            <SectionHead
                index={sectionIndex}
                title="Sky weather (everyone feels this)"
                flush
            />

            <h3 style={VERDICT_HEADLINE}>{verdict.headline}</h3>
            <p style={VERDICT_LEAD}>{verdictLead}</p>

            {events.length > 0 && (
                <div style={KPI_GRID}>
                    {events.map((event) => {
                        const card = templateForKpiCard(event, primaryGoalId);
                        return <SkyKpiCard key={event.key} event={event} card={card} />;
                    })}
                </div>
            )}

            <details style={{ margin: "var(--space-md) 0" }}>
                <summary style={RAW_DETAILS_SUMMARY}>
                    Show all sky details ▾
                </summary>
                <RawSkyDetails sky={sky} />
            </details>

            <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />
        </>
    );
}
