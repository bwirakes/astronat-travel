"use client";

import type { ReactNode } from "react";

interface Props {
    kicker: string;
    title: string;
    /** AI-authored outcome-first opener. Rendered as a drop-cap magazine dek
     *  between the H2 title and the body summary. */
    lead?: string;
    /** Plain-English summary or supporting paragraph below the dek. */
    intro?: ReactNode;
    /** When true, intro renders as a wide blue-bordered callout (used by Overview).
     *  When false, intro renders as plain body copy capped at 580px. */
    wideIntro?: boolean;
    children: ReactNode;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

/**
 * Shared step container for the V4 reading tabs. Hierarchy:
 *   kicker (mono label) → title (short H2) → lead (drop-cap dek) → intro (body para)
 */
export default function TabSection({ kicker, title, lead, intro, wideIntro, children }: Props) {
    // Merge AI lead + summary into a single drop-cap paragraph under the H2.
    // Avoids the "two sentences competing for the same role" issue while
    // preserving the longer explainer copy. If lead and intro happen to be
    // the same string, dedupe so we don't repeat it.
    const leadText = lead?.trim() ?? "";
    const introText = typeof intro === "string" ? intro.trim() : "";
    const dekText =
        leadText && introText && introText !== leadText
            ? `${leadText} ${introText}`
            : (leadText || introText);
    const showDek = dekText.length > 0;
    // Non-string intro nodes (rare — not used in current tabs) still render
    // through the wide-intro callout if explicitly requested.
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
                    className="font-normal leading-[1.05] tracking-[-0.02em] m-0 mb-6 [text-wrap:balance] max-w-[28ch]"
                    style={{
                        fontFamily: FONT_PRIMARY,
                        fontSize: "clamp(28px, 3.4vw, 44px)",
                        color: "var(--text-primary)",
                    }}
                >
                    {title}
                </h2>
                {showDek && (
                    <div className="mb-[clamp(32px,3.5vw,48px)] w-full">
                        <p
                            className="m-0 [text-wrap:pretty]"
                            style={{
                                fontFamily: FONT_BODY,
                                fontSize: "clamp(17px, 1.3vw, 19px)",
                                lineHeight: 1.65,
                                color: "var(--text-primary)",
                                fontWeight: 400,
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    float: "left",
                                    fontFamily: FONT_PRIMARY,
                                    fontSize: "clamp(64px, 7vw, 96px)",
                                    lineHeight: 0.85,
                                    color: "var(--color-y2k-blue)",
                                    marginRight: "0.14em",
                                    marginTop: "0.06em",
                                    marginBottom: "-0.08em",
                                }}
                            >
                                {dekText.charAt(0)}
                            </span>
                            {dekText.slice(1)}
                        </p>
                    </div>
                )}
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
                            {intro}
                        </p>
                    ) : (
                        <p
                            className="text-[16px] leading-[1.6] font-light max-w-[60ch] [text-wrap:pretty] m-0 mb-9"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            {intro}
                        </p>
                    )
                )}
                {children}
            </div>
        </section>
    );
}
