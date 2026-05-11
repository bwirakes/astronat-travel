/**
 * Single source of truth for the Learn hub.
 *
 * The hub is shaped after Chani's astro-hub: not a numbered curriculum but a
 * **library of guides** organised on two shelves (`101` foundations and
 * `guide` techniques) plus a **welcome letter** (`start`) sitting above. A
 * curated `startHereOrder` field carves out a recommended reading list for
 * first-time readers — a subset of the 101 shelf — without forcing anyone
 * into a sequence.
 *
 * The legacy `number` / `bridge` fields are retained so existing legacy
 * lesson pages continue to compile while we migrate them one at a time.
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

export type GuideShelf = "welcome" | "101" | "guide";

export type Lesson = {
  id: LessonId;
  /** Hub shelf — drives where this guide appears in the index. */
  shelf: GuideShelf;
  /**
   * Topic family used as the small-caps eyebrow on cards and on the
   * GuideHeader. Plain English. Examples: "Signs", "Chart", "Sky",
   * "Relocation", "Tradition", "Practice".
   */
  category: string;
  /**
   * One sentence in Astro-Nat voice — the take a reader sees on the hub
   * card and on the page's lede. Punchy, no fluff.
   */
  oneLine: string;
  /**
   * If present, this guide is part of the curated "Start here" reading
   * list and renders in this order (1 first, 2 second, …). Subset of the
   * 101 shelf — not a curriculum, an editorial recommendation.
   */
  startHereOrder?: number;
  /** Two-line title; framework treats lines as separate <span>s. */
  title: [string, string] | [string];
  /** Short label used in cross-links. */
  shortTitle: string;
  href: string;
  /** CSS variable name for the topic accent. */
  accent: string;
  readingTime: string;
  /**
   * Legacy: ordinal position in the old curriculum sequence (0 = orientation,
   * 1..9 = lessons). Retained so legacy lesson pages keep compiling. Hub +
   * guide pages don't render this.
   */
  number: number;
  /**
   * Legacy: one-sentence "what this lesson is about" — used by the old
   * PaginationCard. Migration-only.
   */
  bridge: string;
};

