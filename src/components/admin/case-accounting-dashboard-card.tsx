import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { CaseAccountingSummaryViewModel } from "@/lib/services/case-accounting-summary-view-model";

type CaseAccountingDashboardCardProps = {
  summary: CaseAccountingSummaryViewModel;
};

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-muted px-3 py-3">
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-text-strong">{value}</p>
    </div>
  );
}

const severityBadgeClassName = {
  critical: "border-red-200 bg-red-50 text-red-700",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-700"
} satisfies Record<CaseAccountingSummaryViewModel["followUpReasonBreakdown"][number]["severity"], string>;

export function CaseAccountingDashboardCard({ summary }: CaseAccountingDashboardCardProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">Accounting follow-up</p>
          <h3 className="mt-2 ui-section-title">수임/입금 확인</h3>
          <p className="mt-2 text-sm text-text-muted">
            내부 관리용 요약입니다. 회계/세무 확정 자료가 아닙니다.
          </p>
        </div>
        <Link href="/admin/ledger" className="text-sm font-medium text-primary">
          업무처리부에서 자세히 보기
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="확인 필요" value={summary.followUpCount} />
        <MiniMetric label="미입금" value={summary.paymentUnpaidCount} />
        <MiniMetric label="부분 입금" value={summary.paymentPartialCount} />
        <MiniMetric label="수임료 미확정" value={summary.feePendingCount + summary.feeUnsetCount} />
      </div>

      {summary.followUpCount === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-surface-muted px-3 py-3 text-sm text-text-muted">
          현재 표시할 확인 사유가 없습니다.
        </p>
      ) : (
        <div className="mt-4 rounded-xl border border-line bg-surface-muted px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-text-strong">확인 필요 사유</p>
            <p className="text-xs text-text-muted">상위 {summary.followUpReasonBreakdown.length}개</p>
          </div>
          {summary.followUpReasonBreakdown.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.followUpReasonBreakdown.map((item) => (
                <Link
                  key={item.code}
                  href={item.href}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${severityBadgeClassName[item.severity]}`}
                >
                  <span>{item.labelKo}</span>
                  <span>{item.count}건</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">현재 표시할 확인 사유가 없습니다.</p>
          )}
          <p className="mt-3 text-sm text-text-muted">
            확인 필요 {summary.followUpCount}건 중 우선순위는 업무처리부에서 사건별로 확인합니다.
          </p>
        </div>
      )}
    </Card>
  );
}
