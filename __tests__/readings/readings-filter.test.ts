import { describe, expect, it } from "bun:test";
import {
  filterAndSortReadings,
  prepareReadingsPage,
  toReading,
  type SupabaseReadingRow,
} from "@/app/(frontend)/(app)/readings/readings-data";

const rows: SupabaseReadingRow[] = [
  {
    id: "trip-1",
    category: "astrocartography",
    reading_date: "2026-05-15",
    reading_score: 72,
    details: {
      destination: "Lisbon, Portugal",
      destinationLat: 38.7223,
      destinationLon: -9.1393,
      travelType: "trip",
    },
  },
  {
    id: "relocation-1",
    category: "astrocartography",
    reading_date: "2026-06-01",
    reading_score: 88,
    details: {
      destination: "Kyoto, Japan",
      destinationLat: 35.0116,
      destinationLon: 135.7681,
      travelType: "relocation",
    },
  },
  {
    id: "couples-1",
    category: "synastry",
    reading_date: "2026-05-20",
    reading_score: 56,
    details: {
      destination: "Tashkent, Uzbekistan",
      destinationLat: 41.2995,
      destinationLon: 69.2401,
      travelType: "trip",
    },
  },
];

describe("readings filters", () => {
  const readings = rows.map(toReading);

  it("maps synastry readings to the Couples filter instead of Trip", () => {
    expect(readings.find((reading) => reading.id === "couples-1")).toMatchObject({
      travelType: "couples",
      typeFilter: "couples",
    });
  });

  it("keeps couples readings out of the Trip filter", () => {
    const tripIds = filterAndSortReadings(readings, "recent", "trip").map((reading) => reading.id);
    expect(tripIds).toEqual(["trip-1"]);
  });

  it("filters couples readings and still supports score sorting", () => {
    const couplesIds = filterAndSortReadings(readings, "score", "couples").map((reading) => reading.id);
    expect(couplesIds).toEqual(["couples-1"]);

    const allByScore = filterAndSortReadings(readings, "score", "all").map((reading) => reading.id);
    expect(allByScore).toEqual(["relocation-1", "trip-1", "couples-1"]);
  });

  it("clamps an out-of-range page instead of reporting an empty nonzero total", () => {
    const prepared = prepareReadingsPage(readings, {
      page: 13,
      sort: "recent",
      typeFilter: "all",
      pageSize: 10,
    });

    expect(prepared.page).toBe(1);
    expect(prepared.total).toBe(3);
    expect(prepared.readings.map((reading) => reading.id)).toEqual(["trip-1", "relocation-1", "couples-1"]);
  });
});
