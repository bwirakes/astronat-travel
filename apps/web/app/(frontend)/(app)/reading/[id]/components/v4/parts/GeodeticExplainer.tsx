"use client";

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";
const FONT_DISPLAY_ALT_1 = "var(--font-display-alt-1, serif)";

const TRAVEL_RULES = [
    "Venus or Jupiter on geodetic ASC or MC → ease, opportunity.",
    "Saturn or Mars on geodetic MC → pressure; avoid for high-stakes trips.",
    "Jupiter currently transiting that city's geodetic longitude → amplifies positive outcomes.",
];

const SEVEN_STEPS = [
    "Establish base chart.",
    "Calculate geodetic frame.",
    "Map natal planets.",
    "Identify active zones.",
    "Apply rule of three.",
    "Layer temporal techniques.",
    "Interpret houses.",
];

export default function GeodeticExplainer() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(20px,2.6vw,34px)] mt-7 mb-2">
            <Block index="01" title="Travel rule">
                <ul className="list-none m-0 p-0 flex flex-col gap-3">
                    {TRAVEL_RULES.map((rule, i) => (
                        <li
                            key={i}
                            className="text-[15px] leading-[1.55] pl-5 relative [text-wrap:pretty]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            <span
                                className="absolute left-0 top-[0.55em] w-[7px] h-[7px] rounded-full"
                                style={{ background: "var(--color-y2k-blue)" }}
                            />
                            {rule}
                        </li>
                    ))}
                </ul>
            </Block>
            <Block index="02" title="The 7-step process">
                <ol className="list-none m-0 p-0 flex flex-col gap-[10px] counter-reset">
                    {SEVEN_STEPS.map((step, i) => (
                        <li
                            key={i}
                            className="grid grid-cols-[28px_1fr] items-baseline text-[15px] leading-[1.55]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            <span
                                className="text-[11px] tracking-[0.12em] uppercase"
                                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                            >
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
            </Block>
        </div>
    );
}

function Block({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
    return (
        <article
            className="border p-[clamp(24px,3vw,34px)]"
            style={{
                borderColor: "var(--surface-border)",
                borderRadius: "var(--shape-asymmetric-md, 12px)",
                background: "var(--bg)",
            }}
        >
            <div
                className="leading-none mb-[clamp(20px,3vw,30px)] flex items-baseline gap-3"
                style={{
                    fontFamily: FONT_PRIMARY,
                    fontSize: "clamp(48px, 6vw, 76px)",
                    color: "color-mix(in oklab, var(--text-primary) 35%, transparent)",
                }}
            >
                <span>{index}</span>
                <span className="text-[clamp(22px,2.4vw,32px)] opacity-60">—</span>
            </div>
            <h3
                className="leading-[1.05] m-0 mb-5 [text-wrap:balance]"
                style={{
                    fontFamily: FONT_DISPLAY_ALT_1,
                    fontSize: "clamp(24px, 3vw, 34px)",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                }}
            >
                {title.toLowerCase()}
            </h3>
            {children}
        </article>
    );
}
