import { PostHog } from "posthog-node";

type PostHogCaptureEvent = Parameters<PostHog["capture"]>[0];
type PostHogIdentifyEvent = Parameters<PostHog["identify"]>[0];

export function getPostHogClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
  if (!apiKey) return null;

  return new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function capturePostHogEvent(event: PostHogCaptureEvent): Promise<void> {
  let posthog: PostHog | null = null;

  try {
    posthog = getPostHogClient();
    if (!posthog) return;
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

export async function identifyPostHogUser(event: PostHogIdentifyEvent): Promise<void> {
  let posthog: PostHog | null = null;

  try {
    posthog = getPostHogClient();
    if (!posthog) return;
    posthog.identify(event);
  } catch (error) {
    console.warn("[posthog] identify failed:", error);
    return;
  }

  try {
    await posthog.shutdown();
  } catch (error) {
    console.warn("[posthog] shutdown failed:", error);
  }
}
