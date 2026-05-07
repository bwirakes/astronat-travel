/**
 * Barrel for lesson primitives. Pages should import from here, not from
 * individual files, so the framework's public surface stays one path.
 */

// Curriculum data
export {
  CURRICULUM,
  getLesson,
  getPrev,
  getNext,
  type Lesson,
  type LessonId,
} from "./curriculum";

// Shell
export { LessonShell } from "./LessonShell";
export { ProgressRail } from "./ProgressRail";
export { LessonDisclaimer } from "./LessonDisclaimer";

// Act 1 — Intro
export { LessonIntro } from "./LessonIntro";

// Act 2 — Teach
export { ConceptZero } from "./ConceptZero";
export { SectionHeader } from "./SectionHeader";
export { ProseSection } from "./ProseSection";
export { ConceptCard, type StructuredBody } from "./ConceptCard";
export { ConceptStack } from "./ConceptStack";
export { ElementSection } from "./ElementSection";
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
export { Plate } from "./Plate";
export { KeyStrip } from "./KeyStrip";

// Glossary infrastructure
export { Glossify, NoGloss } from "./Glossify";
export {
  GlossaryScopeProvider,
  useGlossaryScope,
} from "./glossary-scope";
export {
  GLOSSARY,
  getGlossaryEntry,
  getAllGlossaryPatterns,
  type GlossaryEntry,
} from "./glossary-data";
