"use client";

import SignIcon from "@/app/components/SignIcon";
import SectionHead from "../../shared/SectionHead";
import TabSection from "../../shared/TabSection";
import { appendChartRulerDignityNote, mergeGuideRows, RichText } from "../../shared/ReadingCopy";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    copiedTab: V4VM["tabs"]["copy"][keyof V4VM["tabs"]["copy"]] | undefined;
    selectTab?: (id: string, scrollToPanels?: boolean) => void;
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

export default function OverviewTab({ vm, copiedTab, selectTab }: Props) {
    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
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
    ]);

    return (
        <TabSection
            kicker="Overview"
            title="At a Glance"
            lead={fallbackLede}
            intro={summary}
            guideRows={overviewGuideRows}
            maxSentences={5}
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

                {selectedGoal && (
                    <div
                        className="mb-[clamp(24px,3vw,34px)] border-l-[3px] pl-[clamp(14px,1.8vw,20px)]"
                        style={{ borderColor: "var(--color-y2k-blue)" }}
                    >
                        <span
                            className="block mb-[7px] text-[10px] tracking-[0.16em] uppercase"
                            style={{ color: "var(--color-y2k-blue)", fontFamily: FONT_MONO }}
                        >
                            You asked about {selectedGoal.label}
                        </span>
                        <p
                            className="m-0 max-w-[72ch] text-[clamp(17px,1.6vw,21px)] leading-[1.5] [text-wrap:pretty]"
                            style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                        >
                            {vm.tabs.overview?.goalExplanation || selectedGoal.outcome}
                        </p>
                    </div>
                )}

                <SectionHead
                    index="00"
                    title="How to use this place"
                    flush
                />
                <section
                    className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l"
                    style={{ borderColor: "var(--surface-border)" }}
                >
                        <AnswerCard
                            label="Use this for"
                            items={leanInto.length ? leanInto.slice(0, 2) : [topTheme?.label || "This is the clearest thing to build the reading around."]}
                            accent="var(--sage)"
                        />
                        <AnswerCard
                            label="Don't use this for"
                            items={watchOut.length ? watchOut.slice(0, 2) : ["Do not make this place carry every goal at once."]}
                            accent="var(--color-spiced-life)"
                        />
                </section>

                {timing && (
                    <>
                        <SectionHead
                            index="01"
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
            </div>
        </TabSection>
    );
}

function AnswerCard({
    label,
    items,
    accent,
}: {
    label: string;
    items: string[];
    accent: string;
}) {
    return (
        <article
            className="min-w-0 w-full text-left p-[clamp(22px,3vw,32px)] border-r border-b"
            style={{ borderColor: "var(--surface-border)" }}
        >
            <div
                className="mb-[16px] h-[3px] w-[42px]"
                style={{ background: accent }}
            />
            <span
                className="block mb-[10px] text-[11px] tracking-[0.16em] uppercase"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
            >
                {label}
            </span>
            <ul className="m-0 p-0 list-none flex flex-col gap-[14px]">
                {items.map((item, index) => (
                    <li
                        key={`${label}-${index}`}
                        className="relative pl-[18px] text-[15px] leading-[1.6] [text-wrap:pretty]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        <span
                            aria-hidden
                            className="absolute left-0 top-[0.72em] h-[4px] w-[4px] rounded-full"
                            style={{ background: accent }}
                        />
                        <RichText>{item}</RichText>
                    </li>
                ))}
            </ul>
        </article>
    );
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
                    style={{ background: "var(--color-y2k-blue)" }}
                />
                <span
                    className="block mb-[10px] text-[11px] tracking-[0.16em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    {label}
                </span>
                <h3
                    className="m-0 leading-[1.08] [text-wrap:balance]"
                    style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(28px,3.6vw,40px)", fontWeight: 400, color: "var(--text-primary)" }}
                >
                    {title}
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
                        className="text-[13px] tracking-[0.08em] uppercase tabular-nums"
                        style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                    >
                        {Math.round(score)}/100
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
