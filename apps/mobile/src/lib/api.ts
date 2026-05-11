const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type GenerateReadingResponse =
  | { ok: true; readingId: string }
  | { ok: false; code: string; message: string };

export type GeocodeResult = {
  label: string;
  lat: number;
  lon: number;
};

export async function fetchMobileBootstrap(accessToken: string) {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}/api/mobile/bootstrap`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Bootstrap failed with ${response.status}`);
  }

  return response.json();
}

export async function generateReading(
  accessToken: string,
  input: Record<string, unknown>,
): Promise<GenerateReadingResponse> {
  if (!API_BASE_URL) {
    return { ok: false, code: 'MISSING_API_BASE_URL', message: 'EXPO_PUBLIC_API_BASE_URL is not configured.' };
  }

  const response = await fetch(`${API_BASE_URL}/api/readings/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    return { ok: false, code: data.code ?? 'REQUEST_FAILED', message: data.message ?? data.error ?? 'Generation failed.' };
  }

  return { ok: true, readingId: data.readingId };
}

export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}/api/geocode?city=${encodeURIComponent(query)}`);
  const data = await response.json();

  if (!response.ok || !data?.lat || !data?.lon) {
    return null;
  }

  return {
    label: data.label ?? data.display_name ?? query,
    lat: Number(data.lat),
    lon: Number(data.lon),
  };
}
