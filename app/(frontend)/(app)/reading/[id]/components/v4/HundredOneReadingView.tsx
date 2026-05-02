"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import UpsellCelebrationCard from "@/app/components/UpsellCelebrationCard";
import { PageHeader } from "@/components/app/page-header-context";
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
import "./reading-shell.css";

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

const VERDICT_COLORS: Record<string, string> = {
    tough: "var(--color-spiced-life)",
    mixed: "var(--gold)",
    solid: "var(--sage)",
    peak: "var(--sage)",
};

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

function wheelFromVm(
    vm: ReturnType<typeof toV4ViewModel>,
    mode: "natal" | "relocated",
): { cusps: number[]; planets: NatalPlanet[] } | null {
    const cusps = mode === "relocated" ? vm.relocated.relocatedCuspsDeg : vm.relocated.natalCuspsDeg;
    if (!Array.isArray(cusps) || cusps.length !== 12 || !cusps.every((c) => typeof c === "number" && Number.isFinite(c))) {
        return null;
    }
    const planets: NatalPlanet[] = vm.chart.natal.map((cp) => {
        const house = mode === "relocated"
            ? (cp.relocatedHouse ?? cp.natalHouse)
            : (cp.natalHouse ?? cp.relocatedHouse);
        const implication = mode === "relocated" && cp.relocatedHouse
            ? `House ${cp.relocatedHouse} here · ${cp.plain}`
            : cp.plain;
        return {
            planet: cp.p,
            longitude: cp.deg,
            sign: cp.sign,
            degree: cp.degree,
            house,
            implication,
        };
    });
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
    const relocatedWheel = useMemo(() => wheelFromVm(vm, "relocated"), [vm]);
    const natalWheel = useMemo(() => wheelFromVm(vm, "natal"), [vm]);
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
            <PageHeader
                title={String(reading?.destination || "Reading").split(",")[0]}
                backTo="/readings"
                backLabel="All readings"
            />
            <div
                className="min-h-screen w-full max-w-full overflow-x-clip"
                style={{
                    background: "var(--bg)",
                    color: "var(--text-primary)",
                    fontFamily: FONT_BODY,
                }}
            >
                {(() => {
                    const verdictColor = VERDICT_COLORS[vm.hero.verdict.band] ?? "var(--text-secondary)";
                    const score = vm.hero.bestWindow?.score ?? vm.hero.baselineScore;
                    const dates = vm.hero.bestWindow?.dates ?? "—";
                    return (
                        <div
                            className="mx-auto"
                            style={{ maxWidth: "1200px", padding: "0 clamp(16px, 4vw, 32px)" }}
                        >
                            <section
                                className="flex flex-wrap items-end justify-between gap-x-[clamp(16px,2.4vw,28px)] gap-y-[14px] pt-2 pb-[clamp(16px,2vw,22px)] border-b"
                                style={{ borderColor: "var(--surface-border)" }}
                            >
                                <div className="flex flex-col gap-[6px] min-w-0">
                                    <span
                                        className="leading-[0.95] tracking-[-0.02em]"
                                        style={{
                                            fontFamily: FONT_PRIMARY,
                                            fontSize: "clamp(40px, 5.5vw, 72px)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {vm.location.city}
                                    </span>
                                    <span
                                        className="text-[12px] tracking-[0.18em] uppercase"
                                        style={{ fontFamily: FONT_MONO, color: "var(--text-secondary)" }}
                                    >
                                        {vm.travelType === "relocation" && vm.travelDateISO
                                            ? `Moving · ${dates}`
                                            : dates}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-[10px]">
                                    <span className="flex items-baseline gap-1.5" style={{ fontFamily: FONT_PRIMARY }}>
                                        <span
                                            className="leading-none"
                                            style={{
                                                fontSize: "clamp(44px, 5.5vw, 72px)",
                                                color: "var(--color-spiced-life)",
                                            }}
                                        >
                                            {score}
                                        </span>
                                        <span
                                            className="text-[13px]"
                                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                        >
                                            /100
                                        </span>
                                    </span>
                                    <span
                                        className="inline-flex items-center px-[12px] py-[5px] rounded-full border text-[10px] tracking-[0.2em] uppercase font-medium"
                                        style={{
                                            color: verdictColor,
                                            borderColor: verdictColor,
                                            background: `color-mix(in oklab, ${verdictColor} 6%, transparent)`,
                                            fontFamily: FONT_MONO,
                                        }}
                                    >
                                        {vm.hero.verdict.label}
                                    </span>
                                </div>
                            </section>
                        </div>
                    );
                })()}

                <section
                    className="pt-[10px] pb-12 border-t"
                    style={{ borderColor: "var(--surface-border)" }}
                    aria-label="Reading content"
                >
                    <div
                        className="mx-auto w-full min-w-0"
                        style={{
                            maxWidth: "1200px",
                            padding: "0 clamp(16px, 3vw, 28px)",
                        }}
                    >
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => { if (v) selectTab(v); }}
                            orientation="horizontal"
                            className="w-full min-w-0"
                        >
                            <div className="flex flex-col gap-[14px] min-w-0">
                                <TabsList variant="line" className="reading-tabs-list">
                                    {vm.tabs.definitions.map((tab) => (
                                        <TabsTrigger key={tab.id} value={tab.id} className="reading-tab-trigger">
                                            <span
                                                className="text-[11px] tracking-[0.18em] uppercase"
                                                style={{ fontFamily: FONT_MONO }}
                                            >
                                                {tab.label}
                                            </span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div ref={panelsRef} className="flex-1 min-w-0">
                                    {copiedTab?.lead && activeTab !== "overview" && (
                                        <section className="pb-2 bg-transparent">
                                            <p
                                                className="leading-[1.1] m-0 mb-[10px] [text-wrap:balance]"
                                                style={{
                                                    fontFamily: FONT_PRIMARY,
                                                    fontSize: "clamp(25px, 3.4vw, 40px)",
                                                    color: "var(--text-primary)",
                                                }}
                                            >
                                                {copiedTab.lead}
                                            </p>
                                            {copiedTab.plainEnglishSummary && (
                                                <p
                                                    className="max-w-[620px] text-[15px] leading-[1.6] m-0"
                                                    style={{ color: "var(--text-secondary)" }}
                                                >
                                                    {copiedTab.plainEnglishSummary}
                                                </p>
                                            )}
                                        </section>
                                    )}

                                    <main className="min-w-0">
                                        <TabsContent value="overview" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <OverviewTab vm={vm} copiedTab={copiedTab} selectTab={selectTab} />
                                        </TabsContent>

                                        <TabsContent value="life-themes" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <LifeThemesTab vm={vm} reading={reading} />
                                        </TabsContent>

                                        <TabsContent value="place-field" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <PlaceFieldTab
                                                vm={vm}
                                                natalForMap={natalForMap}
                                                birthIso={birthIso}
                                                reading={reading}
                                                relocatedAcgLines={relocatedAcgLines}
                                            />
                                        </TabsContent>

                                        <TabsContent value="what-shifts" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <WhatShiftsTab vm={vm} isDark={isDark} relocatedWheel={relocatedWheel} />
                                        </TabsContent>

                                        <TabsContent value="timing" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <TimingTab vm={vm} />
                                        </TabsContent>
                                    </main>

                                    {copiedTab?.evidenceCaption && (
                                        <section
                                            className="mt-3 py-4 border-t text-[14px]"
                                            style={{
                                                borderColor: "var(--surface-border)",
                                                fontFamily: FONT_BODY,
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {copiedTab.evidenceCaption}
                                        </section>
                                    )}

                                    {copiedTab?.nextTabBridge && (
                                        <section
                                            className="mt-3 py-[18px] px-4 border-t text-[14px]"
                                            style={{
                                                borderColor: "var(--surface-border)",
                                                background: "color-mix(in oklab, var(--text-primary) 5%, transparent)",
                                                borderRadius: "var(--shape-asymmetric-sm, var(--radius-md, 10px))",
                                                fontFamily: FONT_BODY,
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {copiedTab.nextTabBridge}
                                        </section>
                                    )}
                                </div>
                            </div>
                        </Tabs>
                    </div>
                </section>

                {showUpsell && (
                    <section className="px-8 py-[88px]">
                        <div className="mx-auto" style={{ maxWidth: "1200px" }}>
                            <UpsellCelebrationCard />
                        </div>
                    </section>
                )}

                <footer
                    className="px-8 pt-14 pb-16 border-t"
                    style={{ borderColor: "var(--surface-border)" }}
                >
                    <div className="mx-auto" style={{ maxWidth: "1200px" }}>
                        <p
                            className="text-[14px] leading-[1.6] font-light max-w-[600px] mx-auto mb-[14px] text-center [text-wrap:pretty]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            This reading was made for you specifically, based on your birth details and your chart&apos;s relationship to this place. Read it again when plans are more concrete.
                        </p>
                        <div
                            className="text-[10px] tracking-[0.14em] uppercase text-center"
                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                        >
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
