import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getNatalChart, saveNatalChart } from "@/lib/db";
import { SwissEphSingleton, getHouse, ZODIAC_SIGNS, computeRealtimePositions } from "@/lib/astro/transits";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Support demo mode directly via API if needed, or fallback
    const { searchParams } = new URL(request.url);
    const userId = user?.id || searchParams.get("userId");
    const refresh = searchParams.get("refresh") === "1";

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch user profile first — birth metadata is always served from the
    //    profile (source of truth), not from the cached ephemeris blob, because
    //    some code paths save the chart without birth_date/time/city fields.
    const profile = await getProfile(userId);
    if (!profile || !profile.birth_date || !profile.birth_time || profile.birth_lat == null || profile.birth_lon == null) {
      return NextResponse.json({ error: "Incomplete birth data in profile" }, { status: 400 });
    }

    const birthMeta = {
      first_name: (profile as any).first_name ?? null,
      last_name: (profile as any).last_name ?? null,
      birth_city: profile.birth_city,
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      birth_lat: profile.birth_lat,
      birth_lon: profile.birth_lon,
    };

    // 2. Check if natal chart already exists — merge profile birth metadata
    //    so the UI always shows Date/Time/Location correctly. Also backfill
    //    angles + aspects from the cached planets/cusps when they're missing
    //    (older save paths only persisted {planets, cusps, asc, mc}, so the
    //    chart page renders without Ascendant + aspects when reading the cache).
    //
    //    Pass ?refresh=1 to bypass cache — needed after the timezone-fix
    //    migration (old caches have houses rotated by the tz offset).
    if (refresh) {
      await supabase.from("natal_charts").delete().eq("user_id", userId).eq("chart_type", "natal");
    }
    const cached = refresh ? null : await getNatalChart(userId);
    if (cached && cached.ephemeris_data) {
      const cachedData = cached.ephemeris_data as any;
      const planets: any[] = cachedData.planets || [];
      const cusps: number[] = cachedData.cusps || [];

      let angles = cachedData.angles;
      if ((!angles || angles.length === 0) && cusps.length === 12) {
        const asc = typeof cachedData.asc === "number" ? cachedData.asc : cusps[0];
        const mc = typeof cachedData.mc === "number" ? cachedData.mc : cusps[9];
        const ic = (mc + 180) % 360;
        const dc = (asc + 180) % 360;

        const makeAngle = (name: string, lon: number) => {
          const signIdx = Math.floor(lon / 30);
          const degInSign = lon % 30;
          return {
            name,
            planet: name,
            longitude: Number(lon.toFixed(6)),
            sign: ZODIAC_SIGNS[signIdx],
            degree_in_sign: Number(degInSign.toFixed(4)),
            degree_minutes: Math.floor((degInSign - Math.floor(degInSign)) * 60),
            speed: 0,
            is_retrograde: false,
            house: getHouse(lon, cusps),
            isAngle: true,
          };
        };

        angles = [
          makeAngle("Ascendant", asc),
          makeAngle("MC", mc),
          makeAngle("IC", ic),
          makeAngle("DC", dc),
        ];
      }

      let aspects = cachedData.aspects;
      if ((!aspects || aspects.length === 0) && planets.length > 0) {
        const { calculateAspect } = await import("@/lib/astro/aspects");
        aspects = [];
        for (let i = 0; i < planets.length; i++) {
          for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            const p1Name = p1.name || p1.planet;
            const p2Name = p2.name || p2.planet;
            const result = calculateAspect(p1.longitude, p2.longitude, p1Name, p2Name);
            if (result) {
              let baseVerdict = 50;
              if (result.aspect === "Trine" || result.aspect === "Sextile") baseVerdict = 80;
              if (result.aspect === "Conjunction") baseVerdict = 70;
              if (result.aspect === "Opposition" || result.aspect === "Square") baseVerdict = 30;
              const verdict = Math.max(0, Math.min(100, Math.round(baseVerdict + (5 - result.orb) * 4)));
              aspects.push({
                aspect: `${p1Name} ${result.aspect.toLowerCase()} ${p2Name}`,
                type: result.aspect,
                orb: `${Math.floor(result.orb)}° ${Math.round((result.orb % 1) * 60).toString().padStart(2, "0")}′`,
                verdict,
                planet1: p1Name,
                planet2: p2Name,
              });
            }
          }
        }
      }

      // interpretation (if generated previously) ships alongside the chart
      // so the client renders it immediately without a second fetch.
      const interpretation = cachedData.interpretation ?? null;

      return NextResponse.json({ ...cachedData, angles, aspects, interpretation, ...birthMeta });
    }

    const { birthToUtc } = await import("@/lib/astro/birth-utc");
    const dtUtc = await birthToUtc(
      profile.birth_date,
      profile.birth_time,
      profile.birth_lat,
      profile.birth_lon,
    );

    const swe = await SwissEphSingleton.getInstance();
    const year = dtUtc.getUTCFullYear();
    const month = dtUtc.getUTCMonth() + 1;
    const day = dtUtc.getUTCDate();
    const hour = dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0;
    
    const jd = swe.julday(year, month, day, hour);
    
    // Calculate houses (Placidus except extreme latitudes)
    const sys = Math.abs(profile.birth_lat) >= 66 ? 'W' : 'P';
    const h = swe.houses(jd, profile.birth_lat, profile.birth_lon, sys) as any;
    
    const cuspsArray: number[] = [];
    for (let i = 1; i <= 12; i++) {
        cuspsArray.push(h.cusps[i.toString()]);
    }

    // Compute standard planets
    const computedPlanets = await computeRealtimePositions(dtUtc, cuspsArray);

    const { essentialDignityLabel } = await import("@/app/lib/dignity");
    const { calculateAspect } = await import("@/lib/astro/aspects");

    // Map planets to add dignity and format
    const planets = computedPlanets.map((p: any) => ({
        ...p,
        dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
    }));

    // Compute Aspects (Unique Pairs)
    const aspects = [];
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            const result = calculateAspect(p1.longitude, p2.longitude, p1.name, p2.name);
            if (result) {
                // Ensure the verdict translates easily for the UI (higher = tighter orb/better aspect)
                let baseVerdict = 50;
                if (result.aspect === 'Trine' || result.aspect === 'Sextile') baseVerdict = 80;
                if (result.aspect === 'Conjunction') baseVerdict = 70;
                if (result.aspect === 'Opposition' || result.aspect === 'Square') baseVerdict = 30;
                
                // Slightly adjust verdict by orb exactly like mock data
                const verdict = Math.max(0, Math.min(100, Math.round(baseVerdict + (5 - result.orb) * 4)));

                aspects.push({
                    aspect: `${p1.name} ${result.aspect.toLowerCase()} ${p2.name}`,
                    type: result.aspect,
                    orb: `${Math.floor(result.orb)}° ${Math.round((result.orb % 1) * 60).toString().padStart(2, '0')}′`,
                    verdict,
                    planet1: p1.name,
                    planet2: p2.name,
                });
            }
        }
    }

    // Compute Angles (Ascendant, MC, DC, IC)
    const asc = h.ascmc["0"];
    const mc = h.ascmc["1"];
    const ic = (mc + 180) % 360;
    const dc = (asc + 180) % 360;

    const generateAngle = (name: string, lon: number) => {
        const signIdx = Math.floor(lon / 30);
        const degInSign = lon % 30;
        return {
            name,
            planet: name, // alias
            longitude: Number(lon.toFixed(6)),
            sign: ZODIAC_SIGNS[signIdx],
            degree_in_sign: Number(degInSign.toFixed(4)),
            degree_minutes: Math.floor((degInSign - Math.floor(degInSign)) * 60),
            speed: 0,
            is_retrograde: false,
            computed_at_utc: dtUtc.toISOString(),
            house: getHouse(lon, cuspsArray),
            isAngle: true
        };
    };

    const angles = [
        generateAngle("Ascendant", asc),
        generateAngle("MC", mc),
        generateAngle("IC", ic),
        generateAngle("DC", dc)
    ];

    const resultData = {
        planets,
        angles,
        aspects,
        cusps: cuspsArray,
        profile_time: dtUtc.toISOString(),
        birth_city: profile.birth_city,
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        birth_lat: profile.birth_lat,
        birth_lon: profile.birth_lon
    };

    // Save to DB (without first/last name — those belong on the profile)
    await saveNatalChart(userId, resultData, { cusps: cuspsArray });

    return NextResponse.json({ ...resultData, ...birthMeta });

  } catch (err: any) {
    console.error("[/api/natal] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
