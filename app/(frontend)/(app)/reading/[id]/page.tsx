import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MOCK_READING_DETAILS } from "@/lib/astro/mock-readings";
import { getReadingAccess } from "@/lib/access";
import { ReadingClient } from "./ReadingClient";

const DEFAULT_AI_INSIGHTS = {
  primary: { label: "MACRO OVERVIEW", title: "The Astrological Verdict", content: "Evaluating relocation matrix..." },
  highest: { label: "HIGHEST ENERGY", title: "Peak Resonance", content: "Evaluating relocation matrix..." },
  vulnerable: { label: "FRICTION POINT", title: "Vulnerability Score", content: "Evaluating relocation matrix..." },
  timing: { label: "OPTIMAL ACTION WINDOW", title: "Peak Timing", content: "Evaluating relocation matrix..." },
};

function shapeFromDb(data: Record<string, unknown>): Record<string, unknown> {
  const d = (data.details as Record<string, unknown>) || {};
  return {
    category: (data.category as string) || "astrocartography",
    destination: (d.destination as string) || "Unknown Destination",
    destinationLat: (d.destinationLat as number) || 37.7749,
    destinationLon: (d.destinationLon as number) || -122.4194,
    travelDate:
      (d.travelDate as string) ||
      (typeof data.reading_date === "string"
        ? (data.reading_date as string).slice(0, 10)
        : new Date(data.reading_date as string).toISOString().slice(0, 10)),
    travelType: (d.travelType as string) || "trip",
    goals: d.goals || [],
    goalIds: d.goalIds || [],
    macroScore: (d.macroScore as number) || (data.reading_score as number) || 0,
    macroVerdict: (d.macroVerdict as string) || "Mixed",
    scoreNarrative: d.scoreNarrative,
    houses: d.houses || [],
    transitWindows: d.transitWindows || [],
    planetaryLines: d.planetaryLines || [],
    acgLines: d.acgLines || [],
    userPlanetaryLines: d.userPlanetaryLines || [],
    natalPlanets: d.natalPlanets || [],
    relocatedCusps: d.relocatedCusps || [],
    natalCusps: d.natalCusps || [],
    natalAngles: d.natalAngles,
    birth: d.birth,
    birthDate: (d.birth as Record<string, unknown> | undefined)?.date || d.birthDate,
    birthTime: (d.birth as Record<string, unknown> | undefined)?.time || d.birthTime,
    birthLat: (d.birth as Record<string, unknown> | undefined)?.lat ?? d.birthLat,
    birthLon: (d.birth as Record<string, unknown> | undefined)?.lon ?? d.birthLon,
    teacherReading: d.teacherReading,
    // Geodetic / parans / live transits — needed by the V4 viewmodel's
    // deriveGeodetic and deriveParans. Without these, vm.geodetic returns
    // null and every teacher-copy section on the place-field tab gets gated
    // off even when the LLM emitted them.
    geodeticBand: d.geodeticBand,
    activeGeoTransits: d.activeGeoTransits,
    parans: d.parans,
    geodeticEngineVersion: d.geodeticEngineVersion,
    aiInsights: d.aiInsights || DEFAULT_AI_INSIGHTS,
    // Synastry-only fields (undefined for astrocartography)
    partnerName: d.partnerName,
    userMacroScore: d.userMacroScore,
    userMacroVerdict: d.userMacroVerdict,
    userHouses: d.userHouses,
    partnerMacroScore: d.partnerMacroScore,
    partnerMacroVerdict: d.partnerMacroVerdict,
    partnerHouses: d.partnerHouses,
    partnerPlanetaryLines: d.partnerPlanetaryLines,
    partnerNatalPlanets: d.partnerNatalPlanets,
    partnerRelocatedCusps: d.partnerRelocatedCusps,
    partnerNatalCusps: d.partnerNatalCusps,
    partnerEventScores: d.partnerEventScores,
    userEventScores: d.userEventScores,
    synastryAspects: d.synastryAspects,
    houseComparison: d.houseComparison,
    scoreDelta: d.scoreDelta,
    recommendation: d.recommendation,
    narrative: d.narrative,
    weatherForecast: d.weatherForecast,
    couplesReading: d.couplesReading,
    chartStructure: d.chartStructure,
    chartStructureYou: d.chartStructureYou,
    chartStructurePartner: d.chartStructurePartner,
    bestWindows: d.bestWindows,
    avoidWindows: d.avoidWindows,
    bestWindowScores: d.bestWindowScores,
    avoidWindowScores: d.avoidWindowScores,
    // Universal sky — pass through so PlaceFieldTab §03 and the TimingTab
    // Gantt sky rows can render. Optional for back-compat with cached
    // readings that predate these fields.
    universalSky: d.universalSky,
    universalSkySpans: d.universalSkySpans,
    eventScores: d.eventScores,
    generationStatus: d.generationStatus,
    generationStage: d.generationStage,
    generationCreatedAt: d.generationCreatedAt,
    generationStartedAt: d.generationStartedAt,
    generationError: d.generationError,
  };
}

export default async function ReadingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const isDemo = sp.demo === "true";

  if (isDemo) {
    const mockId = id || "1";
    const mockData = MOCK_READING_DETAILS[mockId] || MOCK_READING_DETAILS["1"];
    const reading: Record<string, unknown> = {
      ...mockData,
      destination: mockData.destination || "Unknown Destination",
      destinationLat: mockData.destinationLat || 37.7749,
      destinationLon: mockData.destinationLon || -122.4194,
      planetaryLines: mockData.planetaryLines || [],
      relocatedCusps: mockData.relocatedCusps || [],
      aiInsights: mockData.aiInsights || DEFAULT_AI_INSIGHTS,
    };
    return <ReadingClient reading={reading} readingId={id} isDemo={true} showUpsell={false} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/reading/${id}`);

  // Fetch the reading + access in parallel. Access drives the upsell flag,
  // which we previously fetched client-side in a follow-up useEffect.
  const readingPromise =
    id.length > 30
      ? supabase.from("readings").select("*").eq("id", id).eq("user_id", user.id).single()
      : supabase
          .from("readings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

  const [readingResult, access] = await Promise.all([readingPromise, getReadingAccess(user.id)]);
  const dbReading = readingResult.data;

  if (!dbReading || !dbReading.details) {
    redirect("/readings");
  }

  const reading = shapeFromDb(dbReading);
  const showUpsell = !access.hasSubscription && access.freeUsed;

  return <ReadingClient reading={reading} readingId={id} isDemo={false} showUpsell={showUpsell} />;
}
