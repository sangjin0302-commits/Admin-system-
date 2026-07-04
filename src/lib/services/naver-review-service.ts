/**
 * Naver Place Review Service
 *
 * Naver Place has no public review API, so admin manually pastes reviews.
 * Storage: SiteSetting key "naver.reviews" (JSON array of NaverReview).
 * Cache: 1-hour in-memory.
 */

import { prisma } from "@/lib/prisma/client";

export type NaverReview = {
  author: string;
  rating: number;
  text: string;
  date: string; // ISO or human string
  url?: string;
};

export type NaverReviewSummary = {
  reviews: NaverReview[];
  count: number;
  avgRating: number;
  placeUrl: string | null;
};

const REVIEWS_KEY = "naver.reviews";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let _cache: { at: number; data: NaverReviewSummary } | null = null;

export function invalidateNaverReviewCache() {
  _cache = null;
}

function placeUrlFromEnv(): string | null {
  const id = process.env.NAVER_PLACE_ID;
  if (!id) return null;
  return `https://m.place.naver.com/place/${encodeURIComponent(id)}/review/visitor`;
}

function normalize(raw: unknown): NaverReview | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const author = typeof obj.author === "string" ? obj.author.trim() : "";
  const text = typeof obj.text === "string" ? obj.text.trim() : "";
  const date = typeof obj.date === "string" ? obj.date.trim() : "";
  const ratingRaw = typeof obj.rating === "number" ? obj.rating : Number(obj.rating);
  const rating = Number.isFinite(ratingRaw) ? Math.max(0, Math.min(5, ratingRaw)) : 0;
  const url = typeof obj.url === "string" && obj.url ? obj.url : undefined;
  if (!author || !text) return null;
  return { author, rating, text, date, url };
}

async function readReviewsFromDb(): Promise<NaverReview[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: REVIEWS_KEY } }).catch(() => null);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((r): r is NaverReview => r !== null);
  } catch {
    return [];
  }
}

export async function getNaverReviewSummary(): Promise<NaverReviewSummary> {
  if (_cache && Date.now() - _cache.at < CACHE_TTL_MS) return _cache.data;

  const reviews = await readReviewsFromDb();
  const count = reviews.length;
  const avgRating =
    count > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const summary: NaverReviewSummary = {
    reviews,
    count,
    avgRating,
    placeUrl: placeUrlFromEnv()
  };
  _cache = { at: Date.now(), data: summary };
  return summary;
}

export async function saveNaverReviews(reviews: NaverReview[]): Promise<void> {
  const cleaned = reviews.map((r) => normalize(r)).filter((r): r is NaverReview => r !== null);
  await prisma.siteSetting.upsert({
    where: { key: REVIEWS_KEY },
    create: { key: REVIEWS_KEY, value: JSON.stringify(cleaned) },
    update: { value: JSON.stringify(cleaned) }
  });
  invalidateNaverReviewCache();
}
