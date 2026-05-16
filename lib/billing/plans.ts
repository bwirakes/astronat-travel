export const BILLING_PLAN_CODES = [
  "single_reading",
  "explorer_monthly",
  "founder_lifetime",
] as const;

export type BillingPlanCode = (typeof BILLING_PLAN_CODES)[number];

export type BillingPlan = {
  code: BillingPlanCode;
  label: string;
  stripePriceEnv: string;
  mode: "payment" | "subscription";
  entitlement: "paid_credit" | "subscription_unlimited" | "lifetime_unlimited";
  credits: number | null;
};

export const BILLING_PLANS: Record<BillingPlanCode, BillingPlan> = {
  single_reading: {
    code: "single_reading",
    label: "Single Reading",
    stripePriceEnv: "STRIPE_PRICE_SINGLE_READING",
    mode: "payment",
    entitlement: "paid_credit",
    credits: 1,
  },
  explorer_monthly: {
    code: "explorer_monthly",
    label: "Explorer Pass",
    stripePriceEnv: "STRIPE_PRICE_EXPLORER_MONTHLY",
    mode: "subscription",
    entitlement: "subscription_unlimited",
    credits: null,
  },
  founder_lifetime: {
    code: "founder_lifetime",
    label: "Founder's Club",
    stripePriceEnv: "STRIPE_PRICE_FOUNDER_LIFETIME",
    mode: "payment",
    entitlement: "lifetime_unlimited",
    credits: null,
  },
};

export function isBillingPlanCode(value: unknown): value is BillingPlanCode {
  return typeof value === "string" && BILLING_PLAN_CODES.includes(value as BillingPlanCode);
}

export function getBillingPlan(code: BillingPlanCode): BillingPlan & { stripePriceId: string } {
  const plan = BILLING_PLANS[code];
  const stripePriceId = process.env[plan.stripePriceEnv];

  if (!stripePriceId) {
    throw new Error(`Missing ${plan.stripePriceEnv} for ${plan.label}`);
  }

  return { ...plan, stripePriceId };
}

export function getBillingPlanByPriceId(priceId: string | null | undefined) {
  if (!priceId) return null;

  for (const code of BILLING_PLAN_CODES) {
    const plan = BILLING_PLANS[code];
    if (process.env[plan.stripePriceEnv] === priceId) {
      return getBillingPlan(code);
    }
  }

  return null;
}
