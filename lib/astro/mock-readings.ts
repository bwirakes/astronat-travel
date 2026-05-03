export const MOCK_READING_DETAILS: Record<string, any> = {
  "1": {
    destination: "Tokyo, Japan",
    destinationLat: 35.6762,
    destinationLon: 139.6503,
    travelDate: "2026-05-12",
    travelType: "trip",
    macroScore: 87,
    houses: [
      { house: 1, sphere: "Identity & Self", rulerPlanet: "Mars", relocatedSign: "Aries", rulerCondition: "Domicile", score: 82, status: "Highly Favorable", breakdown: {} },
      { house: 2, sphere: "Finances & Values", rulerPlanet: "Venus", relocatedSign: "Taurus", rulerCondition: "Domicile", score: 75, status: "Highly Favorable", breakdown: {} },
      { house: 7, sphere: "Partnerships", rulerPlanet: "Mercury", relocatedSign: "Libra", rulerCondition: "Peregrine", score: 91, status: "Peak Flow", breakdown: {} },
      { house: 10, sphere: "Career & Status", rulerPlanet: "Sun", relocatedSign: "Leo", rulerCondition: "Domicile", score: 88, status: "Peak Flow", breakdown: {} },
    ],
    transitWindows: [
      { transit: "Mars Trine Natal Sun", type: "PERSONAL", start: "2026-05-10", end: "2026-05-15", recommendation: "High energy levels. Perfect for exploring the city on foot." },
      { transit: "Jupiter in Gemini", type: "MUNDANE", start: "2026-05-01", end: "2026-06-30", recommendation: "Curiosity is peak. Visit museums and cultural landmarks." },
    ],
    planetaryLines: [
      { planet: "Sun", line: "MC", distance: "12km", tier: "Strong" },
      { planet: "Venus", line: "AS", distance: "45km", tier: "Moderate" },
      { planet: "Jupiter", line: "IC", distance: "120km", tier: "Weak" },
    ],
    birth: {
      city: "Los Angeles, CA",
      lat: 34.0522,
      lon: -118.2437,
      date: "1988-08-17",
      time: "07:34 AM"
    },
    natalAngles: { ASC: 135, IC: 220, DSC: 315, MC: 40 },
    natalCusps: [135, 160, 185, 220, 250, 280, 315, 340, 5, 40, 70, 100],
    relocatedAngles: { ASC: 180, IC: 270, DSC: 0, MC: 90 },
    relocatedCusps: [180, 210, 240, 270, 300, 330, 0, 30, 60, 90, 120, 150],
    natalPlanets: [
      { name: "Sun", sign: "Leo", longitude: 145 },
      { name: "Moon", sign: "Scorpio", longitude: 228 },
      { name: "Mercury", sign: "Virgo", longitude: 156 },
      { name: "Venus", sign: "Cancer", longitude: 108 },
      { name: "Mars", sign: "Capricorn", longitude: 280 },
      { name: "Jupiter", sign: "Sagittarius", longitude: 252 },
      { name: "Saturn", sign: "Pisces", longitude: 335 },
      { name: "Uranus", sign: "Aquarius", longitude: 295 },
      { name: "Neptune", sign: "Capricorn", longitude: 282 },
      { name: "Pluto", sign: "Scorpio", longitude: 219 },
      { name: "Chiron", sign: "Libra", longitude: 190 }
    ]
  },
  "2": {
    destination: "Paris, France",
    destinationLat: 48.8566,
    destinationLon: 2.3522,
    travelDate: "2026-07-22",
    travelType: "trip",
    macroScore: 62,
    houses: [
      { house: 4, sphere: "Home & Roots", rulerPlanet: "Moon", relocatedSign: "Cancer", rulerCondition: "Domicile", score: 55, status: "Favorable", breakdown: {} },
      { house: 5, sphere: "Creativity & Joy", rulerPlanet: "Sun", relocatedSign: "Leo", rulerCondition: "Domicile", score: 70, status: "Highly Favorable", breakdown: {} },
      { house: 9, sphere: "Philosophy & Travel", rulerPlanet: "Jupiter", relocatedSign: "Sagittarius", rulerCondition: "Domicile", score: 45, status: "Neutral", breakdown: {} },
    ],
    transitWindows: [
      { transit: "Saturn Square Natal Moon", type: "PERSONAL", start: "2026-07-20", end: "2026-07-25", recommendation: "Emotional fatigue is possible. Schedule early nights." },
    ],
    planetaryLines: [
      { planet: "Saturn", line: "DSC", distance: "5km", tier: "Strong" },
      { planet: "Neptune", line: "MC", distance: "88km", tier: "Moderate" },
    ],
    birth: {
      city: "Seattle, WA",
      lat: 47.6062,
      lon: -122.3321,
      date: "1991-03-04",
      time: "11:18 PM"
    },
    natalAngles: { ASC: 24, IC: 116, DSC: 204, MC: 296 },
    natalCusps: [24, 51, 78, 116, 151, 181, 204, 231, 258, 296, 331, 1],
    relocatedAngles: { ASC: 92, IC: 184, DSC: 272, MC: 4 },
    relocatedCusps: [92, 121, 150, 184, 217, 246, 272, 301, 330, 4, 37, 66],
    natalPlanets: [
      { name: "Sun", sign: "Pisces", longitude: 344, house: 12 },
      { name: "Moon", sign: "Virgo", longitude: 168, house: 6 },
      { name: "Mercury", sign: "Aries", longitude: 6, house: 1 },
      { name: "Venus", sign: "Aquarius", longitude: 318, house: 11 },
      { name: "Mars", sign: "Gemini", longitude: 73, house: 3 },
      { name: "Jupiter", sign: "Leo", longitude: 137, house: 5 },
      { name: "Saturn", sign: "Capricorn", longitude: 288, house: 10 },
      { name: "Uranus", sign: "Capricorn", longitude: 282, house: 10 },
      { name: "Neptune", sign: "Capricorn", longitude: 286, house: 10 },
      { name: "Pluto", sign: "Scorpio", longitude: 230, house: 8 },
      { name: "Chiron", sign: "Cancer", longitude: 101, house: 4 }
    ]
  },
  "3": {
    destination: "Bali, Indonesia",
    destinationLat: -8.4095,
    destinationLon: 115.1889,
    travelDate: "2026-09-01",
    travelType: "relocation",
    macroScore: 91,
    houses: [
      { house: 1, sphere: "Identity & Self", rulerPlanet: "Jupiter", relocatedSign: "Pisces", rulerCondition: "Domicile", score: 95, status: "Peak Flow", breakdown: {} },
      { house: 6, sphere: "Health & Service", rulerPlanet: "Mercury", relocatedSign: "Virgo", rulerCondition: "Domicile", score: 88, status: "Highly Favorable", breakdown: {} },
      { house: 11, sphere: "Community", rulerPlanet: "Uranus", relocatedSign: "Aquarius", rulerCondition: "Peregrine", score: 92, status: "Peak Flow", breakdown: {} },
    ],
    transitWindows: [
      { transit: "Jupiter Sextile Natal Neptune", type: "PERSONAL", start: "2026-08-25", end: "2026-09-10", recommendation: "Dreamy, expansive energy. Ideal for meditation and creative work." },
    ],
    planetaryLines: [
      { planet: "Jupiter", line: "AS", distance: "8km", tier: "Strong" },
      { planet: "Venus", line: "MC", distance: "22km", tier: "Strong" },
    ],
    birth: {
      city: "Toronto, Canada",
      lat: 43.6532,
      lon: -79.3832,
      date: "1985-11-21",
      time: "04:42 AM"
    },
    natalAngles: { ASC: 212, IC: 302, DSC: 32, MC: 122 },
    natalCusps: [212, 240, 269, 302, 334, 2, 32, 60, 89, 122, 154, 182],
    relocatedAngles: { ASC: 356, IC: 86, DSC: 176, MC: 266 },
    relocatedCusps: [356, 25, 55, 86, 116, 146, 176, 205, 235, 266, 296, 326],
    natalPlanets: [
      { name: "Sun", sign: "Scorpio", longitude: 239, house: 2 },
      { name: "Moon", sign: "Pisces", longitude: 351, house: 5 },
      { name: "Mercury", sign: "Sagittarius", longitude: 252, house: 2 },
      { name: "Venus", sign: "Libra", longitude: 205, house: 12 },
      { name: "Mars", sign: "Virgo", longitude: 164, house: 10 },
      { name: "Jupiter", sign: "Aquarius", longitude: 312, house: 4 },
      { name: "Saturn", sign: "Scorpio", longitude: 236, house: 2 },
      { name: "Uranus", sign: "Sagittarius", longitude: 255, house: 2 },
      { name: "Neptune", sign: "Capricorn", longitude: 272, house: 3 },
      { name: "Pluto", sign: "Scorpio", longitude: 216, house: 1 },
      { name: "Chiron", sign: "Gemini", longitude: 78, house: 8 }
    ]
  },

  // ─── Demo synastry reading — exercises the new CouplesReadingView ───────────
  // Hit /reading/couples-demo?demo=true to preview the migrated /reading/[id]
  // path without authenticating.
  "couples-demo": {
    category: "synastry",
    destination: "Lisbon, Portugal",
    destinationLat: 38.72,
    destinationLon: -9.14,
    travelDate: "2026-09-01",
    travelType: "trip",
    goals: ["love", "career"],
    macroScore: 78,
    macroVerdict: "Productive",
    userMacroScore: 78,
    userMacroVerdict: "Productive",
    partnerMacroScore: 64,
    partnerMacroVerdict: "Mixed",
    partnerName: "Sam",
    scoreDelta: 14,
    natalPlanets: [
      { name: "Sun",     longitude: 144.92 }, { name: "Moon",    longitude: 200.48 },
      { name: "Mercury", longitude: 158.88 }, { name: "Venus",   longitude: 99.26  },
      { name: "Mars",    longitude: 10.91  }, { name: "Jupiter", longitude: 63.85  },
      { name: "Saturn",  longitude: 266.06 }, { name: "Uranus",  longitude: 267.19 },
      { name: "Neptune", longitude: 277.69 }, { name: "Pluto",   longitude: 219.99 },
    ],
    partnerNatalPlanets: [
      { name: "Sun",     longitude: 95.4  }, { name: "Moon",    longitude: 12.6  },
      { name: "Mercury", longitude: 88.1  }, { name: "Venus",   longitude: 110.5 },
      { name: "Mars",    longitude: 305.7 }, { name: "Jupiter", longitude: 178.2 },
      { name: "Saturn",  longitude: 224.4 }, { name: "Uranus",  longitude: 245.0 },
      { name: "Neptune", longitude: 290.1 }, { name: "Pluto",   longitude: 230.8 },
    ],
    relocatedCusps:        [104, 134, 164, 194, 224, 254, 284, 314, 344, 14, 44, 74],
    userRelocatedCusps:    [104, 134, 164, 194, 224, 254, 284, 314, 344, 14, 44, 74],
    partnerRelocatedCusps: [338, 8, 38, 68, 98, 128, 158, 188, 218, 248, 278, 308],
    eventScores: [
      { eventName: "Identity & Self-Discovery",   baseVolume: 65, affinityModifier: 6, finalScore: 71, verdict: "Productive" },
      { eventName: "Wealth & Financial Growth",   baseVolume: 60, affinityModifier: 4, finalScore: 64, verdict: "Productive" },
      { eventName: "Home, Family & Roots",        baseVolume: 50, affinityModifier: 2, finalScore: 52, verdict: "Mixed" },
      { eventName: "Romance & Love",              baseVolume: 78, affinityModifier: 4, finalScore: 82, verdict: "Highly Productive" },
      { eventName: "Health, Routine & Wellness",  baseVolume: 56, affinityModifier: 4, finalScore: 60, verdict: "Mixed" },
      { eventName: "Partnerships & Marriage",     baseVolume: 74, affinityModifier: 5, finalScore: 79, verdict: "Productive" },
      { eventName: "Career & Public Recognition", baseVolume: 80, affinityModifier: 6, finalScore: 86, verdict: "Highly Productive" },
      { eventName: "Friendship & Networking",     baseVolume: 52, affinityModifier: 3, finalScore: 55, verdict: "Mixed" },
      { eventName: "Spirituality & Inner Peace",  baseVolume: 45, affinityModifier: 3, finalScore: 48, verdict: "Challenging" },
    ],
    partnerEventScores: [
      { eventName: "Identity & Self-Discovery",   baseVolume: 54, affinityModifier: 4, finalScore: 58, verdict: "Mixed" },
      { eventName: "Wealth & Financial Growth",   baseVolume: 46, affinityModifier: 3, finalScore: 49, verdict: "Challenging" },
      { eventName: "Home, Family & Roots",        baseVolume: 76, affinityModifier: 5, finalScore: 81, verdict: "Highly Productive" },
      { eventName: "Romance & Love",              baseVolume: 72, affinityModifier: 4, finalScore: 76, verdict: "Productive" },
      { eventName: "Health, Routine & Wellness",  baseVolume: 64, affinityModifier: 4, finalScore: 68, verdict: "Productive" },
      { eventName: "Partnerships & Marriage",     baseVolume: 68, affinityModifier: 4, finalScore: 72, verdict: "Productive" },
      { eventName: "Career & Public Recognition", baseVolume: 38, affinityModifier: 3, finalScore: 41, verdict: "Challenging" },
      { eventName: "Friendship & Networking",     baseVolume: 60, affinityModifier: 3, finalScore: 63, verdict: "Mixed" },
      { eventName: "Spirituality & Inner Peace",  baseVolume: 66, affinityModifier: 4, finalScore: 70, verdict: "Productive" },
    ],
    synastryAspects: [
      { planet1: "venus", planet2: "sun",     aspect: "trine",      orb: 1.2, tone: "harmonious" },
      { planet1: "moon",  planet2: "venus",   aspect: "sextile",    orb: 2.1, tone: "harmonious" },
      { planet1: "sun",   planet2: "jupiter", aspect: "trine",      orb: 3.4, tone: "harmonious" },
      { planet1: "mars",  planet2: "saturn",  aspect: "square",     orb: 0.8, tone: "tense" },
      { planet1: "mercury", planet2: "mars",  aspect: "opposition", orb: 1.6, tone: "tense" },
    ],
    narrative: {
      verdict: {
        bestWindows: [
          "Apr 12–28 2026 — Venus over Lisbon's geodetic ASC",
          "May 9–22 2026 — Jupiter trine your composite Sun",
          "Sep 4–17 2026 — New Moon on Sam's IC",
        ],
        avoidWindows: [
          "Jul 18–25 2026 — Mars square composite Saturn (logistical friction)",
        ],
      },
    },
    birth: { city: "Los Angeles, CA", lat: 34.0522, lon: -118.2437, date: "1988-08-17", time: "07:34 AM" },
  },
};
