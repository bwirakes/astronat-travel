"use client";

import type { ReactNode } from "react";
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
import TabSection from "../../shared/TabSection";
import { mergeGuideRows } from "../../shared/ReadingCopy";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    reading?: unknown;
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

export default function LifeThemesTab({ vm, copiedTab }: Props) {
    const selectedGoals = vm.scoreNarrative.selectedGoals;
    const selectedGoal = selectedGoals[0];
    const rawBars = vm.scoreNarrative.themes.length
        ? vm.scoreNarrative.themes
        : [...vm.scoreNarrative.strongestThemes, ...vm.scoreNarrative.lessEmphasized];
    const themeBars = [...rawBars].sort((a, b) => b.score - a.score);

    const fallbackIntro = selectedGoal
        ? `${selectedGoal.label} is the lens here. The chart ranks each life area by how useful this place is for that outcome.`
        : "The chart ranks where life gets louder, from strongest support to quieter background themes.";

    const tabLead = copiedTab?.lead?.trim() || "";
    const tabIntro = copiedTab?.plainEnglishSummary || fallbackIntro;

    const goalThemeIds = new Set(
        selectedGoals
            .map((goal) => themeBars.find((theme) => theme.goalId === goal.goalId || theme.label === goal.eventName)?.id)
            .filter(Boolean) as string[],
    );
    const lifts = prioritizeGoalThemes(themeBars.slice(0, 4), goalThemeIds).slice(0, 3);
    const presses = themeBars.length >= 4
        ? prioritizeGoalThemes(themeBars.slice(-4).reverse(), goalThemeIds).slice(0, 3)
        : [];
    const lifeThemeGuideRows = mergeGuideRows(copiedTab?.guideRows, [
        {
            label: "Best Used For",
            body: lifts[0]
                ? `${lifts[0].label} has the cleanest support here at ${Math.round(lifts[0].score)}/100; use it as the practical doorway into ${selectedGoal?.label.toLowerCase() || "your goal"}.`
                : "Use the strongest life area first, then let the weaker areas stay quieter.",
        },
        {
            label: "Move Carefully With",
            body: presses[0]
                ? `${presses[0].label} is softer here at ${Math.round(presses[0].score)}/100, so do not make it prove whether the place works.`
                : "Do not force every life area to move at the same time.",
        },
        {
            label: "Your Next Move",
            body: selectedGoal
                ? `Pick one small ${selectedGoal.label.toLowerCase()} experiment, then watch whether the stronger themes make it easier or harder.`
                : "Pick one small experiment and judge the place by how your real life responds.",
        },
    ]);

    return (
        <TabSection
            kicker="Life Themes"
            title="How this place fits your goals."
            lead={tabLead}
            intro={tabIntro}
            guideRows={lifeThemeGuideRows}
        >
            {selectedGoals.length > 0 && (
                <div className="mb-[clamp(40px,5vw,68px)]">
                    <div className="flex flex-col border-t" style={{ borderColor: "var(--text-primary)" }}>
                        {selectedGoals.map((goal) => (
                            <GoalFitCard key={goal.goalId} goal={goal} />
                        ))}
                    </div>
                </div>
            )}

            {(lifts.length > 0 || presses.length > 0) && (
                <div className="grid gap-[clamp(24px,4vw,48px)] grid-cols-1 md:grid-cols-[1fr_1px_1fr] mb-[clamp(40px,5vw,68px)]">
                    {lifts.length > 0 && (
                        <ThemeList title="What supports this" color="var(--sage)">
                            <>
                                {lifts.map((t) => (
                                    <SummaryRow
                                        key={`lift-${t.id}`}
                                        label={t.label}
                                        score={t.score}
                                        tone="lift"
                                        note={supportNote(t.label, selectedGoal)}
                                    />
                                ))}
                            </>
                        </ThemeList>
                    )}
                    {lifts.length > 0 && presses.length > 0 && (
                        <div className="hidden md:block bg-[var(--surface-border)] w-full h-full" />
                    )}
                    {presses.length > 0 && (
                        <ThemeList title="What not to force" color="var(--color-spiced-life)">
                            <>
                                {presses.map((t) => (
                                    <SummaryRow
                                        key={`press-${t.id}`}
                                        label={t.label}
                                        score={t.score}
                                        tone="press"
                                        note={cautionNote(t.label, selectedGoal)}
                                    />
                                ))}
                            </>
                        </ThemeList>
                    )}
                </div>
            )}

            <BottomLine goal={selectedGoal} support={lifts[0]} caution={presses[0]} />
        </TabSection>
    );
}

