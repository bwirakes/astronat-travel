"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";

type Prereq = { label: string; href: string };

type LessonIntroProps = {
  /** Short, 2–3 word category label for the eyebrow chip. */
  eyebrow: string;
  /** Two-line headline. The framework places one word/phrase per line. */
  title: [string] | [string, string];
  /** Index (0-based) of the line that should be italicized in the accent color. */
  italicLine?: number;
  /** Plain-language description of what the lesson is about. 1–2 sentences. */
  lede: string;
  /** "By the end you will know..." bullets. 3 max. */
  objectives: string[];
  /** Lessons the reader is expected to have completed first. 0–2. */
  prereqs?: Prereq[];
  /** Show the bouncing "Scroll to begin" cue. Default true. */
  scrollCue?: boolean;
};

/**
 * Act 1 of the 3-Act lesson template. Every lesson opens with this exact block.
 *
 * Structure (top→bottom):
 *   Eyebrow chip   — color-coded to the topic accent
 *   Headline (h1)  — display-lg type
 *   Lede           — plain-language sentence in body voice
 *   Objectives     — "By the end..." bullets
 *   Prereqs        — links to required prior lessons (optional)
 *   Scroll cue     — bouncing arrow into the teaching body (optional)
 *
 * No bespoke per-page chrome here. If a page wants a hero image or extra
 * decoration, it does it inside the teaching artifact, not the intro.
 */
export function LessonIntro({
  eyebrow,
  title,
  italicLine = 1,
  lede,
  objectives,
  prereqs,
  scrollCue = true,
}: LessonIntroProps) {
  return (
    <section className="px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-24 md:pb-32 max-w-7xl mx-auto">
      <div className="max-w-3xl">
        {/* Eyebrow */}
        <div
          className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] px-4 py-1.5 border rounded-full mb-10"
          style={{
            color: "var(--lesson-accent)",
            borderColor: "var(--lesson-accent)",
            background: "var(--lesson-accent-soft)",
          }}
        >
          {eyebrow}
        </div>

        {/* Headline */}
        <h1 className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-10">
          {title.map((line, i) => (
            <span key={i} className="block">
              {i === italicLine ? (
                <span
                  className="italic lowercase"
                  style={{ color: "var(--lesson-accent)" }}
                >
                  {line}.
                </span>
              ) : (
                line
              )}
            </span>
          ))}
        </h1>

        {/* Lede */}
        <p className="font-body text-lg md:text-xl leading-relaxed opacity-80 max-w-2xl mb-12">
          {lede}
        </p>

        {/* Objectives */}
        <div className="border-t border-[var(--surface-border)] pt-8 max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-60 mb-4">
            By the end of this lesson
          </div>
          <ul className="space-y-3">
            {objectives.map((o, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span
                  aria-hidden
                  className="font-mono text-[10px] mt-1.5 opacity-50"
                  style={{ color: "var(--lesson-accent)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-body text-base md:text-lg leading-relaxed">
                  {o}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prereqs */}
        {prereqs && prereqs.length > 0 && (
          <div className="mt-8 max-w-2xl flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-50">
              Assumes you&apos;ve read
            </span>
            {prereqs.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-[var(--surface-border)] hover:border-[var(--lesson-accent)] transition-colors"
              >
                {p.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Scroll cue */}
      {scrollCue && (
        <div className="flex justify-center mt-20 md:mt-28">
          <div className="flex flex-col items-center gap-3 opacity-50 animate-bounce">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em]">
              Begin
            </span>
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>
      )}
    </section>
  );
}
