import { Suspense } from "react";
import ChartClient from "./ChartClient";
import { AstroAppLoader } from "@/app/components/ui/app-loader-shell";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getNatalChart } from "@/lib/db";

// Build the same shape the /api/natal cache-hit branch returns. When the
// cached chart is complete (planets + cusps + angles), we hand it to the
// client as a prop and the client skips its own /api/natal fetch on mount.
// On cache miss or partial cache (no `angles`), we return null and let
// ChartClient call /api/natal as before — that path handles the
// angle/aspect backfill for old cache rows.
async function buildInitialNatalData(userId: string) {
    const [profile, cached] = await Promise.all([getProfile(userId), getNatalChart(userId)]);
    if (!profile?.birth_date || !profile?.birth_time) return null;
    const ephemeris = cached?.ephemeris_data as
        | { planets?: unknown[]; cusps?: number[]; angles?: unknown[] }
        | null
        | undefined;
    if (!ephemeris?.planets || !ephemeris?.cusps || !ephemeris?.angles) return null;

    return {
        ...ephemeris,
        first_name: (profile as { first_name?: string | null }).first_name ?? null,
        last_name: (profile as { last_name?: string | null }).last_name ?? null,
        birth_city: profile.birth_city,
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        birth_lat: profile.birth_lat,
        birth_lon: profile.birth_lon,
    };
}

export default async function ChartPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const initialNatalData = user ? await buildInitialNatalData(user.id) : null;

    return (
        <Suspense fallback={<AstroAppLoader label="Loading chart..." />}>
            <ChartClient initialNatalData={initialNatalData} />
        </Suspense>
    );
}
