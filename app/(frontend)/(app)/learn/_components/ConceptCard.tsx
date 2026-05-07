import React from "react";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import { TraditionChip, type Tradition } from "./TraditionChip";
import { Glossify } from "./Glossify";

type Meta = {
  label: string;
  /** Plain string or ReactNode (e.g. wrapped in <GlossaryTerm>). */
  value: React.ReactNode;
};

/**
 * The canonical 4-section body, lifted from teacher-reading.ts BLOCK_EDITOR_ROLE.
 */
export type StructuredBody = {
  tldr: React.ReactNode;
  whyMatters: React.ReactNode;
  receipt: React.ReactNode;
  life: React.ReactNode;
};

type ConceptCardProps = {
  /** Symbolic anchor next to the title — small, no bordered circle. */
  badge?: React.ReactNode;
  /** Card's main title — the name of the concept. */
  title: string;
  /** Quiet biographical line under the title (e.g. dates). No label. */
  subtitle?: string;
  /** Free-form kicker shown to the right of the index. Optional; rarely needed
   *  now that meta lives in the bottom credit strip. */
  kicker?: React.ReactNode;
  /**
   * Bottom-of-card credit strip. Up to 4 label + value pairs, separated by
   * vertical rules. Eyebrow-mono labels, serif values. No tone colors.
   */
  meta?: Meta[];
  /** Structured 4-section body (TL;DR / Why / Receipt / Life). */
  body?: StructuredBody;
  /** Free-form body. Use for cross-cutting cards (Module 0). */
  children?: React.ReactNode;
  /** Tradition byline shown top-right. */
  tradition?: Tradition;
  /** Big watermark glyph that bleeds to the lower-right corner. */
  watermark?: React.ReactNode;
  /** Index in a stack — auto-injected by ConceptStack. */
  index?: number;
  /** Skip auto-glossifying body content. */
  noGlossify?: boolean;
};

/**
 * Monocle-style concept card. The card carries:
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  06                                          · Hellenistic       │  byline row
 *   │                                                                  │
 *   │  ⌬  V I R G O                                                    │  title row
 *   │                                                                  │
 *   │  August 23 — September 22                                        │  subtitle (quiet)
 *   │                                                                  │
 *   │  Body prose...                                                   │
 *   │                                                                  │
 *   │  ──────────────────────────────────────────────────────────      │
 *   │  ELEMENT  │  MODALITY  │  GIFT          │  SHADOW                │  credit strip
 *   │  Earth    │  Mutable   │  Lasting craft │  Perfectionism         │  (label + value)
 *   │                                            ╔════ huge watermark ═│
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Body sections are auto-wrapped in <Glossify> by default.
 */
