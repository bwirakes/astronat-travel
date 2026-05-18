export async function register() {
  // Only run on Node.js server runtime — not Edge
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1,
      sendDefaultPii: false,
    });
  }

  // Skip OTel/PostHog instrumentation when no token is configured. Without
  // this guard, PostHogSpanProcessor throws "PostHogSpanProcessor requires
  // an apiKey" at startup, which crashes the entire dev server in any
  // environment without analytics credentials (CI, local dev without .env).
  const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
  if (!posthogToken) return;

  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { resourceFromAttributes } = await import("@opentelemetry/resources");
  const { PostHogSpanProcessor } = await import("@posthog/ai/otel");

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": "astronat",
    }),
    spanProcessors: [
      new PostHogSpanProcessor({
        apiKey: posthogToken,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      }),
    ],
  });

  sdk.start();
}
