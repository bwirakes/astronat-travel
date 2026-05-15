"use client";

import type { ReactNode } from "react";
import { ReadingCopyBlock, type ReadingGuideRow, RichTextNode } from "./ReadingCopy";

interface Props {
    kicker: string;
    title: string;
    /** AI-authored outcome-first opener rendered as short reading copy. */
    lead?: string;
    /** Plain-English summary or supporting paragraph below the dek. */
    intro?: ReactNode;
    /** Short practical rows rendered below the interpretation copy. */
    guideRows?: ReadingGuideRow[];
    maxSentences?: number;
    /** When true, intro renders as a wide blue-bordered callout (used by Overview).
     *  When false, intro renders as plain body copy capped at 580px. */
    wideIntro?: boolean;
    titleNoWrap?: boolean;
    children: ReactNode;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

/**
 * Shared step container for the V4 reading tabs. Hierarchy:
 *   kicker (mono label) → title (short H2) → short copy → guide rows
 */
export default function TabSection({ kicker, title, lead, intro, guideRows, maxSentences, wideIntro, titleNoWrap, children }: Props) {
    const leadText = lead?.trim() ?? "";
    const introText = typeof intro === "string" ? intro.trim() : "";
    const showIntroNode =
        !!intro && typeof intro !== "string" && !leadText;

    return (
        <section className="px-0 py-5 sm:py-7">
            <div className="w-full max-w-none m-0">
                <div
                    className="text-[11px] tracking-[0.22em] uppercase mb-4"
                    style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                >
                    {kicker}
                </div>
                <h2
                    className={`font-normal leading-[1.05] tracking-[-0.02em] m-0 mb-6 max-w-[28ch] ${titleNoWrap ? "[text-wrap:balance] sm:whitespace-nowrap sm:[text-wrap:normal]" : "[text-wrap:balance]"}`}
                    style={{
                        fontFamily: FONT_PRIMARY,
                        fontSize: "clamp(28px, 3.4vw, 44px)",
                        color: "var(--text-primary)",
                    }}
                >
                    {title}
                </h2>
                <ReadingCopyBlock
                    lead={leadText}
                    intro={introText && introText !== leadText ? introText : undefined}
                    guideRows={guideRows}
                    maxSentences={maxSentences}
                    wide={wideIntro}
                />
                {showIntroNode && (
                    wideIntro ? (
                        <p
                            className="relative mb-[clamp(42px,5vw,64px)] p-[clamp(20px,3vw,30px)] border-l-4 leading-[1.65]"
                            style={{
                                fontFamily: FONT_BODY,
                                fontSize: "clamp(17px, 1.45vw, 20px)",
                                color: "var(--text-primary)",
                                borderColor: "var(--color-y2k-blue)",
                                background: "color-mix(in oklab, var(--color-y2k-blue) 7%, transparent)",
                            }}
                        >
                            <RichTextNode>{intro}</RichTextNode>
                        </p>
                    ) : (
                        <p
                            className="text-[16px] leading-[1.6] font-light max-w-[60ch] [text-wrap:pretty] m-0 mb-9"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            <RichTextNode>{intro}</RichTextNode>
                        </p>
                    )
                )}
                {children}
            </div>
        </section>
    );
}
