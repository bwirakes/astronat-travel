"use client";

import ChartInteractive from "../ChartInteractive";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    narrativeLoading?: boolean;
}

export default function TimingTab({ vm, narrativeLoading }: Props) {
    const renderWindows = () => (
        <div className="v4-windows">
            {vm.travelWindows.map((w, i) => (
                <article key={`${w.dates}-${i}`} className={`v4-win${i === 0 ? " v4-win-primary" : ""}`}>
                    <div className="v4-win-head">
                        <div className="v4-win-flavor"><span className="v4-win-emoji">{w.emoji}</span>{w.flavorTitle}</div>
                        {i === 0 && <span className="v4-win-pill v4-win-pill-your">{vm.travelType === "relocation" ? "Start here" : "Your dates"}</span>}
                    </div>
                    <div className="v4-win-dates">{w.dates}</div>
                    <div className="v4-win-nights">{w.nights}</div>
                    <p className="v4-win-reason">{w.note}</p>
                    <div className="v4-win-meter"><div className="v4-win-meter-fill" style={{ width: `${w.score}%` }} /></div>
                    <div className="v4-win-score">
                        {i === 0
                            ? (vm.travelType === "relocation" ? "Place baseline score" : "Selected window score")
                            : "Alternate window score"}: <strong>{w.score}/100</strong>
                    </div>
                </article>
            ))}
        </div>
    );

    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <div className="v4-step-num">Timing</div>
                <h2 className="v4-h2">When to use what this place offers.</h2>
                <p className="v4-step-intro">{vm.tabs.timing?.closingVerdict || vm.chrome.monthChartCallout}</p>
                {vm.dailySeries.length > 0 && (
                    <div className="v4-daily">
                        <div className="v4-daily-strip" role="img" aria-label="Day-by-day score around your travel dates">
                            {(() => {
                                const max = Math.max(...vm.dailySeries.map(d => d.score), 1);
                                return vm.dailySeries.map((d) => {
                                    const h = Math.max(8, (d.score / max) * 100);
                                    const tone = d.score >= 75 ? "good" : d.score >= 55 ? "ok" : "low";
                                    return <div key={d.iso} className={`v4-daily-bar v4-daily-${tone}${d.isAnchor ? " v4-daily-anchor" : ""}`} style={{ height: `${h}%` }} title={`${d.iso} · ${d.score}/100`} />;
                                });
                            })()}
                        </div>
                        <div className="v4-daily-axis"><span>21 days earlier</span><span>your dates</span><span>35 days later</span></div>
                    </div>
                )}
                {renderWindows()}
                <ChartInteractive angles={vm.chart.angles} natal={vm.chart.natal} months={vm.chart.months} />
                <ol className="v4-todo">
                    {(vm.tabs.timing?.activationAdvice?.length
                        ? vm.tabs.timing.activationAdvice.map((body) => ({ title: "Activation", body }))
                        : vm.todo
                    ).map((t, i) => (
                        <li key={i}><span className="v4-todo-n">{i + 1}</span><div><h4 className="v4-todo-h">{t.title}</h4><p className="v4-todo-b">{t.body}</p></div></li>
                    ))}
                </ol>
                {(vm.astrology.weeks.length > 0 || narrativeLoading) && (
                    <div className="v4-weeks-block">
                        <h3 className="v4-weeks-h">Week by week</h3>
                        {narrativeLoading && vm.astrology.weeks.length === 0 ? (
                            <div className="v4-astro-empty">Loading week-by-week narrative…</div>
                        ) : (
                            <div className="v4-astro-weeks">
                                {vm.astrology.weeks.map((w) => (
                                    <div key={w.w} className="v4-astro-week">
                                        <div className="v4-astro-week-h">Week {w.w}{w.range ? ` · ${w.range}` : ""}</div>
                                        <div className="v4-astro-week-t">{w.title}</div>
                                        <p className="v4-astro-week-b">{w.body}</p>
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
