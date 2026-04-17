import ReadingFlow from "@/app/components/ReadingFlow";
import DashboardLayout from "@/app/components/DashboardLayout";
import LockedReadingView from "@/app/components/LockedReadingView";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";
import { Suspense } from "react";

export default async function NewReadingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const access = user ? await getReadingAccess(user.id) : null;

    return (
        <DashboardLayout showBack backLabel="Home" backHref="/dashboard">
            {access && !access.canRead ? (
                <LockedReadingView returnTo="/reading/new" />
            ) : (
                <Suspense fallback={null}>
                    <ReadingFlow />
                </Suspense>
            )}
        </DashboardLayout>
    );
}
