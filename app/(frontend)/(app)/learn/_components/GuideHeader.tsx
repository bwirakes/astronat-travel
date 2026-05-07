import React from "react";
import type { Lesson } from "./curriculum";

type GuideHeaderProps = {
  /** Guide record from curriculum.ts — supplies category, accent, reading time. */
  guide: Lesson;
  /** Title (first line). Serif, large. */
  title: string;
  /** Optional second word rendered italic in the accent color. */
  titleItalic?: string;
  /** One-paragraph Astro-Nat lede. Should open with reader address + stance. */
  lede: string;
};

/**
 * Header for an individual guide page. Replaces the lesson-curriculum
 * `LessonIntro`: no `02 / 10` counter, no "By the end of this lesson, you
 * will…" objectives strip, no prev/next bridge — just the editorial frame
 * a magazine guide needs. Category eyebrow + reading time on top, serif
 * title, then the lede paragraph.
 *
 *   ─────────────────────────────────────────────────────────────────────
 *   SIGNS · 7 MIN READ
 *
 *   The Zodiac
 *
 *   You've been told you're a Pisces, a Capricorn, a Sagittarius — and
 *   chances are nobody told you what the words actually mean. The zodiac
 *   is not a personality test. It is a coordinate system…
 *   ─────────────────────────────────────────────────────────────────────
 */
export function GuideHeader({
  guide,
  title,
  titleItalic,
  lede,
}: GuideHeaderProps) {
  return (
    <header className="px-6 md:px-12 lg:px-20 pt-10 md:pt-16 pb-10 md:pb-16 max-w-[1600px] mx-auto">
      <div className="max-w-3xl">
        {/* ─── Eyebrow: category · reading time ─────────────────────── */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] mb-8 md:mb-10">
          <span style={{ color: "var(--lesson-accent)" }}>
            {guide.category}
          </span>
          <span aria-hidden className="opacity-40">
            ·
          </span>
          <span className="opacity-70">{guide.readingTime} read</span>
        </div>

        {/* ─── Title ───────────────────────────────────────────────── */}
        <h1 className="font-primary text-5xl md:text-6xl lg:text-7xl leading-[1.0] tracking-tight">
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

        {/* ─── Lede ───────────────────────────────────────────────── */}
        <p className="mt-8 md:mt-10 font-body text-lg md:text-xl leading-[1.55] opacity-90">
          {lede}
        </p>
      </div>
    </header>
  );
}
