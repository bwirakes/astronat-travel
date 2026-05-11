import React from "react";
import type { Lesson } from "./curriculum";

type GuideHeaderProps = {
  /** Guide record from curriculum.ts — supplies category, accent, reading time. */
  guide: Lesson;
  /** Title (first line). Serif, large. */
  title: string;
  /** Optional second word rendered italic in the accent color. */
  titleItalic?: string;
  /** One-paragraph Astro-Nat lede / standfirst. */
  lede: string;
  /** Optional byline. Merged into the kicker rule on md+, falls under lede on mobile. */
  byline?: string;
};

/**
 * Single-column article masthead. All elements — kicker rule, title, lede,
 * closing hairline — sit inside a `max-w-[990px]` block left-anchored under the
 * page chrome. The wide right margin is intentional editorial whitespace,
 * not a column to fill.
 *
 *   ── SIGNS · BY ASTRO-NAT · ASTROCARTOGRAPHER ───── 7 MIN READ ──
 *
 *   The Zodiac
 *
 *   You've been told you're a Pisces, a Capricorn, a Sagittarius —
 *   and chances are nobody told you what the words actually mean…
 *   ──────────────────────────────────────────────────────────────
 */
export function GuideHeader({
  guide,
  title,
  titleItalic,
  lede,
  byline,
}: GuideHeaderProps) {
  return (
    <header className="px-6 md:px-12 lg:px-20 pt-3 md:pt-5 max-w-[1600px] mx-auto">
      <div className="max-w-[990px]">
        {/* ─── Top rule: kicker · byline (md+) · reading time ────────── */}
        <div
          className="flex items-baseline justify-between gap-4 pb-2.5 md:pb-3 border-b"
          style={{ borderColor: "var(--lesson-accent)" }}
        >
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] truncate">
            <span className="font-medium" style={{ color: "var(--lesson-accent)" }}>
              {guide.category}
            </span>
            {byline && (
              <span className="opacity-70 hidden md:inline"> · {byline}</span>
            )}
          </span>
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] opacity-60 shrink-0">
            {guide.readingTime} read
          </span>
        </div>

        {/* ─── Title + standfirst ─────────────────────────────────────── */}
        <div className="mt-4 md:mt-6 pb-5 md:pb-7 border-b border-[var(--surface-border)]">
          <h1 className="font-primary text-[clamp(2.5rem,4.5vw,4.5rem)] leading-[0.98] tracking-tight">
            {title}
            {titleItalic && (
              <>
                {" "}
                <span
                  className="italic"
                  style={{ color: "var(--lesson-accent)" }}
                >
                  {titleItalic}
                </span>
              </>
            )}
          </h1>
          <p className="mt-6 md:mt-8 font-body text-lg md:text-xl leading-[1.45] opacity-90">
            {lede}
          </p>
          {byline && (
            <p className="md:hidden mt-3 font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
              {byline}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
