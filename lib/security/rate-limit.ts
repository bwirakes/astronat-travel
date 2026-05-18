import "server-only";

import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export type RateLimitPolicy =
  | "geocode"
  | "readingGenerate"
  | "chartInterpret"
  | "intake"
  | "checkout"
  | "astroCompute"
  | "healthDeep";

type PolicyConfig = {
  limit: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
};

const POLICIES: Record<RateLimitPolicy, PolicyConfig> = {
  geocode: { limit: 45, window: "1 m" },
  readingGenerate: { limit: 8, window: "1 h" },
  chartInterpret: { limit: 12, window: "1 h" },
  intake: { limit: 5, window: "1 h" },
  checkout: { limit: 20, window: "10 m" },
  astroCompute: { limit: 30, window: "10 m" },
  healthDeep: { limit: 30, window: "1 m" },
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<RateLimitPolicy, Ratelimit>();

function getLimiter(policy: RateLimitPolicy): Ratelimit | null {
  if (!redis) return null;
  const existing = limiters.get(policy);
  if (existing) return existing;

  const config = POLICIES[policy];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
    prefix: `astronat:${policy}`,
  });
  limiters.set(policy, limiter);
  return limiter;
}

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function requestIdentity(request: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor || realIp || "anonymous";
  return `ip:${hashIdentifier(ip)}`;
}

export async function checkRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  userId?: string | null,
) {
  const limiter = getLimiter(policy);
  if (!limiter) return { success: true, limit: 0, remaining: 0, reset: 0, pending: Promise.resolve() };

  return limiter.limit(requestIdentity(request, userId));
}

export async function enforceRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  userId?: string | null,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, policy, userId);
  if (result.success) return null;

  return NextResponse.json(
    {
      error: "Too many requests. Please try again shortly.",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  );
}
