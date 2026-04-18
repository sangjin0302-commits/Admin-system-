type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

type RateLimitGlobal = typeof globalThis & {
  __adminSystemRateLimitStore?: RateLimitStore;
  __adminSystemRateLimitCleanupAt?: number;
};

type ConsumeRateLimitInput = {
  namespace: string;
  key: string;
  max: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  resetAt: number;
};

const CLEANUP_INTERVAL_MS = 60_000;

function getStore() {
  const state = globalThis as RateLimitGlobal;
  if (!state.__adminSystemRateLimitStore) {
    state.__adminSystemRateLimitStore = new Map();
  }
  return state.__adminSystemRateLimitStore;
}

function maybeCleanupExpiredBuckets(now: number) {
  const state = globalThis as RateLimitGlobal;
  const nextCleanupAt = state.__adminSystemRateLimitCleanupAt ?? 0;
  if (now < nextCleanupAt) {
    return;
  }

  const store = getStore();
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }

  state.__adminSystemRateLimitCleanupAt = now + CLEANUP_INTERVAL_MS;
}

export function consumeRateLimit(input: ConsumeRateLimitInput): RateLimitResult {
  const now = input.now ?? Date.now();
  maybeCleanupExpiredBuckets(now);

  const safeMax = Math.max(1, input.max);
  const safeWindowMs = Math.max(1_000, input.windowMs);
  const scopedKey = `${input.namespace}:${input.key}`;

  const store = getStore();
  const existing = store.get(scopedKey);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + safeWindowMs
        };

  bucket.count += 1;
  store.set(scopedKey, bucket);

  const allowed = bucket.count <= safeMax;
  const remaining = allowed ? Math.max(0, safeMax - bucket.count) : 0;
  const retryAfterSec = allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed,
    remaining,
    retryAfterSec,
    resetAt: bucket.resetAt
  };
}

export function getClientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return "unknown";
}

export function getEnvInt(name: string, defaultValue: number, min: number, max: number) {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}

