import type { InquiryDashboardSummaryProps } from "@/components/admin/inquiry-dashboard-summary";
import type {
  InquiryListItemBase,
  InquiryStatusGroup
} from "@/lib/services/admin-inquiry-page-types";
import {
  buildPrioritizedInquiriesWithChecklist,
  computeInquiryFlowAlertCounts,
  computeInquiryOperationalCounts
} from "@/lib/services/admin-inquiry-operational-counts-helpers";
import {
  buildImmediateExecutionItems,
  buildInquiryActionItems,
  buildInquiryFlowAlerts,
  buildInquiryFocusSummary,
  buildInquiryQueueGroups,
  buildInquiryQuickActionLinks
} from "@/lib/services/admin-inquiry-operational-ui-helpers";
import type { InquiryViewMode } from "@/lib/services/admin-inquiry-list-helpers";
import type { InquiryChecklistProgress } from "@/lib/services/inquiry-checklist-state";
import { getInquiryStatusGroupLabel } from "@/types/inquiry";

export type { InquiryListItemBase };

export function buildAdminInquiryOperationalSections<T extends InquiryListItemBase>(input: {
  activeInquiries: T[];
  inquiries: T[];
  checklistProgressById: Map<string, InquiryChecklistProgress>;
  viewMode: InquiryViewMode;
  statusGroup?: InquiryStatusGroup;
  checklistCoverageCount: number;
  checklistAvgPercent: number;
  checklistLowReadinessCount: number;
}) {
  const {
    activeInquiries,
    inquiries,
    checklistProgressById,
    viewMode,
    statusGroup,
    checklistCoverageCount,
    checklistAvgPercent,
    checklistLowReadinessCount
  } = input;

  const {
    quotePendingCount,
    consultationNeededCount,
    nextThreeDaysCount,
    nextContactCount,
    responsePendingCount,
    docsPendingCount,
    todayActionCount
  } = computeInquiryOperationalCounts(activeInquiries);

  const prioritizedInquiries = buildPrioritizedInquiriesWithChecklist(inquiries, checklistProgressById);
  const flowAlertCounts = computeInquiryFlowAlertCounts(activeInquiries);
  const activeStatusGroupLabel = statusGroup ? getInquiryStatusGroupLabel(statusGroup) : null;

  const actionItems = buildInquiryActionItems(activeInquiries, checklistProgressById);
  const queueGroups = buildInquiryQueueGroups(prioritizedInquiries, checklistProgressById);
  const flowAlerts = buildInquiryFlowAlerts(flowAlertCounts, viewMode);
  const focusSummary = buildInquiryFocusSummary({
    todayActionCount,
    docsPendingCount,
    quotePendingCount,
    checklistCoverageCount,
    checklistAvgPercent,
    activeStatusGroupLabel
  });
  const immediateExecutionItems = buildImmediateExecutionItems(prioritizedInquiries);
  const quickActionLinks = buildInquiryQuickActionLinks({
    viewMode,
    todayActionCount,
    docsPendingCount,
    consultationNeededCount,
    responsePendingCount,
    checklistLowReadinessCount
  });

  return {
    quotePendingCount,
    consultationNeededCount,
    nextThreeDaysCount,
    nextContactCount,
    responsePendingCount,
    docsPendingCount,
    prioritizedInquiries,
    todayActionCount,
    actionItems: actionItems satisfies InquiryDashboardSummaryProps["actionItems"],
    queueGroups,
    flowAlerts,
    focusSummary,
    immediateExecutionItems,
    quickActionLinks
  };
}
