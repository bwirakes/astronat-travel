"use client";

import type { ReactNode } from "react";

interface Props {
    kicker: string;
    title: string;
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
 * Shared step container for the V4 reading tabs. Wraps the kicker label,
 * H2, optional intro paragraph, and tab body in the consistent surface
 * + spacing the design system uses across all five tabs.
 */
export default function TabSection({ kicker, title, intro, wideIntro, children }: Props) {
    return (
        <section className="px-0 py-[88px] sm:py-[88px] py-14">
            <div className="w-full max-w-none m-0">
                <div
                    className="text-[11px] tracking-[0.22em] uppercase mb-5"
                    style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                >
                    {kicker}
                </div>
                <h2
                    className="font-normal leading-none tracking-[-0.02em] m-0 mb-5 [text-wrap:balance]"
                    style={{
                        fontFamily: FONT_PRIMARY,
                        fontSize: "clamp(34px, 5vw, 56px)",
                        color: "var(--text-primary)",
                    }}
                >
                    {title}
                </h2>
                {intro && (
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
                            className="text-[17px] leading-[1.6] font-light max-w-[580px] [text-wrap:pretty] m-0 mb-9"
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
