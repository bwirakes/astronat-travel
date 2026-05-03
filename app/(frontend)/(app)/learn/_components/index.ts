/**
 * Barrel for lesson primitives. Pages should import from here, not from
 * individual files, so the framework's public surface stays one path.
 */

// Curriculum data
export {
  CURRICULUM,
  MODULES,
  getLesson,
  getModule,
  getPrev,
  getNext,
  type Lesson,
  type LessonId,
  type ModuleId,
} from "./curriculum";

// Shell
export { LessonShell } from "./LessonShell";
export { LessonChip } from "./LessonChip";
export { ProgressRail } from "./ProgressRail";
export { LessonDisclaimer } from "./LessonDisclaimer";

// Act 1 — Intro
export { LessonIntro } from "./LessonIntro";

// Act 2 — Teach
export { ConceptZero } from "./ConceptZero";
export { ConceptCard } from "./ConceptCard";
export { ConceptStack } from "./ConceptStack";
export { Recap } from "./Recap";

// Act 3 — Next
export { SourcesPanel } from "./SourcesPanel";
export { PaginationCard } from "./PaginationCard";

// Inline reading primitives
export { GlossaryTerm } from "./GlossaryTerm";
export { TraditionChip, type Tradition } from "./TraditionChip";
export { SourceLine } from "./SourceLine";
export { Aside } from "./Aside";
export { DiagramFigure } from "./DiagramFigure";
