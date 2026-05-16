import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReadingsClient } from "./ReadingsClient";
import {
  PAGE_SIZE,
  toReading,
  type Reading,
  type SortKey,
  type SupabaseReadingRow,
  type TypeFilter,
} from "./readings-data";

const VALID_SORTS: ReadonlySet<SortKey> = new Set<SortKey>(["recent", "score", "travel", "alpha"]);
const VALID_TYPES: ReadonlySet<TypeFilter> = new Set<TypeFilter>(["all", "trip", "relocation", "couples"]);

export default async function ReadingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const sort: SortKey = VALID_SORTS.has(sp.sort as SortKey) ? (sp.sort as SortKey) : "recent";
  const typeFilter: TypeFilter = VALID_TYPES.has(sp.type as TypeFilter) ? (sp.type as TypeFilter) : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/readings");

  const buildQuery = () => {
    let q = supabase
      .from("readings")
      .select("id, category, details, reading_date, reading_score", { count: "exact" })
      .eq("user_id", user.id);

    if (typeFilter === "couples") {
      q = q.eq("category", "synastry");
    } else if (typeFilter === "relocation") {
      q = q.or("details->>travelType.eq.relocation");
    } else if (typeFilter === "trip") {
      q = q.neq("category", "synastry").or("details->>travelType.eq.trip,category.eq.astrocartography");
    }

    switch (sort) {
      case "score":
        return q.order("reading_score", { ascending: false, nullsFirst: false });
      case "travel":
        return q.order("reading_date", { ascending: false });
      case "alpha":
        return q.order("details->destination", { ascending: true });
      case "recent":
      default:
        return q.order("created_at", { ascending: false });
    }
  };

  const fetchPage = async (pageToFetch: number) => {
    const from = (pageToFetch - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    return buildQuery().range(from, to);
  };

  let { data, count, error } = await fetchPage(page);

  if (error) {
    console.error("[readings] failed to load readings", error);
  }

  const total = count ?? data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  if (!error && safePage !== page) {
    const retry = await fetchPage(safePage);
    data = retry.data;
    count = retry.count;
    error = retry.error;
    if (error) {
      console.error("[readings] failed to load clamped readings page", error);
    }
  }

  const readings: Reading[] = ((data ?? []) as SupabaseReadingRow[]).map(toReading);

  return (
    <ReadingsClient
      readings={readings}
      total={count ?? total}
      page={safePage}
      sort={sort}
      typeFilter={typeFilter}
    />
  );
}
