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
      const [
        { data: sub },
        { count: readingsCount },
        { data: latestReading },
        { data: latestSinglePurchase, count: singlePurchaseCount },
        { data: lifetimePurchase },
      ] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", userId)
          .in("status", ["active", "trialing"])
          .limit(1)
          .maybeSingle(),
        supabase
          .from("readings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("readings")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("purchases")
          .select("created_at", { count: "exact" })
          .eq("user_id", userId)
          .eq("product", "single_reading")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("product", "lifetime_access")
          .limit(1)
          .maybeSingle(),
      ]);

      const readingsTotal = readingsCount ?? 0;
      const freeUsed = readingsTotal >= 1;
      const hasSubscription = !!sub || !!lifetimePurchase;
      const singlePurchasesTotal = singlePurchaseCount ?? 0;
      const latestSingleAfterLatestReading =
        !!latestSinglePurchase?.created_at &&
        (!latestReading?.created_at ||
          new Date(latestSinglePurchase.created_at).getTime() >
            new Date(latestReading.created_at).getTime());
      const hasSingleReadingCredit =
        readingsTotal < 1 + singlePurchasesTotal || latestSingleAfterLatestReading;

      return {
        hasSubscription,
        freeUsed,
        canRead: hasSubscription || !freeUsed || hasSingleReadingCredit,
        readingsTotal,
      };
    },
    [`access-${userId}`],
    { tags: [`access-${userId}`], revalidate: 60 }
  )();
}
