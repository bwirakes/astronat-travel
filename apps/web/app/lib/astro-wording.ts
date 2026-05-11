// app/lib/astro-wording.ts
// Single source of truth for all editorial planet/house wording.
// Previously duplicated inline in: ChartClient.tsx

export const PLANET_DOMAINS: Record<string, string> = {
  "Sun":        "YOUR IDENTITY AND WHERE YOU SHINE",
  "Moon":       "YOUR BODY AND EMOTIONS",
  "Mercury":    "HOW AND WHERE YOU COMMUNICATE",
  "Venus":      "HOW AND WHERE YOU CONNECT",
  "Mars":       "HOW AND WHERE YOU TAKE ACTION",
  "Jupiter":    "HOW AND WHERE YOU CREATE ABUNDANCE",
  "Saturn":     "HOW AND WHERE YOU CREATE BOUNDARIES",
  "Uranus":     "HOW AND WHERE YOU INNOVATE AND DISRUPT",
  "Neptune":    "HOW AND WHERE YOU USE YOUR IMAGINATION",
  "Pluto":      "HOW AND WHERE YOU HOLD SECRET POWER",
  "Chiron":     "HOW AND WHERE YOU FIND HEALING",
  "North Node": "HOW AND WHERE YOU'RE INSATIABLE",
  "South Node": "HOW AND WHERE YOU LEARN TO LET GO",
  "Ascendant":  "YOUR MOTIVATION FOR LIVING LIFE",
  "MC":         "YOUR PUBLIC IMAGE AND VOCATION",
  "DSC":        "YOUR COMMITTED RELATIONSHIPS",
  "DC":         "YOUR COMMITTED RELATIONSHIPS",
  "IC":         "YOUR ANCESTRY AND HOME",
};

export const HOUSE_DOMAINS: Record<number, string> = {
  1:  "how you show up",
  2:  "money and what you value",
  3:  "how you think and talk",
  4:  "family and feeling safe",
  5:  "creativity and fun",
  6:  "daily habits and health",
  7:  "close relationships",
  8:  "deep change and shared money",
  9:  "beliefs and big adventures",
  10: "your public life and goals",
  11: "friends and future dreams",
  12: "what you keep inside",
};

// One plain sentence describing what each house covers — shown below planet placements
export const HOUSE_DESCRIPTIONS: Record<number, string> = {
  1:  "The 1st house is about how people see you before you say a word — your energy, look, and first impression.",
  2:  "The 2nd house is about money, what you own, and what you truly value in life.",
  3:  "The 3rd house is about how you think, talk, and stay in touch with the world around you.",
  4:  "The 4th house is about home, family, and where you feel safe to be yourself.",
  5:  "The 5th house is about creativity, play, romance, and the things that bring you real joy.",
  6:  "The 6th house is about your daily routine, how you stay healthy, and the work you do every day.",
  7:  "The 7th house is about the people you commit to — partners, close friends, and important collaborators.",
  8:  "The 8th house is about big changes, shared money, and the parts of life that are hard to talk about.",
  9:  "The 9th house is about travel, beliefs, learning, and what gives your life a bigger meaning.",
  10: "The 10th house is about your career, your public life, and what you want to be known for.",
  11: "The 11th house is about your community, the friends you choose, and the future you're building.",
  12: "The 12th house is about your private inner world — fears, dreams, and things you don't often share.",
};

export const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const PLANET_EXPRESSION_NOUNS: Record<string, string> = {
  "Sun": "identity",
  "Moon": "emotional life",
  "Mercury": "voice and thinking",
  "Venus": "desire for connection",
  "Mars": "drive",
  "Jupiter": "growth instinct",
  "Saturn": "discipline",
  "Uranus": "need for freedom",
  "Neptune": "imagination",
  "Pluto": "transformational power",
  "Chiron": "healing work",
  "North Node": "future appetite",
  "South Node": "old patterning",
  "Ascendant": "way of meeting life",
  "MC": "public direction",
  "DSC": "relationship pattern",
  "DC": "relationship pattern",
  "IC": "private foundation",
};

export const SIGN_EXPRESSION_PHRASES: Record<string, string> = {
  "Aries": "directness, courage, and fast action",
  "Taurus": "steadiness, sensuality, and material patience",
  "Gemini": "curiosity, language, and quick adaptation",
  "Cancer": "protection, memory, and emotional intelligence",
  "Leo": "warmth, creative confidence, and visibility",
  "Virgo": "precision, usefulness, and practical refinement",
  "Libra": "taste, balance, and relational intelligence",
  "Scorpio": "depth, secrecy, and psychological force",
  "Sagittarius": "belief, range, and truth-seeking",
  "Capricorn": "structure, ambition, and long-term control",
  "Aquarius": "originality, distance, and future-facing logic",
  "Pisces": "sensitivity, symbolism, and spiritual permeability",
};

// 3–5 word trait teasers per sign — shown under Big Three cards on tap
export const SIGN_TRAITS: Record<string, string[]> = {
  "Aries":       ["bold", "fast", "direct", "restless"],
  "Taurus":      ["patient", "loyal", "sensual", "steady"],
  "Gemini":      ["curious", "quick", "witty", "restless"],
  "Cancer":      ["intuitive", "nurturing", "protective", "private"],
  "Leo":         ["warm", "expressive", "confident", "proud"],
  "Virgo":       ["precise", "helpful", "detail-driven", "modest"],
  "Libra":       ["fair", "charming", "indecisive", "relational"],
  "Scorpio":     ["intense", "magnetic", "secretive", "transformative"],
  "Sagittarius": ["free", "honest", "expansive", "restless"],
  "Capricorn":   ["ambitious", "patient", "disciplined", "serious"],
  "Aquarius":    ["original", "detached", "future-minded", "eccentric"],
  "Pisces":      ["empathic", "dreamy", "spiritual", "boundless"],
};

export function buildPlacementImplicationSentence({
  planet,
  sign,
  house,
}: {
  planet: string;
  sign: string;
  house: number;
}): string {
  const houseDomain = HOUSE_DOMAINS[house] || "life";
  const planetLabel = planet === "Ascendant" ? "Rising" : planet;
  const planetExpression = PLANET_EXPRESSION_NOUNS[planet] || `${planet.toLowerCase()} energy`;
  const signExpression = SIGN_EXPRESSION_PHRASES[sign] || `${sign} qualities`;

  return `With your natal ${planetLabel} in ${sign} in your ${getOrdinal(house)} house of ${houseDomain}, your ${planetExpression} is expressed through ${signExpression} in that area of life.`;
}

/** API/stream implication when present; otherwise the template from {@link buildPlacementImplicationSentence}. */
export function resolvePlacementImplication({
  planet,
  sign,
  house,
  implication,
}: {
  planet: string;
  sign: string;
  house: number;
  implication?: string;
}): string {
  return implication || buildPlacementImplicationSentence({ planet, sign, house });
}

// Score → status label
export const SCORE_STATUS: Record<string, string> = {
  "Peak Flow":        "Peak Flow",
  "Highly Favorable": "Highly Favorable",
  "Favorable":        "Favorable",
  "Neutral":          "Neutral",
  "Challenging":      "Challenging",
  "Severe Friction":  "Severe Friction",
};
