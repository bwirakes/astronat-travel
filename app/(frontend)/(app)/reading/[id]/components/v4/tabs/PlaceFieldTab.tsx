"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * PlaceFieldTab — three layers of progressive disclosure for an ESL beginner.
 *
 *   LAYER 1 — the answer.
 *     0. VerdictCard
 *     1. Headline (Mostly aligned / A pressured place / A mixed corner / Quiet)
 *     2. HighlightColumn pair — Lean into / Watch out for, with planet anchors
 *        and "open →" CTAs that scroll to the matching contact row.
 *
 *   LAYER 2 — the picture.
 *     3. Where your chart lights up here — natal wheel with geodetic overlay
 *        + zoomed `ReadingGeodeticMap` (city-centered) + 1-line key.
 *     4. ContactList — every natal contact within 5° of a corner.
 *
 *   LAYER 3 — the receipts (all collapsed in <details> blocks).
 *     5. What each corner means in the zodiac (GeodeticGridCard)
 *     6. When this place gets louder (ActiveTransitsCard + eclipses + progression)
 *     7. All 12 life areas, ranked (HouseMatrixCard)
 *     8. Planetary lines on Earth (AcgLinesCard)
 *     9. How we calculated this (6-step framework)
 */

import AcgLinesCard from "@/app/components/AcgLinesCard";
import ActiveTransitsCard from "@/app/components/ActiveTransitsCard";
import GeodeticGridCard, { type GeodeticGridAngle } from "@/app/components/GeodeticGridCard";
import HouseMatrixCard from "@/app/components/HouseMatrixCard";
import NatalWithGeodeticOverlay from "@/app/components/NatalWithGeodeticOverlay";
import ReadingGeodeticMap from "../parts/ReadingGeodeticMap";
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

type Anchor = "ASC" | "IC" | "DSC" | "MC";

const ANGLE_DESC: Record<Anchor, string> = {
    ASC: "Rising energy. The face you show the world here.",
    IC:  "Roots, home, and where you anchor. The private base.",
    DSC: "Partnerships and reflections. Who you attract here.",
    MC:  "Career, authority, and visibility. How your work lands.",
};

const ANGLE_FULL: Record<Anchor, string> = {
    ASC: "ASCENDANT",
    IC: "NADIR",
    DSC: "DESCENDANT",
    MC: "MIDHEAVEN",
};

const ANGLE_TOPIC: Record<Anchor, string> = {
    ASC: "self",
    IC: "home",
    DSC: "partners",
    MC: "career",
};

// 6-step framework — Geodetic 101 minus the "Rule of Three" step (we don't
// run national-chart cross-referencing yet, so we don't claim it).
const FRAMEWORK_STEPS: Array<[string, string]> = [
    ["Establish your base chart",       "Natal chart — date, time, place must be accurate."],
    ["Calculate the geodetic frame",    "Derive geodetic MC (from longitude) and ASC (from longitude + latitude) for the destination."],
    ["Map natal planets to geodetic degrees", "Convert each natal planet's position to a geographic longitude on the world map."],
    ["Identify active zones",           "Find where current transit / eclipse / lunation degrees land using the geodetic formula."],
    ["Layer temporal techniques",       "Apply transits, progressions, and Solar Arc directions to the geodetic frame for precise timing."],
    ["Interpret the houses",            "Read the geodetic house themes for the target — what life domains are activated?"],
];

