import type { PatternEvent } from "@/lib/astro/geodetic-patterns";

// Flat columns — meta fields are hoisted into their own columns so the CSV
// is usable in spreadsheets without any JSON parsing.
const COLUMNS = [
  "utc", "jd", "type", "body", "fromSign", "toSign", "sign", "degree", "lon",
  "geodeticZone", "aspect", "body1", "body2", "direction", "eclipseType",
  "durationDays", "endUtc", "endSign", "members", "count",
  "peakDeclination", "hemisphere", "axis", "side", "peakCount",
  "speed", "seasonal", "city", "country", "cityLon", "cityLat",
  "anaretic", "retrograde",
] as const;

function escapeCsv(v: unknown): string {
  if (v === undefined || v === null || v === "") return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowFor(e: PatternEvent): Record<(typeof COLUMNS)[number], unknown> {
  const m = e.meta ?? {};
  const degree = e.lon === undefined ? "" : (e.lon % 30).toFixed(2);
  return {
    utc: e.utc,
    jd: e.jd,
    type: e.type,
    body: e.body,
    fromSign: e.fromSign ?? "",
    toSign: e.toSign ?? "",
    sign: e.sign ?? "",
    degree,
    lon: e.lon ?? "",
    geodeticZone: e.geodeticZone ?? "",
    aspect: m.aspect ?? "",
    body1: m.body1 ?? "",
    body2: m.body2 ?? "",
    direction: m.direction ?? "",
    eclipseType: m.eclipseType ?? "",
    durationDays: m.durationDays ?? "",
    endUtc: m.endUtc ?? "",
    endSign: m.endSign ?? "",
    members: m.members ?? "",
    count: m.count ?? "",
    peakDeclination: m.peakDeclination ?? "",
    hemisphere: m.hemisphere ?? "",
    axis: m.axis ?? "",
    side: m.side ?? "",
    peakCount: m.peakCount ?? "",
    speed: m.speed ?? "",
    seasonal: m.seasonal === true ? "true" : "",
    city: m.city ?? "",
    country: m.country ?? "",
    cityLon: m.cityLon ?? "",
    cityLat: m.cityLat ?? "",
    anaretic: m.anaretic === true ? "true" : "",
    retrograde: m.retrograde === true ? "true" : "",
  };
}

export function eventsToCsv(events: PatternEvent[]): string {
  const header = COLUMNS.join(",");
  const rows = events.map((e) => {
    const r = rowFor(e);
    return COLUMNS.map((c) => escapeCsv(r[c])).join(",");
  });
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
