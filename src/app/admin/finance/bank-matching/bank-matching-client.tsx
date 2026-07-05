"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { BankTransaction, BankCandidate, ImportResult } from "@/lib/services/bank-transaction-matcher";

export function BankMatchingClient({
  initialHistory,
  candidates,
}: {
  initialHistory: ImportResult[];
  candidates: BankCandidate[];
}) {
  const [history, setHistory] = useState<ImportResult[]>(initialHistory);
  const [preview, setPreview] = useState<BankTransaction[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [manualPicks, setManualPicks] = useState<Record<string, string>>({});

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const csv = await file.text();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/bank-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", csv, fileName: file.name, provider: "GENERIC" }),
      });
      const json = await res.json();
      if (json.ok) {
        setPreview(json.result.transactions as BankTransaction[]);
        setHistory([json.result as ImportResult, ...history]);
        setMessage(`파싱 완료 — ${json.result.matched}/${json.result.totalRows}건 자동 매칭`);
      } else {
        setMessage(json.error ?? "업로드 실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmMatch(tx: BankTransaction) {
    const caseId = tx.caseId ?? manualPicks[tx.txId];
    if (!caseId) { setMessage("사건을 선택해 주세요"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/bank-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", caseId, amount: tx.amount, memo: tx.memo, paidAt: tx.date }),
      });
      const json = await res.json();
      setMessage(json.ok ? "결제 확정 완료" : json.error ?? "실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">CSV 업로드</h3>
        <label className="mt-3 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-line px-6 py-8 text-sm text-text-muted hover:border-primary">
          <span className="mb-1">📄 은행 거래내역 CSV를 선택하거나 드래그</span>
          <span className="text-xs">헤더에 날짜/금액/적요 컬럼이 있어야 합니다</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} disabled={busy} />
        </label>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>

      {preview.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-text-strong">미리보기 · 매칭 결과</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 text-left">일자</th>
                  <th className="text-left">금액</th>
                  <th className="text-left">적요</th>
                  <th className="text-left">매칭</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {preview.map((tx) => {
                  const matchedCase = tx.caseId ? candidates.find((c) => c.caseId === tx.caseId) : null;
                  return (
                    <tr key={tx.txId} className="border-b border-line">
                      <td className="py-2">{new Date(tx.date).toLocaleDateString("ko-KR")}</td>
                      <td>{tx.amount.toLocaleString()}원</td>
                      <td className="max-w-xs truncate">{tx.memo}</td>
                      <td>
                        {matchedCase ? (
                          <span className="text-success">
                            {matchedCase.caseNo ?? matchedCase.title} ({tx.matchScore})
                          </span>
                        ) : (
                          <select
                            value={manualPicks[tx.txId] ?? ""}
                            onChange={(e) => setManualPicks({ ...manualPicks, [tx.txId]: e.target.value })}
                            className="rounded border border-line px-2 py-1 text-xs"
                          >
                            <option value="">사건 선택</option>
                            {candidates.map((c) => (
                              <option key={c.caseId} value={c.caseId}>
                                {c.caseNo ?? c.title} · {c.clientName ?? "-"}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => confirmMatch(tx)}
                          className="rounded bg-success px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          disabled={busy}
                        >
                          확정
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">최근 업로드 이력</h3>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {history.map((h, i) => (
              <li key={`${h.importedAt}-${i}`} className="py-2 text-sm">
                <div className="font-medium">{h.fileName ?? "(파일명 없음)"} · {h.provider}</div>
                <div className="text-xs text-text-muted">
                  {new Date(h.importedAt).toLocaleString("ko-KR")} · 매칭 {h.matched}/{h.totalRows}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
