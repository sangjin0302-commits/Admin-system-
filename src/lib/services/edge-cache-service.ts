/**
 * Vercel Edge 캐싱 헬퍼.
 *
 * withEdgeCache — Cache-Control 헤더 부여
 * 프리셋: static(1일), api-short(1분), dashboard(no-store)
 *
 * 사용:
 *   const res = NextResponse.json({...});
 *   return withEdgeCache(res, "static");
 *
 * 관리 UI: /admin/edge-cache — 최근 재검증 목록, 전체 재검증 트리거.
 */

import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const REVAL_LOG_KEY = "edge.cache.revalidation.log";
const MAX_LOG = 100;

export type EdgeCachePreset = "static" | "api-short" | "dashboard" | "public-page";

export type EdgeCacheOptions = {
  maxAge?: number;             // s-maxage
  staleWhileRevalidate?: number;
  private?: boolean;
};

const PRESETS: Record<EdgeCachePreset, EdgeCacheOptions> = {
  static: { maxAge: 86400, staleWhileRevalidate: 604800 },
  "public-page": { maxAge: 300, staleWhileRevalidate: 3600 },
  "api-short": { maxAge: 60, staleWhileRevalidate: 300 },
  dashboard: { maxAge: 0, private: true },
};

export function withEdgeCache<T extends NextResponse | Response>(
  response: T,
  presetOrOptions: EdgeCachePreset | EdgeCacheOptions
): T {
  const opts: EdgeCacheOptions =
    typeof presetOrOptions === "string" ? PRESETS[presetOrOptions] : presetOrOptions;

  if (opts.private || opts.maxAge === 0) {
    response.headers.set("Cache-Control", "private, no-store, must-revalidate");
    return response;
  }

  const parts = ["public"];
  if (opts.maxAge != null) parts.push(`s-maxage=${opts.maxAge}`);
  if (opts.staleWhileRevalidate != null) parts.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);
  response.headers.set("Cache-Control", parts.join(", "));
  return response;
}

/**
 * 경로 재검증 헬퍼 (admin update 후 호출).
 */
export async function invalidatePath(path: string, reason?: string): Promise<void> {
  try {
    revalidatePath(path);
    await logRevalidation({ path, reason, at: new Date().toISOString() });
  } catch (err) {
    logger.warn("[edge-cache] revalidatePath 실패", err);
  }
}

export async function invalidateTag(tag: string, reason?: string): Promise<void> {
  try {
    revalidateTag(tag);
    await logRevalidation({ path: `#tag:${tag}`, reason, at: new Date().toISOString() });
  } catch (err) {
    logger.warn("[edge-cache] revalidateTag 실패", err);
  }
}

export type RevalidationEntry = {
  path: string;
  reason?: string;
  at: string;
};

async function logRevalidation(entry: RevalidationEntry): Promise<void> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: REVAL_LOG_KEY } });
    const list: RevalidationEntry[] = row?.value ? JSON.parse(row.value) : [];
    list.unshift(entry);
    const trimmed = list.slice(0, MAX_LOG);
    await prisma.siteSetting.upsert({
      where: { key: REVAL_LOG_KEY },
      create: { key: REVAL_LOG_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    });
  } catch (err) {
    logger.warn("[edge-cache] 로그 저장 실패", err);
  }
}

export async function getRevalidationLog(): Promise<RevalidationEntry[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: REVAL_LOG_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value);
    return Array.isArray(arr) ? (arr as RevalidationEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * 캐시 가능 공개 경로 목록 — 관리 UI 노출용.
 * 실제 경로는 라우트 파일에서 withEdgeCache로 개별 적용.
 */
export const CACHEABLE_PUBLIC_PATHS: Array<{ path: string; preset: EdgeCachePreset; note?: string }> = [
  { path: "/blog", preset: "public-page", note: "블로그 목록" },
  { path: "/case-stories", preset: "public-page", note: "AI 사례 스토리 목록" },
  { path: "/services/immigration", preset: "public-page", note: "서비스 상세" },
  { path: "/services/appeal", preset: "public-page", note: "서비스 상세" },
  { path: "/services/contract", preset: "public-page", note: "서비스 상세" },
  { path: "/services/license", preset: "public-page", note: "서비스 상세" },
  { path: "/services/corporate", preset: "public-page", note: "서비스 상세" },
  { path: "/api/public/features", preset: "api-short", note: "공개 기능 플래그" },
];

export async function revalidateAll(): Promise<{ count: number }> {
  let count = 0;
  for (const p of CACHEABLE_PUBLIC_PATHS) {
    try {
      revalidatePath(p.path);
      count += 1;
      await logRevalidation({ path: p.path, reason: "전체 재검증", at: new Date().toISOString() });
    } catch (err) {
      logger.warn("[edge-cache] 재검증 실패", { path: p.path, err });
    }
  }
  return { count };
}
