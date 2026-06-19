import Link from "next/link";

import { dashboardToneClassName } from "@/components/admin/dashboard-shared";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import type { buildAdminDashboardPageData } from "@/lib/services/admin-dashboard-page-data";
import {
  getOperationalHealthToneClass,
  getPriorityScore,
  getPriorityReason,
  getStatusTone
} from "@/lib/services/admin-dashboard-helpers";
import type { listInquiries } from "@/lib/services/inquiry-service";
import { formatDateTime } from "@/lib/utils";
import { getInquiryStatusLabel, getUrgencyLabel } from "@/types/inquiry";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];
type PageData = ReturnType<typeof buildAdminDashboardPageData<InquiryListItem>>;

type Props = {
  immediateActionItemsWithProgress: PageData["immediateActionItemsWithProgress"];
  operationalHealthScore: number;
  operationalHealthDescription: string;
  urgentCount: number;
  docsPendingCount: number;
  responsePendingCount: number;
  quotePendingCount: number;
  checklistCoverageCount: number;
  checklistLowReadinessCount: number;
};

export function DashboardExecutionQueue({
  immediateActionItemsWithProgress,
  operationalHealthScore,
  operationalHealthDescription,
  urgentCount,
  docsPendingCount,
  responsePendingCount,
  quotePendingCount,
  checklistCoverageCount,
  checklistLowReadinessCount
}: Props) {
  return (
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
              className={`h-full rounded-full transition-all duration-700 ease-out ${getOperationalHealthToneClass(operationalHealthScore)}`}
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
  );
}
