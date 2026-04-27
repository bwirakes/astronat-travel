"use client";

import { Button } from "@/app/components/ui/button";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    copiedTab: V4VM["tabs"]["copy"][keyof V4VM["tabs"]["copy"]] | undefined;
    selectTab: (id: string, scrollToPanels?: boolean) => void;
}

export default function OverviewTab({ vm, copiedTab, selectTab }: Props) {
    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
    const leanInto = vm.tabs.overview?.leanInto ?? [];
    const watchOut = vm.tabs.overview?.watchOut ?? [];

    const renderOverviewWindows = () => (
        <ul className="v4-overview-window-list">
            {vm.travelWindows.slice(0, 3).map((w, i) => (
                <li key={`${w.dates}-${i}`} className={i === 0 ? "is-primary" : ""}>
                    <span className="v4-overview-window-dates">{w.dates}</span>
                    <span className="v4-overview-window-copy">{w.flavorTitle} · {w.note}</span>
                </li>
            ))}
        </ul>
    );

    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <section className="v4-overview-hero-summary">
                    <div className={`v4-kicker v4-verdict v4-verdict-${vm.hero.verdict.band}`}>
                        <span className="v4-verdict-label">{vm.hero.verdict.label}</span>
                        <span className="v4-verdict-sep">·</span>
                        <span className="v4-verdict-city">{vm.location.city}</span>
                    </div>
                    <h1 className="v4-answer">
                        {vm.travelType === "relocation"
                            ? <>Moving to <span className="v4-answer-dates">{vm.location.city}</span>{vm.travelDateISO ? <> on <span className="v4-answer-dates">{vm.hero.bestWindow?.dates ?? "—"}</span></> : null}.</>
                            : <>Your dates: <span className="v4-answer-dates">{vm.hero.bestWindow?.dates ?? "—"}</span>.</>
                        }
                    </h1>
                    <p className="v4-answer-why">{vm.hero.explainer}</p>
                    <div className="v4-answer-stat">
                        <div className="v4-answer-score v4-answer-score-wide">
                            <div className="v4-bar">
                                <div className="v4-bar-fill" style={{ width: `${vm.hero.bestWindow?.score ?? 0}%` }} />
                            </div>
                            <div className="v4-bar-labels">
                                <span>{vm.travelType === "relocation" ? "Place baseline score" : "Selected window score"}</span>
                                <span className="v4-bar-num">{vm.hero.bestWindow?.score ?? 0}/100</span>
                            </div>
                            {vm.hero.baselineContext && (
                                <div className="v4-bar-context">
                                    {vm.travelType === "trip" ? `Place baseline: ${vm.hero.baselineScore}/100 · ` : ""}
                                    {vm.hero.baselineContext}
                                </div>
                            )}
                        </div>
                    </div>

                    {vm.hero.betterAlternate && (
                        <div className="v4-hero-cta-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="v4-hero-primary-cta"
                                onClick={() => selectTab("timing", true)}
                            >
                                Try {vm.hero.betterAlternate.dates} — alternate window score {vm.hero.betterAlternate.score}/100 (+{vm.hero.betterAlternate.delta})
                            </Button>
                            <p className="v4-hero-cta-hint">Opens the Timing tab with windows and the month chart.</p>
                        </div>
                    )}

                    {!vm.hero.betterAlternate && vm.hero.maximizeAdvice && (
                        <div className="v4-hero-cta-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="v4-hero-primary-cta"
                                onClick={() => selectTab("timing", true)}
                            >
                                {vm.hero.maximizeAdvice}
                            </Button>
                        </div>
                    )}
                </section>

                {copiedTab?.lead && (
                    <section className="v4-tab-editor v4-tab-editor-in-overview">
                        <p className="v4-tab-lead">{copiedTab.lead}</p>
                        {copiedTab.plainEnglishSummary && (
                            <p className="v4-tab-summary">{copiedTab.plainEnglishSummary}</p>
                        )}
                    </section>
                )}

                <div className="v4-step-num">Overview</div>
                <h2 className="v4-h2">{selectedGoal ? `${vm.location.city} for ${selectedGoal.label}.` : `What ${vm.location.city} supports.`}</h2>
                <p className="v4-step-intro">
                    {vm.tabs.overview?.scoreExplanation || vm.hero.explainer}
                </p>

                <div className="v4-overview-grid">
                    <article className="v4-overview-score">
                        <div className="v4-overview-score-num">{vm.hero.baselineScore || vm.hero.bestWindow?.score}<span>/100</span></div>
                        <div className="v4-overview-score-label">Place baseline score</div>
                        {selectedGoal && (
                            <div className="v4-overview-goal">
                                <strong>{selectedGoal.score}/100</strong> for {selectedGoal.label}
                                <p>{vm.tabs.overview?.goalExplanation || selectedGoal.outcome}</p>
                            </div>
                        )}
                    </article>

                    <article className="v4-overview-card v4-overview-card-strong">
                        <h3>Strongest Themes</h3>
                        {vm.scoreNarrative.strongestThemes.map((theme) => (
                            <div key={theme.id} className="v4-theme-row">
                                <span>{theme.label}</span>
                                <strong>{theme.score}</strong>
                            </div>
                        ))}
                    </article>

                    <article className="v4-overview-card v4-overview-card-muted">
                        <h3>Less Emphasized</h3>
                        {vm.scoreNarrative.lessEmphasized.map((theme) => (
                            <div key={theme.id} className="v4-theme-row">
                                <span>{theme.label}</span>
                                <strong>{theme.score}</strong>
                            </div>
                        ))}
                    </article>
                </div>

                <div className="v4-support-grid">
                    <article className="v4-support-card v4-support-good">
                        <h3>Lean Into</h3>
                        <ul>{leanInto.slice(0, 4).map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </article>
                    <article className="v4-support-card v4-support-watch">
                        <h3>Watch Out For</h3>
                        <ul>{watchOut.slice(0, 4).map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </article>
                </div>

                <div className="v4-overview-windows">
                    <h3 className="v4-reloc-h">Travel Windows</h3>
                    {renderOverviewWindows()}
                </div>
            </div>
        </section>
    );
}
