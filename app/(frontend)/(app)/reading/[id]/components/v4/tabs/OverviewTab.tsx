"use client";

import SignIcon from "@/app/components/SignIcon";
import PlanetIcon from "@/app/components/PlanetIcon";
import TabSection from "../../shared/TabSection";
import { WindowsList } from "../parts/WindowsList";
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

export default function OverviewTab({ vm, copiedTab }: Props) {
    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
    const leanInto = vm.tabs.overview?.leanInto ?? [];
    const watchOut = vm.tabs.overview?.watchOut ?? [];
    const scoreExplanation = vm.tabs.overview?.scoreExplanation || "";
    const aiLead = copiedTab?.lead?.trim() || "";
    const fallbackLede = aiLead || scoreExplanation || vm.hero.explainer || "";
    // Prefer the AI lead in the dek slot; surface scoreExplanation as the
    // body paragraph below it. If the two are identical (rare, but happens
    // when the model uses scoreExplanation for both) collapse to one.
    const summary =
        scoreExplanation && scoreExplanation !== aiLead
            ? scoreExplanation
            : !aiLead
                ? vm.hero.explainer || undefined
                : undefined;
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
            title="Your reading"
            lead={fallbackLede}
            intro={summary}
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
                        className="mb-[clamp(40px,5vw,64px)] pl-[clamp(16px,2vw,24px)] border-l-[3px]" 
                        style={{ borderColor: "var(--color-y2k-blue)" }}
                    >
                        <h4
                            className="m-0 mb-[12px] text-[11px] tracking-[0.15em] uppercase"
                            style={{ color: "var(--color-y2k-blue)", fontFamily: FONT_MONO }}
                        >
                            Primary Focus: {selectedGoal.label}
                        </h4>
                        <p
                            className="m-0 max-w-[60ch] text-[clamp(20px,2vw,24px)] leading-[1.4] [text-wrap:balance]"
                            style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                        >
                            {vm.tabs.overview?.goalExplanation || selectedGoal.outcome}
                        </p>
                    </div>
                )}

                {/* Lean Into / Watch Out — bold full-color blocks */}
                <div className="mt-[clamp(40px,6vw,80px)] border-t pt-[clamp(32px,5vw,48px)]" style={{ borderColor: "var(--surface-border)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(32px,5vw,64px)]">
                        <SupportBlock
                            title="Lean Into"
                            items={leanInto.slice(0, 4)}
                            variant="acqua"
                        />
                        <SupportBlock
                            title="Watch Out For"
                            items={watchOut.slice(0, 4)}
                            variant="spiced"
                        />
                    </div>
                </div>

                {/* Theme cards — side by side */}
                <div className="mt-[clamp(44px,5vw,68px)] border-t pt-[clamp(32px,5vw,48px)] mb-[clamp(44px,5vw,68px)]" style={{ borderColor: "var(--surface-border)" }}>
                    <div className="grid gap-[clamp(24px,4vw,48px)] grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
                        <ThemeListCard
                            title="Strongest Themes"
                            themes={vm.scoreNarrative.strongestThemes}
                            scoreColor="var(--sage)"
                        />
                        <div className="hidden md:block bg-[var(--surface-border)] w-full h-full" />
                        <ThemeListCard
                            title="Less Emphasized"
                            themes={vm.scoreNarrative.lessEmphasized}
                            scoreColor="var(--color-spiced-life)"
                        />
                    </div>
                </div>

                {/* Travel windows summary */}
                <div className="border-t pt-[clamp(32px,5vw,48px)] pb-[clamp(24px,3vw,32px)]" style={{ borderColor: "var(--surface-border)" }}>
                    <h3
                        className="tracking-[-0.01em] m-0 mb-[24px]"
                        style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(26px, 3.5vw, 32px)", color: "var(--text-primary)" }}
                    >
                        Travel Windows
                    </h3>
                    <WindowsList vm={vm} limit={3} />
                </div>
            </div>
        </TabSection>
    );

    function ThemeListCard({
        title,
        themes,
        scoreColor = "var(--text-primary)",
    }: {
        title: string;
        themes: V4VM["scoreNarrative"]["strongestThemes"];
        scoreColor?: string;
    }) {
        return (
            <article className="flex flex-col">
                <h3
                    className="m-0 mb-[16px] leading-[1.05]"
                    style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 400, color: "var(--text-primary)" }}
                >
                    {title}
                </h3>
                <div className="flex flex-col border-t" style={{ borderColor: "var(--text-primary)" }}>
                    {themes.map((theme) => (
                        <div
                            key={theme.id}
                            className="flex justify-between items-center py-[12px] border-b"
                            style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)", fontFamily: FONT_BODY }}
                        >
                            <span className="text-[15px] leading-[1.4]">{theme.label}</span>
                            <strong
                                className="text-[12px] tracking-[0.05em] tabular-nums"
                                style={{ color: scoreColor, fontFamily: FONT_MONO, fontWeight: 400 }}
                            >
                                {theme.score}
                            </strong>
                        </div>
                    ))}
                </div>
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
    variant: "acqua" | "spiced";
}) {
    const isAcqua = variant === "acqua";
    const bg = isAcqua ? "#CAF1F0" : "#E67A7A"; // Hardcoded to retain vibrant colors in all modes
    const textColor = "#1B1B1B"; // High contrast for solid bright blocks
    const planet = isAcqua ? "Jupiter" : "Saturn"; // Benefic for Lean Into, Malefic for Watch Out

    return (
        <div 
            className="relative flex flex-col p-[clamp(28px,4vw,42px)] overflow-hidden" 
            style={{ background: bg, color: textColor }}
        >
            {/* Micro-Texture: Floating Planet Icon */}
            <div 
                className="absolute -top-[15px] -right-[15px] opacity-[0.08] pointer-events-none mix-blend-overlay"
                style={{ color: textColor }}
            >
                <PlanetIcon planet={planet} size={180} />
            </div>

            <h3
                className="leading-[1.05] m-0 mt-[8px] mb-6 [text-wrap:balance] relative z-10"
                style={{
                    fontFamily: FONT_PRIMARY,
                    fontSize: "clamp(28px, 3.5vw, 36px)",
                    fontWeight: 400,
                    color: textColor
                }}
            >
                {title}
            </h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-4 relative z-10">
                {items.map((item, i) => (
                    <li
                        key={i}
                        className="text-[16px] leading-[1.5] [text-wrap:pretty] pl-6 relative font-medium"
                        style={{ fontFamily: FONT_BODY, color: textColor }}
                    >
                        <span
                            className="absolute left-0 top-0 text-[18px]"
                            style={{ color: textColor, fontFamily: FONT_PRIMARY, marginTop: "0.1em" }}
                        >
                            *
                        </span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
