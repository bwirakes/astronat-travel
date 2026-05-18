"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import PlanetIcon from "@/app/components/PlanetIcon";
import { AsteriskStarburst, OrbitalPaths } from "@/app/components/ui/svg-shapes";
import SectionHead from "../../shared/SectionHead";
import TabSection from "../../shared/TabSection";
import { RichText, type ReadingGuideRow } from "../../shared/ReadingCopy";
import { ReadingTonePill } from "../../shared/ReadingTonePill";
import type { V4VM } from "./types";
import { geodeticPlanetMeaning } from "@/app/lib/geodetic/planet-meanings";

interface Props {
    vm: V4VM;
    isDark: boolean;
    natalWheel: { cusps: number[]; planets: NatalPlanet[] } | null;
    relocatedWheel: { cusps: number[]; planets: NatalPlanet[] } | null;
    copiedTab?: {
        lead?: string;
        plainEnglishSummary?: string;
        guideRows?: Array<{ label: string; body: string }>;
        evidenceCaption?: string;
        nextTabBridge?: string;
    };
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

// Red ↔ cyan editorial palette for aspect tone.
const ASPECT_FRICTION = "#D14545";
const ASPECT_HARMONY = "#4FA9B5";
const ASPECT_NEUTRAL = "var(--gold)";

const HOUSE_TOPIC: Record<number, string> = {
    1: "self and first impression",
    2: "money and resources",
    3: "daily talk and learning",
    4: "home and roots",
    5: "creativity and romance",
    6: "daily work and health",
    7: "partnerships",
    8: "shared depth",
    9: "travel and belief",
    10: "career and visibility",
    11: "community",
    12: "private recovery",
};

// Position on the friction←→harmony track (0 = full friction, 100 = full harmony).
const ASPECT_X: Record<string, number> = {
    opposition: 6,
    square: 22,
    conjunct: 50,
    sextile: 76,
    trine: 92,
};

const ASPECT_GLYPH: Record<string, string> = {
    opposition: "☍",
    square: "□",
    conjunct: "☌",
    sextile: "⚹",
    trine: "△",
};

function aspectTone(name: string): "friction" | "neutral" | "harmony" {
    if (name === "square" || name === "opposition") return "friction";
    if (name === "trine" || name === "sextile") return "harmony";
    return "neutral";
}

function aspectColor(name: string): string {
    const t = aspectTone(name);
    return t === "friction" ? ASPECT_FRICTION : t === "harmony" ? ASPECT_HARMONY : ASPECT_NEUTRAL;
}

function parseOrb(aspectStr: string): number {
    const m = aspectStr.match(/orb\s+([\d.]+)/);
    return m ? parseFloat(m[1]) : 8;
}

function parseAspectName(aspectStr: string): string {
    return aspectStr.split(" ")[0];
}

// Tighter orb = brighter glyph. Orb 0° → 1.0, orb 8° → 0.42.
function tightnessOpacity(orb: number): number {
    const clamped = Math.max(0, Math.min(8, orb));
    return 0.42 + ((8 - clamped) / 8) * 0.58;
}

function shortAngleLabel(angleName: string): string {
    return angleName.split(/[\s(·]/)[0] || angleName;
}

export default function WhatShiftsTab({ vm, isDark, natalWheel, relocatedWheel, copiedTab }: Props) {
    const lead = buildLead(vm);
    const seasonal = buildSeasonal(vm);
    const mobileChartDefault = useSyncExternalStore(
        subscribeMobileChartDefault,
        getMobileChartDefaultSnapshot,
        getServerChartDefaultSnapshot,
    );
    const [chartModeOverride, setChartMode] = useState<"compare" | "relocated" | null>(null);
    const chartMode = chartModeOverride ?? (mobileChartDefault ? "relocated" : "compare");

    const tabLead = copiedTab?.lead?.trim() || "";
    const tabIntro = copiedTab?.plainEnglishSummary?.trim() || vm.chrome.step7Intro || "";
    const hasAiCopy = tabLead.length > 0 || !!copiedTab?.plainEnglishSummary;
    const whatShiftsGuideRows = buildWhatShiftsGuideRows(vm, copiedTab?.guideRows);
    const relocatedHouseSigns = buildHouseSigns(relocatedWheel?.cusps);
    const houseGroups = buildHouseLandingGroups(vm, relocatedHouseSigns);
    return (
        <div>
            <TabSection
                kicker="What Shifts"
                title="What changes when your chart moves here."
                titleNoWrap
                lead={tabLead}
                intro={tabIntro}
                guideRows={whatShiftsGuideRows}
                maxSentences={3}
                preserveGuideLabels
                guideSurface="cards"
            >
                {/* ─ Synthesized fallback lead — only shown when no AI copy ─ */}
                {!hasAiCopy && (
                    <p
                        className="text-[16px] leading-[1.55] m-0 mb-2 max-w-[640px] [text-wrap:pretty]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-primary)", fontWeight: 400 }}
                    >
                        {lead}
                    </p>
                )}
                {/* ─ CHARTS ──────────────────────────────────────────────────── */}
                <div className="mb-12 w-full">
                <header className="mb-4">
                    <div
                        className="relative overflow-hidden rounded-[8px] border px-5 py-5 sm:px-6"
                        style={{
                            borderColor: "var(--reading-card-border-accent)",
                            background: "var(--reading-card-bg-strong)",
                            boxShadow: "var(--reading-card-shadow)",
                        }}
                    >
                        <ShiftPanelOrnament />
                        <div className="relative z-[1] flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-baseline gap-[0.85rem]">
                                <span className="text-[10px] tracking-[0.22em] font-bold" style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}>
                                    §01
                                </span>
                                <h3
                                    className="m-0"
                                    style={{
                                        fontFamily: FONT_PRIMARY,
                                        fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                                        color: "var(--text-primary)",
                                        lineHeight: 1.2,
                                        letterSpacing: "-0.01em",
                                        fontWeight: 500,
                                    }}
                                >
                                    Chart view
                                </h3>
                            </div>
                            <div
                                role="tablist"
                                aria-label="Chart display mode"
                                className="inline-flex p-1 border rounded-full gap-1"
                                style={{
                                    borderColor: "var(--reading-card-border-accent)",
                                    background: "color-mix(in oklab, var(--color-y2k-blue) 5%, transparent)",
                                }}
                            >
                                <ModePill active={chartMode === "compare"} onClick={() => setChartMode("compare")} label="Compare" />
                                <ModePill active={chartMode === "relocated"} onClick={() => setChartMode("relocated")} label="Relocated only" />
                            </div>
                        </div>
                        <p className="relative z-[1] m-0 mt-[10px] max-w-[720px] text-[14px] leading-[1.55]" style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)", fontWeight: 300 }}>
                            Start with what changed, then open the wheels when you want the full chart receipt.
                        </p>
                    </div>
                </header>
                <WhatChangedLedger vm={vm} />
                <div className={`grid gap-4 ${chartMode === "compare" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
                    {chartMode === "compare" && (
                        <ChartPanel
                            title="Natal Chart"
                            subtitle={shortPlace(vm.relocated.birth.place)}
                            isDark={isDark}
                            wheel={natalWheel}
                            emptyText="Natal house cusps are not available for this reading."
                            muted
                        />
                    )}
                    <ChartPanel
                        title="Relocated Chart"
                        subtitle={shortPlace(vm.relocated.travel.place)}
                        isDark={isDark}
                        wheel={relocatedWheel}
                        emptyText="Relocated house cusps are not available for this reading."
                        accent
                        mode="relocated"
                    />
                </div>
                </div>

                {/* ─ SECTION: FOUR CORNERS AND ASPECTS ──────────────────────── */}
                <SectionHead
                    index="02"
                    title="Four Corners and Aspects"
                    sub="The angles show the fastest felt changes: body, home base, other people, and direction."
                />
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-12">
                    {vm.relocated.angles.map((a) => (
                        <AngleCard
                            key={a.k}
                            angle={a}
                            aspects={vm.relocated.aspectsToAngles.filter((x) => x.toAngle === a.k)}
                        />
                    ))}
                </div>

                {/* ─ SECTION: PLANETS ───────────────────────────────────────── */}
                <SectionHead
                    index="03"
                    title="Where the emphasis lands"
                    sub="Grouped by house so the story reads as rooms, not ten separate paragraphs."
                />
                <HouseLandingSection
                    groups={houseGroups}
                    rows={vm.relocated.planetsInHouses}
                    houseSigns={relocatedHouseSigns}
                />

                <AdvancedSignalsSection vm={vm} seasonal={seasonal} />
            </TabSection>
        </div>
    );
}

type HouseLandingGroup = {
    house: number;
    label: string;
    topic: string;
    sign?: string;
    rows: V4VM["relocated"]["planetsInHouses"];
    priority: number;
};

function subscribeMobileChartDefault(onStoreChange: () => void): () => void {
    const media = window.matchMedia("(max-width: 767px)");
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
}

function getMobileChartDefaultSnapshot(): boolean {
    return window.matchMedia("(max-width: 767px)").matches;
}

function getServerChartDefaultSnapshot(): boolean {
    return false;
}

function buildWhatShiftsGuideRows(
    vm: V4VM,
    generatedRows?: Array<{ label: string; body: string }>,
): ReadingGuideRow[] {
    const byLabel = new Map((generatedRows ?? []).map((row) => [row.label, row.body]));
    const asc = vm.relocated.angles.find((angle) => angle.k === "ASC");
    const cr = vm.relocated.chartRulerReframe;
    const ruler = vm.relocated.chartRuler;
    const rulerHouse = cr?.toHouse ?? ruler?.rulerRelocatedHouse;
    const risingBody = byLabel.get("Best Used For") || (asc
        ? `${asc.relocated} rises here, so ${asc.delta.replace(/\.$/, "").toLowerCase()}.`
        : cr?.relocatedRising
            ? `${cr.relocatedRising} rises here, changing the first impression this place pulls forward.`
            : "Notice the first-day body and mood shift before making the trip mean everything.");
    const rulerBody = byLabel.get("Move Carefully With") || (cr
        ? `${cr.ruler} moves H${cr.fromHouse} to H${cr.toHouse}: ${cr.headline.replace(/\.$/, "")}.`
        : ruler?.ruler
            ? `${ruler.ruler} points attention toward H${rulerHouse ?? "?"} here; use that house as the trip's main room.`
            : "Use the relocated chart ruler as the clearest clue for what needs your attention here.");
    const feelBody = byLabel.get("Your Next Move")
        || cr?.body
        || asc?.plain
        || "Name how you feel and behave differently on day one, then adjust the plan around that evidence.";

    return [
        { label: "Relocated Rising", body: sentenceLimit(risingBody, 1), badgeVariant: "overview-use" },
        { label: "Chart Ruler Here", body: sentenceLimit(rulerBody, 1), badgeVariant: "theme-use" },
        { label: "How You'll Feel", body: sentenceLimit(feelBody, 1), badgeVariant: "overview-next" },
    ];
}

