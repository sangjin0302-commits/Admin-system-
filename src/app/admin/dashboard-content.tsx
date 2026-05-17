import Link from "next/link";

import {
  DashboardListCard,
  DashboardMetric,
  dashboardToneClassName
} from "@/components/admin/dashboard-shared";
import { CaseAccountingDashboardCard } from "@/components/admin/case-accounting-dashboard-card";
import { CaseMatterActionSummaryCard } from "@/components/admin/case-matter-action-summary-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { prisma } from "@/lib/prisma/client";
import { buildAdminDashboardPageData } from "@/lib/services/admin-dashboard-page-data";
import {
  buildCaseAccountingSummaryViewModel,
  type CaseAccountingSummaryInputRow
} from "@/lib/services/case-accounting-summary-view-model";
import {
  getOperationalHealthToneClass,
  getPriorityScore,
  getPriorityReason,
  getStatusTone
} from "@/lib/services/admin-dashboard-helpers";
import {
  buildCaseMatterActionDashboard,
  buildCaseMatterActionSummary
} from "@/lib/services/case-matter-action-view-model";
import { listCaseMatters } from "@/lib/services/case-matter-service";
import { listInquiries } from "@/lib/services/inquiry-service";
import { readMarketingSnapshot } from "@/lib/services/marketing-sync-service";
import {
  getPublicIntakeControlSnapshot,
  type PublicIntakeControlSnapshot
} from "@/lib/services/public-intake-control-service-safe-v3";
import { getSystemHealthSnapshot } from "@/lib/services/system-health-service-safe-v3";
import { formatDateTime } from "@/lib/utils";
import {
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  getLanguageCodeLabel,
  getUrgencyLabel
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];
type CaseMatterListItem = Awaited<ReturnType<typeof listCaseMatters>>[number];

async function safeListInquiries() {
  try {
    return await listInquiries();
  } catch (error) {
    console.error("Failed to load inquiries for admin dashboard", error);
    return [] as InquiryListItem[];
  }
}

async function safeListCaseMatters() {
  try {
    return await listCaseMatters();
  } catch (error) {
    console.error("Failed to load case matters for admin dashboard", error);
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
    console.error("Failed to load case accounting summary for admin dashboard", error);
    return [];
  }
}

async function safeReadMarketingSnapshot() {
  try {
    return await readMarketingSnapshot();
  } catch (error) {
    console.error("Failed to load marketing snapshot for admin dashboard", error);
    return null;
  }
}

async function safeGetSystemHealthSnapshot() {
  try {
    return await getSystemHealthSnapshot();
  } catch (error) {
    console.error("Failed to load system health snapshot for admin dashboard", error);
    return null;
  }
}

async function safeGetPublicIntakeControlSnapshot(): Promise<PublicIntakeControlSnapshot> {
  try {
    return await getPublicIntakeControlSnapshot();
  } catch (error) {
    console.error("Failed to load public intake control snapshot for admin dashboard", error);
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
    console.error(`Failed to load ${label} for admin dashboard`, error);
    return fallback;
  }
}

