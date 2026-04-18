import { getInquiryActionScore, isWithinDays } from "@/lib/services/admin-inquiry-list-helpers";
import { withInquiryChecklistProgress } from "@/lib/services/inquiry-checklist-metrics";
import type { InquiryChecklistProgress } from "@/lib/services/inquiry-checklist-state";
import type { InquiryListItemBase } from "@/lib/services/admin-inquiry-page-types";

export type InquiryOperationalCounts = {
  quotePendingCount: number;
  consultationNeededCount: number;
  nextThreeDaysCount: number;
  nextContactCount: number;
  responsePendingCount: number;
  docsPendingCount: number;
  todayActionCount: number;
};

export type InquiryFlowAlertCounts = {
  overdueDueCount: number;
  staleReviewCount: number;
  quoteMissingDocsCount: number;
  consultationPendingCount: number;
};

export function computeInquiryOperationalCounts<T extends InquiryListItemBase>(
  activeInquiries: T[]
): InquiryOperationalCounts {
  const quotePendingCount = activeInquiries.filter((item) =>
    ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
  ).length;
  const consultationNeededCount = activeInquiries.filter((item) =>
    ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "PRE_DIAGNOSED"].includes(item.status)
  ).length;
  const nextThreeDaysCount = activeInquiries.filter((item) => isWithinDays(item.dueDate, 3)).length;
  const nextContactCount = activeInquiries.filter((item) => isWithinDays(item.nextContactAt, 3)).length;
  const responsePendingCount = activeInquiries.filter((item) => item.responsePending).length;
  const docsPendingCount = activeInquiries.filter(
    (item) => !item.hasPreparedDocuments && item.status !== "WON"
  ).length;
  const todayActionCount = activeInquiries.filter(
    (item) =>
      item.urgencyLevel === "CRITICAL" ||
      isWithinDays(item.dueDate, 1) ||
      isWithinDays(item.nextContactAt, 1) ||
      item.responsePending ||
      ["QUOTE_DRAFTED", "QUOTE_PENDING", "CONSULTATION_REQUIRED"].includes(item.status)
  ).length;

  return {
    quotePendingCount,
    consultationNeededCount,
    nextThreeDaysCount,
    nextContactCount,
    responsePendingCount,
    docsPendingCount,
    todayActionCount
  };
}

export function buildPrioritizedInquiriesWithChecklist<T extends InquiryListItemBase>(
  inquiries: T[],
  checklistProgressById: Map<string, InquiryChecklistProgress>
) {
  const prioritizedInquiriesRaw = [...inquiries].sort((left, right) => {
    const scoreDiff = getInquiryActionScore(right) - getInquiryActionScore(left);
    if (scoreDiff !== 0) return scoreDiff;
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

  return withInquiryChecklistProgress(prioritizedInquiriesRaw, checklistProgressById);
}

export function computeInquiryFlowAlertCounts<T extends InquiryListItemBase>(
  activeInquiries: T[]
): InquiryFlowAlertCounts {
  const now = Date.now();
  const overdueDueCount = activeInquiries.filter(
    (item) => Boolean(item.dueDate) && (item.dueDate as Date).getTime() < now
  ).length;
  const staleReviewCount = activeInquiries.filter((item) => {
    const isReviewFlow = ["IN_REVIEW", "ON_HOLD"].includes(item.status);
    if (!isReviewFlow) return false;
    const ageHours = (now - item.updatedAt.getTime()) / (1000 * 60 * 60);
    return ageHours >= 72;
  }).length;
  const quoteMissingDocsCount = activeInquiries.filter(
    (item) =>
      ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status) && !item.hasPreparedDocuments
  ).length;
  const consultationPendingCount = activeInquiries.filter(
    (item) =>
      ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status) && item.responsePending
  ).length;

  return {
    overdueDueCount,
    staleReviewCount,
    quoteMissingDocsCount,
    consultationPendingCount
  };
}
