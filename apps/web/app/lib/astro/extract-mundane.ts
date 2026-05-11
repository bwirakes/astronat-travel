import { SwissEphSingleton, getHouse, ZODIAC_SIGNS, computeRealtimePositions } from "@/lib/astro/transits";
import { calculateAspect } from "@/lib/astro/aspects";
import { essentialDignityLabel } from "@/app/lib/dignity";
import { COUNTRY_CHARTS } from "@/lib/astro/mundane-charts";

export async function getMundaneChartData(slug: string) {
    const country = COUNTRY_CHARTS.find((c) => c.slug === slug);
    if (!country) {
        throw new Error("Country not found");
    }

    const dtUtc = new Date(country.founding);

    const swe = await SwissEphSingleton.getInstance();
    const year = dtUtc.getUTCFullYear();
    const month = dtUtc.getUTCMonth() + 1;
    const day = dtUtc.getUTCDate();
    const hour = dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0;
    
    const jd = swe.julday(year, month, day, hour);
    
    const sys = Math.abs(country.capital.lat) >= 66 ? 'W' : 'P';
    const h = swe.houses(jd, country.capital.lat, country.capital.lon, sys) as any;
    
    const cuspsArray: number[] = [];
    for (let i = 1; i <= 12; i++) {
        cuspsArray.push(h.cusps[i.toString()]);
    }

    const computedPlanets = await computeRealtimePositions(dtUtc, cuspsArray);

    const planets = computedPlanets.map((p: any) => ({
        ...p,
        dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
    }));

    const aspects = [];
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            const result = calculateAspect(p1.longitude, p2.longitude, p1.name, p2.name);
            if (result) {
                let baseVerdict = 50;
                if (result.aspect === 'Trine' || result.aspect === 'Sextile') baseVerdict = 80;
                if (result.aspect === 'Conjunction') baseVerdict = 70;
                if (result.aspect === 'Opposition' || result.aspect === 'Square') baseVerdict = 30;
                
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

    const asc = h.ascmc["0"];
    const mc = h.ascmc["1"];
    const ic = (mc + 180) % 360;
    const dc = (asc + 180) % 360;

    const generateAngle = (name: string, lon: number) => {
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

    const localTimeMatch = country.founding.match(/T(\d{2}:\d{2}:\d{2})/);
    const localTime = localTimeMatch ? localTimeMatch[1] : dtUtc.getUTCHours().toString();
    const localDateMatch = country.founding.match(/^(\d{4}-\d{2}-\d{2})/);
    const localDate = localDateMatch ? localDateMatch[1] : dtUtc.toISOString().split('T')[0];

    return {
        planets,
        angles,
        aspects,
        cusps: cuspsArray,
        profile_time: dtUtc.toISOString(),
        birth_city: country.capital.city,
        birth_date: localDate,
        birth_time: localTime,
        birth_lat: country.capital.lat,
        birth_lon: country.capital.lon
    };
}
