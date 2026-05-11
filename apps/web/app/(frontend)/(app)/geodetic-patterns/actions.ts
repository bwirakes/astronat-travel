"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PatternEvent } from "@/lib/astro/geodetic-patterns";

interface Row {
  utc: string;
  jd: number;
  type: PatternEvent["type"];
  body: string;
  from_sign: string | null;
  to_sign: string | null;
  sign: string | null;
  lon: number | null;
  geodetic_zone: string | null;
  meta: Record<string, string | number | boolean> | null;
}

function rowToEvent(r: Row): PatternEvent {
  return {
    utc: r.utc,
    jd: r.jd,
    type: r.type,
    body: r.body,
    fromSign: r.from_sign ?? undefined,
    toSign: r.to_sign ?? undefined,
    sign: r.sign ?? undefined,
    lon: r.lon ?? undefined,
    geodeticZone: r.geodetic_zone ?? undefined,
    meta: r.meta ?? undefined,
  };
}

/** Read all geodetic events whose UTC timestamp falls in [fromIso, toIso]. */
export async function loadEventsRange(fromIso: string, toIso: string): Promise<PatternEvent[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("geodetic_events")
    .select("utc,jd,type,body,from_sign,to_sign,sign,lon,geodetic_zone,meta")
    .gte("utc", fromIso)
    .lte("utc", toIso)
    .order("jd", { ascending: true })
    .limit(50000);

  if (error) {
    console.error("loadEventsRange:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToEvent(r as Row));
}
