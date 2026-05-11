"use client";

import React from "react";
import { PageHeader } from "@/components/app/page-header-context";
import { LessonDisclaimer } from "./LessonDisclaimer";
import { GlossaryScopeProvider } from "./glossary-scope";
import type { LessonId } from "./curriculum";
import { getLesson } from "./curriculum";

// LessonChip and ProgressRail have been moved out of the shell:
//   - LessonChip is now part of LessonIntro's meta strip, so it shares the
//     same horizontal rhythm as the rest of the intro instead of floating
//     above it as an orphan row.
//   - ProgressRail removed entirely — too visually busy. Both components
//     still exist in this folder if we want to bring them back later.

type LessonShellProps = {
  /** Curriculum-defined lesson id; pulls metadata from CURRICULUM. */
  lessonId: LessonId;
  children: React.ReactNode;
};

/**
 * The outer frame every /learn/* page renders inside. Minimal — owns:
 *  - The shared PageHeader registration.
 *  - The --lesson-accent CSS var that propagates to every child.
 *  - The glossary scope (so <Glossify> can dedupe per-page).
 *  - The standing disclaimer footer.
 *
 * Page-level chrome (lesson chip, prereqs, eyebrow) lives inside LessonIntro
 * so it shares the editorial grid of the rest of the intro.
 */
export function LessonShell({ lessonId, children }: LessonShellProps) {
  const lesson = getLesson(lessonId);

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-body overflow-x-hidden transition-colors duration-300 pb-28 md:pb-12"
      style={{
        ["--lesson-accent" as string]: lesson.accent,
      }}
    >
      <PageHeader title="Academy" backTo="/learn" backLabel="Academy" />
      {/* Just enough to clear the fixed page header (~56–64px). The intro's
          banner sits flush below it. */}
      <div className="pt-4 md:pt-6">
        <GlossaryScopeProvider>
          <main>{children}</main>
        </GlossaryScopeProvider>
      </div>
      <LessonDisclaimer />
    </div>
  );
}
