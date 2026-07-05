/**
 * 홈페이지 맞춤화 서비스.
 *
 * 방문자 컨텍스트(지역·UTM·리퍼러·디바이스)를 감지하여 히어로 카피 변형을 선택합니다.
 *
 * 저장: SiteSetting key = "home.personalization.variants"
 *   value = JSON.stringify(PersonalizationVariant[])
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SITE_SETTING_KEY = "home.personalization.variants";

export type VisitorContext = {
  acceptLanguage: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  device: "mobile" | "tablet" | "desktop";
  region: string; // ISO country code hint (best-effort)
};

export type PersonalizationTrigger = {
  /** 리퍼러/UTM에서 이 키워드 중 하나가 매칭되면 (case-insensitive) */
  keywords?: string[];
  /** 리퍼러 도메인 매칭 (linkedin.com, facebook.com …) */
  referrerDomains?: string[];
  /** UTM source 정확 매칭 */
  utmSources?: string[];
  /** 지역 코드 (KR, US …) */
  regions?: string[];
  /** 디바이스 */
  devices?: Array<"mobile" | "tablet" | "desktop">;
};

export type PersonalizationVariant = {
  id: string;
  name: string;
  trigger: PersonalizationTrigger;
  heroBadge?: string;
  heroTitle?: string;
  heroDescription?: string;
};

export const DEFAULT_VARIANTS: PersonalizationVariant[] = [
  {
    id: "visa_focus",
    name: "비자 집중",
    trigger: { keywords: ["visa", "비자", "체류", "immigration"] },
    heroBadge: "비자 · 체류 · 외국인 등록",
    heroTitle: "비자 거절, 체류 자격 —\n2주 안에 해결 방향을 드립니다",
    heroDescription: "주한 대사관 실무 경력의 행정사가 비자 · 체류 · 국적 문제를 함께 정리합니다.",
  },
  {
    id: "corporate_linkedin",
    name: "법인/기업 (LinkedIn)",
    trigger: { referrerDomains: ["linkedin.com"], utmSources: ["linkedin"] },
    heroBadge: "법인 · 인허가 · 기업 자문",
    heroTitle: "인허가 · 법인설립 —\n기업 성장의 행정 리스크를 정리합니다",
    heroDescription: "스타트업부터 중견기업까지, 행정 인허가와 규제 대응을 한 창구로 관리합니다.",
  },
  {
    id: "appeal_focus",
    name: "행정심판 집중",
    trigger: { keywords: ["행정심판", "이의신청", "처분", "appeal"] },
    heroBadge: "행정심판 · 이의신청 · 처분 대응",
    heroTitle: "행정처분 · 이의신청 —\n기한 안에 정확한 대응을 드립니다",
    heroDescription: "청구기한 90일 · 이의신청 60일 — 놓치기 전에 함께 대응 전략을 세웁니다.",
  },
];

async function readVariantsRaw(): Promise<PersonalizationVariant[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is PersonalizationVariant =>
        v && typeof v === "object" && typeof v.id === "string" && typeof v.name === "string",
    );
  } catch (err) {
    logger.warn("[homepage-personalization] 저장된 variants를 읽지 못했습니다", err);
    return [];
  }
}

/** 저장된 variants 조회. 비어있으면 기본 셋 반환. */
export async function listVariants(): Promise<PersonalizationVariant[]> {
  const stored = await readVariantsRaw();
  return stored.length > 0 ? stored : DEFAULT_VARIANTS;
}

/** variants 저장. */
export async function saveVariants(variants: PersonalizationVariant[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value: JSON.stringify(variants) },
    update: { value: JSON.stringify(variants) },
  });
}

/** 헤더에서 방문자 컨텍스트 파싱. */
export function parseVisitorContext(input: {
  acceptLanguage?: string | null;
  referer?: string | null;
  userAgent?: string | null;
  url?: string | null;
}): VisitorContext {
  const acceptLanguage = (input.acceptLanguage || "").toLowerCase();
  const referrer = (input.referer || "").toLowerCase();
  const userAgent = (input.userAgent || "").toLowerCase();

  let utmSource = "";
  let utmMedium = "";
  let utmCampaign = "";
  if (input.url) {
    try {
      const u = new URL(input.url);
      utmSource = (u.searchParams.get("utm_source") || "").toLowerCase();
      utmMedium = (u.searchParams.get("utm_medium") || "").toLowerCase();
      utmCampaign = (u.searchParams.get("utm_campaign") || "").toLowerCase();
    } catch {
      // ignore
    }
  }

  let device: VisitorContext["device"] = "desktop";
  if (/ipad|tablet/.test(userAgent)) device = "tablet";
  else if (/mobile|iphone|android/.test(userAgent)) device = "mobile";

  // Best-effort region from accept-language (e.g. "ko-KR" -> "KR")
  let region = "";
  const langMatch = acceptLanguage.match(/[a-z]{2}-([a-z]{2})/i);
  if (langMatch) region = langMatch[1].toUpperCase();

  return { acceptLanguage, referrer, utmSource, utmMedium, utmCampaign, device, region };
}

function matches(variant: PersonalizationVariant, ctx: VisitorContext): boolean {
  const t = variant.trigger;
  if (t.utmSources?.length && t.utmSources.some((s) => s.toLowerCase() === ctx.utmSource)) return true;
  if (
    t.referrerDomains?.length &&
    t.referrerDomains.some((d) => ctx.referrer.includes(d.toLowerCase()))
  )
    return true;
  if (t.keywords?.length) {
    const hay = `${ctx.referrer} ${ctx.utmSource} ${ctx.utmCampaign} ${ctx.utmMedium}`;
    if (t.keywords.some((k) => hay.includes(k.toLowerCase()))) return true;
  }
  if (t.regions?.length && ctx.region && t.regions.some((r) => r.toUpperCase() === ctx.region))
    return true;
  if (t.devices?.length && t.devices.includes(ctx.device)) return true;
  return false;
}

/** 컨텍스트에 맞는 첫 매칭 variant 반환 (없으면 null). */
export async function pickVariant(ctx: VisitorContext): Promise<PersonalizationVariant | null> {
  const variants = await listVariants();
  for (const v of variants) {
    if (matches(v, ctx)) return v;
  }
  return null;
}
