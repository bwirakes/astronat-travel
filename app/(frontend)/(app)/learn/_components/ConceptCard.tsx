import React from "react";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import { TraditionChip, type Tradition } from "./TraditionChip";

type Tone = "neutral" | "positive" | "warning";

type Meta = {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
};

type ConceptCardProps = {
  /** Optional small symbolic anchor — a planet glyph, sign symbol, etc. */
  badge?: React.ReactNode;
  /** 1–2 word category, e.g. "Identity", "Cardinal Fire". */
  kicker?: string;
  /** The card's main title — the name of the concept. */
  title: string;
  /** Up to ~4 short metadata pairs rendered as a flat strip beneath the title. */
  meta?: Meta[];
  /** Body content. Supports inline primitives (GlossaryTerm, SourceLine, etc.). */
  children: React.ReactNode;
  /** Tradition chip shown at top-right of the card. */
  tradition?: Tradition;
  /** Large faded character/glyph rendered behind the card content. */
  watermark?: React.ReactNode;
  /** Index in a stack — used by ConceptStack to alternate left/right + numbering. */
  index?: number;
};

const toneClass: Record<Tone, string> = {
  neutral: "opacity-70",
  positive: "text-[var(--sage)] opacity-90",
  warning: "text-[var(--color-spiced-life)] opacity-90",
};

/**
 * The single canonical "teach one concept" card. Used everywhere in Act 2
 * for any per-item walkthrough: planets, signs, houses, aspects, zones, lines.
 *
 * Keep the API narrow — ConceptCard should never grow special cases.
 * If a lesson needs something more, build a new shared block alongside.
 */
export function ConceptCard({
  badge,
  kicker,
  title,
  meta,
  children,
  tradition,
  watermark,
  index,
}: ConceptCardProps) {
  return (
    <AstronatCard
      variant="charcoal"
      shape="cut-md"
      className="relative p-8 md:p-12 max-w-2xl overflow-hidden"
    >
      {watermark && (
        <span
          aria-hidden
          className="absolute -bottom-12 -right-8 font-primary text-[16rem] leading-none opacity-[0.04] pointer-events-none select-none"
          style={{ color: "var(--lesson-accent)" }}
        >
          {watermark}
        </span>
      )}

      <div className="relative">
        {/* Top strip: index + tradition */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            {typeof index === "number" && (
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-50">
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
            {kicker && (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "var(--lesson-accent)" }}
              >
                {kicker}
              </span>
            )}
          </div>
          {tradition && <TraditionChip tradition={tradition} />}
        </div>

        {/* Title row: badge + title */}
        <div className="flex items-center gap-5 mb-6">
          {badge && (
            <div
              className="shrink-0 w-14 h-14 rounded-full border flex items-center justify-center"
              style={{
                borderColor: "var(--lesson-accent)",
                background: "var(--lesson-accent-soft)",
                color: "var(--lesson-accent)",
              }}
            >
              {badge}
            </div>
          )}
          <h3 className="font-primary text-3xl md:text-5xl leading-[0.9] tracking-tight uppercase">
            {title}
          </h3>
        </div>

        {/* Meta strip */}
        {meta && meta.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 pb-6 border-b border-white/10">
            {meta.map((m, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-50">
                  {m.label}
                </span>
                <span
                  className={`font-body text-sm ${toneClass[m.tone ?? "neutral"]}`}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="font-body text-base md:text-lg leading-relaxed opacity-85 space-y-4">
          {children}
        </div>
      </div>
    </AstronatCard>
  );
}
