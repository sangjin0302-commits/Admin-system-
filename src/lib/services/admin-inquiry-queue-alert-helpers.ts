import {
  buildInquiryPresetHref,
  buildQueueDescription,
  isWithinDays,
  type InquiryViewMode
} from "@/lib/services/admin-inquiry-list-helpers";
import type { InquiryFlowAlertCounts } from "@/lib/services/admin-inquiry-operational-counts-helpers";
import { isChecklistLowReadiness } from "@/lib/services/inquiry-checklist-metrics";
import type { InquiryChecklistProgress } from "@/lib/services/inquiry-checklist-state";
import type {
  InquiryFlowAlert,
  InquiryPrioritizedItem,
  InquiryQueueGroup
} from "@/lib/services/admin-inquiry-page-types";

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
