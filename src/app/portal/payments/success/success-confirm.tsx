"use client";

import { useEffect, useState } from "react";

interface Props {
  paymentKey: string;
  orderId: string;
  amount: number;
}

type State =
  | { kind: "pending" }
  | { kind: "ok"; transactionId?: string; receiptUrl?: string }
  | { kind: "fail"; error: string };

export function SuccessConfirm({ paymentKey, orderId, amount }: Props) {
  const [state, setState] = useState<State>({ kind: "pending" });

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setState({ kind: "fail", error: "필수 파라미터 누락" });
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/portal/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setState({ kind: "fail", error: data?.error ?? `승인 실패 (${res.status})` });
          return;
        }
        setState({
          kind: "ok",
          transactionId: data.transactionId,
          receiptUrl: data.receiptUrl,
        });
      } catch (e) {
        setState({ kind: "fail", error: e instanceof Error ? e.message : "네트워크 오류" });
      }
    })();
  }, [paymentKey, orderId, amount]);

  if (state.kind === "pending") {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-text-muted">
        Toss 승인 + 영수증 처리중입니다…
      </div>
    );
  }
  if (state.kind === "fail") {
    return (
      <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <p className="font-semibold">승인 실패</p>
        <p className="mt-1">{state.error}</p>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
      <p className="font-semibold">결제 승인 완료 ✓</p>
      <p className="mt-1 text-emerald-700">알림톡/이메일로도 확인 메시지가 발송됩니다.</p>
      {state.receiptUrl && (
        <a
          href={state.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white"
        >
          영수증 보기 →
        </a>
      )}
    </div>
  );
}
