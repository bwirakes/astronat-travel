import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ReadingsClient,
  PAGE_SIZE,
  toReading,
  type Reading,
  type SortKey,
  type SupabaseReadingRow,
  type TypeFilter,
} from "./ReadingsClient";

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
      q = q.order("reading_score", { ascending: false, nullsFirst: false });
      break;
    case "travel":
      q = q.order("reading_date", { ascending: false });
      break;
    case "alpha":
      q = q.order("details->destination", { ascending: true });
      break;
    case "recent":
    default:
      q = q.order("created_at", { ascending: false });
      break;
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await q.range(from, to);

  // Diagnostic: a recent preview was showing "1-0 OF 63" — count returned
  // but data was empty. The original code swallowed any error from the
  // query, so the real cause never surfaced. Log it loudly until we
  // identify the root cause; remove once the underlying bug is fixed.
  if (error) {
    console.error("[readings] query error:", {
      user_id: user.id,
      page,
      sort,
      typeFilter,
      from,
      to,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  } else if ((count ?? 0) > 0 && (data?.length ?? 0) === 0) {
    console.warn("[readings] count/data mismatch", {
      user_id: user.id,
      page,
      sort,
      typeFilter,
      from,
      to,
      count,
      dataLength: data?.length ?? 0,
    });
  }

  const readings: Reading[] = ((data ?? []) as SupabaseReadingRow[]).map(toReading);

  return (
    <ReadingsClient
      readings={readings}
      total={count ?? readings.length}
      page={page}
      sort={sort}
      typeFilter={typeFilter}
    />
  );
}