export default function PlaceFieldTab({ vm, birthIso, reading, relocatedAcgLines }: Props) {
    const { lat, lon, city } = vm.location;
    const geoMC = geodeticMCLongitude(lon);
    const geoASC = geodeticASCLongitude(lon, lat);

    const angleLons: Record<Anchor, number> = {
        ASC: geoASC,
        MC: geoMC,
        DSC: (geoASC + 180) % 360,
        IC: (geoMC + 180) % 360,
    };

    const hits = vm.scoreNarrative.geodetic.personal;
    const tightestPerAnchor = new Map<Anchor, PersonalGeodeticHit>();
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

    const verdict = vm.chrome.step4GeodeticBridge || buildFallbackVerdict(city, hits);
    const summary = deriveSummary({
        hits,
        activeTransits: vm.geodetic?.activeTransits ?? [],
        eclipses: vm.eclipses?.hits ?? [],
        progressedBands: vm.progressions?.bands ?? [],
    });
    const headline = deriveHeadline(summary);

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

    const activeTransitRows = buildActiveTransitRows(
        vm.geodetic?.activeTransits ?? [],
        reading?.transitWindows ?? [],
    );

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

    const hasTemporalLayer = activeTransitRows.length > 0
        || (vm.eclipses?.hits.length ?? 0) > 0
        || !!vm.progressions;

    return (
        <TabSection
            kicker="Place Field"
            title={`Does ${city} help or strain you?`}
            intro="Two layers stack here. First — what's permanent: where this city's corners (the four directions of its sky) line up against your natal chart. Second — what's live right now: transits, eclipses, and progressions amplifying or dimming that baseline."
        >
            {/* ── LAYER 1 ────────────────────────────────────────────────── */}

            <VerdictCard verdict={verdict} />

            <HeadlineRow headline={headline} highlights={summary.highlights.length} lowlights={summary.lowlights.length} />

            <div
                className="mt-4 grid grid-cols-1 md:grid-cols-2"
                style={{ gap: "clamp(0.75rem, 1.5vw, 1.25rem)" }}
            >
                <HighlightColumn
                    title="Lean into"
                    subtitle="The corners this place lifts"
                    accent="var(--sage, #7b9e87)"
                    rows={summary.highlights}
                    empty="No corners lifted in this window."
                />
                <HighlightColumn
                    title="Watch out for"
                    subtitle="The corners this place presses"
                    accent="var(--color-spiced-life, #dc2626)"
                    rows={summary.lowlights}
                    empty="No pressure points — your chart isn't strained here."
                />
            </div>

            {/* ── LAYER 2 ────────────────────────────────────────────────── */}

            <section className="mt-12">
                <SectionLabel>Where your chart lights up here</SectionLabel>
                <p
                    className="text-[14.5px] leading-[1.55] mb-4 max-w-[640px]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    Your natal wheel never changes — these are your planets, fixed at birth. The
                    four pills around the rim are the corners of <strong>{city}</strong>. When a planet
                    sits inside a colored wedge, that corner is activated for you. Hover any pill
                    to focus on it.
                </p>

                <div
                    className="grid grid-cols-1 md:grid-cols-2"
                    style={{ gap: "clamp(1rem, 2vw, 1.5rem)", alignItems: "start" }}
                >
                    <div className="max-w-[640px] mx-auto md:mx-0 w-full">
                        <NatalWithGeodeticOverlay
                            isDark
                            planets={natalPlanetsForWheel}
                            cusps={cusps}
                            geoMC={geoMC}
                            geoASC={geoASC}
                        />
                        <CornerKey />
                    </div>

                    <div className="w-full">
                        <ReadingGeodeticMap lat={lat} lon={lon} city={city} />
                        <p
                            className="mt-2 text-[12.5px] leading-[1.5]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                        >
                            Where {city} sits on the geodetic grid. The dashed red line is the city's
                            Midheaven meridian; the gold curves are Ascendant boundaries. The shaded
                            block is the "rising-zone" your city falls into.
                        </p>
                    </div>
                </div>

                {flatHits.length > 0 && (
                    <div id="geodetic-contacts" className="mt-8">
                        <ContactList rows={flatHits} notes={hitNotes} />
                    </div>
                )}
            </section>

            {/* ── LAYER 3 — collapsed receipts ──────────────────────────── */}

            <DetailsBlock title="What each corner means in the zodiac" intro="The four corners of this city's chart, with the natal planet — if any — sitting on each.">
                <GeodeticGridCard destination={city} angles={gridRows} />
            </DetailsBlock>

            {hasTemporalLayer && (
                <DetailsBlock
                    title="When this place gets louder"
                    intro="Permanent geodetic alignment is just the baseline. Live transits, eclipses, and progressions push it up or down on a timeline."
                >
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
                </DetailsBlock>
            )}

            {matrix && (
                <DetailsBlock title="All 12 life areas, ranked" intro={`How much ${city} amplifies or dims each life area for you. Click a row to see the math.`}>
                    <HouseMatrixCard matrix={matrix} />
                </DetailsBlock>
            )}

            <DetailsBlock title="Planetary lines on Earth (ACG)" intro="Astrocartography uses a different system from geodetics — it draws each natal planet as a curved line where that planet was angular at your birth moment. Shown here for reference; the geodetic story above is what's primary on this tab.">
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
            </DetailsBlock>

            <DetailsBlock title="How we calculated this" intro="The 6-step Geodetic 101 framework, in order.">
                <ol
                    className="m-0 pl-5 space-y-2.5 max-w-[680px] text-[13.5px] leading-[1.55]"
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
                <p
                    className="mt-3 text-[12px] tracking-[0.04em]"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    Birth: {birthIso?.slice(0, 10) ?? "—"} · Destination: {vm.location.city} ({lat.toFixed(2)}°, {lon.toFixed(2)}°)
                </p>
            </DetailsBlock>
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

function HeadlineRow({
    headline, highlights, lowlights,
}: {
    headline: string;
    highlights: number;
    lowlights: number;
}) {
    return (
        <div className="mt-8 mb-2">
            <h2
                className="m-0"
                style={{
                    fontFamily: FONT_PRIMARY,
                    fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                }}
            >
                {headline}.
            </h2>
            <div className="mt-2 flex gap-2 flex-wrap">
                <CountPill count={highlights} label="lifts"   accent="var(--sage, #7b9e87)" />
                <CountPill count={lowlights}  label="presses" accent="var(--color-spiced-life, #dc2626)" />
            </div>
        </div>
    );
}

function CountPill({ count, label, accent }: { count: number; label: string; accent: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.75rem",
                border: `1px solid ${accent}`,
                borderRadius: "999px",
                fontFamily: FONT_MONO,
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                color: "var(--text-primary)",
                textTransform: "uppercase",
                fontWeight: 700,
            }}
        >
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: accent }} />
            {count} {label}
        </span>
    );
}

