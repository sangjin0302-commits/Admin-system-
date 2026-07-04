/**
 * Site-internal search log — ring buffer of last 1000 entries in
 * SiteSetting.value at key "search.log". No prisma migration.
 *
 * Entries are stored lowercase and PII-scrubbed (emails, phones, long digit
 * strings). Aggregations power the admin search-trends dashboard.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const KEY = "search.log";
const MAX_ENTRIES = 1000;

export type SearchLogEntry = {
  term: string;
  timestamp: string; // ISO
  hits: number;
};

export type SearchTrendPoint = {
  date: string; // YYYY-MM-DD (KST)
  count: number;
};

export type TopTerm = {
  term: string;
  count: number;
  lastSeen: string;
  avgHits: number;
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstDateKey(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

/**
 * Normalize a raw search term for logging.
 *  - lowercase, collapse whitespace
 *  - strip anything that looks like an email or a 7+ digit sequence (phones)
 *  - hard cap at 80 chars
 * Returns null when the term is empty after scrubbing.
 */
export function normalizeSearchTerm(raw: string): string | null {
  if (typeof raw !== "string") return null;
  let t = raw.trim().toLowerCase();
  if (!t) return null;
  // scrub emails
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "");
  // scrub long digit runs (phone-like)
  t = t.replace(/\d{7,}/g, "");
  t = t.replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (t.length > 80) t = t.slice(0, 80);
  return t;
}

async function readLog(): Promise<SearchLogEntry[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SearchLogEntry[];
  } catch (err) {
    logger.warn("[search-log] read failed", err);
    return [];
  }
}

async function writeLog(entries: SearchLogEntry[]): Promise<void> {
  const capped = entries.slice(-MAX_ENTRIES);
  const value = JSON.stringify(capped);
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value, updatedBy: "search-log-service" },
    update: { value, updatedBy: "search-log-service" },
  });
}

/**
 * Non-blocking: swallows all errors. Callers should not await this in the
 * critical path of search endpoints — call it and discard the promise.
 */
export async function logSearch(rawTerm: string, hits: number): Promise<void> {
  try {
    const term = normalizeSearchTerm(rawTerm);
    if (!term) return;
    const entries = await readLog();
    entries.push({
      term,
      timestamp: new Date().toISOString(),
      hits: Math.max(0, Math.floor(hits)),
    });
    await writeLog(entries);
  } catch (err) {
    logger.warn("[search-log] log failed", err);
  }
}

function withinDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

export async function getTopSearchTerms(days: number = 30, limit: number = 20): Promise<TopTerm[]> {
  const entries = (await readLog()).filter((e) => withinDays(e.timestamp, days));
  const agg = new Map<string, { count: number; lastSeen: string; hitSum: number }>();
  for (const e of entries) {
    const cur = agg.get(e.term);
    if (cur) {
      cur.count += 1;
      cur.hitSum += e.hits;
      if (e.timestamp > cur.lastSeen) cur.lastSeen = e.timestamp;
    } else {
      agg.set(e.term, { count: 1, hitSum: e.hits, lastSeen: e.timestamp });
    }
  }
  return Array.from(agg.entries())
    .map(([term, v]) => ({
      term,
      count: v.count,
      lastSeen: v.lastSeen,
      avgHits: v.count > 0 ? v.hitSum / v.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, limit));
}

export async function getUnansweredSearches(days: number = 30, limit: number = 20): Promise<TopTerm[]> {
  const entries = (await readLog()).filter(
    (e) => withinDays(e.timestamp, days) && e.hits === 0
  );
  const agg = new Map<string, { count: number; lastSeen: string }>();
  for (const e of entries) {
    const cur = agg.get(e.term);
    if (cur) {
      cur.count += 1;
      if (e.timestamp > cur.lastSeen) cur.lastSeen = e.timestamp;
    } else {
      agg.set(e.term, { count: 1, lastSeen: e.timestamp });
    }
  }
  return Array.from(agg.entries())
    .map(([term, v]) => ({ term, count: v.count, lastSeen: v.lastSeen, avgHits: 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, limit));
}

export async function getSearchTrend(days: number = 30): Promise<SearchTrendPoint[]> {
  const entries = (await readLog()).filter((e) => withinDays(e.timestamp, days));
  const bucket = new Map<string, number>();
  for (const e of entries) {
    const key = kstDateKey(e.timestamp);
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  }
  // Fill missing days for a clean chart.
  const out: SearchTrendPoint[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = new Date(d.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
    out.push({ date: key, count: bucket.get(key) ?? 0 });
  }
  return out;
}

export async function readAllSearchLog(): Promise<SearchLogEntry[]> {
  return readLog();
}
