export const projectLon = (lon: number) => (((lon + 180) % 360 + 360) % 360) * (1000 / 360);
export const projectLat = (lat: number) => (90 - lat) * (500 / 180);

export type ElemType = "fire" | "earth" | "air" | "water";

export const ELEMENT_COLORS: Record<ElemType, { fill: string; stroke: string; label: string }> = {
  fire:  { fill: "rgba(230,122,122,0.15)",  stroke: "rgba(230,122,122,0.5)",  label: "var(--color-spiced-life)" },
  earth: { fill: "rgba(201,169,110,0.15)",  stroke: "rgba(201,169,110,0.5)",  label: "var(--gold)" },
  air:   { fill: "rgba(202,241,240,0.15)",  stroke: "rgba(202,241,240,0.5)",  label: "var(--color-acqua)" },
  water: { fill: "rgba(4,86,251,0.12)",     stroke: "rgba(4,86,251,0.4)",     label: "var(--color-y2k-blue)" },
};

export interface GeodeticZone {
  id: string;
  sign: string;
  glyph: string;
  startLon: number;
  elem: ElemType;
  cities: string[];
  keyword: string;
  desc: string;
}

// Zone descriptions are deliberately archetypal — no hard-coded city
// references. The same text must read sensibly for any city that happens
// to fall in this 30° band on the world map, since any destination's MC
// or ASC can resolve to any of the twelve zones.
export const GEODETIC_ZONES: GeodeticZone[] = [
  {
    id: "aries",
    sign: "Aries", glyph: "♈", startLon: 0, elem: "fire",
    cities: ["London", "Lagos", "Accra", "Dublin"],
    keyword: "The Pioneer Meridian",
    desc: "Greenwich, 0°, locks to 0° Aries in the geodetic system. This band carries an Aries signature: pioneering, independent, competitive, first-mover. Transits through Aries land on this column with unusual force — initiations, contests, and anything that calls for going first.",
  },
  {
    id: "taurus",
    sign: "Taurus", glyph: "♉", startLon: 30, elem: "earth",
    cities: ["Cairo", "Istanbul", "Riyadh", "Kyiv"],
    keyword: "The Builder Meridian",
    desc: "30°E gives this band a Taurus signature — accumulation, physical beauty, and cultural endurance. The themes that hold here are material: what you own, what you build, what lasts. Transits through Taurus surface slowly and settle into the body and the balance sheet.",
  },
  {
    id: "gemini",
    sign: "Gemini", glyph: "♊", startLon: 60, elem: "air",
    cities: ["Dubai", "Karachi", "Tehran", "Nairobi"],
    keyword: "The Messenger Meridian",
    desc: "60°E brings a Gemini signature. Gemini governs communication, trade routes, and the exchange of ideas — anywhere people, signals, and goods are moved between other places. Transits through Gemini quicken the tempo here: more conversations, more shipments, more connections.",
  },
  {
    id: "cancer",
    sign: "Cancer", glyph: "♋", startLon: 90, elem: "water",
    cities: ["Dhaka", "Kolkata", "Yangon", "Kunming"],
    keyword: "The Nurturer Meridian",
    desc: "90°E aligns with a Cancer signature — water, family, and emotional depth. The public themes of this column are ancestral: home, belonging, tribe, and what gets passed down. Transits through Cancer move the private register into view: mood, memory, and the terms of care.",
  },
  {
    id: "leo",
    sign: "Leo", glyph: "♌", startLon: 120, elem: "fire",
    cities: ["Bangkok", "Manila", "Beijing", "Taipei"],
    keyword: "The Sovereign Meridian",
    desc: "120°E gives this band a Leo signature — visibility, drama, and performance. Whatever happens here tends to happen with an audience, and the local register rewards confidence over modesty. Transits through Leo raise the stage: recognition, identity, and the uses of authority.",
  },
  {
    id: "virgo",
    sign: "Virgo", glyph: "♍", startLon: 150, elem: "earth",
    cities: ["Tokyo", "Seoul", "Sydney", "Vladivostok"],
    keyword: "The Analyst Meridian",
    desc: "150°E brings a Virgo signature — refinement, ritual, and systematic improvement. Work here tends to reward precision over size; the culture prizes the craftsman. Transits through Virgo surface the details: maintenance, editing, and the slow compounding of small corrections.",
  },
  {
    id: "libra",
    sign: "Libra", glyph: "♎", startLon: 180, elem: "air",
    cities: ["Fiji", "Marshall Islands", "Pacific Ocean"],
    keyword: "The Balance Meridian",
    desc: "The 180° meridian is the International Date Line — the point where East meets West, yesterday meets today. It carries a Libra signature: balance, negotiation, and the meeting of opposites. Transits through Libra fall on this column as contracts, partnerships, and acts of weighing.",
  },
  {
    id: "scorpio",
    sign: "Scorpio", glyph: "♏", startLon: -150, elem: "water",
    cities: ["Anchorage", "Honolulu", "Tahiti"],
    keyword: "The Alchemist Meridian",
    desc: "150°W carries a Scorpio signature — power, depth, transformation, and what lies beneath the surface. Themes here tend to be intense rather than light; the register is one of exposure and consequence. Transits through Scorpio sharpen what was hidden and force the reveal.",
  },
  {
    id: "sagittarius",
    sign: "Sagittarius", glyph: "♐", startLon: -120, elem: "fire",
    cities: ["Los Angeles", "Vancouver", "Mexico City", "Denver"],
    keyword: "The Explorer Meridian",
    desc: "120°W aligns with a Sagittarius signature — frontier, freedom, and perpetual reinvention. This band rewards scale, travel, and the belief that the next thing is bigger than the last. Transits through Sagittarius open the aperture: long-distance moves, publishing, teaching, belief.",
  },
  {
    id: "capricorn",
    sign: "Capricorn", glyph: "♑", startLon: -90, elem: "earth",
    cities: ["New York", "Chicago", "Bogotá", "New Orleans"],
    keyword: "The Architect Meridian",
    desc: "90°W carries a Capricorn signature — relentless upward drive, structural ambition, and the belief that hard work is the universal currency. The themes here are institutional: status, credential, and the long climb. Transits through Capricorn surface as deadlines, rankings, and legacy questions.",
  },
  {
    id: "aquarius",
    sign: "Aquarius", glyph: "♒", startLon: -60, elem: "air",
    cities: ["Reykjavik", "Greenland", "São Paulo", "Buenos Aires"],
    keyword: "The Visionary Meridian",
    desc: "60°W brings an Aquarius signature — idealism, social innovation, and a pull toward the radically new. Themes here run ahead of consensus and reward groups, networks, and long-range experiments. Transits through Aquarius arrive as breaks from pattern, unlikely alliances, and public ideas.",
  },
  {
    id: "pisces",
    sign: "Pisces", glyph: "♓", startLon: -30, elem: "water",
    cities: ["Lisbon", "Dakar", "Reykjavik fringe", "Mid-Atlantic"],
    keyword: "The Dreamer Meridian",
    desc: "30°W carries a Pisces signature — longing, the sea, spiritual yearning, and the dissolution of boundaries between self and world. This band softens hard edges and rewards listening over deciding. Transits through Pisces wash the definitions and ask for faith instead of proof.",
  },
];
