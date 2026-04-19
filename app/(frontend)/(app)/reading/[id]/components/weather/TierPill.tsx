"use client";

import { TIER_PALETTE, type Tier } from "@/app/lib/geodetic-weather-types";

export function TierPill({ tier, size = "md" }: { tier: Tier; size?: "sm" | "md" | "lg" }) {
    const p = TIER_PALETTE[tier];
    const sizes = {
        sm: { padding: "0.2rem 0.55rem", font: "0.55rem" },
        md: { padding: "0.3rem 0.75rem", font: "0.65rem" },
        lg: { padding: "0.4rem 1rem", font: "0.75rem" },
    }[size];
    return (
        <span
            style={{
                display: "inline-block",
                fontFamily: "var(--font-mono)",
                fontSize: sizes.font,
                letterSpacing: "0.2em",
                padding: sizes.padding,
                background: p.bg,
                color: p.text,
                border: `1.5px solid ${p.accent}`,
                clipPath: "var(--cut-sm)",
                textTransform: "uppercase",
                fontWeight: 700,
                lineHeight: 1,
            }}
        >
            {tier}
        </span>
    );
}
