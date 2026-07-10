/**
 * 페이지 섹션 순서 관리 — 관리자에서 홈페이지 등 주요 페이지의 섹션 순서를 재정렬.
 *
 * 저장: SiteSetting key = `section-order.<page>`, value = JSON.stringify(string[])
 * 캐시: 30초 인메모리 (편집 시 무효화)
 *
 * ⚠️ scaffolding: 실제 렌더링 순서 반영은 page.tsx가 for-loop로 섹션을 매핑할 때 활성화됩니다.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type PageId = "homepage";

export type SectionDefinition = {
  id: string;
  label: string;
  description?: string;
};

/** 홈페이지 섹션 스키마 — 기본 순서 및 라벨. */
export const HOMEPAGE_SECTIONS: readonly SectionDefinition[] = [
  { id: "hero", label: "히어로", description: "메인 히어로/타이틀" },
  { id: "deadline", label: "긴급 스트립", description: "행정심판/이의신청 기한 안내" },
  { id: "services", label: "서비스 그리드", description: "5개 전문 분야 카드" },
  { id: "trust", label: "신뢰 벨트", description: "뱃지·통계·자격" },
  { id: "testimonials", label: "고객 후기", description: "실제 의뢰인 후기" },
  { id: "cta", label: "하단 CTA", description: "무료 검토 요청" }
] as const;

export const SECTION_ORDER_SCHEMA: Record<PageId, readonly SectionDefinition[]> = {
  homepage: HOMEPAGE_SECTIONS
};

const CACHE_MS = 30_000;
type Entry = { at: number; order: string[] };
const _cache = new Map<PageId, Entry>();

export function invalidateSectionOrderCache(page?: PageId) {
  if (page) _cache.delete(page);
  else _cache.clear();
}

function settingKey(page: PageId): string {
  return `section-order.${page}`;
}

function defaultOrder(page: PageId): string[] {
  return SECTION_ORDER_SCHEMA[page].map((s) => s.id);
}

function sanitize(page: PageId, incoming: string[]): string[] {
  const valid = new Set(SECTION_ORDER_SCHEMA[page].map((s) => s.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of incoming) {
    if (typeof id !== "string") continue;
    if (!valid.has(id) || seen.has(id)) continue;
    out.push(id);
    seen.add(id);
  }
  // append any missing sections in schema default order so nothing disappears
  for (const s of SECTION_ORDER_SCHEMA[page]) {
    if (!seen.has(s.id)) out.push(s.id);
  }
  return out;
}

/** 저장된 순서 조회. 없으면 스키마 기본. */
export async function getSectionOrder(page: PageId): Promise<string[]> {
  const cached = _cache.get(page);
  if (cached && Date.now() - cached.at < CACHE_MS) return [...cached.order];

  let order = defaultOrder(page);
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: settingKey(page) } });
    if (row?.value) {
      const parsed = JSON.parse(row.value) as unknown;
      if (Array.isArray(parsed)) {
        order = sanitize(page, parsed as string[]);
      }
    }
  } catch (err) {
    logger.warn("[section-order] load failed", { page, err });
  }
  _cache.set(page, { at: Date.now(), order });
  return [...order];
}

/** 순서 저장 (유효성 및 누락 자동 보정 후 upsert). */
export async function setSectionOrder(
  page: PageId,
  order: string[],
  updatedBy?: string
): Promise<string[]> {
  const clean = sanitize(page, order);
  await prisma.siteSetting.upsert({
    where: { key: settingKey(page) },
    create: { key: settingKey(page), value: JSON.stringify(clean), updatedBy: updatedBy ?? null },
    update: { value: JSON.stringify(clean), updatedBy: updatedBy ?? null }
  });
  invalidateSectionOrderCache(page);
  return clean;
}

export function getSectionSchema(page: PageId): readonly SectionDefinition[] {
  return SECTION_ORDER_SCHEMA[page];
}
