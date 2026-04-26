"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AppNavbar from "@/app/components/AppNavbar";
import { BackButton } from "@/components/app/back-button";
import UpsellCelebrationCard from "@/app/components/UpsellCelebrationCard";
import { toV4ViewModel } from "@/app/lib/reading-viewmodel";

function ordinalSuffix(n: number): string {
    const s = n % 100;
    if (s >= 11 && s <= 13) return "th";
    switch (n % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
}
import ChartInteractive from "./ChartInteractive";
import RelocationBiWheel from "./RelocationBiWheel";
import "./v4.css";

interface Props {
    reading: any;
    narrative?: any;
    narrativeLoading?: boolean;
    showUpsell?: boolean;
    paramId?: string;
}

/**
 * V4 "101" — first-time-friendly reading view.
 * Replaces TeacherReadingView for the default astrocartography reading.
 * Renders 7 progressive-disclosure steps fed by toV4ViewModel.
 */
export default function HundredOneReadingView({ reading, narrative, narrativeLoading, showUpsell, paramId }: Props) {
    const vm = useMemo(() => toV4ViewModel(reading, narrative), [reading, narrative]);
    const [openedAstro, setOpenedAstro] = useState(false);

    return (
        <>
            <AppNavbar />
            <div className="v4-root">
                <div style={{ padding: "16px 24px 0", maxWidth: 720, margin: "0 auto" }}>
                    <BackButton />
                </div>

                {/* STEP 1 — One answer */}
                <section className="v4-step v4-step-hero">
                    <div className="v4-step-inner v4-step-inner-narrow">
                        <div className="v4-kicker">A reading for {vm.location.city}</div>
                        <h1 className="v4-answer">
                            {vm.travelType === "relocation"
                                ? <>Moving to <span className="v4-answer-dates">{vm.location.city}</span>{vm.travelDateISO ? <> on <span className="v4-answer-dates">{vm.hero.bestWindow?.dates ?? "—"}</span></> : null}.</>
                                : <>Your dates: <span className="v4-answer-dates">{vm.hero.bestWindow?.dates ?? "—"}</span>.</>
                            }
                        </h1>
                        <p className="v4-answer-why">{vm.hero.explainer}</p>
                        <div className="v4-answer-stat">
                            <div className="v4-answer-score">
                                <div className="v4-bar">
                                    <div className="v4-bar-fill" style={{ width: `${vm.hero.bestWindow?.score ?? 0}%` }} />
                                </div>
                                <div className="v4-bar-labels">
                                    <span>{vm.travelType === "relocation" ? "how well this place matches you" : "how well it matches you"}</span>
                                    <span className="v4-bar-num">{vm.hero.bestWindow?.score ?? 0}/100</span>
                                </div>
                            </div>
                        </div>
                        <div className="v4-scroll-hint">
                            <span>keep reading</span>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <path d="M7 2V12M3 8L7 12L11 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                </section>

                {/* STEP 2 — Other windows (skipped entirely for relocation) */}
                {vm.travelType !== "relocation" && (
                    <section className="v4-step">
                        <div className="v4-step-inner">
                            <div className="v4-step-num">02</div>
                            <h2 className="v4-h2">If you can shift your dates.</h2>
                            <p className="v4-step-intro">
                                {vm.travelWindows.length > 1
                                    ? "Here's how nearby weeks score for you in this city — same chart, same destination, different transits. If your calendar is flexible, this shows you whether shifting helps."
                                    : "We found one strong window. As more transits develop, additional windows will appear here."}
                            </p>
                            <div className="v4-windows">
                                {(() => {
                                    // The pill goes on the genuinely highest-scoring alternate, not on
                                    // card 0. We only flag a winner if it beats the user's chosen dates
                                    // by at least RECOMMENDATION_MARGIN points — otherwise the variation
                                    // is noise and we don't push the user away from their pick.
                                    const RECOMMENDATION_MARGIN = 3;
                                    const userScore = vm.travelWindows[0]?.score ?? 0;
                                    let bestIdx = -1;
                                    let bestScore = userScore + RECOMMENDATION_MARGIN - 1;
                                    vm.travelWindows.forEach((w, i) => {
                                        if (i === 0) return;
                                        if (w.score >= bestScore + 1) { bestIdx = i; bestScore = w.score; }
                                    });
                                    return vm.travelWindows.map((w, i) => {
                                        const isYour = i === 0;
                                        const isWinner = i === bestIdx;
                                        const delta = isWinner ? w.score - userScore : 0;
                                        return (
                                            <article key={i} className={`v4-win${isYour ? " v4-win-primary" : ""}${isWinner ? " v4-win-winner" : ""}`}>
                                                <div className="v4-win-head">
                                                    <div className="v4-win-flavor">
                                                        <span className="v4-win-emoji">{w.emoji}</span>
                                                        {w.flavorTitle}
                                                    </div>
                                                    {isYour && <span className="v4-win-pill v4-win-pill-your">Your dates</span>}
                                                    {isWinner && <span className="v4-win-pill">Higher match · +{delta}</span>}
                                                </div>
                                                <div className="v4-win-dates">{w.dates}</div>
                                                <div className="v4-win-nights">{w.nights}</div>
                                                <p className="v4-win-reason">{w.note}</p>
                                                <div className="v4-win-meter">
                                                    <div className="v4-win-meter-fill" style={{ width: `${w.score}%` }} />
                                                </div>
                                                <div className="v4-win-score">
                                                    Matches your chart: <strong>{w.score}/100</strong>
                                                </div>
                                            </article>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </section>
                )}

                {/* STEP 3 — Why this place */}
                <section className="v4-step v4-step-tint">
                    <div className="v4-step-inner">
                        <div className="v4-step-num">03</div>
                        <h2 className="v4-h2">Why {vm.location.city}, for you.</h2>
                        <p className="v4-step-intro">{vm.chrome.step3Intro}</p>
                        <div className="v4-vibes">
                            {vm.vibes.map((v, i) => (
                                <div key={i} className="v4-vibe">
                                    <div className="v4-vibe-icon">{v.icon}</div>
                                    <h3 className="v4-vibe-title">{v.title}</h3>
                                    <p className="v4-vibe-body" dangerouslySetInnerHTML={{ __html: v.body }} />
                                    {v.houseAttribution && v.houseAttribution.length > 0 && (
                                        <div className="v4-vibe-attribution">
                                            <span className="v4-vibe-attr-label">Driven by</span>
                                            {v.houseAttribution.map((h, j) => (
                                                <span key={j} className="v4-vibe-attr-house">
                                                    <strong>{h.house}{ordinalSuffix(h.house)}</strong>
                                                    <span className="v4-vibe-attr-topic">· {h.topic}</span>
                                                    <span className="v4-vibe-attr-score">{h.score}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* STEP 4 — Month by month */}
                <section className="v4-step">
                    <div className="v4-step-inner">
                        <div className="v4-step-num">04</div>
                        <h2 className="v4-h2">Month by month.</h2>
                        <p className="v4-step-intro">
                            Here's the actual reason some months are better than others — shown on your chart, in plain English. Pick a month, then hover the dots and lines to see what's doing the work.
                        </p>
                        <ChartInteractive
                            angles={vm.chart.angles}
                            natal={vm.chart.natal}
                            months={vm.chart.months}
                        />
                        <div className="v4-callout">
                            <div className="v4-callout-icon">i</div>
                            <p>{vm.callout}</p>
                        </div>
                    </div>
                </section>

                {/* STEP 5 — What to do with this */}
                <section className="v4-step v4-step-tint">
                    <div className="v4-step-inner">
                        <div className="v4-step-num">05</div>
                        <h2 className="v4-h2">What to do with this.</h2>
                        <ol className="v4-todo">
                            {vm.todo.map((t, i) => (
                                <li key={i}>
                                    <span className="v4-todo-n">{i + 1}</span>
                                    <div>
                                        <h4 className="v4-todo-h">{t.title}</h4>
                                        <p className="v4-todo-b">{t.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* STEP 6 — Optional astrology */}
                <section className="v4-step">
                    <div className="v4-step-inner">
                        <div className="v4-step-num">06</div>
                        <button
                            className={`v4-reveal${openedAstro ? " open" : ""}`}
                            onClick={() => setOpenedAstro(o => !o)}
                            aria-expanded={openedAstro}
                        >
                            <div>
                                <div className="v4-reveal-kicker">Optional · advanced</div>
                                <h2 className="v4-h2 v4-reveal-h">Want the astrology behind this?</h2>
                                <p className="v4-reveal-sub">Planetary lines and the week-by-week readout. Useful if you already read charts — skip if not.</p>
                            </div>
                            <span className="v4-reveal-icon">{openedAstro ? "—" : "+"}</span>
                        </button>

                        {openedAstro && (
                            <div className="v4-astro">
                                <div>
                                    <h3 className="v4-astro-h">Planetary lines near {vm.location.city}</h3>
                                    {vm.astrology.lines.length === 0 ? (
                                        <div className="v4-astro-empty">No close planetary lines for this destination.</div>
                                    ) : (
                                        <div className="v4-astro-lines">
                                            {vm.astrology.lines.map((l, i) => (
                                                <div key={i} className="v4-astro-line">
                                                    <span className="v4-astro-glyph" style={{ color: l.color }}>{l.glyph}</span>
                                                    <div>
                                                        <div className="v4-astro-line-title">
                                                            {l.planet} on {l.angle} <span className="v4-astro-line-dist">· {l.distKm === 0 ? "exact" : `${l.distKm}km`}</span>
                                                        </div>
                                                        <div className="v4-astro-line-note">{l.note}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="v4-astro-h">Week by week</h3>
                                    {narrativeLoading && vm.astrology.weeks.length === 0 ? (
                                        <div className="v4-astro-empty">Loading week-by-week narrative…</div>
                                    ) : vm.astrology.weeks.length === 0 ? (
                                        <div className="v4-astro-empty">Weekly narrative will appear here as it generates.</div>
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
                            </div>
                        )}
                    </div>
                </section>

                {/* STEP 7 — Relocated chart */}
                <section className="v4-step v4-step-tint">
                    <div className="v4-step-inner">
                        <div className="v4-step-num">07</div>
                        <h2 className="v4-h2">Your chart, relocated to {vm.location.city}.</h2>
                        <p className="v4-step-intro">{vm.chrome.step7Intro}</p>

                        <div className="v4-reloc-head">
                            <div className="v4-reloc-pole">
                                <div className="v4-reloc-pole-tag">Natal chart</div>
                                <div className="v4-reloc-pole-place">{vm.relocated.birth.place}</div>
                                <div className="v4-reloc-pole-meta">{vm.relocated.birth.coords}</div>
                                <div className="v4-reloc-pole-meta">{vm.relocated.birth.date}</div>
                            </div>
                            <div className="v4-reloc-arrow">→</div>
                            <div className="v4-reloc-pole v4-reloc-pole-active">
                                <div className="v4-reloc-pole-tag">Relocated to</div>
                                <div className="v4-reloc-pole-place">{vm.relocated.travel.place}</div>
                                <div className="v4-reloc-pole-meta">{vm.relocated.travel.coords}</div>
                                <div className="v4-reloc-pole-meta">{vm.relocated.travel.window}</div>
                            </div>
                        </div>

                        <div className="v4-reloc-block" style={{ marginTop: "3rem", marginBottom: "3rem" }}>
                            <RelocationBiWheel 
                                natalPlanets={vm.chart.natal}
                                natalAnglesDeg={vm.relocated.natalAnglesDeg}
                                relocatedAnglesDeg={vm.relocated.relocatedAnglesDeg}
                                natalCuspsDeg={vm.relocated.natalCuspsDeg}
                                relocatedCuspsDeg={vm.relocated.relocatedCuspsDeg}
                            />
                        </div>

                        <div className="v4-reloc-block">
                            <h3 className="v4-reloc-h">{vm.chrome.step7AnglesSub}</h3>
                            <p className="v4-reloc-sub">These are the "corners" of your chart. They're why places <em>feel</em> different — they set the stage for everything else.</p>
                            <div className="v4-angles">
                                {vm.relocated.angles.map((a, i) => (
                                    <article key={i} className="v4-angle">
                                        <div className="v4-angle-head">
                                            <div className="v4-angle-name">{a.name}</div>
                                            <div className="v4-angle-plain">{a.plain}</div>
                                        </div>
                                        <div className="v4-angle-shift">
                                            <div className="v4-angle-cell">
                                                <div className="v4-angle-cell-k">Natally</div>
                                                <div className="v4-angle-cell-v">{a.natal}</div>
                                            </div>
                                            <div className="v4-angle-cell-arrow">→</div>
                                            <div className="v4-angle-cell v4-angle-cell-to">
                                                <div className="v4-angle-cell-k">In {vm.location.city}</div>
                                                <div className="v4-angle-cell-v">{a.relocated}</div>
                                            </div>
                                        </div>
                                        <p className="v4-angle-delta">{a.delta}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="v4-reloc-block">
                            <h3 className="v4-reloc-h">{vm.chrome.step7HousesSub}</h3>
                            <p className="v4-reloc-sub">
                                "Houses" are twelve areas of life — self, home, work, relationships, etc. When you move, each planet activates a different house. That's why the same life can feel <em>differently organized</em> in a different place.
                            </p>
                            <div className="v4-houses">
                                <div className="v4-houses-thead">
                                    <div>Planet</div>
                                    <div>Back home</div>
                                    <div>In {vm.location.city}</div>
                                    <div>What it means</div>
                                </div>
                                {vm.relocated.planetsInHouses.map((p, i) => (
                                    <div key={i} className="v4-houses-row">
                                        <div className="v4-houses-planet">
                                            <span className="v4-houses-glyph">{p.glyph}</span>
                                            <span>{p.planet}</span>
                                        </div>
                                        <div className="v4-houses-cell">{p.natalHouse}</div>
                                        <div className="v4-houses-cell v4-houses-to">{p.reloHouse}</div>
                                        <div className="v4-houses-shift">{p.shift}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="v4-reloc-block">
                            <h3 className="v4-reloc-h">{vm.chrome.step7AspectsSub}</h3>
                            <p className="v4-reloc-sub">
                                An "aspect" is a geometric tie between a planet and one of the four corners. The tighter the angle, the more you'll feel it. Here are the big ones in your relocated chart:
                            </p>
                            <div className="v4-aspects">
                                {vm.relocated.aspectsToAngles.length === 0 && (
                                    <div className="v4-astro-empty">No tight aspects to the angles in this relocated chart.</div>
                                )}
                                {vm.relocated.aspectsToAngles.map((a, i) => (
                                    <article key={i} className={`v4-aspect v4-aspect-${a.strength.replace(/\s/g, "-")}`}>
                                        <div className="v4-aspect-head">
                                            <div className="v4-aspect-pair">
                                                <span className="v4-aspect-glyph">{a.glyph}</span>
                                                <span className="v4-aspect-planet">{a.planet}</span>
                                                <span className="v4-aspect-to">→ {a.toAngle}</span>
                                            </div>
                                            <div className="v4-aspect-strength">{a.strength}</div>
                                        </div>
                                        <div className="v4-aspect-type">{a.aspect}</div>
                                        <p className="v4-aspect-plain">{a.plain}</p>
                                        <p className="v4-aspect-was">
                                            <span className="v4-aspect-was-k">vs. natal · </span>{a.wasNatal}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="v4-reloc-block">
                            <h3 className="v4-reloc-h">Key terms, briefly.</h3>
                            <dl className="v4-glossary">
                                {vm.relocated.glossary.map((g, i) => (
                                    <div key={i} className="v4-glossary-row">
                                        <dt>
                                            <Link href={g.href} className="v4-glossary-link">{g.term} →</Link>
                                        </dt>
                                        <dd>{g.def}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="v4-learn-more">
                                {vm.relocated.learnMore.map((l, i) => (
                                    <Link key={i} href={l.href}>{l.label}</Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {showUpsell && (
                    <section className="v4-step">
                        <div className="v4-step-inner">
                            <UpsellCelebrationCard />
                        </div>
                    </section>
                )}

                <footer className="v4-foot">
                    <div className="v4-step-inner">
                        <p className="v4-foot-text">
                            This reading was made for you specifically, based on your birth details and your chart's relationship to this place. Read it again when plans are more concrete.
                        </p>
                        <div className="v4-foot-meta">
                            Generated {vm.generated} · {vm.location.city}
                            {vm.location.region ? `, ${vm.location.region}` : ""}
                            {paramId ? ` · ${paramId.slice(0, 8)}` : ""}
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
