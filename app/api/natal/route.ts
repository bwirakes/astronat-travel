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

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check if natal chart already exists
    const cached = await getNatalChart(userId);
    if (cached && cached.ephemeris_data) {
      return NextResponse.json(cached.ephemeris_data);
    }

    // 2. Fetch user profile for birth data
    const profile = await getProfile(userId);
    if (!profile || !profile.birth_date || !profile.birth_time || profile.birth_lat == null || profile.birth_lon == null) {
      return NextResponse.json({ error: "Incomplete birth data in profile" }, { status: 400 });
    }

    // We must find the correct UTC time based on the user's local birth_time and birth_city coordinates.
    const { find } = await import('geo-tz');
    const tzStr = find(profile.birth_lat, profile.birth_lon)[0];
    const time = profile.birth_time.length === 5 ? profile.birth_time + ':00' : profile.birth_time;
    const localIso = `${profile.birth_date}T${time}`;
    
    // Iteratively find the exact UTC time by comparing timezone offsets
    let dtUtc = new Date(`${localIso}Z`);
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tzStr,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    
    for (let i = 0; i < 2; i++) {
        const parts = formatter.formatToParts(dtUtc);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value;
        let h = getPart('hour')!;
        if (h === '24') h = '00';
        
        const fLocal = new Date(`${getPart('year')}-${getPart('month')}-${getPart('day')}T${h}:${getPart('minute')}:${getPart('second')}Z`);
        const offset = fLocal.getTime() - dtUtc.getTime();
        dtUtc = new Date(new Date(`${localIso}Z`).getTime() - offset);
    }

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

    // Save to DB
    await saveNatalChart(userId, resultData, { cusps: cuspsArray });

    return NextResponse.json(resultData);

  } catch (err: any) {
    console.error("[/api/natal] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
