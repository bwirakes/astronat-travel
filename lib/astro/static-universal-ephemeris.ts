import rawUniversalEphemeris from "./data/universal-ephemeris-2024-2035.json";
import { ZODIAC_SIGNS } from "./transits";
import { type CachedSkyPosition } from "./ephemeris-cache";

type StaticUniversalEphemeris = {
  startDate: string;
  endDate: string;
  bodies: string[];
  days: Array<Array<[number, number]>>;
};

const MS_DAY = 86_400_000;
const UNIVERSAL_EPHEMERIS = rawUniversalEphemeris as unknown as StaticUniversalEphemeris;
const BODY_INDEX = new Map(UNIVERSAL_EPHEMERIS.bodies.map((body, index) => [body, index]));
const START_TIME = dateFromOnly(UNIVERSAL_EPHEMERIS.startDate).getTime();
const END_TIME = dateFromOnly(UNIVERSAL_EPHEMERIS.endDate).getTime();

function staticEphemerisDisabled(): boolean {
  return process.env.ASTRONAT_DISABLE_STATIC_EPHEMERIS === "1";
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateFromOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function dayOffset(dateStr: string): number | null {
  const time = dateFromOnly(dateStr).getTime();
  if (time < START_TIME || time > END_TIME) return null;
  return Math.round((time - START_TIME) / MS_DAY);
}

function supportsBodies(bodies: readonly string[]): boolean {
  return bodies.every((body) => BODY_INDEX.has(body));
}

function toCachedPosition(body: string, dateStr: string, row: [number, number]): CachedSkyPosition {
  const [longitude, speed] = row;
  const degreeInSign = longitude % 30;
  return {
    name: body,
    longitude,
    speed,
    is_retrograde: speed < 0,
    sign: ZODIAC_SIGNS[Math.floor(longitude / 30)],
    degree_in_sign: Number(degreeInSign.toFixed(4)),
    computed_at_utc: `${dateStr}T00:00:00.000Z`,
  };
}

export function getStaticUniversalSkyForDate(
  date: Date,
  bodies: readonly string[],
): CachedSkyPosition[] | null {
  if (staticEphemerisDisabled() || !supportsBodies(bodies)) return null;

  const dateStr = dateOnly(date);
  const offset = dayOffset(dateStr);
  if (offset === null) return null;

  const day = UNIVERSAL_EPHEMERIS.days[offset];
  if (!day) return null;

  return bodies.map((body) => {
    const bodyIndex = BODY_INDEX.get(body);
    if (bodyIndex === undefined) throw new Error(`Unsupported static ephemeris body: ${body}`);
    return toCachedPosition(body, dateStr, day[bodyIndex]);
  });
}

export function getStaticUniversalSkyForDateRange(
  startDate: Date,
  count: number,
  bodies: readonly string[],
): Map<string, CachedSkyPosition[]> | null {
  if (staticEphemerisDisabled() || count < 0 || !supportsBodies(bodies)) return null;
  if (count === 0) return new Map();

  const firstDate = dateOnly(startDate);
  const firstOffset = dayOffset(firstDate);
  if (firstOffset === null) return null;

  const firstTime = dateFromOnly(firstDate).getTime();
  const lastTime = firstTime + (count - 1) * MS_DAY;
  if (lastTime > END_TIME) return null;

  const result = new Map<string, CachedSkyPosition[]>();
  for (let index = 0; index < count; index += 1) {
    const dateStr = dateOnly(new Date(firstTime + index * MS_DAY));
    const day = UNIVERSAL_EPHEMERIS.days[firstOffset + index];
    if (!day) return null;

    result.set(
      dateStr,
      bodies.map((body) => {
        const bodyIndex = BODY_INDEX.get(body);
        if (bodyIndex === undefined) throw new Error(`Unsupported static ephemeris body: ${body}`);
        return toCachedPosition(body, dateStr, day[bodyIndex]);
      }),
    );
  }

  return result;
}