interface SummaryRow {
    /** What sits on top of the anchor stack — typically a planet glyph or
     *  eclipse symbol. Prominent like the Stage1 "day number". */
    glyph: string;
    /** Small label above and below the glyph — typically corner code. */
    kicker: string;
    /** Plain-English impact sentence shown in the middle column. */
    impact: string;
    /** Anchor id to scroll to on click. */
    targetId: string;
}

function HighlightColumn({
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
                        <HighlightRow key={`row-${i}`} row={r} accent={accent} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function HighlightRow({ row, accent }: { row: SummaryRow; accent: string }) {
    const handlePick = () => {
        const el = document.getElementById(row.targetId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    return (
        <li>
            <button
                onClick={handlePick}
                style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "54px 1fr auto",
                    gap: "0.85rem",
                    alignItems: "center",
                    textAlign: "left",
                    padding: "0.7rem 0",
                    background: "transparent",
                    border: "none",
                    borderTop: "1px solid var(--surface-border)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span
                        style={{
                            fontFamily: FONT_MONO,
                            fontSize: "0.52rem",
                            letterSpacing: "0.2em",
                            color: "var(--text-tertiary)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        {row.kicker}
                    </span>
                    <span
                        style={{
                            fontFamily: FONT_BODY,
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            lineHeight: 1,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {row.glyph}
                    </span>
                </div>
                <p
                    style={{
                        fontFamily: FONT_BODY,
                        fontSize: "0.9rem",
                        lineHeight: 1.45,
                        margin: 0,
                        color: "var(--text-primary)",
                    }}
                >
                    {row.impact}
                </p>
                <span
                    style={{
                        fontFamily: FONT_MONO,
                        fontSize: "0.55rem",
                        letterSpacing: "0.15em",
                        color: accent,
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    open →
                </span>
            </button>
        </li>
    );
}

function CornerKey() {
    return (
        <div
            className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10.5px] tracking-[0.12em] uppercase"
            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
        >
            <KeyRow swatch="var(--color-y2k-blue, #4a7cff)" label="Primary corners (ASC, MC)" />
            <KeyRow swatch="var(--text-secondary)" label="Secondary (DSC, IC)" />
            <KeyRow swatch="var(--color-y2k-blue, #4a7cff)" label="Lit wedge = a planet within 5°" filled />
        </div>
    );
}

function KeyRow({ swatch, label, filled }: { swatch: string; label: string; filled?: boolean }) {
    return (
        <span className="inline-flex items-center gap-2">
            {filled ? (
                <span
                    aria-hidden
                    className="inline-block w-[14px] h-[10px] rounded-sm"
                    style={{ background: swatch, opacity: 0.32 }}
                />
            ) : (
                <span
                    aria-hidden
                    className="inline-block w-[14px] h-[2px]"
                    style={{ background: swatch }}
                />
            )}
            <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        </span>
    );
}

function ContactList({
    rows, notes,
}: {
    rows: { row: { anchor: Anchor }; hit: PersonalGeodeticHit }[];
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
                            id={contactRowId(hit.planet, row.anchor)}
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

function DetailsBlock({
    title, intro, children,
}: {
    title: string;
    intro?: string;
    children: React.ReactNode;
}) {
    return (
        <details
            className="mt-4 border rounded-[10px]"
            style={{
                borderColor: "var(--surface-border)",
                background: "color-mix(in oklab, var(--text-primary) 3%, transparent)",
            }}
        >
            <summary
                className="cursor-pointer select-none flex items-baseline gap-3 list-none p-[clamp(14px,2vw,18px)]"
                style={{
                    fontFamily: FONT_PRIMARY,
                    fontSize: "1.05rem",
                    color: "var(--text-primary)",
                }}
            >
                <span
                    aria-hidden
                    style={{
                        fontFamily: FONT_MONO,
                        fontSize: "0.7rem",
                        color: "var(--color-y2k-blue)",
                        letterSpacing: "0.1em",
                    }}
                >
                    +
                </span>
                {title}
            </summary>
            <div className="px-[clamp(14px,2vw,18px)] pb-[clamp(14px,2vw,18px)]">
                {intro && (
                    <p
                        className="text-[13.5px] leading-[1.55] mb-3 max-w-[680px]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        {intro}
                    </p>
                )}
                {children}
            </div>
        </details>
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
            <span
                className="text-[10px] tracking-[0.14em] uppercase font-bold"
                style={{ color: "var(--color-spiced-life, #dc2626)" }}
            >
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
        <p
            className="mt-3 text-[13px] leading-[1.55]"
            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
        >
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Progressed {inBand.planet}</span>
            {" is in "}
            <em>{inBand.sign}</em>
            {" — this longitude band ("}{inBand.longitudeRange}{") is currently personally activated for you."}
        </p>
    );
}

// ── Derivation helpers ────────────────────────────────────────────────────

function deriveSummary(args: {
    hits: { anchor: Anchor; hits: PersonalGeodeticHit[] }[];
    activeTransits: V4GeoTransit[];
    eclipses: V4EclipseHit[];
    progressedBands: V4ProgressedBand[];
}): { highlights: SummaryRow[]; lowlights: SummaryRow[] } {
    const highlights: SummaryRow[] = [];
    const lowlights: SummaryRow[] = [];

    for (const row of args.hits) {
        for (const hit of row.hits) {
            const impact = `${capitalize(hit.planet)} ${impactVerb(hit.family)} your ${ANGLE_TOPIC[row.anchor]} corner.`;
            const r: SummaryRow = {
                glyph: planetGlyph(hit.planet),
                kicker: row.anchor,
                impact,
                targetId: contactRowId(hit.planet, row.anchor),
            };
            if (hit.family === "rough") lowlights.push(r);
            else if (hit.family === "gentle" || hit.family === "bright") highlights.push(r);
        }
    }

    for (const t of args.activeTransits) {
        const tail = t.personalActivation && t.natalContact ? ` — hits your ${capitalize(t.natalContact)}` : "";
        const r: SummaryRow = {
            glyph: planetGlyph(t.planet),
            kicker: t.angle,
            impact: `Live ${capitalize(t.planet)} on the ${t.angle} corner${tail}.`,
            targetId: "geodetic-contacts",
        };
        if (t.severity > 0) highlights.push(r);
        else if (t.severity < 0) lowlights.push(r);
    }

    for (const e of args.eclipses) {
        lowlights.push({
            glyph: "🌒",
            kicker: e.activatedAngle,
            impact: `${e.kind === "solar" ? "Solar" : "Lunar"} eclipse on your ${e.activatedAngle} (${e.dateUtc.slice(0, 10)}) — hits your ${capitalize(e.natalContact)}.`,
            targetId: "geodetic-contacts",
        });
    }

    const progSun = args.progressedBands.find((b) => b.planet === "Sun" && b.destinationInBand);
    if (progSun) {
        highlights.push({
            glyph: "→",
            kicker: "PROG",
            impact: `Progressed Sun in ${progSun.sign} — this longitude band is your current identity zone.`,
            targetId: "geodetic-contacts",
        });
    }

    return { highlights, lowlights };
}

function deriveHeadline(s: { highlights: SummaryRow[]; lowlights: SummaryRow[] }): string {
    const h = s.highlights.length;
    const l = s.lowlights.length;
    if (h === 0 && l === 0) return "A quiet place";
    if (h >= l * 2 && h >= 2) return "Mostly aligned";
    if (l >= h * 2 && l >= 2) return "A pressured place";
    if (h === 0) return "A pressured place";
    if (l === 0) return "Mostly aligned";
    return "A mixed corner";
}

function impactVerb(family: PersonalGeodeticHit["family"]): string {
    switch (family) {
        case "gentle": return "warms";
        case "rough":  return "presses";
        case "bright": return "amplifies";
        default:       return "tinges";
    }
}

function buildFallbackVerdict(
    city: string,
    hits: { anchor: Anchor; hits: PersonalGeodeticHit[] }[],
): string {
    const tightest: { anchor: Anchor; hit: PersonalGeodeticHit } | null =
        hits.flatMap((r) => r.hits.map((h) => ({ anchor: r.anchor, hit: h })))
            .sort((a, b) => a.hit.orbDeg - b.hit.orbDeg)[0] ?? null;
    if (!tightest) {
        return `${city} doesn't strongly activate any corner of your chart — it's a quiet, neutral place for you.`;
    }
    const verb = impactVerb(tightest.hit.family);
    return `${city} ${verb} your ${ANGLE_TOPIC[tightest.anchor]} corner via ${capitalize(tightest.hit.planet)} (${tightest.hit.orbDeg}° from the ${tightest.anchor}).`;
}

function buildActiveTransitRows(
    activeGeo: V4GeoTransit[],
    natalTransits: any[],
): Array<{ planets: string; type: string; aspect: string; system?: string; orb?: number }> {
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

function contactRowId(planet: string, anchor: Anchor): string {
    return `contact-${planet.toLowerCase().replace(/\s+/g, "-")}-${anchor.toLowerCase()}`;
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
