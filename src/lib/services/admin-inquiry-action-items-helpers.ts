import type { InquiryDashboardSummaryProps } from "@/components/admin/inquiry-dashboard-summary";
import {
  buildQueueDescription,
  getInquiryActionScore,
  isWithinDays
} from "@/lib/services/admin-inquiry-list-helpers";
import { isChecklistLowReadiness } from "@/lib/services/inquiry-checklist-metrics";
import type { InquiryChecklistProgress } from "@/lib/services/inquiry-checklist-state";
import type {
  InquiryImmediateExecutionItem,
  InquiryListItemBase,
  InquiryPrioritizedItem
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
