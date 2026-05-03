"use client";

import Link from "next/link";
import { CURRICULUM, type LessonId } from "./curriculum";

type ProgressRailProps = {
  activeId: LessonId;
};

/**
 * Slim 10-segment rail across the very top of every lesson page.
 * Segment for the active lesson is filled with var(--lesson-accent);
 * upstream lessons are at 60% opacity (read), downstream are 15% (unread).
 * Hover any segment to peek the lesson title.
 *
 * Keeping this purely visual (no scroll progress) — it indicates curriculum
 * position, not within-page scroll. The job is "where am I in the course?"
 */
export function ProgressRail({ activeId }: ProgressRailProps) {
  const activeIndex = CURRICULUM.findIndex((l) => l.id === activeId);

  return (
    <div className="fixed top-[64px] md:top-[72px] left-0 right-0 z-30 px-6 md:px-12 lg:px-20 pointer-events-none">
      <div className="flex gap-1 max-w-7xl mx-auto pointer-events-auto">
        {CURRICULUM.map((lesson, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <Link
              key={lesson.id}
              href={lesson.href}
              aria-label={`${lesson.shortTitle} (Lesson ${lesson.number})`}
              className="group flex-1 h-1 relative"
            >
              <div
                className="h-full w-full rounded-full transition-all duration-300"
                style={{
                  background: isActive
                    ? "var(--lesson-accent)"
                    : isPast
                    ? "var(--text-secondary)"
                    : "var(--surface-border)",
                  opacity: isActive ? 1 : isPast ? 0.6 : 1,
                  transform: isActive ? "scaleY(1.6)" : "scaleY(1)",
                }}
              />
              <span
                className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-secondary)" }}
              >
                {lesson.shortTitle}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
