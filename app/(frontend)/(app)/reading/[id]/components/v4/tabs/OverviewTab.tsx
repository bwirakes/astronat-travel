"use client";

import { AcgMap, type NatalData } from "@/app/components/AcgMap";
import PlanetIcon from "@/app/components/PlanetIcon";
import SignIcon from "@/app/components/SignIcon";
import {
    Activity,
    Briefcase,
    Clock,
    Coins,
    Handshake,
    Heart,
    Home,
    MapPinned,
    Sparkles,
    User,
    Users,
} from "lucide-react";
import SectionHead from "../../shared/SectionHead";
import TabSection from "../../shared/TabSection";
import { appendChartRulerDignityNote, GuideRowBadge, mergeGuideRows, RichText } from "../../shared/ReadingCopy";
import { BrandSparkle } from "@/app/components/ui/svg-shapes";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    copiedTab: V4VM["tabs"]["copy"][keyof V4VM["tabs"]["copy"]] | undefined;
    selectTab?: (id: string, scrollToPanels?: boolean) => void;
    natalForMap?: NatalData | null;
    birthIso?: string;
    birthLocation?: {
        lat?: number;
        lon?: number;
        city?: string;
    };
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

function WireframeGlobe() {
    // Stroke 0.5 on a 100×100 viewBox renders ~1.5–2.5 px at the 300–500 px
    // display sizes used here. Combined with the ~0.06 opacity wrapper, that
    // lands at "barely visible texture" — enough to read as a wireframe
    // globe without competing with the lede. 0.25 was effectively invisible.
    return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <circle cx="50" cy="50" r="48" />
            <ellipse cx="50" cy="50" rx="48" ry="16" />
            <ellipse cx="50" cy="50" rx="48" ry="32" />
            <ellipse cx="50" cy="50" rx="16" ry="48" />
            <ellipse cx="50" cy="50" rx="32" ry="48" />
            <line x1="50" y1="2" x2="50" y2="98" />
            <line x1="2" y1="50" x2="98" y2="50" />
        </svg>
    );
}

