"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import HouseMatrixCard from "@/app/components/HouseMatrixCard";
import type { HouseMatrixResult } from "@/app/lib/house-matrix";
import SectionHead from "./SectionHead";
import TabSection from "./TabSection";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    reading: any;
}

export default function LifeThemesTab({ vm, reading }: Props) {
    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
    const rawBars = vm.scoreNarrative.themes.length
        ? vm.scoreNarrative.themes
        : [...vm.scoreNarrative.strongestThemes, ...vm.scoreNarrative.lessEmphasized];
    const themeBars = [...rawBars].sort((a, b) => b.score - a.score);

    const intro = selectedGoal
        ? `${selectedGoal.label} is the lens here. The chart ranks each life area by how useful this place is for that outcome.`
        : "The chart ranks where life gets louder, from strongest support to quieter background themes.";

    const lifts = themeBars.slice(0, 3);
    const presses = themeBars.length >= 4
        ? themeBars.slice(-3).reverse()
        : [];

    const matrix: HouseMatrixResult | null =
        reading?.houses && Array.isArray(reading.houses) && reading.houses.length > 0
            ? {
                houses: reading.houses,
                macroScore: reading.macroScore ?? 0,
                macroVerdict: reading.macroVerdict ?? "Neutral",
                houseSystem: reading.houseSystem ?? "placidus",
                ...(reading.lotOfFortune ? { lotOfFortune: reading.lotOfFortune } : {}),
                ...(reading.lotOfSpirit ? { lotOfSpirit: reading.lotOfSpirit } : {}),
            }
            : null;

    return (
        <TabSection kicker="Life Themes" title="Where life gets louder." intro={intro}>
            {/* Tier 1: top 3 lifts / top 3 presses */}
            {(lifts.length > 0 || presses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {lifts.length > 0 && (
                        <div>
                            <div
                                className="text-[0.55rem] tracking-[0.2em] uppercase font-semibold mb-3"
                                style={{ color: "var(--sage, #4a8a6a)", fontFamily: "var(--font-mono)" }}
                            >
                                What lifts here
                            </div>
                            <ul className="list-none p-0 m-0">
                                {lifts.map((t) => (
                                    <SummaryRow key={`lift-${t.id}`} label={t.label} score={t.score} tone="lift" />
                                ))}
                            </ul>
                        </div>
                    )}
                    {presses.length > 0 && (
                        <div>
                            <div
                                className="text-[0.55rem] tracking-[0.2em] uppercase font-semibold mb-3"
                                style={{ color: "var(--color-spiced-life)", fontFamily: "var(--font-mono)" }}
                            >
                                What presses here
                            </div>
                            <ul className="list-none p-0 m-0">
                                {presses.map((t) => (
                                    <SummaryRow key={`press-${t.id}`} label={t.label} score={t.score} tone="press" />
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Full theme bars */}
            <SectionHead title="All themes, ranked" />
            <div className="flex flex-col gap-4 mb-8">
                {themeBars.map((theme) => {
                    const isGoal = !!(theme.goalId && vm.goalIds.includes(theme.goalId));
                    return (
                        <div
                            key={theme.id}
                            className="rounded-[10px] p-4 border"
                            style={{
                                borderColor: "var(--surface-border)",
                                background: isGoal
                                    ? "color-mix(in oklab, var(--text-primary) 4%, transparent)"
                                    : "var(--bg)",
                            }}
                        >
                            <div
                                className="flex justify-between gap-4 mb-[10px] text-sm"
                                style={{ color: "var(--text-primary)" }}
                            >
                                <span>{theme.label}</span>
                                <strong className="font-medium">{theme.score}/100</strong>
                            </div>
                            <div
                                className="h-2 overflow-hidden rounded-full"
                                style={{ background: "var(--surface-border)" }}
                            >
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${theme.score}%`,
                                        background: "var(--color-y2k-blue)",
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Receipts: full 12-house matrix */}
            {matrix && (
                <details
                    className="rounded-[10px] border"
                    style={{
                        borderColor: "var(--surface-border)",
                        background: "var(--surface)",
                    }}
                >
                    <summary
                        className="px-5 py-4 cursor-pointer flex items-center gap-3 text-[0.65rem] tracking-[0.12em] uppercase"
                        style={{
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-mono)",
                            listStyle: "none",
                        }}
                    >
                        <span style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>+</span>
                        See all 12 houses, ranked
                    </summary>
                    <div className="px-5 pb-5">
                        <HouseMatrixCard matrix={matrix} />
                    </div>
                </details>
            )}
        </TabSection>
    );
}

function SummaryRow({ label, score, tone }: { label: string; score: number; tone: "lift" | "press" }) {
    const accent = tone === "lift" ? "var(--sage, #4a8a6a)" : "var(--color-spiced-life)";
    return (
        <li
            className="grid items-baseline gap-3 py-2.5"
            style={{
                gridTemplateColumns: "minmax(140px, 1fr) auto",
                borderBottom: "1px solid var(--surface-border)",
            }}
        >
            <span
                style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "1rem",
                    color: "var(--text-primary)",
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: accent,
                    fontVariantNumeric: "tabular-nums",
                    minWidth: "3rem",
                    textAlign: "right",
                }}
            >
                {Math.round(score)}
            </span>
        </li>
    );
}
