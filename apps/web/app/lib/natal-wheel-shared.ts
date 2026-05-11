/**
 * Shared zodiac band geometry for SVG natal wheels (NatalMockupWheel, RelocationBiWheel).
 * Single source for sign sectors, element fills, and polar→SVG mapping.
 */

export const WHEEL_CX = 400;
export const WHEEL_CY = 400;

export type ZodiacElement = "fire" | "earth" | "air" | "water";

export const NATAL_WHEEL_SIGNS: {
  name: string;
  glyph: string;
  lon: number;
  elem: ZodiacElement;
}[] = [
  { name: "Aries",       glyph: "♈", lon:   0, elem: "fire"  },
  { name: "Taurus",      glyph: "♉", lon:  30, elem: "earth" },
  { name: "Gemini",      glyph: "♊", lon:  60, elem: "air"   },
  { name: "Cancer",      glyph: "♋", lon:  90, elem: "water" },
  { name: "Leo",         glyph: "♌", lon: 120, elem: "fire"  },
  { name: "Virgo",       glyph: "♍", lon: 150, elem: "earth" },
  { name: "Libra",       glyph: "♎", lon: 180, elem: "air"   },
  { name: "Scorpio",     glyph: "♏", lon: 210, elem: "water" },
  { name: "Sagittarius", glyph: "♐", lon: 240, elem: "fire"  },
  { name: "Capricorn",   glyph: "♑", lon: 270, elem: "earth" },
  { name: "Aquarius",    glyph: "♒", lon: 300, elem: "air"   },
  { name: "Pisces",      glyph: "♓", lon: 330, elem: "water" },
];

export const NATAL_WHEEL_ELEM_FILL: Record<ZodiacElement, string> = {
  fire:  "rgba(230,122,122,0.22)",
  earth: "rgba(201,169,110,0.20)",
  air:   "rgba(202,241,240,0.20)",
  water: "rgba(0,253,0,0.13)",
};

export const NATAL_WHEEL_ELEM_STROKE: Record<ZodiacElement, string> = {
  fire:  "rgba(230,122,122,0.60)",
  earth: "rgba(201,169,110,0.55)",
  air:   "rgba(202,241,240,0.55)",
  water: "rgba(0,253,0,0.45)",
};

export const NATAL_WHEEL_HOUSE_ELEM_FILL: Record<ZodiacElement, string> = {
  fire:  "rgba(230,122,122,0.18)",
  earth: "rgba(201,169,110,0.17)",
  air:   "rgba(202,241,240,0.17)",
  water: "rgba(0,253,0,0.12)",
};

export function natalWheelToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Polar position on the wheel: longitude `lon`, radius `r`, with Ascendant at `asc`. */
export function natalWheelSvgXY(lon: number, r: number, asc: number) {
  const angle = natalWheelToRad(180 - (lon - asc));
  return {
    x: parseFloat((WHEEL_CX + r * Math.cos(angle)).toFixed(3)),
    y: parseFloat((WHEEL_CY + r * Math.sin(angle)).toFixed(3)),
  };
}