export default function OverviewTab({ vm, copiedTab, selectTab, natalForMap, birthIso, birthLocation }: Props) {
    const selectedGoals = vm.scoreNarrative.selectedGoals;
    const selectedGoal = selectedGoals[0];
    const leanInto = vm.tabs.overview?.leanInto ?? [];
    const watchOut = vm.tabs.overview?.watchOut ?? [];
    const scoreExplanation = vm.tabs.overview?.scoreExplanation || "";
    const aiLead = copiedTab?.lead?.trim() || "";
    const aiIntro = copiedTab?.plainEnglishSummary?.trim() || "";
    const fallbackLede = aiLead || scoreExplanation || vm.hero.explainer || "";
    // Prefer the AI lead in the dek slot; surface scoreExplanation as the
    // body paragraph below it. If the two are identical (rare, but happens
    // when the model uses scoreExplanation for both) collapse to one.
    const rawSummary =
        aiIntro && aiIntro !== aiLead
            ? aiIntro
            : scoreExplanation && scoreExplanation !== aiLead
            ? scoreExplanation
            : !aiLead
                ? vm.hero.explainer || undefined
                : undefined;
    const summary = appendChartRulerDignityNote(rawSummary, vm.relocated.chartRuler);
    const sunSign =
        vm.chart.natal.find((cp) => cp.p?.toLowerCase() === "sun")?.sign
        ?? vm.chart.natal.find((cp) => cp.p?.toLowerCase() === "moon")?.sign
        ?? vm.chart.natal[0]?.sign;
    const watermarkSign = sunSign
        ? sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase()
        : null;
    const topTheme = vm.scoreNarrative.strongestThemes[0];
    const weakestTheme = vm.scoreNarrative.lessEmphasized[0];
    const timing = vm.travelWindows[0];
    const timingTitle = vm.timeline.grain === "month" ? "Arrive then" : "Go then";
    const timingSectionTitle = vm.timeline.grain === "month" ? "Best month to arrive" : "Best timing";
    const overviewGuideRows = mergeGuideRows(copiedTab?.guideRows, [
        {
            label: "Best Used For",
            body: leanInto[0]
                || (topTheme ? `${topTheme.label} is the strongest support here at ${Math.round(topTheme.score)}/100, so let it carry the trip.` : "Use this place for the life area that has the clearest score support."),
        },
        {
            label: "Move Carefully With",
            body: watchOut[0]
                || (weakestTheme
                    ? `${weakestTheme.label} is weaker here at ${Math.round(weakestTheme.score)}/100, so keep it low-stakes.`
                    : "Do not ask this place to solve every life area at once."),
        },
        {
            label: "Your Next Move",
            body: selectedGoal
                ? `Choose one ${selectedGoal.label.toLowerCase()} priority, then plan the trip around the strongest supporting theme instead of forcing everything.`
                : "Choose one clear priority, then keep the itinerary simple enough to protect your energy.",
        },
    ])?.map((row) => {
        if (row.label === "Best Used For") return { ...row, label: "Use this for", badgeVariant: "overview-use" as const };
        if (row.label === "Move Carefully With") return { ...row, label: "Don't use this for", badgeVariant: "overview-avoid" as const };
        return { ...row, label: "Do next", badgeVariant: "overview-next" as const };
    });

    return (
        <TabSection
            kicker="Overview"
            title="At a Glance"
            lead={fallbackLede}
            intro={summary}
            guideRows={overviewGuideRows}
            maxSentences={5}
            quietCopy
            preserveGuideLabels
            guideLayout="flow"
            guideFlowVariant="overview"
        >
            <div className="relative w-full max-w-none">
                {/* Macro-Texture: Editorial Wireframe Globe */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute right-[0%] top-0 -z-10 w-[clamp(300px,40vw,500px)] h-[clamp(300px,40vw,500px)] opacity-[0.06]"
                    style={{ color: "var(--text-primary)" }}
                >
                    <WireframeGlobe />
                </div>
                {/* Faint Sign Icon Layered with Globe */}
                {watermarkSign && (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute right-[10%] top-[10%] -z-10 hidden md:block opacity-[0.03]"
                        style={{ color: "var(--text-primary)" }}
                    >
                        <SignIcon sign={watermarkSign} size={220} />
                    </div>
                )}

                {selectedGoals.length > 0 && (
                    <>
                        <SectionHead
                            index="00"
                            title="Your selected goals"
                            flush
                        />
                        <SelectedGoalsPanel goals={selectedGoals} />
                    </>
                )}

                <SectionHead
                    index="01"
                    title="How to use this place"
                    flush={selectedGoals.length === 0}
                />
                <section
                    className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l"
                    style={{ borderColor: "var(--surface-border)" }}
                >
                        <AnswerCard
                            label="Use this for"
                            subhead={topTheme ? `${topTheme.label} has the most support here` : "The clearest yes in this location"}
                            items={leanInto.length ? leanInto.slice(0, 2) : [topTheme?.label || "This is the clearest thing to build the reading around."]}
                            tone="supportive"
                            badgeIndex={0}
                            badgeVariant="theme-use"
                        />
                        <AnswerCard
                            label="Don't use this for"
                            subhead={weakestTheme ? `${weakestTheme.label} needs a lighter touch` : "The place cannot carry everything at once"}
                            items={watchOut.length ? watchOut.slice(0, 2) : ["Do not make this place carry every goal at once."]}
                            tone="caution"
                            badgeIndex={1}
                            badgeVariant="theme-avoid"
                        />
                </section>

                <SectionHead
                    index="02"
                    title="Astrocartography map"
                />
                <AstrocartographyPanel
                    vm={vm}
                    natalForMap={natalForMap}
                    birthIso={birthIso}
                    birthLocation={birthLocation}
                    onOpenPlaceField={() => selectTab?.("place-field", true)}
                />

                {timing && (
                    <>
                        <SectionHead
                            index="03"
                            title={timingSectionTitle}
                        />
                        <TimingSummary
                            label={timingTitle}
                            title={timing.dates}
                            body={timing.note}
                            score={timing.score}
                            onClick={() => selectTab?.("timing", true)}
                        />
                    </>
                )}

                <SectionHead
                    index={timing ? "04" : "03"}
                    title="Life themes details"
                />
                <LifeThemesDrawer vm={vm} />
            </div>
        </TabSection>
    );
}

type GoalFit = V4VM["scoreNarrative"]["selectedGoals"][number];
type LineRow = V4VM["astrology"]["lines"][number];

function SelectedGoalsPanel({ goals }: { goals: GoalFit[] }) {
    return (
        <section className="mb-[clamp(28px,4vw,48px)]">
            <div className="flex flex-col">
                {goals.map((goal) => (
                    <GoalFitRow key={goal.goalId} goal={goal} />
                ))}
            </div>
        </section>
    );
}

function GoalFitRow({ goal }: { goal: GoalFit }) {
    const score = Math.round(goal.score);
    const scoreColor = subsectionScoreColor(goal.score);
    return (
        <article
            className="grid gap-x-5 gap-y-3 py-[clamp(18px,2.4vw,28px)] border-b sm:grid-cols-[auto_minmax(0,1fr)_minmax(112px,auto)] sm:items-center"
            style={{ borderColor: "var(--surface-border)" }}
        >
            <div
                aria-hidden
                className="grid size-12 place-items-center"
                style={{ color: scoreColor, lineHeight: 1 }}
            >
                <GoalIcon goalId={goal.goalId} />
            </div>
            <div className="min-w-0">
                <h3
                    className="m-0 mb-1 leading-tight"
                    style={{ color: "var(--text-primary)", fontFamily: FONT_PRIMARY, fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 400 }}
                >
                    {goal.label}
                </h3>
                <p
                    className="m-0 max-w-[78ch] text-[15px] leading-[1.55] [text-wrap:pretty]"
                    style={{ color: "var(--text-secondary)", fontFamily: FONT_BODY }}
                >
                    {goalCommentary(goal)}
                </p>
            </div>
            <div
                className="tabular-nums justify-self-end sm:text-right"
                style={{ color: scoreColor, fontFamily: FONT_MONO }}
            >
                <strong className="text-[clamp(32px,4.5vw,54px)] font-semibold leading-none">{score}</strong>
                <span className="text-[13px]">/100</span>
            </div>
        </article>
    );
}

function GoalIcon({ goalId }: { goalId: string }) {
    const props = { size: 30, strokeWidth: 1.75 };
    switch (goalId) {
        case "identity": return <User {...props} />;
        case "wealth": return <Coins {...props} />;
        case "home": return <Home {...props} />;
        case "romance":
        case "love": return <Heart {...props} />;
        case "health": return <Activity {...props} />;
        case "partnerships": return <Handshake {...props} />;
        case "career": return <Briefcase {...props} />;
        case "friendship":
        case "community": return <Users {...props} />;
        case "spirituality":
        case "growth": return <Sparkles {...props} />;
        case "relocation": return <MapPinned {...props} />;
        case "timing": return <Clock {...props} />;
        default: return <Sparkles {...props} />;
    }
}

function AstrocartographyPanel({
    vm,
    natalForMap,
    birthIso,
    birthLocation,
    onOpenPlaceField,
}: {
    vm: V4VM;
    natalForMap?: NatalData | null;
    birthIso?: string;
    birthLocation?: Props["birthLocation"];
    onOpenPlaceField?: () => void;
}) {
    const nearbyLines = [...vm.astrology.lines]
        .filter((line) => line.planet && line.angle)
        .sort((a, b) => Math.abs(a.distKm) - Math.abs(b.distKm))
        .slice(0, 3);
    const statusCounts = lineStatusCounts(nearbyLines);
    const hasBirthCoords = typeof birthLocation?.lat === "number" && typeof birthLocation.lon === "number";
    const canRenderMap = !!natalForMap;

    return (
        <section
            className="grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)] gap-0 border-t border-l border-r border-b mb-[clamp(34px,5vw,58px)]"
            style={{ borderColor: "var(--surface-border)" }}
        >
            <div className="min-w-0 border-b lg:border-b-0 lg:border-r p-[clamp(16px,2.4vw,24px)]" style={{ borderColor: "var(--surface-border)" }}>
                {canRenderMap ? (
                    <AcgMap
                        natal={natalForMap}
                        birthDateTimeUTC={birthIso}
                        birthLat={hasBirthCoords ? birthLocation?.lat : undefined}
                        birthLon={hasBirthCoords ? birthLocation?.lon : undefined}
                        birthCity={birthLocation?.city}
                        highlightCity={{
                            lat: vm.location.lat,
                            lon: vm.location.lon,
                            name: vm.location.city,
                            score: vm.hero.baselineScore,
                        }}
                        compact
                        height="clamp(360px, 38vw, 540px)"
                        fillContainer
                        interactive
                        autoZoomToCity={false}
                    />
                ) : (
                    <div
                        className="grid min-h-[320px] place-items-center border"
                        style={{ borderColor: "var(--surface-border)", background: "color-mix(in oklab, var(--text-primary) 2%, var(--bg))" }}
                    >
                        <p className="m-0 max-w-[42ch] px-6 text-center text-[14px] leading-[1.6]" style={{ color: "var(--text-secondary)", fontFamily: FONT_BODY }}>
                            The map needs complete natal planet data. The nearby line summary still shows what the reading already calculated.
                        </p>
                    </div>
                )}
            </div>
            <div className="min-w-0 p-[clamp(18px,2.4vw,26px)]">
                <div
                    className="mb-[8px] text-[10px] tracking-[0.16em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    Near {vm.location.city}
                </div>
                <h3
                    className="m-0 mb-[10px] leading-[1.05] [text-wrap:balance]"
                    style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(26px,3.2vw,38px)", fontWeight: 400, color: "var(--text-primary)" }}
                >
                    The lines explain why the place has a charge.
                </h3>
                <p
                    className="m-0 mb-[16px] text-[14px] leading-[1.55] [text-wrap:pretty]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    Astrocartography shows where natal planets become louder by location. Closer lines have more say in the score and lived texture.
                </p>
                <MapStatusSummary counts={statusCounts} />

                <div className="flex flex-col border-t" style={{ borderColor: "var(--surface-border)" }}>
                    {nearbyLines.length > 0 ? nearbyLines.map((line) => (
                        <NearbyLineCard key={`${line.planet}-${line.angle}-${line.distKm}`} line={line} />
                    )) : (
                        <NearbyEmptyCard city={vm.location.city} />
                    )}
                    <MapMethodCard />
                </div>

                {onOpenPlaceField && (
                    <button
                        type="button"
                        onClick={onOpenPlaceField}
                        className="mt-[18px] inline-flex min-h-10 items-center justify-center border px-4 text-[11px] tracking-[0.16em] uppercase"
                        style={{
                            borderColor: "var(--text-primary)",
                            color: "var(--text-primary)",
                            fontFamily: FONT_MONO,
                            background: "transparent",
                        }}
                    >
                        Open place field
                    </button>
                )}
            </div>
        </section>
    );
}

function NearbyLineCard({ line }: { line: LineRow }) {
    const contribution = Math.round(line.contribution);
    const tone = contribution > 0
        ? "var(--lift-accent)"
        : contribution < 0
            ? "var(--color-spiced-life)"
            : "var(--text-tertiary)";
    const status = lineStatus(line.contribution);
    return (
        <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 py-[11px] border-b" style={{ borderColor: "var(--surface-border)" }}>
            <div className="pt-[3px]" style={{ color: line.color || tone }}>
                <PlanetIcon planet={capitalizePlanet(line.planet)} size={22} />
            </div>
            <div className="min-w-0">
                <h4 className="m-0 mb-[4px] flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px] leading-[1.25]" style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 400 }}>
                    <span>{capitalizePlanet(line.planet)} {line.angle}</span>
                    <LineStatusPill status={status} />
                </h4>
                <p className="m-0 text-[13px] leading-[1.45] [text-wrap:pretty]" style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                    {compactLineNote(line.note || lineExplanation(line), line.angle)}
                </p>
            </div>
            <div className="text-right">
                <div className="text-[11px] tracking-[0.12em] uppercase" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>
                    {Math.round(line.distKm)} km
                </div>
                <div className="mt-[4px] text-[12px] tabular-nums" style={{ fontFamily: FONT_MONO, color: tone }}>
                    {contribution > 0 ? "+" : ""}{contribution}
                </div>
            </div>
        </article>
    );
}

