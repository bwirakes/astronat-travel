"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * PlaceFieldTab — "geodetics activate how you feel in a specific place."
 *
 * Structure (top → bottom; progressive disclosure):
 *
 *   0. VerdictCard         — one-sentence read of what this place does to you.
 *   1. Highlights/Lowlights — paired summary cards (the corners that lift / press).
 *   2. Where your chart lights up here — natal wheel + geodetic overlay + per-hit list.
 *   3. What this place is — GeodeticGridCard wired to real angle data.
 *   4. When it intensifies — ActiveTransitsCard with A1 + A4 + A5 layers.
 *   5. Where on Earth this sits — InteractiveGeodeticWorldMap.
 *   6. Life areas activated — HouseMatrixCard.
 *   7. Methodology — collapsed <details> with the 7-step framework.
 *
 * Reuses (no new wheels, no new maps):
 *   - NatalMockupWheel (via NatalWithGeodeticOverlay)
 *   - GeodeticGridCard
 *   - ActiveTransitsCard
 *   - HouseMatrixCard
 *   - InteractiveGeodeticWorldMap
 *   - AcgLinesCard (kept as the planetary-line-by-distance receipt)
 */

import AcgLinesCard from "@/app/components/AcgLinesCard";
import ActiveTransitsCard from "@/app/components/ActiveTransitsCard";
import GeodeticGridCard, { type GeodeticGridAngle } from "@/app/components/GeodeticGridCard";
import HouseMatrixCard from "@/app/components/HouseMatrixCard";
import NatalWithGeodeticOverlay from "@/app/components/NatalWithGeodeticOverlay";
import InteractiveGeodeticWorldMap from "@/app/geodetic/components/InteractiveGeodeticWorldMap";
import { acgLineRawScore, type HouseMatrixResult } from "@/app/lib/house-matrix";
import { geodeticASCLongitude, geodeticMCLongitude, signFromLongitude } from "@/app/lib/geodetic";
import type { PersonalGeodeticHit } from "@/app/lib/reading-tabs";
import type { V4EclipseHit, V4GeoTransit, V4ProgressedBand } from "@/app/lib/reading-viewmodel";
import TabSection from "./TabSection";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    birthIso: string | undefined;
    reading: any;
    relocatedAcgLines: any[];
    /** Accepted for back-compat with existing call sites; the new tab no
     *  longer uses AcgMap, so this is intentionally unused. */
    natalForMap?: unknown;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

const ANGLE_DESC: Record<"ASC" | "IC" | "DSC" | "MC", string> = {
    ASC: "Rising energy. The face you show the world here.",
    IC:  "Roots, home, and where you anchor. The private base.",
    DSC: "Partnerships and reflections. Who you attract here.",
    MC:  "Career, authority, and visibility. How your work lands.",
};

const ANGLE_FULL: Record<"ASC" | "IC" | "DSC" | "MC", string> = {
    ASC: "ASCENDANT",
    IC: "NADIR",
    DSC: "DESCENDANT",
    MC: "MIDHEAVEN",
};

const ANGLE_TOPIC: Record<"ASC" | "IC" | "DSC" | "MC", string> = {
    ASC: "self",
    IC: "home",
    DSC: "partners",
    MC: "career",
};

// 7-step Geodetic 101 mapping framework — verbatim, used in the methodology
// footer so the user can confirm the structure of the tab against the doc.
const FRAMEWORK_STEPS = [
    ["Establish your base chart",       "Natal, national or event chart — date, time, place must be accurate."],
    ["Calculate the geodetic frame",    "Derive geodetic MC (from longitude) and ASC (from longitude + latitude) for the destination."],
    ["Map natal planets to geodetic degrees", "Convert each natal planet's position to a geographic longitude on the world map."],
    ["Identify active zones",           "Find where current transit / eclipse / lunation degrees land using the geodetic formula."],
    ["Apply the rule of three",         "Confirm with national-chart contacts, additional timing layers, and ACG lines before interpreting."],
    ["Layer temporal techniques",       "Apply transits, progressions, and Solar Arc directions to the geodetic frame for precise timing."],
    ["Interpret the houses",            "Read the geodetic house themes for the target — what life domains are activated?"],
];

