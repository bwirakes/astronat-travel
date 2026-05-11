import { createClient } from "@/lib/supabase/server";

export type ReadingAccess = {
  hasSubscription: boolean;
  freeUsed: boolean;
  canRead: boolean;
  readingsTotal: number;
};

export async function getReadingAccess(userId: string): Promise<ReadingAccess> {
  const supabase = await createClient();
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
}
