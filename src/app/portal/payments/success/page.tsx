import Link from "next/link";
import { SuccessConfirm } from "./success-confirm";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-emerald-700">
        Payment Success
      </p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary sm:text-3xl">
        결제 승인 처리중
      </h1>

      <SuccessConfirm
        paymentKey={sp.paymentKey ?? ""}
        orderId={sp.orderId ?? ""}
        amount={Number(sp.amount ?? 0)}
      />

      <div className="mt-6 text-center">
        <Link href="/portal" className="text-sm text-primary underline">
          포털 홈으로 →
        </Link>
      </div>
    </div>
  );
}
