"use client";

import Link from "next/link";
import { CURRICULUM, type LessonId } from "./curriculum";

type ProgressRailProps = {
  activeId: LessonId;
};

/**
 * Slim curriculum-position indicator pinned just under the page header.
 *
 * Why this design (replacing the previous 10-segment row):
 *   On mobile, 10 equal-width segments read as random dashes — too small to
 *   carry meaning. A single track with a fill bar reads instantly as
 *   "progress through a course," and a "2 / 9" counter makes the position
 *   explicit. Lesson titles are still hover-discoverable via tick marks.
 *
 * Layout:
 *   [02 / 09]  ━━━━━━●─────────────────  (track + active marker + ticks)
 */
export function ProgressRail({ activeId }: ProgressRailProps) {
  const activeIndex = CURRICULUM.findIndex((l) => l.id === activeId);
  const total = CURRICULUM.length;
  const progressPct = total > 1 ? ((activeIndex + 0.5) / total) * 100 : 0;

  return (
    <div className="fixed top-[56px] md:top-[64px] left-0 right-0 z-30 px-4 md:px-12 lg:px-20 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto flex items-center gap-3 md:gap-4">
        {/* Counter — gives the rail meaning regardless of width */}
        <span
          className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] whitespace-nowrap shrink-0"
          style={{ color: "var(--lesson-accent)" }}
        >
          {String(activeIndex + 1).padStart(2, "0")}
          <span className="opacity-50"> / {String(total).padStart(2, "0")}</span>
        </span>

        {/* Track */}
        <div className="relative flex-1 h-[2px] rounded-full bg-[var(--surface-border)]">
          {/* Filled portion — extends to the active lesson's center */}
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${progressPct}%`,
              background: "var(--lesson-accent)",
            }}
          />
          {/* Per-lesson tick marks (clickable, hover reveals the title) */}
          {CURRICULUM.map((lesson, i) => {
            const leftPct = ((i + 0.5) / total) * 100;
            const isActive = i === activeIndex;
            const isPast = i < activeIndex;
            return (
              <Link
                key={lesson.id}
                href={lesson.href}
                aria-label={`${lesson.shortTitle} (Lesson ${lesson.number})`}
                className="group absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${leftPct}%` }}
              >
                <span
                  aria-hidden
                  className="block rounded-full transition-all"
                  style={{
                    width: isActive ? 8 : 4,
                    height: isActive ? 8 : 4,
                    background:
                      isActive || isPast
                        ? "var(--lesson-accent)"
                        : "var(--text-tertiary)",
                    opacity: isActive ? 1 : isPast ? 0.6 : 0.4,
                    boxShadow: isActive
                      ? "0 0 0 3px var(--lesson-accent-soft)"
                      : "none",
                  }}
                />
                <span
                  className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-raised)] px-2 py-1 rounded border border-[var(--surface-border)]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {lesson.shortTitle}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
