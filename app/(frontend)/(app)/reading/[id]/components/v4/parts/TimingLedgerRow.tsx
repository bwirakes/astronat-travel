import React from "react";
import { Clock3 } from "lucide-react";
import { BrandSparkle, ConcentricDiamonds } from "@/app/components/ui/svg-shapes";
import { RichText } from "../../shared/ReadingCopy";

const FM = "var(--font-mono)";
const FB = "var(--font-body)";

export type TimingLedgerTone = "good" | "moderate" | "hard";
export type TimingReceiptTone = "good" | "watch" | "neutral";

export interface TimingReceipt {
    receipt: string;
    meaning: string;
    tone: TimingReceiptTone;
}

const PLANET_TOPIC: Record<string, string> = {
    sun: "confidence",
    moon: "mood",
    mercury: "plans",
    venus: "connection",
    mars: "urgency",
    jupiter: "growth",
    saturn: "structure",
    uranus: "surprises",
    neptune: "fog",
    pluto: "control",
};

const TRANSIT_HELP: Record<string, string> = {
    sun: "visibility",
    moon: "mood",
    mercury: "messages",
    venus: "ease",
    mars: "speed",
    jupiter: "growth",
    saturn: "structure",
    uranus: "change",
    neptune: "imagination",
    pluto: "focus",
};

const TRANSIT_PRESSURE: Record<string, string> = {
    sun: "visibility",
    moon: "mood",
    mercury: "messages",
    venus: "comfort",
    mars: "speed",
    jupiter: "too much growth",
    saturn: "limits",
    uranus: "surprises",
    neptune: "fog",
    pluto: "control",
};

export function scoreTone(score: number): TimingLedgerTone {
    if (score >= 70) return "good";
    if (score >= 55) return "moderate";
    return "hard";
}

function capWord(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
}

function topicVerb(topic: string): "get" | "gets" {
    return /\band\b/i.test(topic) || /\b(plans|limits|resources|messages|surprises)\b/i.test(topic)
        ? "get"
        : "gets";
}

function aspectLabel(aspect: string): string {
    const key = aspect.toLowerCase();
    if (key.includes("square")) return "square";
    if (key.includes("oppos")) return "opposition";
    if (key.includes("trine")) return "trine";
    if (key.includes("sextile")) return "sextile";
    if (key.includes("conjoin") || key.includes("conjunct")) return "conjunction";
    return key;
}

export function parseTimingHits(note: string): TimingReceipt[] {
    const hits: TimingReceipt[] = [];
    const pattern = /\b([A-Z][a-z]+)\s+(?:(℞|Rx|R|retrograde)\s+)?(conjoins|conjuncts|squares|opposes|trines|sextiles|conjunction|conjunct|square|opposition|trine|sextile)\s+natal\s+([A-Z][a-z]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(note)) && hits.length < 2) {
        const transit = match[1];
        const retrograde = Boolean(match[2]);
        const aspect = aspectLabel(match[3]);
        const natal = match[4];
        const transitKey = transit.toLowerCase();
        const natalKey = natal.toLowerCase();
        const isHard = aspect === "square" || aspect === "opposition";
        const isEasy = aspect === "trine" || aspect === "sextile";
        const natalTopic = PLANET_TOPIC[natalKey] ?? natalKey;
        const transitHelp = TRANSIT_HELP[transitKey] ?? transitKey;
        const transitPressure = TRANSIT_PRESSURE[transitKey] ?? transitKey;
        const baseMeaning = isHard
            ? `Watch ${natalTopic}; ${transitPressure} can add pressure.`
            : isEasy
                ? `${capWord(natalTopic)} ${topicVerb(natalTopic)} help from ${transitHelp}.`
                : `${capWord(natalTopic)} ${topicVerb(natalTopic)} louder through ${transitPressure}.`;
        const meaning = retrograde
            ? `${baseMeaning} Review old threads before acting.`
            : baseMeaning;
        hits.push({
            receipt: `${capWord(transit)}${retrograde ? " Rx" : ""} ${aspect} ${capWord(natal)}`,
            meaning,
            tone: isHard ? "watch" : isEasy ? "good" : "neutral",
        });
    }
    return hits;
}

function receiptColor(tone: TimingReceiptTone): string {
    if (tone === "good") return "var(--lift-accent)";
    if (tone === "watch") return "var(--color-spiced-life)";
    return "var(--gold)";
}

function actionColor(tone: TimingLedgerTone): string {
    if (tone === "good") return "var(--lift-accent)";
    if (tone === "hard") return "var(--color-spiced-life)";
    return "var(--gold)";
}

