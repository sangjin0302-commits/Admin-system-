/**
 * 기능 플래그 (Feature Flags) — 사이트 관리자가 관리자 패널에서 기능을 켜고 끕니다.
 *
 * 저장: SiteSetting key = "feature.flags", value = JSON.stringify({ [featureKey]: boolean })
 * 캐시: 30초 인메모리 (편집 시 무효화)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SITE_SETTING_KEY = "feature.flags";
const CACHE_MS = 30_000;

export type FeatureCategory = "marketing" | "operations" | "ux";

export type FeatureDefinition = {
  key: string;
  label: string;
  category: FeatureCategory;
  default: boolean;
  description?: string;
  public?: boolean; // 공개 API로 노출 가능 여부
};

export const FEATURE_REGISTRY: readonly FeatureDefinition[] = [
  { key: "newsletter", label: "뉴스레터", category: "marketing", default: true, description: "이메일 뉴스레터 발송 및 구독" },
  { key: "booking", label: "온라인 예약", category: "marketing", default: true, description: "온라인 상담 예약 기능" },
  { key: "case_stories", label: "AI 사례 스토리", category: "marketing", default: true, description: "AI 자동 생성 사례 스토리" },
  { key: "landing_builder", label: "랜딩 페이지 빌더", category: "marketing", default: true, description: "관리자용 랜딩 페이지 편집" },
  { key: "naver_reviews", label: "네이버 리뷰 벨트", category: "marketing", default: true, description: "네이버 리뷰 노출 벨트" },
  { key: "trust_belt", label: "신뢰 뱃지 벨트", category: "marketing", default: true, description: "신뢰 뱃지 노출" },
  { key: "utm_dashboard", label: "UTM 대시보드", category: "marketing", default: true, description: "UTM 유입 분석 대시보드" },
  { key: "brand_intro", label: "브랜드 인트로 모션", category: "marketing", default: false, description: "홈 브랜드 인트로 애니메이션", public: true },
  { key: "ai_chatbot", label: "AI 챗봇", category: "marketing", default: true, description: "공개 페이지 AI 챗봇", public: true },
  { key: "workflow_engine", label: "워크플로 자동화", category: "operations", default: true, description: "자동화 워크플로 엔진" },
  { key: "ai_drafting", label: "AI 서면 초안", category: "operations", default: true, description: "AI 자동 초안 생성" },
  { key: "voice_memo", label: "음성 메모", category: "operations", default: true, description: "음성 메모 및 STT" },
  { key: "calendar_sync", label: "캘린더 동기", category: "operations", default: true, description: "Google 캘린더 양방향 동기" },
  { key: "finance_report", label: "재무 리포트", category: "operations", default: true, description: "재무 리포트 자동 생성" },
  { key: "bottom_sheet_consult", label: "모바일 바텀시트 상담", category: "ux", default: true, description: "모바일 하단 바텀시트 상담", public: true },
  { key: "sticky_cta", label: "Sticky CTA", category: "ux", default: true, description: "고정 CTA 버튼", public: true },
  { key: "portal_realtime", label: "포털 실시간 알림", category: "ux", default: true, description: "고객 포털 실시간 알림 (SSE)" },
  { key: "review_automation", label: "후기 요청 자동화", category: "marketing", default: true, description: "종결 사건 후기 요청 자동 발송" },
  { key: "priority_scoring", label: "AI 우선순위 스코어", category: "operations", default: true, description: "AI가 문의 우선순위 자동 점수화" },
  { key: "pr_syndication", label: "PR 다채널 배포", category: "marketing", default: false, description: "블로그 발행 시 채널별 문안(네이버·페이스북·링크드인·텔레그램) 자동 생성" },
] as const;

const PUBLIC_KEYS = new Set(FEATURE_REGISTRY.filter((f) => f.public).map((f) => f.key));
const REGISTRY_MAP = new Map<string, FeatureDefinition>(FEATURE_REGISTRY.map((f) => [f.key, f]));

let _cache: { at: number; data: Record<string, boolean> } | null = null;

export function invalidateFeatureFlagsCache() {
  _cache = null;
}

function defaultsMap(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const f of FEATURE_REGISTRY) map[f.key] = f.default;
  return map;
}

async function readRawFlags(): Promise<Record<string, boolean>> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
    if (!row?.value) return {};
    const parsed = JSON.parse(row.value);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch (err) {
    logger.warn("[feature-flags] 저장된 플래그를 읽지 못했습니다", err);
    return {};
  }
}

/** 전체 플래그 조회 (DB + 레지스트리 기본값 병합, 30초 캐시). */
export async function getAllFlags(): Promise<Record<string, boolean>> {
  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.data;
  const stored = await readRawFlags();
  const merged = { ...defaultsMap(), ...stored };
  _cache = { at: Date.now(), data: merged };
  return merged;
}

/** 단일 플래그 조회. */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const all = await getAllFlags();
  if (key in all) return all[key];
  return REGISTRY_MAP.get(key)?.default ?? false;
}

/** 플래그 저장 (upsert). */
export async function setFeatureEnabled(key: string, enabled: boolean): Promise<void> {
  if (!REGISTRY_MAP.has(key)) {
    throw new Error(`알 수 없는 기능 키: ${key}`);
  }
  const stored = await readRawFlags();
  stored[key] = enabled;
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value: JSON.stringify(stored) },
    update: { value: JSON.stringify(stored) },
  });
  invalidateFeatureFlagsCache();
}

/** 레지스트리 노출 (관리자 UI 그루핑용). */
export function getFeatureRegistry(): readonly FeatureDefinition[] {
  return FEATURE_REGISTRY;
}

/** 공개 API 노출용 — 화이트리스트된 플래그만 반환. */
export async function getPublicFlags(): Promise<Record<string, boolean>> {
  const all = await getAllFlags();
  const out: Record<string, boolean> = {};
  for (const k of PUBLIC_KEYS) {
    out[k] = all[k];
  }
  return out;
}

export function isPublicFeatureKey(key: string): boolean {
  return PUBLIC_KEYS.has(key);
}
