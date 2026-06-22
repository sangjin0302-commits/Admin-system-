import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FailPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    message?: string;
    orderId?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-rose-700">
        Payment Failed
      </p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary sm:text-3xl">
        결제 실패
      </h1>
      <div className="ethos-card mt-6 p-5">
        <p className="text-sm text-text-muted">사유</p>
        <p className="mt-1 text-base text-text-strong">
          {sp.message ?? "결제 처리 중 오류가 발생했습니다."}
        </p>
        {sp.code && (
          <p className="mt-2 font-mono text-xs text-text-muted">
            코드: {sp.code}
          </p>
        )}
        {sp.orderId && (
          <p className="mt-1 font-mono text-xs text-text-muted">
            주문번호: {sp.orderId}
          </p>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        {sp.orderId && (
          <Link
            href={`/portal/payments/checkout/${sp.orderId}`}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-center text-sm font-bold text-white"
          >
            다시 시도
          </Link>
        )}
        <Link
          href="/portal"
          className="flex-1 rounded-lg border border-line bg-white px-4 py-2 text-center text-sm"
        >
          포털 홈
        </Link>
      </div>
    </div>
  );
}
