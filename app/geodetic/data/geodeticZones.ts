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

export const GEODETIC_ZONES: GeodeticZone[] = [
  {
    id: "aries",
    sign: "Aries", glyph: "♈", startLon: 0, elem: "fire",
    cities: ["London", "Lagos", "Accra", "Dublin"],
    keyword: "The Pioneer Meridian",
    desc: "Greenwich, 0°, locks to 0° Aries in the geodetic system. Cities here carry an Aries Ascendant: pioneering, independent, competitive, and often culturally first-mover. London's historical position as the world's time-keeper is no coincidence — Aries governs beginnings and the self.",
  },
  {
    id: "taurus",
    sign: "Taurus", glyph: "♉", startLon: 30, elem: "earth",
    cities: ["Cairo", "Istanbul", "Riyadh", "Kyiv"],
    keyword: "The Builder Meridian",
    desc: "30°E gives these cities a Taurus Ascendant — a deep connection to material wealth, physical beauty, and cultural endurance. Cairo's millennia-spanning civilization and Istanbul's role as a crossroads of trade both express the Taurean themes of accumulation, beauty, and permanence.",
  },
  {
    id: "gemini",
    sign: "Gemini", glyph: "♊", startLon: 60, elem: "air",
    cities: ["Dubai", "Karachi", "Tehran", "Nairobi"],
    keyword: "The Messenger Meridian",
    desc: "60°E brings a Gemini Ascendant. Gemini governs communication, trade routes, and the exchange of ideas. Dubai's position as the world's busiest airline hub and most connected city is a direct expression of the Gemini mandate: adaptability and the movement of information and people.",
  },
  {
    id: "cancer",
    sign: "Cancer", glyph: "♋", startLon: 90, elem: "water",
    cities: ["Dhaka", "Kolkata", "Yangon", "Kunming"],
    keyword: "The Nurturer Meridian",
    desc: "90°E aligns with a Cancer Ascendant — water, family, and emotional depth. This meridian runs through South and Southeast Asia's most densely populated regions: areas with profound cultural emphasis on familial bonds, ancestral lineage, and home as a sacred institution.",
  },
  {
    id: "leo",
    sign: "Leo", glyph: "♌", startLon: 120, elem: "fire",
    cities: ["Bangkok", "Manila", "Beijing", "Taipei"],
    keyword: "The Sovereign Meridian",
    desc: "120°E gives cities a Leo Ascendant — visibility, drama, and performance. Southeast Asian capitals here are renowned for their theatrical culture, grand royal ceremonies, and outward displays of power. The Leo meridian amplifies everything it touches to center stage.",
  },
  {
    id: "virgo",
    sign: "Virgo", glyph: "♍", startLon: 150, elem: "earth",
    cities: ["Tokyo", "Seoul", "Sydney", "Vladivostok"],
    keyword: "The Analyst Meridian",
    desc: "150°E brings a Virgo Ascendant. Japan's legendary precision culture — from sushi craftsmanship to automotive engineering — expresses Virgo's mastery of refinement, ritual, and systematic improvement. Sydney's civic precision and structural order echo the same archetype.",
  },
  {
    id: "libra",
    sign: "Libra", glyph: "♎", startLon: 180, elem: "air",
    cities: ["Fiji", "Marshall Islands", "Pacific Ocean"],
    keyword: "The Balance Meridian",
    desc: "The 180° meridian is the International Date Line — the point where East meets West, yesterday meets today, and the calendar flips. It is the Libra meridian: the sign of balance, negotiation, and the meeting of opposites. Where one day ends, another begins in perfect equilibrium.",
  },
  {
    id: "scorpio",
    sign: "Scorpio", glyph: "♏", startLon: -150, elem: "water",
    cities: ["Anchorage", "Honolulu", "Tahiti"],
    keyword: "The Alchemist Meridian",
    desc: "150°W carries a Scorpio Ascendant. Alaska's raw wilderness and psychological intensity, Honolulu's complex colonial history, and Hawaii's volcanic landscape express Scorpio's core themes: power, depth, transformation, and what lies beneath the surface.",
  },
  {
    id: "sagittarius",
    sign: "Sagittarius", glyph: "♐", startLon: -120, elem: "fire",
    cities: ["Los Angeles", "Vancouver", "Mexico City", "Denver"],
    keyword: "The Explorer Meridian",
    desc: "120°W aligns with a Sagittarius Ascendant. The American West — with its mythology of the frontier, freedom, and perpetual reinvention — is one of the purest expressions of Sagittarian energy on Earth. Hollywood broadcasts its visions globally; LA insists that anything is possible.",
  },
  {
    id: "capricorn",
    sign: "Capricorn", glyph: "♑", startLon: -90, elem: "earth",
    cities: ["New York", "Chicago", "Bogotá", "New Orleans"],
    keyword: "The Architect Meridian",
    desc: "90°W carries a Capricorn Ascendant. New York City — the world's most famous skyline, financial capital, and engine of institutional ambition — is almost a perfect embodiment of Capricorn: relentless upward drive, structural ambition, and the belief that hard work is the universal currency.",
  },
  {
    id: "aquarius",
    sign: "Aquarius", glyph: "♒", startLon: -60, elem: "air",
    cities: ["Reykjavik", "Greenland", "São Paulo", "Buenos Aires"],
    keyword: "The Visionary Meridian",
    desc: "60°W brings an Aquarius Ascendant. Iceland leads globally in gender equality, renewable energy, and progressive governance — pure Aquarian idealism made law. Brazil's creativity, social innovation, and cultural pluralism equally express the Aquarian drive toward a radically inclusive future.",
  },
  {
    id: "pisces",
    sign: "Pisces", glyph: "♓", startLon: -30, elem: "water",
    cities: ["Lisbon", "Dakar", "Reykjavik fringe", "Mid-Atlantic"],
    keyword: "The Dreamer Meridian",
    desc: "30°W carries a Pisces Ascendant. Lisbon's fado music — the most mournful and nostalgic musical tradition in Europe — is a direct expression of this Piscean longitude: longing, the sea, spiritual yearning, and the dissolution of boundaries between self and the divine.",
  },
];
