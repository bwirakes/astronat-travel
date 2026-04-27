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

export default function PlaceFieldTab({ vm, natalForMap, birthIso, reading, relocatedAcgLines }: Props) {
    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <div className="v4-step-num">Place Field</div>
                <h2 className="v4-h2">The land, then your chart on the land.</h2>
                <p className="v4-step-intro">
                    The outcome comes first: this tab separates what the place always carries from what it does to your birth chart specifically.
                </p>
                {vm.geodetic && (
                    <div className="v4-geodetic">
                        <div className="v4-geodetic-kicker">
                            <span className="v4-geodetic-tag">Overall Geodetics</span>
                            <span className="v4-geodetic-meta">{vm.geodetic.longitudeRange}</span>
                        </div>
                        <h3 className="v4-geodetic-h">{vm.location.city} sits in {vm.geodetic.sign}<span className="v4-geodetic-flavor"> — {vm.geodetic.flavor}.</span></h3>
                        <p className="v4-geodetic-note">{vm.geodetic.note}</p>
                    </div>
                )}

                <div className="v4-personal-geodetic">
                    <h3 className="v4-reloc-h">Personal Geodetics</h3>
                    {vm.scoreNarrative.geodetic.personal.length === 0 ? (
                        <p className="v4-astro-empty">No natal planets sit close to the main geodetic anchors here.</p>
                    ) : vm.scoreNarrative.geodetic.personal.map((entry) => (
                        <article key={`${entry.anchor}-${entry.house}`} className="v4-personal-geo-card">
                            <div>
                                <strong>{entry.anchor}</strong>
                                <span>{getOrdinal(entry.house)} house field</span>
                            </div>
                            <p>
                                {entry.planets.length
                                    ? `${entry.planets.join(", ")} touches this place anchor.`
                                    : "This anchor contributes to the background score."}
                            </p>
                            <span className="v4-personal-geo-score">{entry.bucketScore}/100</span>
                        </article>
                    ))}
                </div>

                {natalForMap && (
                    <div className="v4-acg-map-wrap">
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
                        <p className="v4-acg-map-hint">
                            These lines are the chart receipt: where your planets are strongest on Earth near {vm.location.city}.
                        </p>
                    </div>
                )}

                <div className="v4-lines-card">
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
