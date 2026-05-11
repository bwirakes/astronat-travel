/**
 * dignity-tables.ts — Hellenistic Essential Dignity Reference Tables
 *
 * Sources:
 * - Skyscript / Lilly's Table (skyscript.co.uk/dig5.html)
 * - Ptolemy's Table of Essential Dignities (skyscript.co.uk/essential_dignities.html)
 * - Chris Brennan "Hellenistic Astrology" (Dorothean triplicities)
 * - Demetra George "Ancient Astrology in Theory and Practice"
 */

// ── Lilly Point-Score Constants ────────────────────────────────────────────
export const DIGNITY_SCORES = {
    RULER:        15,  // Planet in own sign (domicile)
    EXALTATION:   12,  // Planet in sign of exaltation
    TRIPLICITY:   9,   // Planet ruling its sect-appropriate triplicity
    TERM:         6,   // Planet in its own Egyptian term (degree-based)
    FACE:         3,   // Planet in its own Chaldean face/decan (10° divisions)
    PEREGRINE:   -15,  // No essential dignity whatsoever — worst neutral state
    DETRIMENT:   -15,  // Opposite of domicile
    FALL:        -12,  // Opposite of exaltation
} as const;

// ── Triplicity Lords (Dorothean System) ────────────────────────────────────
// Each element has three lords: day, night, and participating.
// In a day chart, the day lord is strongest; in a night chart, the night lord.
// The participating lord contributes everywhere but weakly.
export const TRIPLICITY_LORDS: Record<string, { day: string; night: string; participating: string }> = {
    Fire:  { day: "Sun",    night: "Jupiter", participating: "Saturn"  },
    Earth: { day: "Venus",  night: "Moon",    participating: "Mars"    },
    Air:   { day: "Saturn", night: "Mercury", participating: "Jupiter" },
    Water: { day: "Venus",  night: "Mars",    participating: "Moon"    },
};

// ── Sign → Element Mapping ─────────────────────────────────────────────────
export const SIGN_ELEMENT: Record<string, string> = {
    Aries:       "Fire",
    Leo:         "Fire",
    Sagittarius: "Fire",
    Taurus:      "Earth",
    Virgo:       "Earth",
    Capricorn:   "Earth",
    Gemini:      "Air",
    Libra:       "Air",
    Aquarius:    "Air",
    Cancer:      "Water",
    Scorpio:     "Water",
    Pisces:      "Water",
};

// ── Egyptian Terms/Bounds ──────────────────────────────────────────────────
// Each sign has 5 unequal degree segments, each ruled by a traditional planet.
// Format per sign: [endDegree, ruler][] — segment covers [prev-end, endDegree).
// Degrees are within-sign (0–29.99). All segments sum to 30.
// Only 5 traditional planets: Jupiter, Venus, Mercury, Mars, Saturn.
export const EGYPTIAN_TERMS: Record<string, [number, string][]> = {
    Aries:       [[6, "Jupiter"], [12, "Venus"],   [20, "Mercury"], [25, "Mars"],    [30, "Saturn"]],
    Taurus:      [[8, "Venus"],   [14, "Mercury"],  [22, "Jupiter"],  [27, "Saturn"], [30, "Mars"]],
    Gemini:      [[6, "Mercury"], [12, "Jupiter"],  [17, "Venus"],   [24, "Mars"],   [30, "Saturn"]],
    Cancer:      [[7, "Mars"],    [13, "Venus"],   [19, "Mercury"], [26, "Jupiter"], [30, "Saturn"]],
    Leo:         [[6, "Jupiter"], [11, "Venus"],   [18, "Saturn"],  [24, "Mercury"], [30, "Mars"]],
    Virgo:       [[7, "Mercury"], [17, "Venus"],   [21, "Jupiter"], [28, "Mars"],    [30, "Saturn"]],
    Libra:       [[6, "Saturn"],  [14, "Mercury"], [21, "Jupiter"], [28, "Venus"],   [30, "Mars"]],
    Scorpio:     [[7, "Mars"],    [11, "Venus"],   [19, "Mercury"], [24, "Jupiter"], [30, "Saturn"]],
    Sagittarius: [[12, "Jupiter"],[17, "Venus"],   [21, "Mercury"], [26, "Saturn"],  [30, "Mars"]],
    Capricorn:   [[7, "Mercury"], [14, "Jupiter"], [22, "Venus"],   [26, "Saturn"],  [30, "Mars"]],
    Aquarius:    [[7, "Mercury"], [13, "Venus"],   [20, "Jupiter"], [25, "Mars"],    [30, "Saturn"]],
    Pisces:      [[12, "Venus"],  [16, "Jupiter"], [19, "Mercury"], [28, "Mars"],    [30, "Saturn"]],
};

// ── Chaldean Faces / Decans ────────────────────────────────────────────────
// Each sign is divided into three 10° faces. The assignment follows the
// Chaldean (descending) order: Saturn→Jupiter→Mars→Sun→Venus→Mercury→Moon,
// cycling continuously from Aries 0°.
// Format: [face_0_10deg_ruler, face_10_20deg_ruler, face_20_30deg_ruler]
export const CHALDEAN_FACES: Record<string, [string, string, string]> = {
    Aries:       ["Mars",    "Sun",     "Venus"  ],
    Taurus:      ["Mercury", "Moon",    "Saturn" ],
    Gemini:      ["Jupiter", "Mars",    "Sun"    ],
    Cancer:      ["Venus",   "Mercury", "Moon"   ],
    Leo:         ["Saturn",  "Jupiter", "Mars"   ],
    Virgo:       ["Sun",     "Venus",   "Mercury"],
    Libra:       ["Moon",    "Saturn",  "Jupiter"],
    Scorpio:     ["Mars",    "Sun",     "Venus"  ],
    Sagittarius: ["Mercury", "Moon",    "Saturn" ],
    Capricorn:   ["Jupiter", "Mars",    "Sun"    ],
    Aquarius:    ["Venus",   "Mercury", "Moon"   ],
    Pisces:      ["Saturn",  "Jupiter", "Mars"   ],
};

// ── Exaltation Degrees ─────────────────────────────────────────────────────
// Precise degree of maximum exaltation per traditional planet.
// Used for "exact exaltation" bonus in some systems (not currently in use).
export const EXALTATION_DEGREES: Record<string, { sign: string; degree: number }> = {
    Sun:     { sign: "Aries",     degree: 19 },
    Moon:    { sign: "Taurus",    degree: 3  },
    Mercury: { sign: "Virgo",     degree: 15 },
    Venus:   { sign: "Pisces",    degree: 27 },
    Mars:    { sign: "Capricorn", degree: 28 },
    Jupiter: { sign: "Cancer",    degree: 15 },
    Saturn:  { sign: "Libra",     degree: 21 },
};
