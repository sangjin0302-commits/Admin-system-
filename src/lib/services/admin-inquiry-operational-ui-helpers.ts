import type { InquiryDashboardSummaryProps } from "@/components/admin/inquiry-dashboard-summary";
import {
  buildInquiryPresetHref,
  buildQueueDescription,
  getInquiryActionScore,
  isWithinDays,
  type InquiryViewMode
} from "@/lib/services/admin-inquiry-list-helpers";
import type { InquiryFlowAlertCounts } from "@/lib/services/admin-inquiry-operational-counts-helpers";
import { isChecklistLowReadiness } from "@/lib/services/inquiry-checklist-metrics";
import type { InquiryChecklistProgress } from "@/lib/services/inquiry-checklist-state";
import type {
  InquiryFlowAlert,
  InquiryImmediateExecutionItem,
  InquiryListItemBase,
  InquiryPrioritizedItem,
  InquiryQueueGroup,
  InquiryQuickActionLink
} from "@/lib/services/admin-inquiry-page-types";
import { formatDateTime } from "@/lib/utils";

export function buildInquiryActionItems<T extends InquiryListItemBase>(
  activeInquiries: T[],
  checklistProgressById: Map<string, InquiryChecklistProgress>
): InquiryDashboardSummaryProps["actionItems"] {
  return activeInquiries
    .filter((item) => {
      const checklistProgress = checklistProgressById.get(item.id);
      return (
        item.urgencyLevel === "CRITICAL" ||
        isWithinDays(item.dueDate, 3) ||
        isWithinDays(item.nextContactAt, 3) ||
        item.responsePending ||
        ["QUOTE_DRAFTED", "QUOTE_PENDING", "CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status) ||
        !item.hasPreparedDocuments ||
        isChecklistLowReadiness(checklistProgress)
      );
    })
    .slice(0, 6)
    .map((item) => {
      const checklistProgress = checklistProgressById.get(item.id);
      return {
        id: item.id,
        title: item.title,
        href: `/admin/inquiries/${item.id}`,
        tone:
          item.urgencyLevel === "CRITICAL"
            ? "urgent"
            : isWithinDays(item.dueDate, 3)
              ? "deadline"
              : ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
                ? "quote"
                : !item.hasPreparedDocuments
                  ? "docs"
                  : "consult",
        description:
          item.urgencyLevel === "CRITICAL"
            ? "긴급 또는 당일 일정이 있어 최우선 확인이 필요합니다."
            : isChecklistLowReadiness(checklistProgress)
              ? `체크리스트 준비도가 ${checklistProgress?.percent ?? 0}%로 낮아 보완이 필요합니다.`
              : isWithinDays(item.dueDate, 3)
                ? "3일 이내 마감 일정이 있어 우선 조치가 필요합니다."
                : item.responsePending
                  ? "고객 응답 대기 상태입니다. 다음 연락 일정을 확인해 주세요."
                  : isWithinDays(item.nextContactAt, 3)
                    ? "다음 연락 예정일이 가까워 후속 안내가 필요합니다."
                    : ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
                      ? "견적 작성 또는 발송 후속 조치가 필요한 상태입니다."
                      : !item.hasPreparedDocuments
                        ? "기본 자료 보유 여부가 확인되지 않았습니다. 자료 요청을 진행해 주세요."
                        : "상담 연결 또는 후속 응답이 필요한 상태입니다."
      };
    });
}

export function buildInquiryQueueGroups(
  prioritizedInquiries: InquiryPrioritizedItem[],
  checklistProgressById: Map<string, InquiryChecklistProgress>
): InquiryQueueGroup[] {
  return [
    {
      key: "urgent",
      title: "긴급 확인",
      hint: "긴급 등급 또는 당일 일정 사건",
      tone: "urgent" as const,
      items: prioritizedInquiries
        .filter((item) => item.urgencyLevel === "CRITICAL" || isWithinDays(item.dueDate, 1))
        .slice(0, 3)
    },
    {
      key: "docs",
      title: "자료 보완",
      hint: "자료 미확보 또는 준비도 낮은 사건",
      tone: "docs" as const,
      items: prioritizedInquiries
        .filter((item) => {
          const checklistProgress = checklistProgressById.get(item.id);
          return (
            (!item.hasPreparedDocuments && item.status !== "WON" && item.status !== "CLOSED") ||
            isChecklistLowReadiness(checklistProgress)
          );
        })
        .slice(0, 3)
    },
    {
      key: "consult",
      title: "상담 연결",
      hint: "상담 진행 또는 대기 사건",
      tone: "consult" as const,
      items: prioritizedInquiries
        .filter((item) => ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "PRE_DIAGNOSED"].includes(item.status))
        .slice(0, 3)
    },
    {
      key: "quote",
      title: "견적 후속",
      hint: "견적 작성 또는 발송 단계 사건",
      tone: "quote" as const,
      items: prioritizedInquiries
        .filter((item) => ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status))
        .slice(0, 3)
    }
  ].map((group) => ({
    ...group,
    count: group.items.length,
    items: group.items.map((item) => ({
      id: item.id,
      title: item.title,
      href: `/admin/inquiries/${item.id}`,
      description: buildQueueDescription(item)
    }))
  }));
}

