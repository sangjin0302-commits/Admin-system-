import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";

const PAY_BADGE: Record<string, string> = {
  REQUESTED: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-rose-100 text-rose-800",
  PARTIAL_CANCELED: "bg-amber-100 text-amber-800",
  FAILED: "bg-rose-100 text-rose-800",
  EXPIRED: "bg-gray-100 text-gray-600",
};

const PAY_LABEL: Record<string, string> = {
  REQUESTED: "요청",
  CONFIRMED: "승인",
  CANCELED: "취소",
  PARTIAL_CANCELED: "부분취소",
  FAILED: "실패",
  EXPIRED: "만료",
};

const INVOICE_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-emerald-100 text-emerald-800",
  SENT: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-rose-100 text-rose-800",
  FAILED: "bg-rose-100 text-rose-800",
};

function formatKRW(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString("ko-KR")}원`;
}

export async function CaseFinancePanel({ caseId }: { caseId: string }) {
  const [payments, invoices] = await Promise.all([
    prisma.payment
      .findMany({
        where: { caseId },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      .catch(() => []),
    prisma.taxInvoice
      .findMany({
        where: { caseId },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      .catch(() => []),
  ]);

  const totalPaid = payments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((acc, p) => acc + p.amount, 0);
  const totalCanceled = payments
    .filter((p) => p.status === "CANCELED" || p.status === "PARTIAL_CANCELED")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <Card className="p-4 md:p-6">
      <p className="text-xs text-text-muted">Finance</p>
      <h3 className="text-sm font-semibold text-text-strong">결제 + 세금계산서</h3>

      {/* 요약 */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
        <div>
          <p className="text-xs text-text-muted">총 입금</p>
          <p className="mt-0.5 text-base font-semibold text-emerald-700 tabular-nums">
            {formatKRW(totalPaid)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">취소/환불</p>
          <p className="mt-0.5 text-base font-semibold text-rose-700 tabular-nums">
            {formatKRW(totalCanceled)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">발행 계산서</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums">
            {invoices.filter((i) => i.status === "ISSUED" || i.status === "SENT").length}
          </p>
        </div>
      </div>

      {/* 결제 이력 */}
      {payments.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-text-muted">결제 이력</p>
          <ul className="divide-y divide-line">
            {payments.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.orderName}</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-text-muted">
                    {p.orderId}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {new Date(p.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatKRW(p.amount)}
                  </p>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs ${PAY_BADGE[p.status] ?? ""}`}
                  >
                    {PAY_LABEL[p.status] ?? p.status}
                  </span>
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 세금계산서 */}
      {invoices.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-text-muted">세금계산서</p>
          <ul className="divide-y divide-line">
            {invoices.map((iv) => (
              <li key={iv.id} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{iv.itemName}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {iv.customerName}
                    {iv.customerBusinessNo && ` · ${iv.customerBusinessNo}`}
                  </p>
                  {iv.ntsConfirmNum && (
                    <p className="mt-0.5 font-mono text-xs text-text-muted">
                      NTS {iv.ntsConfirmNum}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatKRW(iv.totalAmount)}
                  </p>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs ${INVOICE_BADGE[iv.status] ?? ""}`}
                  >
                    {iv.status}
                  </span>
                  {iv.errorMessage && (
                    <p className="mt-1 max-w-[160px] truncate text-xs text-rose-700">
                      ⚠ {iv.errorMessage}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {payments.length === 0 && invoices.length === 0 && (
        <p className="mt-3 text-sm text-text-muted">
          이 사건의 결제/세금계산서 이력이 없습니다.
        </p>
      )}
    </Card>
  );
}