function sentenceLimit(text: string, max = 1): string {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return "";
    const sentences = clean.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [clean];
    return sentences.slice(0, max).join(" ").trim();
}

function ShiftPanelOrnament() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 text-[var(--color-y2k-blue)] opacity-[0.12]"
        >
            <OrbitalPaths size="100%" className="absolute inset-0" />
            <AsteriskStarburst size="24%" className="absolute left-[18%] top-[30%] text-[var(--color-spiced-life)] opacity-80" />
        </div>
    );
}

function WhatChangedLedger({ vm }: { vm: V4VM }) {
    const cr = vm.relocated.chartRulerReframe;
    const ruler = vm.relocated.chartRuler;
    return (
        <div
            className="mb-4 grid grid-cols-1 overflow-hidden rounded-[8px] border sm:grid-cols-2 lg:grid-cols-5"
            style={{
                borderColor: "var(--reading-card-border-accent)",
                background: "var(--reading-card-bg)",
                boxShadow: "var(--reading-card-shadow)",
            }}
        >
            {vm.relocated.angles.map((angle) => (
                <LedgerCell
                    key={angle.k}
                    label={angle.k}
                    from={angle.natal}
                    to={angle.relocated}
                    accent={angle.signChanged}
                />
            ))}
            {(cr || ruler) && (
                <LedgerCell
                    label="Ruler"
                    from={cr ? `H${cr.fromHouse}` : ruler?.rulerNatalHouse ? `H${ruler.rulerNatalHouse}` : "—"}
                    to={cr ? `H${cr.toHouse}` : ruler?.rulerRelocatedHouse ? `H${ruler.rulerRelocatedHouse}` : "—"}
                    note={cr?.ruler ?? ruler?.ruler}
                    accent
                />
            )}
        </div>
    );
}

