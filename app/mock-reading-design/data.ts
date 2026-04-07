export const NATAL_LON: Record<string, number> = {
  sun:     144.92,
  moon:    200.48,
  mercury: 158.88,
  venus:    99.26,
  mars:     10.91,
  jupiter:  63.85,
  saturn:  266.06,
  uranus:  267.19,
  neptune: 277.69,
  pluto:   219.99,
};

export const HOUSES = [
   32.64,  62.33,  90.84, 119.64, 150.15, 181.91,
  212.64, 242.33, 270.84, 299.64, 330.15,   1.91,
];

export type Element = "fire" | "earth" | "air" | "water";

export const SIGNS: { name: string; glyph: string; lon: number; elem: Element }[] = [
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

export const ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.22)",
  earth: "rgba(201,169,110,0.20)",
  air:   "rgba(202,241,240,0.20)",
  water: "rgba(0,253,0,0.13)",
};

export const ELEM_STROKE: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.60)",
  earth: "rgba(201,169,110,0.55)",
  air:   "rgba(202,241,240,0.55)",
  water: "rgba(0,253,0,0.45)",
};

export const HOUSE_ELEM_FILL: Record<Element, string> = {
  fire:  "rgba(230,122,122,0.18)",
  earth: "rgba(201,169,110,0.17)",
  air:   "rgba(202,241,240,0.17)",
  water: "rgba(0,253,0,0.12)",
};

export const ALL_PLANETS = [
  {
    id: "sun", glyph: "☉", planet: "Sun", sign: "Leo", natalHouse: 4, relocatedHouse: 1,
    dignity: "DOMICILE", color: "#C9A96E",
    natalDesc: "In Jakarta, your Sun sat deep in the 4th house, emphasizing private life, roots, and home.",
    relocatedDesc: "Moved to the 1st House! In London, your core identity shines brightly and visibly. You take on a powerful public presence and leadership roles.",
  },
  {
    id: "moon", glyph: "☽", planet: "Moon", sign: "Libra", natalHouse: 6, relocatedHouse: 3,
    dignity: null, color: "#CAF1F0",
    natalDesc: "A Libra Moon in the 6th house seeks harmony and aesthetic grace in daily routines.",
    relocatedDesc: "Moved to the 3rd House! Your emotional life is now inextricably tied to communication, writing, and local community. You'll find comfort in transit and conversation.",
  },
  {
    id: "mercury", glyph: "☿", planet: "Mercury", sign: "Virgo", natalHouse: 5, relocatedHouse: 2,
    dignity: "DOMICILE", color: "#0456fb",
    natalDesc: "Mercury in the 5th house channeled your razor-sharp mind into creative, playful projects.",
    relocatedDesc: "Moved to the 2nd House! Your intellect becomes your greatest asset. Expect to successfully monetize your ideas and become highly strategic about personal resources.",
  },
  {
    id: "venus", glyph: "♀", planet: "Venus", sign: "Cancer", natalHouse: 3, relocatedHouse: 12,
    dignity: null, color: "#E67A7A",
    natalDesc: "Venus in the 3rd house deeply nurtured your daily interactions and local routines.",
    relocatedDesc: "Moved to the 12th House! Love and aesthetics become more private and spiritual. You may find peace in solitude or behind-the-scenes artistry.",
  },
  {
    id: "mars", glyph: "♂", planet: "Mars", sign: "Aries", natalHouse: 12, relocatedHouse: 9,
    dignity: "DOMICILE", color: "#D32F2F",
    natalDesc: "Mars in the 12th house operated powerfully but hidden, driving you from behind the scenes.",
    relocatedDesc: "Moved to the 9th House! Your drive is fully unleashed outward. You will aggressively pursue higher knowledge, expansive travel, and bravely publish your beliefs.",
  },
  {
    id: "jupiter", glyph: "♃", planet: "Jupiter", sign: "Gemini", natalHouse: 1, relocatedHouse: 10,
    dignity: "DETRIMENT", color: "#00FD00",
    natalDesc: "Jupiter in your 1st house projected a larger-than-life, relentlessly curious persona.",
    relocatedDesc: "Moved to the 10th House (Angular)! Massive career expansion. Your reputation grows exponentially in this city, offering huge professional opportunities.",
  },
  {
    id: "saturn", glyph: "♄", planet: "Saturn", sign: "Sagittarius", natalHouse: 8, relocatedHouse: 5,
    dignity: null, color: "#909090",
    natalDesc: "Saturn in the 8th house structured your approach to deep transformation and shared resources.",
    relocatedDesc: "Moved to the 5th House! You now take a serious, structured approach to romance, children, and creative self-expression. Fun requires discipline here.",
  },
  {
    id: "uranus", glyph: "♅", planet: "Uranus", sign: "Sagittarius", natalHouse: 8, relocatedHouse: 5,
    dignity: null, color: "#0456fb",
    natalDesc: "Uranus conjunct Saturn brought radical awakenings to your psychological depths.",
    relocatedDesc: "Moved to the 5th House! Creative rebellion. Expect sudden, electric shifts in your dating life and fiercely independent artistic projects.",
  },
  {
    id: "neptune", glyph: "♆", planet: "Neptune", sign: "Capricorn", natalHouse: 9, relocatedHouse: 6,
    dignity: null, color: "#CAF1F0",
    natalDesc: "Neptune in the 9th spiritualized your long-term visions and high philosophical ideals.",
    relocatedDesc: "Moved to the 6th House! A shift toward holistic routines. Your daily work and health regimens become deeply intuitive, though you must guard against burnout.",
  },
  {
    id: "pluto", glyph: "♇", planet: "Pluto", sign: "Scorpio", natalHouse: 7, relocatedHouse: 4,
    dignity: "DOMICILE", color: "#8E24AA",
    natalDesc: "Pluto in the 7th house brought transformative, relentless intensity to your close partnerships.",
    relocatedDesc: "Moved to the 4th House (Angular)! A massive shift. Transformation now happens at your roots. In London, your concept of 'home' undergoes profound psychological renovation.",
  },
];

