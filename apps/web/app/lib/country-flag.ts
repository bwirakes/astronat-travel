/**
 * Country flag lookup for destination strings.
 *
 * Two-stage match: first try the comma-tail (e.g. "Hungary" in
 * "Budapest, Hungary"), then fall back to a city → country map for
 * common destinations. Returns the regional-indicator emoji and the
 * canonical country name.
 */

const COUNTRY_TO_ISO: Record<string, string> = {
  afghanistan: "AF", albania: "AL", algeria: "DZ", andorra: "AD", angola: "AO",
  argentina: "AR", armenia: "AM", aruba: "AW", australia: "AU", austria: "AT",
  azerbaijan: "AZ", bahamas: "BS", bahrain: "BH", bangladesh: "BD", barbados: "BB",
  belarus: "BY", belgium: "BE", belize: "BZ", benin: "BJ", bermuda: "BM",
  bhutan: "BT", bolivia: "BO", "bosnia and herzegovina": "BA", bosnia: "BA",
  botswana: "BW", brazil: "BR", brunei: "BN", bulgaria: "BG", "burkina faso": "BF",
  burundi: "BI", cambodia: "KH", cameroon: "CM", canada: "CA", "cape verde": "CV",
  "cayman islands": "KY", chad: "TD", chile: "CL", china: "CN", colombia: "CO",
  "costa rica": "CR", "côte d'ivoire": "CI", "ivory coast": "CI", croatia: "HR",
  cuba: "CU", curaçao: "CW", curacao: "CW", cyprus: "CY", "czech republic": "CZ",
  czechia: "CZ", "democratic republic of the congo": "CD", denmark: "DK",
  djibouti: "DJ", dominica: "DM", "dominican republic": "DO", ecuador: "EC",
  egypt: "EG", "el salvador": "SV", "equatorial guinea": "GQ", eritrea: "ER",
  estonia: "EE", eswatini: "SZ", swaziland: "SZ", ethiopia: "ET",
  "faroe islands": "FO", fiji: "FJ", finland: "FI", france: "FR",
  "french polynesia": "PF", gabon: "GA", gambia: "GM", georgia: "GE",
  germany: "DE", ghana: "GH", gibraltar: "GI", greece: "GR", greenland: "GL",
  grenada: "GD", guam: "GU", guatemala: "GT", guinea: "GN", "guinea-bissau": "GW",
  guyana: "GY", haiti: "HT", honduras: "HN", "hong kong": "HK", hungary: "HU",
  iceland: "IS", india: "IN", indonesia: "ID", iran: "IR", iraq: "IQ",
  ireland: "IE", israel: "IL", italy: "IT", jamaica: "JM", japan: "JP",
  jordan: "JO", kazakhstan: "KZ", kenya: "KE", kiribati: "KI", kosovo: "XK",
  kuwait: "KW", kyrgyzstan: "KG", laos: "LA", latvia: "LV", lebanon: "LB",
  lesotho: "LS", liberia: "LR", libya: "LY", liechtenstein: "LI",
  lithuania: "LT", luxembourg: "LU", macau: "MO", macao: "MO", madagascar: "MG",
  malawi: "MW", malaysia: "MY", maldives: "MV", mali: "ML", malta: "MT",
  mauritania: "MR", mauritius: "MU", mexico: "MX", moldova: "MD", monaco: "MC",
  mongolia: "MN", montenegro: "ME", morocco: "MA", mozambique: "MZ",
  myanmar: "MM", burma: "MM", namibia: "NA", nepal: "NP", netherlands: "NL",
  holland: "NL", "new zealand": "NZ", nicaragua: "NI", niger: "NE",
  nigeria: "NG", "north korea": "KP", "north macedonia": "MK", macedonia: "MK",
  norway: "NO", oman: "OM", pakistan: "PK", palau: "PW", palestine: "PS",
  panama: "PA", "papua new guinea": "PG", paraguay: "PY", peru: "PE",
  philippines: "PH", poland: "PL", portugal: "PT", "puerto rico": "PR",
  qatar: "QA", "republic of the congo": "CG", congo: "CG", romania: "RO",
  russia: "RU", "russian federation": "RU", rwanda: "RW", "saint lucia": "LC",
  samoa: "WS", "san marino": "SM", "saudi arabia": "SA", senegal: "SN",
  serbia: "RS", seychelles: "SC", "sierra leone": "SL", singapore: "SG",
  slovakia: "SK", slovenia: "SI", somalia: "SO", "south africa": "ZA",
  "south korea": "KR", korea: "KR", "south sudan": "SS", spain: "ES",
  "sri lanka": "LK", sudan: "SD", suriname: "SR", sweden: "SE",
  switzerland: "CH", syria: "SY", taiwan: "TW", tajikistan: "TJ",
  tanzania: "TZ", thailand: "TH", "timor-leste": "TL", "east timor": "TL",
  togo: "TG", tonga: "TO", "trinidad and tobago": "TT", tunisia: "TN",
  turkey: "TR", türkiye: "TR", turkiye: "TR", turkmenistan: "TM", tuvalu: "TV",
  uganda: "UG", ukraine: "UA", "united arab emirates": "AE", uae: "AE",
  "united kingdom": "GB", uk: "GB", britain: "GB", "great britain": "GB",
  england: "GB", scotland: "GB", wales: "GB", "northern ireland": "GB",
  "united states": "US", "united states of america": "US", usa: "US",
  america: "US", uruguay: "UY", uzbekistan: "UZ", vanuatu: "VU",
  "vatican city": "VA", venezuela: "VE", vietnam: "VN", "viet nam": "VN",
  yemen: "YE", zambia: "ZM", zimbabwe: "ZW",
};

