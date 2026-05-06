import { getModule, type Lesson } from "./curriculum";

type LessonChipProps = {
  lesson: Lesson;
};

/**
 * The orientation chip pinned at the top of every lesson, just below the
 * ProgressRail. Tells the reader, in 5 seconds, where they are.
 *
 *   Module 2 · Lesson 4 · 9 min read
 */
export function LessonChip({ lesson }: LessonChipProps) {
  const mod = getModule(lesson.module);
  const isStart = lesson.number === 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="inline-flex items-center gap-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] opacity-70">
        <span style={{ color: "var(--lesson-accent)" }}>{mod.label}</span>
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <span>
          {isStart ? "Orientation" : `Lesson ${lesson.number}`}
        </span>
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <span>{lesson.readingTime} read</span>
      </div>
    </div>
  );
}
