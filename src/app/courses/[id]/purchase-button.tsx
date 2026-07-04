"use client";

import { useState } from "react";

interface Props {
  courseId: string;
  price: number;
  title: string;
}

export function PurchaseButton({ courseId, price, title }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function purchase() {
    if (!email) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/public/courses/${courseId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerEmail: email, buyerName: name }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error("failed");
      // Redirect to Toss checkout; server returns orderId
      window.location.href = `/portal/payments/checkout?orderId=${encodeURIComponent(
        json.orderId
      )}&amount=${price}&orderName=${encodeURIComponent(title)}`;
    } catch {
      setError("결제 세션 생성 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-panel">
      <h2 className="font-serif text-lg font-bold text-primary">결제하기</h2>
      <p className="mt-1 text-sm text-text-muted">
        결제 완료 후 등록하신 이메일로 시청 링크를 발송합니다.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-semibold">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">이메일 *</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={purchase}
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 font-bold text-white disabled:opacity-50"
        >
          {submitting ? "처리 중..." : `₩${price.toLocaleString()} 결제하기`}
        </button>
      </div>
    </div>
  );
}
