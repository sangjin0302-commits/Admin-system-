import type { InquiryDashboardSummaryProps } from "@/components/admin/inquiry-dashboard-summary";
import { getLawbotConnectionStatus, type InquiryViewMode } from "@/lib/services/admin-inquiry-list-helpers";
import {
  buildAdminInquiryOperationalSections,
  type InquiryListItemBase
} from "@/lib/services/admin-inquiry-page-data-helpers";
import {
  buildInquiryChecklistProgressMap,
  summarizeInquiryChecklistProgress
} from "@/lib/services/inquiry-checklist-metrics";
import type { MarketingSnapshot } from "@/lib/services/marketing-sync-service";
import { formatDateTime } from "@/lib/utils";
import { adminInquiryQuerySchema } from "@/lib/validation/admin-safe-v2";
import type { z } from "zod";

type ParsedAdminInquiryFilters = z.infer<typeof adminInquiryQuerySchema>;

export function buildAdminInquiryPageData<T extends InquiryListItemBase>(input: {
  allInquiries: T[];
  inquiries: T[];
  filters: ParsedAdminInquiryFilters;
  viewMode: InquiryViewMode;
  marketingSnapshot: MarketingSnapshot | null;
}) {
  const { allInquiries, inquiries, filters, viewMode, marketingSnapshot } = input;
  const activeInquiries = allInquiries.filter((item) => item.status !== "CLOSED");
  const checklistProgressById = buildInquiryChecklistProgressMap(allInquiries);
  const checklistSummary = summarizeInquiryChecklistProgress(activeInquiries, checklistProgressById);

  const checklistCoverageCount = checklistSummary.coverageCount;
  const checklistAvgPercent = checklistSummary.avgPercent;
  const checklistLowReadinessCount = checklistSummary.lowReadinessCount;

  const lawbotStatus = getLawbotConnectionStatus();
  const marketingStatus = marketingSnapshot
    ? {
        label: "스냅샷 수신 중",
        toneClassName: "bg-success/10 text-success",
        detail: `최근 마케팅 요약을 ${formatDateTime(marketingSnapshot.received_at ?? marketingSnapshot.generated_at ?? null)} 기준으로 반영했습니다.`
      }
    : {
        label: "스냅샷 없음",
        toneClassName: "bg-warning/10 text-warning",
        detail: "마케팅 분석 스냅샷이 없어 기본 신호만 표시합니다."
      };

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
    lawbotStatus,
    marketingStatus,
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
