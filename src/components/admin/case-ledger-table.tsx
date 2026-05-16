import Link from "next/link";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { formatCaseMatterTypeLabel } from "@/lib/immigration";
import type { CaseLedgerFilters, CaseLedgerViewModel } from "@/lib/services/case-ledger-view-model";

type CaseLedgerTableProps = {
  viewModel: CaseLedgerViewModel;
  filters: CaseLedgerFilters;
  statusOptions: Array<{ value: string; label: string }>;
  matterTypeOptions: string[];
  assignedToOptions: string[];
};

function selectValue(value: string | null | undefined) {
  return value ?? "";
}

export function CaseLedgerTable({
  viewModel,
  filters,
  statusOptions,
  matterTypeOptions,
  assignedToOptions
}: CaseLedgerTableProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]" method="get">
          <label className="space-y-1 text-xs font-semibold text-text-muted">
            접수 시작일
            <input
              type="date"
              name="dateFrom"
              defaultValue={selectValue(filters.dateFrom)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-text-muted">
            접수 종료일
            <input
              type="date"
              name="dateTo"
              defaultValue={selectValue(filters.dateTo)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-text-muted">
            처리상태
            <select
              name="status"
              defaultValue={selectValue(filters.status)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            >
              <option value="">전체</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-text-muted">
            업무유형
            <select
              name="matterType"
              defaultValue={selectValue(filters.matterType)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            >
              <option value="">전체</option>
              {matterTypeOptions.map((matterType) => (
                <option key={matterType} value={matterType}>
                  {formatCaseMatterTypeLabel(matterType)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-text-muted">
            담당자
            <select
              name="assignedTo"
              defaultValue={selectValue(filters.assignedTo)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            >
              <option value="">전체</option>
              {assignedToOptions.map((assignedTo) => (
                <option key={assignedTo} value={assignedTo}>
                  {assignedTo}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust"
            >
              필터
            </button>
            <Link
              href="/admin/ledger"
              className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
            >
              초기화
            </Link>
          </div>
        </form>
      </Card>

      {viewModel.rows.length === 0 ? (
        <EmptyState title="표시할 장부 행이 없습니다." description="필터를 조정하거나 사건을 먼저 생성하세요." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[1680px] divide-y divide-line text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-3 py-3 font-semibold">사건번호</th>
                  <th className="px-3 py-3 font-semibold">접수일자</th>
                  <th className="px-3 py-3 font-semibold">개시일자</th>
                  <th className="px-3 py-3 font-semibold">의뢰인</th>
                  <th className="px-3 py-3 font-semibold">업무유형</th>
                  <th className="px-3 py-3 font-semibold">사건명</th>
                  <th className="px-3 py-3 font-semibold">처리상태</th>
                  <th className="px-3 py-3 font-semibold">제출기관</th>
                  <th className="px-3 py-3 font-semibold">제출일자</th>
                  <th className="px-3 py-3 font-semibold">접수번호</th>
                  <th className="px-3 py-3 font-semibold">보완</th>
                  <th className="px-3 py-3 font-semibold">수임/입금</th>
                  <th className="px-3 py-3 font-semibold">결과수령일</th>
                  <th className="px-3 py-3 font-semibold">종결일자</th>
                  <th className="px-3 py-3 font-semibold">담당자</th>
                  <th className="px-3 py-3 font-semibold">비고</th>
                  <th className="px-3 py-3 font-semibold">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {viewModel.rows.map((row) => (
                  <tr key={row.caseId} className="align-top">
                    <td className="px-3 py-3 font-mono text-xs text-text-strong">{row.caseNo}</td>
                    <td className="px-3 py-3 text-text">{row.receivedDate}</td>
                    <td className="px-3 py-3 text-text">{row.openedDate}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-text-strong">{row.clientName}</p>
                      <p className="mt-1 text-xs text-text-muted">{row.clientType}</p>
                    </td>
                    <td className="px-3 py-3 text-text">{formatCaseMatterTypeLabel(row.matterType)}</td>
                    <td className="px-3 py-3">
                      <p className="max-w-[240px] font-semibold text-text-strong">{row.title}</p>
                      <p className="mt-1 max-w-[260px] text-xs text-text-muted">
                        {row.publicTrackingCode}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-text">{row.ledgerStatus}</td>
                    <td className="px-3 py-3 text-text">{row.targetAgency}</td>
                    <td className="px-3 py-3 text-text">{row.submittedAt}</td>
                    <td className="px-3 py-3 font-mono text-xs text-text">{row.receiptNo}</td>
                    <td className="px-3 py-3 text-text">{row.hasSupplement}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-text-muted">수임 {row.feeStatus}</p>
                      <p className="text-xs text-text-muted">입금 {row.paymentStatus}</p>
                      <p className="mt-1 text-xs text-text">{row.feeAmount}</p>
                      <p className="text-xs text-text">{row.paidAmount}</p>
                    </td>
                    <td className="px-3 py-3 text-text">{row.resultReceivedAt}</td>
                    <td className="px-3 py-3 text-text">{row.closedAt}</td>
                    <td className="px-3 py-3 text-text">{row.assignedTo}</td>
                    <td className="px-3 py-3">
                      <p className="max-w-[260px] text-xs text-text-muted">{row.note}</p>
                      {row.ledgerMemo !== "-" && (
                        <p className="mt-1 max-w-[260px] text-xs text-text-muted">{row.ledgerMemo}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/cases/${row.caseId}`}
                        className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
