import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { CaseAccountingSummaryViewModel } from "@/lib/services/case-accounting-summary-view-model";

type CaseAccountingSummaryCardsProps = {
  summary: CaseAccountingSummaryViewModel;
};

const severityLabels = {
  info: "확인",
  warn: "주의",
  critical: "우선 확인"
} as const;

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-strong">{value}</p>
    </Card>
  );
}

export function CaseAccountingSummaryCards({ summary }: CaseAccountingSummaryCardsProps) {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        <SummaryCard label="전체 사건" value={summary.totalCases} />
        <SummaryCard label="수임료 확정" value={summary.feeConfirmedCount} />
        <SummaryCard label="수임료 미확정" value={summary.feePendingCount + summary.feeUnsetCount} />
        <SummaryCard label="미입금 사건" value={summary.paymentUnpaidCount} />
        <SummaryCard label="부분 입금 사건" value={summary.paymentPartialCount} />
        <SummaryCard label="입금 완료" value={summary.paymentPaidCount} />
        <SummaryCard label="후속 확인 필요" value={summary.followUpCount} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-kicker">Accounting follow-up</p>
            <h3 className="text-base font-semibold text-text-strong">수임/입금 확인</h3>
            <p className="mt-1 text-sm text-text-muted">
              이 요약은 내부 관리용이며 회계/세무 확정 자료가 아닙니다.
            </p>
          </div>
          <p className="text-xs font-medium text-text-muted">금액 합산은 이번 요약에서 제외합니다.</p>
        </div>

        {summary.followUpItems.length === 0 ? (
          <p className="mt-3 rounded-lg border border-line bg-surface-muted p-3 text-sm text-text-muted">
            현재 필터 기준 후속 확인 hint가 없습니다.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {summary.followUpItems.slice(0, 8).map((item) => (
              <li key={item.caseId} className="rounded-lg border border-line bg-surface-muted p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ui-badge">{severityLabels[item.severity]}</span>
                  <p className="font-semibold text-text-strong">{item.caseNo}</p>
                </div>
                <p className="mt-1 text-text">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-text-strong">{item.reason}</p>
                <p className="mt-1 text-xs text-text-muted">
                  fee {item.feeStatus} / payment {item.paymentStatus}
                </p>
                <Link
                  href={`/admin/cases/${item.caseId}`}
                  className="mt-2 inline-flex h-8 items-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
                >
                  사건 확인
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
