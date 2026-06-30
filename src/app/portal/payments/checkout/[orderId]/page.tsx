import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { CheckoutWidget } from "./checkout-widget";
import { BankTransferGuide } from "@/components/portal/bank-transfer-guide";
import { ConsultationFeePay } from "@/components/portal/consultation-fee-pay";
import { getSiteSettings } from "@/lib/services/site-settings";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const payment = await prisma.payment
    .findUnique({ where: { orderId } })
    .catch(() => null);

  if (!payment) {
    notFound();
  }

  // Toss 결제 활성 여부 (env flag) — 기본 OFF
  const tossEnabled = process.env.NEXT_PUBLIC_TOSS_ENABLED === "1";
  const clientKey =
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() ||
    "test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

  const site = await getSiteSettings();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">
        Payment
      </p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary sm:text-3xl">
        결제 진행
      </h1>
      <div className="ethos-card mt-6 p-5">
        <p className="text-sm text-text-muted">주문번호</p>
        <p className="mt-0.5 font-mono text-xs">{payment.orderId}</p>
        <p className="mt-3 text-sm text-text-muted">상품명</p>
        <p className="mt-0.5 text-base font-semibold">{payment.orderName}</p>
        <p className="mt-3 text-sm text-text-muted">금액</p>
        <p className="mt-0.5 text-2xl font-semibold tabular-nums text-primary">
          {payment.amount.toLocaleString("ko-KR")}원
        </p>
      </div>

      {payment.status === "CONFIRMED" ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          이미 결제가 완료된 주문입니다.
        </div>
      ) : payment.status === "CANCELED" || payment.status === "FAILED" ? (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          취소되거나 실패한 주문입니다. 새 주문을 만들어주세요.
        </div>
      ) : (
        <>
          {/* Toss 온라인 결제 위젯 */}
          {tossEnabled && (
            <CheckoutWidget
              clientKey={clientKey}
              orderId={payment.orderId}
              orderName={payment.orderName}
              amount={payment.amount}
              customerName={payment.customerName ?? "고객"}
              customerEmail={payment.customerEmail ?? "customer@example.com"}
            />
          )}

          {/* 무통장 입금 안내 (Toss 비활성 시 기본, 활성 시 폴백) */}
          <div className={tossEnabled ? "mt-6" : ""}>
            <BankTransferGuide
              orderId={payment.orderId}
              orderName={payment.orderName}
              amount={payment.amount}
              customerName={payment.customerName ?? "고객"}
              bankName={site["payment.bankName"] ?? ""}
              accountNumber={site["payment.accountNumber"] ?? ""}
              accountHolder={site["payment.accountHolder"] ?? ""}
            />
          </div>

          {/* 상담료 간편 결제 */}
          <div className="ethos-card mt-6 p-5">
            <ConsultationFeePay caseId={payment.caseId ?? undefined} />
          </div>
        </>
      )}
    </div>
  );
}
