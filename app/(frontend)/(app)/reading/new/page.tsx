import ReadingFlow from "@/app/components/ReadingFlow";
import WeatherReadingFlow from "@/app/components/WeatherReadingFlow";
import LockedReadingView from "@/app/components/LockedReadingView";
import { PageHeader } from "@/components/app/page-header-context";
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
        <>
            <PageHeader title={isWeather ? "Sky Weather" : "New Reading"} />
            <div style={{
                maxWidth: "960px",
                margin: "0 auto",
                width: "100%",
                padding: "var(--space-lg) var(--space-md) var(--space-3xl)",
                display: "flex",
                flexDirection: "column",
            }}>
                {access && !access.canRead ? (
                    <LockedReadingView returnTo={isWeather ? "/reading/new?type=weather" : "/reading/new"} />
                ) : (
                    <Suspense fallback={null}>
                        {isWeather ? <WeatherReadingFlow /> : <ReadingFlow />}
                    </Suspense>
                )}
            </div>
        </>
    );
}
