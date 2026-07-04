import { createHash } from "crypto";

export type CachedResponse = {
  value: unknown;
  createdAt: number;
};

type CacheEntry = CachedResponse & {
  key: string;
};

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MAX_ENTRIES = 100;

export class LawbotCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly store = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  constructor(options?: { ttlMs?: number; maxEntries?: number }) {
    this.ttlMs = options?.ttlMs ?? Number(process.env.LAWBOT_CACHE_TTL_MS || DEFAULT_TTL_MS);
    this.maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  generateKey(body: Record<string, unknown>): string {
    const serialized = JSON.stringify(body, Object.keys(body).sort());
    return createHash("sha256").update(serialized).digest("hex");
  }

  get(key: string): CachedResponse | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // LRU: move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits++;

    return { value: entry.value, createdAt: entry.createdAt };
  }

  set(key: string, value: unknown): void {
    // If key exists, delete first so it moves to end
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { key, value, createdAt: Date.now() });
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0
    };
  }
}

export const lawbotCache = new LawbotCache();