function LedgerCell({ label, from, to, note, accent }: { label: string; from: string; to: string; note?: string; accent?: boolean }) {
    return (
        <div
            className="min-w-0 px-5 py-4 lg:border-l lg:first:border-l-0"
            style={{ borderColor: "var(--surface-border)" }}
        >
            <ReadingTonePill tone={accent ? "spiced" : "acqua"}>{label}</ReadingTonePill>
            <div
                className="mt-2 flex min-w-0 items-baseline gap-2 text-[12px]"
                style={{ fontFamily: FONT_MONO, color: "var(--text-primary)" }}
            >
                <span className="truncate">{from}</span>
                <span style={{ color: "var(--text-tertiary)" }}>→</span>
                <span className="truncate" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                    {to}
                </span>
            </div>
            {note && (
                <div
                    className="mt-1 truncate text-[10px] tracking-[0.08em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    {note}
                </div>
            )}
        </div>
    );
}

function buildHouseLandingGroups(vm: V4VM, houseSigns: Record<number, string>): HouseLandingGroup[] {
    const chartRulerHouse = vm.relocated.chartRulerReframe?.toHouse
        ?? vm.relocated.chartRuler?.rulerRelocatedHouse;
    const groups = new Map<number, HouseLandingGroup>();

    for (const row of vm.relocated.planetsInHouses) {
        if (!row.reloHouseNum) continue;
        const existing = groups.get(row.reloHouseNum);
        const group = existing ?? {
            house: row.reloHouseNum,
            label: row.reloHouse,
            topic: HOUSE_TOPIC[row.reloHouseNum] ?? row.reloHouse,
            sign: houseSigns[row.reloHouseNum],
            rows: [],
            priority: 0,
        };
        group.rows.push(row);
        groups.set(row.reloHouseNum, group);
    }

    return Array.from(groups.values())
        .map((group) => {
            const hasRuler = chartRulerHouse === group.house;
            const hasLuminary = group.rows.some((row) => /^(sun|moon)$/i.test(row.planet));
            const changedCount = group.rows.filter((row) => row.changed).length;
            const angular = [1, 4, 7, 10].includes(group.house);
            return {
                ...group,
                priority:
                    (hasRuler ? 100 : 0)
                    + Math.min(group.rows.length, 4) * 12
                    + changedCount * 8
                    + (hasLuminary ? 18 : 0)
                    + (angular ? 10 : 0)
                    - group.house / 100,
            };
        })
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
}

