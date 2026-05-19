import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasInternalSecret } from "@/lib/security/internal-auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureServerError } from "@/lib/monitoring/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasInternalSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await enforceRateLimit(request, "healthDeep");
  if (limited) return limited;

  const checks: Record<string, { ok: boolean; detail?: string }> = {
    env: {
      ok: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SERVICE_ROLE_KEY &&
          process.env.STRIPE_SECRET_KEY,
      ),
    },
    sentry: { ok: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) },
    posthog: { ok: Boolean(process.env.NEXT_PUBLIC_POSTHOG_TOKEN) },
    upstash: { ok: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) },
    supabase: { ok: false },
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    checks.supabase = error ? { ok: false, detail: error.message } : { ok: true };
  } catch (error) {
    checks.supabase = { ok: false, detail: error instanceof Error ? error.message : String(error) };
    captureServerError(error, { route: "/api/health/deep", method: "GET" });
  }

  const ok = Object.values(checks).every((check) => check.ok);
  return NextResponse.json({ ok, time: new Date().toISOString(), checks }, { status: ok ? 200 : 503 });
}