export default function PlaceFieldTab({ vm, birthIso, reading, relocatedAcgLines }: Props) {
    const { lat, lon, city } = vm.location;
    const geoMC = geodeticMCLongitude(lon);
    const geoASC = geodeticASCLongitude(lon, lat);

    const angleLons: Record<"ASC" | "IC" | "DSC" | "MC", number> = {
        ASC: geoASC,
        MC: geoMC,
        DSC: (geoASC + 180) % 360,
        IC: (geoMC + 180) % 360,
    };

    // Per-anchor hit lookup, used to wire GeodeticGridCard + per-hit list.
    const hits = vm.scoreNarrative.geodetic.personal;
    const tightestPerAnchor = new Map<"ASC" | "IC" | "DSC" | "MC", PersonalGeodeticHit>();
    for (const row of hits) {
        for (const hit of row.hits) {
            const cur = tightestPerAnchor.get(row.anchor);
            if (!cur || hit.orbDeg < cur.orbDeg) tightestPerAnchor.set(row.anchor, hit);
        }
    }
    const flatHits = hits.flatMap((row) => row.hits.map((hit) => ({ row, hit })));

    const hitNotes = extractGeodeticHitNotes(reading);

    const natalPlanetsForWheel = (reading?.natalPlanets ?? []).map((p: any) => ({
        planet: String(p.name ?? p.planet ?? ""),
        longitude: typeof p.longitude === "number" ? p.longitude : 0,
        sign: p.sign,
        house: typeof p.house === "number" ? p.house : undefined,
    }));
    const cusps = Array.isArray(reading?.relocatedCusps) && reading.relocatedCusps.length === 12
        ? reading.relocatedCusps
        : new Array(12).fill(0).map((_, i) => i * 30);

    // Derived data for the sections.
    const verdict = vm.chrome.step4GeodeticBridge || buildFallbackVerdict(city, hits);
    const summary = deriveSummary({ hits, activeTransits: vm.geodetic?.activeTransits ?? [], eclipses: vm.eclipses?.hits ?? [], progressedBands: vm.progressions?.bands ?? [], destLon: lon });

    const gridRows: GeodeticGridAngle[] = (["ASC", "IC", "DSC", "MC"] as const).map((anchor) => {
        const lonAngle = angleLons[anchor];
        const sign = signFromLongitude(lonAngle);
        const deg = Math.floor(((lonAngle % 30) + 30) % 30);
        const hit = tightestPerAnchor.get(anchor);
        return {
            name: ANGLE_FULL[anchor],
            abrv: anchor,
            sign,
            deg: `${deg}°`,
            desc: ANGLE_DESC[anchor],
            hit: hit
                ? { p: capitalize(hit.planet), type: hit.closeness === "very close" ? "tight" : "close" }
                : null,
        };
    });

    // ActiveTransitsCard expects { planets, type, aspect, system?, orb? }.
    // We feed two parallel streams: "natal" (existing reading.transitWindows
    // top hits, when available) + "geodetic" (A1 active transits).
    const activeTransitRows = buildActiveTransitRows(vm.geodetic?.activeTransits ?? [], reading?.transitWindows ?? []);

    const matrix: HouseMatrixResult | null = reading?.houses && Array.isArray(reading.houses) && reading.houses.length > 0
        ? {
            houses: reading.houses,
            macroScore: reading.macroScore ?? 0,
            macroVerdict: reading.macroVerdict ?? "Neutral",
            houseSystem: reading.houseSystem ?? "placidus",
            ...(reading.lotOfFortune ? { lotOfFortune: reading.lotOfFortune } : {}),
            ...(reading.lotOfSpirit ? { lotOfSpirit: reading.lotOfSpirit } : {}),
        }
        : null;

    return (
        <TabSection
            kicker="Place Field"
            title={`How ${city} activates your chart`}
            intro="Geodetics is the time-invariant signature of a place — every visitor lands in the same band, but only your chart sits where it sits, and only your corners line up where they line up. Here's what's lit up for you."
        >
            {/* ── 0. Verdict ──────────────────────────────────────────────── */}
            <VerdictCard verdict={verdict} />

            {/* ── 1. Highlights / Lowlights ──────────────────────────────── */}
            <div
                className="mt-6 grid grid-cols-1 md:grid-cols-2"
                style={{ gap: "clamp(0.75rem, 1.5vw, 1.25rem)" }}
            >
                <HighlightCard
                    title="Highlights"
                    subtitle="The corners this place lifts"
                    accent="var(--sage, #7b9e87)"
                    rows={summary.highlights}
                    empty="No corners lifted in this window — the place is quietly neutral for your chart."
                />
                <HighlightCard
                    title="Lowlights"
                    subtitle="The corners this place presses"
                    accent="var(--color-spiced-life, #dc2626)"
                    rows={summary.lowlights}
                    empty="No pressure points — your chart isn't strained here."
                />
            </div>

            {/* ── 2. Natal wheel with geodetic overlay ──────────────────── */}
            <section className="mt-10">
                <SectionLabel>Where your chart lights up here</SectionLabel>
                <p className="text-[14.5px] leading-[1.55] mb-4 max-w-[640px]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                    Your natal wheel never changes. The four geodetic markers around the rim are the corners
                    of <strong>{city}</strong>. When a planet sits inside one of the lit wedges, that corner is activated.
                </p>
                <div className="max-w-[640px] mx-auto">
                    <NatalWithGeodeticOverlay
                        isDark
                        planets={natalPlanetsForWheel}
                        cusps={cusps}
                        geoMC={geoMC}
                        geoASC={geoASC}
                    />
                </div>

                {/* Per-hit list. Single full-width card; rows separated by top
                    borders, each row's left edge tinted by family. */}
                {flatHits.length > 0 && (
                    <div className="mt-6">
                        <ContactList
                            rows={flatHits}
                            notes={hitNotes}
                        />
                    </div>
                )}
            </section>

            {/* ── 3. The geodetic frame, as a four-card grid ────────────── */}
            <section className="mt-10">
                <SectionLabel>What this place is</SectionLabel>
                <p className="text-[14.5px] leading-[1.55] mb-4 max-w-[640px]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                    The four corners of {city}'s geodetic chart, with which natal planet (if any) sits on each one.
                </p>
                <GeodeticGridCard destination={city} angles={gridRows} />
            </section>

            {/* ── 4. Temporal layer ─────────────────────────────────────── */}
            {(activeTransitRows.length > 0 || (vm.eclipses?.hits.length ?? 0) > 0 || vm.progressions) && (
                <section className="mt-10">
                    <SectionLabel>When it intensifies</SectionLabel>
                    <p className="text-[14.5px] leading-[1.55] mb-4 max-w-[640px]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                        Permanent geodetic alignment is just the baseline. Live transits, eclipses,
                        and progressions amplify or dim it on a timeline.
                    </p>

                    {(vm.eclipses?.hits ?? []).length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
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
                </section>
            )}

            {/* ── 5. Geodetic world map ─────────────────────────────────── */}
            <section className="mt-10">
                <SectionLabel>Where on Earth this sits</SectionLabel>
                <p className="text-[14.5px] leading-[1.55] mb-4 max-w-[640px]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                    The Sepharial geodetic map: 12 zodiac sign bands wrap the Earth, with curved
                    Ascendant boundaries dividing it further. Anywhere in the same band shares
                    this city's MC sign.
                </p>
                <InteractiveGeodeticWorldMap />
            </section>

            {/* ── 6. Life areas activated (full house matrix) ───────────── */}
            {matrix && (
                <section className="mt-10">
                    <SectionLabel>Life areas activated</SectionLabel>
                    <p className="text-[14.5px] leading-[1.55] mb-4 max-w-[640px]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                        The 12 houses, ranked by how much {city} amplifies or dims each one for you. Click a row to see the math.
                    </p>
                    <HouseMatrixCard matrix={matrix} />
                </section>
            )}

            {/* ── 7. Planetary lines (kept; ACG receipt) ────────────────── */}
            <section className="mt-10">
                <SectionLabel>Planetary lines</SectionLabel>
                <AcgLinesCard
                    planetLines={relocatedAcgLines.map((l: any) => {
                        const angleStr = String(l.angle ?? l.line ?? "");
                        const km = typeof l.distance_km === "number"
                            ? l.distance_km
                            : Number(String(l.distance ?? "").match(/\d+/)?.[0] ?? 0);
                        return {
                            planet: String(l.planet ?? ""),
                            angle: angleStr,
                            distance_km: km,
                            orb: typeof l.orb === "number" ? l.orb : undefined,
                            is_paran: !!l.is_paran,
                            contribution: acgLineRawScore({
                                planet: String(l.planet ?? ""),
                                angle: angleStr.toUpperCase(),
                                distance_km: km,
                            }),
                        };
                    })}
                    natalPlanets={(reading?.natalPlanets || []).map((p: any) => ({
                        planet: String(p.name ?? p.planet ?? ""),
                        sign: String(p.sign ?? ""),
                        degree: typeof p.longitude === "number" ? Math.floor(p.longitude % 30) : 0,
                        longitude: typeof p.longitude === "number" ? p.longitude : 0,
                        retrograde: !!p.retrograde,
                        house: typeof p.house === "number" ? p.house : 0,
                        dignity: p.dignity,
                    }))}
                    birthCity={reading?.birth?.city || "—"}
                    destination={vm.location.city}
                />
            </section>

            {/* ── 8. Methodology footer ─────────────────────────────────── */}
            <details
                className="mt-10 border rounded-[10px] p-[clamp(16px,2.2vw,22px)]"
                style={{
                    borderColor: "var(--surface-border)",
                    background: "color-mix(in oklab, var(--text-primary) 3%, transparent)",
                }}
            >
                <summary
                    className="cursor-pointer text-[10.5px] tracking-[0.18em] uppercase select-none"
                    style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                >
                    How we read this — the 7-step framework
                </summary>
                <ol
                    className="mt-4 m-0 pl-5 space-y-2.5 max-w-[680px] text-[13.5px] leading-[1.55]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    {FRAMEWORK_STEPS.map(([title, body], i) => (
                        <li key={`step-${i}`}>
                            <strong style={{ color: "var(--text-primary)" }}>{title}.</strong>{" "}
                            {body}
                        </li>
                    ))}
                </ol>
                {vm.chrome.step4GeodeticMethod && (
                    <p
                        className="mt-4 text-[13px] leading-[1.6] m-0 max-w-[680px] italic"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                    >
                        {vm.chrome.step4GeodeticMethod}
                    </p>
                )}
                <p className="mt-3 text-[12px] tracking-[0.04em]"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>
                    Birth: {birthIso?.slice(0, 10) ?? "—"} · Destination: {vm.location.city} ({lat.toFixed(2)}°, {lon.toFixed(2)}°)
                </p>
            </details>
        </TabSection>
    );
}

