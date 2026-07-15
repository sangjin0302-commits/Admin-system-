/**
 * 고객용 법령 참고 검색 rate limit — IP당 24시간 3회.
 * Upstash 미설정 시 in-memory fallback.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const MAX_PER_DAY = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

const redis = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
})();

const publicLawLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(MAX_PER_DAY, "24 h"),
      prefix: "rl:public-law",
      analytics: false
    })
  : null;

const memMap = new Map<string, { count: number; resetAt: number }>();

function memLimit(key: string): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const ent = memMap.get(key);
  if (!ent || ent.resetAt < now) {
    const resetAt = now + WINDOW_MS;
    memMap.set(key, { count: 1, resetAt });
    return { success: true, remaining: MAX_PER_DAY - 1, resetAt };
  }
  if (ent.count >= MAX_PER_DAY) {
    return { success: false, remaining: 0, resetAt: ent.resetAt };
  }
  ent.count++;
  return { success: true, remaining: MAX_PER_DAY - ent.count, resetAt: ent.resetAt };
}

export async function checkPublicLawLimit(
  ip: string
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const key = ip || "unknown";
  if (publicLawLimiter) {
    const r = await publicLawLimiter.limit(key);
    return { success: r.success, remaining: r.remaining, resetAt: r.reset };
  }
  return memLimit(`public-law:${key}`);
}
