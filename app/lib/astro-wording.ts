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
  "DC":         "YOUR COMMITTED RELATIONSHIPS",
  "IC":         "YOUR ANCESTRY AND HOME",
};

export const HOUSE_DOMAINS: Record<number, string> = {
  1:  "self, appearance, vitality, and life force",
  2:  "assets, resources, and talents",
  3:  "communication, daily rituals, siblings, and extended family",
  4:  "parents, caregivers, foundations, and home",
  5:  "pleasure, romance, creative energy, and children",
  6:  "work, health, and pets",
  7:  "committed partnerships",
  8:  "death, mental health, and other people's resources",
  9:  "travel, education, publishing, religion, astrology, and philosophy",
  10: "career and public roles",
  11: "community, friends, and good fortune",
  12: "sorrow, loss, daemon, and hidden life",
};

export const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Score → status label
export const SCORE_STATUS: Record<string, string> = {
  "Peak Flow":        "Peak Flow",
  "Highly Favorable": "Highly Favorable",
  "Favorable":        "Favorable",
  "Neutral":          "Neutral",
  "Challenging":      "Challenging",
  "Severe Friction":  "Severe Friction",
};
