"use client";

import { useMemo, useState } from "react";
import type {
    V4ChartAngle,
    V4ChartAspect,
    V4ChartMonth,
    V4ChartPlanet,
} from "@/app/lib/reading-viewmodel";
import "./ChartInteractive.css";

interface Props {
    angles: V4ChartAngle[];
    natal: V4ChartPlanet[];
    months: V4ChartMonth[];
}

type Hover =
    | { kind: "natal"; data: V4ChartPlanet }
    | { kind: "transit"; data: V4ChartPlanet }
    | { kind: "angle"; data: V4ChartAngle }
    | { kind: "aspect"; data: V4ChartAspect }
    | null;

function degToXY(deg: number, r: number): { x: number; y: number } {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad) * r, y: -Math.sin(rad) * r };
}

// Month tilt — translate the 40–98 viewmodel score into the same dot grammar
// used in §04. Color encodes direction (supportive / mixed / friction); fill
// count encodes magnitude.
type MonthTone = "supportive" | "mixed" | "friction";
function getMonthTilt(score: number): { filled: 1 | 2 | 3; tone: MonthTone; label: string } {
    if (score >= 80) return { filled: 3, tone: "supportive", label: "lifts strongly" };
    if (score >= 70) return { filled: 2, tone: "supportive", label: "lifts" };
    if (score >= 55) return { filled: 1, tone: "mixed", label: "mixed" };
    if (score >= 45) return { filled: 2, tone: "friction", label: "presses" };
    return { filled: 3, tone: "friction", label: "presses hard" };
}

function TiltDots({ filled, tone }: { filled: 1 | 2 | 3; tone: MonthTone }) {
    return (
        <span
            className={`chart-int-tilt-dots tone-${tone}`}
            role="img"
            aria-label={`${filled} of 3, ${tone}`}
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className={`chart-int-tilt-dot${i < filled ? " on" : ""}`}
                />
            ))}
        </span>
    );
}

