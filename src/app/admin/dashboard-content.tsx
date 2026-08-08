import { type TodayItem } from "@/components/admin/dashboard-today-widget";
import { AdminDashboardV2Section } from "@/components/admin/dashboard-v2-section";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { CaseAccountingDashboardCard } from "@/components/admin/case-accounting-dashboard-card";
import { NextActionsPanel } from "@/components/admin/next-actions-panel";
import { CaseMatterActionSummaryCard } from "@/components/admin/case-matter-action-summary-card";
import { DocumentLabDashboardCard } from "@/components/admin/document-lab-dashboard-card";
import {
  getTopDocumentTemplateSourceChecklistReasons,
  buildDocumentTemplateSourceVerificationPriority,
  listDocumentTemplateInventory
} from "@/lib/document-templates";
import { prisma } from "@/lib/prisma/client";
import { buildAdminDashboardPageData } from "@/lib/services/admin-dashboard-page-data";
import {
  buildCaseAccountingSummaryViewModel,
  type CaseAccountingSummaryInputRow
} from "@/lib/services/case-accounting-summary-view-model";
import {
  buildCaseMatterActionDashboard,
  buildCaseMatterActionSummary
} from "@/lib/services/case-matter-action-view-model";
import { listCaseMatters } from "@/lib/services/case-matter-service";
import { listInquiries } from "@/lib/services/inquiry-service";
import {
  getPublicIntakeControlSnapshot,
  type PublicIntakeControlSnapshot
} from "@/lib/services/public-intake-control-service-safe-v3";
import { getSystemHealthSnapshot } from "@/lib/services/system-health-service";

import { DashboardTodayStrip } from "./_dashboard/dashboard-today-strip";
import { DashboardHero } from "./_dashboard/dashboard-hero";
import { DashboardStats } from "./_dashboard/dashboard-stats";
import { DashboardCharts } from "./_dashboard/dashboard-charts";
import { DashboardExecutionQueue } from "./_dashboard/dashboard-execution-queue";
import { DashboardPipeline } from "./_dashboard/dashboard-pipeline";
import { DashboardListCards } from "./_dashboard/dashboard-list-cards";
import { DashboardIntegrations } from "./_dashboard/dashboard-integrations";
import { DashboardPlatformKpis } from "./_dashboard/dashboard-platform-kpis";
import { DashboardRecentInquiries } from "./_dashboard/dashboard-recent-inquiries";
import { PRACTICE_AREA_LABELS } from "@/lib/practice-areas";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];
type CaseMatterListItem = Awaited<ReturnType<typeof listCaseMatters>>[number];

async function safeListInquiries() {
  try {
    return await listInquiries();
  } catch (error) {
    logger.error("Failed to load inquiries for admin dashboard", error);
    return [] as InquiryListItem[];
  }
}

async function safeListCaseMatters() {
  try {
    return await listCaseMatters();
  } catch (error) {
    logger.error("Failed to load case matters for admin dashboard", error);
    return [] as CaseMatterListItem[];
  }
}

async function safeListCaseAccountingSummaryRows(): Promise<CaseAccountingSummaryInputRow[]> {
  try {
    const rows = await prisma.caseMatter.findMany({
      select: {
        id: true,
        caseNo: true,
        title: true,
        accountingMemo: {
          select: {
            feeAmount: true,
            feeStatus: true,
            paymentStatus: true,
            paidAmount: true,
            paidAt: true
          }
        }
      },
      orderBy: [{ updatedAt: "desc" }]
    });
    return rows.map((row) => ({
      caseId: row.id,
      caseNo: row.caseNo ?? "-",
      title: row.title,
      accountingMemoExists: Boolean(row.accountingMemo),
      feeStatusCode: row.accountingMemo?.feeStatus ?? null,
      paymentStatusCode: row.accountingMemo?.paymentStatus ?? null,
      feeAmountValue: row.accountingMemo?.feeAmount ?? null,
      paidAmountValue: row.accountingMemo?.paidAmount ?? null,
      paidAtValue: row.accountingMemo?.paidAt ? row.accountingMemo.paidAt.toISOString().slice(0, 10) : null
    }));
  } catch (error) {
    logger.error("Failed to load case accounting summary for admin dashboard", error);
    return [];
  }
}

async function safeGetSystemHealthSnapshot() {
  try {
    return await getSystemHealthSnapshot();
  } catch (error) {
    logger.error("Failed to load system health snapshot for admin dashboard", error);
    return null;
  }
}

async function safeGetPublicIntakeControlSnapshot(): Promise<PublicIntakeControlSnapshot> {
  try {
    return await getPublicIntakeControlSnapshot();
  } catch (error) {
    logger.error("Failed to load public intake control snapshot for admin dashboard", error);
    return {
      maintenanceMode: false,
      maintenanceMessage: "공개 접수 상태를 읽지 못해 기본 값으로 표시합니다.",
      retryAfterSec: 300,
      source: "env",
      updatedAt: null,
      updatedBy: null
    };
  }
}

async function safeCount<T>(label: string, task: Promise<T>, fallback: T) {
  try {
    return await task;
  } catch (error) {
    logger.error(`Failed to load ${label} for admin dashboard`, error);
    return fallback;
  }
}

