import {
  buildInquiryPresetHref,
  type InquiryViewMode
} from "@/lib/services/admin-inquiry-list-helpers";
import type { InquiryQuickActionLink } from "@/lib/services/admin-inquiry-page-types";

export function buildInquiryFocusSummary(input: {
  todayActionCount: number;
  docsPendingCount: number;
  quotePendingCount: number;
  checklistCoverageCount: number;
  checklistAvgPercent: number;
  activeStatusGroupLabel: string | null;
}) {
  return [
    input.todayActionCount > 0 ? `오늘 우선 확인 ${input.todayActionCount}건` : "오늘 긴급 건이 없습니다",
    input.docsPendingCount > 0 ? `자료 확인 필요 ${input.docsPendingCount}건` : "자료 확인 대기 건이 없습니다",
    input.quotePendingCount > 0 ? `견적 후속 ${input.quotePendingCount}건` : "견적 후속 건이 없습니다",
    input.checklistCoverageCount > 0
      ? `체크리스트 평균 준비도 ${input.checklistAvgPercent}%`
      : "체크리스트 데이터 수집 중",
    input.activeStatusGroupLabel ? `${input.activeStatusGroupLabel} 그룹 필터 적용 중` : null
  ].filter((item): item is string => Boolean(item));
}

export function buildInquiryQuickActionLinks(input: {
  viewMode: InquiryViewMode;
  todayActionCount: number;
  docsPendingCount: number;
  consultationNeededCount: number;
  responsePendingCount: number;
  checklistLowReadinessCount: number;
}): InquiryQuickActionLink[] {
  return [
    {
      id: "urgent",
      label: "긴급 사건 보기",
      href: buildInquiryPresetHref(input.viewMode, { retained: "active", sort: "urgency" }),
      count: input.todayActionCount,
      description: "긴급 등급 또는 임박 일정 사건을 먼저 확인합니다."
    },
    {
      id: "docs",
      label: "자료 부족 보기",
      href: buildInquiryPresetHref(input.viewMode, {
        retained: "active",
        sort: "latest",
        statusGroup: "QUOTE"
      }),
      count: input.docsPendingCount,
      description: "견적 단계에서 자료 보완이 필요한 사건을 모아 봅니다."
    },
    {
      id: "consult",
      label: "상담 대기 보기",
      href: buildInquiryPresetHref(input.viewMode, {
        retained: "active",
        sort: "latest",
        statusGroup: "CONSULTATION"
      }),
      count: input.consultationNeededCount,
      description: "상담 연결 또는 대기 사건을 확인합니다."
    },
    {
      id: "response",
      label: "응답 대기 보기",
      href: buildInquiryPresetHref(input.viewMode, { retained: "active", sort: "latest" }),
      count: input.responsePendingCount,
      description: "고객 응답을 기다리는 사건을 빠르게 확인합니다."
    },
    {
      id: "readiness",
      label: "준비도 낮음 보기",
      href: buildInquiryPresetHref(input.viewMode, { retained: "active", sort: "urgency" }),
      count: input.checklistLowReadinessCount,
      description: "체크리스트 준비도가 낮은 사건을 우선 관리합니다."
    }
  ];
}
