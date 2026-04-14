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
    ]
  }
};