type LineStatus = "good" | "neutral" | "hard";

function lineStatus(contribution: number): LineStatus {
    if (contribution >= 4) return "good";
    if (contribution <= -4) return "hard";
    return "neutral";
}

function LineStatusPill({ status }: { status: LineStatus }) {
    const labels: Record<LineStatus, string> = {
        good: "Good",
        neutral: "Neutral",
        hard: "Hard",
    };
    const color = lineStatusColor(status);
    return (
        <span
            className="inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] tracking-[0.12em] uppercase"
            style={{
                borderColor: color,
                color,
                fontFamily: FONT_MONO,
                lineHeight: 1,
            }}
        >
            <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: color }}
            />
            {labels[status]}
        </span>
    );
}

function lineStatusCounts(lines: LineRow[]): Record<LineStatus, number> {
    return lines.reduce<Record<LineStatus, number>>(
        (counts, line) => {
            counts[lineStatus(line.contribution)] += 1;
            return counts;
        },
        { good: 0, neutral: 0, hard: 0 },
    );
}

function MapStatusSummary({ counts }: { counts: Record<LineStatus, number> }) {
    const items: Array<{ status: LineStatus; label: string }> = [
        { status: "good", label: "Good" },
        { status: "neutral", label: "Neutral" },
        { status: "hard", label: "Hard" },
    ];
    return (
        <div className="mb-[14px] flex flex-wrap gap-2">
            {items.map((item) => (
                <span
                    key={item.status}
                    className="inline-flex items-center gap-2 border px-2.5 py-1.5 text-[10px] tracking-[0.12em] uppercase"
                    style={{
                        borderColor: lineStatusColor(item.status),
                        color: lineStatusColor(item.status),
                        fontFamily: FONT_MONO,
                    }}
                >
                    <span
                        aria-hidden
                        className="size-1.5 rounded-full"
                        style={{ background: lineStatusColor(item.status) }}
                    />
                    {counts[item.status]} {item.label}
                </span>
            ))}
        </div>
    );
}

