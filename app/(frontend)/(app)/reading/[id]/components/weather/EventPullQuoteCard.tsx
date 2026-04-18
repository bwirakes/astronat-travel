"use client";

import {
    LAYER_LABEL,
    LAYER_BODY,
    planetGlyph,
    planetTailwindBg,
    type GWEvent,
} from "@/app/lib/geodetic-weather-types";

interface Props {
    event: GWEvent;
    tone: "eggshell" | "charcoal" | "black";
    size?: "sm" | "md" | "lg";
    /** Optional: editorial body copy override (auto-filled from layer glossary). */
    body?: string;
}

const TONE_STYLES: Record<Props["tone"], { bg: string; text: string; accent: string; subtle: string }> = {
    eggshell: {
        bg: "var(--color-eggshell)",
        text: "var(--color-charcoal)",
        accent: "var(--color-y2k-blue)",
        subtle: "rgba(27,27,27,0.65)",
    },
    charcoal: {
        bg: "var(--color-charcoal)",
        text: "var(--color-eggshell)",
        accent: "var(--color-acqua)",
        subtle: "rgba(248,245,236,0.65)",
    },
    black: {
        bg: "var(--color-black)",
        text: "var(--color-eggshell)",
        accent: "var(--color-spiced-life)",
        subtle: "rgba(248,245,236,0.55)",
    },
};

export function EventPullQuoteCard({ event, tone, size = "md", body }: Props) {
    const s = TONE_STYLES[tone];
    const headlineSize = size === "lg" ? "clamp(1.4rem, 2.4vw, 2.1rem)" : size === "md" ? "clamp(1.1rem, 1.8vw, 1.5rem)" : "1rem";
    const layerLabel = LAYER_LABEL[event.layer] ?? String(event.layer).toUpperCase().replace(/-/g, " ");
    const copy = body ?? LAYER_BODY[event.layer] ?? "This layer is surfacing in the day's sky.";
    const cut = size === "lg" ? "var(--cut-lg)" : "var(--cut-md)";
    const severityAbs = Math.abs(event.severity);
    const severityLabel =
        event.severity > 0 ? `pulls the day ${severityAbs} points toward calm` : `pulls the day ${severityAbs} points toward unrest`;

    return (
        <div
            style={{
                background: s.bg,
                color: s.text,
                padding: size === "lg" ? "2rem 2.25rem" : "1.25rem 1.5rem",
                clipPath: cut,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                position: "relative",
            }}
        >
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: s.accent,
                    fontWeight: 700,
                }}
            >
                {layerLabel}
            </div>

            <h4
                style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: headlineSize,
                    lineHeight: 1.1,
                    color: s.text,
                    margin: 0,
                }}
            >
                {event.label}
            </h4>

            <p
                style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    lineHeight: 1.55,
                    color: s.subtle,
                    margin: 0,
                }}
            >
                {copy} <span style={{ color: s.accent, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>— {severityLabel}.</span>
            </p>

            {event.note && (
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.15em",
                        color: s.accent,
                        textTransform: "uppercase",
                        paddingTop: "0.35rem",
                        borderTop: `1px solid ${s.accent}`,
                        opacity: 0.75,
                    }}
                >
                    {event.note}
                </div>
            )}

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                {event.planets.map((p, i) => (
                    <span
                        key={`${p}-${i}`}
                        className={planetTailwindBg(p)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.25rem 0.55rem",
                            borderRadius: "999px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.58rem",
                            letterSpacing: "0.12em",
                            color: "var(--color-eggshell)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                        }}
                    >
                        <span aria-hidden style={{ fontFamily: "serif", fontSize: "0.85rem" }}>
                            {planetGlyph(p)}
                        </span>
                        {p}
                    </span>
                ))}
            </div>
        </div>
    );
}
