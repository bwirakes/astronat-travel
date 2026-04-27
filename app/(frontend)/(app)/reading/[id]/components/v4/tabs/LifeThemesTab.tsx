"use client";

import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
}

export default function LifeThemesTab({ vm }: Props) {
    const selectedGoal = vm.scoreNarrative.selectedGoals[0];
    const themeBars = vm.scoreNarrative.themes.length
        ? vm.scoreNarrative.themes
        : [...vm.scoreNarrative.strongestThemes, ...vm.scoreNarrative.lessEmphasized];

    return (
        <section className="v4-step v4-step-tint v4-tab-panel-section">
            <div className="v4-reading-panel-body">
                <div className="v4-step-num">Life Themes</div>
                <h2 className="v4-h2">Where life gets louder.</h2>
                <p className="v4-step-intro">
                    {selectedGoal
                        ? `${selectedGoal.label} is the lens here. The chart ranks each life area by how useful this place is for that outcome.`
                        : "This chart ranks where the place adds the most emphasis, from strongest support to quieter background themes."}
                </p>

                <div className="flex flex-col gap-4">
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
            </div>
        </section>
    );
}
