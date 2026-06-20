"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IssueForm() {
  const router = useRouter();
  const [caseId, setCaseId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientBizNo, setClientBizNo] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [itemDescription, setItemDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/tax-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          clientName,
          clientBizNo,
          amount,
          itemDescription,
        }),
      });
      const data = await res.json();
      setResult(
        data?.invoice?.invoiceId
          ? `발행됨: ${data.invoice.invoiceId} (${data.invoice.status})`
          : JSON.stringify(data)
      );
      router.refresh();
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <input
        className="rounded border border-line px-3 py-2 text-sm"
        placeholder="사건 ID"
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
        required
      />
      <input
        className="rounded border border-line px-3 py-2 text-sm"
        placeholder="고객명"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        required
      />
      <input
        className="rounded border border-line px-3 py-2 text-sm"
        placeholder="사업자등록번호"
        value={clientBizNo}
        onChange={(e) => setClientBizNo(e.target.value)}
        required
      />
      <input
        className="rounded border border-line px-3 py-2 text-sm"
        type="number"
        placeholder="금액"
        value={amount || ""}
        onChange={(e) => setAmount(Number(e.target.value))}
        required
      />
      <textarea
        className="rounded border border-line px-3 py-2 text-sm"
        rows={2}
        placeholder="품목 설명"
        value={itemDescription}
        onChange={(e) => setItemDescription(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "발행 중..." : "발행하기"}
      </button>
      {result && (
        <p className="rounded bg-surface-muted p-2 text-xs">{result}</p>
      )}
    </form>
  );
}
