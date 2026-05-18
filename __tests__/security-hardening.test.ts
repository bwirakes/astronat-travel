import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("security hardening guards", () => {
  test("user-scoped API routes do not trust caller-provided user ids", () => {
    const userScopedRoutes = [
      "app/api/natal/route.ts",
      "app/api/chart/interpret/route.ts",
      "app/api/astro/weather/route.ts",
      "app/api/astro/transits/route.ts",
      "app/api/transits/route.ts",
    ];

    for (const route of userScopedRoutes) {
      const source = read(route);
      expect(source).not.toContain('searchParams.get("userId")');
      expect(source).not.toContain("searchParams.get('userId')");
      expect(source).not.toContain("const { user_id }");
      expect(source).not.toContain("body.user_id");
    }
  });

  test("checkout success callback does not perform service-role access grants", () => {
    const source = read("app/api/checkout/success/route.ts");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain("revalidateTag");
    expect(source).toContain("Stripe webhook is the authoritative writer");
  });

  test("webhook and internal auth avoid reviewed reliability regressions", () => {
    const webhook = read("app/api/stripe/webhook/route.ts");
    const internalAuth = read("lib/security/internal-auth.ts");

    expect(webhook).not.toContain("await res.text()");
    expect(webhook).not.toContain("process.env.STRIPE_WEBHOOK_SECRET!");
    expect(webhook).toContain("Webhook not configured");
    expect(webhook).toContain("if (offer === 'single')");
    expect(webhook).toContain("do not block paid access on a secondary purchase-ledger write");
    expect(internalAuth).toContain("INTERNAL_API_SECRET, process.env.CRON_SECRET");
    expect(internalAuth).toContain("expected.some");
  });

  test("intake captcha bypasses cannot be used in production", () => {
    const intake = read("app/api/intake/route.ts");

    expect(intake).toContain('process.env.NODE_ENV !== "production"');
    expect(intake).toContain("if (hasSecret && !isBypass)");
    expect(intake).toContain("if (!captchaToken)");
    expect(intake).not.toContain('captchaToken && !isBypass');
    expect(intake).not.toContain("process.env.NOTION_INTAKE_DB_ID!");
    expect(intake).not.toContain("process.env.INTAKE_NOTIFICATION_EMAIL!");
  });

  test("security headers and monitoring integrations are configured", () => {
    const nextConfig = read("next.config.ts");
    expect(nextConfig).toContain("Content-Security-Policy");
    expect(nextConfig).toContain("Strict-Transport-Security");
    expect(nextConfig).toContain("withSentryConfig");
    expect(nextConfig).not.toContain("ignoreBuildErrors");
    expect(nextConfig).toContain("unsafe-eval");
    expect(nextConfig).toContain("https://va.vercel-scripts.com");
    expect(nextConfig).toContain("future CSP pass");

    const healthRoute = read("app/api/health/route.ts");
    expect(healthRoute).toContain('dynamic = "force-dynamic"');

    const clientInstrumentation = read("instrumentation-client.ts");
    const serverInstrumentation = read("instrumentation.ts");
    const sentryServerConfig = read("sentry.server.config.ts");
    const sentryEdgeConfig = read("sentry.edge.config.ts");
    expect(clientInstrumentation).toContain("Sentry.init");
    expect(serverInstrumentation).toContain("./sentry.server.config");
    expect(serverInstrumentation).toContain("./sentry.edge.config");
    expect(serverInstrumentation).toContain("captureRequestError");
    expect(sentryServerConfig).toContain("Sentry.init");
    expect(sentryEdgeConfig).toContain("Sentry.init");
    expect(sentryServerConfig).toContain("sendDefaultPii: false");
    expect(sentryEdgeConfig).toContain("sendDefaultPii: false");
  });

  test("baseline documentation records the known reliability risks", () => {
    const baseline = read("docs/observability-security-baseline.md");
    expect(baseline).toContain("Stripe webhook");
    expect(baseline).toContain("service-role");
    expect(baseline).toContain("Upstash Redis");
    expect(baseline).toContain("Sentry");
  });
});