function lineStatusColor(status: LineStatus): string {
    if (status === "good") return "var(--lift-accent)";
    if (status === "neutral") return "var(--gold)";
    return "var(--color-spiced-life)";
}

function NearbyEmptyCard({ city }: { city: string }) {
    return (
        <article className="py-[14px] border-b" style={{ borderColor: "var(--surface-border)" }}>
            <h4 className="m-0 mb-[4px] text-[16px] leading-[1.25]" style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 400 }}>
                Quiet line field
            </h4>
            <p className="m-0 text-[13px] leading-[1.55]" style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                No major personal line is close enough to make {city} a line-driven place. Read the city through goals, timing, and relocated houses first.
            </p>
        </article>
    );
}

function MapMethodCard() {
    return (
        <article className="py-[11px]">
            <h4 className="m-0 mb-[4px] text-[14px] tracking-[0.14em] uppercase leading-[1.25]" style={{ fontFamily: FONT_MONO, color: "var(--text-primary)", fontWeight: 500 }}>
                Why the map matters
            </h4>
            <p className="m-0 text-[13px] leading-[1.45] [text-wrap:pretty]" style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}>
                The map is the visual receipt; the cards translate the nearest lines.
            </p>
        </article>
    );
}

function LifeThemesDrawer({ vm }: { vm: V4VM }) {
    const rawThemes = vm.scoreNarrative.themes.length
        ? vm.scoreNarrative.themes
        : [...vm.scoreNarrative.strongestThemes, ...vm.scoreNarrative.lessEmphasized];
    const rankedThemes = [...rawThemes].sort((a, b) => b.score - a.score);
    if (!rankedThemes.length) return null;

    const topTheme = rankedThemes[0];
    const lowestTheme = rankedThemes[rankedThemes.length - 1];

    return (
        <details
            className="border-b group"
            style={{ borderColor: "var(--surface-border)" }}
        >
            <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-4 py-[clamp(20px,3vw,30px)] md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                <div className="min-w-0">
                    <div
                        className="mb-[8px] text-[10px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Expandable ranking
                    </div>
                    <h3
                        className="m-0 max-w-[22ch] leading-[1.05] [text-wrap:balance]"
                        style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(28px,7vw,42px)", fontWeight: 400, color: "var(--text-primary)" }}
                    >
                        Open the full theme ranking
                    </h3>
                </div>
                <div className="col-span-2 flex min-w-0 flex-wrap gap-2 md:col-span-1 md:col-start-2 md:row-start-1 md:justify-end">
                    {topTheme && (
                        <ThemeChip label={topTheme.label} score={topTheme.score} tone="lift" />
                    )}
                    {lowestTheme && lowestTheme.id !== topTheme?.id && (
                        <ThemeChip label={lowestTheme.label} score={lowestTheme.score} tone="press" />
                    )}
                </div>
                <span
                    className="col-start-2 row-start-1 grid size-10 place-items-center justify-self-end border text-[22px] leading-none transition-transform group-open:rotate-45 md:col-start-3"
                    style={{ borderColor: "var(--surface-border)", color: "var(--text-primary)" }}
                    aria-hidden
                >
                    +
                </span>
            </summary>
            <div className="grid grid-cols-1 gap-0 border-t md:grid-cols-2" style={{ borderColor: "var(--surface-border)" }}>
                <ThemeColumn
                    title="What gets louder"
                    themes={rankedThemes.slice(0, 4)}
                    tone="lift"
                />
                <ThemeColumn
                    title="What to keep lighter"
                    themes={rankedThemes.slice(-4).reverse()}
                    tone="press"
                />
            </div>
        </details>
    );
}

