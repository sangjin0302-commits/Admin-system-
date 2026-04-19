import {
  getPriorityScore,
  isWithinDays
} from "@/lib/services/admin-dashboard-helpers";
import {
  buildInquiryChecklistProgressMap,
  withInquiryChecklistProgress
} from "@/lib/services/inquiry-checklist-metrics";
import type { DashboardInquiryBase } from "@/lib/services/admin-dashboard-page-types";

export function buildDashboardPriorityLists<T extends DashboardInquiryBase>(input: {
  inquiries: T[];
  activeInquiries: T[];
  checklistProgressById: ReturnType<typeof buildInquiryChecklistProgressMap>;
}) {
  const dueSoonItems = input.activeInquiries
    .filter((item) => isWithinDays(item.dueDate, 3))
    .sort((left, right) => (left.dueDate?.getTime() ?? Infinity) - (right.dueDate?.getTime() ?? Infinity))
    .slice(0, 5);

  const nextContactItems = input.activeInquiries
    .filter((item) => isWithinDays(item.nextContactAt, 3) || item.responsePending)
    .sort((left, right) => (left.nextContactAt?.getTime() ?? Infinity) - (right.nextContactAt?.getTime() ?? Infinity))
    .slice(0, 5);

  const recentIntakes = input.inquiries.slice(0, 5);

  const immediateActionItems = [...input.activeInquiries]
    .sort((left, right) => {
      const scoreDiff = getPriorityScore(right) - getPriorityScore(left);
      if (scoreDiff !== 0) return scoreDiff;
      return right.updatedAt.getTime() - left.updatedAt.getTime();
    })
    .slice(0, 6);

  const immediateActionItemsWithProgress = withInquiryChecklistProgress(
    immediateActionItems,
    input.checklistProgressById
  );

  return {
    dueSoonItems,
    nextContactItems,
    recentIntakes,
    immediateActionItemsWithProgress
  };
}
