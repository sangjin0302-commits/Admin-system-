/**
 * 사이트 콘텐츠 조회/저장 서비스.
 *
 * - SiteSetting 테이블을 저장소로 사용 (기존 site-settings.ts와 별개 키 네임스페이스).
 * - 30초 인메모리 배치 캐시로 다발 조회 시 DB 왕복 최소화.
 * - Feature flag `site_content_editor`가 꺼져 있으면 항상 default 반환.
 */

import { prisma } from "@/lib/prisma/client";
import {
  CONTENT_KEYS,
  getContentDefault,
  isValidContentKey
} from "@/lib/services/site-content-keys";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

const CACHE_MS = 30_000;

type Cache = { at: number; data: Record<string, string> };
let _cache: Cache | null = null;

export function invalidateSiteContentCache() {
  _cache = null;
}

async function loadAll(): Promise<Record<string, string>> {
  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.data;
  const keys = CONTENT_KEYS.map((c) => c.key);
  const map: Record<string, string> = {};
  for (const c of CONTENT_KEYS) map[c.key] = c.default;
  try {
    const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
    for (const row of rows) {
      if (row.value !== null && row.value !== undefined && row.value !== "") {
        map[row.key] = row.value;
      }
    }
  } catch (err) {
    logger.warn("[site-content] load failed", err);
  }
  _cache = { at: Date.now(), data: map };
  return map;
}

/** 단일 콘텐츠 조회. flag off이거나 미저장이면 default. */
export async function getContent(key: string): Promise<string> {
  if (!isValidContentKey(key)) return "";
  const enabled = await isFeatureEnabled("site_content_editor").catch(() => true);
  if (!enabled) return getContentDefault(key);
  const all = await loadAll();
  return all[key] ?? getContentDefault(key);
}

/** 여러 콘텐츠 일괄 조회 — 단일 DB 호출. */
export async function getContentBatch(keys: string[]): Promise<Record<string, string>> {
  const enabled = await isFeatureEnabled("site_content_editor").catch(() => true);
  const out: Record<string, string> = {};
  if (!enabled) {
    for (const k of keys) out[k] = getContentDefault(k);
    return out;
  }
  const all = await loadAll();
  for (const k of keys) out[k] = all[k] ?? getContentDefault(k);
  return out;
}

/** 전체 콘텐츠 조회 (관리자 UI용). */
export async function getAllContent(): Promise<Record<string, string>> {
  const all = await loadAll();
  return { ...all };
}

/** 저장 (upsert). */
export async function setContent(key: string, value: string, updatedBy?: string): Promise<void> {
  if (!isValidContentKey(key)) {
    throw new Error(`알 수 없는 콘텐츠 키: ${key}`);
  }
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, updatedBy: updatedBy ?? null },
    update: { value, updatedBy: updatedBy ?? null }
  });
  invalidateSiteContentCache();
}
