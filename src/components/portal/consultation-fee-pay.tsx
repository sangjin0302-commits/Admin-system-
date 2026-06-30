"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const FEES = [
  { amount: 33000, label: "기본 상담 (33,000원)" },
  { amount: 55000, label: "심층 상담 (55,000원)" },
];

export function ConsultationFeePay({ caseId }: { caseId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePay(amount: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          orderName: amount === 33000 ? "기본 상담료" : "심층 상담료",
          caseId,
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        router.push(`/portal/payments/checkout/${data.orderId}`);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="font-serif text-sm font-bold text-primary">상담료 결제</p>
      <p className="text-xs text-text-muted">수임 확정 시 상담료는 전액 차감됩니다.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {FEES.map((fee) => (
          <button
            key={fee.amount}
            onClick={() => handlePay(fee.amount)}
            disabled={loading}
            className="rounded-xl border border-gold/30 bg-surface px-4 py-3 text-left transition hover:bg-gold-soft/30 disabled:opacity-50"
          >
            <p className="font-serif text-sm font-bold text-primary">{fee.label}</p>
            <p className="mt-1 text-xs text-text-muted">카드/계좌이체</p>
          </button>
        ))}
      </div>
    </div>
  );
}
