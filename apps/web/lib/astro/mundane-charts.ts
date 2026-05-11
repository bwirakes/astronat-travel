export interface CountryChart {
  slug: string;
  name: string;
  flag: string; // emoji
  founding: string; // ISO 8601 datetime
  capital: { lat: number; lon: number; city: string };
  sunSign: string; // pre-computed for display or just placeholder
  note: string; // sourcing note
}

export const COUNTRY_CHARTS: CountryChart[] = [
  // Originally from Notion
  { slug: "china", name: "People’s Republic of China", flag: "🇨🇳", founding: "1949-10-01T15:02:00+08:00", capital: { lat: 39.9, lon: 116.4, city: "Beijing" }, sunSign: "Libra", note: "Founding of the PRC" },
  { slug: "australia", name: "Australia", flag: "🇦🇺", founding: "1901-01-01T12:00:00+10:00", capital: { lat: -33.87, lon: 151.2, city: "Sydney" }, sunSign: "Capricorn", note: "Federation Proclamation" },
  { slug: "india", name: "India", flag: "🇮🇳", founding: "1947-08-15T00:00:00+05:30", capital: { lat: 28.61, lon: 77.2, city: "New Delhi" }, sunSign: "Leo", note: "Independence from British rule" },
  { slug: "iran", name: "Iran", flag: "🇮🇷", founding: "1979-04-01T15:00:00+03:30", capital: { lat: 35.68, lon: 51.38, city: "Tehran" }, sunSign: "Aries", note: "Islamic Republic Established" },
  { slug: "lebanon", name: "Lebanon", flag: "🇱🇧", founding: "1943-11-22T13:20:00+02:00", capital: { lat: 33.89, lon: 35.5, city: "Beirut" }, sunSign: "Sagittarius", note: "Independence" },
  { slug: "singapore", name: "Singapore", flag: "🇸🇬", founding: "1965-08-09T10:00:00+07:30", capital: { lat: 1.35, lon: 103.8, city: "Singapore" }, sunSign: "Leo", note: "Independence Declaration" },
  { slug: "ireland", name: "Ireland", flag: "🇮🇪", founding: "1949-04-18T00:00:00+01:00", capital: { lat: 53.34, lon: -6.26, city: "Dublin" }, sunSign: "Aries", note: "Republic of Ireland Act" },
  { slug: "pakistan", name: "Pakistan", flag: "🇵🇰", founding: "1947-08-14T00:00:00+05:30", capital: { lat: 24.86, lon: 67.0, city: "Karachi" }, sunSign: "Leo", note: "Independence" },
  { slug: "germany", name: "Germany", flag: "🇩🇪", founding: "1949-05-23T00:00:00+02:00", capital: { lat: 52.52, lon: 13.4, city: "Berlin" }, sunSign: "Gemini", note: "Basic Law (Grundgesetz)" },
  { slug: "russia", name: "Russia", flag: "🇷🇺", founding: "1999-12-08T17:27:00+03:00", capital: { lat: 55.75, lon: 37.61, city: "Moscow" }, sunSign: "Sagittarius", note: "Union State Treaty" },
  { slug: "ukraine", name: "Ukraine", flag: "🇺🇦", founding: "1991-08-24T17:55:00+03:00", capital: { lat: 50.45, lon: 30.52, city: "Kyiv" }, sunSign: "Virgo", note: "Declaration of Independence" },
  { slug: "argentina", name: "Argentina", flag: "🇦🇷", founding: "1816-07-09T14:41:00-04:00", capital: { lat: -26.8, lon: -65.2, city: "Tucuman" }, sunSign: "Cancer", note: "Declaration of Independence" },
  { slug: "iraq", name: "Iraq", flag: "🇮🇶", founding: "1958-07-14T06:30:00+03:00", capital: { lat: 33.31, lon: 44.36, city: "Baghdad" }, sunSign: "Cancer", note: "Republic Declared" },
  { slug: "kuwait", name: "Kuwait", flag: "🇰🇼", founding: "1961-06-19T14:00:00+03:00", capital: { lat: 29.37, lon: 47.97, city: "Kuwait City" }, sunSign: "Gemini", note: "Independence" },
  { slug: "france", name: "France", flag: "🇫🇷", founding: "0987-07-03T12:00:00+00:00", capital: { lat: 48.85, lon: 2.35, city: "Paris" }, sunSign: "Cancer", note: "Hugh Capet coronation" },
  { slug: "israel", name: "Israel", flag: "🇮🇱", founding: "1948-05-14T16:00:00+02:00", capital: { lat: 32.08, lon: 34.78, city: "Tel Aviv" }, sunSign: "Taurus", note: "Declaration of Independence" },
  { slug: "thailand", name: "Thailand", flag: "🇹🇭", founding: "1782-04-21T06:45:00+07:00", capital: { lat: 13.75, lon: 100.5, city: "Bangkok" }, sunSign: "Taurus", note: "Founding of Rattanakosin" },
  { slug: "indonesia", name: "Indonesia", flag: "🇮🇩", founding: "1945-08-17T10:00:00+09:00", capital: { lat: -6.2, lon: 106.8, city: "Jakarta" }, sunSign: "Leo", note: "Proclamation of Independence" },
  { slug: "canada", name: "Canada", flag: "🇨🇦", founding: "1867-07-01T00:00:00-05:00", capital: { lat: 45.42, lon: -75.69, city: "Ottawa" }, sunSign: "Cancer", note: "Confederation" },
  { slug: "uk", name: "United Kingdom", flag: "🇬🇧", founding: "1801-01-01T00:00:00+00:00", capital: { lat: 51.5, lon: -0.12, city: "London" }, sunSign: "Capricorn", note: "Acts of Union" },
  { slug: "egypt", name: "Egypt", flag: "🇪🇬", founding: "1953-06-18T23:30:00+02:00", capital: { lat: 30.04, lon: 31.23, city: "Cairo" }, sunSign: "Gemini", note: "Republic Declared" },
  { slug: "uae", name: "UAE", flag: "🇦🇪", founding: "1971-12-02T22:05:00+04:00", capital: { lat: 25.2, lon: 55.27, city: "Dubai" }, sunSign: "Sagittarius", note: "UAE Union formed" },
  { slug: "taiwan", name: "Taiwan (ROC)", flag: "🇹🇼", founding: "1945-10-25T10:00:00+08:00", capital: { lat: 25.03, lon: 121.56, city: "Taipei" }, sunSign: "Scorpio", note: "Retrocession Day" },
  { slug: "serbia", name: "Serbia", flag: "🇷🇸", founding: "1878-07-13T12:53:00+01:00", capital: { lat: 44.81, lon: 20.45, city: "Belgrade" }, sunSign: "Cancer", note: "Independence (Treaty of Berlin)" },
  { slug: "south-korea", name: "South Korea", flag: "🇰🇷", founding: "1948-08-15T12:00:00+09:00", capital: { lat: 37.56, lon: 126.97, city: "Seoul" }, sunSign: "Leo", note: "Republic Established" },
  { slug: "malaysia", name: "Malaysia", flag: "🇲🇾", founding: "1957-08-31T00:00:00+07:30", capital: { lat: 3.13, lon: 101.68, city: "Kuala Lumpur" }, sunSign: "Virgo", note: "Independence" },

  // Pre-existing entries
  { slug: "japan", name: "Japan", flag: "🇯🇵", founding: "1947-05-03T00:00:00+09:00", capital: { lat: 35.68, lon: 139.69, city: "Tokyo" }, sunSign: "Taurus", note: "Japanese Constitution enacted" },
  { slug: "usa", name: "United States", flag: "🇺🇸", founding: "1776-07-04T17:10:00-05:00", capital: { lat: 38.90, lon: -77.03, city: "Washington D.C." }, sunSign: "Cancer", note: "Sibly Chart — Declaration of Independence" },
  { slug: "spain", name: "Spain", flag: "🇪🇸", founding: "1978-12-29T00:00:00+01:00", capital: { lat: 41.38, lon: 2.17, city: "Barcelona" }, sunSign: "Capricorn", note: "Spanish Constitution" },
  { slug: "portugal", name: "Portugal", flag: "🇵🇹", founding: "1976-04-25T00:00:00+01:00", capital: { lat: 38.72, lon: -9.14, city: "Lisbon" }, sunSign: "Taurus", note: "Carnation Revolution — current republic" },
  { slug: "netherlands", name: "Netherlands", flag: "🇳🇱", founding: "1815-03-29T00:00:00+01:00", capital: { lat: 52.37, lon: 4.90, city: "Amsterdam" }, sunSign: "Aries", note: "Kingdom of the Netherlands established" },
  { slug: "denmark", name: "Denmark", flag: "🇩🇰", founding: "1849-06-05T00:00:00+01:00", capital: { lat: 55.68, lon: 12.57, city: "Copenhagen" }, sunSign: "Gemini", note: "Constitutional Monarchy established" },
  { slug: "mexico", name: "Mexico", flag: "🇲🇽", founding: "1821-09-28T00:00:00-06:00", capital: { lat: 19.43, lon: -99.13, city: "Mexico City" }, sunSign: "Libra", note: "Declaration of Independence" },
  { slug: "brazil", name: "Brazil", flag: "🇧🇷", founding: "1822-09-07T16:30:00-03:00", capital: { lat: -15.78, lon: -47.93, city: "Brasília" }, sunSign: "Virgo", note: "Cry of Ipiranga — Independence" },
  { slug: "south-africa", name: "South Africa", flag: "🇿🇦", founding: "1994-04-27T00:00:00+02:00", capital: { lat: -33.92, lon: 18.42, city: "Cape Town" }, sunSign: "Taurus", note: "First democratic election" },
  { slug: "turkey", name: "Turkey", flag: "🇹🇷", founding: "1923-10-29T20:30:00+03:00", capital: { lat: 41.01, lon: 28.95, city: "Istanbul" }, sunSign: "Scorpio", note: "Republic proclaimed by Atatürk" }
];
