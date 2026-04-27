"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AcgMap, type NatalData } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import ReadingGeodeticMap from "../parts/ReadingGeodeticMap";
import { acgLineRawScore } from "@/app/lib/house-matrix";
import type { PersonalGeodeticEvidence, PersonalGeodeticHit } from "@/app/lib/reading-tabs";
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

export default function PlaceFieldTab({ vm, natalForMap, birthIso, reading, relocatedAcgLines }: Props) {
    return (
        <TabSection
            kicker="Place Field"
            title="The land, then your chart on the land."
            intro="The outcome comes first: this tab separates what the place always carries from what it does to your birth chart specifically."
        >
                {/* Geodetic band — distinct surface to keep separate from astrocartography */}
                {vm.geodetic && (
                    <div
                        className="mt-9 px-6 pt-6 pb-[22px] border rounded-[10px]"
                        style={{
                            borderColor: "var(--surface-border)",
                            background: "color-mix(in oklab, var(--text-primary) 4%, transparent)",
                        }}
                    >
                        <div className="flex items-baseline flex-wrap gap-[10px] mb-[10px]">
                            <span
                                className="text-[10.5px] tracking-[0.12em] uppercase font-bold px-2 py-[3px] rounded-full"
                                style={{
                                    fontFamily: FONT_MONO,
                                    color: "var(--color-y2k-blue)",
                                    background: "color-mix(in oklab, var(--color-y2k-blue) 10%, transparent)",
                                }}
                            >
                                Overall Geodetics
                            </span>
                            <span
                                className="text-[11px] tracking-[0.04em]"
                                style={{ fontFamily: FONT_MONO, color: "var(--text-secondary)" }}
                            >
                                {vm.geodetic.longitudeRange}
                            </span>
                        </div>
                        <h3
                            className="text-[22px] leading-[1.3] font-normal m-0 mb-[10px] tracking-[-0.01em] [text-wrap:pretty]"
                            style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                        >
                            {vm.location.city} sits in {vm.geodetic.sign}
                            <span className="italic" style={{ color: "var(--text-secondary)" }}>
                                {" "}— {vm.geodetic.flavor}.
                            </span>
                        </h3>
                        <p
                            className="text-[15px] leading-[1.55] font-light m-0 mb-3 max-w-[560px]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            {vm.geodetic.note}
                        </p>
                    </div>
                )}

                {/* Bridge — AI-written one-liner connecting the impersonal band
                    above to the personal hits below. */}
                {vm.chrome.step4GeodeticBridge && (
                    <p
                        className="mt-6 mb-0 max-w-[620px] text-[15.5px] leading-[1.55] italic"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        {vm.chrome.step4GeodeticBridge}
                    </p>
                )}

                {/* Personal geodetic hits — one row per (planet × angle) within 5°.
                    AI prose front, math behind <details>. */}
                <div className="my-7">
                    <h3
                        className="font-normal tracking-[-0.01em] leading-[1.15] m-0 mb-2"
                        style={{
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(22px, 2.8vw, 30px)",
                            color: "var(--text-primary)",
                        }}
                    >
                        Your chart on this place
                    </h3>
                    <PersonalGeodeticHits
                        rows={vm.scoreNarrative.geodetic.personal}
                        notes={extractGeodeticHitNotes(reading)}
                    />
                </div>

                {/* Methodology — plain paragraph, AI-written or default copy. */}
                {vm.chrome.step4GeodeticMethod && (
                    <div
                        className="mt-2 mb-7 p-[clamp(18px,2.4vw,24px)] border rounded-[10px]"
                        style={{
                            borderColor: "var(--surface-border)",
                            background: "color-mix(in oklab, var(--text-primary) 3%, transparent)",
                        }}
                    >
                        <div
                            className="text-[10.5px] tracking-[0.18em] uppercase mb-2"
                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                        >
                            How we counted
                        </div>
                        <p
                            className="text-[14px] leading-[1.6] m-0 max-w-[620px]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            {vm.chrome.step4GeodeticMethod}
                        </p>
                    </div>
                )}

                {/* Geodetic anatomy — regional view focused on the destination */}
                <div
                    className="mt-7 p-[clamp(20px,2.6vw,28px)] border rounded-[10px]"
                    style={{
                        borderColor: "var(--surface-border)",
                        background: "var(--bg)",
                    }}
                >
                    <div
                        className="text-[10.5px] tracking-[0.18em] uppercase mb-1"
                        style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                    >
                        Geodetic anatomy · {vm.location.city}
                    </div>
                    <p
                        className="text-[13px] leading-[1.5] m-0 mb-4 max-w-[560px]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        The shaded patch shows everywhere on Earth that shares this city's geodetic ASC + MC pairing.
                        The red dashed line is the MC meridian; the gold curves are the ASC sign boundaries bracketing
                        you above and below.
                    </p>
                    <ReadingGeodeticMap
                        lat={vm.location.lat}
                        lon={vm.location.lon}
                        city={vm.location.city}
                    />
                </div>

                {/* Astrocartography map */}
                {natalForMap && (
                    <div className="mt-6 w-full">
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
                            className="mt-[10px] text-[12.5px] leading-[1.5] font-light text-center max-w-[540px] mx-auto"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            These lines are the chart receipt: where your planets are strongest on Earth near {vm.location.city}.
                        </p>
                    </div>
                )}

                <div className="mt-6">
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
        </TabSection>
    );
}

