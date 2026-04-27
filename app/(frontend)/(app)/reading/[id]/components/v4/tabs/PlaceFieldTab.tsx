"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AcgMap, type NatalData } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import CityFingerprintWheel from "@/app/components/CityFingerprintWheel";
import PlaceContactWheel from "@/app/components/PlaceContactWheel";
import ReadingGeodeticMap from "../parts/ReadingGeodeticMap";
import { acgLineRawScore } from "@/app/lib/house-matrix";
import { geodeticASCLongitude, geodeticMCLongitude, signFromLongitude } from "@/app/lib/geodetic";
import type { PersonalGeodeticHit } from "@/app/lib/reading-tabs";
import type { V4GeoTransit } from "@/app/lib/reading-viewmodel";
import TabSection from "./TabSection";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    natalForMap: NatalData | null;
    birthIso: string | undefined;
    reading: any;
    relocatedAcgLines: any[];
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

// Short flavors per angle sign — used in the "City fingerprint" bullets.
// Two- or three-word vibe per sign so the user can scan all four angles at
// once without reading paragraphs. Order matches NATAL_WHEEL_SIGNS.
const SIGN_FLAVOR: Record<string, string> = {
    Aries:       "fast, urgent, pioneering",
    Taurus:      "steady, sensual, slow-cooking",
    Gemini:      "curious, talkative, restless",
    Cancer:      "homely, memory-rich, soft",
    Leo:         "expressive, theatrical, warm",
    Virgo:       "practical, refining, exacting",
    Libra:       "social, mediating, polished",
    Scorpio:     "intense, private, transformative",
    Sagittarius: "exploratory, philosophical, blunt",
    Capricorn:   "structured, ambitious, disciplined",
    Aquarius:    "experimental, communal, detached",
    Pisces:      "dreamy, porous, devotional",
};

// What each angle is "for" — used in bullet headlines.
const ANGLE_TOPIC: Record<"ASC" | "IC" | "DSC" | "MC", string> = {
    ASC: "self",
    IC: "home",
    DSC: "partners",
    MC: "career",
};

// Order the bullets read top-to-bottom: identity → home → partners → career.
const BULLET_ORDER: Array<"ASC" | "IC" | "DSC" | "MC"> = ["ASC", "IC", "DSC", "MC"];