export default async function AdminDashboardContent() {
  const [
    inquiries,
    marketingSnapshot,
    systemHealthSnapshot,
    publicIntakeControl,
    quoteCount,
    contractDraftCount,
    caseCount,
    caseMatters,
    caseAccountingRows
  ] = await Promise.all([
    safeListInquiries(),
    safeReadMarketingSnapshot(),
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
    lawbotStatus,
    publicIntakeStatus,
    marketingStatus,
    healthTone,
    healthDescription,
    healthScore,
    healthAlertCount,
    healthCriticalCount
  } = buildAdminDashboardPageData({
    inquiries,
    marketingSnapshot,
    systemHealthSnapshot,
    publicIntakeControl
  });

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="ui-kicker">업무 관리 허브</p>
              <h2 className="mt-2 ui-page-title">관리자 대시보드</h2>
              <p className="mt-2 max-w-3xl text-sm text-text-muted">
                문의 접수, 상담 준비, 견적 후속, 사건 진행, 분석 엔진 연결 상태를 한 화면에서 보고 바로
                다음 행동으로 넘어갈 수 있게 정리했습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/inquiries"
                className="inline-flex items-center justify-center rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-[#143d5d]"
              >
                문의 목록 열기
              </Link>
              <Link
                href="/admin/intake-sources"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                접수 유입 분석
              </Link>
              <Link
                href="/admin/ledger"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                업무처리부
              </Link>
              <Link
                href="/admin/integrations"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                연동 센터
              </Link>
              <Link
                href="/admin/monitoring"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                모니터링
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="ui-analysis-chip">오늘 우선 확인 {urgentCount}건</span>
            <span className="ui-analysis-chip">자료 확인 필요 {docsPendingCount}건</span>
            <span className="ui-analysis-chip">응답 대기 {responsePendingCount}건</span>
            <span className="ui-analysis-chip">견적 후속 {quotePendingCount}건</span>
            <span className="ui-analysis-chip">헬스 경고 {healthAlertCount}건</span>
            <span className="ui-analysis-chip">중대 이슈 {healthCriticalCount}건</span>
            <span className="ui-analysis-chip">체크리스트 평균 준비도 {checklistAvgPercent}%</span>
            <span className="ui-analysis-chip">준비도 낮음 {checklistLowReadinessCount}건</span>
          </div>

          <div className="grid gap-3 xl:grid-cols-5">
            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">Public Intake</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">공개 접수 상태</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${publicIntakeStatus.toneClassName}`}>
                  {publicIntakeStatus.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{publicIntakeStatus.description}</p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">System Health</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">안정성 지표</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${healthTone.toneClassName}`}>
                  {healthTone.label} {healthScore}점
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{healthDescription}</p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">Lawbot</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">법률 분석</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lawbotStatus.toneClassName}`}>
                  {lawbotStatus.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{lawbotStatus.description}</p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">Market Analyze</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">시장 인사이트</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${marketingStatus.toneClassName}`}>
                  {marketingStatus.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{marketingStatus.description}</p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <p className="ui-kicker">Workspace</p>
              <h3 className="mt-3 text-base font-semibold text-text-strong">별도 화면 연결</h3>
              <p className="mt-2 text-sm text-text-muted">
                market-analyze 프론트 구조를 기준으로 연동 센터에 스크린 자리를 미리 만들어 둔 상태입니다.
              </p>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <DashboardMetric label="문의" value={inquiries.length} description="누적 접수와 사건 후보" />
        <DashboardMetric label="견적" value={quoteCount} description="생성된 견적 및 후속 흐름" />
        <DashboardMetric label="계약 초안" value={contractDraftCount} description="계약 문안 및 정리 단계" />
        <DashboardMetric label="사건" value={caseCount} description="실제 진행 중인 사건 레코드" />
        <DashboardMetric label="체크리스트 적용" value={checklistCoverageCount} description="즉시 조치 체크를 적용 중인 건" />
        <DashboardMetric label="평균 준비도" value={checklistAvgPercent} description="실행 체크리스트 평균 완료율(%)" />
        <DashboardMetric label="준비도 낮음" value={checklistLowReadinessCount} description="완료율 40% 이하 우선 점검 건" />
        <DashboardMetric
          label="운영 건전도"
          value={operationalHealthScore}
          description={operationalHealthDescription}
        />
      </div>

      <CaseMatterActionSummaryCard summary={caseMatterActionSummary} locale="ko" />

      <CaseAccountingDashboardCard summary={caseAccountingSummary} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="ui-kicker">Execution Queue</p>
              <h3 className="mt-2 ui-section-title">오늘 바로 처리할 순서</h3>
            </div>
            <Link href="/admin/inquiries" className="text-sm font-medium text-primary">
              전체 문의 열기
            </Link>
          </div>

          {immediateActionItemsWithProgress.length > 0 ? (
            <div className="mt-5 space-y-3">
              {immediateActionItemsWithProgress.map((item) => (
                <Link
                  key={`action-${item.id}`}
                  href={`/admin/inquiries/${item.id}`}
                  className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-strong">{item.title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {getInquiryStatusLabel(item.status)} / {getUrgencyLabel(item.urgencyLevel)} / 업데이트{" "}
                        {formatDateTime(item.updatedAt)}
                      </p>
                      <p className="mt-2 text-sm text-text">{getPriorityReason(item)}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        실행 준비도{" "}
                        {item.checklistTotalCount > 0
                          ? `${item.checklistProgressPercent}% (남음 ${item.checklistPendingCount}건)`
                          : "체크리스트 준비 중"}
                      </p>
                    </div>
                    <span className={dashboardToneClassName(getStatusTone(item.status))}>
                      우선점수 {getPriorityScore(item)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5"
              title="지금 즉시 처리할 우선 항목이 없습니다."
              description="신규 접수나 회신 대기가 생기면 이 영역에 자동으로 정렬됩니다."
            />
          )}
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">Ops Health</p>
          <h3 className="mt-2 ui-section-title">운영 건전도 점검</h3>
          <p className="mt-2 text-sm text-text-muted">{operationalHealthDescription}</p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
              <span>건전도 점수</span>
              <span className="font-semibold text-text-strong">{operationalHealthScore} / 100</span>
            </div>
            <div
              className="h-2 rounded-full bg-surface-muted"
              role="progressbar"
              aria-label="운영 건전도"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={operationalHealthScore}
            >
              <div
                className={`h-full rounded-full ${getOperationalHealthToneClass(operationalHealthScore)}`}
                style={{ width: `${operationalHealthScore}%` }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm text-text-muted">
            <p>• 긴급/당일 확인 건: {urgentCount}건</p>
            <p>• 자료 확인 필요 건: {docsPendingCount}건</p>
            <p>• 회신 또는 연락 대기 건: {responsePendingCount}건</p>
            <p>• 견적 후속 처리 건: {quotePendingCount}건</p>
            <p>• 체크리스트 적용 건: {checklistCoverageCount}건</p>
            <p>• 준비도 낮음(40% 이하): {checklistLowReadinessCount}건</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="ui-kicker">파이프라인</p>
              <h3 className="mt-2 ui-section-title">상태별 운영 흐름</h3>
            </div>
            <Link href="/admin/inquiries" className="text-sm font-medium text-primary">
              전체 목록 보기
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pipeline.map((item) => (
              <Card key={item.key} muted className="p-4">
                <p className="ui-kicker">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-text-strong">{item.count}</p>
                <p className="mt-2 text-xs text-text-muted">{item.description}</p>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">오늘의 포인트</p>
          <h3 className="mt-2 ui-section-title">우선 확인 요약</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <p>• 긴급·당일 기준으로 먼저 볼 문의는 {urgentCount}건입니다.</p>
            <p>• 자료 확보가 먼저 필요한 문의는 {docsPendingCount}건입니다.</p>
            <p>• 상담 연결 또는 대기 흐름은 {consultationCount}건입니다.</p>
            <p>• 고객 회신 또는 다음 연락 대기는 {responsePendingCount}건입니다.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardListCard
          kicker="기한 임박"
          title="기한 임박 문의"
          emptyTitle="임박 일정이 없습니다."
          emptyDescription="3일 내 희망 일정 또는 기한이 생기면 여기에 표시됩니다."
          items={dueSoonItems.map((item) => ({
            id: item.id,
            href: `/admin/inquiries/${item.id}`,
            title: item.title,
            meta: `${getUrgencyLabel(item.urgencyLevel)} / ${formatDateTime(item.dueDate)}`,
            description: `${item.contactName}${item.organizationName ? ` / ${item.organizationName}` : ""}`
          }))}
        />

        <DashboardListCard
          kicker="후속 연락"
          title="연락·회신 확인"
          emptyTitle="후속 연락 대기 건이 없습니다."
          emptyDescription="응답 대기나 다음 연락 일정이 생기면 이 영역에 표시됩니다."
          items={nextContactItems.map((item) => ({
            id: item.id,
            href: `/admin/inquiries/${item.id}`,
            title: item.title,
            meta: item.responsePending ? "고객 응답 대기" : `다음 연락 ${formatDateTime(item.nextContactAt)}`,
            description: `${getInquiryStatusLabel(item.status)} / ${item.contactName}`
          }))}
        />

        <DashboardListCard
          kicker="최근 접수"
          title="최근 접수"
          emptyTitle="아직 접수가 없습니다."
          emptyDescription="새 문의가 접수되면 가장 최근 건이 여기에 표시됩니다."
          items={recentIntakes.map((item) => ({
            id: item.id,
            href: `/admin/inquiries/${item.id}`,
            title: item.title,
            meta: `${getInquiryTypeLabel(item.inquiryType)} / ${formatDateTime(item.createdAt)}`,
            description: `${item.contactName} / ${getLanguageCodeLabel(item.preferredLanguage)}`
          }))}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="ui-kicker">연동 업무실</p>
            <h3 className="mt-2 ui-section-title">Lawbot / Market Analyze 자리</h3>
          </div>
          <Link href="/admin/integrations" className="text-sm font-medium text-primary">
            연동 센터 열기
          </Link>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <Card muted className="p-4">
            <p className="ui-kicker">Lawbot</p>
            <h4 className="mt-2 text-base font-semibold text-text-strong">사건 기준 법률 분석 자리</h4>
            <p className="mt-2 text-sm text-text-muted">
              사건 상세에서 실제 분석 호출, 스냅샷 저장, 재분석 비교까지 연결해 둔 상태입니다.
            </p>
          </Card>
          <Card muted className="p-4">
            <p className="ui-kicker">Market Analyze</p>
            <h4 className="mt-2 text-base font-semibold text-text-strong">별도 프론트 구조 반영</h4>
            <p className="mt-2 text-sm text-text-muted">
              로컬 기준으로 dashboard, competitors, hot issues, sentiment, services 화면 구성이 확인되어
              system 안에 보여줄 자리를 만들어 둔 상태입니다.
            </p>
          </Card>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="ui-kicker">최근 주요 문의</p>
            <h3 className="mt-2 ui-section-title">바로 열어볼 항목</h3>
          </div>
          <p className="text-sm text-text-muted">상태와 긴급도를 같이 보면서 바로 상세 화면으로 이동할 수 있습니다.</p>
        </div>

        {recentIntakes.length > 0 ? (
          <div className="mt-5 space-y-3">
            {recentIntakes.map((item: InquiryListItem) => (
              <Link
                key={item.id}
                href={`/admin/inquiries/${item.id}`}
                className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="urgency" urgency={item.urgencyLevel}>
                        {getUrgencyLabel(item.urgencyLevel)}
                      </Badge>
                      <Badge tone="status" status={item.status}>
                        {getInquiryStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <p className="mt-3 truncate text-base font-semibold text-text-strong">{item.title}</p>
                    <p className="mt-1 truncate text-sm text-text-muted">
                      {item.contactName}
                      {item.organizationName ? ` / ${item.organizationName}` : ""} /{" "}
                      {getInquiryTypeLabel(item.inquiryType)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                    <span className={dashboardToneClassName(getStatusTone(item.status))}>
                      {item.responsePending ? "응답 대기" : "운영 진행 중"}
                    </span>
                    <span>{formatDateTime(item.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="표시할 최근 문의가 없습니다."
            description="공개 접수나 내부 등록이 생기면 최근 문의 카드가 여기에 정리됩니다."
            actionLabel="공개 접수 열기"
            actionHref="/intake"
            className="mt-5"
          />
        )}
      </Card>
    </div>
  );
}
