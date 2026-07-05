"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { TaxInvoice, HometaxConfig } from "@/lib/services/hometax-integration-service";

export function HometaxClient({
  initialConfig,
  initialInvoices,
}: {
  initialConfig: HometaxConfig;
  initialInvoices: TaxInvoice[];
}) {
  const [config, setConfig] = useState<HometaxConfig>(initialConfig);
  const [invoices, setInvoices] = useState<TaxInvoice[]>(initialInvoices);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [buyerBizNo, setBuyerBizNo] = useState("");
  const [amount, setAmount] = useState("");
  const [itemName, setItemName] = useState("");

  async function saveConfig() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/hometax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "config", ...config }),
      });
      const json = await res.json();
      setMessage(json.ok ? "저장되었습니다" : json.error ?? "실패");
    } finally {
      setBusy(false);
    }
  }

  async function queue() {
    if (!buyerBizNo || !amount || !itemName) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/hometax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "queue",
          buyerBizNo,
          amount: Number(amount),
          itemName,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setInvoices([json.invoice as TaxInvoice, ...invoices]);
        setBuyerBizNo(""); setAmount(""); setItemName("");
        setMessage("발행 대기 큐에 추가됨");
      } else {
        setMessage(json.error ?? "실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function issue(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/hometax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", invoiceId: id }),
      });
      const json = await res.json();
      if (json.ok) {
        setInvoices((prev) => prev.map((v) => (v.id === id ? json.invoice as TaxInvoice : v)));
        setMessage(json.dryRun ? "dry-run 발행 완료" : "발행 완료");
      } else {
        setMessage(json.error ?? "실패");
      }
    } finally {
      setBusy(false);
    }
  }

  const pending = invoices.filter((v) => v.status === "PENDING");

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">발행자 설정</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            placeholder="사업자등록번호"
            value={config.bizNo ?? ""}
            onChange={(e) => setConfig({ ...config, bizNo: e.target.value })}
          />
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            placeholder="상호"
            value={config.companyName ?? ""}
            onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
          />
        </div>
        <p className="mt-2 text-xs text-text-muted">
          공인인증서 파일은 서버 환경 변수 `HOMETAX_CERT_PATH`, `HOMETAX_CERT_PASSWORD`로 설정합니다.
        </p>
        <button
          onClick={saveConfig}
          disabled={busy}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          저장
        </button>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">세금계산서 대기 큐</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="구매자 사업자번호" value={buyerBizNo} onChange={(e) => setBuyerBizNo(e.target.value)} />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="금액" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="항목명" value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </div>
        <button onClick={queue} disabled={busy} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          대기 등록
        </button>

        {pending.length > 0 && (
          <ul className="mt-4 space-y-2">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                <span>{inv.itemName} · {inv.amount.toLocaleString()}원 · {inv.buyerBizNo}</span>
                <button
                  onClick={() => issue(inv.id)}
                  disabled={busy}
                  className="rounded bg-success px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  발행 실행
                </button>
              </li>
            ))}
          </ul>
        )}
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>
    </>
  );
}
