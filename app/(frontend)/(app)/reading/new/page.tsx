import ReadingFlow from "@/app/components/ReadingFlow";
import WeatherReadingFlow from "@/app/components/WeatherReadingFlow";
import DashboardLayout from "@/app/components/DashboardLayout";
import LockedReadingView from "@/app/components/LockedReadingView";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";
import { Suspense } from "react";

export default async function NewReadingPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const access = user ? await getReadingAccess(user.id) : null;
    const { type } = await searchParams;
    const isWeather = type === "weather";

    return (
        <DashboardLayout showBack backLabel="Home" backHref="/dashboard">
            {access && !access.canRead ? (
                <LockedReadingView returnTo={isWeather ? "/reading/new?type=weather" : "/reading/new"} />
            ) : (
                <Suspense fallback={null}>
                    {isWeather ? <WeatherReadingFlow /> : <ReadingFlow />}
                </Suspense>
            )}
        </DashboardLayout>
    );
}
