"use client";

import { ArrowRight } from "lucide-react";
import type { ReadingTabId } from "@/app/lib/reading-tabs";

interface Props {
    activeTab: ReadingTabId;
    selectTab: (id: string, scrollToPanels?: boolean) => void;
    bridgeText?: string;
}

const NEXT_TAB_MAP: Partial<Record<ReadingTabId, { id: ReadingTabId; label: string; fallbackBridge: string }>> = {
    "overview": { id: "life-themes", label: "Life Themes", fallbackBridge: "Curious to see how your goals move? Read your Life Themes." },
    "life-themes": { id: "place-field", label: "Geography", fallbackBridge: "Where in the world are these energies strongest? Explore your Geography." },
    "place-field": { id: "what-shifts", label: "What Shifts", fallbackBridge: "What shifts when you travel? Compare your Natal and Relocated charts." },
    "what-shifts": { id: "timing", label: "Timeline", fallbackBridge: "When do these transits hit? View your Timeline." },
};

export default function NextTabNav({ activeTab, selectTab, bridgeText }: Props) {
    const nextTab = NEXT_TAB_MAP[activeTab];

    if (!nextTab) {
        return null; // Don't show anything on the final tab (timeline)
    }

    // Split the bridge into the main question and the explicit CTA ("Read your Life Themes")
    const fullText = bridgeText || nextTab.fallbackBridge;
    const [question, ...rest] = fullText.split("?");
    const mainStatement = question + "?";

    return (
        <section 
            className="mt-8 sm:mt-12 mb-0 border-t border-b group cursor-pointer"
            style={{ borderColor: "var(--surface-border)" }}
            onClick={() => selectTab(nextTab.id, true)}
        >
            <div className="py-[clamp(32px,4vw,48px)] flex flex-col md:flex-row items-start md:items-center justify-between gap-8 transition-opacity duration-500 hover:opacity-80">
                <div className="flex flex-col gap-4 max-w-[800px]">
                    <span 
                        className="text-[10px] tracking-[0.25em] uppercase"
                        style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--color-y2k-blue)" }}
                    >
                        Next Step
                    </span>
                    <p 
                        className="m-0 leading-[1.1] tracking-[-0.01em] [text-wrap:balance]"
                        style={{ 
                            fontFamily: "var(--font-primary, serif)", 
                            fontSize: "clamp(28px, 3.5vw, 44px)",
                            color: "var(--text-primary)" 
                        }}
                    >
                        {mainStatement}
                    </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-[var(--text-primary)] md:mt-0 mt-2">
                    <span 
                        className="text-[11px] tracking-[0.2em] uppercase"
                        style={{ fontFamily: "var(--font-mono, monospace)" }}
                    >
                        Explore {nextTab.label}
                    </span>
                    <ArrowRight 
                        className="w-8 h-8 sm:w-10 sm:h-10 transform group-hover:translate-x-4 transition-transform duration-500" 
                        strokeWidth={1} 
                    />
                </div>
            </div>
        </section>
    );
}
