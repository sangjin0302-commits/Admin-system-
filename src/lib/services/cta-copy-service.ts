/**
 * CTA 카피 소재별 매핑 서비스 (v6.4 §10-2)
 *
 * 카테고리별 CTA 헤드라인·버튼 문구를 반환한다.
 * SiteSetting key `cta_copy_overrides` 로 개별 카테고리 오버라이드 저장 가능.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type CtaCopy = {
  headline: string;
  button: string;
};

export type CtaCategory = "visa" | "contract" | "business" | "appeal" | "default";

export const CTA_COPY_MAP: Record<CtaCategory, CtaCopy> = {
  visa: {
    headline: "비자 문제, 한 번에 정리하고 싶다면?",
    button: "무료로 가능 여부 확인하기",
  },
  contract: {
    headline: "서류 하나로 분쟁을 막을 수 있습니다",
    button: "무료로 서류 점검받기",
  },
  business: {
    headline: "인허가 절차, 한 번에 끝내고 싶다면",
    button: "무료로 창업 요건 확인하기",
  },
  appeal: {
    headline: "90일, 넘기면 다시 못 돌립니다",
    button: "무료로 대응 가능성 확인하기",
  },
  default: {
    headline: "복잡한 행정, 어디서부터 해야 할지 모를 때",
    button: "무료로 가능 여부 확인하기",
  },
};

const OVERRIDE_KEY = "cta_copy_overrides";

function normalizeCategory(category: string | null | undefined): CtaCategory {
  if (!category) return "default";
  const c = category.toLowerCase();
  if (c === "visa" || c === "contract" || c === "business" || c === "appeal") return c;
  return "default";
}

async function readOverrides(): Promise<Partial<Record<CtaCategory, Partial<CtaCopy>>>> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: OVERRIDE_KEY } });
    if (!row?.value) return {};
    const parsed = JSON.parse(row.value);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Partial<Record<CtaCategory, Partial<CtaCopy>>>;
  } catch (err) {
    logger.warn("[cta-copy] 오버라이드 로딩 실패", err);
    return {};
  }
}

/** 카테고리별 CTA 카피 조회 (오버라이드 병합). */
export async function getCtaCopy(category: string | null | undefined): Promise<CtaCopy> {
  const cat = normalizeCategory(category);
  const base = CTA_COPY_MAP[cat] ?? CTA_COPY_MAP.default;
  const overrides = await readOverrides();
  const override = overrides[cat];
  if (!override) return base;
  return {
    headline: typeof override.headline === "string" && override.headline.trim() ? override.headline : base.headline,
    button: typeof override.button === "string" && override.button.trim() ? override.button : base.button,
  };
}

/** 오버라이드 저장. */
export async function setCtaCopyOverride(category: CtaCategory, copy: Partial<CtaCopy>): Promise<void> {
  const overrides = await readOverrides();
  overrides[category] = { ...(overrides[category] ?? {}), ...copy };
  await prisma.siteSetting.upsert({
    where: { key: OVERRIDE_KEY },
    create: { key: OVERRIDE_KEY, value: JSON.stringify(overrides) },
    update: { value: JSON.stringify(overrides) },
  });
}

/** 전체 오버라이드 조회 (관리자 UI). */
export async function getCtaCopyOverrides(): Promise<Partial<Record<CtaCategory, Partial<CtaCopy>>>> {
  return readOverrides();
}
