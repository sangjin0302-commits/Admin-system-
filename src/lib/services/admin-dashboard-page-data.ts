import {
  getHealthTone,
  getLawbotStatus,
  getPriorityScore,
  getPublicIntakeStatus,
  isWithinDays
} from "@/lib/services/admin-dashboard-helpers";
import {
  buildInquiryChecklistProgressMap,
  summarizeInquiryChecklistProgress,
  withInquiryChecklistProgress
} from "@/lib/services/inquiry-checklist-metrics";
import type { MarketingSnapshot } from "@/lib/services/marketing-sync-service";
import type { PublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import type { SystemHealthSnapshot } from "@/lib/services/system-health-service-safe-v3";
import { formatDateTime } from "@/lib/utils";

type DashboardInquiryBase = {
  id: string;
  title: string;
  status: string;
  urgencyLevel: string;
  dueDate: Date | null;
  nextContactAt: Date | null;
  responsePending: boolean;
  hasPreparedDocuments: boolean;
  updatedAt: Date;
  createdAt: Date;
  contactName: string;
  organizationName: string | null;
  inquiryType: string;
  preferredLanguage: string;
  internalMemo: string | null;
  lawbotSnapshotPayload: string | null;
};

function getOperationalHealthDescription(score: number) {
  if (score >= 80) return "운영 흐름이 안정적입니다.";
  if (score >= 60) return "주요 항목 점검이 필요합니다.";
  return "긴급 순서 재정렬과 후속 조치가 필요합니다.";
}

export function buildAdminDashboardPageData<T extends DashboardInquiryBase>(input: {
  inquiries: T[];
  marketingSnapshot: MarketingSnapshot | null;
  systemHealthSnapshot: SystemHealthSnapshot | null;
  publicIntakeControl: PublicIntakeControlSnapshot;
}) {
  const { inquiries, marketingSnapshot, systemHealthSnapshot, publicIntakeControl } = input;
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

  const dueSoonItems = activeInquiries
    .filter((item) => isWithinDays(item.dueDate, 3))
    .sort((left, right) => (left.dueDate?.getTime() ?? Infinity) - (right.dueDate?.getTime() ?? Infinity))
    .slice(0, 5);
  const nextContactItems = activeInquiries
    .filter((item) => isWithinDays(item.nextContactAt, 3) || item.responsePending)
    .sort((left, right) => (left.nextContactAt?.getTime() ?? Infinity) - (right.nextContactAt?.getTime() ?? Infinity))
    .slice(0, 5);
  const recentIntakes = inquiries.slice(0, 5);
  const immediateActionItems = [...activeInquiries]
    .sort((left, right) => {
      const scoreDiff = getPriorityScore(right) - getPriorityScore(left);
      if (scoreDiff !== 0) return scoreDiff;
      return right.updatedAt.getTime() - left.updatedAt.getTime();
    })
    .slice(0, 6);
  const immediateActionItemsWithProgress = withInquiryChecklistProgress(
    immediateActionItems,
    checklistProgressById
  );

  const pipeline = [
    {
      key: "NEW",
      label: "신규",
      count: activeInquiries.filter((item) => item.status === "NEW").length,
      description: "가장 먼저 확인하는 접수 구간"
    },
    {
      key: "PRE_DIAGNOSED",
      label: "사전진단",
      count: activeInquiries.filter((item) => item.status === "PRE_DIAGNOSED").length,
      description: "초기 분류와 검토 방향을 정리한 구간"
    },
    {
      key: "CONSULTATION_REQUIRED",
      label: "상담",
      count: activeInquiries.filter((item) =>
        ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)
      ).length,
      description: "상담 연결 또는 상담 대기 흐름"
    },
    {
      key: "QUOTE_PENDING",
      label: "견적",
      count: activeInquiries.filter((item) =>
        ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
      ).length,
      description: "견적 작성·검토·발송 구간"
    },
    {
      key: "WON",
      label: "수임",
      count: activeInquiries.filter((item) => item.status === "WON").length,
      description: "계약 또는 사건 진행으로 넘어간 건"
    },
    {
      key: "ON_HOLD",
      label: "보류",
      count: activeInquiries.filter((item) => item.status === "ON_HOLD").length,
      description: "사유 확인과 재정리가 필요한 건"
    }
  ];

  const lawbotStatus = getLawbotStatus();
  const publicIntakeStatus = getPublicIntakeStatus(publicIntakeControl);
  const marketingStatus = marketingSnapshot
    ? {
        label: "스냅샷 수신 중",
        toneClassName: "bg-success/10 text-success",
        description: `최근 마케팅 데이터가 ${formatDateTime(
          marketingSnapshot.received_at ?? marketingSnapshot.generated_at ?? null
        )} 기준으로 저장돼 있습니다.`
      }
    : {
        label: "스냅샷 없음",
        toneClassName: "bg-warning/10 text-warning",
        description: "현재는 mock/기본 신호 중심이며, 실시간 market engine 연동은 아직 아닙니다."
      };

  const healthTone = getHealthTone(systemHealthSnapshot?.overallLevel ?? null);
  const healthDescription = systemHealthSnapshot
    ? systemHealthSnapshot.overallLevel === "ok"
      ? "핵심 운영 지표가 정상 범위입니다."
      : systemHealthSnapshot.recommendedActions[0] ?? "운영 점검이 필요합니다."
    : "헬스 스냅샷을 불러오지 못해 모니터링 화면에서 확인이 필요합니다.";
  const healthScore = systemHealthSnapshot?.score ?? 0;
  const healthAlertCount = systemHealthSnapshot
    ? systemHealthSnapshot.items.filter((item) => item.level !== "ok").length
    : 0;
  const healthCriticalCount = systemHealthSnapshot
    ? systemHealthSnapshot.items.filter((item) => item.level === "critical").length
    : 0;

  return {
    activeInquiries,
    checklistCoverageCount,
    checklistAvgPercent,
    checklistLowReadinessCount,
    urgentCount,
    docsPendingCount,
    responsePendingCount,
    quotePendingCount,
    consultationCount,
    operationalHealthScore,
    operationalHealthDescription,
    dueSoonItems,
    nextContactItems,
    recentIntakes,
    immediateActionItemsWithProgress,
    pipeline,
    lawbotStatus,
    publicIntakeStatus,
    marketingStatus,
    healthTone,
    healthDescription,
    healthScore,
    healthAlertCount,
    healthCriticalCount
  };
}
