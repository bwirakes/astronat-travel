"use client";

import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    isDark: boolean;
    relocatedWheel: { cusps: number[]; planets: NatalPlanet[] } | null;
}

export default function WhatShiftsTab({ vm, isDark, relocatedWheel }: Props) {
    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <div className="v4-step-num">What Shifts</div>
                <h2 className="v4-h2">What changes when your chart moves here.</h2>
                <p className="v4-step-intro">{vm.chrome.step7Intro}</p>
                <p className="v4-reloc-wheel-caption">Same planets, relocated houses and angles — single wheel at {vm.relocated.travel.place}.</p>
                <div className="v4-reloc-head">
                    <div className="v4-reloc-pole">
                        <div className="v4-reloc-pole-tag">Natal chart</div>
                        <div className="v4-reloc-pole-place">{vm.relocated.birth.place}</div>
                        <div className="v4-reloc-pole-meta">{vm.relocated.birth.coords}</div>
                    </div>
                    <div className="v4-reloc-arrow">→</div>
                    <div className="v4-reloc-pole v4-reloc-pole-active">
                        <div className="v4-reloc-pole-tag">Relocated to</div>
                        <div className="v4-reloc-pole-place">{vm.relocated.travel.place}</div>
                        <div className="v4-reloc-pole-meta">{vm.relocated.travel.coords}</div>
                    </div>
                </div>
                <div className="v4-reloc-block v4-reloc-wheel-wrap">
                    {relocatedWheel ? (
                        <NatalMockupWheel isDark={isDark} planets={relocatedWheel.planets} cusps={relocatedWheel.cusps} />
                    ) : (
                        <p className="v4-astro-empty">Relocated house cusps are not available for this reading.</p>
                    )}
                </div>
                <div className="v4-angles">
                    {vm.relocated.angles.map((a, i) => (
                        <article key={i} className="v4-angle">
                            <div className="v4-angle-head">
                                <div className="v4-angle-name">{a.name}</div>
                                <div className="v4-angle-plain">{a.plain}</div>
                            </div>
                            <div className="v4-angle-shift">
                                <div className="v4-angle-cell"><div className="v4-angle-cell-k">Natally</div><div className="v4-angle-cell-v">{a.natal}</div></div>
                                <div className="v4-angle-cell-arrow">→</div>
                                <div className="v4-angle-cell v4-angle-cell-to"><div className="v4-angle-cell-k">Here</div><div className="v4-angle-cell-v">{a.relocated}</div></div>
                            </div>
                            <p className="v4-angle-delta">{a.delta}</p>
                        </article>
                    ))}
                </div>
                <div className="v4-houses">
                    <div className="v4-houses-thead"><div>Planet</div><div>Back home</div><div>Here</div><div>Outcome</div></div>
                    {vm.relocated.planetsInHouses.map((p, i) => (
                        <div key={i} className="v4-houses-row">
                            <div className="v4-houses-planet"><span className="v4-houses-glyph">{p.glyph}</span><span>{p.planet}</span></div>
                            <div className="v4-houses-cell">{p.natalHouse}</div>
                            <div className="v4-houses-cell v4-houses-to">{p.reloHouse}</div>
                            <div className="v4-houses-shift">{p.shift}</div>
                        </div>
                    ))}
                </div>
                <div className="v4-aspects">
                    {vm.relocated.aspectsToAngles.length === 0 && <div className="v4-astro-empty">No tight aspects to the angles in this relocated chart.</div>}
                    {vm.relocated.aspectsToAngles.map((a, i) => (
                        <article key={i} className={`v4-aspect v4-aspect-${a.strength.replace(/\s/g, "-")}`}>
                            <div className="v4-aspect-head">
                                <div className="v4-aspect-pair"><span className="v4-aspect-glyph">{a.glyph}</span><span className="v4-aspect-planet">{a.planet}</span><span className="v4-aspect-to">→ {a.toAngle}</span></div>
                                <div className="v4-aspect-strength">{a.strength}</div>
                            </div>
                            <div className="v4-aspect-type">{a.aspect}</div>
                            <p className="v4-aspect-plain">{a.plain}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
