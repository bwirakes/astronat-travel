import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  } else {
    return;
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

export const onRequestError = Sentry.captureRequestError;
