export interface CountryChart {
  slug: string;
  name: string;
  flag: string; // emoji
  founding: string; // ISO 8601 datetime
  capital: { lat: number; lon: number; city: string };
  sunSign: string; // pre-computed for display
  note: string; // sourcing note
}

export const COUNTRY_CHARTS: CountryChart[] = [
  { slug: "japan", name: "Japan", flag: "🇯🇵", founding: "1947-05-03T00:00:00+09:00", capital: { lat: 35.68, lon: 139.69, city: "Tokyo" }, sunSign: "Taurus", note: "Japanese Constitution enacted" },
  { slug: "usa", name: "United States", flag: "🇺🇸", founding: "1776-07-04T17:10:00-05:00", capital: { lat: 38.90, lon: -77.03, city: "Washington D.C." }, sunSign: "Cancer", note: "Sibly Chart — Declaration of Independence" },
  { slug: "france", name: "France", flag: "🇫🇷", founding: "1958-10-04T00:00:00+01:00", capital: { lat: 48.85, lon: 2.35, city: "Paris" }, sunSign: "Libra", note: "5th Republic Constitution" },
  { slug: "germany", name: "Germany", flag: "🇩🇪", founding: "1949-05-23T00:00:00+01:00", capital: { lat: 52.52, lon: 13.40, city: "Berlin" }, sunSign: "Gemini", note: "Basic Law (Grundgesetz)" },
  { slug: "uk", name: "United Kingdom", flag: "🇬🇧", founding: "1801-01-01T00:00:00+00:00", capital: { lat: 51.50, lon: -0.12, city: "London" }, sunSign: "Capricorn", note: "Acts of Union — Great Britain + Ireland" },
  { slug: "australia", name: "Australia", flag: "🇦🇺", founding: "1901-01-01T13:35:00+10:00", capital: { lat: -33.87, lon: 151.21, city: "Sydney" }, sunSign: "Capricorn", note: "Federation Proclamation" },
  { slug: "india", name: "India", flag: "🇮🇳", founding: "1947-08-15T00:00:00+05:30", capital: { lat: 28.61, lon: 77.20, city: "New Delhi" }, sunSign: "Leo", note: "Independence from British rule" },
  { slug: "singapore", name: "Singapore", flag: "🇸🇬", founding: "1965-08-09T10:00:00+08:00", capital: { lat: 1.35, lon: 103.82, city: "Singapore" }, sunSign: "Leo", note: "Independence Declaration" },
  { slug: "uae", name: "UAE", flag: "🇦🇪", founding: "1971-12-02T00:00:00+04:00", capital: { lat: 25.20, lon: 55.27, city: "Dubai" }, sunSign: "Sagittarius", note: "UAE Union formed" },
  { slug: "spain", name: "Spain", flag: "🇪🇸", founding: "1978-12-29T00:00:00+01:00", capital: { lat: 41.38, lon: 2.17, city: "Barcelona" }, sunSign: "Capricorn", note: "Spanish Constitution" },
  { slug: "portugal", name: "Portugal", flag: "🇵🇹", founding: "1976-04-25T00:00:00+01:00", capital: { lat: 38.72, lon: -9.14, city: "Lisbon" }, sunSign: "Taurus", note: "Carnation Revolution — current republic" },
  { slug: "netherlands", name: "Netherlands", flag: "🇳🇱", founding: "1815-03-29T00:00:00+01:00", capital: { lat: 52.37, lon: 4.90, city: "Amsterdam" }, sunSign: "Aries", note: "Kingdom of the Netherlands established" },
  { slug: "denmark", name: "Denmark", flag: "🇩🇰", founding: "1849-06-05T00:00:00+01:00", capital: { lat: 55.68, lon: 12.57, city: "Copenhagen" }, sunSign: "Gemini", note: "Constitutional Monarchy established" },
  { slug: "mexico", name: "Mexico", flag: "🇲🇽", founding: "1821-09-28T00:00:00-06:00", capital: { lat: 19.43, lon: -99.13, city: "Mexico City" }, sunSign: "Libra", note: "Declaration of Independence" },
  { slug: "brazil", name: "Brazil", flag: "🇧🇷", founding: "1822-09-07T16:30:00-03:00", capital: { lat: -15.78, lon: -47.93, city: "Brasília" }, sunSign: "Virgo", note: "Cry of Ipiranga — Independence" },
  { slug: "argentina", name: "Argentina", flag: "🇦🇷", founding: "1816-07-09T00:00:00-03:00", capital: { lat: -34.60, lon: -58.38, city: "Buenos Aires" }, sunSign: "Cancer", note: "Declaration of Independence" },
  { slug: "south-africa", name: "South Africa", flag: "🇿🇦", founding: "1994-04-27T00:00:00+02:00", capital: { lat: -33.92, lon: 18.42, city: "Cape Town" }, sunSign: "Taurus", note: "First democratic election" },
  { slug: "turkey", name: "Turkey", flag: "🇹🇷", founding: "1923-10-29T20:30:00+03:00", capital: { lat: 41.01, lon: 28.95, city: "Istanbul" }, sunSign: "Scorpio", note: "Republic proclaimed by Atatürk" },
  { slug: "thailand", name: "Thailand", flag: "🇹🇭", founding: "1932-06-24T06:00:00+07:00", capital: { lat: 13.75, lon: 100.52, city: "Bangkok" }, sunSign: "Cancer", note: "Constitutional Monarchy established" },
  { slug: "indonesia", name: "Indonesia", flag: "🇮🇩", founding: "1945-08-17T10:00:00+07:00", capital: { lat: -8.34, lon: 115.09, city: "Bali" }, sunSign: "Leo", note: "Proclamation of Independence" },
];
