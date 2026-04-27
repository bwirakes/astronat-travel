"use client";

import ChartInteractive from "../ChartInteractive";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    narrativeLoading?: boolean;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

export default function TimingTab({ vm, narrativeLoading }: Props) {
    const renderWindows = () => (
        <div className="flex flex-col gap-[14px]">
            {vm.travelWindows.map((w, i) => {
                const isPrimary = i === 0;
                return (
                    <article
                        key={`${w.dates}-${i}`}
                        className="rounded-[12px] border px-[26px] py-6 flex flex-col gap-2"
                        style={{
                            background: isPrimary
                                ? "color-mix(in oklab, var(--color-spiced-life) 6%, var(--bg))"
                                : "var(--bg)",
                            borderColor: isPrimary
                                ? "var(--color-spiced-life)"
                                : "var(--surface-border)",
                        }}
                    >
                        <div className="flex justify-between items-center gap-3 flex-wrap">
                            <div
                                className="flex items-center gap-[10px] text-[13px] font-medium tracking-[0.02em]"
                                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
                            >
                                <span className="text-base" style={{ color: "var(--color-spiced-life)" }}>
                                    {w.emoji}
                                </span>
                                {w.flavorTitle}
                            </div>
                            {isPrimary && (
                                <span
                                    className="text-[9px] tracking-[0.18em] uppercase px-[10px] py-1 rounded-full border"
                                    style={{
                                        fontFamily: FONT_MONO,
                                        color: "var(--text-tertiary)",
                                        borderColor: "var(--surface-border)",
                                        background: "transparent",
                                    }}
                                >
                                    {vm.travelType === "relocation" ? "Start here" : "Your dates"}
                                </span>
                            )}
                        </div>
                        <div
                            className="mt-1 leading-[1.05] tracking-[-0.015em]"
                            style={{
                                fontFamily: FONT_PRIMARY,
                                fontSize: "clamp(28px, 3.5vw, 38px)",
                                color: "var(--text-primary)",
                            }}
                        >
                            {w.dates}
                        </div>
                        <div
                            className="text-[11px] tracking-[0.12em] uppercase"
                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                        >
                            {w.nights}
                        </div>
                        <p
                            className="text-[15px] leading-[1.55] font-light my-[6px] [text-wrap:pretty]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            {w.note}
                        </p>
                        <div
                            className="h-1 rounded-full overflow-hidden mt-[6px]"
                            style={{ background: "var(--surface-border)" }}
                        >
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${w.score}%`, background: "var(--color-spiced-life)" }}
                            />
                        </div>
                        <div
                            className="text-[10px] tracking-[0.14em] uppercase mt-1"
                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                        >
                            {isPrimary
                                ? (vm.travelType === "relocation" ? "Place baseline score" : "Selected window score")
                                : "Alternate window score"}
                            : <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>{w.score}/100</strong>
                        </div>
                    </article>
                );
            })}
        </div>
    );

    const todoItems = vm.tabs.timing?.activationAdvice?.length
        ? vm.tabs.timing.activationAdvice.map((body) => ({ title: "Activation", body }))
        : vm.todo;

    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <div className="v4-step-num">Timing</div>
                <h2 className="v4-h2">When to use what this place offers.</h2>
                <p className="v4-step-intro">{vm.tabs.timing?.closingVerdict || vm.chrome.monthChartCallout}</p>

                {vm.dailySeries.length > 0 && (
                    <div
                        className="my-[8px] mb-6 px-[18px] pt-4 pb-3 rounded-[8px] border"
                        style={{ background: "var(--bg)", borderColor: "var(--surface-border)" }}
                    >
                        <div
                            className="flex gap-[2px] items-end h-14 w-full"
                            role="img"
                            aria-label="Day-by-day score around your travel dates"
                        >
                            {(() => {
                                const max = Math.max(...vm.dailySeries.map(d => d.score), 1);
                                return vm.dailySeries.map((d) => {
                                    const h = Math.max(8, (d.score / max) * 100);
                                    const tone = d.score >= 75 ? "good" : d.score >= 55 ? "ok" : "low";
                                    const toneStyle =
                                        tone === "good"
                                            ? { background: "var(--color-spiced-life)" }
                                            : tone === "ok"
                                                ? { background: "var(--gold)", opacity: 0.7 }
                                                : { background: "var(--text-tertiary)", opacity: 0.5 };
                                    return (
                                        <div
                                            key={d.iso}
                                            className="flex-1 min-w-[2px] rounded-[1px] transition-opacity hover:opacity-75"
                                            style={{
                                                height: `${h}%`,
                                                outline: d.isAnchor ? "2px solid var(--color-y2k-blue)" : undefined,
                                                outlineOffset: d.isAnchor ? 1 : undefined,
                                                position: d.isAnchor ? "relative" : undefined,
                                                zIndex: d.isAnchor ? 1 : undefined,
                                                ...toneStyle,
                                            }}
                                            title={`${d.iso} · ${d.score}/100`}
                                        />
                                    );
                                });
                            })()}
                        </div>
                        <div
                            className="flex justify-between mt-2 text-[9px] tracking-[0.16em] uppercase"
                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                        >
                            <span>21 days earlier</span>
                            <span>your dates</span>
                            <span>35 days later</span>
                        </div>
                    </div>
                )}

                {renderWindows()}
                <ChartInteractive angles={vm.chart.angles} natal={vm.chart.natal} months={vm.chart.months} />

                <ol className="list-none p-0 m-0 flex flex-col gap-0">
                    {todoItems.map((t, i) => (
                        <li
                            key={i}
                            className="grid grid-cols-[42px_1fr] gap-[18px] py-[22px] items-start border-b last:border-b-0"
                            style={{ borderColor: "var(--surface-border)" }}
                        >
                            <span
                                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-semibold mt-[2px]"
                                style={{
                                    background: "var(--color-spiced-life)",
                                    color: "var(--color-eggshell)",
                                    fontFamily: FONT_BODY,
                                }}
                            >
                                {i + 1}
                            </span>
                            <div>
                                <h4
                                    className="text-[22px] font-normal leading-[1.2] tracking-[-0.005em] m-0 mb-[6px] [text-wrap:balance]"
                                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                                >
                                    {t.title}
                                </h4>
                                <p
                                    className="text-[14px] leading-[1.55] font-light m-0 [text-wrap:pretty]"
                                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                                >
                                    {t.body}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>

                {(vm.astrology.weeks.length > 0 || narrativeLoading) && (
                    <div
                        className="mt-9 pt-6 border-t"
                        style={{ borderColor: "var(--surface-border)" }}
                    >
                        <h3
                            className="text-[18px] tracking-[-0.005em] m-0 mb-[14px]"
                            style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                        >
                            Week by week
                        </h3>
                        {narrativeLoading && vm.astrology.weeks.length === 0 ? (
                            <div className="v4-astro-empty">Loading week-by-week narrative…</div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {vm.astrology.weeks.map((w) => (
                                    <div
                                        key={w.w}
                                        className="px-4 py-[14px] rounded-[8px]"
                                        style={{ background: "var(--surface)" }}
                                    >
                                        <div
                                            className="text-[10px] tracking-[0.14em] uppercase"
                                            style={{ fontFamily: FONT_MONO, color: "var(--color-spiced-life)" }}
                                        >
                                            Week {w.w}{w.range ? ` · ${w.range}` : ""}
                                        </div>
                                        <div
                                            className="text-[18px] tracking-[-0.005em] my-1 mb-[6px]"
                                            style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                                        >
                                            {w.title}
                                        </div>
                                        <p
                                            className="text-[13px] leading-[1.55] font-light m-0 [text-wrap:pretty]"
                                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                                        >
                                            {w.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
