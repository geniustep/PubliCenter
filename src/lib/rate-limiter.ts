import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // في milliseconds
  uniqueTokenPerInterval: number; // عدد الطلبات المسموح بها
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, number[]>();

/**
 * Rate limiter middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get client IP
    const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const now = Date.now();
    const windowStart = now - config.interval;

    // Get or create request log for this IP
    const requestLog = rateLimitStore.get(ip) || [];

    // Filter out old requests outside the time window
    const recentRequests = requestLog.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= config.uniqueTokenPerInterval) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + config.interval;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.uniqueTokenPerInterval),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
          },
        }
      );
    }

    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(ip, recentRequests);

    // Allow request
    return null;
  };
}

/**
 * Get rate limit info for IP
 */
export function getRateLimitInfo(ip: string, config: RateLimitConfig): RateLimitInfo {
  const now = Date.now();
  const windowStart = now - config.interval;

  const requestLog = rateLimitStore.get(ip) || [];
  const recentRequests = requestLog.filter((timestamp) => timestamp > windowStart);

  const oldestRequest = recentRequests.length > 0 ? Math.min(...recentRequests) : now;
  const resetTime = oldestRequest + config.interval;

  return {
    count: recentRequests.length,
    resetTime,
  };
}

/**
 * Clear rate limit for IP
 */
export function clearRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Clear all rate limits
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Predefined rate limiters
 */
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: parseInt(process.env.API_RATE_LIMIT || '100'),
});

export const publishRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // 10 publications per minute
});

export const translateRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 50, // 50 translations per minute
});

export const uploadRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 20, // 20 uploads per minute
});
