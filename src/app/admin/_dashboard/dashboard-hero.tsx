import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { buildAdminDashboardPageData } from "@/lib/services/admin-dashboard-page-data";
import type { listInquiries } from "@/lib/services/inquiry-service";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];
type PageData = ReturnType<typeof buildAdminDashboardPageData<InquiryListItem>>;

type Props = {
  urgentCount: PageData["urgentCount"];
  docsPendingCount: PageData["docsPendingCount"];
  responsePendingCount: PageData["responsePendingCount"];
  quotePendingCount: PageData["quotePendingCount"];
  healthAlertCount: PageData["healthAlertCount"];
  healthCriticalCount: PageData["healthCriticalCount"];
  checklistAvgPercent: PageData["checklistAvgPercent"];
  checklistLowReadinessCount: PageData["checklistLowReadinessCount"];
  publicIntakeStatus: PageData["publicIntakeStatus"];
  healthTone: PageData["healthTone"];
  healthScore: PageData["healthScore"];
  healthDescription: PageData["healthDescription"];
};

export function DashboardHero({
  urgentCount,
  docsPendingCount,
  responsePendingCount,
  quotePendingCount,
  healthAlertCount,
  healthCriticalCount,
  checklistAvgPercent,
  checklistLowReadinessCount,
  publicIntakeStatus,
  healthTone,
  healthScore,
  healthDescription
}: Props) {
  return (
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
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
            >
              접수 유입 분석
            </Link>
            <Link
              href="/admin/ledger"
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
            >
              업무처리부
            </Link>
            <Link
              href="/admin/document-lab"
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
            >
              문서 실험실
            </Link>
            <Link
              href="/admin/integrations"
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
            >
              연동 센터
            </Link>
            <Link
              href="/admin/monitoring"
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
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

        <div className="grid gap-3 xl:grid-cols-2">
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

        </div>
      </div>
    </Card>
  );
}
