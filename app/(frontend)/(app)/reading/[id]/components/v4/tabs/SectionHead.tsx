"use client";

import type { ReactNode } from "react";

interface Props {
    /** Optional "§NN" index marker. Renders as a mono kicker before the title. */
    index?: string;
    title: string;
    /** Optional sub paragraph rendered under the title (outside the border). */
    sub?: ReactNode;
    /** Optional info-tooltip surfaced as a circular "i" affordance next to
     *  the title. Used by data-heavy sections (Gantt, score strip) to
     *  explain how the underlying chart should be read. */
    tooltip?: string;
}

/**
 * Shared subsection heading used by Geography / What Shifts / Timing /
 * any future tab that organises its body into numbered sections.
 *
 * The hairline divider under the title is the editorial signature for
 * subsections — magazines use the same beat to separate departments
 * within a feature. Keeping it consistent across tabs is what the
 * Monocle-direction design feedback was asking for.
 */
export default function SectionHead({ index, title, sub, tooltip }: Props) {
    return (
        <header style={{ marginBottom: "var(--space-md)" }}>
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
                <h3 style={{
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
                </h3>
                {tooltip && (
                    <span
                        title={tooltip}
                        aria-label={tooltip}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: "1px solid var(--surface-border)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6rem",
                            color: "var(--text-tertiary)",
                            cursor: "help",
                            flexShrink: 0,
                        }}
                    >
                        i
                    </span>
                )}
            </div>
            {sub && (
                <p style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.88rem",
                    lineHeight: 1.55,
                    fontWeight: 300,
                    color: "var(--text-secondary)",
                    margin: "0.6rem 0 0",
                    maxWidth: "640px",
                }}>
                    {sub}
                </p>
            )}
        </header>
    );
}
