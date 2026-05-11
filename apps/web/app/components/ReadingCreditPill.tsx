"use client";

import Link from "next/link";
import { AstroPill } from "@/app/components/ui/astro-pill";

type ReadingCreditPillProps = {
  hasSubscription: boolean;
  freeUsed: boolean;
};

/**
 * Small status pill that communicates how many readings the user can still run.
 * - Subscribed: gold "Unlimited"
 * - Free available: y2k-blue "1 free reading"
 * - Free used: ghost "0 left" + upgrade link
 */
export default function ReadingCreditPill({
  hasSubscription,
  freeUsed,
}: ReadingCreditPillProps) {
  if (hasSubscription) {
    return (
      <AstroPill variant="gold" size="sm" shape="pill">
        ♄&nbsp;&nbsp;Unlimited readings
      </AstroPill>
    );
  }

  if (!freeUsed) {
    return (
      <AstroPill variant="accent" size="sm" shape="pill">
        ✦&nbsp;&nbsp;1 free reading
      </AstroPill>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <AstroPill variant="ghost" size="sm" shape="pill">
        ♄&nbsp;&nbsp;0 readings left
      </AstroPill>
      <Link
        href="/reading/new"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.58rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-y2k-blue)",
          textDecoration: "none",
        }}
      >
        Unlock — $19.99/mo &rarr;
      </Link>
    </span>
  );
}
