import HomeClient from "./HomeClient";
import { getSunSign } from "@/app/lib/planet-data";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess, type ReadingAccess } from "@/lib/access";

export default async function HomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const access: ReadingAccess = user
        ? await getReadingAccess(user.id)
        : { hasSubscription: false, freeUsed: false, canRead: true, readingsTotal: 0 };

    // Middleware guarantees `user` is non-null on this route; keep a typed fallback
    // only for the case where Postgres rows are missing for a fresh account.
    let profile = {
        first_name: "Friend",
        birth_date: "1995-08-15"
    };
    let recentSearches: Array<{ id: string | number; destination: string; score: number; travel_date: string }> = [];

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
