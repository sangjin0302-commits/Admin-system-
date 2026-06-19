export type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __cacheServiceStore: Map<string, CacheEntry> | undefined;
  // eslint-disable-next-line no-var
  var __cacheServiceStats: { hits: number; misses: number } | undefined;
  // eslint-disable-next-line no-var
  var __cacheServiceTimer: NodeJS.Timeout | undefined;
}

const store: Map<string, CacheEntry> =
  global.__cacheServiceStore ?? new Map<string, CacheEntry>();
const counters = global.__cacheServiceStats ?? { hits: 0, misses: 0 };

if (process.env.NODE_ENV !== "production") {
  global.__cacheServiceStore = store;
  global.__cacheServiceStats = counters;
}

function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

if (!global.__cacheServiceTimer && typeof setInterval !== "undefined") {
  global.__cacheServiceTimer = setInterval(cleanupExpired, 60_000);
  // Don't block process exit
  if (typeof global.__cacheServiceTimer.unref === "function") {
    global.__cacheServiceTimer.unref();
  }
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    counters.misses += 1;
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    counters.misses += 1;
    return null;
  }
  counters.hits += 1;
  return entry.value as T;
}

export function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
  counters.hits = 0;
  counters.misses = 0;
}

export function cacheStats(): {
  entries: number;
  estimatedSizeBytes: number;
  hitRate: number;
} {
  let bytes = 0;
  for (const [key, entry] of store) {
    bytes += key.length * 2;
    try {
      bytes += JSON.stringify(entry.value).length * 2;
    } catch {
      bytes += 64;
    }
    bytes += 8;
  }
  const total = counters.hits + counters.misses;
  const hitRate = total === 0 ? 0 : counters.hits / total;
  return { entries: store.size, estimatedSizeBytes: bytes, hitRate };
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await fn();
  cacheSet(key, value, ttlSeconds);
  return value;
}
