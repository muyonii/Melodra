import { getClientIp, sendJson, type ApiRequest, type ApiResponse } from './http';

// NOTE: In-memory per-IP rate limiter (per serverless instance / Node process).
// This is a placeholder safeguard: on horizontally scaled serverless deployments, each warm
// instance maintains an independent window map. Replace with a shared store (e.g. Redis)
// if global cross-instance rate limiting is required.

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
}

interface BucketEntry {
  count: number;
  resetAtMs: number;
}

const buckets = new Map<string, BucketEntry>();
const MAX_BUCKETS = 2500;

function pruneExpiredBuckets(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAtMs <= now) {
      buckets.delete(key);
    }
  }
  if (buckets.size >= MAX_BUCKETS) {
    buckets.clear();
  }
}

export function resetRateLimiterForTests(): void {
  buckets.clear();
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = options.now ?? Date.now();
  pruneExpiredBuckets(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAtMs <= now) {
    const resetAtMs = now + options.windowMs;
    buckets.set(key, { count: 1, resetAtMs });
    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetAtMs,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetAtMs: existing.resetAtMs,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAtMs: existing.resetAtMs,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000)),
  };
}

export function applyRateLimit(
  req: ApiRequest,
  res: ApiResponse,
  options: { route: string; limit: number; windowMs: number },
): boolean {
  const ip = getClientIp(req);
  const result = checkRateLimit(`${options.route}:${ip}`, options);

  res.setHeader('X-RateLimit-Limit', String(result.limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAtMs / 1000)));

  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
    sendJson(res, 429, {
      error: 'Too many requests. Please wait a moment and try again.',
    });
    return false;
  }

  return true;
}
