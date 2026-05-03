"use client";

import React from "react";
import { PageHeader } from "@/components/app/page-header-context";
import { ProgressRail } from "./ProgressRail";
import { LessonChip } from "./LessonChip";
import { LessonDisclaimer } from "./LessonDisclaimer";
import type { LessonId } from "./curriculum";
import { getLesson } from "./curriculum";

type LessonShellProps = {
  /** Curriculum-defined lesson id; pulls metadata from CURRICULUM. */
  lessonId: LessonId;
  children: React.ReactNode;
};

/**
 * The outer frame every /learn/* page renders inside. Owns:
 *  - The shared PageHeader registration.
 *  - The 9-segment ProgressRail at the top.
 *  - The LessonChip (Module N · Lesson N · reading time).
 *  - The --lesson-accent CSS var that propagates to every child.
 *  - The standing disclaimer footer.
 *
 * Per the UI framework: this is the only component allowed to set chrome.
 * Pages should never render their own header, footer, or accent.
 */
export function LessonShell({ lessonId, children }: LessonShellProps) {
  const lesson = getLesson(lessonId);

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-body overflow-x-hidden transition-colors duration-300"
      style={{
        ["--lesson-accent" as string]: lesson.accent,
      }}
    >
      <PageHeader title="Academy" backTo="/learn" backLabel="Academy" />
      <ProgressRail activeId={lessonId} />
      <div className="px-6 md:px-12 lg:px-20 pt-32 md:pt-36">
        <LessonChip lesson={lesson} />
      </div>
      <main>{children}</main>
      <LessonDisclaimer />
    </div>
  );
}