export default async function AdminDashboardContent() {
  const dashboardV2Enabled = await isFeatureEnabled("admin_dashboard_v2");
  const [
    inquiries,
    systemHealthSnapshot,
    publicIntakeControl,
    quoteCount,
    contractDraftCount,
    caseCount,
    caseMatters,
    caseAccountingRows
  ] = await Promise.all([
    safeListInquiries(),
    safeGetSystemHealthSnapshot(),
    safeGetPublicIntakeControlSnapshot(),
    safeCount("quote count", prisma.quote.count(), 0),
    safeCount("contract draft count", prisma.contractDraft.count(), 0),
    safeCount("case count", prisma.caseRecord.count(), 0),
    safeListCaseMatters(),
    safeListCaseAccountingSummaryRows()
  ]);
  const caseMatterActionSummary = buildCaseMatterActionSummary(
    buildCaseMatterActionDashboard(caseMatters),
    5
  );
  const caseAccountingSummary = buildCaseAccountingSummaryViewModel(caseAccountingRows);
  const documentTemplateItems = listDocumentTemplateInventory();
  const documentLabPrioritySummary = buildDocumentTemplateSourceVerificationPriority(documentTemplateItems);
  const documentLabSourceChecklistReasons = getTopDocumentTemplateSourceChecklistReasons(documentTemplateItems, 3);

  const {
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
    publicIntakeStatus,
    healthTone,
    healthDescription,
    healthScore,
    healthAlertCount,
    healthCriticalCount
  } = buildAdminDashboardPageData({
    inquiries,
    systemHealthSnapshot,
    publicIntakeControl
  });

  const casesByCategory = Object.entries(
    caseMatters.reduce<Record<string, number>>((acc, c) => {
      const key = (c.category as string) ?? "기타";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([key, count]) => ({
    label: PRACTICE_AREA_LABELS[key] ?? key,
    count,
  }));

  const todayItems = ([
    { label: "긴급 확인", count: urgentCount, href: "/admin/inquiries", tone: "danger" as const },
    { label: "자료 미비", count: docsPendingCount, href: "/admin/inquiries", tone: "warning" as const },
    { label: "회신 대기", count: responsePendingCount, href: "/admin/inquiries", tone: "info" as const },
    { label: "견적 후속", count: quotePendingCount, href: "/admin/inquiries", tone: "success" as const },
  ] satisfies TodayItem[]).filter((i) => i.count > 0);

  return (
    <div className="space-y-6">
      {dashboardV2Enabled ? <AdminDashboardV2Section /> : null}
      <DashboardTodayStrip todayItems={todayItems} />

      <DashboardHero
        urgentCount={urgentCount}
        docsPendingCount={docsPendingCount}
        responsePendingCount={responsePendingCount}
        quotePendingCount={quotePendingCount}
        healthAlertCount={healthAlertCount}
        healthCriticalCount={healthCriticalCount}
        checklistAvgPercent={checklistAvgPercent}
        checklistLowReadinessCount={checklistLowReadinessCount}
        publicIntakeStatus={publicIntakeStatus}
        healthTone={healthTone}
        healthScore={healthScore}
        healthDescription={healthDescription}
      />

      <NextActionsPanel />

      <DashboardStats
        inquiriesCount={inquiries.length}
        quoteCount={quoteCount}
        contractDraftCount={contractDraftCount}
        caseCount={caseCount}
        checklistCoverageCount={checklistCoverageCount}
        checklistAvgPercent={checklistAvgPercent}
        checklistLowReadinessCount={checklistLowReadinessCount}
        operationalHealthScore={operationalHealthScore}
        operationalHealthDescription={operationalHealthDescription}
      />

      <DashboardCharts pipeline={pipeline} casesByCategory={casesByCategory} />

      <CaseMatterActionSummaryCard summary={caseMatterActionSummary} locale="ko" />

      <CaseAccountingDashboardCard summary={caseAccountingSummary} />

      <DocumentLabDashboardCard
        summary={documentLabPrioritySummary}
        sourceChecklistReasons={documentLabSourceChecklistReasons}
      />

      <DashboardExecutionQueue
        immediateActionItemsWithProgress={immediateActionItemsWithProgress}
        operationalHealthScore={operationalHealthScore}
        operationalHealthDescription={operationalHealthDescription}
        urgentCount={urgentCount}
        docsPendingCount={docsPendingCount}
        responsePendingCount={responsePendingCount}
        quotePendingCount={quotePendingCount}
        checklistCoverageCount={checklistCoverageCount}
        checklistLowReadinessCount={checklistLowReadinessCount}
      />

      <DashboardPipeline
        pipeline={pipeline}
        urgentCount={urgentCount}
        docsPendingCount={docsPendingCount}
        consultationCount={consultationCount}
        responsePendingCount={responsePendingCount}
      />

      <DashboardListCards
        dueSoonItems={dueSoonItems}
        nextContactItems={nextContactItems}
        recentIntakes={recentIntakes}
      />

      <DashboardPlatformKpis />

      <DashboardIntegrations />

      <DashboardRecentInquiries recentIntakes={recentIntakes} />
    </div>
  );
}