export default function PlaceFieldTab({ vm, natalForMap, birthIso, reading, relocatedAcgLines }: Props) {
    const { lat, lon, city } = vm.location;
    const geoMC = geodeticMCLongitude(lon);
    const geoASC = geodeticASCLongitude(lon, lat);
    const angleLons = {
        ASC: geoASC,
        MC: geoMC,
        DSC: (geoASC + 180) % 360,
        IC: (geoMC + 180) % 360,
    } as const;

    const activeTransits = vm.geodetic?.activeTransits ?? [];
    const hits = vm.scoreNarrative.geodetic.personal;
    const flatHits = hits.flatMap((row) => row.hits.map((hit) => ({ row, hit })));

    const natalForWheel = (reading?.natalPlanets ?? []).map((p: any) => ({
        name: p.name ?? p.planet,
        longitude: typeof p.longitude === "number" ? p.longitude : 0,
        retrograde: !!p.retrograde,
    }));

    // Lead hook: prefer the AI bridge sentence; fall back to a short
    // templated line referencing the geo-MC sign.
    const leadHook =
        vm.chrome.step4GeodeticBridge
        || `${city} sits in a ${signFromLongitude(geoMC)}-flavored geodetic zone. Here's how that lines up with your chart.`;

    const hitNotes = extractGeodeticHitNotes(reading);

    return (
        <TabSection
            kicker="Place Field"
            title="The land, then your chart on the land."
            intro={leadHook}
        >
            {/* Optional A1 chip — surfaces "currently activated by X" when a
                live transit is sitting on a geodetic angle. Skipped when the
                engine returned no hits for this reference date. */}
            {activeTransits.length > 0 && (
                <div className="mt-6">
                    <ActiveTransitChip hit={activeTransits[0]} />
                </div>
            )}

            {/* ── 1. City Fingerprint Wheel — what every visitor lands in ── */}
            <section className="mt-8">
                <SectionLabel>City fingerprint</SectionLabel>
                <h3
                    className="text-[20px] leading-[1.3] font-normal m-0 mb-3 [text-wrap:pretty]"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                >
                    {city} sits in {vm.geodetic?.sign ?? signFromLongitude(geoMC)}
                    {vm.geodetic?.flavor && (
                        <span className="italic" style={{ color: "var(--text-secondary)" }}>
                            {" "}— {vm.geodetic.flavor}.
                        </span>
                    )}
                </h3>

                <CityFingerprintWheel geoMC={geoMC} geoASC={geoASC} size={300} />

                <ul className="mt-4 space-y-1.5 list-none p-0 m-0 max-w-[560px] mx-auto">
                    {BULLET_ORDER.map((anchor) => {
                        const lon = angleLons[anchor];
                        const sign = signFromLongitude(lon);
                        const flavor = SIGN_FLAVOR[sign] ?? "distinct";
                        return (
                            <li
                                key={`fp-${anchor}`}
                                className="text-[14px] leading-[1.55]"
                                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                            >
                                <span
                                    className="inline-block min-w-[42px] mr-2 font-bold"
                                    style={{
                                        fontFamily: FONT_MONO,
                                        color: anchor === "ASC" || anchor === "MC"
                                            ? "var(--color-y2k-blue)"
                                            : "var(--text-secondary)",
                                        fontSize: "11.5px",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    {anchor}
                                </span>
                                <span style={{ color: "var(--text-primary)" }}>{sign}</span>
                                <span> — {flavor}.</span>
                            </li>
                        );
                    })}
                </ul>

                <p
                    className="mt-3 italic text-center text-[12.5px] leading-[1.5]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                >
                    Same fingerprint for every visitor.
                </p>
            </section>

            {/* ── 2. Place Contact Wheel — your chart on this place ── */}
            <section className="mt-10">
                <SectionLabel>Your chart on this place</SectionLabel>
                <h3
                    className="text-[20px] leading-[1.3] font-normal m-0 mb-3"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                >
                    {flatHits.length > 0
                        ? `${flatHits.length} natal contact${flatHits.length === 1 ? "" : "s"} with the four corners`
                        : "No natal contacts within five degrees"}
                </h3>

                <PlaceContactWheel
                    geoMC={geoMC}
                    geoASC={geoASC}
                    natalPlanets={natalForWheel}
                    size={360}
                />

                {flatHits.length > 0 ? (
                    <ul className="mt-5 space-y-2 list-none p-0 m-0 max-w-[640px] mx-auto">
                        {flatHits.map(({ row, hit }) => (
                            <ContactBullet
                                key={`ct-${row.anchor}-${hit.planet}`}
                                anchor={row.anchor}
                                hit={hit}
                                note={hitNotes.get(hitKey(hit.planet, row.anchor))}
                            />
                        ))}
                    </ul>
                ) : (
                    <p
                        className="mt-5 text-center text-[14px] leading-[1.55] max-w-[520px] mx-auto"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        The land still has its own flavor, but your chart is not made
                        stronger or weaker by sitting on its corners.
                    </p>
                )}
            </section>

            {/* ── 3. Astrocartography map — geographic view (kept; tightened caption) ── */}
            {natalForMap && (
                <section className="mt-10">
                    <SectionLabel>Astrocartography</SectionLabel>
                    <AcgMap
                        natal={natalForMap}
                        birthDateTimeUTC={birthIso}
                        birthLat={reading?.birth?.lat ?? reading?.birthLat}
                        birthLon={reading?.birth?.lon ?? reading?.birthLon}
                        birthCity={reading?.birth?.city}
                        highlightCity={{
                            lat: vm.location.lat,
                            lon: vm.location.lon,
                            name: vm.location.city,
                            score: vm.hero.bestWindow?.score,
                        }}
                        interactive
                    />
                    <p
                        className="mt-2 text-[12px] leading-[1.5] text-center"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                    >
                        Where your planets are strongest on Earth near {city}.
                    </p>
                </section>
            )}

            {/* ── 4. ACG Lines card (unchanged) ── */}
            <div className="mt-8">
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
            </div>

            {/* ── 5. Geodetic anatomy regional map (kept, demoted) ── */}
            <details
                className="mt-8 border rounded-[10px] p-[clamp(16px,2.2vw,22px)]"
                style={{
                    borderColor: "var(--surface-border)",
                    background: "var(--bg)",
                }}
            >
                <summary
                    className="cursor-pointer text-[10.5px] tracking-[0.18em] uppercase select-none"
                    style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                >
                    Geodetic anatomy · {city}
                </summary>
                <p
                    className="mt-3 text-[12.5px] leading-[1.5] m-0 mb-4 max-w-[560px]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    Shaded patch: every place on Earth that shares this city's geodetic ASC + MC pairing.
                </p>
                <ReadingGeodeticMap
                    lat={vm.location.lat}
                    lon={vm.location.lon}
                    city={vm.location.city}
                />
            </details>

            {/* ── 6. Methodology footer (collapsed by default) ── */}
            <details
                className="mt-4 border rounded-[10px] p-[clamp(14px,2vw,20px)]"
                style={{
                    borderColor: "var(--surface-border)",
                    background: "color-mix(in oklab, var(--text-primary) 3%, transparent)",
                }}
            >
                <summary
                    className="cursor-pointer text-[10.5px] tracking-[0.18em] uppercase select-none"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    Why these four points?
                </summary>
                <ul
                    className="mt-3 m-0 pl-5 space-y-1.5 max-w-[620px] text-[13.5px] leading-[1.55]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    <li>
                        Only the four corners count: career (MC), home (IC), self (ASC), partner (DSC).
                        The other eight house points carry no geodetic signal.
                    </li>
                    <li>
                        A natal planet has to sit within five degrees to register. Closer = stronger.
                    </li>
                    <li>
                        Gentle planets (Venus, Jupiter) feel easy. Rough ones (Mars, Saturn) feel heavy.
                        The Sun and Moon stand out.
                    </li>
                    <li style={{ color: "var(--text-tertiary)" }}>
                        Time-invariant: the same fingerprint applies to anyone visiting this longitude.
                    </li>
                </ul>
                {vm.chrome.step4GeodeticMethod && (
                    <p
                        className="mt-3 text-[13px] leading-[1.6] m-0 max-w-[620px] italic"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                    >
                        {vm.chrome.step4GeodeticMethod}
                    </p>
                )}
            </details>
        </TabSection>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

function ActiveTransitChip({ hit }: { hit: V4GeoTransit }) {
    const tone = hit.severity > 0 ? "var(--color-success, #16a34a)" : "var(--color-warning, #dc2626)";
    const verb = hit.severity > 0 ? "lit up" : "pressured";
    return (
        <div
            className="inline-flex items-baseline gap-2 px-3 py-1.5 rounded-full border"
            style={{
                borderColor: tone,
                background: `color-mix(in oklab, ${tone} 8%, transparent)`,
                fontFamily: FONT_MONO,
            }}
        >
            <span
                className="text-[10px] tracking-[0.14em] uppercase font-bold"
                style={{ color: tone }}
            >
                Now
            </span>
            <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                {capitalize(hit.planet)} on the {hit.angle} — this place is {verb} ({hit.orb.toFixed(1)}°
                {hit.personalActivation && hit.natalContact ? ` · hits your natal ${capitalize(hit.natalContact)}` : ""})
            </span>
        </div>
    );
}

function ContactBullet({
    anchor,
    hit,
    note,
}: {
    anchor: "ASC" | "IC" | "DSC" | "MC";
    hit: PersonalGeodeticHit;
    note: string | undefined;
}) {
    const topic = ANGLE_TOPIC[anchor];
    const heading = `${capitalize(hit.planet)} on your ${topic} point (${anchor})`;
    const familyTone =
        hit.family === "rough" ? "var(--color-warning, #dc2626)"
        : hit.family === "gentle" ? "var(--color-success, #16a34a)"
        : hit.family === "bright" ? "var(--color-y2k-blue, #4a7cff)"
        : "var(--text-secondary)";
    return (
        <li
            className="pl-3 border-l-2"
            style={{ borderColor: familyTone }}
        >
            <div
                className="text-[15px] leading-[1.4] font-bold"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
            >
                {heading}
                <span
                    className="ml-2 align-middle text-[11px] font-normal tracking-[0.04em]"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    {hit.orbDeg}° · {hit.closeness}
                </span>
            </div>
            <p
                className="m-0 text-[14px] leading-[1.55]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {note || fallbackHitNote(hit, topic)}
            </p>
        </li>
    );
}

function hitKey(planet: string, anchor: "ASC" | "IC" | "DSC" | "MC"): string {
    return `${planet.toLowerCase()}-${anchor}`;
}

/** Pulls AI-written per-hit notes off the persisted teacher reading and
 *  returns a Map keyed by `${planet-lowercase}-${ASC|IC|DSC|MC}`. The
 *  prompt schema guarantees this shape; falls back to an empty map on
 *  cached readings that predate the field. */
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
    return `${capitalize(hit.planet)} sits ${proximity} your ${topic} point. ${feel}`;
}

function capitalize(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
