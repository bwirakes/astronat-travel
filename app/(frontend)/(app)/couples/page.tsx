import LockedReadingView from "@/app/components/LockedReadingView";
import CouplesClient from "./CouplesClient";
import { PageHeader } from "@/components/app/page-header-context";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";

export default async function CouplesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const access = user ? await getReadingAccess(user.id) : null;

  if (access && !access.canRead) {
    return (
      <>
        <PageHeader title="Couples & Family" />
        <div style={{ padding: "var(--space-lg) var(--space-md) var(--space-3xl)" }}>
          <LockedReadingView returnTo="/couples" />
        </div>
      </>
    );
  }

  return <CouplesClient />;
}
