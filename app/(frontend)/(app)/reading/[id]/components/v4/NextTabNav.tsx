"use client";

import { ArrowRight } from "lucide-react";
import type { ReadingTabId } from "@/app/lib/reading-tabs";
import { AsteriskStarburst, OrbitalPaths } from "@/app/components/ui/svg-shapes";

interface Props {
    activeTab: ReadingTabId;
    selectTab: (id: string, scrollToPanels?: boolean) => void;
    bridgeText?: string;
}

const NEXT_TAB_MAP: Partial<Record<ReadingTabId, { id: ReadingTabId; label: string; fallbackBridge: string; bridgeTerms: string[] }>> = {
    "overview": {
        id: "what-shifts",
        label: "What Shifts",
        fallbackBridge: "What changes when you use this place? Compare your natal and relocated chart.",
        bridgeTerms: ["what shifts", "chart", "relocated"],
    },
    "what-shifts": {
        id: "place-field",
        label: "Geography",
        fallbackBridge: "Where in the world are these energies strongest? Explore your Geography.",
        bridgeTerms: ["geography", "map", "place", "world", "line"],
    },
    "place-field": {
        id: "timing",
        label: "Timeline",
        fallbackBridge: "When do these transits hit? View your Timeline.",
        bridgeTerms: ["timing", "timeline", "transit", "window", "date"],
    },
};

export default function NextTabNav({ activeTab, selectTab, bridgeText }: Props) {
    const nextTab = NEXT_TAB_MAP[activeTab];

    if (!nextTab) {
        return null; // Don't show anything on the final tab (timeline)
    }

    // The bridge typically opens with a question that grabs attention before
    // a sentence pointing to the next tab. We surface only the question (or
    // the whole sentence when the bridge isn't phrased as one), and leave
    // the standing CTA on the right of the row.
    const fullText = bridgeMatchesNextTab(bridgeText, nextTab.bridgeTerms)
        ? bridgeText
        : nextTab.fallbackBridge;
    const questionEnd = fullText.indexOf("?");
    const mainStatement = questionEnd >= 0 ? fullText.slice(0, questionEnd + 1) : fullText;

    return (
        <section className="mt-10 sm:mt-14 mb-0">
            <button
                type="button"
                className="group relative block w-full overflow-hidden rounded-[8px] border px-5 py-6 text-left transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-y2k-blue)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg)] sm:px-7 sm:py-7"
                style={{
                    background: "var(--color-y2k-blue)",
                    borderColor: "var(--color-y2k-blue)",
                    boxShadow: "0 22px 54px rgba(4, 86, 251, 0.22)",
                }}
                onClick={() => selectTab(nextTab.id, true)}
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 text-[var(--color-eggshell)] opacity-[0.14]"
                >
                    <OrbitalPaths size="100%" className="absolute inset-0" />
                    <AsteriskStarburst size="22%" className="absolute left-[18%] top-[32%] text-[var(--color-acqua-soft)] opacity-90" />
                </div>
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-10 left-[8%] h-24 w-24 rounded-full border border-[var(--color-eggshell)] opacity-[0.12]"
                />
                <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex min-w-0 max-w-[880px] flex-col gap-4">
                        <span
                            className="inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]"
                            style={{
                                fontFamily: "var(--font-mono, monospace)",
                                color: "var(--color-charcoal)",
                                background: "var(--color-acqua-soft)",
                            }}
                        >
                            Next Step
                        </span>
                        <p
                            className="m-0 max-w-[21ch] leading-[1.04] tracking-normal [text-wrap:balance]"
                            style={{
                                fontFamily: "var(--font-primary, serif)",
                                fontSize: "clamp(32px, 4.3vw, 58px)",
                                color: "var(--text-on-y2k-blue)",
                            }}
                        >
                            {mainStatement}
                        </p>
                    </div>

                    <span
                        className="inline-flex w-fit shrink-0 items-center gap-3 rounded-full px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-transform duration-300 group-hover:translate-x-1"
                        style={{
                            fontFamily: "var(--font-mono, monospace)",
                            color: "var(--color-y2k-blue)",
                            background: "var(--color-eggshell)",
                        }}
                    >
                        Explore {nextTab.label}
                        <ArrowRight
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            strokeWidth={1.75}
                        />
                    </span>
                </div>
            </button>
        </section>
    );
}

function bridgeMatchesNextTab(bridgeText: string | undefined, terms: string[]): bridgeText is string {
    const clean = bridgeText?.trim().toLowerCase();
    if (!clean) return false;
    return terms.some((term) => clean.includes(term));
}
