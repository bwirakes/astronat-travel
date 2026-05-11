import LockedReadingView from "@/app/components/LockedReadingView";
import BirthdayClient from "./BirthdayClient";
import { PageHeader } from "@/components/app/page-header-context";
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
      <>
        <PageHeader title="Birthday Optimizer" />
        <div style={{ padding: "var(--space-lg) var(--space-md) var(--space-3xl)" }}>
          <LockedReadingView returnTo="/birthday" />
        </div>
      </>
    );
  }

  return <BirthdayClient />;
}
