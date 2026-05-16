export const PAGE_SIZE = 10;

export type SortKey = "recent" | "score" | "travel" | "alpha";
export type TypeFilter = "all" | "trip" | "relocation" | "couples";

export type Reading = {
  id: string;
  destination: string;
  lat: number | null;
  lon: number | null;
  score: number;
  travelDate: string;
  travelType: string;
  typeFilter: Exclude<TypeFilter, "all">;
};

export type SupabaseReadingRow = {
  id: string;
  details?: {
    destination?: string;
    destinationLat?: number;
    destinationLon?: number;
    travelType?: string;
    macroScore?: number;
  } | null;
  category?: string | null;
  reading_date: string;
  reading_score?: number | null;
};

export function toReading(row: SupabaseReadingRow): Reading {
  const isCouples = row.category === "synastry";
  const travelType = row.details?.travelType || row.category || "trip";
  const typeFilter: Exclude<TypeFilter, "all"> = isCouples
    ? "couples"
    : travelType === "relocation"
      ? "relocation"
      : "trip";

  return {
    id: row.id,
    destination: row.details?.destination || "Unknown Destination",
    lat: typeof row.details?.destinationLat === "number" ? row.details.destinationLat : null,
    lon: typeof row.details?.destinationLon === "number" ? row.details.destinationLon : null,
    travelType: isCouples ? "couples" : travelType,
    typeFilter,
    travelDate: row.reading_date,
    score: row.reading_score ?? row.details?.macroScore ?? 50,
  };
}

export function filterAndSortReadings(readings: Reading[], sort: SortKey, typeFilter: TypeFilter): Reading[] {
  const byType = readings.filter((reading) => {
    if (typeFilter === "all") return true;
    return reading.typeFilter === typeFilter;
  });

  return [...byType].sort((a, b) => {
    switch (sort) {
      case "score":
        return b.score - a.score;
      case "travel":
        return new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime();
      case "alpha":
        return a.destination.localeCompare(b.destination);
      case "recent":
      default:
        return readings.indexOf(a) - readings.indexOf(b);
    }
  });
}

export function prepareReadingsPage(
  readings: Reading[],
  {
    page,
    sort,
    typeFilter,
    pageSize = PAGE_SIZE,
  }: {
    page: number;
    sort: SortKey;
    typeFilter: TypeFilter;
    pageSize?: number;
  }
) {
  const filtered = filterAndSortReadings(readings, sort, typeFilter);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageStart = (safePage - 1) * pageSize;

  return {
    readings: filtered.slice(pageStart, pageStart + pageSize),
    total,
    page: safePage,
  };
}
