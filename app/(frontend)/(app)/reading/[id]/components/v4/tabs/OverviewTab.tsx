"use client";

import { Button } from "@/app/components/ui/button";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    copiedTab: V4VM["tabs"]["copy"][keyof V4VM["tabs"]["copy"]] | undefined;
    selectTab: (id: string, scrollToPanels?: boolean) => void;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";
const FONT_DISPLAY_ALT_1 = "var(--font-display-alt-1, serif)";

const VERDICT_COLORS: Record<string, string> = {
    tough: "var(--color-spiced-life)",
    mixed: "var(--gold)",
    solid: "var(--sage)",
    peak: "var(--sage)",
};

export default function OverviewTab({ vm, copiedTab, selectTab }: Props) {
    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
    const leanInto = vm.tabs.overview?.leanInto ?? [];
    const watchOut = vm.tabs.overview?.watchOut ?? [];
    const verdictColor = VERDICT_COLORS[vm.hero.verdict.band] ?? "var(--text-secondary)";

    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                {/* Hero summary — verdict pill + h1 answer + why + score bar + CTA */}
                <section className="max-w-[680px] mx-auto text-center mb-[clamp(42px,6vw,72px)]">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-[6px] rounded-full border text-[10px] tracking-[0.2em] uppercase"
                        style={{
                            color: verdictColor,
                            borderColor: verdictColor,
                            background: `color-mix(in oklab, ${verdictColor} 6%, transparent)`,
                            fontFamily: FONT_MONO,
                        }}
                    >
                        <span className="font-medium">{vm.hero.verdict.label}</span>
                        <span className="opacity-50">·</span>
                        <span style={{ color: "var(--text-secondary)" }}>{vm.location.city}</span>
                    </div>

                    <h1
                        className="font-normal leading-[1.02] tracking-[-0.025em] mt-6 mb-7 [text-wrap:balance]"
                        style={{
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(44px, 7vw, 88px)",
                            color: "var(--text-primary)",
                        }}
                    >
                        {vm.travelType === "relocation"
                            ? <>Moving to <span style={{ color: "var(--color-spiced-life)" }}>{vm.location.city}</span>{vm.travelDateISO ? <> on <span style={{ color: "var(--color-spiced-life)" }}>{vm.hero.bestWindow?.dates ?? "—"}</span></> : null}.</>
                            : <>Your dates: <span style={{ color: "var(--color-spiced-life)" }}>{vm.hero.bestWindow?.dates ?? "—"}</span>.</>
                        }
                    </h1>

                    <p
                        className="text-[18px] leading-[1.6] font-light max-w-[520px] mx-auto mb-10 [text-wrap:pretty]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        {vm.hero.explainer}
                    </p>

                    <div className="max-w-[min(560px,100%)] mx-auto">
                        <div
                            className="h-[10px] rounded-full overflow-hidden mb-[10px]"
                            style={{ background: "var(--surface-border)" }}
                        >
                            <div
                                className="h-full rounded-full transition-[width] duration-[1s] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                                style={{
                                    width: `${vm.hero.bestWindow?.score ?? 0}%`,
                                    background: "var(--color-spiced-life)",
                                }}
                            />
                        </div>
                        <div
                            className="flex justify-between text-[11px] tracking-[0.12em] uppercase"
                            style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                        >
                            <span>{vm.travelType === "relocation" ? "Place baseline score" : "Selected window score"}</span>
                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{vm.hero.bestWindow?.score ?? 0}/100</span>
                        </div>
                        {vm.hero.baselineContext && (
                            <div
                                className="mt-[10px] text-[13px] leading-[1.5] font-light text-center max-w-[360px] mx-auto"
                                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                            >
                                {vm.travelType === "trip" ? `Place baseline: ${vm.hero.baselineScore}/100 · ` : ""}
                                {vm.hero.baselineContext}
                            </div>
                        )}
                    </div>

                    {(vm.hero.betterAlternate || vm.hero.maximizeAdvice) && (
                        <div className="mt-6 flex flex-col items-center gap-2 max-w-[min(520px,100%)] mx-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="w-full h-auto min-h-10 whitespace-normal py-3 px-[18px] rounded-full font-normal"
                                style={{
                                    fontFamily: FONT_BODY,
                                    borderColor: "var(--surface-border)",
                                    color: "var(--text-primary)",
                                    background: "color-mix(in oklab, var(--text-primary) 4%, transparent)",
                                }}
                                onClick={() => selectTab("timing", true)}
                            >
                                {vm.hero.betterAlternate
                                    ? `Try ${vm.hero.betterAlternate.dates} — alternate window score ${vm.hero.betterAlternate.score}/100 (+${vm.hero.betterAlternate.delta})`
                                    : vm.hero.maximizeAdvice}
                            </Button>
                            {vm.hero.betterAlternate && (
                                <p
                                    className="m-0 text-[10px] tracking-[0.08em] uppercase"
                                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                >
                                    Opens the Timing tab with windows and the month chart.
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {copiedTab?.lead && (
                    <section className="m-0 mb-[34px] p-0 bg-transparent">
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

                <div className="v4-step-num">Overview</div>
                <h2 className="v4-h2">{selectedGoal ? `${vm.location.city} for ${selectedGoal.label}.` : `What ${vm.location.city} supports.`}</h2>

                {/* Wider intro callout — addresses "text isn't using the full space" feedback */}
                <p
                    className="relative mb-[clamp(42px,5vw,64px)] p-[clamp(20px,3vw,30px)] border-l-4 leading-[1.65]"
                    style={{
                        fontFamily: FONT_BODY,
                        fontSize: "clamp(17px, 1.45vw, 20px)",
                        color: "var(--text-primary)",
                        borderColor: "var(--color-y2k-blue)",
                        background: "color-mix(in oklab, var(--color-y2k-blue) 7%, transparent)",
                        maxWidth: "none",
                    }}
                >
                    {vm.tabs.overview?.scoreExplanation || vm.hero.explainer}
                </p>

                {/* Score + theme cards grid */}
                <div className="grid gap-[clamp(20px,2.6vw,34px)] mb-[clamp(28px,4vw,48px)] grid-cols-1 lg:grid-cols-[minmax(360px,0.92fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto]">
                    {/* Big score card */}
                    <article
                        className="relative overflow-hidden border p-[clamp(24px,3vw,34px)] flex flex-col justify-between min-h-[420px] lg:row-span-2"
                        style={{
                            borderColor: "var(--surface-border)",
                            borderRadius: "var(--shape-asymmetric-md, 12px)",
                            background: "linear-gradient(145deg, color-mix(in oklab, var(--color-spiced-life) 14%, transparent), transparent 42%), var(--bg)",
                        }}
                    >
                        {/* Decorative ring */}
                        <div
                            className="pointer-events-none absolute"
                            style={{
                                right: "clamp(18px, 4vw, 48px)",
                                bottom: "clamp(18px, 4vw, 42px)",
                                width: "clamp(120px, 17vw, 220px)",
                                aspectRatio: "1",
                                border: "1px solid color-mix(in oklab, var(--color-spiced-life) 42%, transparent)",
                                borderRadius: "50%",
                                opacity: 0.42,
                            }}
                        />
                        <div className="relative z-[1]">
                            <div
                                className="leading-[0.9]"
                                style={{
                                    fontFamily: FONT_PRIMARY,
                                    fontSize: "clamp(76px, 9vw, 124px)",
                                    color: "var(--color-spiced-life)",
                                }}
                            >
                                {vm.hero.baselineScore || vm.hero.bestWindow?.score}
                                <span
                                    className="text-[15px]"
                                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                >
                                    /100
                                </span>
                            </div>
                            <div
                                className="text-[11px] tracking-[0.14em] uppercase mt-[14px]"
                                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                            >
                                Place baseline score
                            </div>
                        </div>
                        {selectedGoal && (
                            <div
                                className="relative z-[1] mt-auto pt-[clamp(22px,3vw,34px)] border-t text-[15px] leading-[1.6]"
                                style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
                            >
                                <strong
                                    className="inline-block mb-2 text-[12px] tracking-[0.1em] uppercase"
                                    style={{ color: "var(--text-primary)", fontFamily: FONT_MONO }}
                                >
                                    {selectedGoal.score}/100 for {selectedGoal.label}
                                </strong>
                                <p className="m-0">{vm.tabs.overview?.goalExplanation || selectedGoal.outcome}</p>
                            </div>
                        )}
                    </article>

                    {/* Strongest themes */}
                    <ThemeListCard
                        title="Strongest Themes"
                        themes={vm.scoreNarrative.strongestThemes}
                        accent="var(--color-y2k-blue)"
                    />

                    {/* Less emphasized */}
                    <ThemeListCard
                        title="Less Emphasized"
                        themes={vm.scoreNarrative.lessEmphasized}
                        accent="var(--gold)"
                        muted
                    />
                </div>

                {/* Lean Into / Watch Out — bold full-color blocks (matches reference image) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(20px,2.6vw,34px)] mb-[clamp(44px,5vw,68px)]">
                    <SupportBlock
                        index="01"
                        title="Lean Into"
                        items={leanInto.slice(0, 4)}
                        variant="y2k-blue"
                    />
                    <SupportBlock
                        index="02"
                        title="Watch Out For"
                        items={watchOut.slice(0, 4)}
                        variant="spiced"
                    />
                </div>

                {/* Travel windows summary */}
                <div
                    className="mt-[clamp(42px,5vw,72px)] p-[clamp(22px,3vw,32px)] border"
                    style={{
                        borderColor: "var(--surface-border)",
                        borderRadius: "var(--shape-asymmetric-md, 12px)",
                        background: "color-mix(in oklab, var(--text-primary) 3%, transparent)",
                    }}
                >
                    <h3
                        className="text-[18px] tracking-[-0.005em] m-0 mb-[14px]"
                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                    >
                        Travel Windows
                    </h3>
                    <ul
                        className="list-none m-0 p-0 border-t"
                        style={{ borderColor: "var(--surface-border)" }}
                    >
                        {vm.travelWindows.slice(0, 3).map((w, i) => {
                            const isPrimary = i === 0;
                            return (
                                <li
                                    key={`${w.dates}-${i}`}
                                    className="grid gap-[18px] py-4 border-b grid-cols-[8px_1fr] sm:grid-cols-[8px_minmax(150px,0.34fr)_1fr]"
                                    style={{ borderColor: "var(--surface-border)" }}
                                >
                                    <span
                                        className="w-[7px] h-[7px] rounded-full mt-[0.45em]"
                                        style={{
                                            background: isPrimary ? "var(--color-spiced-life)" : "var(--text-tertiary)",
                                        }}
                                    />
                                    <span
                                        className="text-[11px] tracking-[0.08em] uppercase"
                                        style={{ fontFamily: FONT_MONO, color: "var(--text-primary)" }}
                                    >
                                        {w.dates}
                                    </span>
                                    <span
                                        className="text-[14px] leading-[1.55] col-span-2 sm:col-span-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {w.flavorTitle} · {w.note}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );

    function ThemeListCard({
        title,
        themes,
        accent,
        muted,
    }: {
        title: string;
        themes: V4VM["scoreNarrative"]["strongestThemes"];
        accent: string;
        muted?: boolean;
    }) {
        return (
            <article
                className="relative overflow-hidden border p-[clamp(24px,3vw,34px)]"
                style={{
                    borderColor: muted
                        ? "var(--surface-border)"
                        : `color-mix(in oklab, ${accent} 28%, var(--surface-border))`,
                    borderRadius: "var(--shape-asymmetric-md, 12px)",
                    background: muted
                        ? "color-mix(in oklab, var(--text-primary) 3%, var(--bg))"
                        : `color-mix(in oklab, ${accent} 5%, var(--bg))`,
                }}
            >
                <div className="absolute inset-x-0 top-0 h-[5px]" style={{ background: accent }} />
                <h3
                    className="text-[11px] tracking-[0.14em] uppercase m-0 mb-[14px]"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    {title}
                </h3>
                {themes.map((theme) => (
                    <div
                        key={theme.id}
                        className="flex justify-between gap-4 py-[14px] border-b last:border-b-0 text-[15px] leading-[1.4]"
                        style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
                    >
                        <span>{theme.label}</span>
                        <strong
                            className="text-[13px] tabular-nums"
                            style={{ color: "var(--text-primary)", fontFamily: FONT_MONO }}
                        >
                            {theme.score}
                        </strong>
                    </div>
                ))}
            </article>
        );
    }
}

function SupportBlock({
    index,
    title,
    items,
    variant,
}: {
    index: string;
    title: string;
    items: string[];
    variant: "y2k-blue" | "spiced";
}) {
    const bg = variant === "y2k-blue" ? "var(--color-y2k-blue)" : "var(--color-spiced-life)";
    return (
        <AstronatCard
            variant="charcoal"
            shape="asymmetric-md"
            className="relative overflow-hidden p-[clamp(28px,3.5vw,44px)] border-0"
            style={{ background: bg, color: "white" }}
        >
            <div
                className="leading-none mb-[clamp(28px,4vw,44px)] flex items-baseline gap-3"
                style={{
                    fontFamily: FONT_PRIMARY,
                    fontSize: "clamp(56px, 8vw, 96px)",
                    color: "rgba(255,255,255,0.45)",
                }}
            >
                <span>{index}</span>
                <span className="text-[clamp(28px,3vw,40px)] opacity-60">—</span>
            </div>
            <h3
                className="leading-[1.05] m-0 mb-5 text-white [text-wrap:balance]"
                style={{
                    fontFamily: FONT_DISPLAY_ALT_1,
                    fontSize: "clamp(28px, 3.5vw, 44px)",
                    fontWeight: 400,
                }}
            >
                {title.toLowerCase()}
            </h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
                {items.map((item, i) => (
                    <li
                        key={i}
                        className="text-[15px] leading-[1.5] text-white/90 [text-wrap:pretty] pl-5 relative"
                        style={{ fontFamily: FONT_BODY }}
                    >
                        <span
                            className="absolute left-0 top-[0.55em] w-[7px] h-[7px] rounded-full bg-white/70"
                        />
                        {item}
                    </li>
                ))}
            </ul>
        </AstronatCard>
    );
}
