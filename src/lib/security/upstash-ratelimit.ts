/**
 * Upstash Redis 기반 분산 rate limit.
 * 서버리스 환경(Vercel)에서 in-memory map의 cold-start 우회 문제 해결.
 *
 * 환경변수:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * 미설정 시 자동 in-memory fallback (단일 인스턴스만 보호).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

// In-memory fallback (Redis 없을 때만)
const memMap = new Map<string, { count: number; resetAt: number }>();

function memLimit(key: string, max: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const ent = memMap.get(key);
  if (!ent || ent.resetAt < now) {
    memMap.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  ent.count++;
  if (ent.count > max) return { ok: false, remaining: 0 };
  return { ok: true, remaining: max - ent.count };
}

/** Brute-force 보호용 (admin auth 5/min) */
export const adminAuthLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, "1 m"),
      prefix: "rl:admin-auth",
      analytics: false
    })
  : null;

/** 공개 intake 보호용 (10/5min) */
export const intakeLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "5 m"),
      prefix: "rl:intake",
      analytics: false
    })
  : null;

export async function checkAdminAuthLimit(ip: string): Promise<{ ok: boolean; remaining: number }> {
  if (adminAuthLimiter) {
    const r = await adminAuthLimiter.limit(ip);
    return { ok: r.success, remaining: r.remaining };
  }
  return memLimit(`admin-auth:${ip}`, 5, 60_000);
}

export async function checkIntakeLimit(ip: string): Promise<{ ok: boolean; remaining: number }> {
  if (intakeLimiter) {
    const r = await intakeLimiter.limit(ip);
    return { ok: r.success, remaining: r.remaining };
  }
  return memLimit(`intake:${ip}`, 10, 5 * 60_000);
}

export function isUpstashConfigured(): boolean {
  return redis !== null;
}
