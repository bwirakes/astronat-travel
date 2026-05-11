/**
 * Translate house numbers to plain-English life areas. The AI never sees
 * "H7" or "7th house" — only the topic string.
 */
export const HOUSE_TOPICS: Record<number, string> = {
  1: "identity and how you show up",
  2: "money and what you value",
  3: "short trips and daily talk",
  4: "home and rest",
  5: "romance and play",
  6: "work and health",
  7: "partnerships and close others",
  8: "intimacy and shared resources",
  9: "travel and big ideas",
  10: "career and reputation",
  11: "friends and community",
  12: "quiet time and the unseen",
};

export function houseTopic(house: number): string {
  return HOUSE_TOPICS[house] ?? "";
}

/** Map ACG angle codes to spelled-out names. */
const ANGLE_NAMES: Record<string, string> = {
  AS: "Ascendant",
  ASC: "Ascendant",
  DS: "Descendant",
  DSC: "Descendant",
  MC: "Midheaven",
  IC: "Imum Coeli",
};

export function spellAngle(code: string): string {
  if (!code) return "";
  return ANGLE_NAMES[code.toUpperCase()] ?? code;
}

/** Map raw distance in km to a closeness band. The AI never sees the number. */
export function closenessBand(km: number): "very close" | "near" | "distant" {
  if (km < 100) return "very close";
  if (km < 500) return "near";
  return "distant";
}

/** Given a house score, classify the vibe in plain English. */
export function houseVibe(score: number): string {
  if (score >= 75) return "lit up";
  if (score >= 60) return "supported";
  if (score <= 35) return "under pressure";
  if (score <= 50) return "low-key";
  return "steady";
}
