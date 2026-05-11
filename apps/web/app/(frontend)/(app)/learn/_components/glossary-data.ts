/**
 * The single source of truth for every defined term in the Academy.
 *
 * Consumers:
 *   - <Glossify> auto-wraps the first appearance of any `term` or alias per page.
 *   - <GlossaryTerm> looks up the entry by slug for tooltip + click-through.
 *   - /learn/glossary renders the full corpus from this list.
 *   - lessonMetadata() derives SEO keywords from which terms appear in a lesson.
 *
 * The Economist Rule applies here too: every `definition` must be plain English
 * a 7th-grader can finish without a dictionary. If you can't write one, the
 * entry isn't ready.
 */

import type { LessonId } from "./curriculum";
import type { Tradition } from "./TraditionChip";

export type GlossaryEntry = {
  /** URL-safe identifier; becomes the anchor on /learn/glossary. */
  slug: string;
  /** Canonical term as it appears in prose. Match is word-bounded + case-insensitive. */
  term: string;
  /** Other forms that should also be auto-wrapped. */
  aliases?: string[];
  /** Plain-English definition. ≤ 240 chars. */
  definition: string;
  /** Lesson where this term is canonically introduced. */
  firstUsedIn: LessonId;
  /** Other glossary slugs cross-referenced by this entry. */
  relatedTerms?: string[];
  /** Tradition (or astronomy) the term belongs to. */
  tradition?: Tradition;
  /** Optional inline source attribution to surface in tooltip + glossary. */
  source?: { author: string; year: number | string };
  /** SEO keyword variations this term contributes when it appears in a lesson. */
  seoKeywords?: string[];
};

