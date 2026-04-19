"use client";

interface Props {
    hook: string;
    dropLine?: string;
}

/**
 * The AI-authored "highlight" paragraph that lives inside the top summary
 * block. Sits directly under the TopDatesStrip. This is the single best
 * explanation of what the reading says — it's the first thing after score
 * and dates that a user reads.
 */
export function SummaryHighlight({ hook, dropLine }: Props) {
    return (
        <section
            aria-label="Highlight"
            style={{
                padding: "clamp(1.25rem, 2.5vw, 1.75rem)",
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderLeft: "4px solid var(--color-y2k-blue)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
            }}
        >
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.25em",
                    color: "var(--color-y2k-blue)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                Highlight
            </div>

            <p
                style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "clamp(1rem, 1.6vw, 1.2rem)",
                    lineHeight: 1.55,
                    color: "var(--text-primary)",
                    margin: 0,
                    textWrap: "pretty",
                    maxWidth: "64ch",
                }}
            >
                {hook}
            </p>

            {dropLine && (
                <p
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        lineHeight: 1.5,
                        letterSpacing: "0.05em",
                        color: "var(--text-tertiary)",
                        margin: 0,
                        fontStyle: "italic",
                        textTransform: "none",
                        fontWeight: 400,
                        maxWidth: "64ch",
                    }}
                >
                    {dropLine}
                </p>
            )}
        </section>
    );
}