function buildHouseSigns(cusps?: number[]): Record<number, string> {
    if (!cusps?.length) return {};
    return Object.fromEntries(
        cusps.slice(0, 12).map((lon, index) => [index + 1, zodiacSignName(lon)]),
    );
}

function zodiacSignName(lon: number): string {
    const signs = [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
    ];
    const norm = ((lon % 360) + 360) % 360;
    return signs[Math.floor(norm / 30) % 12] ?? "";
}

function HouseLandingSection({
    groups,
    rows,
    houseSigns,
}: {
    groups: HouseLandingGroup[];
    rows: V4VM["relocated"]["planetsInHouses"];
    houseSigns: Record<number, string>;
}) {
    const allStable = rows.length > 0
        && rows.every((row) => row.changed === false && row.reloHouse !== "—");
    if (rows.length === 0) {
        return (
            <div
                className="mb-12 p-4 text-center text-[10px] tracking-[0.14em] uppercase"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
            >
                No planet-house shifts available for this reading.
            </div>
        );
    }
    return (
        <div className="mb-12">
            {allStable && (
                <p
                    className="m-0 mb-6 max-w-[640px] text-[14px] leading-[1.6] [text-wrap:pretty]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)", fontWeight: 300 }}
                >
                    Your house structure barely shifts here. The main change is angle-side and timing-side, so the rooms stay familiar.
                </p>
            )}
            {groups.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {groups.map((group) => (
                        <HouseLandingCard key={group.house} group={group} />
                    ))}
                </div>
            ) : (
                <div
                    className="p-4 text-center text-[10px] tracking-[0.14em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    Relocated house groups are not available yet.
                </div>
            )}
            <details className="mt-4 border-t pt-4" style={{ borderColor: "var(--surface-border)" }}>
                <summary
                    className="inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-[10px] tracking-[0.16em] uppercase"
                    style={{
                        fontFamily: FONT_MONO,
                        color: "var(--text-on-y2k-blue)",
                        background: "var(--color-y2k-blue)",
                        fontWeight: 700,
                    }}
                >
                    See all planet moves
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rows.map((row) => (
                        <PlanetShiftCard
                            key={`${row.planet}-${row.reloHouse}`}
                            row={row}
                            sign={row.reloHouseNum ? houseSigns[row.reloHouseNum] : undefined}
                        />
                    ))}
                </div>
            </details>
        </div>
    );
}

function HouseLandingCard({ group }: { group: HouseLandingGroup }) {
    const planets = group.rows.map((row) => row.planet).join(", ");
    const changed = group.rows.filter((row) => row.changed).length;
    return (
        <article
            className="relative overflow-hidden rounded-[8px] border px-5 py-5 sm:px-6"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: "var(--reading-card-border-accent)",
                boxShadow: "0 18px 42px rgba(27, 27, 27, 0.08)",
            }}
        >
            <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "var(--color-y2k-blue)" }}
            />
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <ReadingTonePill tone="blue">House {group.house}</ReadingTonePill>
                {group.sign && <ReadingTonePill tone="acqua">{group.sign}</ReadingTonePill>}
                <ReadingTonePill tone={group.rows.some((row) => row.changed) ? "spiced" : "acqua"}>{group.topic}</ReadingTonePill>
            </div>
            <h3
                className="m-0 mb-3 text-[22px] leading-[1.08]"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 500 }}
            >
                {planets}
            </h3>
            <p
                className="m-0 text-[14px] leading-[1.6] [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
            >
                {changed > 1
                    ? `${changed} planets reroute into ${group.sign ? `${group.sign} ` : ""}House ${group.house}, so ${group.topic} becomes easier to notice and harder to ignore.`
                    : group.rows[0]?.shift}
            </p>
        </article>
    );
}

function AdvancedSignalsSection({ vm, seasonal }: { vm: V4VM; seasonal: { items: SeasonalItem[] } }) {
    const acgNotes = Object.entries(vm.relocated.acgLineNotes);
    const hasSignals = vm.relocated.chartRulerReframe
        || acgNotes.length > 0
        || seasonal.items.length > 0
        || vm.relocated.modalityHits.length > 0;
    if (!hasSignals) return null;
    return (
        <>
            <SectionHead
                index="04"
                title="Advanced signals"
                sub="Extra chart receipts are here when you want the deeper why."
            />
            <div className="flex flex-col gap-3">
                {vm.relocated.chartRulerReframe && (
                    <AdvancedDisclosure title="Chart ruler detail">
                        <ChartRulerDetail cr={vm.relocated.chartRulerReframe} />
                    </AdvancedDisclosure>
                )}
                {acgNotes.length > 0 && (
                    <AdvancedDisclosure title="Planetary lines amplifying here">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {acgNotes.map(([key, note]) => (
                                <AcgLineNoteCard key={key} lineKey={key} note={note} />
                            ))}
                        </div>
                    </AdvancedDisclosure>
                )}
                {seasonal.items.length > 0 && (
                    <AdvancedDisclosure title="Seasonal triggers">
                        <div className="grid grid-cols-1 gap-3 sm:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                            {seasonal.items.map((item, index) => (
                                <SeasonalCard key={index} item={item} />
                            ))}
                        </div>
                    </AdvancedDisclosure>
                )}
                {vm.relocated.modalityHits.length > 0 && (
                    <AdvancedDisclosure title="Late-degree pressure points">
                        <div className="grid grid-cols-1 gap-3 sm:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                            {vm.relocated.modalityHits.map((hit) => (
                                <ModalityHitCard key={hit.hitKey} hit={hit} />
                            ))}
                        </div>
                    </AdvancedDisclosure>
                )}
            </div>
        </>
    );
}

