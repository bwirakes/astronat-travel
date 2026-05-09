/**
 * Barrel for learn primitives. Pages should import from here, not from
 * individual files, so the framework's public surface stays one path.
 */

// Curriculum data
export {
  CURRICULUM,
  getLesson,
  getShelf,
  getStartHereList,
  getGuides,
  getPrev,
  getNext,
  type Lesson,
  type LessonId,
  type GuideShelf,
} from "./curriculum";

// Shell
export { LessonShell } from "./LessonShell";
export { ProgressRail } from "./ProgressRail";
export { LessonDisclaimer } from "./LessonDisclaimer";

// Guide-shaped primitives (the new direction — magazine guides, not lessons)
export { GuideHeader } from "./GuideHeader";
export { EditorialButton, type EditorialButtonVariant } from "@/app/components/EditorialButton";
export { PullQuote } from "./PullQuote";
export { RelatedGuides } from "./RelatedGuides";

// Body / teaching primitives — used by both shapes
export { ConceptZero } from "./ConceptZero";
export { SectionHeader } from "./SectionHeader";
export { ProseSection } from "./ProseSection";
export { ConceptCard, type StructuredBody } from "./ConceptCard";
export { ConceptStack } from "./ConceptStack";
export { ElementSection } from "./ElementSection";

// Act 3 — Next
export { SourcesPanel } from "./SourcesPanel";

// Inline reading primitives
export { GlossaryTerm } from "./GlossaryTerm";
export { TraditionChip, type Tradition } from "./TraditionChip";
export { SourceLine } from "./SourceLine";
export { Aside } from "./Aside";
export { DiagramFigure } from "./DiagramFigure";
export { Plate } from "./Plate";
export { KeyStrip } from "./KeyStrip";
export { NatalWheel } from "./NatalWheel";

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