export function ConceptCard({
  badge,
  title,
  subtitle,
  kicker,
  meta,
  body,
  children,
  tradition,
  watermark,
  index,
  noGlossify = false,
}: ConceptCardProps) {
  return (
    <AstronatCard
      variant="surface"
      shape="cut-md"
      className="relative p-6 md:p-8 max-w-2xl overflow-hidden"
    >
      {/* Watermark — bleeds to the lower-right corner, very faint */}
      {watermark && (
        <span
          aria-hidden
          className="absolute -bottom-16 -right-12 md:-bottom-20 md:-right-16 pointer-events-none select-none opacity-[0.05]"
          style={{ color: "var(--lesson-accent)" }}
        >
          {watermark}
        </span>
      )}

      <div className="relative">
        {/* ─── Byline row: index + tradition (only when populated) ────── */}
        {(typeof index === "number" || kicker || tradition) && (
          <div className="flex items-center justify-between mb-5 md:mb-6 gap-4">
            <div className="flex items-center gap-4">
              {typeof index === "number" && (
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-50">
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}
              {kicker && (
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
                  {kicker}
                </span>
              )}
            </div>
            {tradition && <TraditionChip tradition={tradition} />}
          </div>
        )}

        {/* ─── Title row: small inline badge + serif title ────────────── */}
        <div className="flex items-baseline gap-4 mb-2">
          {badge && (
            <span
              className="shrink-0 inline-flex items-baseline"
              style={{ color: "var(--lesson-accent)" }}
            >
              {badge}
            </span>
          )}
          <h3 className="font-primary text-2xl md:text-3xl leading-[1] tracking-tight">
            {title}
          </h3>
        </div>

        {/* ─── Subtitle (quiet biographical line) ─────────────────────── */}
        {subtitle && (
          <div className="font-body text-xs md:text-sm opacity-60 mb-5 md:mb-6">
            {subtitle}
          </div>
        )}

        {/* ─── Credit strip — sits high, right under the title block ──── */}
        {/* Reads as a header for what follows: ELEMENT, MODALITY, etc. as
            the technical card-front before the prose. */}
        {meta && meta.length > 0 && (
          <div className="pt-5 pb-6 md:pb-8 border-t border-[var(--surface-border)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 divide-x divide-[var(--surface-border)]">
              {meta.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${i === 0 ? "" : "pl-4 md:pl-5"}`}
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-50">
                    {m.label}
                  </span>
                  <span className="font-primary text-sm md:text-base italic leading-tight">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Body ───────────────────────────────────────────────────── */}
        <div className={meta && meta.length > 0 ? "pt-2 border-t border-[var(--surface-border)]" : subtitle ? "" : "mt-8"}>
          <div className={meta && meta.length > 0 ? "pt-6 md:pt-8" : ""}>
            {body ? (
              <StructuredBodyView body={body} noGlossify={noGlossify} />
            ) : (
              <div className="font-body text-sm md:text-base leading-[1.6] opacity-90 space-y-3">
                {noGlossify ? children : <Glossify>{children}</Glossify>}
              </div>
            )}
          </div>
        </div>
      </div>
    </AstronatCard>
  );
}

/**
 * Renders the four canonical body sections with consistent visual hierarchy:
 *   - TL;DR    → loud, accent left bar (the punch)
 *   - Why      → standard body, full opacity (the hook)
 *   - Receipt  → recessed, slightly muted (the evidence)
 *   - Life     → accent-tinted "Try this" block (the practice)
 */
function StructuredBodyView({
  body,
  noGlossify,
}: {
  body: StructuredBody;
  noGlossify: boolean;
}) {
  const wrap = (node: React.ReactNode) =>
    noGlossify ? node : <Glossify>{node}</Glossify>;

  return (
    <div className="space-y-8">
      <div
        className="border-l-2 pl-5"
        style={{ borderColor: "var(--lesson-accent)" }}
      >
        <div
          className="font-mono text-[9px] uppercase tracking-[0.3em] mb-2 opacity-70"
          style={{ color: "var(--lesson-accent)" }}
        >
          TL;DR
        </div>
        <p className="font-primary text-lg md:text-xl leading-snug tracking-tight">
          {wrap(body.tldr)}
        </p>
      </div>

      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-3 opacity-50">
          Why this matters
        </div>
        <div className="font-body text-sm md:text-base leading-[1.6] opacity-90 space-y-3">
          {wrap(body.whyMatters)}
        </div>
      </div>

      <div className="border-t border-[var(--surface-border)] pt-6">
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-3 opacity-50">
          The receipt
        </div>
        <div className="font-body text-xs md:text-sm leading-[1.6] opacity-75 space-y-2">
          {wrap(body.receipt)}
        </div>
      </div>

      <div
        className="rounded-md p-5"
        style={{
          background: "var(--lesson-accent-soft)",
          borderLeft: "2px solid var(--lesson-accent)",
        }}
      >
        <div
          className="font-mono text-[9px] uppercase tracking-[0.3em] mb-3"
          style={{ color: "var(--lesson-accent)" }}
        >
          How this hits your life
        </div>
        <div className="font-body text-sm leading-[1.6] opacity-95 space-y-2">
          {wrap(body.life)}
        </div>
      </div>
    </div>
  );
}
