"use client";

/**
 * Teaching section — "how to use a geodetic chart to time decisions."
 * Static editorial content; no dependencies on the specific reading.
 */
const TIMING_BULLETS: { title: string; body: string }[] = [
    {
        title: "Find the place's degree",
        body: "Every city sits at a fixed degree of the zodiac on the earth itself. That degree never changes.",
    },
    {
        title: "Wait for the helpful planets",
        body: "Time decisions for when the gentle planets — Venus or Jupiter — are crossing your place's angles. That is when the support is real.",
    },
    {
        title: "Track the heavy ones",
        body: "Follow Jupiter, Saturn, and the Nodes as they move over your city's longitude. Those passes set the big storylines.",
    },
    {
        title: "Skip eclipse degrees",
        body: "Avoid launching anything on an eclipse degree that lands on a difficult natal planet. The reset tends to overwrite your plan.",
    },
];

const FRAMEWORK_STEPS: { title: string; body: string }[] = [
    {
        title: "Start with a clean chart",
        body: "Use an accurate birth, national, or event chart — correct date, time, and place.",
    },
    {
        title: "Build the geodetic frame",
        body: "Derive the geodetic Midheaven from longitude and the Ascendant using latitude and a house table for the target city.",
    },
    {
        title: "Map your planets to the earth",
        body: "Convert each natal planet's zodiac position into a geographic longitude. Those are your personal ley lines.",
    },
    {
        title: "Find the active zones",
        body: "See where current transits, eclipses, and lunations land on the world map using the same geodetic formula.",
    },
    {
        title: "Apply the rule of three",
        body: "Confirm with at least three sources — national chart contacts, additional timing layers, and ACG lines — before reading a result.",
    },
    {
        title: "Layer temporal techniques",
        body: "Add transits, progressions, and solar arc directions on top of the geodetic frame for precise timing.",
    },
    {
        title: "Interpret the houses",
        body: "Read the geodetic house themes for the target location — which life areas are actually activated there.",
    },
];

export function TimingDecisions() {
    return (
        <section
            aria-label="Timing important decisions"
            style={{
                padding: "clamp(2.5rem, 5vw, 4rem) 0",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(2rem, 4vw, 3rem)",
            }}
        >
            {/* Subsection A — Timing important decisions */}
            <div
                className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]"
                style={{ gap: "clamp(1.25rem, 3vw, 2.5rem)", alignItems: "start" }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.62rem",
                            letterSpacing: "0.28em",
                            color: "var(--gold)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginBottom: "0.6rem",
                        }}
                    >
                        § 3 — Timing important decisions
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                            margin: 0,
                            color: "var(--text-primary)",
                            textWrap: "balance",
                        }}
                    >
                        When to move.
                    </h2>
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "52ch",
                        fontWeight: 300,
                    }}
                >
                    A geodetic chart gives you four simple rules for timing a big decision at a specific place.
                </p>
            </div>

            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {TIMING_BULLETS.map((b, i) => (
                    <li
                        key={i}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "48px 1fr",
                            gap: "clamp(0.75rem, 2vw, 1.25rem)",
                            padding: "clamp(0.9rem, 2vw, 1.25rem) 0",
                            borderTop: "1px solid var(--surface-border)",
                            alignItems: "baseline",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-primary)",
                                fontSize: "1.5rem",
                                color: "var(--color-y2k-blue)",
                                fontVariantNumeric: "tabular-nums",
                                lineHeight: 1,
                            }}
                        >
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                            <h3
                                style={{
                                    fontFamily: "var(--font-primary)",
                                    fontSize: "clamp(1.15rem, 2vw, 1.4rem)",
                                    lineHeight: 1.2,
                                    margin: 0,
                                    color: "var(--text-primary)",
                                    fontWeight: 400,
                                }}
                            >
                                {b.title}
                            </h3>
                            <p
                                style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "0.98rem",
                                    lineHeight: 1.55,
                                    color: "var(--text-secondary)",
                                    margin: "0.35rem 0 0",
                                    maxWidth: "62ch",
                                    fontWeight: 300,
                                    textWrap: "pretty",
                                }}
                            >
                                {b.body}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>

            {/* Subsection B — Framework */}
            <div
                className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]"
                style={{ gap: "clamp(1.25rem, 3vw, 2.5rem)", alignItems: "start", marginTop: "1rem" }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.62rem",
                            letterSpacing: "0.28em",
                            color: "var(--gold)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginBottom: "0.6rem",
                        }}
                    >
                        § 4 — The framework
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                            margin: 0,
                            color: "var(--text-primary)",
                            textWrap: "balance",
                        }}
                    >
                        How this reading is built.
                    </h2>
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        margin: 0,
                        maxWidth: "52ch",
                        fontWeight: 300,
                    }}
                >
                    Seven steps, in order. Each earlier step has to hold before the next step means anything.
                </p>
            </div>

            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {FRAMEWORK_STEPS.map((s, i) => (
                    <li
                        key={i}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "48px 1fr",
                            gap: "clamp(0.75rem, 2vw, 1.25rem)",
                            padding: "clamp(0.75rem, 1.5vw, 1rem) 0",
                            borderTop: "1px solid var(--surface-border)",
                            alignItems: "baseline",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.6rem",
                                letterSpacing: "0.22em",
                                color: "var(--text-tertiary)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}
                        >
                            Step {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                            <h3
                                style={{
                                    fontFamily: "var(--font-primary)",
                                    fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
                                    lineHeight: 1.2,
                                    margin: 0,
                                    color: "var(--text-primary)",
                                    fontWeight: 400,
                                }}
                            >
                                {s.title}
                            </h3>
                            <p
                                style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "0.95rem",
                                    lineHeight: 1.5,
                                    color: "var(--text-secondary)",
                                    margin: "0.3rem 0 0",
                                    maxWidth: "62ch",
                                    fontWeight: 300,
                                    textWrap: "pretty",
                                }}
                            >
                                {s.body}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
