"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "@/app/components/AppNavbar";
import { BackButton } from "@/components/app/back-button";
import UpsellCelebrationCard from "@/app/components/UpsellCelebrationCard";
import { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { toV4ViewModel } from "@/app/lib/reading-viewmodel";
import { READING_TAB_IDS, type ReadingTabId } from "@/app/lib/reading-tabs";
import { type NatalData } from "@/app/components/AcgMap";
import OverviewTab from "./tabs/OverviewTab";
import LifeThemesTab from "./tabs/LifeThemesTab";
import PlaceFieldTab from "./tabs/PlaceFieldTab";
import WhatShiftsTab from "./tabs/WhatShiftsTab";
import TimingTab from "./tabs/TimingTab";
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
        const m24 = rawTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (m24) {
            const hh = String(Math.min(23, Math.max(0, parseInt(m24[1], 10)))).padStart(2, "0");
            const mm = m24[2];
            const ss = m24[3] || "00";
            return `${hh}:${mm}:${ss}`;
        }
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
 * Tabbed shell that routes to per-tab components in ./tabs.
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
        // page.tsx normalizes userPlanetaryLines to []; pick the first non-empty source.
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
                                        <TabsContent value="overview" className="v4-tabs-panel mt-0 outline-none">
                                            <OverviewTab vm={vm} copiedTab={copiedTab} selectTab={selectTab} />
                                        </TabsContent>

                                        <TabsContent value="life-themes" className="v4-tabs-panel mt-0 outline-none">
                                            <LifeThemesTab vm={vm} />
                                        </TabsContent>

                                        <TabsContent value="place-field" className="v4-tabs-panel mt-0 outline-none">
                                            <PlaceFieldTab
                                                vm={vm}
                                                natalForMap={natalForMap}
                                                birthIso={birthIso}
                                                reading={reading}
                                                relocatedAcgLines={relocatedAcgLines}
                                            />
                                        </TabsContent>

                                        <TabsContent value="what-shifts" className="v4-tabs-panel mt-0 outline-none">
                                            <WhatShiftsTab vm={vm} isDark={isDark} relocatedWheel={relocatedWheel} />
                                        </TabsContent>

                                        <TabsContent value="timing" className="v4-tabs-panel mt-0 outline-none">
                                            <TimingTab vm={vm} narrativeLoading={narrativeLoading} />
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