const ANGLE_TOPIC: Record<"ASC" | "IC" | "DSC" | "MC", string> = {
    ASC: "self",
    IC: "home",
    DSC: "partners",
    MC: "career",
};

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

function PersonalGeodeticHits({
    rows,
    notes,
}: {
    rows: PersonalGeodeticEvidence[];
    notes: Map<string, string>;
}) {
    // Flatten into one row per (planet × anchor). Anchors with no hits
    // are dropped — the methodology paragraph below explains why.
    const flat = rows.flatMap((row) =>
        row.hits.map((hit) => ({ row, hit })),
    );

    if (flat.length === 0) {
        return (
            <p
                className="text-[14.5px] leading-[1.55] m-0 max-w-[560px]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                No planets in your chart sit close to this place's four points.
                The land still has its own flavor, but your chart is not made
                stronger or weaker here.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-[10px]">
            {flat.map(({ row, hit }) => (
                <GeodeticHitRow
                    key={hitKey(hit.planet, row.anchor)}
                    anchor={row.anchor}
                    hit={hit}
                    note={notes.get(hitKey(hit.planet, row.anchor))}
                />
            ))}
        </div>
    );
}

function GeodeticHitRow({
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
    return (
        <article
            className="border p-[clamp(20px,2.6vw,28px)]"
            style={{
                borderColor: "var(--surface-border)",
                background: "var(--bg)",
                borderRadius: "var(--shape-asymmetric-md, 12px)",
            }}
        >
            <header className="mb-2">
                <strong
                    className="block text-[19px] leading-[1.3]"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                >
                    {heading}
                </strong>
            </header>
            <p
                className="m-0 text-[15px] leading-[1.6] max-w-[620px]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {note || fallbackHitNote(hit, anchor, topic)}
            </p>
            <details className="mt-3">
                <summary
                    className="cursor-pointer text-[11px] tracking-[0.14em] uppercase select-none"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    Show details
                </summary>
                <div
                    className="mt-2 text-[12.5px] leading-[1.6]"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-secondary)" }}
                >
                    {capitalize(hit.planet)} · {hit.orbDeg}° from {anchor} · {hit.closeness} · {familyLabel(hit.family)}
                </div>
            </details>
        </article>
    );
}

function fallbackHitNote(
    hit: PersonalGeodeticHit,
    anchor: "ASC" | "IC" | "DSC" | "MC",
    topic: string,
): string {
    const proximity = hit.closeness === "very close" ? "right on" : "close to";
    const feel = hit.family === "gentle"
        ? "Things here may feel easier and warmer."
        : hit.family === "rough"
            ? "Things here may feel harder and more pushy."
            : hit.family === "bright"
                ? "Things here may stand out more than usual."
                : "Things here pick up a mild flavor from this planet.";
    return `${capitalize(hit.planet)} sits ${proximity} your ${topic} point (${anchor}). ${feel}`;
}

function familyLabel(family: PersonalGeodeticHit["family"]): string {
    switch (family) {
        case "gentle": return "gentle planet";
        case "rough": return "rough planet";
        case "bright": return "bright planet";
        default: return "neutral planet";
    }
}

function capitalize(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
