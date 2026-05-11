/**
 * Persist a computed reading to Supabase. The compute pipelines stay pure
 * (no I/O on success); this module owns every write to readings/searches.
 */

export interface PersistReadingArgs {
  supabase: any;
  userId: string;
  partnerId?: string | null;
  category: "astrocartography" | "synastry" | "natal" | "solar_return" | "mundane";
  readingDate: string;
  readingScore: number;
  details: Record<string, any>;
}

export async function persistReading({
  supabase,
  userId,
  partnerId = null,
  category,
  readingDate,
  readingScore,
  details,
}: PersistReadingArgs): Promise<{ readingId: string }> {
  const { data, error } = await supabase
    .from("readings")
    .insert({
      user_id: userId,
      partner_id: partnerId,
      category,
      reading_date: readingDate,
      reading_score: readingScore,
      details,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { readingId: data.id };
}

export interface LogSearchArgs {
  supabase: any;
  userId: string;
  destination: string;
  destLat: number;
  destLon: number;
  travelDate: string | null;
  travelType: string;
  macroScore: number;
  macroVerdict: string;
  houseScores: { house: number; score: number }[];
  eventScores: any[];
  goals: number[];
}

export async function logSearch(args: LogSearchArgs): Promise<void> {
  const payload = {
    user_id: args.userId,
    destination: args.destination,
    dest_lat: args.destLat,
    dest_lon: args.destLon,
    travel_date: args.travelDate
      ? new Date(args.travelDate).toISOString().split("T")[0]
      : null,
    travel_type: args.travelType === "relocation" ? "relocation" : "trip",
    macro_score: args.macroScore,
    verdict: args.macroVerdict,
    score_detail: {
      houseScores: args.houseScores,
      eventScores: args.eventScores,
      goals: args.goals,
    },
  };

  const { error } = await args.supabase.from("searches").insert(payload);
  if (error) console.warn("Failed to write to searches table:", error.message);
}
