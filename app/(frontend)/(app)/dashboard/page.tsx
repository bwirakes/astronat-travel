import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";
import { getSunSign } from "@/app/lib/planet-data";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess, type ReadingAccess } from "@/lib/access";

export default async function HomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/dashboard");

    // Parallelize the three independent reads. Previously these ran
    // sequentially (access → profile → readings), serializing 3 round-trips
    // against Supabase. The total wall-time is now max(3) instead of sum(3).
    const [access, profileResult, readingsResult] = await Promise.all([
        getReadingAccess(user.id),
        supabase.from('profiles').select('first_name, birth_date').eq('id', user.id).maybeSingle(),
        supabase.from('readings').select('id, category, details, reading_date, reading_score').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    ]) as [ReadingAccess, { data: { first_name: string | null; birth_date: string | null } | null }, { data: any[] | null }];

    const pData = profileResult.data;
    if (!pData?.birth_date) redirect("/flow?step=1");
    const profile = pData as { first_name: string | null; birth_date: string };

    let recentSearches: Array<{
        id: string | number;
        destination: string;
        score: number;
        travel_date: string;
        category?: string;
        weatherSummary?: { worstTier: string; severeCount: number; datesToWatch: string[]; windowDays: number };
    }> = [];

    const readings = readingsResult.data;
    if (readings) {
        recentSearches = readings.map(r => {
            const d = (r.details as any) || {};
            const isWeather = !!d.weatherForecast;
            const row: any = {
                id: r.id,
                destination: d.destination || d.weatherForecast?.cities?.[0]?.label || "Unknown",
                score: r.reading_score,
                travel_date: new Date(r.reading_date).toISOString().split('T')[0],
                category: isWeather ? 'geodetic-weather' : r.category,
            };
            if (isWeather) row.weatherSummary = d.weatherForecast.summary;
            return row;
        }) as any;
    }

    const birthDate = new Date(profile.birth_date);
    const sunSignData = getSunSign(birthDate.getMonth() + 1, birthDate.getDate());

    return (
        <HomeClient
            profile={profile}
            sunSignData={sunSignData}
            recentSearches={recentSearches}
            access={access}
        />
    );
}
