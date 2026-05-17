import type { AtlasPin } from "@/app/components/ReadingsAtlasMap";
import { TYPE_TOKEN } from "@/app/lib/geodetic/weather-predictions";
import type { GeodeticWeatherEvent, WeatherEventType } from "@/app/lib/geodetic/weather-types";

type Coordinate = { lat: number; lon: number };

const FORECAST_COORDINATES_BY_DATE: Record<string, Coordinate> = {
  "2026-02-17": { lat: 7, lon: 0 },
  "2026-03-03": { lat: -36, lon: 170 },
  "2026-04-21": { lat: 41, lon: 8 },
  "2026-04-25": { lat: 31.5, lon: 64.5 },
  "2026-05-05": { lat: 27, lon: 24 },
  "2026-05-19": { lat: 41, lon: 8 },
  "2026-06-02": { lat: 22, lon: -88 },
  "2026-06-16": { lat: 31, lon: 150 },
  "2026-06-19": { lat: 39, lon: 32 },
  "2026-06-21": { lat: 27, lon: 31 },
  "2026-06-30": { lat: 34, lon: 135 },
  "2026-07-07": { lat: 40.2, lon: 65 },
  "2026-07-21": { lat: 34, lon: 135 },
  "2026-08-04": { lat: 22, lon: -88 },
  "2026-08-12": { lat: 35, lon: 140 },
  "2026-08-28": { lat: 35, lon: -25 },
  "2026-09-01": { lat: 14, lon: 104 },
  "2026-09-22": { lat: -17, lon: 179 },
  "2026-10-06": { lat: 42, lon: 3 },
  "2026-10-20": { lat: 8, lon: 56 },
  "2026-11-03": { lat: 33.5, lon: 64 },
  "2026-11-17": { lat: 14, lon: 104 },
  "2026-12-01": { lat: 33.5, lon: 64 },
};

const ZONE_COORDINATES: Array<{ test: RegExp; coordinate: Coordinate }> = [
  { test: /pakistan\s*\/\s*afghanistan\s*\/\s*iran/i, coordinate: { lat: 31.5, lon: 64.5 } },
  { test: /pakistan\s*\/\s*afghanistan\s*\/\s*kazakhstan/i, coordinate: { lat: 40.2, lon: 65 } },
  { test: /pakistan\s*\/\s*afghanistan/i, coordinate: { lat: 33.5, lon: 64 } },
  { test: /afghanistan\s*\/\s*nw india|afghanistan\s*\/\s*pakistan/i, coordinate: { lat: 32.5, lon: 69 } },
  { test: /nw india/i, coordinate: { lat: 29.5, lon: 73 } },
  { test: /iran\s*\/\s*kazakhstan/i, coordinate: { lat: 41, lon: 60 } },
  { test: /russia.*urals.*kazakhstan|urals.*kazakhstan/i, coordinate: { lat: 52, lon: 60 } },
  { test: /ethiopia\s*\/\s*iran\s*\/\s*pakistan/i, coordinate: { lat: 24, lon: 56 } },
  { test: /ethiopia\s*\/\s*pakistan/i, coordinate: { lat: 20, lon: 56 } },
  { test: /ethiopia|east africa|kenya|tanzania/i, coordinate: { lat: 2, lon: 38 } },
  { test: /turkey\s*\/\s*east africa|turkey\s*\/\s*egypt/i, coordinate: { lat: 27, lon: 31 } },
  { test: /germany\s*\/\s*italy\s*\/\s*algeria/i, coordinate: { lat: 41, lon: 8 } },
  { test: /germany\s*\/\s*italy/i, coordinate: { lat: 45, lon: 8 } },
  { test: /italy\s*\/\s*albania\s*\/\s*libya|n\.italy\s*\/\s*greece\s*\/\s*albania|s\.italy\s*\/\s*libya/i, coordinate: { lat: 39, lon: 15 } },
  { test: /greece\s*\/\s*romania\s*\/\s*libya|greece\s*\/\s*libya/i, coordinate: { lat: 35, lon: 23 } },
  { test: /romania\s*\/\s*libya\s*\/\s*egypt/i, coordinate: { lat: 31, lon: 24 } },
  { test: /uk\s*\/\s*ghana\s*\/\s*nigeria/i, coordinate: { lat: 7, lon: 0 } },
  { test: /uk\s*\/\s*france\s*\/\s*algeria/i, coordinate: { lat: 42, lon: 3 } },
  { test: /portugal\s*\/\s*morocco|portugal\s*\/\s*nw africa|azores\s*\/\s*morocco/i, coordinate: { lat: 33, lon: -9 } },
  { test: /azores\s*\/\s*portugal|atlantic\s*\/\s*portugal|canary islands/i, coordinate: { lat: 35, lon: -25 } },
  { test: /spain\s*\/\s*nw africa|valencia|se spain/i, coordinate: { lat: 39, lon: -1 } },
  { test: /new zealand|eastern australia\s*\/\s*new zealand/i, coordinate: { lat: -36, lon: 170 } },
  { test: /japan\s*\/\s*eastern australia|china.*korea.*japan|china coast|japan\s*\/\s*philippines/i, coordinate: { lat: 31, lon: 135 } },
  { test: /philippines\s*\/\s*eastern australia|philippines\s*\/\s*s\.china sea|indonesia\s*\/\s*philippines/i, coordinate: { lat: 7, lon: 123 } },
  { test: /thailand\s*\/\s*vietnam\s*\/\s*cambodia|thailand\s*\/\s*vietnam\s*\/\s*malaysia|se asia/i, coordinate: { lat: 14, lon: 104 } },
  { test: /bay of bengal|bangladesh|india\s*\/\s*se asia/i, coordinate: { lat: 20, lon: 90 } },
  { test: /caribbean\s*\/\s*gulf|caribbean|gulf of mexico/i, coordinate: { lat: 22, lon: -88 } },
  { test: /atlantic hurricane|atlantic basin/i, coordinate: { lat: 24, lon: -55 } },
  { test: /california\s*\/\s*sw usa|california\s*\/\s*pacific coast/i, coordinate: { lat: 36, lon: -120 } },
  { test: /us great plains|tornado alley/i, coordinate: { lat: 37, lon: -98 } },
  { test: /hawaii/i, coordinate: { lat: 20, lon: -157 } },
  { test: /w\.mexico|central america/i, coordinate: { lat: 17, lon: -102 } },
  { test: /pacific islands|samoa|fiji/i, coordinate: { lat: -17, lon: 179 } },
  { test: /mediterranean fire belt/i, coordinate: { lat: 38, lon: 22 } },
  { test: /global/i, coordinate: { lat: 0, lon: 0 } },
];