function AdvancedDisclosure({ title, children }: { title: string; children: ReactNode }) {
    return (
        <details
            className="rounded-[8px] border px-5 py-4 sm:px-6"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: "var(--surface-border)",
                boxShadow: "var(--reading-card-shadow)",
            }}
        >
            <summary
                className="cursor-pointer text-[10px] tracking-[0.18em] uppercase"
                style={{ fontFamily: FONT_MONO, color: "var(--text-primary)", fontWeight: 700 }}
            >
                {title}
            </summary>
            <div className="mt-4">{children}</div>
        </details>
    );
}

function ChartRulerDetail({ cr }: { cr: NonNullable<V4VM["relocated"]["chartRulerReframe"]> }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-[10px] min-w-0">
                    <span
                        className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                        style={{
                            color: "var(--text-primary)",
                            background: "transparent",
                        }}
                    >
                        <PlanetIcon planet={cr.ruler} color="currentColor" size={18} />
                    </span>
                    <div
                        className="text-[10px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-primary)", fontWeight: 700 }}
                    >
                        {cr.ruler}
                    </div>
                </div>
                <div
                    className="grid min-w-[180px] grid-cols-[1fr_18px_1fr] items-center gap-2"
                >
                    <HouseChip label="Natally" house={cr.fromHouse} />
                    <div className="text-center" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>→</div>
                    <HouseChip label="Here" house={cr.toHouse} />
                </div>
            </div>
            <h3
                className="m-0 text-[18px] leading-[1.15]"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 500 }}
            >
                {cr.headline}
            </h3>
            <p
                className="m-0 max-w-[760px] text-[14px] leading-[1.55] [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)", fontWeight: 300 }}
            >
                <RichText>{cr.body}</RichText>
            </p>
        </div>
    );
}

function HouseChip({ label, house }: { label: string; house: number }) {
    return (
        <div className="px-2 min-w-0">
            <div
                className="text-[8px] tracking-[0.18em] uppercase"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)", fontWeight: 700 }}
            >
                {label}
            </div>
            <div
                className="text-[13px] leading-[1.1] mt-[2px]"
                style={{ fontFamily: FONT_MONO, color: "var(--text-primary)", fontWeight: 700 }}
            >
                H{house}
            </div>
        </div>
    );
}

function AcgLineNoteCard({ lineKey, note }: { lineKey: string; note: { headline: string; body: string }; }) {
    const [planet, angle] = lineKey.split("-");
    return (
        <div
            className="p-5 rounded-[8px] border"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: "var(--surface-border)",
            }}
        >
            <div
                className="text-[10px] tracking-[0.16em] uppercase mb-2"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)", fontWeight: 700 }}
            >
                {planet} · {angle?.toUpperCase()}
            </div>
            <h4
                className="text-[15px] m-0 mb-2"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 600 }}
            >
                {note.headline}
            </h4>
            <p
                className="text-[14px] leading-[1.55] m-0"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {note.body}
            </p>
        </div>
    );
}

function ModalityHitCard({ hit }: { hit: V4VM["relocated"]["modalityHits"][number]; }) {
    return (
        <div
            className="p-5 rounded-[8px] border"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: "var(--surface-border)",
            }}
        >
            <div className="mb-3">
                <ReadingTonePill tone="spiced">{hit.hitKey.replace(/-/g, " · ")}</ReadingTonePill>
            </div>
            <h4
                className="text-[15px] m-0 mb-2"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 600 }}
            >
                {hit.headline}
            </h4>
            <p
                className="text-[14px] leading-[1.55] m-0"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {hit.body}
            </p>
        </div>
    );
}

