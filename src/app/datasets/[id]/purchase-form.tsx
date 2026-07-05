"use client";

import { useState } from "react";

export function PurchaseForm({ datasetId, amount }: { datasetId: string; amount: number }) {
  const [state, setState] = useState<{ ok?: boolean; orderId?: string; error?: string; busy: boolean }>({ busy: false });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ busy: true });
    const res = await fetch("/api/datasets/purchase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        datasetId,
        buyerEmail: fd.get("buyerEmail"),
        buyerOrg: fd.get("buyerOrg"),
        amount,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j?.ok) setState({ ok: true, orderId: j.orderId, busy: false });
    else setState({ error: j?.error ?? "FAILED", busy: false });
  }

  if (state.ok) {
    return (
      <div className="rounded border border-primary bg-primary/5 p-4">
        <p className="font-bold text-primary">주문 접수 (주문번호 {state.orderId})</p>
        <p className="mt-1 text-sm">결제 안내 이메일이 발송됩니다. 결제 확인 후 데이터셋 다운로드 링크를 전달드립니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded border border-line bg-surface p-4">
      <div>
        <label className="text-sm font-semibold">구매자 이메일 *</label>
        <input name="buyerEmail" type="email" required className="mt-1 w-full rounded border border-line px-3 py-2" />
      </div>
      <div>
        <label className="text-sm font-semibold">소속 기관</label>
        <input name="buyerOrg" className="mt-1 w-full rounded border border-line px-3 py-2" />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={state.busy} className="w-full rounded bg-primary py-2.5 font-bold text-white disabled:opacity-50">
        {state.busy ? "처리 중..." : `₩${amount.toLocaleString()} 결제 진행`}
      </button>
    </form>
  );
}
