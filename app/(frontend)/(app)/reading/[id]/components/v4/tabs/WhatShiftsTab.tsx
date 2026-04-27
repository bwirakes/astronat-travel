"use client";

import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    isDark: boolean;
    relocatedWheel: { cusps: number[]; planets: NatalPlanet[] } | null;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

const ASPECT_LEFT_BORDER: Record<string, string> = {
    "exact": "var(--color-spiced-life)",
    "very-strong": "var(--gold)",
};

export default function WhatShiftsTab({ vm, isDark, relocatedWheel }: Props) {
    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <div className="v4-step-num">What Shifts</div>
                <h2 className="v4-h2">What changes when your chart moves here.</h2>
                <p className="v4-step-intro">{vm.chrome.step7Intro}</p>

                <p
                    className="text-[14px] leading-[1.5] font-light m-0 mb-4 max-w-[560px]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    Same planets, relocated houses and angles — single wheel at {vm.relocated.travel.place}.
                </p>

                {/* Natal → Relocated header */}
                <div className="grid items-stretch my-8 mb-12 gap-5 grid-cols-1 sm:grid-cols-[1fr_40px_1fr]">
                    <PolePill
                        tag="Natal chart"
                        place={vm.relocated.birth.place}
                        coords={vm.relocated.birth.coords}
                    />
                    <div
                        className="flex items-center justify-center text-[28px] sm:rotate-0 rotate-90"
                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-tertiary)" }}
                    >
                        →
                    </div>
                    <PolePill
                        tag="Relocated to"
                        place={vm.relocated.travel.place}
                        coords={vm.relocated.travel.coords}
                        active
                    />
                </div>

                {/* Wheel */}
                <div
                    className="py-8 mx-auto max-w-[720px]"
                >
                    {relocatedWheel ? (
                        <NatalMockupWheel isDark={isDark} planets={relocatedWheel.planets} cusps={relocatedWheel.cusps} />
                    ) : (
                        <p className="v4-astro-empty">Relocated house cusps are not available for this reading.</p>
                    )}
                </div>

                {/* Angle shift cards */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {vm.relocated.angles.map((a, i) => (
                        <article
                            key={i}
                            className="px-[22px] py-5 border rounded-[8px] flex flex-col gap-[14px]"
                            style={{ borderColor: "var(--surface-border)", background: "var(--bg)" }}
                        >
                            <div className="flex justify-between items-baseline gap-3 flex-wrap">
                                <div
                                    className="text-[11px] tracking-[0.18em] uppercase"
                                    style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                                >
                                    {a.name}
                                </div>
                                <div
                                    className="text-[13px] italic font-light"
                                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                                >
                                    {a.plain}
                                </div>
                            </div>
                            <div
                                className="grid items-center gap-2 p-3 rounded-[4px] grid-cols-[1fr_24px_1fr]"
                                style={{ background: "var(--surface)" }}
                            >
                                <div>
                                    <div
                                        className="text-[9px] tracking-[0.16em] uppercase"
                                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                    >
                                        Natally
                                    </div>
                                    <div
                                        className="text-[18px] leading-[1.1] tracking-[-0.005em] mt-[2px]"
                                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                                    >
                                        {a.natal}
                                    </div>
                                </div>
                                <div
                                    className="text-center"
                                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                >
                                    →
                                </div>
                                <div>
                                    <div
                                        className="text-[9px] tracking-[0.16em] uppercase"
                                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                    >
                                        Here
                                    </div>
                                    <div
                                        className="text-[18px] leading-[1.1] tracking-[-0.005em] mt-[2px]"
                                        style={{ fontFamily: FONT_PRIMARY, color: "var(--color-spiced-life)" }}
                                    >
                                        {a.relocated}
                                    </div>
                                </div>
                            </div>
                            <p
                                className="text-[13px] leading-[1.55] font-light m-0 [text-wrap:pretty]"
                                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                            >
                                {a.delta}
                            </p>
                        </article>
                    ))}
                </div>

                {/* Houses table */}
                <div
                    className="mt-8 border rounded-[8px] overflow-hidden"
                    style={{ borderColor: "var(--surface-border)", background: "var(--bg)" }}
                >
                    <div
                        className="grid items-center gap-4 px-[18px] py-[14px] text-[10px] tracking-[0.16em] uppercase grid-cols-[140px_1fr_1fr_1.6fr] hidden sm:grid"
                        style={{
                            background: "var(--surface)",
                            fontFamily: FONT_MONO,
                            color: "var(--text-tertiary)",
                        }}
                    >
                        <div>Planet</div>
                        <div>Back home</div>
                        <div>Here</div>
                        <div>Outcome</div>
                    </div>
                    {vm.relocated.planetsInHouses.map((p, i) => (
                        <div
                            key={i}
                            className="grid items-center gap-4 px-[18px] py-[14px] border-t grid-cols-1 sm:grid-cols-[140px_1fr_1fr_1.6fr]"
                            style={{ borderColor: "var(--surface-border)" }}
                        >
                            <div
                                className="flex items-center gap-[10px] text-[16px]"
                                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                            >
                                <span
                                    className="text-[20px] w-[22px] text-center"
                                    style={{ color: "var(--color-spiced-life)" }}
                                >
                                    {p.glyph}
                                </span>
                                <span>{p.planet}</span>
                            </div>
                            <div
                                className="text-[11px] tracking-[0.04em]"
                                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                            >
                                {p.natalHouse}
                            </div>
                            <div
                                className="text-[11px] tracking-[0.04em] font-medium"
                                style={{ fontFamily: FONT_MONO, color: "var(--text-primary)" }}
                            >
                                {p.reloHouse}
                            </div>
                            <div
                                className="text-[13px] leading-[1.5] font-light [text-wrap:pretty]"
                                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                            >
                                {p.shift}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Aspects to angles */}
                <div className="grid gap-3 mt-8 grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                    {vm.relocated.aspectsToAngles.length === 0 && (
                        <div className="v4-astro-empty">No tight aspects to the angles in this relocated chart.</div>
                    )}
                    {vm.relocated.aspectsToAngles.map((a, i) => {
                        const strengthKey = a.strength.replace(/\s/g, "-");
                        const leftBorder = ASPECT_LEFT_BORDER[strengthKey] ?? "var(--color-y2k-blue)";
                        return (
                            <article
                                key={i}
                                className="px-5 py-[18px] border rounded-[8px] flex flex-col gap-2"
                                style={{
                                    borderColor: "var(--surface-border)",
                                    background: "var(--bg)",
                                    borderLeft: `3px solid ${leftBorder}`,
                                }}
                            >
                                <div className="flex justify-between items-center gap-[10px]">
                                    <div
                                        className="flex items-center gap-2 text-[18px]"
                                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                                    >
                                        <span
                                            className="text-[22px]"
                                            style={{ color: "var(--color-spiced-life)" }}
                                        >
                                            {a.glyph}
                                        </span>
                                        <span>{a.planet}</span>
                                        <span
                                            className="text-[14px]"
                                            style={{ color: "var(--text-tertiary)" }}
                                        >
                                            → {a.toAngle}
                                        </span>
                                    </div>
                                    <div
                                        className="text-[9px] tracking-[0.18em] uppercase px-2 py-1 rounded-full"
                                        style={{
                                            fontFamily: FONT_MONO,
                                            color: "var(--color-spiced-life)",
                                            background: "color-mix(in oklab, var(--color-spiced-life) 10%, transparent)",
                                        }}
                                    >
                                        {a.strength}
                                    </div>
                                </div>
                                <div
                                    className="text-[11px] tracking-[0.06em] lowercase"
                                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                >
                                    {a.aspect}
                                </div>
                                <p
                                    className="text-[14px] leading-[1.55] m-0 mt-1 [text-wrap:pretty]"
                                    style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
                                >
                                    {a.plain}
                                </p>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function PolePill({
    tag,
    place,
    coords,
    active,
}: {
    tag: string;
    place: string;
    coords: string;
    active?: boolean;
}) {
    return (
        <div
            className="px-[22px] py-5 border rounded-[8px] flex flex-col gap-[6px]"
            style={{
                background: "var(--bg)",
                borderColor: active ? "var(--color-spiced-life)" : "var(--surface-border)",
            }}
        >
            <div
                className="text-[10px] tracking-[0.18em] uppercase mb-1"
                style={{
                    fontFamily: FONT_MONO,
                    color: active ? "var(--color-spiced-life)" : "var(--text-tertiary)",
                }}
            >
                {tag}
            </div>
            <div
                className="text-[24px] leading-[1.1] tracking-[-0.01em]"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
            >
                {place}
            </div>
            <div
                className="text-[11px] tracking-[0.04em]"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
            >
                {coords}
            </div>
        </div>
    );
}
