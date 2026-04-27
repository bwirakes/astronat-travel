"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "@/app/components/AppNavbar";
import { BackButton } from "@/components/app/back-button";
import UpsellCelebrationCard from "@/app/components/UpsellCelebrationCard";
import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { toV4ViewModel } from "@/app/lib/reading-viewmodel";
import { acgLineRawScore } from "@/app/lib/house-matrix";
import { getOrdinal } from "@/app/lib/astro-wording";
import { READING_TAB_IDS, type ReadingTabId } from "@/app/lib/reading-tabs";
import { AcgMap, type NatalData } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import ChartInteractive from "./ChartInteractive";
import "./v4.css";

const MAP_PLANET_NAMES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;

function useIsDark(): boolean {
    const [isDark, setIsDark] = useState(true);
    useEffect(() => {
        const read = () => setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
        read();
        const obs = new MutationObserver(read);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        return () => obs.disconnect();
    }, []);
    return isDark;
}

function relocatedWheelFromVm(vm: ReturnType<typeof toV4ViewModel>): { cusps: number[]; planets: NatalPlanet[] } | null {
    const cusps = vm.relocated.relocatedCuspsDeg;
    if (!Array.isArray(cusps) || cusps.length !== 12 || !cusps.every((c) => typeof c === "number" && Number.isFinite(c))) {
        return null;
    }
    const planets: NatalPlanet[] = vm.chart.natal.map((cp) => ({
        planet: cp.p,
        longitude: cp.deg,
        sign: cp.sign,
        degree: cp.degree,
        house: cp.relocatedHouse ?? cp.natalHouse,
        implication: cp.relocatedHouse
            ? `House ${cp.relocatedHouse} here · ${cp.plain}`
            : cp.plain,
    }));
    return { cusps, planets };
}

interface Props {
    reading: any;
    narrative?: any;
    narrativeLoading?: boolean;
    showUpsell?: boolean;
    paramId?: string;
}

function validHouseCusps(cusps: unknown): number[] | null {
    return Array.isArray(cusps) && cusps.length === 12 ? cusps : null;
}

/** Build the AcgMap NatalData shape from a persisted reading. Missing planets
 *  are omitted; AcgMap's fallback skips gaps when drawing. */
function buildNatalDataForMap(reading: any): NatalData | null {
    const planets: any[] = reading?.natalPlanets || [];
    if (!planets.length) return null;

    function findPlanet(name: string): any | undefined {
        return planets.find((planet) => String(planet.name || planet.planet || "").toLowerCase() === name);
    }

    function point(name: string): { longitude: number; retrograde: boolean } | null {
        const planet = findPlanet(name);
        if (!planet || typeof planet.longitude !== "number") return null;
        return { longitude: planet.longitude, retrograde: !!planet.retrograde };
    }

    const built: any = {};
    let realCount = 0;
    for (const k of MAP_PLANET_NAMES) {
        const v = point(k);
        if (v) {
            built[k] = v;
            realCount++;
        }
    }
    // We need at least Sun + Moon + 3 others to produce a meaningful map.
    if (realCount < 5) return null;
    const chiron = point("chiron");
    if (chiron) built.chiron = chiron;
    built.houses = validHouseCusps(reading?.relocatedCusps)
        ?? validHouseCusps(reading?.natalCusps)
        ?? new Array(12).fill(0);
    return built as NatalData;
}

/** Robust ISO builder. Handles "HH:MM", "HH:MM:SS", "HH:MM AM", "HH:MM PM"
 *  and their lowercase variants. Returns undefined when the date is missing
 *  or the resulting Date is invalid. */
