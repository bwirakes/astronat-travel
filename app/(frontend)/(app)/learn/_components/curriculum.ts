/**
 * The single source of truth for the Academy curriculum.
 * LessonShell, ProgressRail, PaginationCard, the index page, and the glossary
 * all read from this list. Reordering or renaming a lesson should require
 * changing exactly one file: this one.
 */

export type LessonId =
  | "start"
  | "viewing-the-stars"
  | "zodiac"
  | "constellations"
  | "natal-chart"
  | "houses"
  | "aspects"
  | "malefic-benefic"
  | "astrocartography"
  | "geodetic-astrology";

export type ModuleId = "module-0" | "module-1" | "module-2" | "module-3";

export type Lesson = {
  id: LessonId;
  module: ModuleId;
  /** 0 for Module 0 (Start Here); otherwise 1..9 across the curriculum. */
  number: number;
  /** Two-line lesson title; framework treats lines as separate <span>s. */
  title: [string, string] | [string];
  /** Short label used in chips and pagination. */
  shortTitle: string;
  href: string;
  /** Single-sentence "what this lesson is about" — used in pagination bridges. */
  bridge: string;
  /** CSS variable name for the topic accent. */
  accent: string;
  readingTime: string;
};

export const MODULES: { id: ModuleId; label: string; title: string }[] = [
  { id: "module-0", label: "Module 0", title: "Start Here" },
  { id: "module-1", label: "Module 1", title: "Foundations" },
  { id: "module-2", label: "Module 2", title: "The Natal Chart" },
  { id: "module-3", label: "Module 3", title: "Place & World" },
];

export const CURRICULUM: Lesson[] = [
  {
    id: "start",
    module: "module-0",
    number: 0,
    title: ["Start", "Here"],
    shortTitle: "Start Here",
    href: "/learn/start",
    bridge:
      "What astrology is, what it isn't, and how to read this Academy.",
    accent: "var(--text-primary)",
    readingTime: "4 min",
  },
  {
    id: "viewing-the-stars",
    module: "module-1",
    number: 1,
    title: ["Viewing", "The Stars"],
    shortTitle: "Viewing the Stars",
    href: "/learn/viewing-the-stars",
    bridge:
      "Begin with what's overhead. The astronomy under every astrological claim.",
    accent: "var(--gold)",
    readingTime: "6 min",
  },
  {
    id: "zodiac",
    module: "module-1",
    number: 2,
    title: ["The", "Zodiac"],
    shortTitle: "The Zodiac",
    href: "/learn/zodiac",
    bridge:
      "Twelve 30° slices of ecliptic longitude — the system astrologers measure with.",
    accent: "var(--color-y2k-blue)",
    readingTime: "7 min",
  },
  {
    id: "constellations",
    module: "module-1",
    number: 3,
    title: ["The", "Constellations"],
    shortTitle: "Constellations",
    href: "/learn/constellations",
    bridge:
      "The actual star patterns behind the signs — and why they aren't the same thing anymore.",
    accent: "var(--gold)",
    readingTime: "6 min",
  },
  {
    id: "natal-chart",
    module: "module-2",
    number: 4,
    title: ["The Natal", "Chart"],
    shortTitle: "Natal Chart",
    href: "/learn/natal-chart",
    bridge:
      "Your snapshot of the sky at the moment of birth, read from the spot you were born.",
    accent: "var(--color-y2k-blue)",
    readingTime: "9 min",
  },
  {
    id: "houses",
    module: "module-2",
    number: 5,
    title: ["The 12", "Houses"],
    shortTitle: "Houses",
    href: "/learn/houses",
    bridge:
      "Twelve sectors of the sky that say where each planet's themes show up in your life.",
    accent: "var(--sage)",
    readingTime: "8 min",
  },
  {
    id: "aspects",
    module: "module-2",
    number: 6,
    title: ["Planetary", "Aspects"],
    shortTitle: "Aspects",
    href: "/learn/aspects",
    bridge:
      "How planets talk to each other across the chart — the geometry of conversation.",
    accent: "var(--color-acqua)",
    readingTime: "7 min",
  },
  {
    id: "malefic-benefic",
    module: "module-2",
    number: 7,
    title: ["Benefics &", "Malefics"],
    shortTitle: "Benefics & Malefics",
    href: "/learn/malefic-benefic",
    bridge:
      "The Hellenistic split: which planets were considered favorable, which difficult, and why both are needed.",
    accent: "var(--color-spiced-life)",
    readingTime: "7 min",
  },
  {
    id: "astrocartography",
    module: "module-3",
    number: 8,
    title: ["Astro", "Cartography"],
    shortTitle: "Astrocartography",
    href: "/learn/astrocartography",
    bridge:
      "Your chart relocated across Earth — where each planet's themes intensify.",
    accent: "var(--color-acqua)",
    readingTime: "8 min",
  },
  {
    id: "geodetic-astrology",
    module: "module-3",
    number: 9,
    title: ["Geodetic", "Astrology"],
    shortTitle: "Geodetic",
    href: "/learn/geodetic-astrology",
    bridge:
      "The chart of the Earth itself — longitude bands that color cities and regions.",
    accent: "var(--color-spiced-life)",
    readingTime: "7 min",
  },
];

export function getLesson(id: LessonId): Lesson {
  const lesson = CURRICULUM.find((l) => l.id === id);
  if (!lesson) throw new Error(`Unknown lesson id: ${id}`);
  return lesson;
}

export function getModule(id: ModuleId) {
  const m = MODULES.find((mod) => mod.id === id);
  if (!m) throw new Error(`Unknown module id: ${id}`);
  return m;
}

/** Lesson immediately preceding `id` in curriculum order, or null at the start. */
export function getPrev(id: LessonId): Lesson | null {
  const i = CURRICULUM.findIndex((l) => l.id === id);
  return i > 0 ? CURRICULUM[i - 1] : null;
}

/** Lesson immediately following `id` in curriculum order, or null at the end. */
export function getNext(id: LessonId): Lesson | null {
  const i = CURRICULUM.findIndex((l) => l.id === id);
  return i >= 0 && i < CURRICULUM.length - 1 ? CURRICULUM[i + 1] : null;
}
