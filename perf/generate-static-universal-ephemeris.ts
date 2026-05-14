import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { computeRealtimePositions } from "../lib/astro/transits";

const MS_DAY = 86_400_000;
const DEFAULT_START = "2024-01-01";
const DEFAULT_END = "2035-12-31";
const DEFAULT_OUTPUT = "lib/astro/data/universal-ephemeris-2024-2035.json";
const UNIVERSAL_SKY_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "True Node",
] as const;

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateFromOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function parseArg(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function main() {
  const startDate = parseArg("start", DEFAULT_START);
  const endDate = parseArg("end", DEFAULT_END);
  const output = parseArg("out", DEFAULT_OUTPUT);
  const start = dateFromOnly(startDate);
  const end = dateFromOnly(endDate);
  const dayCount = Math.floor((end.getTime() - start.getTime()) / MS_DAY) + 1;

  if (!Number.isFinite(dayCount) || dayCount <= 0) {
    throw new Error(`Invalid date range: ${startDate}..${endDate}`);
  }

  const bodyOrder = [...UNIVERSAL_SKY_BODIES];
  const days: Array<Array<[number, number]>> = [];

  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(start.getTime() + index * MS_DAY);
    const positions = await computeRealtimePositions(date);
    const byName = new Map(positions.map((position) => [position.name, position]));
    days.push(
      bodyOrder.map((body) => {
        const position = byName.get(body);
        if (!position) throw new Error(`Missing ${body} for ${dateOnly(date)}`);
        return [position.longitude, position.speed];
      }),
    );

    if (index > 0 && index % 365 === 0) {
      console.log(`Generated ${index}/${dayCount} days through ${dateOnly(date)}`);
    }
  }

  const payload = {
    generatedAtUtc: new Date().toISOString(),
    source: "swisseph-wasm computeRealtimePositions at 00:00 UTC",
    startDate,
    endDate,
    bodies: bodyOrder,
    columns: ["longitude", "speed"],
    days,
  };

  const outPath = resolve(output);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload)}\n`);
  console.log(`Wrote ${dayCount} days to ${outPath}`);
}

await main();
