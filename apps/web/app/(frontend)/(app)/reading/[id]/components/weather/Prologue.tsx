"use client";

interface Props {
    hook: string;        // 2–3 sentence editorial paragraph
    dropLine: string;    // astrology-literate one-liner
}

export function Prologue({ hook, dropLine }: Props) {
    return (
        <section
            aria-label="Why this window reads this way"
            style={{
                padding: "clamp(2.5rem, 5vw, 4.5rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "clamp(1.5rem, 3vw, 2.5rem)",
            }}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]"
        >
            {/* Left — kicker */}
            <div>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.28em",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginBottom: "0.5rem",
                    }}
                >
                    02 · The why
                </div>
                <h2
                    style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                        lineHeight: 0.95,
                        letterSpacing: "-0.02em",
                        margin: 0,
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        textWrap: "balance",
                    }}
                >
                    How the{" "}
                    <span
                        style={{
                            fontFamily: "var(--font-display-alt-2)",
                            color: "var(--color-y2k-blue)",
                            textTransform: "lowercase",
                            letterSpacing: 0,
                            fontSize: "1em",
                        }}
                    >
                        score
                    </span>{" "}
                    was built
                </h2>
            </div>

            {/* Right — hook paragraph + drop-line */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 }}>
                <p
                    style={{
                        fontFamily: "var(--font-secondary)",
                        fontSize: "clamp(1.1rem, 1.8vw, 1.35rem)",
                        lineHeight: 1.55,
                        color: "var(--text-primary)",
                        margin: 0,
                        textWrap: "pretty",
                        maxWidth: "56ch",
                    }}
                >
                    {hook}
                </p>

                <div
                    style={{
                        paddingLeft: "1.25rem",
                        borderLeft: "2px solid var(--color-y2k-blue)",
                    }}
                >
                    <p
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.95rem",
                            lineHeight: 1.6,
                            color: "var(--text-secondary)",
                            margin: 0,
                            fontStyle: "italic",
                            textWrap: "pretty",
                            maxWidth: "58ch",
                        }}
                    >
                        {dropLine}
                    </p>
                </div>
            </div>
        </section>
    );
}