export const GLOSSARY: GlossaryEntry[] = [
  // ─── Astronomy / sky terms ────────────────────────────────────────────────
  {
    slug: "ecliptic",
    term: "ecliptic",
    aliases: ["the ecliptic"],
    definition:
      "The plane of Earth's orbit around the Sun, projected onto the sky. The Sun, Moon, and planets all appear to move along this line.",
    firstUsedIn: "viewing-the-stars",
    relatedTerms: ["zodiac", "longitude"],
    tradition: "astronomy",
    seoKeywords: ["ecliptic plane", "what is the ecliptic"],
  },
  {
    slug: "celestial-longitude",
    term: "celestial longitude",
    aliases: ["ecliptic longitude"],
    definition:
      "Position along the ecliptic, measured in degrees from 0° to 360° starting at the spring equinox point.",
    firstUsedIn: "zodiac",
    relatedTerms: ["ecliptic", "zodiac"],
    tradition: "astronomy",
  },
  {
    slug: "precession",
    term: "precession",
    aliases: ["axial precession", "precession of the equinoxes"],
    definition:
      "The slow ~26,000-year wobble of Earth's rotational axis. Causes the equinox points to drift backwards through the constellations over time.",
    firstUsedIn: "constellations",
    relatedTerms: ["sidereal", "tropical-zodiac"],
    tradition: "astronomy",
    source: { author: "Hipparchus", year: "~129 BCE" },
    seoKeywords: ["precession of the equinoxes", "earth axial wobble"],
  },
  {
    slug: "tropical-zodiac",
    term: "tropical zodiac",
    definition:
      "The zodiac anchored to the equinoxes, used in most Western astrology. The 0° Aries point is fixed at the spring equinox.",
    firstUsedIn: "zodiac",
    relatedTerms: ["sidereal", "precession"],
    tradition: "modern",
    seoKeywords: ["tropical zodiac vs sidereal", "what is the tropical zodiac"],
  },
  {
    slug: "sidereal",
    term: "sidereal zodiac",
    aliases: ["sidereal"],
    definition:
      "The zodiac anchored to the actual positions of the stars, used in most Vedic astrology. Drifts against the tropical zodiac due to precession.",
    firstUsedIn: "constellations",
    relatedTerms: ["tropical-zodiac", "precession"],
    tradition: "modern",
    seoKeywords: ["sidereal zodiac", "vedic zodiac"],
  },
  {
    slug: "constellation",
    term: "constellation",
    definition:
      "A group of stars that appears to form a pattern in the sky. Modern astronomy recognizes 88 official constellations.",
    firstUsedIn: "constellations",
    relatedTerms: ["zodiac", "magnitude"],
    tradition: "astronomy",
    source: { author: "IAU", year: 1922 },
  },
  {
    slug: "magnitude",
    term: "magnitude",
    aliases: ["apparent magnitude"],
    definition:
      "How bright a star appears from Earth. Lower numbers are brighter; the brightest stars are around magnitude 0 or 1.",
    firstUsedIn: "constellations",
    tradition: "astronomy",
  },
  {
    slug: "transit",
    term: "transit",
    definition:
      "When a planet currently in the sky forms an angle to a planet's position in your birth chart. The mechanism behind 'astrological timing.'",
    firstUsedIn: "viewing-the-stars",
    relatedTerms: ["aspect", "natal-chart"],
    tradition: "modern",
    seoKeywords: ["what is a transit in astrology"],
  },
  {
    slug: "glyph",
    term: "glyph",
    definition:
      "The traditional symbol for a planet or sign — like ☉ for the Sun or ♈ for Aries.",
    firstUsedIn: "natal-chart",
    tradition: "hellenistic",
  },

  // ─── Chart structure ──────────────────────────────────────────────────────
  {
    slug: "natal-chart",
    term: "natal chart",
    aliases: ["birth chart"],
    definition:
      "A 2D map of the sky at the exact moment and place of your birth. The starting point for every personal reading.",
    firstUsedIn: "natal-chart",
    relatedTerms: ["ascendant", "house", "aspect"],
    tradition: "modern",
    seoKeywords: ["what is a natal chart", "birth chart explained"],
  },
  {
    slug: "ascendant",
    term: "ascendant",
    aliases: ["rising sign", "ASC"],
    definition:
      "The sign rising on the eastern horizon at the moment you were born. Marks the start of the 1st house and shapes how others first perceive you.",
    firstUsedIn: "natal-chart",
    relatedTerms: ["midheaven", "descendant", "imum-coeli", "house"],
    tradition: "hellenistic",
    seoKeywords: ["rising sign", "ascendant meaning"],
  },
  {
    slug: "descendant",
    term: "descendant",
    aliases: ["DSC"],
    definition:
      "The sign setting on the western horizon at your birth. Opposite the ascendant; rules close partnerships and the 7th house.",
    firstUsedIn: "natal-chart",
    relatedTerms: ["ascendant"],
    tradition: "hellenistic",
  },
  {
    slug: "midheaven",
    term: "midheaven",
    aliases: ["MC", "Medium Coeli"],
    definition:
      "The highest point of the ecliptic at your birth. Marks the cusp of the 10th house — public reputation, career, the role you play in the world.",
    firstUsedIn: "natal-chart",
    relatedTerms: ["imum-coeli", "ascendant"],
    tradition: "hellenistic",
  },
  {
    slug: "imum-coeli",
    term: "imum coeli",
    aliases: ["IC"],
    definition:
      "The lowest point of the ecliptic at your birth, opposite the midheaven. Cusp of the 4th house — home, family, roots.",
    firstUsedIn: "natal-chart",
    relatedTerms: ["midheaven"],
    tradition: "hellenistic",
  },
  {
    slug: "house",
    term: "house",
    aliases: ["astrological house"],
    definition:
      "One of twelve sectors of the sky, dividing the chart into life-areas (identity, money, communication, home, etc.).",
    firstUsedIn: "houses",
    relatedTerms: ["cusp", "ascendant"],
    tradition: "hellenistic",
    seoKeywords: ["12 houses astrology", "astrological houses"],
  },
  {
    slug: "cusp",
    term: "cusp",
    definition:
      "The boundary between two houses (or two signs). The starting degree of a house.",
    firstUsedIn: "houses",
    tradition: "hellenistic",
  },
  {
    slug: "angle",
    term: "angle",
    aliases: ["chart angle"],
    definition:
      "One of the four cardinal points of a chart: ascendant, descendant, midheaven, imum coeli. The most sensitive degrees in the chart.",
    firstUsedIn: "natal-chart",
    relatedTerms: ["ascendant", "descendant", "midheaven", "imum-coeli"],
    tradition: "hellenistic",
  },

  // ─── Aspects ──────────────────────────────────────────────────────────────
  {
    slug: "aspect",
    term: "aspect",
    aliases: ["planetary aspect"],
    definition:
      "An angular relationship between two planets — the geometry of how they 'talk' to each other in the chart.",
    firstUsedIn: "aspects",
    relatedTerms: ["conjunction", "sextile", "square", "trine", "opposition", "orb"],
    tradition: "hellenistic",
    seoKeywords: ["what is an aspect in astrology"],
  },
  {
    slug: "conjunction",
    term: "conjunction",
    definition:
      "Two planets in the same sign within a tight orb (~10°). Their themes fuse and amplify each other.",
    firstUsedIn: "aspects",
    tradition: "hellenistic",
  },
  {
    slug: "sextile",
    term: "sextile",
    definition:
      "A 60° angle between two planets. Friendly and supportive; opens doors but rewards conscious effort.",
    firstUsedIn: "aspects",
    tradition: "hellenistic",
  },
  {
    slug: "square",
    term: "square",
    definition:
      "A 90° angle between two planets. Hard aspect — produces tension that builds capability over time.",
    firstUsedIn: "aspects",
    tradition: "hellenistic",
    source: { author: "Ptolemy", year: "~150 CE" },
  },
  {
    slug: "trine",
    term: "trine",
    definition:
      "A 120° angle between two planets. Soft aspect — flow and gift, but easy to under-develop.",
    firstUsedIn: "aspects",
    tradition: "hellenistic",
  },
  {
    slug: "opposition",
    term: "opposition",
    definition:
      "A 180° angle between two planets. The two themes argue — integration is the work.",
    firstUsedIn: "aspects",
    tradition: "hellenistic",
  },
  {
    slug: "orb",
    term: "orb",
    definition:
      "The tolerance allowed for an aspect to count. Commonly 6°–10° depending on the aspect and planet.",
    firstUsedIn: "aspects",
    relatedTerms: ["aspect"],
    tradition: "hellenistic",
  },

  // ─── Modality + element ───────────────────────────────────────────────────
  {
    slug: "modality",
    term: "modality",
    aliases: ["quality"],
    definition:
      "How a sign moves: Cardinal (initiates), Fixed (sustains), or Mutable (adapts). Each modality contains 4 signs.",
    firstUsedIn: "zodiac",
    relatedTerms: ["cardinal", "fixed", "mutable", "element"],
    tradition: "modern",
  },
  {
    slug: "cardinal",
    term: "cardinal",
    definition:
      "The modality that initiates. Cardinal signs (Aries, Cancer, Libra, Capricorn) start each season and tend toward beginnings, momentum, and starting things in motion.",
    firstUsedIn: "zodiac",
    relatedTerms: ["modality", "fixed", "mutable"],
    tradition: "modern",
  },
  {
    slug: "fixed",
    term: "fixed",
    definition:
      "The modality that sustains. Fixed signs (Taurus, Leo, Scorpio, Aquarius) hold the middle of each season — they preserve, deepen, and resist change.",
    firstUsedIn: "zodiac",
    relatedTerms: ["modality", "cardinal", "mutable"],
    tradition: "modern",
  },
  {
    slug: "mutable",
    term: "mutable",
    definition:
      "The modality that adapts. Mutable signs (Gemini, Virgo, Sagittarius, Pisces) end each season — they release, transition, and shape-shift toward what comes next.",
    firstUsedIn: "zodiac",
    relatedTerms: ["modality", "cardinal", "fixed"],
    tradition: "modern",
  },
  {
    slug: "element",
    term: "element",
    aliases: ["zodiac element"],
    definition:
      "What material a sign moves through: Fire (action), Earth (matter), Air (mind), or Water (feeling). Each element contains 3 signs.",
    firstUsedIn: "zodiac",
    relatedTerms: ["fire", "earth", "air", "water", "modality"],
    tradition: "modern",
  },
  {
    slug: "fire",
    term: "fire",
    definition:
      "The element of action, will, and vitality. Fire signs (Aries, Leo, Sagittarius) are direct, expressive, and motion-oriented.",
    firstUsedIn: "zodiac",
    relatedTerms: ["element", "earth", "air", "water"],
    tradition: "modern",
  },
  {
    slug: "earth",
    term: "earth",
    definition:
      "The element of body, matter, and what lasts. Earth signs (Taurus, Virgo, Capricorn) are grounded, practical, and oriented toward what's real.",
    firstUsedIn: "zodiac",
    relatedTerms: ["element", "fire", "air", "water"],
    tradition: "modern",
  },
  {
    slug: "air",
    term: "air",
    definition:
      "The element of mind, language, and exchange. Air signs (Gemini, Libra, Aquarius) are conceptual, social, and conversation-driven.",
    firstUsedIn: "zodiac",
    relatedTerms: ["element", "fire", "earth", "water"],
    tradition: "modern",
  },
  {
    slug: "water",
    term: "water",
    definition:
      "The element of feeling, depth, and undercurrent. Water signs (Cancer, Scorpio, Pisces) are emotional, intuitive, and oriented toward what's beneath.",
    firstUsedIn: "zodiac",
    relatedTerms: ["element", "fire", "earth", "air"],
    tradition: "modern",
  },

  // ─── Dignity ──────────────────────────────────────────────────────────────
  {
    slug: "dignity",
    term: "dignity",
    aliases: ["essential dignity"],
    definition:
      "How well-placed a planet is by sign. Strong dignity (domicile, exaltation) means the planet operates cleanly; weak dignity (detriment, fall) means it struggles.",
    firstUsedIn: "malefic-benefic",
    relatedTerms: ["domicile", "exaltation", "detriment", "fall"],
    tradition: "hellenistic",
  },
  {
    slug: "domicile",
    term: "domicile",
    aliases: ["rulership"],
    definition:
      "A planet's 'home' sign — where it expresses most cleanly. The Sun is in domicile in Leo; Saturn in Capricorn.",
    firstUsedIn: "natal-chart",
    relatedTerms: ["dignity"],
    tradition: "hellenistic",
  },
  {
    slug: "exaltation",
    term: "exaltation",
    definition:
      "A sign other than its home where a planet is honored and amplified. The Sun is exalted in Aries; the Moon in Taurus.",
    firstUsedIn: "malefic-benefic",
    relatedTerms: ["dignity", "domicile"],
    tradition: "hellenistic",
  },
  {
    slug: "detriment",
    term: "detriment",
    definition:
      "The sign opposite a planet's domicile, where it struggles to express cleanly.",
    firstUsedIn: "malefic-benefic",
    relatedTerms: ["dignity", "domicile"],
    tradition: "hellenistic",
  },
  {
    slug: "fall",
    term: "fall",
    definition:
      "The sign opposite a planet's exaltation, where it operates at its weakest.",
    firstUsedIn: "malefic-benefic",
    relatedTerms: ["dignity", "exaltation"],
    tradition: "hellenistic",
  },
  {
    slug: "benefic",
    term: "benefic",
    aliases: ["benefics"],
    definition:
      "A planet whose effects were considered favorable by classical astrologers. Venus and Jupiter are the two benefics.",
    firstUsedIn: "malefic-benefic",
    relatedTerms: ["malefic"],
    tradition: "hellenistic",
    source: { author: "Brennan, Chris", year: 2017 },
  },
  {
    slug: "malefic",
    term: "malefic",
    aliases: ["malefics"],
    definition:
      "A planet whose effects were considered difficult by classical astrologers. Mars and Saturn are the two malefics.",
    firstUsedIn: "malefic-benefic",
    relatedTerms: ["benefic"],
    tradition: "hellenistic",
    source: { author: "Brennan, Chris", year: 2017 },
  },

  // ─── Place / world ────────────────────────────────────────────────────────
  {
    slug: "astrocartography",
    term: "astrocartography",
    aliases: ["AstroCartoGraphy", "ACG"],
    definition:
      "Relocating your birth chart across the surface of the Earth. Each planet draws a line; proximity to a line intensifies that planet's themes there.",
    firstUsedIn: "astrocartography",
    relatedTerms: ["natal-chart", "geodetic"],
    tradition: "mundane",
    source: { author: "Lewis, Jim", year: 1976 },
    seoKeywords: ["what is astrocartography", "astrocartography lines"],
  },
  {
    slug: "geodetic",
    term: "geodetic astrology",
    aliases: ["geodetic"],
    definition:
      "A system that maps the zodiac onto Earth's longitudes — assigning a sign to each region of the world regardless of personal birth data.",
    firstUsedIn: "geodetic-astrology",
    relatedTerms: ["astrocartography", "mundane"],
    tradition: "mundane",
    source: { author: "Sepharial", year: 1925 },
    seoKeywords: ["geodetic astrology", "what is mundane astrology"],
  },
  {
    slug: "mundane",
    term: "mundane astrology",
    aliases: ["mundane"],
    definition:
      "The branch of astrology that studies cities, nations, and world events rather than individuals.",
    firstUsedIn: "geodetic-astrology",
    relatedTerms: ["geodetic"],
    tradition: "mundane",
    source: { author: "Campion, Nick", year: 1988 },
  },
];

/** Quick lookup by slug. */
export function getGlossaryEntry(slug: string): GlossaryEntry | undefined {
  return GLOSSARY.find((e) => e.slug === slug);
}

/**
 * Returns all match patterns sorted by length (longest first), so multi-word
 * terms like "tropical zodiac" win over single-word "zodiac" when both could
 * match the same span.
 */
export function getAllGlossaryPatterns(): { pattern: string; entry: GlossaryEntry }[] {
  const out: { pattern: string; entry: GlossaryEntry }[] = [];
  for (const entry of GLOSSARY) {
    out.push({ pattern: entry.term, entry });
    for (const alias of entry.aliases ?? []) {
      out.push({ pattern: alias, entry });
    }
  }
  return out.sort((a, b) => b.pattern.length - a.pattern.length);
}
