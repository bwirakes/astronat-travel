const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
const USER_AGENT = "AstroNat-Travel-App/1.0";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
}

export interface CitySuggestion {
  label: string;
  lat: number;
  lon: number;
  type: string;
}

type MapboxFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    full_address?: string;
    name?: string;
    place_formatted?: string;
    feature_type?: string;
  };
};

type NominatimPlace = {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  type?: string;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

function uniqueSuggestions(suggestions: CitySuggestion[]): CitySuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.label.toLowerCase()}|${suggestion.lat.toFixed(4)}|${suggestion.lon.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compactLabel(parts: Array<string | undefined>): string {
  const normalized = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return normalized.filter((part, index, all) => index === 0 || part !== all[index - 1]).join(", ");
}

function suggestionFromMapbox(feature: MapboxFeature): CitySuggestion | null {
  const coords = feature.geometry?.coordinates;
  if (!coords) return null;

  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const properties = feature.properties ?? {};
  const label = properties.full_address || compactLabel([properties.name, properties.place_formatted]);
  if (!label) return null;

  return {
    label,
    lat,
    lon,
    type: properties.feature_type || "place",
  };
}

function suggestionFromNominatim(place: NominatimPlace): CitySuggestion | null {
  const lat = Number.parseFloat(place.lat ?? "");
  const lon = Number.parseFloat(place.lon ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const address = place.address ?? {};
  const label = compactLabel([
    place.name || address.city || address.town || address.village || address.municipality,
    address.state || address.county,
    address.country,
  ]) || place.display_name || "";

  if (!label) return null;

  return {
    label,
    lat,
    lon,
    type: place.addresstype || place.type || "place",
  };
}

async function mapboxSuggestions(query: string, limit: number): Promise<CitySuggestion[]> {
  if (!MAPBOX_TOKEN) return [];

  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_TOKEN,
    limit: String(limit),
    language: "en",
    types: "place,locality,neighborhood,address",
  });
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, {
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) return [];

  const data = await response.json() as { features?: MapboxFeature[] };
  return uniqueSuggestions((data.features ?? []).map(suggestionFromMapbox).filter((item): item is CitySuggestion => Boolean(item)));
}

async function nominatimSuggestions(query: string, limit: number): Promise<CitySuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    "accept-language": "en",
    limit: String(limit),
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) return [];

  const data = await response.json() as NominatimPlace[];
  return uniqueSuggestions(data.map(suggestionFromNominatim).filter((item): item is CitySuggestion => Boolean(item)));
}

export async function searchCitySuggestions(query: string, limit = 6): Promise<CitySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const mapboxResults = await mapboxSuggestions(trimmed, limit).catch(() => []);
  if (mapboxResults.length > 0) return mapboxResults.slice(0, limit);

  return nominatimSuggestions(trimmed, limit).catch(() => []);
}

/**
 * Geocodes a city name. Uses Mapbox when configured and falls back to
 * Nominatim so local/dev QA still works without a Mapbox token.
 */
export async function geocodeCity(query: string): Promise<GeocodeResult> {
  const suggestions = await searchCitySuggestions(query, 1);
  const first = suggestions[0];

  if (!first) {
    throw new Error(`Location not found: ${query}`);
  }

  return {
    latitude: first.lat,
    longitude: first.lon,
    address: first.label,
  };
}
