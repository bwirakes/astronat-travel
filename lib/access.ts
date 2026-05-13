import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReadingAccess = {
  hasSubscription: boolean;
  freeUsed: boolean;
  canRead: boolean;
  readingsTotal: number;
};

// Cached per-user. Callers MUST pass an authenticated user.id; the admin
// client bypasses RLS so a wrong userId would leak data. Page-level auth
// already gates this. Tag: `access-<userId>`. Revalidate when:
//   - a new reading is inserted (readingsTotal changes)
//   - a subscription row is inserted/updated (hasSubscription changes)
export async function getReadingAccess(userId: string): Promise<ReadingAccess> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const [{ data: sub }, { count }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", userId)
          .in("status", ["active", "trialing"])
          .maybeSingle(),
        supabase
          .from("readings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      const hasSubscription = !!sub;
      const readingsTotal = count ?? 0;
      const freeUsed = readingsTotal >= 1;
      return {
        hasSubscription,
        freeUsed,
        canRead: hasSubscription || !freeUsed,
        readingsTotal,
      };
    },
    [`access-${userId}`],
    { tags: [`access-${userId}`], revalidate: 60 }
  )();
}
