"use client";

import type { Lesson } from "./curriculum";
import { CURRICULUM } from "./curriculum";

type LessonIntroProps = {
  /** Curriculum lesson — supplies number, reading time, accent. */
  lesson: Lesson;
  /** Optional category. No longer rendered in the banner; kept for callers. */
  eyebrow?: string;
  /** The lesson title. Single string, rendered as one editorial title.
   *  Optional second word for italic-accent treatment. */
  title: string;
  /** Optional italic-accent word at the end of the title (e.g. "The Zodiac" + "system"). */
  titleItalic?: string;
  /** Plain-language description. 1–2 sentences. */
  lede: string;
  /** "By the end..." bullets. 3 max. */
  objectives: string[];
};

/**
 * Act 1 — compact readings-style lesson banner.
 *
 * Mirrors the /readings deliverable header: one tight horizontal strip with
 * title on the left and a positional counter on the right, separated by thin
 * rules. Lede + objectives sit below as the page body.
 *
 *   ─────────────────────────────────────────────────────────────
 *   The Zodiac                                                02
 *   LESSON · MEASUREMENT SYSTEM · 7 MIN READ                  /09
 *   ─────────────────────────────────────────────────────────────
 *
 *   Twelve 30° slices of the sky. They are how astrologers measure
 *   where things are — and the system every other lesson uses.
 *
 *   BY THE END OF THIS LESSON
 *   ─────────────────────────────────────────────────────────────
 *   01 Read the zodiac      02 Tell signs apart      03 Place every
 *      as 360° of ecliptic     from constellations      sign in the
 *      longitude...            and know why...          3×4 grid...
 *
 * No prereq breadcrumb (orientation is carried by the lesson number alone),
 * no display-sized headline (compact serif title), no scroll cue.
 */
export function LessonIntro({
  lesson,
  title,
  titleItalic,
  lede,
  objectives,
}: LessonIntroProps) {
  const total = CURRICULUM.length;
  const numberLabel = String(lesson.number).padStart(2, "0");
  const totalLabel = `/${String(total).padStart(2, "0")}`;

  return (
    <section className="px-6 md:px-12 lg:px-20 max-w-[1600px] mx-auto">
      {/* ─── Banner ───────────────────────────────────────────────────── */}
      {/* Only a bottom rule — the page header above already owns the top edge. */}
      <div className="border-b border-[var(--surface-border)] py-4 md:py-6">
        <div className="flex items-start justify-between gap-6 md:gap-10">
          <div className="min-w-0 flex-1">
            <h1 className="font-primary text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
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
          </div>
          {/* Right-side positional counter — mirrors the readings score
              block. Big number + tiny denominator for an editorial fraction. */}
          <div className="shrink-0 flex items-baseline gap-1 font-primary leading-none">
            <span
              className="text-4xl md:text-5xl lg:text-6xl tracking-tight"
              style={{ color: "var(--lesson-accent)" }}
            >
              {numberLabel}
            </span>
            <span className="text-base md:text-lg opacity-50 font-mono">
              {totalLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Objectives strip ────────────────────────────────────────── */}
      {/* Lifted directly under the title row — the reader sees the contract
          BEFORE the lede: "here's what you'll walk away with." Each item
          links to the corresponding §N anchor in the article body so
          objectives double as a table of contents. */}
      <div
        className="mt-5 md:mt-8 border-l-2 pl-5 md:pl-6 py-5 md:py-6 pr-4 md:pr-6 rounded-r-md"
        style={{
          borderColor: "var(--lesson-accent)",
          background: "var(--lesson-accent-soft)",
        }}
      >
        <div
          className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] mb-5 md:mb-6 font-medium"
          style={{ color: "var(--lesson-accent)" }}
        >
          By the end of this lesson, you will…
        </div>
        <ol className="grid md:grid-cols-3 gap-6 md:gap-8">
          {objectives.map((o, i) => {
            const sectionId = `s${String(i + 1).padStart(2, "0")}`;
            return (
              <li key={i}>
                <a
                  href={`#${sectionId}`}
                  className="group flex gap-4 items-start no-underline"
                >
                  <span
                    aria-hidden
                    className="font-primary text-2xl md:text-3xl leading-none tracking-tight shrink-0"
                    style={{ color: "var(--lesson-accent)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-body text-base md:text-lg leading-snug pt-1 group-hover:underline underline-offset-4 decoration-1">
                    {o}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ─── Lede ─────────────────────────────────────────────────────── */}
      {/* Capped at the article column so the lede aligns with body
          paragraphs in ProseSection below. */}
      <div className="pt-8 md:pt-12 pb-6 md:pb-10 max-w-3xl">
        <p className="font-body text-lg md:text-xl leading-[1.55] opacity-90">
          {lede}
        </p>
      </div>
    </section>
  );
}