function ThemeColumn({
    title,
    themes,
    tone,
}: {
    title: string;
    themes: Array<V4VM["scoreNarrative"]["themes"][number]>;
    tone: "lift" | "press";
}) {
    const accent = tone === "lift"
        ? "var(--lift-accent)"
        : "var(--color-spiced-life)";
    return (
        <div className="min-w-0 border-b p-[clamp(18px,2.6vw,28px)] md:border-b-0 md:border-r last:border-r-0" style={{ borderColor: "var(--surface-border)" }}>
            <h4 className="m-0 mb-[16px] text-[22px] leading-[1.1]" style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 400 }}>
                {title}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-0 p-0 border-t" style={{ borderColor: accent }}>
                {themes.map((theme) => (
                    <li
                        key={`${tone}-${theme.id}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b py-[12px]"
                        style={{ borderColor: "var(--surface-border)" }}
                    >
                        <span className="min-w-0">
                            <span className="block text-[15px] leading-[1.35]" style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}>
                                {theme.label}
                            </span>
                            <span className="block mt-[4px] text-[12px] leading-[1.45]" style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}>
                                {theme.source === "event" ? "Goal channel" : "House channel"}
                            </span>
                        </span>
                        <span className="tabular-nums text-[12px]" style={{ fontFamily: FONT_MONO, color: subsectionScoreColor(theme.score) }}>
                            {Math.round(theme.score)}/100
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ThemeChip({ label, score }: { label: string; score: number; tone: "lift" | "press" }) {
    const accent = subsectionScoreColor(score);
    return (
        <span
            className="inline-flex min-w-0 max-w-full items-center gap-2 border px-3 py-2 text-[10px] tracking-[0.08em] uppercase sm:max-w-[220px] sm:text-[11px]"
            style={{ borderColor: accent, color: accent, fontFamily: FONT_MONO }}
        >
            <span className="truncate">{label}</span>
            <span className="tabular-nums">{Math.round(score)}</span>
        </span>
    );
}

type AnswerCardTone = "supportive" | "caution";

function toneAccent(tone: AnswerCardTone): string {
    switch (tone) {
        case "supportive": return "var(--lift-accent)";
        case "caution":    return "var(--color-spiced-life)";
    }
}

function AnswerCard({
    label,
    subhead,
    items,
    tone,
    badgeIndex,
    badgeVariant,
}: {
    label: string;
    subhead: string;
    items: string[];
    tone: AnswerCardTone;
    badgeIndex: number;
    badgeVariant: "theme-use" | "theme-avoid";
}) {
    const accent = toneAccent(tone);
    return (
        <article
            className="min-w-0 w-full text-left p-[clamp(22px,3vw,32px)] border-r border-b"
            style={{ borderColor: "var(--surface-border)" }}
        >
            <div className="mb-[18px] flex items-start gap-3">
                <GuideRowBadge label={label} index={badgeIndex} variant={badgeVariant} />
                <div className="min-w-0">
                    <span
                        className="block mb-[7px] text-[11px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: accent, fontWeight: 700 }}
                    >
                        {label}
                    </span>
                    <h3
                        className="m-0 max-w-[24ch] text-[clamp(18px,1.7vw,23px)] leading-[1.12] font-normal [text-wrap:balance]"
                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                    >
                        {subhead}
                    </h3>
                </div>
            </div>
            <ul className="m-0 p-0 list-none flex flex-col gap-[14px]">
                {items.map((item, index) => (
                    <li
                        key={`${label}-${index}`}
                        className="text-[15px] leading-[1.6] [text-wrap:pretty]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        <RichText autoEmphasis={false} allowBold={false}>{compactCardItem(item)}</RichText>
                    </li>
                ))}
            </ul>
        </article>
    );
}

function subsectionScoreColor(score: number): string {
    if (score >= 70) return "var(--lift-accent)";
    if (score >= 45) return "var(--gold)";
    return "var(--color-spiced-life)";
}

function goalCommentary(goal: GoalFit): string {
    if (goal.score >= 70) return `${goal.label} has clear support here. Let this be a primary lens for the reading.`;
    if (goal.score >= 45) return `${goal.label} works here, but it has a shape. ${goalCaution(goal.goalId)}`;
    return `${goal.label} is not the point of this place. Keep this goal light and let the stronger themes carry the experience.`;
}

function goalCaution(goalId: string): string {
    const notes: Record<string, string> = {
        identity: "It builds self-trust through grounding and private choices, not instant visibility.",
        wealth: "It can support money decisions, but not fantasy windfalls or rushed bets.",
        home: "Do not force permanence; test the neighborhood, rhythm, and body response first.",
        relocation: "Do not force permanence; test the neighborhood, rhythm, and body response first.",
        romance: "Connection is possible, but it works better when you keep it light and real.",
        love: "Connection is possible, but it works better when you keep it light and real.",
        health: "Health improves through consistency, not intensity.",
        partnerships: "Other people can mirror useful truths, but boundaries still matter.",
        career: "Career can move here, but it wants focused asks rather than broad ambition.",
        friendship: "Community opens slowly through showing up more than once.",
        community: "Community opens slowly through showing up more than once.",
        spirituality: "Reflection helps, but it needs structure so it does not become drifting.",
        growth: "Reflection helps, but it needs structure so it does not become drifting.",
        timing: "Use timing as a tuning layer, not a reason to override the place fit.",
    };
    return notes[goalId] ?? "Use a narrow intention and judge it by what actually becomes easier.";
}

function capitalizePlanet(planet: string): string {
    if (!planet) return planet;
    return planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase();
}

function lineExplanation(line: LineRow): string {
    return `${capitalizePlanet(line.planet)} is the nearest ${line.angle} line, so its themes are part of the place's first impression.`;
}

function compactLineNote(note: string, angle: string): string {
    const base = compactCardItem(note).replace(/\.$/, "");
    return `${base}. ${angleShortExplanation(angle)}`;
}

function compactCardItem(item: string): string {
    const text = item
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const firstSentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
    const capped = firstSentence || text;
    return capped.length > 180 ? `${capped.slice(0, 177).trim()}...` : capped;
}

function angleShortExplanation(angle: string): string {
    switch (angle.toUpperCase()) {
        case "MC":
            return "Public life, career, and visibility get louder.";
        case "IC":
            return "Home, rest, roots, and private life carry the signal.";
        case "ASC":
        case "AC":
            return "Identity, body, arrival, and first impressions carry the signal.";
        case "DSC":
        case "DC":
            return "Partners, clients, mirrors, and one-to-one bonds carry the signal.";
        default:
            return "This marks where the planet is easier to notice.";
    }
}

function TimingSummary({
    label,
    title,
    body,
    score,
    onClick,
}: {
    label: string;
    title: string;
    body: string;
    score: number;
    onClick?: () => void;
}) {
    const scoreColor = subsectionScoreColor(score);
    const displayTitle = compactDateRange(title);
    return (
        <article
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(event) => {
                if (!onClick) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onClick();
                }
            }}
            className="grid grid-cols-1 md:grid-cols-[minmax(220px,0.52fr)_minmax(0,1fr)] gap-[clamp(20px,4vw,56px)] border-t border-l border-r border-b p-[clamp(22px,3.5vw,34px)]"
            style={{ borderColor: "var(--surface-border)", cursor: onClick ? "pointer" : undefined }}
        >
            <div className="min-w-0">
                <div
                    className="mb-[16px] h-[3px] w-[42px]"
                    style={{ background: scoreColor }}
                />
                <span
                    className="block mb-[10px] text-[11px] tracking-[0.16em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    {label}
                </span>
                <h3
                    className="m-0 leading-[1.08] [text-wrap:balance]"
                    style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(30px,3.2vw,44px)", fontWeight: 400, color: "var(--text-primary)" }}
                >
                    {displayTitle}
                </h3>
            </div>
            <div className="min-w-0">
                <div className="mb-[12px] flex items-baseline justify-between gap-4">
                    <span
                        className="text-[11px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Timing score
                    </span>
                    <span
                        className="inline-flex items-center gap-[6px] text-[13px] tracking-[0.08em] uppercase tabular-nums"
                        style={{ fontFamily: FONT_MONO, color: scoreColor }}
                    >
                        <BrandSparkle size={9} />
                        {Math.round(score)}/100
                        <BrandSparkle size={11} />
                    </span>
                </div>
                <p
                    className="m-0 max-w-[72ch] text-[15px] leading-[1.65] [text-wrap:pretty]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    {body}
                </p>
            </div>
        </article>
    );
}

function compactDateRange(title: string): string {
    const clean = title.replace(/\s+/g, " ").trim();
    const match = clean.match(/^([A-Z][a-z]{2,8})\s+(\d{1,2})\s*[–-]\s*\1\s+(\d{1,2}),\s*(\d{4})$/);
    if (match) return `${match[1]} ${match[2]}-${match[3]}, ${match[4]}`;
    return clean.replace(/\s+[–-]\s+/g, "-");
}
