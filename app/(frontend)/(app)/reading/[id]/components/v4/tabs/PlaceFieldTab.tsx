"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AcgMap, type NatalData } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import { acgLineRawScore } from "@/app/lib/house-matrix";
import { getOrdinal } from "@/app/lib/astro-wording";
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
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <div className="v4-step-num">Place Field</div>
                <h2 className="v4-h2">The land, then your chart on the land.</h2>
                <p className="v4-step-intro">
                    The outcome comes first: this tab separates what the place always carries from what it does to your birth chart specifically.
                </p>

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

                {/* Personal geodetics list */}
                <div className="my-7">
                    <h3
                        className="font-normal tracking-[-0.01em] leading-[1.15] m-0 mb-2"
                        style={{
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(22px, 2.8vw, 30px)",
                            color: "var(--text-primary)",
                        }}
                    >
                        Personal Geodetics
                    </h3>
                    {vm.scoreNarrative.geodetic.personal.length === 0 ? (
                        <p className="v4-astro-empty">No natal planets sit close to the main geodetic anchors here.</p>
                    ) : vm.scoreNarrative.geodetic.personal.map((entry) => (
                        <article
                            key={`${entry.anchor}-${entry.house}`}
                            className="grid gap-4 items-center mt-[10px] border p-[clamp(20px,2.6vw,28px)] grid-cols-1 sm:grid-cols-[150px_1fr_auto]"
                            style={{
                                borderColor: "var(--surface-border)",
                                background: "var(--bg)",
                                borderRadius: "var(--shape-asymmetric-md, 12px)",
                            }}
                        >
                            <div>
                                <strong
                                    className="block text-[28px]"
                                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                                >
                                    {entry.anchor}
                                </strong>
                                <span
                                    className="text-xs"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    {getOrdinal(entry.house)} house field
                                </span>
                            </div>
                            <p className="m-0" style={{ color: "var(--text-secondary)" }}>
                                {entry.planets.length
                                    ? `${entry.planets.join(", ")} touches this place anchor.`
                                    : "This anchor contributes to the background score."}
                            </p>
                            <span
                                className="font-mono"
                                style={{ fontFamily: FONT_MONO, color: "var(--text-primary)" }}
                            >
                                {entry.bucketScore}/100
                            </span>
                        </article>
                    ))}
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
            </div>
        </section>
    );
}
