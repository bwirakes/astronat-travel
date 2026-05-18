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
import PlaceFieldTab from "./tabs/PlaceFieldTab";
import WhatShiftsTab from "./tabs/WhatShiftsTab";
import TimingTab from "./tabs/TimingTab";
import NextTabNav from "./NextTabNav";
import { destinationFlag } from "@/app/lib/country-flag";
import { Compass, Globe2, Sparkles, Clock } from "lucide-react";
import "./reading-shell.css";

function TabGlyph({ id }: { id: string }) {
    const props = { size: 16, strokeWidth: 1.75, "aria-hidden": true as const };
    switch (id) {
        case "overview":
            return <Compass {...props} />;
        case "what-shifts":
            return <Sparkles {...props} />;
        case "place-field":
            return <Globe2 {...props} />;
        case "timing":
            return <Clock {...props} />;
        default:
            return null;
    }
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";
const READING_SHELL_STYLE = {
    maxWidth: "1180px",
    padding: "0 clamp(24px, 5vw, 72px)",
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
        const implication = mode === "relocated"
            ? (cp.relocatedTooltip
                ?? (cp.relocatedHouse ? `House ${cp.relocatedHouse} here · ${cp.plain}` : cp.plain))
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

function ReadingHeroBanner({
    city,
    flagEmoji,
    dates,
    score,
    verdictLabel,
}: {
    city: string;
    flagEmoji?: string | null;
    dates: string;
    score: number;
    verdictLabel: string;
}) {
    const roundedScore = Math.round(score);

    return (
        <div
            className="reading-hero-banner relative overflow-hidden rounded-t-[8px] rounded-b-0 px-[clamp(18px,4vw,44px)] py-[clamp(22px,3.8vw,42px)]"
            style={{
                minHeight: "clamp(186px, 20vw, 244px)",
                background: "linear-gradient(180deg, #0456fb 0%, #0a63ff 100%)",
            }}
        >
            <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="absolute right-[clamp(156px,14vw,218px)] top-[clamp(34px,4.4vw,58px)] h-[clamp(20px,2.4vw,34px)] w-[clamp(20px,2.4vw,34px)] max-sm:left-[48px] max-sm:right-auto max-sm:top-[170px] max-sm:h-[22px] max-sm:w-[22px]"
                style={{ color: "#CAF1F0" }}
            >
                <path d="M32 0 L38 25 L64 32 L38 39 L32 64 L26 39 L0 32 L26 25 Z" fill="currentColor" />
            </svg>
            <svg
                aria-hidden
                className="absolute inset-x-0 bottom-[-1px] h-[clamp(64px,8vw,112px)] w-full"
                viewBox="0 0 1440 160"
                preserveAspectRatio="none"
            >
                <path
                    d="M0 96C304 38 650 30 944 48C1142 60 1300 76 1440 96V160H0V96Z"
                    fill="var(--reading-tabs-surface)"
                />
            </svg>
            <div
                aria-hidden
                className="absolute right-[3.4%] bottom-[17%] h-[clamp(26px,3.4vw,44px)] w-[clamp(26px,3.4vw,44px)] rounded-full"
                style={{ background: "color-mix(in oklab, #1B1B1B 82%, #C9A96E)" }}
            >
                <span
                    className="absolute -right-[18%] -top-[10%] h-[70%] w-[70%] rounded-full"
                    style={{ background: "var(--reading-tabs-surface)" }}
                />
            </div>
            <div
                aria-hidden
                className="absolute right-[clamp(18px,4vw,44px)] bottom-[clamp(24px,4.8vw,52px)] z-10 h-[clamp(78px,7vw,104px)] w-[clamp(94px,8.6vw,128px)] max-sm:-right-[2px] max-sm:bottom-[56px] max-sm:scale-[0.72]"
            >
                <svg viewBox="0 0 160 132" className="h-full w-full overflow-visible" fill="none">
                    <path d="M15 22l4.3 9.3 10.2 1.2-7.5 6.8 2 10-8.8-5.1-8.9 5 2.2-10-7.5-6.9 10.2-1.1L15 22z" fill="#C9A96E" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" />
                    <circle cx="113" cy="25" r="13.5" fill="color-mix(in oklab, #CAF1F0 72%, #c7a6ff)" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" />
                    <path d="M98 32c13-17 30-25 45-22" stroke="#C9A96E" strokeWidth="4" strokeLinecap="round" />
                    <path d="M87 35c22 3 42-2 61-14" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" strokeLinecap="round" />
                    <g transform="translate(70 41) rotate(-12)">
                        <circle cx="0" cy="0" r="30" fill="color-mix(in oklab, #E67A7A 78%, #C9A96E)" stroke="color-mix(in oklab, #1B1B1B 76%, transparent)" strokeWidth="2.5" />
                        <path d="M-21-7c13 6 26 5 43-3" stroke="color-mix(in oklab, #C9A96E 62%, #E67A7A)" strokeWidth="6" strokeLinecap="round" />
                        <path d="M-20 11c15-9 30-10 44-4" stroke="color-mix(in oklab, #1B1B1B 16%, #E67A7A)" strokeWidth="5" strokeLinecap="round" />
                        <path d="M-15 22c10-6 20-7 31-1" stroke="color-mix(in oklab, #C9A96E 62%, #E67A7A)" strokeWidth="5" strokeLinecap="round" />
                        <path d="M-49 13c27 16 75 9 106-13" stroke="#C9A96E" strokeWidth="7" strokeLinecap="round" />
                        <path d="M-51 14c29 19 78 11 110-14" stroke="color-mix(in oklab, #1B1B1B 72%, transparent)" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                    <circle cx="88" cy="103" r="12" fill="color-mix(in oklab, #CAF1F0 78%, #C9A96E)" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2" />
                    <path d="M82 101c4-5 8-5 12 0M83 109c4-5 8-5 12 0" stroke="color-mix(in oklab, #1B1B1B 70%, transparent)" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M13 79h12M19 73v12M143 54h11M148.5 48.5v11" stroke="#C9A96E" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
            </div>
            <div className="absolute right-[clamp(18px,4vw,44px)] top-[clamp(18px,3vw,36px)] z-20 flex flex-col items-end gap-[10px]">
                <span
                    className="inline-flex items-baseline rounded-full px-[clamp(16px,2vw,26px)] py-[clamp(8px,1vw,12px)] shadow-sm"
                    style={{
                        background: "#F8F5EC",
                        color: "#1B1B1B",
                        fontFamily: FONT_PRIMARY,
                    }}
                >
                    <span className="text-[clamp(38px,5.4vw,72px)] leading-none tabular-nums">{roundedScore}</span>
                    <span
                        className="ml-1.5 text-[clamp(12px,1.1vw,15px)]"
                        style={{ fontFamily: FONT_MONO, color: "#8a8983" }}
                    >
                        /100
                    </span>
                </span>
                <span
                    className="inline-flex rounded-full px-[14px] py-[6px] text-[10px] uppercase"
                    style={{
                        background: "#F8F5EC",
                        color: "#0456fb",
                        fontFamily: FONT_MONO,
                        letterSpacing: "0.18em",
                        fontWeight: 800,
                    }}
                >
                    {verdictLabel}
                </span>
            </div>
            <div className="relative z-10 grid min-h-[inherit] grid-cols-1 items-center gap-[18px]">
                <div className="flex min-w-0 flex-col justify-start gap-[10px] self-start pt-[clamp(38px,4.8vw,62px)] max-sm:pt-[28px]">
                    <span
                        className="inline-flex items-baseline gap-[clamp(10px,1.5vw,18px)] leading-[0.9]"
                        style={{
                            color: "#F8F5EC",
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(54px, 8vw, 100px)",
                            textShadow: "0 2px 0 rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        <span className="min-w-0 truncate">{city}</span>
                        {flagEmoji ? (
                            <span role="img" aria-label={`${city} destination flag`} style={{ fontSize: "0.45em", lineHeight: 1 }}>
                                {flagEmoji}
                            </span>
                        ) : null}
                    </span>
                    <span
                        className="text-[11px] uppercase"
                        style={{
                            color: "color-mix(in oklab, #F8F5EC 82%, transparent)",
                            fontFamily: FONT_MONO,
                            letterSpacing: "0.18em",
                        }}
                    >
                        {dates}
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * V4 "101" — first-time-friendly reading view.
 * Tabbed shell that routes to per-tab components in ./tabs.
 */
export default function HundredOneReadingView({ reading, narrative, showUpsell, paramId }: Props) {
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
                    const score = vm.hero.bestWindow?.score ?? vm.hero.baselineScore;
                    const dates = vm.hero.bestWindow?.dates ?? "—";
                    const flag = destinationFlag(
                        [vm.location.city, vm.location.region].filter(Boolean).join(", "),
                    );
                    const displayDates = vm.travelType === "relocation" && vm.travelDateISO
                        ? `Moving · ${dates}`
                        : dates;
                    return (
                        <div
                            className="reading-hero-wrap mx-auto"
                            style={READING_SHELL_STYLE}
                        >
                            <section
                                className="pt-0 pb-0"
                            >
                                <ReadingHeroBanner
                                    city={vm.location.city}
                                    flagEmoji={flag?.emoji}
                                    dates={displayDates}
                                    score={score}
                                    verdictLabel={vm.hero.verdict.label}
                                />
                            </section>
                        </div>
                    );
                })()}

                <section
                    className="pt-0 pb-12"
                    aria-label="Reading content"
                >
                    <div
                        className="reading-tabs-wrap mx-auto w-full min-w-0"
                        style={READING_SHELL_STYLE}
                    >
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => { if (v) selectTab(v); }}
                            orientation="horizontal"
                            className="w-full min-w-0"
                        >
                            <div
                                className="flex flex-col gap-6"
                                style={{ width: "100%", minWidth: 0 }}
                            >
                                <TabsList
                                    variant="line"
                                    className="reading-tabs-list"
                                    style={{
                                        display: "flex",
                                        width: "100%",
                                        minWidth: 0,
                                        flexDirection: "row",
                                    }}
                                >
                                    {vm.tabs.definitions.map((tab) => (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            className="reading-tab-trigger"
                                            style={{ flex: "1 1 0", minWidth: 0 }}
                                        >
                                            <span className="inline-flex items-center gap-[clamp(6px,0.7vw,10px)]">
                                                <span className="hidden sm:inline-flex">
                                                    <TabGlyph id={tab.id} />
                                                </span>
                                                <span
                                                    className="text-[13px] sm:text-[15px] tracking-[0.1em] sm:tracking-[0.18em] uppercase"
                                                    style={{ fontFamily: FONT_MONO }}
                                                >
                                                    {tab.label}
                                                </span>
                                            </span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div ref={panelsRef} className="reading-panels flex-1" style={{ minWidth: 0, width: "100%" }}>
                                    <main className="min-w-0">
                                        <TabsContent value="overview" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <OverviewTab
                                                vm={vm}
                                                copiedTab={copiedTab}
                                                selectTab={selectTab}
                                                natalForMap={natalForMap}
                                                birthIso={birthIso}
                                                birthLocation={{
                                                    lat: reading?.birth?.lat ?? reading?.birthLat,
                                                    lon: reading?.birth?.lon ?? reading?.birthLon,
                                                    city: reading?.birth?.place ?? reading?.birthPlace,
                                                }}
                                            />
                                        </TabsContent>

                                        <TabsContent value="what-shifts" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <WhatShiftsTab
                                                vm={vm}
                                                isDark={isDark}
                                                natalWheel={natalWheel}
                                                relocatedWheel={relocatedWheel}
                                                copiedTab={copiedTab}
                                            />
                                        </TabsContent>

                                        <TabsContent value="place-field" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <PlaceFieldTab
                                                vm={vm}
                                                isDark={isDark}
                                                natalForMap={natalForMap}
                                                birthIso={birthIso}
                                                reading={reading}
                                                relocatedAcgLines={relocatedAcgLines}
                                                copiedTab={copiedTab}
                                            />
                                        </TabsContent>

                                        <TabsContent value="timing" className="mt-0 outline-none data-[state=inactive]:hidden">
                                            <TimingTab vm={vm} copiedTab={copiedTab} />
                                        </TabsContent>
                                    </main>

                                    <NextTabNav 
                                        activeTab={activeTab} 
                                        selectTab={selectTab} 
                                        bridgeText={copiedTab?.nextTabBridge} 
                                    />
                                    
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
