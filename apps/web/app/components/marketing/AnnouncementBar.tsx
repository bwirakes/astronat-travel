"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface AnnouncementBarProps {
  messages?: { text: string; cta?: string; ctaHref?: string }[];
}

export default function AnnouncementBar({
  messages = [
    {
      text: "✦ FOUNDER'S CLUB: Only 13 of 100 lifetime spots remaining.",
      cta: "Secure yours →",
      ctaHref: "/flow",
    },
    {
      text: "🌍 Start free — get your first city reading, no credit card needed.",
      cta: "Begin now →",
      ctaHref: "/flow",
    },
  ],
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const [activeIdx] = useState(0);

  if (dismissed) return null;

  const msg = messages[activeIdx % messages.length];

  return (
    <div
      className="w-full flex items-center justify-center gap-3 px-6 py-2.5 text-center"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1001,
        backgroundColor: "var(--color-charcoal)",
        color: "var(--color-eggshell)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Subtle animated gradient dot */}
      <span
        className="hidden sm:inline-block w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: "var(--color-acqua)" }}
        aria-hidden="true"
      />

      <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
        {msg.text}
      </span>

      {msg.cta && msg.ctaHref && (
        <Link
          href={msg.ctaHref}
          className="font-mono text-[10px] uppercase tracking-[0.18em] underline underline-offset-2 hover:opacity-100 opacity-60 transition-opacity whitespace-nowrap"
          style={{ color: "var(--color-acqua)" }}
        >
          {msg.cta}
        </Link>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X size={12} />
      </button>
    </div>
  );
}
