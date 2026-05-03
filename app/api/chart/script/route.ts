import { createClient } from "@/lib/supabase/server";
import { getProfile, getNatalChart } from "@/lib/db";
import { streamTeacherScript } from "@/lib/ai/prompts/natal-script";
import { signFromLongitude } from "@/app/lib/geodetic";
import { SIGN_RULERS } from "@/app/lib/astro-constants";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const profile = await getProfile(user.id);
  const natalRow = await getNatalChart(user.id);
  if (!profile || !natalRow?.ephemeris_data) {
    return new Response(
      JSON.stringify({ error: "Natal chart not yet computed. Visit /chart first to generate it." }),
      { status: 400 },
    );
  }

  const ephemerisData = natalRow.ephemeris_data as any;
  const planets = ephemerisData.planets ?? [];
  const cusps = ephemerisData.cusps ?? [];
  const aspects = ephemerisData.aspects ?? [];

  const ascLon = cusps[0] ?? 0;
  const ascSign = signFromLongitude(ascLon);
  const chartRulerPlanet = SIGN_RULERS[ascSign];

  // Simplify payload for the LLM
  const formattedPlanets = planets.map((p: any) => ({
    planet: p.name || p.planet,
    sign: p.sign || signFromLongitude(p.longitude),
    house: p.house,
    dignity: p.dignity,
  }));

  const payload = {
    firstName: profile.first_name || "User",
    ascendant: ascSign,
    chartRuler: chartRulerPlanet,
    planets: formattedPlanets,
    topAspects: aspects.slice(0, 10).map((a: any) => ({
      aspect: a.aspect,
      orb: a.orb,
    })),
  };

  try {
    const result = await streamTeacherScript(JSON.stringify(payload, null, 2));
    return result.toTextStreamResponse();
  } catch (err: any) {
    console.error("[chart/script] streaming failed:", err.message);
    return new Response(JSON.stringify({ error: "Streaming failed" }), { status: 500 });
  }
}
