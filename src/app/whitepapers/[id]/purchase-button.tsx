"use client";

import { useState } from "react";

export function PurchaseButton({ whitepaperId, price }: { whitepaperId: string; price: number }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function purchase() {
    setBusy(true); setErr("");
    try {
      // In real flow: initiate Toss payment first, then POST tossPaymentKey below.
      const res = await fetch("/api/whitepapers/purchase", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whitepaperId, buyerEmail: email }),
      });
      const json = (await res.json()) as { ok: boolean; downloadUrl?: string; error?: string };
      if (json.ok && json.downloadUrl) setDownloadUrl(json.downloadUrl);
      else setErr(json.error ?? "결제 실패");
    } finally { setBusy(false); }
  }

  if (downloadUrl) {
    return (
      <div className="mt-4">
        <p className="text-sm text-primary">결제 완료 — 24시간 내 다운로드 가능합니다.</p>
        <a href={downloadUrl} className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">PDF 다운로드</a>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <input type="email" placeholder="이메일 (다운로드 링크 발송)" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg border border-line px-3 py-2 text-sm" />
      <button type="button" onClick={purchase} disabled={busy || !email} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        ₩{price.toLocaleString()} 결제
      </button>
      {err && <p className="w-full text-sm text-red-600">{err}</p>}
    </div>
  );
}
