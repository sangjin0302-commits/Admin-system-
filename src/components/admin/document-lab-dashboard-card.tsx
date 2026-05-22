import Link from "next/link";

import { Card } from "@/components/ui/card";
import type {
  DocumentTemplateSourceChecklistReasonBreakdownItem,
  DocumentTemplateSourceVerificationPrioritySummary
} from "@/lib/document-templates";

type DocumentLabDashboardCardViewModel = {
  urgentCount: number;
  highRiskNeedsReviewCount: number;
  needsReviewCount: number;
  pendingCount: number;
  manualOnlyCount: number;
  primaryHref: string;
  topLabels: string[];
  topMissingReasons: DocumentTemplateSourceChecklistReasonBreakdownItem[];
};

type DocumentLabDashboardCardProps = {
  summary: DocumentTemplateSourceVerificationPrioritySummary;
  sourceChecklistReasons: DocumentTemplateSourceChecklistReasonBreakdownItem[];
};

export function buildDocumentLabDashboardPriorityCardViewModel(
  summary: DocumentTemplateSourceVerificationPrioritySummary,
  sourceChecklistReasons: DocumentTemplateSourceChecklistReasonBreakdownItem[] = []
): DocumentLabDashboardCardViewModel {
  return {
    urgentCount: summary.urgentCount,
    highRiskNeedsReviewCount: summary.highRiskNeedsReviewCount,
    needsReviewCount: summary.needsReviewCount,
    pendingCount: summary.pendingCount,
    manualOnlyCount: summary.manualOnlyCount,
    primaryHref: "/admin/document-lab?risk=high&sourceStatus=needs_review",
    topLabels: summary.topPriorityTemplates.slice(0, 3).map((item) => item.titleKo),
    topMissingReasons: sourceChecklistReasons.slice(0, 3)
  };
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-muted px-3 py-3">
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-text-strong">{value}</p>
    </div>
  );
}

function ReasonTone({ reason }: { reason: DocumentTemplateSourceChecklistReasonBreakdownItem }) {
  const tone =
    reason.severity === "critical"
      ? "border-red-200 bg-red-50 text-red-800"
      : reason.severity === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <Link
      href={reason.href}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      <span>{reason.labelKo}</span>
      <span>{reason.count}건</span>
    </Link>
  );
}

export function DocumentLabDashboardCard({ summary, sourceChecklistReasons }: DocumentLabDashboardCardProps) {
  const viewModel = buildDocumentLabDashboardPriorityCardViewModel(summary, sourceChecklistReasons);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">Document Lab</p>
          <h3 className="mt-2 ui-section-title">문서 서식 검토</h3>
          <p className="mt-2 text-sm text-text-muted">
            HWP/HWPX 서식 자동화 전 공식 출처와 최신성을 확인합니다.
          </p>
        </div>
        <Link href={viewModel.primaryHref} className="text-sm font-medium text-primary">
          문서 실험실에서 보기
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="긴급 검토" value={viewModel.urgentCount} />
        <MiniMetric label="고위험 미확인" value={viewModel.highRiskNeedsReviewCount} />
        <MiniMetric label="최신성 확인 필요" value={viewModel.needsReviewCount} />
        <MiniMetric label="수동 작성 유지" value={viewModel.manualOnlyCount} />
      </div>

      {viewModel.urgentCount === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-surface-muted px-3 py-3 text-sm text-text-muted">
          긴급 검토 대상 없음. 그래도 공식 출처 검토 상태는 문서 실험실에서 계속 확인합니다.
        </p>
      ) : (
        <div className="mt-4 rounded-xl border border-line bg-surface-muted px-3 py-3">
          <p className="text-sm font-semibold text-text-strong">우선 확인 서식</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {viewModel.topLabels.map((label) => (
              <span
                key={label}
                className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-text-muted">
            고위험 서식 중 공식 출처 또는 최신성 확인이 필요한 항목을 먼저 검토합니다.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-line bg-surface-muted px-3 py-3">
        <p className="text-sm font-semibold text-text-strong">주요 누락 사유</p>
        {viewModel.topMissingReasons.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {viewModel.topMissingReasons.map((reason) => (
              <ReasonTone key={reason.reasonId} reason={reason} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">긴급 검토 누락 사유가 없습니다.</p>
        )}
      </div>
    </Card>
  );
}
