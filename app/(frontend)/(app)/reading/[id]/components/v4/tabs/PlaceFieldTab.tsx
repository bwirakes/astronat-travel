"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import ActiveTransitsCard from "@/app/components/ActiveTransitsCard";
import HouseMatrixCard from "@/app/components/HouseMatrixCard";
import NatalWithGeodeticOverlay from "@/app/components/NatalWithGeodeticOverlay";
import ReadingGeodeticMap from "../parts/ReadingGeodeticMap";
import { acgLineRawScore, type HouseMatrixResult } from "@/app/lib/house-matrix";
import { geodeticASCLongitude, geodeticMCLongitude, signFromLongitude } from "@/app/lib/geodetic";
import type { PersonalGeodeticHit } from "@/app/lib/reading-tabs";
import type { V4EclipseHit, V4GeoTransit, V4ProgressedBand } from "@/app/lib/reading-viewmodel";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    birthIso: string | undefined;
    reading: any;
    relocatedAcgLines: any[];
    natalForMap?: unknown;
}

type Anchor = "ASC" | "IC" | "DSC" | "MC";

const ANGLE_FULL: Record<Anchor, string> = {
    ASC: "Ascendant",
    IC:  "Nadir",
    DSC: "Descendant",
    MC:  "Midheaven",
};

const ANGLE_TOPIC: Record<Anchor, string> = {
    ASC: "self",
    IC:  "home",
    DSC: "partners",
    MC:  "career",
};

const ANGLE_DESC: Record<Anchor, string> = {
    ASC: "The face you show the world here.",
    IC:  "Roots, home, and where you anchor.",
    DSC: "Who you attract and reflect here.",
    MC:  "How your work and authority land.",
};

const FRAMEWORK_STEPS: Array<[string, string]> = [
    ["Establish your base chart",       "Natal chart — date, time, place must be accurate."],
    ["Calculate the geodetic frame",    "Derive geodetic MC (from longitude) and ASC (from longitude + latitude) for the destination."],
    ["Map natal planets to geodetic degrees", "Convert each natal planet's position to a geographic longitude on the world map."],
    ["Identify active zones",           "Find where current transit / eclipse / lunation degrees land using the geodetic formula."],
    ["Layer temporal techniques",       "Apply transits, progressions, and Solar Arc directions to the geodetic frame for precise timing."],
    ["Interpret the houses",            "Read the geodetic house themes for the target — what life domains are activated?"],
];

// Shared text style constants — mirrors /chart
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

