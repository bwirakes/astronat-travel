import { PostHog } from "posthog-node";

type PostHogCaptureEvent = Parameters<PostHog["capture"]>[0];

export function getPostHogClient(): PostHog {
  const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
  if (!token) {
    throw new Error("NEXT_PUBLIC_POSTHOG_TOKEN is not configured");
  }

  return new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function capturePostHogEvent(event: PostHogCaptureEvent): Promise<void> {
  let posthog: PostHog | null = null;

  try {
    if (!process.env.NEXT_PUBLIC_POSTHOG_TOKEN) return;
    posthog = getPostHogClient();
    posthog.capture(event);
  } catch (error) {
    console.warn("[posthog] capture failed:", error);
    return;
  }

  try {
    await posthog.shutdown();
  } catch (error) {
    console.warn("[posthog] shutdown failed:", error);
  }
}
