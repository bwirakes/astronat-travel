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
                <div className="v4-theme-bars">
                    {themeBars.map((theme) => (
                        <div key={theme.id} className={`v4-theme-bar${theme.goalId && vm.goalIds.includes(theme.goalId) ? " is-goal" : ""}`}>
                            <div className="v4-theme-bar-head">
                                <span>{theme.label}</span>
                                <strong>{theme.score}/100</strong>
                            </div>
                            <div className="v4-theme-track"><div style={{ width: `${theme.score}%` }} /></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
