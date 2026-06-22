import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  isTossConnected,
  listPayments,
  getPaymentStats,
} from "@/lib/services/payment-service";
import { prisma } from "@/lib/prisma/client";
import { CancelPaymentButton } from "./cancel-button";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  REQUESTED: "bg-slate-100 text-slate-700",
  CANCELED: "bg-rose-100 text-rose-800",
  PARTIAL_CANCELED: "bg-amber-100 text-amber-800",
  FAILED: "bg-rose-100 text-rose-800",
  EXPIRED: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "승인",
  REQUESTED: "요청",
  CANCELED: "취소",
  PARTIAL_CANCELED: "부분취소",
  FAILED: "실패",
  EXPIRED: "만료",
};

function formatKRW(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString("ko-KR")}원`;
}

export default async function PaymentsPage() {
  const [connected, payments, stats, memos] = await Promise.all([
    Promise.resolve(isTossConnected()),
    listPayments(50),
    getPaymentStats(),
    prisma.caseAccountingMemo
      .findMany({
        orderBy: [{ paidAt: "desc" }, { updatedAt: "desc" }],
        take: 30,
        include: { caseMatter: { select: { caseNo: true, title: true } } },
      })
      .catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Finance"
        title="결제 관리"
        description="Toss Payments 영수증/취소 + 사건별 회계 메모. Round W부터 모든 거래가 Payment 테이블에 영속화됩니다."
      />

      {/* KPI — 모바일 2열 / 데스크탑 5열 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">연동 상태</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                connected ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium">
              {connected ? "Toss Live" : "Mock"}
            </span>
          </div>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">승인 누적</p>
          <p className="mt-1 text-base md:text-xl font-semibold tabular-nums">
            {formatKRW(stats.confirmedAmount)}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">승인 건수</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold tabular-nums">
            {stats.confirmedCount}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">대기/요청</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-slate-700 tabular-nums">
            {stats.pendingCount}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs text-text-muted">실패/취소</p>
          <p className="mt-1 text-xl md:text-2xl font-semibold text-rose-700 tabular-nums">
            {stats.failedCount + stats.canceledCount}
          </p>
        </Card>
      </div>

      {/* Payment 테이블 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-text-strong">
          Toss 거래 내역 (Payment)
        </h3>
        {payments.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-muted">
            거래 내역이 없습니다. /api/portal/payments/checkout 으로 세션을 만드세요.
          </Card>
        ) : (
          <>
            {/* 모바일 카드 */}
            <div className="space-y-2 md:hidden">
              {payments.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-strong">
                        {p.orderName}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-text-muted">
                        {p.orderId}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        STATUS_BADGE[p.status] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold tabular-nums">
                    {formatKRW(p.amount)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {new Date(p.createdAt).toLocaleString("ko-KR")}
                  </p>
                  {p.status === "CONFIRMED" && p.paymentKey && (
                    <div className="mt-2">
                      <CancelPaymentButton
                        paymentKey={p.paymentKey}
                        maxAmount={p.amount}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* 데스크탑 테이블 */}
            <Card className="hidden overflow-hidden p-0 md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
                    <tr>
                      <th className="px-5 py-3">주문번호</th>
                      <th className="px-5 py-3">상품명</th>
                      <th className="px-5 py-3 text-right">금액</th>
                      <th className="px-5 py-3">상태</th>
                      <th className="px-5 py-3">일시</th>
                      <th className="px-5 py-3">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3 font-mono text-xs">{p.orderId}</td>
                        <td className="px-5 py-3">{p.orderName}</td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          {formatKRW(p.amount)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                              STATUS_BADGE[p.status] ?? ""
                            }`}
                          >
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-text-muted">
                          {new Date(p.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="px-5 py-3">
                          {p.status === "CONFIRMED" && p.paymentKey && (
                            <CancelPaymentButton
                              paymentKey={p.paymentKey}
                              maxAmount={p.amount}
                            />
                          )}
                          {p.receiptUrl && (
                            <a
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-blue-600 underline"
                            >
                              영수증
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </section>

      {/* Legacy CaseAccountingMemo */}
      {memos.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-text-strong">
            사건별 회계 메모 (legacy)
          </h3>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
                  <tr>
                    <th className="px-5 py-3">사건번호</th>
                    <th className="px-5 py-3">사건명</th>
                    <th className="px-5 py-3 text-right">수임료</th>
                    <th className="px-5 py-3 text-right">입금</th>
                    <th className="px-5 py-3">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {memos.map((m) => (
                    <tr key={m.id}>
                      <td className="px-5 py-3 font-mono text-xs">
                        {m.caseMatter?.caseNo ?? m.caseId.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3">{m.caseMatter?.title ?? "—"}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatKRW(m.feeAmount)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatKRW(m.paidAmount)}
                      </td>
                      <td className="px-5 py-3 text-xs">{m.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