export default function ChartInteractive({ angles, natal, months }: Props) {
    const [activeIdx, setActiveIdx] = useState(1); // middle month is the anchor
    const [hover, setHover] = useState<Hover>(null);
    const safeIdx = Math.min(Math.max(activeIdx, 0), Math.max(0, months.length - 1));
    const monthData = months[safeIdx];

    const tip = useMemo(() => {
        if (!monthData) {
            return {
                kind: "default" as const,
                title: "No data",
                body: "Reading is being prepared.",
                hint: "",
            };
        }
        if (!hover) {
            const tilt = getMonthTilt(monthData.score);
            return {
                kind: "default" as const,
                title: `${monthData.label} · ${tilt.label}`,
                body: monthData.summary,
                hint: "Hover or tap any dot or line in the chart to learn what it means.",
            };
        }
        if (hover.kind === "natal") {
            return {
                kind: "planet" as const,
                tag: "Your natal chart",
                title: `${hover.data.glyph}  ${hover.data.p}  —  at birth`,
                body: hover.data.plain,
                hint: "Natal placements never change. They are the fixed \"you\" that transits interact with.",
            };
        }
        if (hover.kind === "transit") {
            return {
                kind: "planet" as const,
                tag: `Transiting in ${monthData.key}`,
                title: `${hover.data.glyph}  ${hover.data.p}  —  right now`,
                body: hover.data.plain,
                hint: "Transiting planets are where the planet sits in the sky this month. When they hit one of your natal placements or angles, something is activated.",
            };
        }
        if (hover.kind === "angle") {
            return {
                kind: "angle" as const,
                tag: "Angle of your relocated chart",
                title: `${hover.data.name}  ·  ${hover.data.k}`,
                body: hover.data.plain,
                hint: "Angles are the four \"corners\" of your chart. They change when you move — which is why places feel different.",
            };
        }
        // aspect
        const a = hover.data;
        return {
            kind: "aspect" as const,
            tag: a.kind === "strongest" ? "Strongest aspect this month"
                : a.kind === "friction" ? "Friction aspect"
                : "Supportive aspect",
            title: a.title,
            body: a.why,
            what: a.what,
            timing: a.timing,
            hint: "Aspects are the geometric angles between planets. They are the actual \"why this month\" — a planet hitting a sensitive point in your chart.",
        };
    }, [hover, monthData]);

    if (!monthData) return null;

    return (
        <div className="chart-int">
            <div className="chart-int-tabs">
                {months.map((m, i) => {
                    const tilt = getMonthTilt(m.score);
                    return (
                        <button
                            key={m.key}
                            className={`chart-int-tab${i === safeIdx ? " on" : ""}`}
                            onClick={() => { setActiveIdx(i); setHover(null); }}
                        >
                            <span className="chart-int-tab-label">{m.label}</span>
                            <span className={`chart-int-tab-tilt tone-${tilt.tone}`}>
                                <TiltDots filled={tilt.filled} tone={tilt.tone} />
                                <span className="chart-int-tab-tilt-l">{tilt.label}</span>
                            </span>
                            <span className="chart-int-tab-sum">{m.summary.split(".")[0]}.</span>
                        </button>
                    );
                })}
            </div>

            <div className="chart-int-hint">
                <span className="chart-int-hint-k">how to read this</span>
                <span>
                    Hover any <em>dot</em> or <em>line</em> in the chart for a plain-English explanation. The bright outer dots are where the planets are this month; the softer inner dots are your natal chart.
                </span>
            </div>

            <div className="chart-int-body">
                <div className="chart-int-wheel-wrap">
                    <svg viewBox="-280 -280 560 560" className="chart-int-wheel" aria-label={`Interactive chart for ${monthData.label}`}>
                        {Array.from({ length: 12 }).map((_, i) => {
                            const a = i * 30;
                            const inner = degToXY(a, 160);
                            const outer = degToXY(a, 250);
                            return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="chart-int-spoke" />;
                        })}
                        <circle r="250" className="chart-int-ring outer" />
                        <circle r="215" className="chart-int-ring transit-ring" />
                        <circle r="160" className="chart-int-ring natal-ring" />
                        <circle r="130" className="chart-int-ring inner" />

                        <line x1="-250" y1="0" x2="250" y2="0" className="chart-int-axis" />
                        <line x1="0" y1="-250" x2="0" y2="250" className="chart-int-axis" />

                        {angles.map(ang => {
                            const pos = degToXY(ang.deg, 272);
                            const isHot = monthData.aspects.some(a => a.to.isAngle && Math.abs(a.to.deg - ang.deg) < 6);
                            return (
                                <g key={ang.k}
                                    className="chart-int-angle-g"
                                    onMouseEnter={() => setHover({ kind: "angle", data: ang })}
                                    onMouseLeave={() => setHover(null)}
                                    onFocus={() => setHover({ kind: "angle", data: ang })}
                                    onBlur={() => setHover(null)}
                                    tabIndex={0}
                                >
                                    <circle cx={pos.x} cy={pos.y} r="22" className="chart-int-angle-hit" />
                                    <text x={pos.x} y={pos.y - 4} textAnchor="middle" className={`chart-int-angle-k${isHot ? " hot" : ""}`}>
                                        {ang.k}
                                    </text>
                                    <text x={pos.x} y={pos.y + 10} textAnchor="middle" className="chart-int-angle-name">
                                        {ang.name.toLowerCase()}
                                    </text>
                                </g>
                            );
                        })}

                        {monthData.aspects.map(a => {
                            const from = degToXY(a.from.deg, a.from.isTransit ? 215 : 160);
                            const to = degToXY(a.to.deg, a.to.isAngle ? 250 : 160);
                            return (
                                <g key={a.id}
                                    className="chart-int-aspect-g"
                                    onMouseEnter={() => setHover({ kind: "aspect", data: a })}
                                    onMouseLeave={() => setHover(null)}
                                    onFocus={() => setHover({ kind: "aspect", data: a })}
                                    onBlur={() => setHover(null)}
                                    tabIndex={0}
                                >
                                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="chart-int-aspect-hit" />
                                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={`chart-int-aspect ${a.kind}`} />
                                </g>
                            );
                        })}

                        {natal.map(pl => {
                            const pos = degToXY(pl.deg, 160);
                            return (
                                <g key={pl.p}
                                    className="chart-int-planet-g natal"
                                    onMouseEnter={() => setHover({ kind: "natal", data: pl })}
                                    onMouseLeave={() => setHover(null)}
                                    onFocus={() => setHover({ kind: "natal", data: pl })}
                                    onBlur={() => setHover(null)}
                                    tabIndex={0}
                                >
                                    <circle cx={pos.x} cy={pos.y} r="18" className="chart-int-planet-hit" />
                                    <circle cx={pos.x} cy={pos.y} r="11" className="chart-int-planet-bg natal" />
                                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="chart-int-planet-glyph natal" style={{ fill: pl.color }}>
                                        {pl.glyph}
                                    </text>
                                </g>
                            );
                        })}

                        {monthData.transits.map(pl => {
                            const pos = degToXY(pl.deg, 215);
                            const isActive = monthData.aspects.some(a => a.from.isTransit && Math.abs(a.from.deg - pl.deg) < 6);
                            return (
                                <g key={pl.p}
                                    className={`chart-int-planet-g transit${isActive ? " active" : ""}`}
                                    onMouseEnter={() => setHover({ kind: "transit", data: pl })}
                                    onMouseLeave={() => setHover(null)}
                                    onFocus={() => setHover({ kind: "transit", data: pl })}
                                    onBlur={() => setHover(null)}
                                    tabIndex={0}
                                >
                                    <circle cx={pos.x} cy={pos.y} r="20" className="chart-int-planet-hit" />
                                    {isActive && <circle cx={pos.x} cy={pos.y} r="16" className="chart-int-planet-halo" style={{ fill: pl.color }} />}
                                    <circle cx={pos.x} cy={pos.y} r="13" className="chart-int-planet-bg transit" style={{ fill: pl.color }} />
                                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="chart-int-planet-glyph transit">
                                        {pl.glyph}
                                    </text>
                                </g>
                            );
                        })}

                        <text x="0" y="-6" textAnchor="middle" className="chart-int-center-k">YOUR RELOCATED CHART</text>
                        <text x="0" y="14" textAnchor="middle" className="chart-int-center-m">{monthData.label}</text>
                    </svg>
                </div>

                <aside className={`chart-int-tip chart-int-tip-${tip.kind}`}>
                    {"tag" in tip && tip.tag && <div className="chart-int-tip-tag">{tip.tag}</div>}
                    <h4 className="chart-int-tip-title">{tip.title}</h4>
                    <p className="chart-int-tip-body">{tip.body}</p>
                    {"what" in tip && tip.what && (
                        <div className="chart-int-tip-kv">
                            <span className="chart-int-tip-k">Geometry</span>
                            <span className="chart-int-tip-v">{tip.what}</span>
                        </div>
                    )}
                    {"timing" in tip && tip.timing && (
                        <div className="chart-int-tip-kv">
                            <span className="chart-int-tip-k">Timing</span>
                            <span className="chart-int-tip-v">{tip.timing}</span>
                        </div>
                    )}
                    {tip.hint && <div className="chart-int-tip-hint">{tip.hint}</div>}
                </aside>
            </div>

            <div className="chart-int-legend">
                <div className="chart-int-legend-row">
                    <span className="chart-int-legend-dot natal" />
                    <span className="chart-int-legend-l">Your natal planets</span>
                    <span className="chart-int-legend-d">Where the planets were the moment you were born. Fixed — this is the "you" part.</span>
                </div>
                <div className="chart-int-legend-row">
                    <span className="chart-int-legend-dot transit" />
                    <span className="chart-int-legend-l">Transits this month</span>
                    <span className="chart-int-legend-d">Where the planets are in the sky right now. They move — this is the "timing" part.</span>
                </div>
                <div className="chart-int-legend-row">
                    <span className="chart-int-legend-dot angle" />
                    <span className="chart-int-legend-l">Your four angles</span>
                    <span className="chart-int-legend-d">The "corners" of your chart in this place. When a transit sits on an angle, that's a big signal.</span>
                </div>
                <div className="chart-int-legend-row">
                    <span className="chart-int-legend-line strongest" />
                    <span className="chart-int-legend-l">Strongest aspect</span>
                    <span className="chart-int-legend-d">A planet sitting directly on a sensitive point. The "why this month" in one line.</span>
                </div>
                <div className="chart-int-legend-row">
                    <span className="chart-int-legend-line supportive" />
                    <span className="chart-int-legend-l">Supportive aspect</span>
                    <span className="chart-int-legend-d">Flowing, helpful angles (60° / 120°). Things feel easier along these lines.</span>
                </div>
                <div className="chart-int-legend-row">
                    <span className="chart-int-legend-line friction" />
                    <span className="chart-int-legend-l">Friction aspect</span>
                    <span className="chart-int-legend-d">Tense angles (90°). Useful pressure — usually the reason a month scores lower.</span>
                </div>
            </div>
        </div>
    );
}