function coordinateForEvent(event: GeodeticWeatherEvent): Coordinate {
  const explicit = FORECAST_COORDINATES_BY_DATE[event.date];
  if (explicit) return explicit;

  const zoneText = event.zones.join(" | ");
  const match = ZONE_COORDINATES.find((entry) => entry.test.test(zoneText));
  if (match) return match.coordinate;

  return { lat: 0, lon: 0 };
}

export function weatherTypeLabel(type: WeatherEventType): string {
  return TYPE_TOKEN[type].label;
}

export function weatherEventScore(event: GeodeticWeatherEvent): number {
  return Math.round(event.pss * 100);
}

/** Max chars for a pin's destination label so it never overflows the SVG. */
const PIN_LABEL_MAX = 30;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export function weatherDestinationLabel(event: GeodeticWeatherEvent): string {
  const zone = event.zones[0]?.split("(")[0]?.trim();
  return truncate(zone || event.title, PIN_LABEL_MAX);
}

/** True if the event has a real (non-default) coordinate. Use this to decide
 *  whether to render the map at all — otherwise the pin lands at (0, 0) in
 *  the Atlantic and confuses readers. */
export function eventHasMappableLocation(event: GeodeticWeatherEvent): boolean {
  const explicit = FORECAST_COORDINATES_BY_DATE[event.date];
  if (explicit) return true;
  const zoneText = event.zones.join(" | ");
  return ZONE_COORDINATES.some((entry) => entry.test.test(zoneText));
}

export function weatherEventToAtlasPin(event: GeodeticWeatherEvent): AtlasPin {
  const coordinate = coordinateForEvent(event);
  return {
    id: event.id,
    destination: weatherDestinationLabel(event),
    lat: coordinate.lat,
    lon: coordinate.lon,
    score: weatherEventScore(event),
    travelDate: event.date,
    travelType: weatherTypeLabel(event.type),
  };
}
