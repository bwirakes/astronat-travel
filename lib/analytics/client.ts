"use client";

import posthog from "posthog-js";

type AnalyticsProperties = Record<string, unknown>;

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

export const isPostHogEnabled = Boolean(posthogToken);

function warnPostHog(action: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[posthog] ${action} failed:`, error);
  }
}

export function captureAnalyticsEvent(event: string, properties?: AnalyticsProperties) {
  if (!isPostHogEnabled) return;

  try {
    posthog.capture(event, properties);
  } catch (error) {
    warnPostHog(`capture ${event}`, error);
  }
}

export function identifyAnalyticsUser(
  distinctId: string,
  properties?: AnalyticsProperties,
) {
  if (!isPostHogEnabled) return;

  try {
    posthog.identify(distinctId, properties);
  } catch (error) {
    warnPostHog("identify", error);
  }
}

export function resetAnalytics() {
  if (!isPostHogEnabled) return;

  try {
    posthog.reset();
  } catch (error) {
    warnPostHog("reset", error);
  }
}

export function captureAnalyticsException(error: unknown, properties?: AnalyticsProperties) {
  if (!isPostHogEnabled) return;

  try {
    posthog.captureException(error, properties);
  } catch (captureError) {
    warnPostHog("captureException", captureError);
  }
}
