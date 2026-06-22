"use client";

import { useState } from "react";

export function CancelPaymentButton({
  paymentKey,
  maxAmount,
}: {
  paymentKey: string;
  maxAmount: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!reason.trim()) {
      setError("취소 사유는 필수입니다.");
      return;
    }
    const cancelAmount = amount ? Number(amount) : undefined;
    if (cancelAmount && (Number.isNaN(cancelAmount) || cancelAmount > maxAmount)) {
      setError("취소 금액이 잘못되었습니다.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/payments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey,
          reason: reason.trim(),
          ...(cancelAmount ? { cancelAmount } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "취소 실패");
        return;
      }
      setOpen(false);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
        onClick={() => setOpen(true)}
      >
        취소
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-rose-200 bg-rose-50/50 p-3 text-xs">
      <p className="mb-2 font-medium text-rose-800">결제 취소</p>
      <label className="mb-1 block text-text-muted">취소 사유</label>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mb-2 w-full rounded border border-line bg-white px-2 py-1"
        placeholder="예: 고객 요청 환불"
      />
      <label className="mb-1 block text-text-muted">
        취소 금액 (비우면 전액, 최대 {maxAmount.toLocaleString("ko-KR")}원)
      </label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        max={maxAmount}
        className="mb-2 w-full rounded border border-line bg-white px-2 py-1"
        placeholder="전액 취소 시 비워두세요"
      />
      {error && <p className="mb-2 text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="rounded bg-rose-600 px-3 py-1 text-white disabled:opacity-50"
        >
          {busy ? "처리중…" : "취소 실행"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
          className="rounded border border-line px-3 py-1"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