function ActionIcon({ tone }: { tone: TimingLedgerTone }) {
    const color = actionColor(tone);
    const baseStyle: React.CSSProperties = {
        color,
        flex: "0 0 auto",
        width: 18,
        height: 18,
    };

    if (tone === "good") {
        return (
            <BrandSparkle aria-hidden="true" size={18} style={baseStyle} />
        );
    }

    if (tone === "hard") {
        return (
            <span
                aria-hidden="true"
                style={{
                    ...baseStyle,
                    position: "relative",
                    display: "inline-grid",
                    placeItems: "center",
                }}
            >
                <ConcentricDiamonds size={18} style={{ color, display: "block" }} />
                <span
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        fontFamily: FM,
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        lineHeight: 1,
                    }}
                >
                    !
                </span>
            </span>
        );
    }

    return (
        <Clock3 aria-hidden="true" strokeWidth={1.8} style={baseStyle} />
    );
}

export function TimingLedgerRow({
    label,
    title,
    tone,
    score,
    scoreLabel,
    receipts,
    fallback,
    rationale,
    action,
}: {
    label: string;
    title: string;
    tone: TimingLedgerTone;
    score?: number;
    scoreLabel?: string;
    receipts?: TimingReceipt[];
    fallback?: string;
    rationale?: string;
    action?: string;
}) {
    const hasReceipts = Boolean(receipts?.length);

    return (
        <div
            className={`travel-window-row travel-window-row--${tone}`}
            style={{
                display: "grid",
                gridTemplateColumns: score === undefined
                    ? "minmax(7rem, 0.55fr) minmax(0, 2fr)"
                    : "minmax(7rem, 0.55fr) minmax(0, 2fr) auto",
                gap: "1rem",
                alignItems: "start",
                padding: "1.35rem 0 1.45rem",
                borderTop: `1px solid color-mix(in oklab, var(--text-primary) 13%, var(--surface-border))`,
            }}
        >
            <div
                className="travel-window-label"
                style={{
                    fontFamily: FM,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    minWidth: 0,
                    paddingTop: "0.12rem",
                }}
            >
                <span className="travel-window-dot" aria-hidden="true" />
                <span>{label}</span>
            </div>

            <div className="travel-window-copy" style={{ minWidth: 0 }}>
                <span
                    className="travel-window-dates"
                    style={{
                        display: "block",
                        fontFamily: "var(--font-primary)",
                        fontSize: "clamp(1.08rem, 1.8vw, 1.32rem)",
                        lineHeight: 1.2,
                        color: "var(--text-primary)",
                    }}
                >
                    <RichText>{title}</RichText>
                </span>

                {hasReceipts ? (
                    <div
                        className="travel-window-note"
                        style={{
                            fontFamily: FB,
                            display: "grid",
                            gap: "0.62rem",
                            marginTop: "0.42rem",
                        }}
                    >
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                            {receipts!.map((hit) => {
                                const color = receiptColor(hit.tone);
                                return (
                                    <span
                                        key={hit.receipt}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.32rem",
                                            fontFamily: FM,
                                            fontSize: "0.58rem",
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color,
                                            border: `1px solid color-mix(in oklab, ${color} 68%, transparent)`,
                                            background: `color-mix(in oklab, ${color} 9%, transparent)`,
                                            borderRadius: 999,
                                            padding: "0.18rem 0.48rem",
                                            lineHeight: 1.2,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {hit.receipt}
                                    </span>
                                );
                            })}
                        </div>
                        {rationale ? (
                            <p
                                style={{
                                    margin: 0,
                                    color: "var(--text-secondary)",
                                    lineHeight: 1.5,
                                    fontSize: "0.96rem",
                                    maxWidth: "56ch",
                                }}
                            >
                                <RichText autoEmphasis={false} allowBold={false}>{rationale}</RichText>
                            </p>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gap: "0.28rem",
                                    color: "var(--text-secondary)",
                                    lineHeight: 1.45,
                                    fontSize: "0.96rem",
                                }}
                            >
                                {receipts!.map((hit) => (
                                    <span key={hit.meaning}>{hit.meaning}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : fallback ? (
                    <span className="travel-window-note" style={{ fontFamily: FB }}>
                        <RichText>{fallback}</RichText>
                    </span>
                ) : null}

                {action && (
                    <div
                        style={{
                            justifySelf: "start",
                            display: "flex",
                            gap: "0.48rem",
                            alignItems: "flex-start",
                            fontFamily: FB,
                            fontSize: "0.95rem",
                            color: "var(--text-primary)",
                            padding: "0.05rem 0",
                            lineHeight: 1.45,
                            marginTop: hasReceipts ? "0.62rem" : "0.5rem",
                        }}
                    >
                        <ActionIcon tone={tone} />
                        <span>{action}</span>
                    </div>
                )}
            </div>

            {score !== undefined && (
                <span
                    className="travel-window-score"
                    aria-label={`${scoreLabel ?? "Timing"} importance score: ${score} out of 100`}
                    style={{
                        fontFamily: FM,
                        fontSize: "0.92rem",
                        letterSpacing: "0.02em",
                        color: tone === "good"
                            ? "var(--lift-accent)"
                            : tone === "hard"
                                ? "var(--color-spiced-life)"
                                : "var(--gold)",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                    }}
                >
                    <span>{score}</span><span>/100</span>
                </span>
            )}
        </div>
    );
}
