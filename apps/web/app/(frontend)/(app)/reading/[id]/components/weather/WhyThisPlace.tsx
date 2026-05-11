"use client";

interface Props {
    hook: string;
    dropLine?: string;
}

export function WhyThisPlace({ hook, dropLine }: Props) {
    return (
        <section
            aria-label="Why this place, this season"
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: "clamp(1rem, 2vw, 1.5rem)",
                padding: "clamp(2rem, 4vw, 3rem) 0",
            }}
        >
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.28em",
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                Why this place, this season
            </div>

            <p
                style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                    lineHeight: 1.4,
                    color: "var(--text-primary)",
                    margin: 0,
                    maxWidth: "42ch",
                    textWrap: "pretty",
                    fontWeight: 400,
                }}
            >
                {hook}
            </p>

            {dropLine && (
                <p
                    style={{
                        fontFamily: "var(--font-secondary)",
                        fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                        lineHeight: 1.5,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "60ch",
                        textWrap: "pretty",
                        fontStyle: "italic",
                    }}
                >
                    {dropLine}
                </p>
            )}
        </section>
    );
}
