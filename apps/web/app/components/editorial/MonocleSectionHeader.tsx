"use client";

import type { ReactNode } from "react";

interface Props {
    /** Optional "§NN" index marker. Renders as a mono kicker before the title. */
    index?: string;
    title: string;
    /** Optional sub paragraph rendered under the title (outside the border). */
    sub?: ReactNode;
    /** When true, suppresses the default top margin (use under a banner that
     *  already supplies its own break). */
    flush?: boolean;
}

/**
 * Editorial subsection header — kicker §NN + serif title + hairline.
 * Mirrors the SectionHead grammar used in the couples reading spread so
 * /chart, /couples, and any future editorial surface share one rhythm.
 */
export default function MonocleSectionHeader({ index, title, sub, flush }: Props) {
    return (
        <header style={{
            marginTop: flush ? 0 : "var(--space-xl)",
            marginBottom: "var(--space-md)",
        }}>
            <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.85rem",
                paddingBottom: "0.6rem",
                borderBottom: "1px solid var(--surface-border)",
            }}>
                {index && (
                    <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.22em",
                        color: "var(--text-tertiary)",
                        fontWeight: 700,
                    }}>
                        §{index}
                    </span>
                )}
                <h2 style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                    margin: 0,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    flex: 1,
                }}>
                    {title}
                </h2>
            </div>
            {sub && (
                <p style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    fontWeight: 300,
                    color: "var(--text-secondary)",
                    margin: "var(--space-md) 0 0",
                    maxWidth: "75ch",
                }}>
                    {sub}
                </p>
            )}
        </header>
    );
}
