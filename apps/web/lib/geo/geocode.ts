const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Geocodes a city name using Mapbox Geocoding Search API v6.
 */
export async function geocodeCity(query: string): Promise<GeocodeResult> {
  if (!MAPBOX_TOKEN) {
    // Fallback to a mock for now if no token is provided to prevent crashes
    console.warn("MAPBOX_ACCESS_TOKEN not found. Using mock fallback for geocoding.");
    if (query.toLowerCase().includes("singapore")) {
      return { latitude: 1.3521, longitude: 103.8198, address: "Singapore" };
    }
    throw new Error("Mapbox token missing. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local");
  }

  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error(`Location not found: ${query}`);
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.geometry.coordinates;
    const address = feature.properties.full_address || feature.properties.name;

    return { latitude, longitude, address };
  } catch (error: any) {
    throw new Error(`Geocoding error: ${error.message}`);
  }
}
