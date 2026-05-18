"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { RankedEvent, ImpactBadge } from "@/app/lib/universal-sky-rank";
import type { TemplatedCard } from "@/app/lib/universal-sky-templates";

interface Props {
    event: RankedEvent;
    card: TemplatedCard;
}

const FB = "var(--font-body)";
const FM = "var(--font-mono)";

const EYEBROW_BY_KIND: Record<RankedEvent["kind"], string> = {
    retrograde: "RETROGRADE",
    "retrograde-upcoming": "RETROGRADE COMING",
    eclipse: "ECLIPSE WINDOW",
    aspect: "BIG SKY ASPECT",
    "node-aspect": "NODE PRESSURE",
    ingress: "INGRESS",
};

const BADGE_LABEL: Record<ImpactBadge, string> = {
    supportive: "✓ supportive",
    tense: "⚠ tense",
    neutral: "· neutral",
};

function badgeStyle(badge: ImpactBadge): React.CSSProperties {
    // Use longhand border properties so per-variant `borderColor` overrides
    // don't clash with the shorthand `border` (React warning otherwise).
    const base: React.CSSProperties = {
        fontFamily: FM,
        fontSize: "0.58rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: 700,
        padding: "0.18rem 0.55rem",
        borderRadius: "999px",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--surface-border)",
        display: "inline-block",
    };
    if (badge === "supportive") {
        return {
            ...base,
            color: "var(--lift-accent)",
            background: "var(--lift-accent-soft)",
            borderColor: "color-mix(in oklab, var(--lift-accent) 60%, var(--surface-border))",
        };
    }
    if (badge === "tense") {
        return {
            ...base,
            color: "var(--color-spiced-life, #c66)",
            background: "color-mix(in oklab, var(--color-spiced-life, #c66) 8%, transparent)",
            borderColor: "color-mix(in oklab, var(--color-spiced-life, #c66) 35%, var(--surface-border))",
        };
    }
    return { ...base, color: "var(--text-tertiary)" };
}

const EYEBROW: React.CSSProperties = {
    fontFamily: FM,
    fontSize: "0.55rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "var(--text-tertiary)",
    fontWeight: 700,
    marginBottom: "0.55rem",
};

const TITLE: React.CSSProperties = {
    fontFamily: FB,
    fontSize: "1.1rem",
    fontWeight: 500,
    lineHeight: 1.25,
    color: "var(--text-primary)",
    margin: 0,
};

const DATE_RANGE: React.CSSProperties = {
    fontFamily: FM,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
    color: "var(--text-tertiary)",
    marginTop: "0.35rem",
    marginBottom: "0.85rem",
};

const PLAIN_BODY: React.CSSProperties = {
    fontFamily: FB,
    fontSize: "0.92rem",
    lineHeight: 1.55,
    color: "var(--text-secondary)",
    margin: "0 0 0.85rem 0",
};

const GOAL_ACTION: React.CSSProperties = {
    fontFamily: FB,
    fontSize: "0.88rem",
    lineHeight: 1.5,
    color: "var(--text-primary)",
    fontWeight: 500,
    fontStyle: "italic",
    paddingLeft: "0.65rem",
    borderLeft: "2px solid var(--surface-border)",
    margin: "0 0 0.95rem 0",
};

const CARD: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    borderRadius: "var(--radius-md)",
    padding: "1.15rem 1.2rem 1rem",
    display: "flex",
    flexDirection: "column",
};

export default function SkyKpiCard({ event, card }: Props) {
    return (
        <div style={CARD}>
            <p style={EYEBROW}>{EYEBROW_BY_KIND[event.kind]}</p>
            <h4 style={TITLE}>{card.title}</h4>
            <p style={DATE_RANGE}>{event.dateRange}</p>
            <p style={PLAIN_BODY}>{card.plainBody}</p>
            {card.goalAction && <p style={GOAL_ACTION}>{card.goalAction}</p>}
            <div style={{ marginTop: "auto" }}>
                <span style={badgeStyle(card.impactBadge)}>
                    {BADGE_LABEL[card.impactBadge]}
                </span>
            </div>
        </div>
    );
}
