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

/** 단일 콘텐츠 조회. flag off이거나 미저장이면 default. overrides map 우선. */
export async function getContent(
  key: string,
  overrides?: Record<string, string>
): Promise<string> {
  if (!isValidContentKey(key)) return "";
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key];
  }
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

/** 저장 (upsert). cms_history flag가 켜져 있으면 최근 10건 히스토리도 로깅. */
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

  // Best-effort history log
  try {
    const historyEnabled = await isFeatureEnabled("cms_history").catch(() => true);
    if (historyEnabled) {
      const historyKey = `content_history_${key}`;
      const existing = await prisma.siteSetting.findUnique({ where: { key: historyKey } });
      let arr: Array<{ value: string; at: string; editor: string | null }> = [];
      if (existing?.value) {
        try {
          const parsed = JSON.parse(existing.value);
          if (Array.isArray(parsed)) arr = parsed;
        } catch { /* ignore */ }
      }
      arr.unshift({ value, at: new Date().toISOString(), editor: updatedBy ?? null });
      if (arr.length > 10) arr = arr.slice(0, 10);
      await prisma.siteSetting.upsert({
        where: { key: historyKey },
        create: { key: historyKey, value: JSON.stringify(arr), updatedBy: updatedBy ?? null },
        update: { value: JSON.stringify(arr), updatedBy: updatedBy ?? null }
      });
    }
  } catch (err) {
    logger.warn("[site-content] history log failed", err);
  }
}

/** 히스토리 조회 — 최신순 최대 10건. */
export async function getContentHistory(
  key: string
): Promise<Array<{ value: string; at: string; editor: string | null }>> {
  if (!isValidContentKey(key)) return [];
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: `content_history_${key}` }
    });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is { value: string; at: string; editor: string | null } =>
        e && typeof e === "object" && typeof e.value === "string" && typeof e.at === "string"
    );
  } catch (err) {
    logger.warn("[site-content] history read failed", err);
    return [];
  }
}

/** cms_editor_emails 조회 — cms_editor_role flag가 켜져 있어야 유효. */
export async function getEditorEmails(): Promise<string[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "cms_editor_emails" } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is string => typeof e === "string" && e.trim().length > 0);
  } catch {
    return [];
  }
}

export async function setEditorEmails(emails: string[], updatedBy?: string): Promise<void> {
  const clean = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)));
  await prisma.siteSetting.upsert({
    where: { key: "cms_editor_emails" },
    create: { key: "cms_editor_emails", value: JSON.stringify(clean), updatedBy: updatedBy ?? null },
    update: { value: JSON.stringify(clean), updatedBy: updatedBy ?? null }
  });
}

/** 편집 권한 확인 — SUPER/MANAGER 이거나 cms_editor_role 켜진 상태에서 editor emails에 포함. */
export async function isContentEditor(
  email: string | null | undefined,
  role: string | null | undefined
): Promise<boolean> {
  if (role === "SUPER" || role === "MANAGER") return true;
  if (!email) return false;
  const editorFlag = await isFeatureEnabled("cms_editor_role").catch(() => false);
  if (!editorFlag) return false;
  const list = await getEditorEmails();
  return list.includes(email.trim().toLowerCase());
}
