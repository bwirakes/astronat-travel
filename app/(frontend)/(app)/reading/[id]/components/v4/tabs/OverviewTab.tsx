"use client";

import { AstronatCard } from "@/app/components/ui/astronat-card";
import SignIcon from "@/app/components/SignIcon";
import TabSection from "./TabSection";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    copiedTab: V4VM["tabs"]["copy"][keyof V4VM["tabs"]["copy"]] | undefined;
    selectTab?: (id: string, scrollToPanels?: boolean) => void;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";
const FONT_DISPLAY_ALT_1 = "var(--font-display-alt-1, serif)";

export default function OverviewTab({ vm, copiedTab }: Props) {
    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
    const leanInto = vm.tabs.overview?.leanInto ?? [];
    const watchOut = vm.tabs.overview?.watchOut ?? [];
    const ledeText = vm.tabs.overview?.scoreExplanation || vm.hero.explainer || "";
    const sunSign =
        vm.chart.natal.find((cp) => cp.p?.toLowerCase() === "sun")?.sign
        ?? vm.chart.natal.find((cp) => cp.p?.toLowerCase() === "moon")?.sign
        ?? vm.chart.natal[0]?.sign;
    const watermarkSign = sunSign
        ? sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase()
        : null;

    return (
        <TabSection
            kicker="Overview"
            title={copiedTab?.lead || "Your reading"}
            intro={copiedTab?.plainEnglishSummary}
        >
            <div className="w-full max-w-none">
                <div className="relative mb-[clamp(28px,3vw,40px)] isolate flex items-start gap-[clamp(14px,2vw,28px)]">
                    {watermarkSign && (
                        <div
                            aria-hidden
                            className="pointer-events-none absolute right-[2%] top-1/2 -translate-y-1/2 -z-10 hidden md:block"
                            style={{ opacity: 0.05, color: "var(--text-primary)" }}
                        >
                            <SignIcon sign={watermarkSign} size={260} />
                        </div>
                    )}
                    <span
                        aria-hidden
                        className="shrink-0 leading-[0.85] select-none"
                        style={{
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(72px, 8vw, 112px)",
                            color: "var(--color-y2k-blue)",
                            marginTop: "-0.06em",
                        }}
                    >
                        {ledeText.charAt(0)}
                    </span>
                    <p
                        className="m-0 max-w-[60ch] [text-wrap:pretty]"
                        style={{
                            fontFamily: FONT_BODY,
                            fontSize: "clamp(17px, 1.4vw, 19px)",
                            lineHeight: 1.7,
                            color: "var(--text-secondary)",
                            fontWeight: 400,
                        }}
                    >
                        {ledeText.slice(1)}
                    </p>
                </div>

                {selectedGoal && (
                    <p
                        className="mb-[clamp(28px,3vw,40px)] max-w-[68ch] text-[16px] leading-[1.65]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                    >
                        <span
                            className="mr-2 text-[11px] tracking-[0.14em] uppercase"
                            style={{ color: "var(--text-tertiary)", fontFamily: FONT_MONO }}
                        >
                            {selectedGoal.label} · {selectedGoal.score}/100
                        </span>
                        {vm.tabs.overview?.goalExplanation || selectedGoal.outcome}
                    </p>
                )}

                {/* Theme cards — side by side */}
                <div className="grid gap-[clamp(20px,2.6vw,34px)] mb-[clamp(28px,4vw,48px)] grid-cols-1 md:grid-cols-2">
                    <ThemeListCard
                        title="Strongest Themes"
                        themes={vm.scoreNarrative.strongestThemes}
                        accent="var(--color-y2k-blue)"
                    />
                    <ThemeListCard
                        title="Less Emphasized"
                        themes={vm.scoreNarrative.lessEmphasized}
                        accent="var(--gold)"
                        muted
                    />
                </div>

                {/* Lean Into / Watch Out — bold full-color blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(20px,2.6vw,34px)] mb-[clamp(44px,5vw,68px)]">
                    <SupportBlock
                        title="Lean Into"
                        items={leanInto.slice(0, 4)}
                        variant="y2k-blue"
                    />
                    <SupportBlock
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
        </TabSection>
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
    title,
    items,
    variant,
}: {
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
