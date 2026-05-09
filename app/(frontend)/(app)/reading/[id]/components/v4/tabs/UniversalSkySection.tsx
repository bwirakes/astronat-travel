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
import SectionHead from "../../shared/SectionHead";

interface Props {
    sky: UniversalSkyState;
    /** §-index to render in the header. Defaults to "03" — caller can pass
     *  a different value if PlaceFieldTab renumbers later. */
    sectionIndex?: string;
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
    border: "1px solid var(--surface-border)",
    borderRadius: "999px",
    padding: "0.1rem 0.5rem",
    fontWeight: 700,
};

// Pill variants by tone — neutral / flagged / favourable.
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

// ── Helpers ───────────────────────────────────────────────────────────────

function cap(s: string): string {
    if (!s) return "";
    return s[0].toUpperCase() + s.slice(1);
}

function isDignityFlagged(dignity: string): boolean {
    return dignity === "detriment" || dignity === "fall";
}

function isDignityFavourable(dignity: string): boolean {
    return dignity === "domicile" || dignity === "exalted";
}

function fmtAspectSymbol(type: string): string {
    switch (type) {
        case "conjunction": return "☌";
        case "sextile":     return "✶";
        case "square":      return "□";
        case "trine":       return "△";
        case "opposition":  return "☍";
        default:            return "•";
    }
}

function fmtIngressDate(iso: string): string {
    const d = new Date(`${iso}T12:00:00Z`);
    if (!isFinite(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────────────────

function RetrogradeRow({ item }: { item: SkyRetrograde }) {
    const flagged = isDignityFlagged(item.dignity);
    const favourable = isDignityFavourable(item.dignity);
    const dignityStyle = flagged
        ? PILL_FLAGGED
        : favourable
            ? PILL_FAVOURABLE
            : PILL_NEUTRAL;
    return (
        <div style={ROW}>
            <span style={PLANET_LABEL}>{cap(item.planet)}</span>
            <span style={META}>℞ in {item.sign}</span>
            <span style={dignityStyle}>{item.dignity}</span>
            <span style={{ ...PILL_NEUTRAL }}>
                {item.element} · {item.modality}
            </span>
        </div>
    );
}

function UpcomingRow({ label, dateLabel, tone }: { label: string; dateLabel: string; tone: "ingress" | "station-rx" | "station-direct" }) {
    const pill = tone === "station-rx"
        ? PILL_FLAGGED
        : tone === "station-direct"
            ? PILL_FAVOURABLE
            : PILL_NEUTRAL;
    const kindLabel = tone === "ingress"
        ? "Ingress"
        : tone === "station-rx"
            ? "Station Rx"
            : "Station Direct";
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

// ── Main section ──────────────────────────────────────────────────────────

export default function UniversalSkySection({ sky, sectionIndex = "03" }: Props) {
    const hasRx = sky.retrogrades.length > 0;
    const upcoming = [
        ...sky.stations.map(s => ({
            kind: "station" as const,
            station: s,
            sortDate: s.dateISO,
        })),
        ...sky.ingresses.map(i => ({
            kind: "ingress" as const,
            ingress: i,
            sortDate: i.dateISO,
        })),
    ].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    const hasUpcoming = upcoming.length > 0;
    const hasBigAspects = sky.aspects.length > 0;
    const maleficNodeAspects = sky.nodeAspects.filter(n => n.isMalefic);
    const hasNodeMalefics = maleficNodeAspects.length > 0;
    const inAnyEclipseWindow = sky.eclipses.inSolarWindow || sky.eclipses.inLunarWindow;

    // If literally nothing is happening (very rare), still render the heading
    // and a one-line acknowledgement so the place-field tab doesn't have a
    // mysterious gap between §02 and §04.
    const allEmpty = !hasRx && !hasUpcoming && !hasBigAspects && !hasNodeMalefics && !inAnyEclipseWindow;

    return (
        <>
            <SectionHead
                index={sectionIndex}
                title="Sky weather right now (everyone feels this)"
                flush
            />
            <p style={{ ...BODY, fontSize: "1.05rem", margin: "0 0 var(--space-md) 0" }}>
                What the sky is doing for everyone — independent of where you are or where
                you're traveling. These conditions tint the readings of every chart
                today, including yours.
            </p>

            {allEmpty && (
                <p style={BODY_MUTED}>
                    The sky is unusually quiet right now — no major retrograde, ingress,
                    or eclipse window is active.
                </p>
            )}

            {hasRx && (
                <div style={{ marginTop: "var(--space-md)" }}>
                    <p style={KICKER}>Retrograde now</p>
                    {sky.retrogrades.map(r => (
                        <RetrogradeRow key={r.planet} item={r} />
                    ))}
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
                                    dateLabel={fmtIngressDate(s.dateISO)}
                                    tone={s.direction === "retrograde" ? "station-rx" : "station-direct"}
                                />
                            );
                        }
                        const ing = (u as { kind: "ingress"; ingress: SkyIngress }).ingress;
                        return (
                            <UpcomingRow
                                key={`i-${ing.planet}-${ing.dateISO}-${i}`}
                                label={`${cap(ing.planet)} → ${ing.toSign}`}
                                dateLabel={fmtIngressDate(ing.dateISO)}
                                tone="ingress"
                            />
                        );
                    })}
                </div>
            )}

            {hasBigAspects && (
                <div style={{ marginTop: "var(--space-lg)" }}>
                    <p style={KICKER}>Big sky aspects</p>
                    {sky.aspects.map((a, i) => (
                        <BigAspectRow key={`${a.p1}-${a.p2}-${i}`} item={a} />
                    ))}
                </div>
            )}

            <div style={{ marginTop: "var(--space-lg)" }}>
                <p style={KICKER}>Lunar nodes</p>
                <p style={BODY}>
                    North Node in <strong>{sky.nodes.trueNodeSign}</strong> · South Node
                    in <strong>{sky.nodes.southNodeSign}</strong>.
                </p>
                {hasNodeMalefics && (
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
                            Next: {sky.eclipses.nextEvents
                                .map(e => `${cap(e.kind)} eclipse in ${e.sign} (${fmtIngressDate(e.dateISO)})`)
                                .join(" · ")}
                        </p>
                    )}
                </div>
            )}

            <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />
        </>
    );
}
