import { prisma } from "@/src/lib/prisma";

/**
 * Rate limiter that works in serverless environments.
 * Uses database-backed sliding window (via WebhookEvent table pattern).
 * For high-traffic production, configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * and this will automatically use Redis-backed Upstash rate limiting.
 */

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

// --- Upstash Redis (preferred for production) ---
let upstashRateLimiter: {
  limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
} | null = null;

async function getUpstashLimiter(maxRequests: number, windowSeconds: number) {
  if (upstashRateLimiter) return upstashRateLimiter;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({ url: redisUrl, token: redisToken });

    upstashRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: true,
    });

    return upstashRateLimiter;
  } catch {
    return null;
  }
}

// --- Database-backed fallback (works in serverless without Redis) ---
async function dbRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  // Count recent requests from this key using ConversionEvent as a lightweight store
  // We'll use a dedicated approach: count webhook events or use a raw query
  const count = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "ConversionEvent"
    WHERE "eventName" = ${"rate_limit_" + key}
    AND "createdAt" > ${windowStart}
  `;

  const currentCount = Number(count[0]?.count ?? 0);

  if (currentCount >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: windowSeconds,
    };
  }

  // Record this request
  await prisma.conversionEvent.create({
    data: {
      eventName: "rate_limit_" + key,
      metadata: { timestamp: Date.now() },
    },
  });

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
    resetInSeconds: windowSeconds,
  };
}

/**
 * Check rate limit for a given identifier.
 * Uses Upstash Redis if configured, falls back to database.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  // Try Upstash first (production)
  const upstash = await getUpstashLimiter(maxRequests, windowSeconds);

  if (upstash) {
    const result = await upstash.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetInSeconds: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  }

  // Fallback to database-backed rate limiting
  return dbRateLimit(identifier, maxRequests, windowSeconds);
}

/**
 * Clean up expired rate limit records (run periodically).
 */
export async function cleanupRateLimitRecords(): Promise<number> {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
  const result = await prisma.conversionEvent.deleteMany({
    where: {
      eventName: { startsWith: "rate_limit_" },
      createdAt: { lt: cutoff },
    },
  });
  return result.count;
}