export const CURRICULUM: Lesson[] = [
  {
    id: "start",
    shelf: "welcome",
    category: "Welcome",
    oneLine:
      "What this hub is, what astrology is and isn't, and how to read it without getting sold a personality test.",
    title: ["Start", "Here"],
    shortTitle: "Start Here",
    href: "/learn/start",
    accent: "var(--text-primary)",
    readingTime: "4 min",
    number: 0,
    bridge:
      "What astrology is, what it isn't, and how to read this Academy.",
  },

  // ─── Astro 101 — the foundations ─────────────────────────────────────
  {
    id: "zodiac",
    shelf: "101",
    category: "Signs",
    oneLine:
      "Twelve 30° slices of the sky used by every working astrologer for two thousand years. A coordinate system, not a personality test.",
    startHereOrder: 1,
    title: ["The", "Zodiac"],
    shortTitle: "The Zodiac",
    href: "/learn/zodiac",
    accent: "var(--color-y2k-blue)",
    readingTime: "7 min",
    number: 2,
    bridge:
      "Twelve 30° slices of ecliptic longitude — the system astrologers measure with.",
  },
  {
    id: "houses",
    shelf: "101",
    category: "Chart",
    oneLine:
      "Twelve sectors of your life the planets rotate through every twenty-four hours. Where the work actually happens.",
    startHereOrder: 2,
    title: ["The 12", "Houses"],
    shortTitle: "Houses",
    href: "/learn/houses",
    accent: "var(--sage)",
    readingTime: "8 min",
    number: 5,
    bridge:
      "Twelve sectors of the sky that say where each planet's themes show up in your life.",
  },
  {
    id: "aspects",
    shelf: "101",
    category: "Chart",
    oneLine:
      "The geometry of conversation between planets. Hard angles, soft angles, and the ones you can't talk your way out of.",
    startHereOrder: 3,
    title: ["Planetary", "Aspects"],
    shortTitle: "Aspects",
    href: "/learn/aspects",
    accent: "var(--color-acqua)",
    readingTime: "7 min",
    number: 6,
    bridge:
      "How planets talk to each other across the chart — the geometry of conversation.",
  },
  {
    id: "natal-chart",
    shelf: "101",
    category: "Chart",
    oneLine:
      "Your snapshot of the sky at the moment you were born, read from the spot you were born. The synthesis of everything else here.",
    startHereOrder: 4,
    title: ["The Natal", "Chart"],
    shortTitle: "Natal Chart",
    href: "/learn/natal-chart",
    accent: "var(--color-y2k-blue)",
    readingTime: "9 min",
    number: 4,
    bridge:
      "Your snapshot of the sky at the moment of birth, read from the spot you were born.",
  },

  // ─── Guides — techniques + applied ───────────────────────────────────
  {
    id: "viewing-the-stars",
    shelf: "guide",
    category: "Practice",
    oneLine:
      "Where the planets are tonight and what's worth tracking weekly. Astrology as a live event, not a theory.",
    title: ["Viewing", "The Stars"],
    shortTitle: "Viewing the Stars",
    href: "/learn/viewing-the-stars",
    accent: "var(--gold)",
    readingTime: "6 min",
    number: 1,
    bridge:
      "Begin with what's overhead. The astronomy under every astrological claim.",
  },
  {
    id: "constellations",
    shelf: "guide",
    category: "Sky",
    oneLine:
      "The actual stars the signs were named for, the precession story in full, and why we kept the names anyway.",
    title: ["The", "Constellations"],
    shortTitle: "Constellations",
    href: "/learn/constellations",
    accent: "var(--gold)",
    readingTime: "6 min",
    number: 3,
    bridge:
      "The actual star patterns behind the signs — and why they aren't the same thing anymore.",
  },
  {
    id: "malefic-benefic",
    shelf: "guide",
    category: "Tradition",
    oneLine:
      "The Hellenistic claim that not all planets play nice. Venus and Jupiter help; Mars and Saturn make you earn it.",
    title: ["Benefics &", "Malefics"],
    shortTitle: "Benefics & Malefics",
    href: "/learn/malefic-benefic",
    accent: "var(--color-spiced-life)",
    readingTime: "7 min",
    number: 7,
    bridge:
      "The Hellenistic split: which planets were considered favorable, which difficult, and why both are needed.",
  },
  {
    id: "astrocartography",
    shelf: "guide",
    category: "Relocation",
    oneLine:
      "Your chart projected across Earth. Where each planet's lines intensify, and what that means for actually moving.",
    title: ["Astro", "Cartography"],
    shortTitle: "Astrocartography",
    href: "/learn/astrocartography",
    accent: "var(--color-acqua)",
    readingTime: "8 min",
    number: 8,
    bridge:
      "Your chart relocated across Earth — where each planet's themes intensify.",
  },
  {
    id: "geodetic-astrology",
    shelf: "guide",
    category: "Relocation",
    oneLine:
      "The chart of the Earth itself. Cities and regions have weather too — geodetic longitude says what kind.",
    title: ["Geodetic", "Astrology"],
    shortTitle: "Geodetic",
    href: "/learn/geodetic-astrology",
    accent: "var(--color-spiced-life)",
    readingTime: "7 min",
    number: 9,
    bridge:
      "The chart of the Earth itself — longitude bands that color cities and regions.",
  },
];

// ─── Lookups ────────────────────────────────────────────────────────────

export function getLesson(id: LessonId): Lesson {
  const lesson = CURRICULUM.find((l) => l.id === id);
  if (!lesson) throw new Error(`Unknown lesson id: ${id}`);
  return lesson;
}

/** All guides on a given shelf, in declared order. */
export function getShelf(shelf: GuideShelf): Lesson[] {
  return CURRICULUM.filter((l) => l.shelf === shelf);
}

/** The curated "Start here" reading list — a subset of the 101 shelf in
 *  recommended order. Returns guides with `startHereOrder` set, sorted. */
export function getStartHereList(): Lesson[] {
  return CURRICULUM.filter((l) => l.startHereOrder !== undefined).sort(
    (a, b) => (a.startHereOrder ?? 0) - (b.startHereOrder ?? 0),
  );
}

/** Look up multiple guides by id, preserving the order given. Used by
 *  RelatedGuides on guide pages. */
export function getGuides(ids: LessonId[]): Lesson[] {
  return ids.map((id) => getLesson(id));
}

// ─── Legacy helpers (still consumed by un-migrated lesson pages) ────────

/** Legacy curriculum-order navigation. Migration-only — guides themselves
 *  no longer render prev/next. */
export function getPrev(id: LessonId): Lesson | null {
  const i = CURRICULUM.findIndex((l) => l.id === id);
  return i > 0 ? CURRICULUM[i - 1] : null;
}

/** Legacy curriculum-order navigation. Migration-only. */
export function getNext(id: LessonId): Lesson | null {
  const i = CURRICULUM.findIndex((l) => l.id === id);
  return i >= 0 && i < CURRICULUM.length - 1 ? CURRICULUM[i + 1] : null;
}