function ChartPanel({
    title,
    subtitle,
    wheel,
    isDark,
    emptyText,
    accent,
    muted,
    mode = "natal",
}: {
    title: string;
    subtitle: string;
    wheel: { cusps: number[]; planets: NatalPlanet[] } | null;
    isDark: boolean;
    emptyText: string;
    accent?: boolean;
    muted?: boolean;
    mode?: "natal" | "relocated";
}) {
    return (
        <section
            className="rounded-[8px] border px-5 py-5 sm:px-6 sm:py-6"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: accent
                    ? "var(--reading-card-border-accent)"
                    : "var(--surface-border)",
                boxShadow: "var(--reading-card-shadow)",
                opacity: muted ? 0.88 : 1,
            }}
        >
            <header className="flex items-baseline justify-between gap-2 mb-2">
                <h3 className="text-[16px] m-0 uppercase tracking-[0.08em]" style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}>
                    {title}
                </h3>
                <span className="text-[9px] tracking-[0.16em] uppercase" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>
                    {subtitle}
                </span>
            </header>
            {wheel ? (
                <>
                    <div className="max-w-[760px] mx-auto py-2 xl:max-w-[620px]">
                        <NatalMockupWheel
                            isDark={isDark}
                            planets={wheel.planets}
                            cusps={wheel.cusps}
                            mode={mode}
                        />
                    </div>
                    <ChartParamStrip cusps={wheel.cusps} />
                </>
            ) : (
                <p className="text-[10px] tracking-[0.14em] uppercase text-center p-4 m-0" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>
                    {emptyText}
                </p>
            )}
        </section>
    );
}

