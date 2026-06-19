/**
 * In-memory sliding-window rate limiter.
 *
 * No external dependencies — uses a Map of timestamp arrays.
 * Expired entries are cleaned up every 60 seconds.
 */

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Auto-cleanup expired entries every 60s
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Remove if all timestamps are older than 2 minutes (generous window)
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 120_000) {
        store.delete(key);
      }
    }
  }, 60_000);
  // Allow Node to exit even if timer is running
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Sliding-window rate limiter.
 *
 * @param key        Unique identifier (e.g. IP address)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs   Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const resetAt = entry.timestamps.length > 0
    ? entry.timestamps[0] + windowMs
    : now + windowMs;

  if (entry.timestamps.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetAt,
  };
}

/**
 * Pre-configured rate limiter for API endpoints: 60 requests per minute.
 */
export function apiRateLimit(ip: string): RateLimitResult {
  return rateLimit(ip, 60, 60_000);
}

/**
 * Get current stats for monitoring. Returns all active keys and their counts.
 */
export function getRateLimitStats(): Array<{
  key: string;
  count: number;
  windowStart: number;
}> {
  const now = Date.now();
  const result: Array<{ key: string; count: number; windowStart: number }> = [];

  for (const [key, entry] of store) {
    const recent = entry.timestamps.filter((t) => t > now - 60_000);
    if (recent.length > 0) {
      result.push({
        key,
        count: recent.length,
        windowStart: recent[0],
      });
    }
  }

  return result;
}
