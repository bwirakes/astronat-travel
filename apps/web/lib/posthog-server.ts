import { PostHog } from "posthog-node";

type PostHogCaptureEvent = Parameters<PostHog["capture"]>[0];

export function getPostHogClient(): PostHog {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_TOKEN!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function capturePostHogEvent(event: PostHogCaptureEvent): Promise<void> {
  let posthog: PostHog | null = null;

  try {
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