type GoalFit = V4VM["scoreNarrative"]["selectedGoals"][number];
type Theme = V4VM["scoreNarrative"]["themes"][number];

function prioritizeGoalThemes(themes: Theme[], goalThemeIds: Set<string>): Theme[] {
    return [...themes].sort((a, b) => {
        const aGoal = goalThemeIds.has(a.id) ? 0 : 1;
        const bGoal = goalThemeIds.has(b.id) ? 0 : 1;
        if (aGoal !== bGoal) return aGoal - bGoal;
        return b.score - a.score;
    });
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

function goalCommentary(goal: GoalFit): string {
    if (goal.score >= 75) {
        return `${goal.label} is a clear channel here. ${goalFrame(goal.goalId, "strong")}`;
    }
    if (goal.score >= 55) {
        return `${goal.label} works here, but it has a shape. ${goalFrame(goal.goalId, "mixed")}`;
    }
    if (goal.score >= 40) {
        return `${goal.label} needs care here. ${goalFrame(goal.goalId, "care")}`;
    }
    return `${goal.label} is not the point of this place. Keep this goal light and let the stronger themes carry the experience.`;
}

function GoalFitCard({ goal }: { goal: GoalFit }) {
    const score = Math.round(goal.score);
    return (
        <article
            className="grid gap-4 py-[18px] border-b sm:grid-cols-[auto_1fr_auto] sm:items-center"
            style={{ borderColor: "var(--surface-border)" }}
        >
            <div
                aria-hidden
                className="grid place-items-center size-12"
                style={{
                    color: "var(--color-y2k-blue)",
                    lineHeight: 1,
                }}
            >
                <GoalIcon goalId={goal.goalId} />
            </div>
            <div>
                <h3
                    className="m-0 mb-1 leading-tight"
                    style={{ color: "var(--text-primary)", fontFamily: FONT_PRIMARY, fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400 }}
                >
                    {goal.label}
                </h3>
                <p
                    className="m-0 max-w-[68ch] text-[15px] leading-[1.5]"
                    style={{ color: "var(--text-secondary)", fontFamily: FONT_BODY }}
                >
                    {goalCommentary(goal)}
                </p>
            </div>
            <div
                className="tabular-nums sm:text-right"
                style={{ color: "var(--color-y2k-blue)", fontFamily: FONT_MONO }}
            >
                <strong className="text-[clamp(22px,3vw,30px)] font-semibold">{score}</strong>
                <span className="text-xs">/100</span>
            </div>
        </article>
    );
}

function goalFrame(goalId: string, tone: "strong" | "mixed" | "care"): string {
    const frames: Record<string, Record<typeof tone, string>> = {
        identity: {
            strong: "Confidence can grow visibly, as long as you choose rooms that let you act like yourself.",
            mixed: "It builds self-trust through grounding and private choices, not instant visibility.",
            care: "Do not chase a reinvention; use this place to notice what actually makes you feel like yourself.",
        },
        wealth: {
            strong: "The useful move is practical: offers, budgeting, and decisions that compound.",
            mixed: "It can support money decisions, but not fantasy windfalls or rushed bets.",
            care: "Do not judge the place by fast money; keep spending, contracts, and promises conservative.",
        },
        home: {
            strong: "Roots, routine, and emotional steadiness are the main doorway.",
            mixed: "It can help you test belonging, but it needs time before it feels like home.",
            care: "Do not force permanence; test the neighborhood, rhythm, and body response first.",
        },
        relocation: {
            strong: "Roots, routine, and emotional steadiness are the main doorway.",
            mixed: "It can help you test belonging, but it needs time before it feels like home.",
            care: "Do not force permanence; test the neighborhood, rhythm, and body response first.",
        },
        romance: {
            strong: "Warmth, play, and honest attraction have room to breathe.",
            mixed: "Connection is possible, but it works better when you keep it light and real.",
            care: "Do not ask romance to fix the whole trip; keep expectation low and attention honest.",
        },
        love: {
            strong: "Warmth, play, and honest attraction have room to breathe.",
            mixed: "Connection is possible, but it works better when you keep it light and real.",
            care: "Do not ask love to fix the whole trip; keep expectation low and attention honest.",
        },
        health: {
            strong: "The body responds well to simple routines and repeatable care.",
            mixed: "Health improves through consistency, not intensity.",
            care: "Do not overload the schedule; protect sleep, food, movement, and recovery.",
        },
        partnerships: {
            strong: "One-to-one reflection helps you make cleaner agreements.",
            mixed: "Other people can mirror useful truths, but boundaries still matter.",
            care: "Do not make another person carry the whole decision; keep agreements explicit.",
        },
        career: {
            strong: "Visibility and responsibility are available if you make the ask clearly.",
            mixed: "Career can move here, but it wants focused asks rather than broad ambition.",
            care: "Do not measure the place only by public achievement; keep work expectations precise.",
        },
        friendship: {
            strong: "Introductions and repeat encounters can turn into real belonging.",
            mixed: "Community opens slowly through showing up more than once.",
            care: "Do not mistake proximity for belonging; look for consistency.",
        },
        community: {
            strong: "Introductions and repeat encounters can turn into real belonging.",
            mixed: "Community opens slowly through showing up more than once.",
            care: "Do not mistake proximity for belonging; look for consistency.",
        },
        spirituality: {
            strong: "Quiet, study, and reflection can become genuinely clarifying.",
            mixed: "Reflection helps, but it needs structure so it does not become drifting.",
            care: "Do not turn solitude into over-processing; keep one foot in ordinary life.",
        },
        growth: {
            strong: "Quiet, study, and reflection can become genuinely clarifying.",
            mixed: "Reflection helps, but it needs structure so it does not become drifting.",
            care: "Do not turn growth into over-processing; keep one foot in ordinary life.",
        },
    };
    return frames[goalId]?.[tone] ?? {
        strong: "Use the strongest themes deliberately and keep the plan simple.",
        mixed: "The support is real, but it works best with a narrow intention.",
        care: "Keep the goal light and let the stronger themes lead.",
    }[tone];
}

function supportNote(label: string, goal?: GoalFit): string {
    const key = normalizeTheme(label);
    const goalText = goal?.label.toLowerCase() || "your goal";
    const notes: Record<string, string> = {
        home: `This is the main doorway. ${capitalize(goalText)} gets stronger when you feel anchored.`,
        partnerships: "One-to-one reflection helps here; other people mirror back what you are becoming.",
        romance: "Warmth and play can make the goal feel less heavy. Keep it human, not heroic.",
        career: "This supports clear asks, visible work, and taking responsibility in public.",
        wealth: "Useful for practical choices: resources, offers, and the money math you can actually act on.",
        health: "The gain is repeatable rhythm. Let routine do more work than willpower.",
        friendship: "Repeat encounters matter here. Belonging grows through showing up again.",
        spirituality: "Quiet can clarify the signal, as long as it stays grounded.",
        identity: "This supports self-definition directly: choose the rooms where you can act like yourself.",
    };
    return notes[key] ?? `This is one of the cleaner channels for ${goalText}. Put attention here first.`;
}

function cautionNote(label: string, goal?: GoalFit): string {
    const key = normalizeTheme(label);
    const goalText = goal?.label.toLowerCase() || "the trip";
    const notes: Record<string, string> = {
        spirituality: "Reflection helps, but too much solitude can turn into looping.",
        wealth: "Do not judge this place only by fast money outcomes.",
        career: "This is not mainly a public-achievement place for this goal.",
        home: "Do not force instant belonging. Let the body vote slowly.",
        partnerships: "Keep agreements explicit; do not let someone else define the whole experience.",
        romance: "Do not ask chemistry to carry more meaning than it has earned.",
        health: "Avoid overload. The weak point is pace, not effort.",
        friendship: "Do not confuse activity with belonging. Look for people who repeat.",
        identity: "Do not perform confidence before it feels real.",
    };
    return notes[key] ?? `Keep this lighter while ${goalText} finds its cleaner channel.`;
}

function normalizeTheme(label: string): string {
    const l = label.toLowerCase();
    if (l.includes("home") || l.includes("family") || l.includes("roots")) return "home";
    if (l.includes("partner") || l.includes("marriage")) return "partnerships";
    if (l.includes("romance") || l.includes("love")) return "romance";
    if (l.includes("career") || l.includes("public")) return "career";
    if (l.includes("wealth") || l.includes("financial")) return "wealth";
    if (l.includes("health") || l.includes("routine")) return "health";
    if (l.includes("friend") || l.includes("network") || l.includes("community")) return "friendship";
    if (l.includes("spirit") || l.includes("inner")) return "spirituality";
    if (l.includes("identity") || l.includes("self")) return "identity";
    return l;
}

function capitalize(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function ThemeList({ title, color, children }: { title: string; color: string; children: ReactNode }) {
    return (
        <article className="flex flex-col">
            <h3
                className="m-0 mb-[16px] leading-[1.05]"
                style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 400, color: "var(--text-primary)" }}
            >
                {title}
            </h3>
            <ul className="list-none m-0 p-0 flex flex-col border-t" style={{ borderColor: color }}>
                {children}
            </ul>
        </article>
    );
}

