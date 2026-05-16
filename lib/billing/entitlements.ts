import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingPlanCode } from "@/lib/billing/plans";

type AdminClient = ReturnType<typeof createAdminClient>;

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

export async function grantCheckoutEntitlement({
  supabase,
  userId,
  planCode,
  stripeCustomerId,
  stripeSessionId,
  stripeSubscriptionId = null,
}: {
  supabase: AdminClient;
  userId: string;
  planCode: BillingPlanCode;
  stripeCustomerId: string | null;
  stripeSessionId: string;
  stripeSubscriptionId?: string | null;
}) {
  if (stripeCustomerId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId);

    if (profileError) {
      console.error("[billing] Failed to persist Stripe customer ID:", profileError.message);
    }
  }

  if (planCode === "single_reading") {
    const { error } = await supabase.from("user_entitlements").upsert(
      {
        user_id: userId,
        plan_code: planCode,
        source: "stripe",
        stripe_customer_id: stripeCustomerId,
        stripe_session_id: stripeSessionId,
        stripe_subscription_id: stripeSubscriptionId,
        status: "active",
        remaining_credits: 1,
        unlimited: false,
        ends_at: null,
      },
      { onConflict: "stripe_session_id" },
    );
    if (error) throw error;
  }

  if (planCode === "founder_lifetime") {
    const { error } = await supabase.from("user_entitlements").upsert(
      {
        user_id: userId,
        plan_code: planCode,
        source: "stripe",
        stripe_customer_id: stripeCustomerId,
        stripe_session_id: stripeSessionId,
        stripe_subscription_id: stripeSubscriptionId,
        status: "active",
        remaining_credits: null,
        unlimited: true,
        ends_at: null,
      },
      { onConflict: "stripe_session_id" },
    );
    if (error) throw error;
  }

  await recomputeProfileBillingStatus(supabase, userId);
}

export async function consumePaidReadingCredit(supabase: AdminClient, userId: string) {
  const { data: entitlement, error: findError } = await supabase
    .from("user_entitlements")
    .select("id, remaining_credits")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("unlimited", false)
    .gt("remaining_credits", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (!entitlement) return false;

  const remainingCredits = Math.max(0, Number(entitlement.remaining_credits ?? 0) - 1);
  const { error: updateError } = await supabase
    .from("user_entitlements")
    .update({
      remaining_credits: remainingCredits,
      status: remainingCredits > 0 ? "active" : "consumed",
    })
    .eq("id", entitlement.id);

  if (updateError) throw updateError;
  return true;
}

export async function recomputeProfileBillingStatus(supabase: AdminClient, userId: string) {
  const [{ data: activeSub }, { data: lifetime }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, stripe_subscription_id, current_period_end")
      .eq("user_id", userId)
      .in("status", ACTIVE_SUBSCRIPTION_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
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
  ]);

  const hasLifetime = !!lifetime;
  const hasActiveSubscription = !!activeSub;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_subscribed: hasLifetime || hasActiveSubscription,
      subscription_status: hasLifetime ? "lifetime" : activeSub?.status ?? null,
      subscription_id: hasLifetime ? null : activeSub?.stripe_subscription_id ?? null,
      subscription_ends_at: hasLifetime ? null : activeSub?.current_period_end ?? null,
    })
    .eq("id", userId);

  if (error) {
    console.error("[billing] Failed to recompute profile billing status:", error.message);
  }
}