function ChartParamStrip({ cusps }: { cusps: number[] }) {
    const fmt = (lon: number) => {
        const norm = ((lon % 360) + 360) % 360;
        const signs = ["Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"];
        const idx = Math.floor(norm / 30) % 12;
        const inSign = norm - idx * 30;
        const whole = Math.floor(inSign);
        const min = Math.round((inSign - whole) * 60);
        return `${whole}°${min.toString().padStart(2, "0")}′ ${signs[idx]}`;
    };
    const fields: Array<[string, number]> = [
        ["ASC", cusps[0]], ["IC", cusps[3]], ["DSC", cusps[6]], ["MC", cusps[9]],
    ];
    return (
        <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mt-4"
        >
            {fields.map(([k, v]) => (
                <div key={k} className="flex flex-col">
                    <span
                        className="text-[8px] tracking-[0.22em] uppercase font-bold"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        {k}
                    </span>
                    <span
                        className="text-[11px] tabular-nums"
                        style={{
                            fontFamily: FONT_MONO,
                            color: "var(--text-primary)",
                            fontWeight: 500,
                        }}
                    >
                        {fmt(v)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ModePill({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className="px-3 py-1.5 rounded-full text-[10px] tracking-[0.12em] uppercase border"
            style={{
                fontFamily: FONT_MONO,
                color: active ? "var(--text-on-y2k-blue)" : "var(--text-tertiary)",
                borderColor: active ? "var(--color-y2k-blue)" : "transparent",
                background: active
                    ? "var(--color-y2k-blue)"
                    : "transparent",
            }}
        >
            {label}
        </button>
    );
}

function shortPlace(place: string): string {
    const parts = place.split(",").map((p) => p.trim()).filter(Boolean);
    return parts.slice(0, 2).join(", ");
}

// ─── Lead synthesizer ──────────────────────────────────────────────────────

function buildLead(vm: V4VM): string {
    // Prefer LLM-authored outcome-first opener when present.
    if (vm.chrome.whatShiftsLead && vm.chrome.whatShiftsLead.trim()) {
        return vm.chrome.whatShiftsLead.trim();
    }
    // Fallback: synthesize from the strongest angle sign-shift.
    const changed = vm.relocated.angles.filter((a) => signOf(a.natal) !== signOf(a.relocated));
    const headline = changed[0] ?? vm.relocated.angles[0];
    if (!headline) return vm.chrome.step7Intro;

    // Use the angle's plain-English topic ("How you come across") as the verb subject.
    const topic = headline.plain || headline.name;
    const place = vm.relocated.travel.place;
    return `In ${place}, ${topic.toLowerCase()} shifts from ${headline.natal} into ${headline.relocated} — the rest of the chart reshapes around that move.`;
}

function signOf(formatted: string): string {
    // "24° Aries" → "Aries"
    const m = formatted.match(/[A-Z][a-z]+$/);
    return m ? m[0] : formatted;
}

// ─── Seasonal triggers builder ────────────────────────────────────────────

interface SeasonalItem {
    kind: "eclipse" | "lunation" | "progression";
    label: string;       // "Solar eclipse · April 8"
    angle?: string;      // "geo-MC"
    natalContact?: string;
    body: string;        // narrative one-liner
    tone: "supportive" | "friction" | "neutral";
}

function buildSeasonal(vm: V4VM): { items: SeasonalItem[] } {
    const items: SeasonalItem[] = [];

    // Eclipses (negative-only, frictional by definition)
    for (const e of vm.eclipses?.hits ?? []) {
        items.push({
            kind: "eclipse",
            label: `${e.kind === "solar" ? "Solar" : "Lunar"} eclipse · ${formatDate(e.dateUtc)}`,
            angle: angleLabel(e.activatedAngle),
            natalContact: e.natalContact,
            body: `${e.kind === "solar" ? "A solar eclipse" : "A lunar eclipse"} at ${formatDeg(e.degree)} ${e.sign} lights up the destination's ${angleLabel(e.activatedAngle)} and brushes your natal ${e.natalContact}. Treat the days around it gently.`,
            tone: "friction",
        });
    }

    // Lunations (bidirectional)
    for (const l of vm.lunations?.hits ?? []) {
        const isNew = l.kind === "new-moon";
        const meaning = geodeticPlanetMeaning(l.natalContact);
        const themeHint = meaning ? ` — ${meaning.theme}` : "";
        items.push({
            kind: "lunation",
            label: `${isNew ? "New moon" : "Full moon"} · ${formatDate(l.dateUtc)}`,
            angle: angleLabel(l.activatedAngle),
            natalContact: l.natalContact,
            body: `${isNew ? "Fresh-start" : "Exposure"} signature at ${formatDeg(l.degree)} ${l.sign}, on the ${angleLabel(l.activatedAngle)} and your natal ${l.natalContact}${themeHint}.`,
            tone: isNew ? "supportive" : "friction",
        });
    }

    // Progressions: only if the destination falls in a band
    if (vm.progressions) {
        for (const b of vm.progressions.bands) {
            if (!b.destinationInBand) continue;
            const isSun = b.planet === "Sun";
            items.push({
                kind: "progression",
                label: `Progressed ${b.planet} band`,
                body: isSun
                    ? `Your progressed Sun is in ${b.sign} (${b.longitudeRange}), the slow identity-band you're moving through. This place sits inside it — the alignment is multi-year.`
                    : `Your progressed Moon is in ${b.sign} (${b.longitudeRange}), the ~2.5-year emotional home zone. This place sits inside it.`,
                tone: "supportive",
            });
        }
    }

    // Sort by tone (friction first to flag caution), then by label
    items.sort((a, b) => {
        if (a.tone === b.tone) return a.label.localeCompare(b.label);
        if (a.tone === "friction") return -1;
        if (b.tone === "friction") return 1;
        return 0;
    });
    return { items };
}

function angleLabel(activated: "geoMC" | "geoIC" | "geoASC" | "geoDSC"): string {
    return ({ geoMC: "geodetic MC", geoIC: "geodetic IC", geoASC: "geodetic ASC", geoDSC: "geodetic DSC" })[activated];
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDeg(deg: number): string {
    const inSign = deg % 30;
    const whole = Math.floor(inSign);
    const min = Math.round((inSign - whole) * 60);
    return `${whole}°${min.toString().padStart(2, "0")}'`;
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function AngleCard({
    angle: a,
    aspects = [],
}: {
    angle: V4VM["relocated"]["angles"][number];
    aspects?: V4VM["relocated"]["aspectsToAngles"];
}) {
    const moved = signOf(a.natal) !== signOf(a.relocated);
    return (
        <article
            className="px-5 py-5 rounded-[8px] border flex flex-col gap-4 sm:px-6"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: "var(--surface-border)",
                boxShadow: "var(--reading-card-shadow)",
            }}
        >
            <div className="flex justify-between items-baseline gap-3 flex-wrap">
                <ReadingTonePill tone={moved ? "spiced" : "acqua"}>{a.name}</ReadingTonePill>
                <div
                    className="text-[13px] font-light"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    {a.plain}
                </div>
            </div>
            <div
                className="grid items-center gap-x-4 gap-y-2 grid-cols-[1fr_20px_1fr] min-w-0"
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
                <div className="text-center" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>→</div>
                <div>
                    <div
                        className="text-[9px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Here
                    </div>
                    <div
                        className="text-[18px] leading-[1.1] tracking-[-0.005em] mt-[2px]"
                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
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
            {aspects.length > 0 && (
                <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor: "var(--surface-border)" }}>
                    <div
                        className="text-[9px] tracking-[0.22em] uppercase font-bold"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Aspects to {shortAngleLabel(a.name)}
                    </div>
                    <AspectSpectrum aspects={aspects} />
                    <div className="flex flex-col gap-2">
                        {aspects.map((asp, i) => (
                            <AspectRow key={i} aspect={asp} angleShort={shortAngleLabel(a.name)} />
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}

function AspectSpectrum({ aspects }: { aspects: V4VM["relocated"]["aspectsToAngles"] }) {
    return (
        <div className="flex flex-col gap-[6px] py-2">
            <div className="flex justify-between items-center" style={{ fontFamily: FONT_MONO }}>
                <span
                    className="text-[8px] tracking-[0.22em] uppercase"
                    style={{ color: ASPECT_FRICTION, fontWeight: 700 }}
                >
                    friction
                </span>
                <span
                    className="text-[8px] tracking-[0.22em] uppercase"
                    style={{ color: "var(--text-tertiary)", fontWeight: 700 }}
                >
                    angle
                </span>
                <span
                    className="text-[8px] tracking-[0.22em] uppercase"
                    style={{ color: ASPECT_HARMONY, fontWeight: 700 }}
                >
                    harmony
                </span>
            </div>
            <div className="relative h-[28px]">
                <div
                    className="absolute left-0 right-0 top-1/2 h-px"
                    style={{
                        background: `linear-gradient(to right, ${ASPECT_FRICTION} 0%, var(--surface-border) 50%, ${ASPECT_HARMONY} 100%)`,
                        transform: "translateY(-50%)",
                    }}
                />
                <div
                    className="absolute top-1/2 left-1/2 w-[1px] h-3"
                    style={{
                        background: "var(--text-tertiary)",
                        transform: "translate(-50%, -50%)",
                    }}
                />
                {aspects.map((a, i) => {
                    const name = parseAspectName(a.aspect);
                    const orb = parseOrb(a.aspect);
                    const x = ASPECT_X[name] ?? 50;
                    const opacity = tightnessOpacity(orb);
                    const color = aspectColor(name);
                    return (
                        <div
                            key={i}
                            className="absolute top-1/2"
                            style={{
                                left: `${x}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            title={`${a.planet} ${name} · orb ${orb.toFixed(1)}°`}
                        >
                            <span
                                className="block text-[18px] leading-none"
                                style={{
                                    color,
                                    opacity,
                                    fontFamily: FONT_PRIMARY,
                                    textShadow: `0 0 6px color-mix(in oklab, ${color} 40%, transparent)`,
                                }}
                            >
                                {a.glyph}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AspectRow({
    aspect: a,
    angleShort,
}: {
    aspect: V4VM["relocated"]["aspectsToAngles"][number];
    angleShort: string;
}) {
    const name = parseAspectName(a.aspect);
    const orb = parseOrb(a.aspect);
    const accent = aspectColor(name);
    const glyph = ASPECT_GLYPH[name] ?? "·";
    return (
        <div
            className="pl-3 flex flex-col gap-1"
            style={{ borderLeft: `2px solid ${accent}` }}
        >
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div
                    className="flex items-baseline gap-[6px] text-[13px] flex-wrap"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                >
                    <span className="text-[15px]" style={{ color: accent }}>{a.glyph}</span>
                    <span className="font-medium">{a.planet}</span>
                    <span className="text-[14px]" style={{ color: accent }}>{glyph}</span>
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{angleShort}</span>
                </div>
                <div
                    className="text-[10px] tracking-[0.04em] tabular-nums"
                    style={{ fontFamily: FONT_MONO, color: accent, fontWeight: 600 }}
                >
                    orb {orb.toFixed(1)}°
                </div>
            </div>
            <p
                className="text-[12px] leading-[1.5] m-0 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {a.plain}
            </p>
        </div>
    );
}

function PlanetShiftCard({ row, sign }: { row: V4VM["relocated"]["planetsInHouses"][number]; sign?: string }) {
    const meaning = geodeticPlanetMeaning(row.planet);
    return (
        <article
            className="relative overflow-hidden px-5 py-5 rounded-[8px] border flex flex-col gap-4 sm:px-6"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: "var(--reading-card-border-accent)",
                boxShadow: "0 18px 42px rgba(27, 27, 27, 0.08)",
            }}
        >
            <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "var(--color-y2k-blue)" }}
            />
            <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-[10px]">
                    <span
                        className="text-[24px] w-[24px] text-center leading-none"
                        style={{ color: "var(--color-y2k-blue)" }}
                    >
                        {row.glyph}
                    </span>
                    <span
                        className="text-[18px] leading-[1.1]"
                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                    >
                        {row.planet}
                    </span>
                </div>
                {meaning && (
                    <ReadingTonePill tone="acqua">{meaning.theme}</ReadingTonePill>
                )}
            </header>
            <div
                className="grid items-stretch gap-x-4 gap-y-3 grid-cols-[1fr_18px_1fr]"
            >
                <div className="min-w-0">
                    <div
                        className="text-[9px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Back home
                    </div>
                    <div
                        className="text-[14px] tracking-[0.02em] mt-[3px]"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-primary)" }}
                    >
                        {row.natalHouse}
                    </div>
                </div>
                <div className="text-center self-center" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>→</div>
                <div className="min-w-0">
                    <div
                        className="text-[9px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Here
                    </div>
                    <div
                        className="text-[14px] tracking-[0.02em] font-bold mt-[3px]"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-primary)" }}
                    >
                        {row.reloHouse}
                    </div>
                    {sign && (
                        <div
                            className="mt-1 text-[10px] tracking-[0.08em] uppercase"
                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                        >
                            {sign}
                        </div>
                    )}
                </div>
            </div>
            <p
                className="text-[14px] leading-[1.6] m-0 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
            >
                {row.shift}
            </p>
        </article>
    );
}

function SeasonalCard({ item }: { item: SeasonalItem }) {
    return (
        <article
            className="px-5 py-5 rounded-[8px] border flex flex-col gap-3"
            style={{
                background: "var(--reading-card-bg)",
                borderColor: "var(--surface-border)",
            }}
        >
            <header className="flex items-baseline justify-between gap-2 flex-wrap">
                <ReadingTonePill tone={item.tone === "friction" ? "spiced" : "acqua"}>{item.label}</ReadingTonePill>
                {item.angle && (
                    <div
                        className="text-[10px] tracking-[0.06em] lowercase italic font-light"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                    >
                        on your {item.angle}
                    </div>
                )}
            </header>
            <p
                className="text-[13px] leading-[1.55] m-0 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
            >
                {item.body}
            </p>
            {item.natalContact && (
                <div
                    className="text-[10px] tracking-[0.06em] lowercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    natal {item.natalContact}
                </div>
            )}
        </article>
    );
}