// Top 4 chosen for scrolling narrative
export const PLANETS = ALL_PLANETS.filter(p => ["sun", "pluto", "jupiter", "mercury"].includes(p.id));

export const PLANET_LON_OFFSET: Record<string, number> = { saturn: -2.5, uranus: 2.5 };

export interface AcgLineConfig {
  id: string;
  planet: string;
  angle: string;
  color: string;
  glow: string;
  path: string;
  distance: string;
  importance: "exact" | "major" | "moderate" | "wide";
  description: string;
}

export const ACG_LINES: AcgLineConfig[] = [
  {
    id: "pluto-dsc",
    planet: "Pluto",
    angle: "DSC",
    color: "var(--color-planet-mars)",
    glow: "rgba(180,40,40,0.7)",
    path: "M 257 -43 L 261 -32 L 264 -21 L 267 -11 L 271 0 L 274 11 L 277 21 L 280 32 L 283 43 L 287 53 L 290 64 L 293 74 L 296 85 L 299 96 L 302 106 L 305 117 L 308 128 L 311 138 L 314 149 L 317 160 L 320 170 L 322 181 L 325 191 L 328 202 L 331 213 L 334 223 L 337 234 L 340 245 L 342 255 L 345 266 L 348 277 L 351 287 L 353 298 L 356 309 L 359 319 L 362 330 L 364 340 L 367 351 L 370 362 L 372 372 L 375 383 L 378 394 L 380 404 L 383 415 L 386 426 L 388 436 L 391 447 L 394 457 L 396 468 L 399 479 L 402 489 L 404 500 L 407 511 L 410 521 L 412 532 L 415 543 L 418 553 L 420 564 L 423 574 L 426 585 L 428 596 L 431 606 L 434 617 L 436 628 L 439 638 L 441 649 L 444 660 L 447 670 L 450 681 L 452 691 L 455 702 L 458 713 L 460 723 L 463 734 L 466 745 L 468 755 L 471 766 L 474 777 L 477 787 L 480 798 L 482 809 L 485 819 L 488 830 L 491 840 L 494 851 L 496 862 L 499 872 L 502 883 L 505 894 L 508 904 L 511 915 L 514 926 L 517 936 L 520 947 L 523 957 L 526 968 L 529 979 L 532 989 L 535 1000 L 538 1011 L 541 1021 L 544 1032 L 548 1043",
    distance: "820 km",
    importance: "major",
    description: "Pluto's Descendant sweeps near London, intensely transforming partnerships and who you draw into your life.",
  },
  {
    id: "sun-ic",
    planet: "Sun",
    angle: "IC",
    color: "var(--gold)",
    glow: "rgba(201,169,110,0.8)",
    path: "M 805 0 L 805 1000",
    distance: "2,807 km",
    importance: "wide",
    description: "The Sun IC line reveals where your core identity feels most anchored as a true home base.",
  },
];

export const IMPORTANCE_STYLES: Record<string, { bg: string; label: string }> = {
  exact:    { bg: "bg-white text-black font-bold",                             label: "EXACT ORB • <200km" },
  major:    { bg: "bg-[var(--color-y2k-blue)] text-white",                     label: "MAJOR ORB • <1000km" },
  moderate: { bg: "bg-white/10 text-white border border-white/30",             label: "MODERATE ORB • <2000km" },
  wide:     { bg: "bg-white/5 text-white/60 border border-white/10",           label: "WIDE ORB • >2000km" },
};
