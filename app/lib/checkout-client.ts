"use client";

export type CheckoutPlanCode =
  | "single_reading"
  | "explorer_monthly"
  | "founder_lifetime";

export async function startCheckout(plan: CheckoutPlanCode, returnTo?: string) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, returnTo }),
  });

  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Unable to start checkout.");
  }

  window.location.href = data.url;
}
