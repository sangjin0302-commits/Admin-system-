import { isWithinDays } from "@/lib/services/admin-dashboard-helpers";
import {
  buildInquiryChecklistProgressMap,
  summarizeInquiryChecklistProgress
} from "@/lib/services/inquiry-checklist-metrics";
import type { DashboardInquiryBase } from "@/lib/services/admin-dashboard-page-types";

function getOperationalHealthDescription(score: number) {
  if (score >= 80) return "Operations are stable.";
  if (score >= 60) return "Key action items need follow-up.";
  return "Immediate coordination and response are required.";
}

export function buildDashboardOperationalMetrics<T extends DashboardInquiryBase>(inquiries: T[]) {
  const activeInquiries = inquiries.filter((item) => item.status !== "CLOSED");

  const checklistProgressById = buildInquiryChecklistProgressMap(inquiries);
  const checklistSummary = summarizeInquiryChecklistProgress(activeInquiries, checklistProgressById);
  const checklistCoverageCount = checklistSummary.coverageCount;
  const checklistAvgPercent = checklistSummary.avgPercent;
  const checklistLowReadinessCount = checklistSummary.lowReadinessCount;

  const urgentCount = activeInquiries.filter(
    (item) => item.urgencyLevel === "CRITICAL" || isWithinDays(item.dueDate, 1)
  ).length;
  const docsPendingCount = activeInquiries.filter(
    (item) => !item.hasPreparedDocuments && item.status !== "WON"
  ).length;
  const responsePendingCount = activeInquiries.filter((item) => item.responsePending).length;
  const quotePendingCount = activeInquiries.filter((item) =>
    ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
  ).length;
  const consultationCount = activeInquiries.filter((item) =>
    ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "PRE_DIAGNOSED"].includes(item.status)
  ).length;

  const operationalRiskIndex =
    urgentCount * 8 +
    docsPendingCount * 5 +
    responsePendingCount * 4 +
    quotePendingCount * 3 +
    checklistLowReadinessCount * 3;
  const operationalHealthScore = Math.max(0, Math.min(100, 100 - operationalRiskIndex));
  const operationalHealthDescription = getOperationalHealthDescription(operationalHealthScore);

  return {
    activeInquiries,
    checklistProgressById,
    checklistCoverageCount,
    checklistAvgPercent,
    checklistLowReadinessCount,
    urgentCount,
    docsPendingCount,
    responsePendingCount,
    quotePendingCount,
    consultationCount,
    operationalHealthScore,
    operationalHealthDescription
  };
}
