import "server-only";

import * as Sentry from "@sentry/nextjs";

type CaptureContext = {
  route?: string;
  method?: string;
  status?: number;
  userId?: string | null;
  tags?: Record<string, string | number | boolean | null | undefined>;
  extra?: Record<string, unknown>;
};

const PRIVATE_KEY_RE =
  /(authorization|cookie|token|secret|password|key|email|birth|prompt|body|stripe|session)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") return value.length > 240 ? `${value.slice(0, 240)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  if (typeof value !== "object") return String(value);

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, inner]) => [
      key,
      PRIVATE_KEY_RE.test(key) ? "[redacted]" : sanitize(inner, depth + 1),
    ]),
  );
}

export function captureServerError(error: unknown, context: CaptureContext = {}) {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.captureException(error, {
    tags: {
      route: context.route,
      method: context.method,
      status: context.status,
      ...context.tags,
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: sanitize(context.extra ?? {}) as Record<string, unknown>,
  });
}