function buildBirthIso(reading: any): string | undefined {
    const b = reading?.birth || {};
    const date: string | undefined = b.date || reading?.birthDate;
    if (!date) return undefined;

    const rawTime: string = (b.time || reading?.birthTime || "12:00").toString().trim();
    const time24 = (() => {
        // Already 24h "HH:MM" or "HH:MM:SS"
        const m24 = rawTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (m24) {
            const hh = String(Math.min(23, Math.max(0, parseInt(m24[1], 10)))).padStart(2, "0");
            const mm = m24[2];
            const ss = m24[3] || "00";
            return `${hh}:${mm}:${ss}`;
        }
        // 12h "HH:MM AM/PM"
        const m12 = rawTime.match(/^(\d{1,2}):(\d{2})\s*([AaPp])\.?\s*[Mm]\.?$/);
        if (m12) {
            let h = parseInt(m12[1], 10) % 12;
            if (m12[3].toLowerCase() === "p") h += 12;
            return `${String(h).padStart(2, "0")}:${m12[2]}:00`;
        }
        return "12:00:00";
    })();

    const d = new Date(`${date}T${time24}Z`);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

/**
 * V4 "101" — first-time-friendly reading view.
 * Tabbed flow with score traceability: hero, shadcn Tabs,
 * relocated single-ring wheel (NatalMockupWheel) + tables as receipt.
 */
export default function HundredOneReadingView({ reading, narrative, narrativeLoading, showUpsell, paramId }: Props) {
    const vm = useMemo(() => toV4ViewModel(reading, narrative), [reading, narrative]);
    const natalForMap = useMemo(() => buildNatalDataForMap(reading), [reading]);
    const birthIso = useMemo(() => buildBirthIso(reading), [reading]);
    const isDark = useIsDark();
    const panelsRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<ReadingTabId>(vm.tabs.definitions[0]?.id ?? "overview");
    const relocatedWheel = useMemo(() => relocatedWheelFromVm(vm), [vm]);
    const relocatedAcgLines = useMemo(() => {
        // Empty arrays are truthy in JS, so a `||` chain stops at the first
        // empty source. page.tsx normalizes userPlanetaryLines to [] when
        // missing, which would shadow a populated planetaryLines / acgLines.
        // Pick the first source that actually has content.
        const candidates = [
            reading?.userPlanetaryLines,
            reading?.planetaryLines,
            reading?.acgLines,
        ];
        for (const c of candidates) {
            if (Array.isArray(c) && c.length > 0) return c;
        }
        return [];
    }, [reading]);
    const copiedTab = vm.tabs.copy[activeTab];

    useEffect(() => {
        const readHash = () => {
            const id = window.location.hash.replace(/^#/, "") as ReadingTabId;
            if (READING_TAB_IDS.includes(id)) setActiveTab(id);
        };
        readHash();
        window.addEventListener("hashchange", readHash);
        return () => window.removeEventListener("hashchange", readHash);
    }, []);

    function selectTab(id: string, scrollToPanels?: boolean) {
        if (!READING_TAB_IDS.includes(id as ReadingTabId)) return;
        setActiveTab(id as ReadingTabId);
        if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `#${id}`);
        }
        if (scrollToPanels && panelsRef.current) {
            requestAnimationFrame(() => {
                panelsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
    }

    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
    const themeBars = vm.scoreNarrative.themes.length
        ? vm.scoreNarrative.themes
        : [...vm.scoreNarrative.strongestThemes, ...vm.scoreNarrative.lessEmphasized];
    const leanInto = vm.tabs.overview?.leanInto ?? [];
    const watchOut = vm.tabs.overview?.watchOut ?? [];

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

    const renderAcg = () => (
        <>
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
        </>
    );

    return (
        <>
            <AppNavbar />
            <div className="v4-root">
                <div className="v4-back-wrap">
                    <BackButton />
                </div>

                <section className="v4-reading-shell" aria-label="Reading content">
                    <div className="v4-step-inner v4-reading-shell-inner">
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => { if (v) selectTab(v); }}
                            orientation="horizontal"
                            className="v4-reading-tabs"
                        >
                            <div className="v4-reading-tabs-grid">
                                <TabsList
                                    variant="line"
                                    className="v4-reading-tabs-list v4-reading-tabs-list-horizontal"
                                >
                                    {vm.tabs.definitions.map((tab) => (
                                        <TabsTrigger key={tab.id} value={tab.id} className="v4-reading-tab-trigger">
                                            <span className="v4-tab-label">{tab.label}</span>
                                            <span className="v4-tab-question">{tab.question}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div ref={panelsRef} className="v4-reading-panel-stack">
                                    {copiedTab?.lead && activeTab !== "overview" && (
                                        <section className="v4-tab-editor v4-tab-editor-in-shell">
                                            <p className="v4-tab-lead">{copiedTab.lead}</p>
                                            {copiedTab.plainEnglishSummary && (
                                                <p className="v4-tab-summary">{copiedTab.plainEnglishSummary}</p>
                                            )}
                                        </section>
                                    )}

                                    <main className="v4-tab-panels">
                                        <TabsContent value="overview" className="v4-tabs-panel v4-overview-panel mt-0 outline-none">
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
                                        </TabsContent>

                                        <TabsContent value="life-themes" className="v4-tabs-panel mt-0 outline-none">
                                            <section className="v4-step v4-step-tint v4-tab-panel-section">
                                                <div className="v4-reading-panel-body">
                                                    <div className="v4-step-num">Life Themes</div>
                                                    <h2 className="v4-h2">Where life gets louder.</h2>
                                                    <p className="v4-step-intro">
                                                        {selectedGoal
                                                            ? `${selectedGoal.label} is the lens here. The chart ranks each life area by how useful this place is for that outcome.`
                                                            : "This chart ranks where the place adds the most emphasis, from strongest support to quieter background themes."}
                                                    </p>
                                                    <div className="v4-theme-bars">
                                                        {themeBars.map((theme) => (
                                                            <div key={theme.id} className={`v4-theme-bar${theme.goalId && vm.goalIds.includes(theme.goalId) ? " is-goal" : ""}`}>
                                                                <div className="v4-theme-bar-head">
                                                                    <span>{theme.label}</span>
                                                                    <strong>{theme.score}/100</strong>
                                                                </div>
                                                                <div className="v4-theme-track"><div style={{ width: `${theme.score}%` }} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </section>
                                        </TabsContent>

                                        <TabsContent value="place-field" className="v4-tabs-panel mt-0 outline-none">
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
                                                    {renderAcg()}
                                                </div>
                                            </section>
                                        </TabsContent>

                                        <TabsContent value="what-shifts" className="v4-tabs-panel mt-0 outline-none">
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
                                        </TabsContent>

                                        <TabsContent value="timing" className="v4-tabs-panel mt-0 outline-none">
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
                                        </TabsContent>
                                    </main>

                                    {copiedTab?.evidenceCaption && (
                                        <section className="v4-tab-receipt v4-tab-receipt-in-shell">
                                            <div className="v4-reading-panel-body">{copiedTab.evidenceCaption}</div>
                                        </section>
                                    )}

                                    {copiedTab?.nextTabBridge && (
                                        <section className="v4-tab-bridge v4-tab-bridge-in-shell">
                                            <div className="v4-reading-panel-body">{copiedTab.nextTabBridge}</div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </Tabs>
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
                            This reading was made for you specifically, based on your birth details and your chart&apos;s relationship to this place. Read it again when plans are more concrete.
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
