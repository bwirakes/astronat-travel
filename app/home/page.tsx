import HomeClient from "./HomeClient";
import { getSunSign } from "../lib/planet-data";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Base fallback
    let profile = {
        first_name: "Brandon",
        birth_date: "1995-08-15"
    };
    let recentSearches = [
        { id: 1, destination: "Tokyo, Japan", score: 85, travel_date: "2026-05-12" },
        { id: 2, destination: "London, UK", score: 60, travel_date: "2026-07-22" },
        { id: 3, destination: "Berlin, Germany", score: 40, travel_date: "2026-08-05" }
    ];

    // If authenticated, hydrate real data from Postgres
    if (user) {
        const { data: pData } = await supabase.from('profiles').select('first_name, birth_date').eq('id', user.id).single();
        if (pData) profile = pData as any;

        const { data: readings } = await supabase.from('readings').select('id, category, details, reading_date, reading_score').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
        if (readings) {
            recentSearches = readings.map(r => ({
                id: r.id,
                destination: (r.details as any)?.destination || "Unknown",
                score: r.reading_score,
                travel_date: new Date(r.reading_date).toISOString().split('T')[0]
            })) as any;
        }
    } else {
        // Fallback explicitly to the builder@astronat.local mock reading we just seeded if it exists (Demo UX)
        const { data: latestReading } = await supabase.from('readings').select('id, category, details, reading_date, reading_score').order('created_at', { ascending: false }).limit(1).single();
        if (latestReading) {
             recentSearches = [
                {
                    id: latestReading.id as any,
                    destination: (latestReading.details as any)?.destination || "Unknown",
                    score: latestReading.reading_score,
                    travel_date: new Date(latestReading.reading_date).toISOString().split('T')[0]
                }
             ];
        }
    }

    const birthDate = new Date(profile.birth_date);
    const sunSignData = getSunSign(birthDate.getMonth() + 1, birthDate.getDate());

    return (
        <HomeClient 
            profile={profile} 
            sunSignData={sunSignData} 
            recentSearches={recentSearches} 
        />
    );
}
