import ReadingFlow from "@/app/components/ReadingFlow";
import WeatherReadingFlow from "@/app/components/WeatherReadingFlow";
import LockedReadingView from "@/app/components/LockedReadingView";
import { AppLoaderShell } from "@/app/components/ui/app-loader-shell";
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
    const title = isWeather ? "Sky Weather" : "New Reading";
    if (access && !access.canRead) {
        return (
            <>
                <PageHeader title={title} />
                <AppLoaderShell minHeight="0" padding="0">
                    <LockedReadingView returnTo={isWeather ? "/reading/new?type=weather" : "/reading/new"} />
                </AppLoaderShell>
            </>
        );
    }

    return (
        <>
            <PageHeader title={title} />
            <AppLoaderShell>
                <Suspense fallback={null}>
                    {isWeather ? <WeatherReadingFlow /> : <ReadingFlow />}
                </Suspense>
            </AppLoaderShell>
        </>
    );
}
