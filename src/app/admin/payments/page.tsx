import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isTossConnected } from "@/lib/services/payment-service";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  caseId: string;
  caseNo: string | null;
  caseTitle: string | null;
  feeAmount: number | null;
  feeStatus: string;
  paymentStatus: string;
  paidAmount: number | null;
  paidAt: string | null;
  paymentMemo: string | null;
};

async function loadPayments(): Promise<PaymentRow[]> {
  try {
    const memos = await prisma.caseAccountingMemo.findMany({
      orderBy: [{ paidAt: "desc" }, { updatedAt: "desc" }],
      take: 50,
      include: {
        caseMatter: { select: { caseNo: true, title: true } },
      },
    });
    return memos.map((m) => ({
      id: m.id,
      caseId: m.caseId,
      caseNo: m.caseMatter?.caseNo ?? null,
      caseTitle: m.caseMatter?.title ?? null,
      feeAmount: m.feeAmount,
      feeStatus: m.feeStatus,
      paymentStatus: m.paymentStatus,
      paidAmount: m.paidAmount,
      paidAt: m.paidAt?.toISOString() ?? null,
      paymentMemo: m.paymentMemo,
    }));
  } catch {
    return [];
  }
}

function paymentStatusBadge(status: string): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800";
    case "PARTIAL":
      return "bg-amber-100 text-amber-800";
    case "REFUNDED":
      return "bg-slate-100 text-slate-800";
    case "UNPAID":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "PAID":
      return "완납";
    case "PARTIAL":
      return "부분납";
    case "REFUNDED":
      return "환불";
    case "UNPAID":
      return "미납";
    case "UNSET":
    default:
      return "미정";
  }
}

function formatKRW(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString("ko-KR")}원`;
}

export default async function PaymentsPage() {
  const connected = isTossConnected();
  const payments = await loadPayments();
  const totalPaid = payments
    .filter((p) => p.paymentStatus === "PAID")
    .reduce((acc, p) => acc + (p.paidAmount ?? 0), 0);
  const outstanding = payments
    .filter((p) => p.paymentStatus !== "PAID" && p.paymentStatus !== "REFUNDED")
    .reduce((acc, p) => acc + (p.feeAmount ?? 0) - (p.paidAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Finance"
        title="결제 관리"
        description="토스페이먼츠 연동 상태 + 사건별 수임료/입금 현황을 한눈에 확인합니다."
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs text-text-muted">연동 상태</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                connected ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium text-text-strong">
              {connected ? "Toss Live 연결됨" : "개발 모드 (mock)"}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-text-muted">최근 50건 입금 합계</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-text-strong">
            {formatKRW(totalPaid)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-text-muted">미수금 (개략)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-rose-700">
            {formatKRW(Math.max(0, outstanding))}
          </p>
        </Card>
      </div>

      {/* Payments table */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-semibold text-text-strong">
            최근 결제/수임료 내역
            {payments.length === 0 && (
              <span className="ml-2 font-normal text-text-muted">
                (데이터 없음 — 사건 회계 메모를 등록해 보세요)
              </span>
            )}
          </h3>
        </div>
        {payments.length > 0 && (
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
              <tr>
                <th className="px-5 py-3">사건번호</th>
                <th className="px-5 py-3">사건명</th>
                <th className="px-5 py-3 text-right">수임료</th>
                <th className="px-5 py-3 text-right">입금</th>
                <th className="px-5 py-3">상태</th>
                <th className="px-5 py-3">일자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-mono text-xs text-text-muted">
                    {p.caseNo ?? p.caseId.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3 text-text-strong">
                    {p.caseTitle ?? "—"}
                    {p.paymentMemo && (
                      <span className="ml-2 text-xs text-text-muted">
                        {p.paymentMemo}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatKRW(p.feeAmount)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatKRW(p.paidAmount)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusBadge(
                        p.paymentStatus
                      )}`}
                    >
                      {statusLabel(p.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-muted">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("ko-KR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Setup instructions */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">토스페이먼츠 설정</h3>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-text-muted">
          <li>
            <a
              href="https://developers.tosspayments.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              토스페이먼츠 개발자 센터
            </a>
            에서 가맹점 등록 + 시크릿 키 발급.
          </li>
          <li>
            환경변수{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
              TOSS_SECRET_KEY
            </code>{" "}
            +{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
              TOSS_WEBHOOK_SECRET
            </code>{" "}
            설정.
          </li>
          <li>
            웹훅 URL:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
              /api/webhooks/toss
            </code>{" "}
            를 Toss 대시보드에 등록.
          </li>
          <li>
            결제 요청 API:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
              POST /api/portal/payments/checkout
            </code>
          </li>
        </ol>
      </Card>
    </div>
  );
}
