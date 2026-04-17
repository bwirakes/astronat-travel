import DashboardLayout from "@/app/components/DashboardLayout";
import LockedReadingView from "@/app/components/LockedReadingView";
import BirthdayClient from "./BirthdayClient";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";

export default async function BirthdayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const access = user ? await getReadingAccess(user.id) : null;

  // Demo mode (`?demo=true`) intentionally bypasses the access gate so prospective
  // users can preview the feature. The real generation API still enforces limits.
  if (access && !access.canRead) {
    return (
      <DashboardLayout title="Birthday Optimizer" kicker="SOLAR RETURN" backLabel="Home" backHref="/dashboard">
        <LockedReadingView returnTo="/birthday" />
      </DashboardLayout>
    );
  }

  return <BirthdayClient />;
}
