import type { InquiryDashboardSummaryProps } from "@/components/admin/inquiry-dashboard-summary";
import type { InquiryViewMode } from "@/lib/services/admin-inquiry-list-helpers";
import {
  buildAdminInquiryOperationalSections,
  type InquiryListItemBase
} from "@/lib/services/admin-inquiry-page-data-helpers";
import {
  buildInquiryChecklistProgressMap,
  summarizeInquiryChecklistProgress
} from "@/lib/services/inquiry-checklist-metrics";
import { adminInquiryQuerySchema } from "@/lib/validation/admin-safe-v2";
import type { z } from "zod";

type ParsedAdminInquiryFilters = z.infer<typeof adminInquiryQuerySchema>;

export function buildAdminInquiryPageData<T extends InquiryListItemBase>(input: {
  allInquiries: T[];
  inquiries: T[];
  filters: ParsedAdminInquiryFilters;
  viewMode: InquiryViewMode;
}) {
  const { allInquiries, inquiries, filters, viewMode } = input;
  const activeInquiries = allInquiries.filter((item) => item.status !== "CLOSED");
  const checklistProgressById = buildInquiryChecklistProgressMap(allInquiries);
  const checklistSummary = summarizeInquiryChecklistProgress(activeInquiries, checklistProgressById);

  const checklistCoverageCount = checklistSummary.coverageCount;
  const checklistAvgPercent = checklistSummary.avgPercent;
  const checklistLowReadinessCount = checklistSummary.lowReadinessCount;

  const sections = buildAdminInquiryOperationalSections({
    activeInquiries,
    inquiries,
    checklistProgressById,
    viewMode,
    statusGroup: filters.statusGroup,
    checklistCoverageCount,
    checklistAvgPercent,
    checklistLowReadinessCount
  });

  return {
    activeInquiries,
    prioritizedInquiries: sections.prioritizedInquiries,
    focusSummary: sections.focusSummary,
    immediateExecutionItems: sections.immediateExecutionItems,
    quickActionLinks: sections.quickActionLinks,
    queueGroups: sections.queueGroups,
    flowAlerts: sections.flowAlerts,
    summaryProps: {
      totalCount: allInquiries.length,
      todayActionCount: sections.todayActionCount,
      nextThreeDaysCount: sections.nextThreeDaysCount,
      quotePendingCount: sections.quotePendingCount,
      docsPendingCount: sections.docsPendingCount,
      consultationNeededCount: sections.consultationNeededCount,
      responsePendingCount: sections.responsePendingCount,
      nextContactCount: sections.nextContactCount,
      checklistCoverageCount,
      checklistAvgPercent,
      checklistLowReadinessCount,
      actionItems: sections.actionItems
    } satisfies InquiryDashboardSummaryProps
  };
}