export default function PlaceFieldTab({ vm, birthIso, reading, relocatedAcgLines }: Props) {
    const { lat, lon, city } = vm.location;
    const geoMC  = geodeticMCLongitude(lon);
    const geoASC = geodeticASCLongitude(lon, lat);

    const angleLons: Record<Anchor, number> = {
        ASC: geoASC,
        MC:  geoMC,
        DSC: (geoASC + 180) % 360,
        IC:  (geoMC  + 180) % 360,
    };

    const hits = vm.scoreNarrative.geodetic.personal;

    // Tightest hit per anchor (for corner grid)
    const tightestPerAnchor = new Map<Anchor, PersonalGeodeticHit>();
    for (const row of hits) {
        for (const hit of row.hits) {
            const cur = tightestPerAnchor.get(row.anchor);
            if (!cur || hit.orbDeg < cur.orbDeg) tightestPerAnchor.set(row.anchor, hit);
        }
    }

    // All flat hits (for the contact table)
    const flatHits = hits.flatMap((row) => row.hits.map((hit) => ({ row, hit })));
    const hitNotes = extractGeodeticHitNotes(reading);

    // Wheel data
    const natalPlanetsForWheel = (reading?.natalPlanets ?? []).map((p: any) => ({
        planet:    String(p.name ?? p.planet ?? ""),
        longitude: typeof p.longitude === "number" ? p.longitude : 0,
        sign:      p.sign,
        house:     typeof p.house === "number" ? p.house : undefined,
    }));
    const cusps = Array.isArray(reading?.relocatedCusps) && reading.relocatedCusps.length === 12
        ? reading.relocatedCusps
        : new Array(12).fill(0).map((_, i) => i * 30);

    const verdict = vm.chrome.step4GeodeticBridge || buildFallbackVerdict(city, hits);

    const summary = deriveSummary({
        hits,
        activeTransits:  vm.geodetic?.activeTransits ?? [],
        eclipses:        vm.eclipses?.hits ?? [],
        progressedBands: vm.progressions?.bands ?? [],
    });

    const activeTransitRows = buildActiveTransitRows(
        vm.geodetic?.activeTransits ?? [],
        reading?.transitWindows ?? [],
    );

    const matrix: HouseMatrixResult | null =
        reading?.houses && Array.isArray(reading.houses) && reading.houses.length > 0
            ? {
                houses:      reading.houses,
                macroScore:  reading.macroScore ?? 0,
                macroVerdict: reading.macroVerdict ?? "Neutral",
                houseSystem: reading.houseSystem ?? "placidus",
                ...(reading.lotOfFortune ? { lotOfFortune: reading.lotOfFortune } : {}),
                ...(reading.lotOfSpirit  ? { lotOfSpirit:  reading.lotOfSpirit  } : {}),
            }
            : null;

    const hasTemporalLayer =
        activeTransitRows.length > 0 ||
        (vm.eclipses?.hits.length ?? 0) > 0 ||
        !!vm.progressions;

    // 4-corner summary rows
    const cornerRows = (["ASC", "IC", "DSC", "MC"] as const).map((anchor) => {
        const lonAngle = angleLons[anchor];
        const sign = signFromLongitude(lonAngle);
        const deg  = Math.floor(((lonAngle % 30) + 30) % 30);
        const hit  = tightestPerAnchor.get(anchor);
        return { anchor, sign, deg, hit };
    });

    return (
        <div style={{ paddingTop: "var(--space-2xl)", paddingBottom: "var(--space-3xl)" }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
                <h1 style={{
                    fontFamily:    "var(--font-primary)",
                    fontSize:      "clamp(2rem, 4vw, 3.5rem)",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    margin:        "0 0 0.75rem 0",
                    lineHeight:    1.1,
                    color:         "var(--text-primary)",
                }}>
                    {city.toUpperCase()} · Geodetic Field
                </h1>
                <div style={{
                    fontFamily:  "var(--font-mono)",
                    fontSize:    "0.7rem",
                    color:       "var(--text-tertiary)",
                    display:     "flex",
                    gap:         "1.25rem",
                    flexWrap:    "wrap",
                    opacity:     0.8,
                }}>
                    <span>{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
                    <span>{vm.travelDateISO ? vm.travelDateISO.slice(0, 10) : "any time"}</span>
                    <span>{summary.highlights.length} lifts · {summary.lowlights.length} presses</span>
                </div>
            </div>

            {/* Verdict */}
            {verdict && (
                <p style={{
                    fontFamily:  "var(--font-body)",
                    fontSize:    "1.05rem",
                    lineHeight:  1.65,
                    color:       "var(--text-secondary)",
                    margin:      "0 0 var(--space-lg) 0",
                    fontStyle:   "italic",
                    fontWeight:  300,
                    maxWidth:    "680px",
                }}>
                    {verdict}
                </p>
            )}

            <div style={{ ...DIVIDER, marginBottom: "var(--space-lg)" }} />

            {/* ── Overview grid — corners left, wheel right ─────────────── */}
            <div className="chart-overview-grid" style={{ marginBottom: "var(--space-xl)" }}>

                {/* LEFT — four corners at a glance */}
                <div>
                    <div style={KICKER}>Four corners of this city</div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {cornerRows.map(({ anchor, sign, deg, hit }) => (
                            <div key={anchor} style={{ borderBottom: "1px solid var(--surface-border)", padding: "0.85rem 0" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                                    <span style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize:   "0.6rem",
                                        letterSpacing: "0.14em",
                                        color:      "var(--text-tertiary)",
                                        textTransform: "uppercase",
                                        minWidth:   "2.8rem",
                                    }}>
                                        {anchor}
                                    </span>
                                    <span style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize:   "0.85rem",
                                        fontWeight: 600,
                                        color:      "var(--text-primary)",
                                    }}>
                                        {sign} {deg}°
                                    </span>
                                    {hit && (
                                        <span style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize:   "0.62rem",
                                            color:      familyAccent(hit.family),
                                            letterSpacing: "0.08em",
                                        }}>
                                            {capitalize(hit.planet)} · {hit.orbDeg}° {hit.closeness === "very close" ? "tight" : "close"}
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize:   "0.82rem",
                                    color:      "var(--text-tertiary)",
                                    marginTop:  "0.2rem",
                                    paddingLeft: "3.55rem",
                                }}>
                                    {ANGLE_DESC[anchor]}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p style={{
                        fontFamily: "var(--font-body)",
                        fontSize:   "0.82rem",
                        lineHeight: 1.55,
                        color:      "var(--text-tertiary)",
                        margin:     "var(--space-md) 0 0 0",
                        fontStyle:  "italic",
                    }}>
                        Every place has four directions in its sky — rising, overhead, setting,
                        underneath. When a natal planet sits within 5° of one, that corner is
                        activated for you.
                    </p>
                </div>

                {/* RIGHT — wheel, sticky */}
                <div style={{ position: "sticky", top: "var(--space-md)" }}>
                    <div style={KICKER}>Natal Geometry · Geodetic Overlay</div>
                    <div style={{ width: "100%", maxWidth: "520px", margin: "0 auto", position: "relative" }}>
                        <NatalWithGeodeticOverlay
                            isDark
                            planets={natalPlanetsForWheel}
                            cusps={cusps}
                            geoMC={geoMC}
                            geoASC={geoASC}
                        />
                    </div>
                    <CornerKey />
                </div>
            </div>

            {/* ── Contact table — full-width ────────────────────────────── */}
            {flatHits.length > 0 && (
                <div style={{ marginBottom: "var(--space-xl)" }}>
                    <div style={{
                        ...KICKER,
                        paddingBottom: "0.75rem",
                        borderBottom:  "1px solid var(--surface-border)",
                    }}>
                        Planetary contacts · {flatHits.length} within 5°
                    </div>
                    <ContactTable rows={flatHits} notes={hitNotes} />
                </div>
            )}

            {/* ── Geodetic map ─────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--space-xl)" }}>
                <div style={KICKER}>Geodetic position</div>
                <ReadingGeodeticMap lat={lat} lon={lon} city={city} />
                <p style={{
                    fontFamily: "var(--font-body)",
                    fontSize:   "0.82rem",
                    lineHeight: 1.5,
                    color:      "var(--text-tertiary)",
                    margin:     "0.75rem 0 0 0",
                    fontStyle:  "italic",
                }}>
                    The dashed red line is {city}&rsquo;s Midheaven meridian. Gold curves are
                    Ascendant boundaries. The shaded block is the rising-zone this city falls into.
                </p>
            </div>

            <div style={{ ...DIVIDER, marginBottom: "var(--space-lg)" }} />

            {/* ── Drill-downs ───────────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                {matrix && (
                    <DetailsBlock title="Life areas, ranked">
                        <HouseMatrixCard matrix={matrix} />
                    </DetailsBlock>
                )}

                {hasTemporalLayer && (
                    <DetailsBlock title="What&rsquo;s live right now">
                        {(vm.eclipses?.hits ?? []).length > 0 && (
                            <div style={{ marginBottom: "var(--space-md)", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {(vm.eclipses?.hits ?? []).map((e, i) => (
                                    <EclipseChip key={`ec-${i}`} hit={e} />
                                ))}
                            </div>
                        )}
                        {activeTransitRows.length > 0 && (
                            <ActiveTransitsCard transits={activeTransitRows} travelDate={vm.travelDateISO ?? ""} />
                        )}
                        {vm.progressions && (
                            <ProgressionLine bands={vm.progressions.bands} />
                        )}
                    </DetailsBlock>
                )}

                <DetailsBlock title="The method">
                    <ol style={{
                        margin:      0,
                        paddingLeft: "1.25rem",
                        display:     "flex",
                        flexDirection: "column",
                        gap:         "0.75rem",
                        fontFamily:  "var(--font-body)",
                        fontSize:    "0.9rem",
                        lineHeight:  1.6,
                        color:       "var(--text-secondary)",
                        maxWidth:    "680px",
                    }}>
                        {FRAMEWORK_STEPS.map(([title, body], i) => (
                            <li key={`step-${i}`}>
                                <strong style={{ color: "var(--text-primary)" }}>{title}.</strong>{" "}
                                {body}
                            </li>
                        ))}
                    </ol>
                    {vm.chrome.step4GeodeticMethod && (
                        <p style={{
                            fontFamily: "var(--font-body)",
                            fontSize:   "0.85rem",
                            lineHeight: 1.6,
                            color:      "var(--text-tertiary)",
                            fontStyle:  "italic",
                            margin:     "var(--space-md) 0 0 0",
                            maxWidth:   "680px",
                        }}>
                            {vm.chrome.step4GeodeticMethod}
                        </p>
                    )}
                    <p style={{
                        fontFamily:    "var(--font-mono)",
                        fontSize:      "0.6rem",
                        letterSpacing: "0.08em",
                        color:         "var(--text-tertiary)",
                        margin:        "var(--space-md) 0 var(--space-lg) 0",
                    }}>
                        Birth: {birthIso?.slice(0, 10) ?? "—"} · Destination: {city} ({lat.toFixed(2)}°, {lon.toFixed(2)}°)
                    </p>
                    <div style={{ borderTop: "1px solid var(--surface-border)", paddingTop: "var(--space-md)" }}>
                        <div style={{ ...KICKER, marginBottom: "var(--space-sm)" }}>Astrocartography lines (reference)</div>
                        <AcgLinesCard
                            planetLines={relocatedAcgLines.map((l: any) => {
                                const angleStr = String(l.angle ?? l.line ?? "");
                                const km = typeof l.distance_km === "number"
                                    ? l.distance_km
                                    : Number(String(l.distance ?? "").match(/\d+/)?.[0] ?? 0);
                                return {
                                    planet:       String(l.planet ?? ""),
                                    angle:        angleStr,
                                    distance_km:  km,
                                    orb:          typeof l.orb === "number" ? l.orb : undefined,
                                    is_paran:     !!l.is_paran,
                                    contribution: acgLineRawScore({
                                        planet:      String(l.planet ?? ""),
                                        angle:       angleStr.toUpperCase(),
                                        distance_km: km,
                                    }),
                                };
                            })}
                            natalPlanets={(reading?.natalPlanets || []).map((p: any) => ({
                                planet:     String(p.name ?? p.planet ?? ""),
                                sign:       String(p.sign ?? ""),
                                degree:     typeof p.longitude === "number" ? Math.floor(p.longitude % 30) : 0,
                                longitude:  typeof p.longitude === "number" ? p.longitude : 0,
                                retrograde: !!p.retrograde,
                                house:      typeof p.house === "number" ? p.house : 0,
                                dignity:    p.dignity,
                            }))}
                            birthCity={reading?.birth?.city || "—"}
                            destination={vm.location.city}
                        />
                    </div>
                </DetailsBlock>
            </div>
        </div>
    );
}

// ── Contact table ─────────────────────────────────────────────────────────

function ContactTable({
    rows, notes,
}: {
    rows: { row: { anchor: Anchor }; hit: PersonalGeodeticHit }[];
    notes: Map<string, string>;
}) {
    const [open, setOpen] = useState<string | null>(null);

    return (
        <div>
            {rows.map(({ row, hit }, i) => {
                const id  = `${hit.planet}-${row.anchor}`;
                const isOpen = open === id;
                const accent = familyAccent(hit.family);
                const note = notes.get(`${hit.planet.toLowerCase()}-${row.anchor}`)
                    || fallbackHitNote(hit, ANGLE_TOPIC[row.anchor]);

                return (
                    <div key={id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                        <button
                            onClick={() => setOpen(isOpen ? null : id)}
                            style={{
                                width:      "100%",
                                display:    "flex",
                                alignItems: "center",
                                gap:        "1rem",
                                padding:    "1.25rem 0",
                                background: "transparent",
                                border:     "none",
                                cursor:     "pointer",
                                textAlign:  "left",
                                color:      "var(--text-primary)",
                            }}
                        >
                            <span style={{
                                fontFamily:    "var(--font-mono)",
                                fontSize:      "0.7rem",
                                color:         "var(--text-tertiary)",
                                minWidth:      "2rem",
                                fontVariantNumeric: "tabular-nums",
                            }}>
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize:   "0.9rem",
                                    fontWeight: 600,
                                    color:      "var(--text-primary)",
                                }}>
                                    {capitalize(hit.planet)}
                                </span>
                            </div>
                            <div style={{
                                fontFamily: "var(--font-mono)",
                                fontSize:   "0.75rem",
                                color:      "var(--text-tertiary)",
                                textAlign:  "right",
                                display:    "flex",
                                gap:        "0.5rem",
                                alignItems: "center",
                            }}>
                                <span style={{ color: accent }}>{row.anchor}</span>
                                <span style={{ opacity: 0.3 }}>·</span>
                                <span>{hit.orbDeg}°</span>
                                <span style={{ opacity: 0.3 }}>·</span>
                                <span>{hit.closeness}</span>
                            </div>
                            <span style={{
                                fontFamily: "var(--font-mono)",
                                fontSize:   "0.7rem",
                                color:      "var(--text-tertiary)",
                                marginLeft: "0.5rem",
                                transition: "transform 0.2s",
                                display:    "inline-block",
                                transform:  isOpen ? "rotate(180deg)" : "none",
                            }}>
                                ▾
                            </span>
                        </button>

                        {isOpen && (
                            <div style={{ padding: "0 0 1.75rem 3rem", maxWidth: "720px" }}>
                                <p style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize:   "1rem",
                                    lineHeight: 1.6,
                                    color:      "var(--text-primary)",
                                    margin:     "0 0 0.5rem 0",
                                }}>
                                    {note}
                                </p>
                                <div style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize:   "0.82rem",
                                    lineHeight: 1.5,
                                    color:      "var(--text-tertiary)",
                                    fontStyle:  "italic",
                                }}>
                                    {ANGLE_FULL[row.anchor]} — {ANGLE_DESC[row.anchor]}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── CornerKey ─────────────────────────────────────────────────────────────

function CornerKey() {
    return (
        <div style={{
            display:       "flex",
            flexWrap:      "wrap",
            gap:           "0.75rem 1.5rem",
            marginTop:     "1rem",
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.55rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color:         "var(--text-tertiary)",
        }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ display: "inline-block", width: 14, height: 2, background: "var(--gold)" }} />
                Primary (ASC, MC)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ display: "inline-block", width: 14, height: 2, background: "var(--text-secondary)", opacity: 0.4 }} />
                Secondary (DSC, IC)
            </span>
        </div>
    );
}

// ── DetailsBlock ──────────────────────────────────────────────────────────

function DetailsBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <details style={{
            background:   "var(--surface)",
            border:       "1px solid var(--surface-border)",
            borderRadius: "var(--radius-md)",
        }}>
            <summary style={{
                padding:       "1.1rem 1.25rem",
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color:         "var(--text-secondary)",
                cursor:        "pointer",
                display:       "flex",
                alignItems:    "center",
                gap:           "0.75rem",
                listStyle:     "none",
            }}>
                <span style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>+</span>
                {title}
            </summary>
            <div style={{ padding: "0 1.25rem 1.25rem" }}>
                {children}
            </div>
        </details>
    );
}

// ── EclipseChip ───────────────────────────────────────────────────────────

function EclipseChip({ hit }: { hit: V4EclipseHit }) {
    return (
        <div style={{
            display:      "inline-flex",
            alignItems:   "baseline",
            gap:          "0.5rem",
            padding:      "0.35rem 0.85rem",
            border:       "1px solid var(--color-spiced-life)",
            borderRadius: "var(--radius-sm)",
            background:   "color-mix(in oklab, var(--color-spiced-life) 8%, transparent)",
            fontFamily:   "var(--font-mono)",
            fontSize:     "0.65rem",
        }}>
            <span style={{ color: "var(--color-spiced-life)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {hit.kind === "solar" ? "Solar" : "Lunar"} eclipse
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
                {hit.dateUtc.slice(0, 10)} · {hit.sign} {hit.degree.toFixed(0)}° on {hit.activatedAngle} · hits your {capitalize(hit.natalContact)}
            </span>
        </div>
    );
}

// ── ProgressionLine ───────────────────────────────────────────────────────

function ProgressionLine({ bands }: { bands: V4ProgressedBand[] }) {
    const inBand = bands.find((b) => b.destinationInBand);
    if (!inBand) return null;
    return (
        <p style={{
            fontFamily: "var(--font-body)",
            fontSize:   "0.9rem",
            lineHeight: 1.6,
            color:      "var(--text-secondary)",
            margin:     "var(--space-sm) 0 0 0",
        }}>
            <strong style={{ color: "var(--text-primary)" }}>Progressed {inBand.planet}</strong>
            {" is in "}<em>{inBand.sign}</em>
            {" — this longitude band ("}{inBand.longitudeRange}{") is currently activated for you."}
        </p>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────

interface SummaryRow { glyph: string; kicker: string; impact: string; targetId: string; }

function deriveSummary(args: {
    hits: { anchor: Anchor; hits: PersonalGeodeticHit[] }[];
    activeTransits: V4GeoTransit[];
    eclipses: V4EclipseHit[];
    progressedBands: V4ProgressedBand[];
}): { highlights: SummaryRow[]; lowlights: SummaryRow[] } {
    const highlights: SummaryRow[] = [];
    const lowlights:  SummaryRow[] = [];

    for (const row of args.hits) {
        for (const hit of row.hits) {
            const r: SummaryRow = {
                glyph:    planetGlyph(hit.planet),
                kicker:   row.anchor,
                impact:   `${capitalize(hit.planet)} ${impactVerb(hit.family)} your ${ANGLE_TOPIC[row.anchor]} corner.`,
                targetId: `contact-${hit.planet.toLowerCase()}-${row.anchor.toLowerCase()}`,
            };
            if (hit.family === "rough")  lowlights.push(r);
            else if (hit.family === "gentle" || hit.family === "bright") highlights.push(r);
        }
    }
    for (const t of args.activeTransits) {
        const r: SummaryRow = {
            glyph:    planetGlyph(t.planet),
            kicker:   t.angle,
            impact:   `Live ${capitalize(t.planet)} on the ${t.angle} corner.`,
            targetId: "geodetic-contacts",
        };
        if (t.severity > 0) highlights.push(r);
        else if (t.severity < 0) lowlights.push(r);
    }
    for (const e of args.eclipses) {
        lowlights.push({ glyph: "🌒", kicker: e.activatedAngle, impact: `Eclipse on ${e.activatedAngle}`, targetId: "geodetic-contacts" });
    }
    const progSun = args.progressedBands.find((b) => b.planet === "Sun" && b.destinationInBand);
    if (progSun) highlights.push({ glyph: "→", kicker: "PROG", impact: `Progressed Sun in ${progSun.sign}.`, targetId: "geodetic-contacts" });

    return { highlights, lowlights };
}

function buildFallbackVerdict(city: string, hits: { anchor: Anchor; hits: PersonalGeodeticHit[] }[]): string {
    const tightest = hits
        .flatMap((r) => r.hits.map((h) => ({ anchor: r.anchor, hit: h })))
        .sort((a, b) => a.hit.orbDeg - b.hit.orbDeg)[0] ?? null;
    if (!tightest) return `${city} doesn't strongly activate any corner of your chart — a quiet, neutral place.`;
    return `${city} ${impactVerb(tightest.hit.family)} your ${ANGLE_TOPIC[tightest.anchor]} corner via ${capitalize(tightest.hit.planet)} (${tightest.hit.orbDeg}° from the ${tightest.anchor}).`;
}

function buildActiveTransitRows(activeGeo: V4GeoTransit[], natalTransits: any[]) {
    const out: Array<{ planets: string; type: string; aspect: string; system?: string; orb?: number }> = [];
    for (const t of activeGeo) {
        out.push({
            planets: `${capitalize(t.planet)} - ${t.angle}`,
            type:    `on geo-${t.angle}${t.personalActivation && t.natalContact ? ` · hits ${capitalize(t.natalContact)}` : ""}`,
            aspect:  "conjunction",
            system:  "geodetic",
            orb:     Math.round(t.orb * 10) / 10,
        });
    }
    for (const nt of (natalTransits ?? []).slice(0, 5)) {
        const tName  = String(nt.transit_planet ?? nt.transitPlanet ?? "").trim();
        const nName  = String(nt.natal_planet ?? nt.natalPlanet ?? "").trim();
        const aspect = String(nt.aspect ?? "").toLowerCase();
        if (!tName || !nName || !aspect) continue;
        out.push({
            planets: `${capitalize(tName)} - ${capitalize(nName)}`,
            type:    aspect,
            aspect,
            system:  "natal",
            orb:     typeof nt.orb === "number" ? Math.round(nt.orb * 10) / 10 : undefined,
        });
    }
    return out;
}

function familyAccent(family: PersonalGeodeticHit["family"]): string {
    switch (family) {
        case "gentle": return "var(--sage)";
        case "rough":  return "var(--color-spiced-life)";
        case "bright": return "var(--gold)";
        default:       return "var(--text-tertiary)";
    }
}

function impactVerb(family: PersonalGeodeticHit["family"]): string {
    switch (family) {
        case "gentle": return "warms";
        case "rough":  return "presses";
        case "bright": return "amplifies";
        default:       return "tinges";
    }
}

function planetGlyph(planet: string): string {
    const G: Record<string, string> = {
        sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
        jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
        chiron: "⚷", "true node": "☊", "north node": "☊",
    };
    return G[planet.toLowerCase()] ?? "•";
}

function extractGeodeticHitNotes(reading: any): Map<string, string> {
    const out = new Map<string, string>();
    const raw = reading?.teacherReading?.geodeticHits;
    if (!Array.isArray(raw)) return out;
    for (const entry of raw) {
        if (typeof entry?.hitKey === "string" && typeof entry?.note === "string") {
            out.set(entry.hitKey.toLowerCase(), entry.note);
        }
    }
    return out;
}

function fallbackHitNote(hit: PersonalGeodeticHit, topic: string): string {
    const proximity = hit.closeness === "very close" ? "right on" : "close to";
    const feel =
        hit.family === "gentle" ? "Things here may feel easier and warmer." :
        hit.family === "rough"  ? "Things here may feel harder and more pushy." :
        hit.family === "bright" ? "Things here may stand out more than usual." :
                                  "Things here pick up a mild flavor from this planet.";
    return `${capitalize(hit.planet)} sits ${proximity} your ${topic} corner. ${feel}`;
}

function capitalize(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
