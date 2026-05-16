import { createClient } from "@/lib/supabase/server";

export type ReadingAccess = {
  hasSubscription: boolean;
  hasLifetimeAccess: boolean;
  freeUsed: boolean;
  canRead: boolean;
  readingsTotal: number;
  paidCredits: number;
  accessSource: "subscription" | "lifetime" | "paid_credit" | "free" | "none";
};

export async function getReadingAccess(userId: string): Promise<ReadingAccess> {
  const supabase = await createClient();
  const [{ data: sub }, { data: lifetime }, { data: creditRows }, { count }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle(),
    supabase
      .from("user_entitlements")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_code", "founder_lifetime")
      .eq("status", "active")
      .eq("unlimited", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_entitlements")
      .select("remaining_credits")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("unlimited", false)
      .gt("remaining_credits", 0),
    supabase
      .from("readings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const hasActiveSubscription = !!sub;
  const hasLifetimeAccess = !!lifetime;
  const hasSubscription = hasActiveSubscription || hasLifetimeAccess;
  const paidCredits = (creditRows ?? []).reduce(
    (sum: number, row: { remaining_credits: number | null }) => sum + Number(row.remaining_credits ?? 0),
    0,
  );
  const readingsTotal = count ?? 0;
  const freeUsed = readingsTotal >= 1;
  const canUseFreeReading = !freeUsed;
  const canRead = hasSubscription || paidCredits > 0 || canUseFreeReading;
  const accessSource: ReadingAccess["accessSource"] = hasActiveSubscription
    ? "subscription"
    : hasLifetimeAccess
      ? "lifetime"
      : paidCredits > 0
        ? "paid_credit"
        : canUseFreeReading
          ? "free"
          : "none";

  return {
    hasSubscription,
    hasLifetimeAccess,
    freeUsed,
    canRead,
    readingsTotal,
    paidCredits,
    accessSource,
  };
}
