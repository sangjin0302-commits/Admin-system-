import {
  getHealthTone,
  getLawbotStatus,
  getPublicIntakeStatus
} from "@/lib/services/admin-dashboard-helpers";
import { buildDashboardOperationalMetrics } from "@/lib/services/admin-dashboard-operational-metrics-helpers";
import type { DashboardInquiryBase } from "@/lib/services/admin-dashboard-page-types";
import { buildDashboardPriorityLists } from "@/lib/services/admin-dashboard-priority-list-helpers";
import type { MarketingSnapshot } from "@/lib/services/marketing-sync-service";
import type { PublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import type { SystemHealthSnapshot } from "@/lib/services/system-health-service-safe-v3";
import { formatDateTime } from "@/lib/utils";

function buildPipeline(inquiries: DashboardInquiryBase[]) {
  const activeInquiries = inquiries.filter((item) => item.status !== "CLOSED");

  return [
    {
      key: "NEW",
      label: "New",
      count: activeInquiries.filter((item) => item.status === "NEW").length,
      description: "Newly received intake items"
    },
    {
      key: "PRE_DIAGNOSED",
      label: "Pre-diagnosis",
      count: activeInquiries.filter((item) => item.status === "PRE_DIAGNOSED").length,
      description: "Initial classification and route alignment"
    },
    {
      key: "CONSULTATION_REQUIRED",
      label: "Consultation",
      count: activeInquiries.filter((item) =>
        ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)
      ).length,
      description: "Consultation required or waiting"
    },
    {
      key: "QUOTE_PENDING",
      label: "Quote",
      count: activeInquiries.filter((item) =>
        ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
      ).length,
      description: "Quote drafting and follow-up"
    },
    {
      key: "WON",
      label: "Won",
      count: activeInquiries.filter((item) => item.status === "WON").length,
      description: "Converted to signed casework"
    },
    {
      key: "ON_HOLD",
      label: "On hold",
      count: activeInquiries.filter((item) => item.status === "ON_HOLD").length,
      description: "Temporarily paused for additional checks"
    }
  ];
}

function buildMarketingStatus(marketingSnapshot: MarketingSnapshot | null) {
  if (!marketingSnapshot) {
    return {
      label: "No feed",
      toneClassName: "bg-warning/10 text-warning",
      description: "Using fallback signals. Live market engine feed is not connected yet."
    };
  }

  return {
    label: "Feed active",
    toneClassName: "bg-success/10 text-success",
    description: `Latest market snapshot synced at ${formatDateTime(
      marketingSnapshot.received_at ?? marketingSnapshot.generated_at ?? null
    )}.`
  };
}

function buildSystemHealthSummary(systemHealthSnapshot: SystemHealthSnapshot | null) {
  const healthTone = getHealthTone(systemHealthSnapshot?.overallLevel ?? null);
  const healthDescription = systemHealthSnapshot
    ? systemHealthSnapshot.overallLevel === "ok"
      ? "System health indicators are in the normal range."
      : systemHealthSnapshot.recommendedActions[0] ?? "Operational checks are recommended."
    : "System health snapshot is unavailable. Check monitoring for details.";
  const healthScore = systemHealthSnapshot?.score ?? 0;
  const healthAlertCount = systemHealthSnapshot
    ? systemHealthSnapshot.items.filter((item) => item.level !== "ok").length
    : 0;
  const healthCriticalCount = systemHealthSnapshot
    ? systemHealthSnapshot.items.filter((item) => item.level === "critical").length
    : 0;

  return {
    healthTone,
    healthDescription,
    healthScore,
    healthAlertCount,
    healthCriticalCount
  };
}

export function buildAdminDashboardPageData<T extends DashboardInquiryBase>(input: {
  inquiries: T[];
  marketingSnapshot: MarketingSnapshot | null;
  systemHealthSnapshot: SystemHealthSnapshot | null;
  publicIntakeControl: PublicIntakeControlSnapshot;
}) {
  const operational = buildDashboardOperationalMetrics(input.inquiries);
  const priorityLists = buildDashboardPriorityLists({
    inquiries: input.inquiries,
    activeInquiries: operational.activeInquiries,
    checklistProgressById: operational.checklistProgressById
  });
  const pipeline = buildPipeline(input.inquiries);

  const lawbotStatus = getLawbotStatus();
  const publicIntakeStatus = getPublicIntakeStatus(input.publicIntakeControl);
  const marketingStatus = buildMarketingStatus(input.marketingSnapshot);
  const health = buildSystemHealthSummary(input.systemHealthSnapshot);

  return {
    activeInquiries: operational.activeInquiries,
    checklistCoverageCount: operational.checklistCoverageCount,
    checklistAvgPercent: operational.checklistAvgPercent,
    checklistLowReadinessCount: operational.checklistLowReadinessCount,
    urgentCount: operational.urgentCount,
    docsPendingCount: operational.docsPendingCount,
    responsePendingCount: operational.responsePendingCount,
    quotePendingCount: operational.quotePendingCount,
    consultationCount: operational.consultationCount,
    operationalHealthScore: operational.operationalHealthScore,
    operationalHealthDescription: operational.operationalHealthDescription,
    dueSoonItems: priorityLists.dueSoonItems,
    nextContactItems: priorityLists.nextContactItems,
    recentIntakes: priorityLists.recentIntakes,
    immediateActionItemsWithProgress: priorityLists.immediateActionItemsWithProgress,
    pipeline,
    lawbotStatus,
    publicIntakeStatus,
    marketingStatus,
    healthTone: health.healthTone,
    healthDescription: health.healthDescription,
    healthScore: health.healthScore,
    healthAlertCount: health.healthAlertCount,
    healthCriticalCount: health.healthCriticalCount
  };
}