function BottomLine({ goal, support, caution }: { goal?: GoalFit; support?: Theme; caution?: Theme }) {
    const verdict = bottomLineCopy(goal, support, caution);

    return (
        <div
            className="mt-[clamp(28px,4vw,44px)] border-t pt-6"
            style={{
                borderColor: "var(--text-primary)",
            }}
        >
            <div
                className="text-[0.58rem] tracking-[0.18em] uppercase font-semibold mb-2"
                style={{ color: "var(--text-tertiary)", fontFamily: FONT_MONO }}
            >
                Bottom line
            </div>
            <p
                className="m-0 max-w-[62ch] text-[clamp(18px,2vw,22px)] leading-[1.45]"
                style={{ color: "var(--text-primary)", fontFamily: FONT_PRIMARY }}
            >
                {verdict}
            </p>
        </div>
    );
}

function bottomLineCopy(goal: GoalFit | undefined, support: Theme | undefined, caution: Theme | undefined): string {
    const goalId = goal?.goalId || "";
    const supportKey = normalizeTheme(support?.label || "");
    const cautionKey = normalizeTheme(caution?.label || "");

    if (goalId === "identity") {
        return `Use this place for private identity work. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "wealth") {
        return `Use this place for grounded money choices, not financial fantasy. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "home" || goalId === "relocation") {
        return `Use this place to test belonging slowly. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "career") {
        return `Use this place for focused visibility, not vague ambition. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "romance" || goalId === "love") {
        return `Use this place for warmth and honest connection. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "health") {
        return `Use this place for routine and recovery. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "partnerships") {
        return `Use this place for clearer one-to-one agreements. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "friendship" || goalId === "community") {
        return `Use this place for repeat contact and real belonging. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    if (goalId === "spirituality" || goalId === "growth") {
        return `Use this place for reflection with structure. ${supportSentence(supportKey)} ${cautionSentence(cautionKey)}`;
    }
    const supportText = support?.label.toLowerCase() || "the strongest supported theme";
    const cautionText = caution?.label.toLowerCase() || "the weakest theme";
    return `Use this place through ${supportText}. Keep ${cautionText} light.`;
}

function supportSentence(key: string): string {
    const sentences: Record<string, string> = {
        home: "Roots, family, and belonging are the doorway.",
        partnerships: "One-to-one reflection is the doorway.",
        romance: "Warmth and play are the doorway.",
        career: "Clear public asks are the doorway.",
        wealth: "Practical resource choices are the doorway.",
        health: "Repeatable rhythm is the doorway.",
        friendship: "Repeat contact is the doorway.",
        spirituality: "Quiet reflection is the doorway.",
        identity: "Self-trust is the doorway.",
    };
    return sentences[key] ?? "The strongest theme is the doorway.";
}

function cautionSentence(key: string): string {
    const sentences: Record<string, string> = {
        spirituality: "Do not turn solitude into over-processing.",
        wealth: "Do not make fast money the proof.",
        career: "Do not make public achievement the proof.",
        home: "Do not force instant belonging.",
        partnerships: "Do not let someone else define the experience.",
        romance: "Do not make chemistry carry the whole story.",
        health: "Do not overload the pace.",
        friendship: "Do not confuse activity with belonging.",
        identity: "Do not perform confidence before it feels real.",
    };
    return sentences[key] ?? "Do not make the weakest theme carry the trip or move.";
}

function SummaryRow({ label, score, tone, note }: { label: string; score: number; tone: "lift" | "press"; note: string }) {
    const accent = tone === "lift" ? "var(--sage, #4a8a6a)" : "var(--color-spiced-life)";
    return (
        <li
            className="grid items-start gap-3 py-3"
            style={{
                gridTemplateColumns: "minmax(140px, 1fr) auto",
                borderBottom: "1px solid var(--surface-border)",
            }}
        >
            <span
                style={{
                    fontFamily: FONT_PRIMARY,
                    fontSize: "1.05rem",
                    color: "var(--text-primary)",
                }}
            >
                <span>{label}</span>
                <span
                    className="block mt-1 text-sm leading-relaxed"
                    style={{
                        fontFamily: FONT_BODY,
                        color: "var(--text-secondary)",
                    }}
                >
                    {note}
                </span>
            </span>
            <span
                style={{
                    fontFamily: FONT_MONO,
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
