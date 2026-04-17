import DashboardLayout from "@/app/components/DashboardLayout";
import LockedReadingView from "@/app/components/LockedReadingView";
import CouplesClient from "./CouplesClient";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";

export default async function CouplesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const access = user ? await getReadingAccess(user.id) : null;

  if (access && !access.canRead) {
    return (
      <DashboardLayout title="Couples & Family" kicker="SYNASTRY" backLabel="Home" backHref="/dashboard">
        <LockedReadingView returnTo="/couples" />
      </DashboardLayout>
    );
  }

  return <CouplesClient />;
}