export function buildInquiryFlowAlerts(
  counts: InquiryFlowAlertCounts,
  viewMode: InquiryViewMode
): InquiryFlowAlert[] {
  const flowAlerts: InquiryFlowAlert[] = [
    {
      key: "overdue",
      title: "기한 초과",
      count: counts.overdueDueCount,
      description: "마감 기한이 지난 사건입니다. 우선순위 재조정이 필요합니다.",
      tone: "danger" as const,
      href: buildInquiryPresetHref(viewMode, { retained: "active", sort: "urgency" })
    },
    {
      key: "quote-docs",
      title: "견적 단계 자료 부족",
      count: counts.quoteMissingDocsCount,
      description: "견적 단계에서 기본 자료 확인이 필요한 사건입니다.",
      tone: "warning" as const,
      href: buildInquiryPresetHref(viewMode, {
        retained: "active",
        sort: "latest",
        statusGroup: "QUOTE"
      })
    },
    {
      key: "review-stale",
      title: "장기 검토",
      count: counts.staleReviewCount,
      description: "72시간 이상 정체된 검토 또는 보류 사건입니다.",
      tone: "warning" as const,
      href: buildInquiryPresetHref(viewMode, {
        retained: "active",
        sort: "latest",
        statusGroup: "REVIEW"
      })
    },
    {
      key: "consult-pending",
      title: "상담 응답 대기",
      count: counts.consultationPendingCount,
      description: "상담 흐름에서 고객 응답 대기 상태인 사건입니다.",
      tone: "info" as const,
      href: buildInquiryPresetHref(viewMode, {
        retained: "active",
        sort: "latest",
        statusGroup: "CONSULTATION"
      })
    }
  ].filter((item) => item.count > 0);

  if (flowAlerts.length === 0) {
    flowAlerts.push({
      key: "stable",
      title: "운영 안정",
      count: 0,
      description: "현재 확인된 주요 경고 신호가 없습니다.",
      tone: "neutral" as const
    });
  }

  return flowAlerts;
}

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

export function buildImmediateExecutionItems(
  prioritizedInquiries: InquiryPrioritizedItem[]
): InquiryImmediateExecutionItem[] {
  return prioritizedInquiries.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.title,
    href: `/admin/inquiries/${item.id}`,
    score: getInquiryActionScore(item),
    statusLabel: buildQueueDescription(item),
    meta: `${item.contactName} / ${formatDateTime(item.updatedAt)}`,
    readiness:
      item.checklistTotalCount > 0
        ? `${item.checklistProgressPercent}% (남음 ${item.checklistPendingCount}건)`
        : "체크리스트 준비 중"
  }));
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