// ── Small components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="text-[10.5px] tracking-[0.18em] uppercase mb-2"
            style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
        >
            {children}
        </div>
    );
}

function VerdictCard({ verdict }: { verdict: string }) {
    return (
        <div
            className="mt-6 p-[clamp(20px,2.6vw,28px)] border rounded-[var(--radius-md)]"
            style={{
                borderColor: "var(--surface-border)",
                background: "var(--surface)",
                borderLeft: "4px solid var(--color-y2k-blue, #4a7cff)",
            }}
        >
            <div
                className="text-[10.5px] tracking-[0.22em] uppercase mb-2 font-bold"
                style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
            >
                The verdict
            </div>
            <p
                className="m-0 text-[18px] leading-[1.4] [text-wrap:pretty]"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
            >
                {verdict}
            </p>
        </div>
    );
}

interface SummaryRow {
    icon: string;
    text: string;
}

function HighlightCard({
    title, subtitle, accent, rows, empty,
}: {
    title: string;
    subtitle: string;
    accent: string;
    rows: SummaryRow[];
    empty: string;
}) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: `4px solid ${accent}`,
                borderRadius: "var(--radius-md)",
                padding: "1.25rem 1.25rem 0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
            }}
        >
            <div
                style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: accent,
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                {title}
            </div>
            <p
                style={{
                    fontFamily: FONT_BODY,
                    fontSize: "0.82rem",
                    color: "var(--text-tertiary)",
                    margin: "0 0 0.5rem 0",
                }}
            >
                {subtitle}
            </p>
            {rows.length === 0 ? (
                <p
                    style={{
                        fontFamily: FONT_BODY,
                        fontSize: "0.85rem",
                        color: "var(--text-tertiary)",
                        fontStyle: "italic",
                        margin: "0 0 0.75rem 0",
                    }}
                >
                    {empty}
                </p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {rows.map((r, i) => (
                        <li
                            key={`row-${i}`}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "28px 1fr",
                                gap: "0.6rem",
                                alignItems: "baseline",
                                padding: "0.7rem 0",
                                borderTop: "1px solid var(--surface-border)",
                                fontFamily: FONT_BODY,
                                fontSize: "0.92rem",
                                color: "var(--text-primary)",
                            }}
                        >
                            <span aria-hidden style={{ color: accent, fontFamily: FONT_MONO }}>{r.icon}</span>
                            <span>{r.text}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ContactList({
    rows, notes,
}: {
    rows: { row: { anchor: "ASC" | "IC" | "DSC" | "MC" }; hit: PersonalGeodeticHit }[];
    notes: Map<string, string>;
}) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 1.25rem",
            }}
        >
            <div
                style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    padding: "0.85rem 0 0.25rem",
                }}
            >
                Contacts within 5°
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {rows.map(({ row, hit }, i) => {
                    const familyTone = familyAccent(hit.family);
                    const note = notes.get(`${hit.planet.toLowerCase()}-${row.anchor}`)
                        || fallbackHitNote(hit, ANGLE_TOPIC[row.anchor]);
                    return (
                        <li
                            key={`hit-${i}-${row.anchor}-${hit.planet}`}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr",
                                gap: "0.85rem",
                                padding: "0.85rem 0",
                                borderTop: i === 0 ? "none" : "1px solid var(--surface-border)",
                                borderLeft: `3px solid ${familyTone}`,
                                paddingLeft: "0.85rem",
                                marginLeft: "-0.4rem",
                            }}
                        >
                            <div style={{ minWidth: "5.5rem" }}>
                                <div
                                    style={{
                                        fontFamily: FONT_MONO,
                                        fontSize: "0.62rem",
                                        letterSpacing: "0.16em",
                                        color: familyTone,
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {row.anchor}
                                </div>
                                <div
                                    style={{
                                        fontFamily: FONT_PRIMARY,
                                        fontSize: "1rem",
                                        color: "var(--text-primary)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {capitalize(hit.planet)}
                                </div>
                                <div
                                    style={{
                                        fontFamily: FONT_MONO,
                                        fontSize: "0.68rem",
                                        color: "var(--text-tertiary)",
                                    }}
                                >
                                    {hit.orbDeg}° · {hit.closeness}
                                </div>
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: FONT_BODY,
                                    fontSize: "0.92rem",
                                    lineHeight: 1.55,
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {note}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function EclipseChip({ hit }: { hit: V4EclipseHit }) {
    const date = hit.dateUtc.slice(0, 10);
    return (
        <div
            className="inline-flex items-baseline gap-2 px-3 py-1.5 rounded-full border"
            style={{
                borderColor: "var(--color-spiced-life, #dc2626)",
                background: "color-mix(in oklab, var(--color-spiced-life, #dc2626) 8%, transparent)",
                fontFamily: FONT_MONO,
            }}
        >
            <span className="text-[10px] tracking-[0.14em] uppercase font-bold"
                style={{ color: "var(--color-spiced-life, #dc2626)" }}>
                {hit.kind === "solar" ? "Solar eclipse" : "Lunar eclipse"}
            </span>
            <span className="text-[12.5px]" style={{ color: "var(--text-primary)" }}>
                {date} · {hit.sign} {hit.degree.toFixed(0)}° on {hit.activatedAngle} · hits your {capitalize(hit.natalContact)}
            </span>
        </div>
    );
}

function ProgressionLine({ bands }: { bands: V4ProgressedBand[] }) {
    if (bands.length === 0) return null;
    const inBand = bands.find((b) => b.destinationInBand);
    if (!inBand) return null;
    return (
        <p className="mt-3 text-[13px] leading-[1.55]"
            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Progressed {inBand.planet}</span>
            {" is in "}
            <em>{inBand.sign}</em>
            {" — this longitude band ("}{inBand.longitudeRange}{") is currently personally activated for you."}
        </p>
    );
}

// ── Derivation helpers ────────────────────────────────────────────────────

function deriveSummary(args: {
    hits: { anchor: "ASC" | "IC" | "DSC" | "MC"; hits: PersonalGeodeticHit[] }[];
    activeTransits: V4GeoTransit[];
    eclipses: V4EclipseHit[];
    progressedBands: V4ProgressedBand[];
    destLon: number;
}): { highlights: SummaryRow[]; lowlights: SummaryRow[] } {
    const highlights: SummaryRow[] = [];
    const lowlights: SummaryRow[] = [];

    // Per-anchor hits, classified by family.
    for (const row of args.hits) {
        for (const hit of row.hits) {
            const text = `${capitalize(hit.planet)} on your ${ANGLE_TOPIC[row.anchor]} corner — ${hit.orbDeg}°`;
            const icon = planetGlyph(hit.planet);
            if (hit.family === "rough") lowlights.push({ icon, text });
            else if (hit.family === "gentle" || hit.family === "bright") highlights.push({ icon, text });
            // neutral hits skipped from the summary — they show up in the contact list below
        }
    }

    // A1 active geo-transits.
    for (const t of args.activeTransits) {
        const text = `${capitalize(t.planet)} live on the ${t.angle} corner${t.personalActivation && t.natalContact ? ` — hits your ${capitalize(t.natalContact)}` : ""}`;
        const icon = planetGlyph(t.planet);
        if (t.severity > 0) highlights.push({ icon, text });
        else if (t.severity < 0) lowlights.push({ icon, text });
    }

    // A4 eclipses → always lowlights (they're caution-by-design).
    for (const e of args.eclipses) {
        const text = `${e.kind === "solar" ? "Solar" : "Lunar"} eclipse on ${e.activatedAngle} (${e.dateUtc.slice(0, 10)}) — hits your ${capitalize(e.natalContact)}`;
        lowlights.push({ icon: "🌒", text });
    }

    // A5 progressed bands → highlight when destination matches the progressed-Sun band.
    const progSun = args.progressedBands.find((b) => b.planet === "Sun" && b.destinationInBand);
    if (progSun) {
        highlights.push({ icon: "→", text: `Progressed Sun in ${progSun.sign} — this longitude band is your current identity zone` });
    }

    return { highlights, lowlights };
}

function buildFallbackVerdict(
    city: string,
    hits: { anchor: "ASC" | "IC" | "DSC" | "MC"; hits: PersonalGeodeticHit[] }[],
): string {
    const tightest: { anchor: "ASC" | "IC" | "DSC" | "MC"; hit: PersonalGeodeticHit } | null =
        hits.flatMap((r) => r.hits.map((h) => ({ anchor: r.anchor, hit: h })))
            .sort((a, b) => a.hit.orbDeg - b.hit.orbDeg)[0] ?? null;
    if (!tightest) {
        return `${city} doesn't strongly activate any corner of your chart — it's a quiet, neutral place for you.`;
    }
    const family = tightest.hit.family;
    const verb = family === "rough" ? "presses" : family === "gentle" ? "warms" : family === "bright" ? "amplifies" : "tinges";
    return `${city} ${verb} your ${ANGLE_TOPIC[tightest.anchor]} corner via ${capitalize(tightest.hit.planet)} (${tightest.hit.orbDeg}° from the ${tightest.anchor}).`;
}

function buildActiveTransitRows(activeGeo: V4GeoTransit[], natalTransits: any[]): Array<{ planets: string; type: string; aspect: string; system?: string; orb?: number }> {
    const out: Array<{ planets: string; type: string; aspect: string; system?: string; orb?: number }> = [];
    for (const t of activeGeo) {
        out.push({
            planets: `${capitalize(t.planet)} - ${t.angle}`,
            type: `on geo-${t.angle}${t.personalActivation && t.natalContact ? ` · hits ${capitalize(t.natalContact)}` : ""}`,
            aspect: "conjunction",
            system: "geodetic",
            orb: Math.round(t.orb * 10) / 10,
        });
    }
    // Up to 5 strongest natal transits, when present on the persisted reading.
    for (const nt of (natalTransits ?? []).slice(0, 5)) {
        const tName = String(nt.transit_planet ?? nt.transitPlanet ?? "").trim();
        const nName = String(nt.natal_planet ?? nt.natalPlanet ?? "").trim();
        const aspect = String(nt.aspect ?? "").toLowerCase();
        if (!tName || !nName || !aspect) continue;
        out.push({
            planets: `${capitalize(tName)} - ${capitalize(nName)}`,
            type: aspect,
            aspect,
            system: "natal",
            orb: typeof nt.orb === "number" ? Math.round(nt.orb * 10) / 10 : undefined,
        });
    }
    return out;
}

function familyAccent(family: PersonalGeodeticHit["family"]): string {
    switch (family) {
        case "gentle": return "var(--sage, #7b9e87)";
        case "rough":  return "var(--color-spiced-life, #dc2626)";
        case "bright": return "var(--color-y2k-blue, #4a7cff)";
        default:       return "var(--text-tertiary)";
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
    const feel = hit.family === "gentle"
        ? "Things here may feel easier and warmer."
        : hit.family === "rough"
            ? "Things here may feel harder and more pushy."
            : hit.family === "bright"
                ? "Things here may stand out more than usual."
                : "Things here pick up a mild flavor from this planet.";
    return `${capitalize(hit.planet)} sits ${proximity} your ${topic} corner. ${feel}`;
}

function capitalize(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
