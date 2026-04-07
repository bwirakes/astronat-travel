import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNatalChart, getProfile, saveNatalChart } from "@/lib/db";
import { SwissEphSingleton, computeRealtimePositions, ZODIAC_SIGNS, getHouse } from "@/lib/astro/transits";
import { getAstrocarto, get12MonthTransits } from "@/app/lib/astro-client";
import { computeHouseMatrix, mapTransitsToMatrix, computeGlobalPenalty } from "@/app/lib/house-matrix";
import { computeEventScores } from "@/app/lib/scoring-engine";
import { houseFromLongitude } from "@/app/lib/geodetic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Validate Authentication
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { destination, travelType, targetLat, targetLon, travelDate } = body;

    if (!destination || !targetLat || !targetLon) {
      return NextResponse.json({ error: "Missing required geospatial payload." }, { status: 400 });
    }

    // 2. Get User Profile first (needed for natal computation too)
    const profile = await getProfile(user.id);
    if (!profile || !profile.birth_date || !profile.birth_time) {
      return NextResponse.json({ error: "Incomplete birth data in profile. Please complete your profile first." }, { status: 400 });
    }

    if (profile.birth_lat == null || profile.birth_lon == null) {
      return NextResponse.json({ error: "Birth city coordinates not found. Please re-save your profile with a valid birth city." }, { status: 400 });
    }

    // 3. Cache-Aside: Check `natal_charts` table — compute on-the-fly if missing
    let cachedChart = await getNatalChart(user.id);
    let natalPlanets: any[];

    if (!cachedChart || !cachedChart.ephemeris_data?.planets) {
      // Auto-compute natal chart using the profile birth data
      const dtStr = `${profile.birth_date}T${profile.birth_time.length === 5 ? profile.birth_time + ':00' : profile.birth_time}Z`;
      const dtUtcBirth = new Date(dtStr);

      const sweInit = await SwissEphSingleton.getInstance();
      const birthYear = dtUtcBirth.getUTCFullYear();
      const birthMonth = dtUtcBirth.getUTCMonth() + 1;
      const birthDay = dtUtcBirth.getUTCDate();
      const birthHour = dtUtcBirth.getUTCHours() + dtUtcBirth.getUTCMinutes() / 60.0;

      const birthJd = sweInit.julday(birthYear, birthMonth, birthDay, birthHour);
      const birthSys = Math.abs(profile.birth_lat) >= 66 ? 'W' : 'P';
      const birthH = sweInit.houses(birthJd, profile.birth_lat, profile.birth_lon, birthSys) as any;

      const birthCusps: number[] = [];
      for (let i = 1; i <= 12; i++) birthCusps.push(birthH.cusps[i.toString()]);

      const computedPlanets = await computeRealtimePositions(dtUtcBirth, birthCusps);
      const { essentialDignityLabel } = await import("@/app/lib/dignity");
      const planetsWithDignity = computedPlanets.map((p: any) => ({
        ...p,
        dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
      }));

      const asc = birthH.ascmc["0"];
      const mc = birthH.ascmc["1"];

      const natalData = { planets: planetsWithDignity, cusps: birthCusps, asc, mc, profile_time: dtUtcBirth.toISOString() };
      await saveNatalChart(user.id, natalData, { cusps: birthCusps });
      natalPlanets = planetsWithDignity;
    } else {
      natalPlanets = cachedChart.ephemeris_data.planets;
    }

    const dtStr = `${profile.birth_date}T${profile.birth_time.length === 5 ? profile.birth_time + ':00' : profile.birth_time}Z`;
    const dtUtc = new Date(dtStr);

    const swe = await SwissEphSingleton.getInstance();
    const year = dtUtc.getUTCFullYear();
    const month = dtUtc.getUTCMonth() + 1;
    const day = dtUtc.getUTCDate();
    const hour = dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0;
    
    const jd = swe.julday(year, month, day, hour);
    const sys = Math.abs(targetLat) >= 66 ? 'W' : 'P';
    const h = swe.houses(jd, targetLat, targetLon, sys) as any;
    
    const relocatedCusps: number[] = [];
    for (let i = 1; i <= 12; i++) {
        relocatedCusps.push(h.cusps[i.toString()]);
    }

    // 4. Compute Dynamic Reading Vectors (ACG & Transits)
    const acgResult = await getAstrocarto(user.id, targetLat, targetLon, destination);
    const acgLines = acgResult?.lines || [];

    const transitResult = await get12MonthTransits(user.id, travelDate || new Date().toISOString());
    const transits = transitResult?.major_aspects || [];

    const mappedTransits = mapTransitsToMatrix(transits, natalPlanets, relocatedCusps, profile.birth_lat || undefined);
    const globalPenalty = computeGlobalPenalty(mappedTransits);

    const matrixResult = computeHouseMatrix({
        natalPlanets,
        relocatedCusps,
        acgLines,
        transits: mappedTransits,
        parans: [], // Skipping parans API logic for now
        destLat: targetLat,
        destLon: targetLon,
        globalPenalty,
        birthLat: profile.birth_lat || undefined,
    });

    const ascLon = relocatedCusps[0] ?? 0;
    const relocatedPlanets = natalPlanets.map((p: any) => ({
        name: p.planet || p.name,
        house: houseFromLongitude(p.longitude, ascLon),
    }));

    const eventScores = computeEventScores(matrixResult, relocatedPlanets);

    const detailedResult = {
      destination,
      travelType,
      macroVerdict: matrixResult.macroVerdict,
      personalScore: matrixResult.personalScore,
      collectiveScore: matrixResult.collectiveScore,
      houses: matrixResult.houses,
      planetaryLines: acgLines,
      transitWindows: transits.slice(0, 10),
      eventScores,
    };

    // 5. Finalize: Write result to the `readings` storage abstraction
    const { data: newReading, error: insertError } = await supabase
      .from("readings")
      .insert({
        user_id: user.id,
        category: body.readingCategory || "astrocartography",
        reading_date: travelDate || new Date().toISOString(),
        reading_score: matrixResult.macroScore, // Use computed macro score
        details: detailedResult
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // 6. Return the direct UUID for the client to route to `/reading/[id]`
    return NextResponse.json({ success: true, readingId: newReading.id });

  } catch (error: any) {
    console.error("Failed to generate reading:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