const CITY_TO_ISO: Record<string, string> = {
  amsterdam: "NL", athens: "GR", auckland: "NZ", "abu dhabi": "AE",
  bali: "ID", bangalore: "IN", bangkok: "TH", barcelona: "ES", beijing: "CN",
  beirut: "LB", belgrade: "RS", berlin: "DE", bogotá: "CO", bogota: "CO",
  boston: "US", brisbane: "AU", brussels: "BE", bucharest: "RO", budapest: "HU",
  "buenos aires": "AR", cairo: "EG", "cape town": "ZA", caracas: "VE",
  casablanca: "MA", chicago: "US", "chiang mai": "TH", copenhagen: "DK",
  dakar: "SN", dallas: "US", delhi: "IN", "new delhi": "IN", denver: "US",
  doha: "QA", dubai: "AE", dublin: "IE", edinburgh: "GB", florence: "IT",
  geneva: "CH", glasgow: "GB", "guatemala city": "GT", hamburg: "DE",
  hanoi: "VN", havana: "CU", helsinki: "FI", "ho chi minh city": "VN",
  "hong kong": "HK", honolulu: "US", houston: "US", istanbul: "TR",
  jakarta: "ID", jerusalem: "IL", johannesburg: "ZA", kabul: "AF", karachi: "PK",
  kathmandu: "NP", "kuala lumpur": "MY", kyiv: "UA", kiev: "UA", kyoto: "JP",
  lagos: "NG", "la paz": "BO", lima: "PE", lisbon: "PT", london: "GB",
  "los angeles": "US", luxembourg: "LU", madrid: "ES", manchester: "GB",
  manila: "PH", marrakech: "MA", marseille: "FR", melbourne: "AU",
  "mexico city": "MX", miami: "US", milan: "IT", minsk: "BY", monaco: "MC",
  montevideo: "UY", montreal: "CA", moscow: "RU", mumbai: "IN", munich: "DE",
  nairobi: "KE", naples: "IT", nashville: "US", "new orleans": "US",
  "new york": "US", nice: "FR", oslo: "NO", osaka: "JP", "panama city": "PA",
  paris: "FR", perth: "AU", phuket: "TH", portland: "US", prague: "CZ",
  pyongyang: "KP", quito: "EC", rabat: "MA", reykjavik: "IS",
  "rio de janeiro": "BR", riyadh: "SA", rome: "IT", "san francisco": "US",
  "san juan": "PR", santiago: "CL", "santo domingo": "DO", "são paulo": "BR",
  "sao paulo": "BR", sarajevo: "BA", seattle: "US", seoul: "KR", shanghai: "CN",
  singapore: "SG", sofia: "BG", stockholm: "SE", sydney: "AU", taipei: "TW",
  tallinn: "EE", "tel aviv": "IL", tehran: "IR", tirana: "AL", tokyo: "JP",
  toronto: "CA", tunis: "TN", "ulaanbaatar": "MN", vancouver: "CA",
  vienna: "AT", vilnius: "LT", warsaw: "PL", "washington": "US",
  "washington dc": "US", wellington: "NZ", yerevan: "AM", zagreb: "HR",
  zurich: "CH",
};

function isoToFlag(iso: string): string {
  const code = iso.toUpperCase();
  if (code.length !== 2) return "";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + (code.charCodeAt(0) - 65), A + (code.charCodeAt(1) - 65));
}

function lookupIso(name: string): string | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return COUNTRY_TO_ISO[key] ?? CITY_TO_ISO[key] ?? null;
}

export interface DestinationFlag {
  emoji: string;
  iso: string;
}

/** Resolve a flag for a destination string like "Budapest, Hungary" or "Tokyo".
 *  Tries the trailing comma-segment first (most likely the country), then each
 *  preceding segment, then the leading city as a final fallback. */
export function destinationFlag(destination: string | null | undefined): DestinationFlag | null {
  if (!destination) return null;
  const parts = destination.split(",").map((p) => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const iso = lookupIso(parts[i]);
    if (iso) return { emoji: isoToFlag(iso), iso };
  }
  return null;
}
